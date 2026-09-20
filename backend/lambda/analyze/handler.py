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


@app.post("/api/items/analyze")
def analyze(req: AnalyzeRequest):
    request_id = str(uuid.uuid4())
    logger.info("[%s] analyze request: %s", request_id, req.image_s3_uri)

    _audit(request_id, req.user_id or "anonymous", "analyze_requested", {
        "image_s3_uri": req.image_s3_uri,
        "has_description": bool(req.user_description),
    })

    # ── Lazy import agent to avoid cold-start if Bedrock unavailable ──
    try:
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

        result = recommendation.model_dump()
        result["request_id"] = request_id

        _audit(request_id, "agent", "analyze_completed", {"path": result["recommended_path"]})
        return result

    except json.JSONDecodeError as exc:
        logger.error("[%s] Agent returned invalid JSON: %s", request_id, exc)
        raise HTTPException(status_code=502, detail={"error": "agent_invalid_output", "request_id": request_id})
    except Exception as exc:
        logger.exception("[%s] Analyze failed: %s", request_id, exc)
        _audit(request_id, "system", "analyze_error", {"error": str(exc)[:200]})
        raise HTTPException(
            status_code=502,
            detail={
                "error": "vision_ai_unavailable",
                "message": str(exc),
                "request_id": request_id,
            },
        )


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
