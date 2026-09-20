"""
CampusCycle AI — /api/dashboard Lambda handler.
Aggregate metrics for admin and student impact displays.
"""
from __future__ import annotations

import logging
import os

import boto3
from boto3.dynamodb.conditions import Attr
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Dashboard")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

ITEMS_TABLE = os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items")
IMPACT_TABLE = os.getenv("DYNAMO_IMPACT_TABLE", "CampusCycle_ImpactEvents")
TASKS_TABLE = os.getenv("DYNAMO_TASKS_TABLE", "CampusCycle_Tasks")
AUDIT_TABLE = os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents")


@app.get("/api/dashboard")
def get_dashboard(campus_id: str = "campus-default"):
    items_table = dynamodb.Table(ITEMS_TABLE)
    impact_table = dynamodb.Table(IMPACT_TABLE)
    tasks_table = dynamodb.Table(TASKS_TABLE)

    items_resp = items_table.scan()
    all_items = items_resp.get("Items", [])

    impact_resp = impact_table.scan()
    all_impact = impact_resp.get("Items", [])

    tasks_resp = tasks_table.scan(FilterExpression=Attr("status").eq("pending"))
    pending_tasks = tasks_resp.get("Items", [])

    diverted = [e for e in all_impact if e.get("diverted_from_disposal")]
    recycled = [e for e in all_impact if e.get("decision") == "recycle"]
    review_items = [i for i in all_items if i.get("status") == "manual_review"]

    return {
        "campus_id": campus_id,
        "metrics": {
            "total_items_submitted": len(all_items),
            "items_diverted_from_disposal": len(diverted),
            "items_recycled": len(recycled),
            "pending_recycle_tasks": len(pending_tasks),
            "items_in_manual_review": len(review_items),
        },
        "recent_impact": [
            {
                "impact_id": e["impact_id"],
                "decision": e["decision"],
                "category": e["category"],
                "diverted": e.get("diverted_from_disposal", False),
                "created_at": e["created_at"],
            }
            for e in sorted(all_impact, key=lambda x: x["created_at"], reverse=True)[:10]
        ],
    }


handler = Mangum(app, lifespan="off")
