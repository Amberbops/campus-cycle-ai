"""
CampusCycle AI — /api/items/analyze Lambda handler.
Accepts image upload metadata + user context, invokes the Strands agent,
and returns a structured recommendation.
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Analyze")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "campuscycle-items-dev")
AUDIT_TABLE = os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents")

s3 = boto3.client("s3", region_name=AWS_REGION)
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


class AnalyzeRequest(BaseModel):
    image_s3_uri: str          # Pre-signed upload or existing S3 URI
    user_description: Optional[str] = None
    hostel: Optional[str] = None
    block: Optional[str] = None
    campus_id: Optional[str] = "campus-default"
    user_id: Optional[str] = "anonymous"


def _audit(request_id: str, actor: str, event_type: str, payload: dict):
    try:
        table = dynamodb.Table(AUDIT_TABLE)
        table.put_item(Item={
            "event_id": str(uuid.uuid4()),
            "request_id": request_id,
            "actor": actor,
            "event_type": event_type,
            "payload_summary": json.dumps(payload)[:500],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as exc:
        logger.warning("Audit write failed (non-fatal): %s", exc)


def _format_frontend_response(rec_dict: dict, request_id: str, image_url: str = ""):
    cond = rec_dict.get("condition", "usable")
    cond_map = {
        "new-like": "excellent",
        "usable": "good",
        "repairable-looking": "fair",
        "damaged": "poor",
        "unknown": "unknown",
    }
    frontend_cond = cond_map.get(cond, "good")
    if "hazard" in str(rec_dict.get("safety_flags", "")).lower():
        frontend_cond = "hazardous"

    rec_path = rec_dict.get("recommended_path", "reuse")
    rec_map = {
        "reuse": "REUSE",
        "repair": "REPAIR",
        "donate": "REUSE",
        "recycle": "RECYCLE",
        "manual_review": "MANUAL_REVIEW",
    }
    recommendation = rec_map.get(rec_path, "REUSE")

    item_name = rec_dict.get("item_name", "Campus Item")
    category = str(rec_dict.get("category", "misc")).lower()
    confidence = float(rec_dict.get("confidence", 0.9))
    safety_flags = rec_dict.get("safety_flags", [])

    action_sum = rec_dict.get("action_summary")
    reason = rec_dict.get("reason", "")
    description = action_sum if action_sum else reason

    safety_note = None
    if safety_flags:
        safety_note = f"Safety notice: {', '.join(safety_flags).replace('_', ' ')}. Please inspect before handling."

    tags = [
        category.title(),
        cond.replace("-", " ").title(),
        recommendation.title(),
    ]

    # Map match_ids to MatchItem format
    match_ids = rec_dict.get("match_ids", [])
    matches = []
    for idx, mid in enumerate(match_ids):
        matches.append({
            "id": mid,
            "requestedBy": f"Student ({mid[:6]})" if not mid.startswith("demo") else "Hostel Peer",
            "location": "Hostel Block B",
            "avatar": "HP",
            "itemRequested": item_name,
            "urgency": "medium" if idx > 0 else "high",
            "postedAt": "1 hour ago",
            "compatibilityScore": max(60, int(confidence * 100) - (idx * 5)),
        })

    return {
        # Person B Frontend Contract (AnalysisResult)
        "id": request_id,
        "itemName": item_name,
        "condition": frontend_cond,
        "recommendation": recommendation,
        "confidence": confidence,
        "description": description,
        "safetyNote": safety_note,
        "tags": tags,
        "matches": matches,
        "imageUrl": image_url,
        # Person A Backend Contract
        "item_name": item_name,
        "category": category,
        "recommended_path": rec_path,
        "action_summary": action_sum,
        "reason": reason,
        "next_action": rec_dict.get("next_action", "list"),
        "safety_flags": safety_flags,
        "match_ids": match_ids,
        "request_id": request_id,
    }


@app.post("/analyze")
async def analyze_direct(
    image: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None),
    hostel: Optional[str] = Form(None),
):
    """Direct multipart image upload matching frontend src/lib/api.ts."""
    request_id = f"scan-{uuid.uuid4().hex[:8]}"
    s3_uri = ""
    image_url = ""

    local_img_path = None
    if image and image.filename:
        content = await image.read()
        # Cache local copy so vision models always have direct access to image bytes
        uploads_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        local_img_path = uploads_dir / f"{uuid.uuid4().hex}_{image.filename}"
        with open(local_img_path, "wb") as f:
            f.write(content)

        key = f"uploads/{uuid.uuid4()}/{image.filename}"
        try:
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=key,
                Body=content,
                ContentType=image.content_type or "image/jpeg",
            )
            s3_uri = f"s3://{S3_BUCKET}/{key}"
            image_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        except Exception as upload_err:
            logger.warning("Could not upload direct image to S3: %s", upload_err)
            s3_uri = str(local_img_path)
            image_url = f"file://{local_img_path}"

    target_uri = s3_uri or (str(local_img_path) if local_img_path else "s3://campuscycle-items-dev/uploads/direct_upload.jpg")

    try:
        from backend.agent import run_triage
    except ImportError:
        from agent import run_triage

    rec = run_triage(
        image_s3_uri=target_uri,
        user_description=description or (image.filename.rsplit(".", 1)[0].replace("_", " ") if image else ""),
        location={"hostel": hostel or "Block B", "campus_id": "campus-default"},
    )

    rec_dict = rec.model_dump()
    _audit(request_id, "frontend_direct", "analyze_completed", {"path": rec_dict.get("recommended_path")})
    return _format_frontend_response(rec_dict, request_id, image_url)


@app.post("/api/items/analyze")
def analyze(req: AnalyzeRequest):
    request_id = str(uuid.uuid4())
    logger.info("[%s] analyze request: %s", request_id, req.image_s3_uri)

    _audit(request_id, req.user_id or "anonymous", "analyze_requested", {
        "image_s3_uri": req.image_s3_uri,
        "has_description": bool(req.user_description),
    })

    try:
        from backend.agent import run_triage
    except ImportError:
        from agent import run_triage

    location = {
        "hostel": req.hostel,
        "block": req.block,
        "campus_id": req.campus_id,
    }

    recommendation = run_triage(
        image_s3_uri=req.image_s3_uri,
        user_description=req.user_description or "",
        location=location,
    )

    rec_dict = recommendation.model_dump()
    _audit(request_id, "agent", "analyze_completed", {"path": rec_dict["recommended_path"]})
    return _format_frontend_response(rec_dict, request_id)


@app.post("/api/items/upload-url")
def get_upload_url(filename: str, content_type: str = "image/jpeg"):
    """Return a pre-signed S3 upload URL so the browser uploads directly."""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    key = f"uploads/{uuid.uuid4()}/{filename}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=300,
    )
    return {"upload_url": url, "s3_uri": f"s3://{S3_BUCKET}/{key}", "key": key}


lambda_handler = Mangum(app, lifespan="off")
