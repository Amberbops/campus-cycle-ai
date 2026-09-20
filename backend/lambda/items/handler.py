"""
CampusCycle AI — /api/items Lambda handler.
Manages item listings, recycle tasks, impact recording, and retrieval.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List

import boto3
from boto3.dynamodb.conditions import Attr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Items & Tasks")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ITEMS_TABLE = os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items")
TASKS_TABLE = os.getenv("DYNAMO_TASKS_TABLE", "CampusCycle_Tasks")
IMPACT_TABLE = os.getenv("DYNAMO_IMPACT_TABLE", "CampusCycle_ImpactEvents")
AUDIT_TABLE = os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


def _record_audit(request_id: str, actor: str, event_type: str, payload_summary: str):
    try:
        table = dynamodb.Table(AUDIT_TABLE)
        table.put_item(
            Item={
                "event_id": str(uuid.uuid4()),
                "request_id": request_id,
                "actor": actor,
                "event_type": event_type,
                "payload_summary": payload_summary[:500],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception as exc:
        logger.warning("Audit record failed: %s", exc)


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateListingRequest(BaseModel):
    item_name: str
    category: str
    condition: str
    image_s3_uri: str
    owner_id: str = "anonymous_student"
    hostel: str
    block: Optional[str] = None
    chosen_path: str = "reuse"
    recommendation_request_id: Optional[str] = None


class CreateRecycleTaskRequest(BaseModel):
    item_name: str
    item_id: Optional[str] = None
    location: str
    reason: str
    category: str = "electronics"
    created_by: str = "student"


class RecordImpactRequest(BaseModel):
    item_id: str
    decision: str
    category: str
    estimated_weight_kg: float = 1.0


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/api/items")
def create_listing(req: CreateListingRequest):
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    table = dynamodb.Table(ITEMS_TABLE)
    table.put_item(
        Item={
            "item_id": item_id,
            "item_name": req.item_name,
            "category": req.category,
            "condition": req.condition,
            "image_uri": req.image_s3_uri,
            "owner_id": req.owner_id,
            "hostel": req.hostel,
            "block": req.block,
            "status": "available",
            "chosen_path": req.chosen_path,
            "recommendation_request_id": req.recommendation_request_id,
            "created_at": now,
        }
    )

    # Automatically record diversion impact event (FR-10)
    try:
        impact_table = dynamodb.Table(IMPACT_TABLE)
        impact_table.put_item(
            Item={
                "impact_id": str(uuid.uuid4()),
                "item_id": item_id,
                "decision": req.chosen_path,
                "category": req.category,
                "diverted_from_disposal": True,
                "estimated_weight_kg": "1.0",
                "is_estimate": True,
                "created_at": now,
            }
        )
    except Exception as exc:
        logger.warning("Failed to auto-record impact on listing: %s", exc)

    _record_audit(item_id, req.owner_id, "listing_created", f"Created listing for {req.item_name}")

    return {"item_id": item_id, "status": "created", "chosen_path": req.chosen_path}


@app.get("/api/items")
def list_items(category: Optional[str] = None, status: str = "available", limit: int = 20):
    table = dynamodb.Table(ITEMS_TABLE)
    filter_expr = Attr("status").eq(status)
    if category:
        filter_expr = filter_expr & Attr("category").eq(category)

    resp = table.scan(FilterExpression=filter_expr, Limit=limit)
    items = resp.get("Items", [])
    return {"items": items, "count": len(items)}


@app.get("/api/items/{item_id}")
def get_item(item_id: str):
    table = dynamodb.Table(ITEMS_TABLE)
    resp = table.get_item(Key={"item_id": item_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.post("/api/tasks/recycle")
def create_recycle_task(req: CreateRecycleTaskRequest):
    task_id = str(uuid.uuid4())
    ref_item_id = req.item_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    table = dynamodb.Table(TASKS_TABLE)
    table.put_item(
        Item={
            "task_id": task_id,
            "item_id": ref_item_id,
            "item_name": req.item_name,
            "task_type": "recycle",
            "category": req.category,
            "location": req.location,
            "reason": req.reason,
            "status": "pending",
            "assigned_to": None,
            "created_at": now,
        }
    )

    # Record non-financial impact record (e-waste recycling diversion)
    try:
        impact_table = dynamodb.Table(IMPACT_TABLE)
        impact_table.put_item(
            Item={
                "impact_id": str(uuid.uuid4()),
                "item_id": ref_item_id,
                "decision": "recycle",
                "category": req.category,
                "diverted_from_disposal": False,
                "estimated_weight_kg": "1.5",
                "is_estimate": True,
                "created_at": now,
            }
        )
    except Exception as exc:
        logger.warning("Impact record note: %s", exc)

    _record_audit(task_id, req.created_by, "recycle_task_created", f"Recycle task for {req.item_name}")

    return {"task_id": task_id, "status": "created", "item_id": ref_item_id}


@app.post("/api/impact")
def record_impact(req: RecordImpactRequest):
    impact_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    diverted = req.decision.lower() in ("reuse", "repair", "donate")

    table = dynamodb.Table(IMPACT_TABLE)
    table.put_item(
        Item={
            "impact_id": impact_id,
            "item_id": req.item_id,
            "decision": req.decision,
            "category": req.category,
            "diverted_from_disposal": diverted,
            "estimated_weight_kg": str(req.estimated_weight_kg),
            "is_estimate": True,
            "created_at": now,
        }
    )
    return {"impact_id": impact_id, "diverted_from_disposal": diverted}


# ── Match Connection & AWS SES Email Dispatch ───────────────────────────────────

SES_REGION = os.getenv("SES_REGION", os.getenv("AWS_REGION", "us-east-1"))
MATCHES_TABLE = os.getenv("DYNAMO_MATCHES_TABLE", "CampusCycle_Matches")
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "notifications@campuscycle.edu")


class ConnectMatchRequest(BaseModel):
    match_id: Optional[str] = None
    item_id: Optional[str] = None
    item_name: str
    condition: Optional[str] = "usable"
    requester_alias: str
    requester_email: Optional[str] = "student@campus.edu"
    hostel_location: str = "Hostel 4 (Godavari)"
    donor_alias: Optional[str] = "Campus Scout Peer"
    message: Optional[str] = ""


@app.post("/api/matches/connect")
def connect_match(req: ConnectMatchRequest):
    match_id = req.match_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # 1. Record match in DynamoDB
    try:
        table = dynamodb.Table(MATCHES_TABLE)
        table.put_item(
            Item={
                "match_id": match_id,
                "item_name": req.item_name,
                "requester_alias": req.requester_alias,
                "requester_email": req.requester_email,
                "hostel_location": req.hostel_location,
                "donor_alias": req.donor_alias,
                "status": "paired",
                "connected_at": now,
            }
        )
    except Exception as exc:
        logger.warning("Could not write to DynamoDB Matches table: %s", exc)

    # 2. Dispatch Direct Notification Email via Amazon SES
    email_subject = f"♻️ CampusCycle Match: Peer matched your request for {req.item_name}!"
    email_body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 24px;">
          <h2 style="color: #2dd4bf; margin-top: 0;">CampusCycle AI · Match Connected</h2>
          <p>Hi <b>{req.requester_alias}</b>,</p>
          <p>Exciting news! A fellow student nearby has scanned an item matching your campus wishlist:</p>
          <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #475569;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff;">{req.item_name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Condition: <span style="color: #2dd4bf;">{req.condition}</span> · Location: {req.hostel_location}</p>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">Please coordinate handoff with your peer at <b>{req.hostel_location}</b>.</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">Powered by CampusCycle Circular AI · Automated AWS SES Notification</p>
        </div>
      </body>
    </html>
    """

    ses_dispatched = False
    ses_error = None
    try:
        ses_client = boto3.client("ses", region_name=SES_REGION)
        ses_resp = ses_client.send_email(
            Source=SES_SENDER_EMAIL,
            Destination={"ToAddresses": [req.requester_email]},
            Message={
                "Subject": {"Data": email_subject},
                "Body": {
                    "Html": {"Data": email_body_html},
                    "Text": {"Data": f"Hi {req.requester_alias}, a student in {req.hostel_location} has matched your request for {req.item_name}!"},
                },
            },
        )
        ses_dispatched = True
        logger.info("SES email dispatched: messageId=%s", ses_resp.get("MessageId"))
    except Exception as exc:
        ses_error = str(exc)
        logger.info("SES notice (sandbox/offline mode): %s", exc)

    _record_audit(match_id, req.donor_alias or "student", "peer_match_connected", f"Matched {req.item_name} with {req.requester_alias} ({req.requester_email})")

    return {
        "status": "paired",
        "match_id": match_id,
        "recipient_alias": req.requester_alias,
        "recipient_email": req.requester_email,
        "ses_dispatched": ses_dispatched,
        "ses_error": ses_error,
        "subject": email_subject,
        "preview": f"Hi {req.requester_alias}, a student in {req.hostel_location} has an item matching your wishlist!",
    }


handler = Mangum(app, lifespan="off")
lambda_handler = handler

