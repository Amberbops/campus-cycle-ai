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


handler = Mangum(app, lifespan="off")
lambda_handler = handler
