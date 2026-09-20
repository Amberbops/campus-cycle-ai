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

    # Determine recipient: if DEMO_STUDENT_EMAIL or SES_RECIPIENT_OVERRIDE is set, route live to that Gmail!
    target_email = req.requester_email or "student@campus.edu"
    override_email = os.getenv("DEMO_STUDENT_EMAIL") or os.getenv("SES_RECIPIENT_OVERRIDE")
    if override_email:
        target_email = override_email

    sender_email = os.getenv("SES_SENDER_EMAIL") or target_email

    # 1. Record match in DynamoDB
    try:
        table = dynamodb.Table(MATCHES_TABLE)
        table.put_item(
            Item={
                "match_id": match_id,
                "item_name": req.item_name,
                "requester_alias": req.requester_alias,
                "requester_email": target_email,
                "hostel_location": req.hostel_location,
                "donor_alias": req.donor_alias or "Campus Peer",
                "status": "paired",
                "connected_at": now,
            }
        )
    except Exception as exc:
        logger.warning("Could not write to DynamoDB Matches table: %s", exc)

    # 2. Dispatch High-Quality Responsive HTML Email via Amazon SES
    email_subject = f"♻️ CampusCycle Match: We found a match for your {req.item_name} request!"
    donor_alias = req.donor_alias or "Anonymous Peer"
    donor_contact = sender_email if "@" in sender_email else "peer@campuscycle.internal"

    email_body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusCycle Match Notification</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 580px; width: 100%; background: #111827; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0d2824 0%, #111827 100%); border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="background: #14b8a626; border: 1px solid #14b8a64d; color: #2dd4bf; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">
                      CampusCycle AI · Circular Scout
                    </span>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0; letter-spacing: -0.02em;">
                      🎉 Great news! Match found for your request
                    </h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                      A peer in your residence scanned an item matching your campus wishlist!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="font-size: 15px; color: #f1f5f9; margin-top: 0; line-height: 1.6;">
                Hi <b>{req.requester_alias}</b>,
              </p>
              <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
                A student has scanned an item through <b>CampusCycle AI</b> that matches your dorm wishlist. Here are the verified triage details:
              </p>

              <!-- Item Card -->
              <table role="presentation" width="100%" style="background: #0f172a; border-radius: 14px; border: 1px solid #334155; margin-bottom: 22px;" border="0" cellspacing="0" cellpadding="18">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Matched Item</span>
                          <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 4px 0 8px 0;">
                            {req.item_name}
                          </h2>
                        </td>
                        <td align="right" valign="top">
                          <span style="background: #22c55e20; border: 1px solid #22c55e40; color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                            {req.condition}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #1e293b; padding-top: 12px;">
                          <p style="margin: 0 0 6px 0; font-size: 13px; color: #cbd5e1;">
                            📍 <b>Location:</b> <span style="color: #2dd4bf; font-weight: 600;">{req.hostel_location}</span>
                          </p>
                          <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
                            🌱 <b>Impact:</b> <span style="color: #34d399; font-weight: 600;">~8.5 kg CO₂ diverted from landfill</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <a href="mailto:{donor_contact}?subject=Re:%20CampusCycle%20Handoff%20for%20{req.item_name}" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #022c22; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
                      Reply to Coordinate Handoff →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safety Notice -->
              <div style="background: #451a0333; border: 1px solid #b453094d; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
                  ⚡ <b>Safety Tip:</b> Please physically inspect cables and plugs before operating in dorm rooms. Never leave appliances plugged in unattended.
                </p>
              </div>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                Thanks for keeping campus items out of landfills and in circular motion!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #0b0f19; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                CampusCycle AI · Team DrogonTech
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                Automated Transactional Notification via Amazon SES (Simple Email Service) · AWS Serverless Architecture ({SES_REGION})
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    ses_dispatched = False
    ses_error = None
    ses_message_id = None
    try:
        ses_client = boto3.client("ses", region_name=SES_REGION)
        ses_resp = ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [target_email]},
            Message={
                "Subject": {"Data": email_subject},
                "Body": {
                    "Html": {"Data": email_body_html},
                    "Text": {
                        "Data": f"Hi {req.requester_alias},\n\nA student in {req.hostel_location} has matched your request for {req.item_name}!\nPlease coordinate dorm pickup.\n\n— CampusCycle AI"
                    },
                },
            },
        )
        ses_dispatched = True
        ses_message_id = ses_resp.get("MessageId")
        logger.info("SES email dispatched successfully: MessageId=%s to=%s", ses_message_id, target_email)
    except Exception as exc:
        ses_error = str(exc)
        logger.warning("SES dispatch note: %s", exc)

    _record_audit(
        match_id,
        req.donor_alias or "student",
        "peer_match_connected",
        f"Matched {req.item_name} with {req.requester_alias} ({target_email}) - SES: {ses_dispatched}",
    )

    return {
        "status": "paired",
        "match_id": match_id,
        "recipient_alias": req.requester_alias,
        "recipient_email": target_email,
        "ses_dispatched": ses_dispatched,
        "ses_message_id": ses_message_id,
        "ses_error": ses_error,
        "subject": email_subject,
        "preview": f"Hi {req.requester_alias}, a student in {req.hostel_location} has an item matching your wishlist!",
    }


handler = Mangum(app, lifespan="off")
lambda_handler = handler


