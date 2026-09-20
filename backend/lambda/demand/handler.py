"""
CampusCycle AI — /api/demand Lambda handler.
Manage campus demand requests (what students need).
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import boto3
from boto3.dynamodb.conditions import Attr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Demand")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DEMAND_TABLE = os.getenv("DYNAMO_DEMAND_TABLE", "CampusCycle_DemandRequests")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


class CreateDemandRequest(BaseModel):
    requester_id: str
    requester_alias: str
    category: str
    keywords: List[str]
    hostel: str
    block: Optional[str] = None
    campus_id: str = "campus-default"
    urgency: Optional[str] = "medium"


@app.get("/api/demand")
def search_demand(category: str = "", hostel: str = "", limit: int = 50):
    table = dynamodb.Table(DEMAND_TABLE)
    filter_expr = Attr("active").eq(True)
    if category and category.lower() != "all":
        filter_expr = filter_expr & Attr("category").eq(category.lower())
    if hostel and hostel.lower() != "all hostels" and hostel.lower() != "all":
        filter_expr = filter_expr & Attr("hostel").contains(hostel)
    resp = table.scan(FilterExpression=filter_expr)
    items = resp.get("Items", [])
    # Sort newest first
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    items = items[:limit]
    return {"results": items, "count": len(items)}


@app.post("/api/demand")
def create_demand(req: CreateDemandRequest):
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    table = dynamodb.Table(DEMAND_TABLE)
    table.put_item(Item={
        "request_id": request_id,
        "requester_id": req.requester_id,
        "requester_alias": req.requester_alias,
        "category": req.category,
        "keywords": req.keywords,
        "hostel": req.hostel,
        "block": req.block or "",
        "campus_id": req.campus_id,
        "urgency": req.urgency or "medium",
        "active": True,
        "created_at": now,
    })
    return {"request_id": request_id, "status": "created"}


handler = Mangum(app, lifespan="off")
