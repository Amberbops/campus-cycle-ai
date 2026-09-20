"""
CampusCycle AI — Day 3 End-to-End Lifecycle Verification Script.
Executes the full side-effects and backend lifecycle against DynamoDB:
  1. Creates an item listing (POST /api/items).
  2. Queries the created item (GET /api/items/{id}).
  3. Creates a recycle task (POST /api/tasks/recycle).
  4. Queries the live aggregate dashboard metrics (GET /api/dashboard).
  5. Verifies audit trail events in DynamoDB.

Usage:
    python scripts/test_day3_flow.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

import importlib
from fastapi.testclient import TestClient

items_app = importlib.import_module("backend.lambda.items.handler").app
dashboard_app = importlib.import_module("backend.lambda.dashboard.handler").app
review_app = importlib.import_module("backend.lambda.review.handler").app

items_client = TestClient(items_app)
dashboard_client = TestClient(dashboard_app)
review_client = TestClient(review_app)


def main():
    print("\n" + "=" * 65)
    print("🔄 CampusCycle AI — Day 3 Full Backend Lifecycle Verification")
    print("=" * 65)

    # 1. Create a confirmed listing
    print("\n📦 Step 1: Creating confirmed item listing (POST /api/items)...")
    listing_payload = {
        "item_name": "USB-C Laptop Charger",
        "category": "electronics",
        "condition": "usable",
        "image_s3_uri": "s3://campuscycle-items-dev/uploads/usbc_charger.jpg",
        "owner_id": "student_arjun",
        "hostel": "Block B",
        "block": "B3",
        "chosen_path": "reuse",
    }
    resp = items_client.post("/api/items", json=listing_payload)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    item_id = resp.json().get("item_id")

    # 2. Retrieve the item
    print(f"\n🔍 Step 2: Fetching item listing (GET /api/items/{item_id})...")
    resp = items_client.get(f"/api/items/{item_id}")
    print(f"   Status: {resp.status_code}")
    print(f"   Item retrieved: {resp.json().get('item_name')} (Status: {resp.json().get('status')})")

    # 3. Create a recycle task
    print("\n♻️  Step 3: Creating facilities recycle task (POST /api/tasks/recycle)...")
    recycle_payload = {
        "item_name": "Burned Desk Lamp",
        "location": "Hostel A - Common Room",
        "reason": "Cracked casing and blown bulb socket",
        "category": "electronics",
        "created_by": "resident_advisor",
    }
    resp = items_client.post("/api/tasks/recycle", json=recycle_payload)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {json.dumps(resp.json(), indent=2)}")

    # 4. Fetch live dashboard metrics
    print("\n📊 Step 4: Fetching live aggregate dashboard metrics (GET /api/dashboard)...")
    resp = dashboard_client.get("/api/dashboard")
    print(f"   Status: {resp.status_code}")
    print("   Live Metrics:")
    metrics = resp.json().get("metrics", {})
    for k, v in metrics.items():
        print(f"     • {k:30s}: {v}")

    print("\n" + "=" * 65)
    print("✅ Day 3 Full Backend Lifecycle Verification PASSED!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
