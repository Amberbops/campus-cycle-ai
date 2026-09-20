"""
CampusCycle AI — /api/review Lambda handler.
Moderator-facing endpoint to resolve flagged / manual-review items.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Review")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ITEMS_TABLE = os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items")
AUDIT_TABLE = os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


class ResolveReviewRequest(BaseModel):
    decision: str            # approved | rejected | escalated
    moderator_id: str
    moderator_note: Optional[str] = None


@app.post("/api/review/{item_id}")
def resolve_review(item_id: str, req: ResolveReviewRequest):
    items_table = dynamodb.Table(ITEMS_TABLE)
    resp = items_table.get_item(Key={"item_id": item_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    new_status = {"approved": "available", "rejected": "removed", "escalated": "escalated"}.get(
        req.decision, "manual_review"
    )

    items_table.update_item(
        Key={"item_id": item_id},
        UpdateExpression="SET #s = :s, moderator_note = :n, resolved_at = :r",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": new_status,
            ":n": req.moderator_note or "",
            ":r": datetime.now(timezone.utc).isoformat(),
        },
    )

    # Audit event
    audit_table = dynamodb.Table(AUDIT_TABLE)
    audit_table.put_item(Item={
        "event_id": str(uuid.uuid4()),
        "request_id": item_id,
        "actor": req.moderator_id,
        "event_type": f"review_{req.decision}",
        "payload_summary": req.moderator_note or "",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

@app.get("/api/review")
def list_review_items():
    """Retrieve all items flagged for manual moderator review."""
    items_table = dynamodb.Table(ITEMS_TABLE)
    resp = items_table.scan(FilterExpression=boto3.dynamodb.conditions.Attr("status").eq("manual_review"))
    items = resp.get("Items", [])
    return {"items": items, "count": len(items)}


handler = Mangum(app, lifespan="off")
lambda_handler = handler
