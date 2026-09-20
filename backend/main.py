"""
CampusCycle AI — Unified Local Development API Gateway.
Mounts all Lambda handlers onto a single FastAPI instance for local testing
and Person B frontend integration.

Run with:
    cd backend
    uvicorn main:app --reload --port 8000
    Open: http://localhost:8000/docs
"""
from __future__ import annotations

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import importlib
import sys

backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

health_app = importlib.import_module("lambda.health.handler").app
analyze_app = importlib.import_module("lambda.analyze.handler").app
items_app = importlib.import_module("lambda.items.handler").app
demand_app = importlib.import_module("lambda.demand.handler").app
dashboard_app = importlib.import_module("lambda.dashboard.handler").app
review_app = importlib.import_module("lambda.review.handler").app

app = FastAPI(
    title="CampusCycle AI — Full Unified API",
    description="Campus waste-to-reuse scout AI API (Health, Triage Analysis, Demand, Items, Dashboard)",
    version="1.0.0-day2",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers so OpenAPI and Swagger UI document every endpoint
app.include_router(health_app.router)
app.include_router(analyze_app.router)
app.include_router(items_app.router)
app.include_router(demand_app.router)
app.include_router(dashboard_app.router)
app.include_router(review_app.router)
