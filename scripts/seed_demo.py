"""
CampusCycle AI — Demo data seeder.
Inserts deterministic demo items and demand requests for hackathon demo.

Usage:
    python scripts/seed_demo.py
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from datetime import datetime, timezone

import boto3
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

REGION = os.getenv("AWS_REGION", "us-east-1")
dynamodb = boto3.resource("dynamodb", region_name=REGION)

DEMAND_TABLE = os.getenv("DYNAMO_DEMAND_TABLE", "CampusCycle_DemandRequests")
ITEMS_TABLE = os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items")
CONFIG_TABLE = os.getenv("DYNAMO_CONFIG_TABLE", "CampusCycle_Config")

NOW = datetime.now(timezone.utc).isoformat()

# ── Demo Demand Requests ───────────────────────────────────────────────────────
DEMO_DEMANDS = [
    {
        "request_id": "demo-req-001",
        "requester_id": "user-blockb-rahul",
        "requester_alias": "Rahul B2",
        "category": "electronics",
        "keywords": ["hdmi", "cable", "monitor"],
        "hostel": "Block B",
        "block": "B2",
        "campus_id": "campus-default",
        "active": True,
        "created_at": NOW,
    },
    {
        "request_id": "demo-req-002",
        "requester_id": "user-blockc-priya",
        "requester_alias": "Priya C3",
        "category": "electronics",
        "keywords": ["fan", "table fan", "desk fan"],
        "hostel": "Block C",
        "block": "C3",
        "campus_id": "campus-default",
        "active": True,
        "created_at": NOW,
    },
    {
        "request_id": "demo-req-003",
        "requester_id": "user-blocka-arjun",
        "requester_alias": "Arjun A4",
        "category": "furniture",
        "keywords": ["chair", "study chair", "desk chair"],
        "hostel": "Block A",
        "block": "A4",
        "campus_id": "campus-default",
        "active": True,
        "created_at": NOW,
    },
    {
        "request_id": "demo-req-004",
        "requester_id": "user-labclub",
        "requester_alias": "CS Lab Club",
        "category": "electronics",
        "keywords": ["keyboard", "mechanical keyboard", "usb keyboard"],
        "hostel": "Lab Block",
        "block": "Lab 3",
        "campus_id": "campus-default",
        "active": True,
        "created_at": NOW,
    },
]

# ── Demo Config Rules ──────────────────────────────────────────────────────────
DEMO_CONFIGS = [
    {
        "config_id": "rules#campus-default#electronics",
        "allowed_paths": ["reuse", "repair", "recycle", "manual_review"],
        "restricted_categories": [],
        "wording_guidance": "Always add safety note for electronics. Electrical verification required before reuse.",
    },
    {
        "config_id": "rules#campus-default#furniture",
        "allowed_paths": ["reuse", "repair", "donate", "recycle"],
        "restricted_categories": [],
        "wording_guidance": "Furniture in repairable condition should be offered for reuse first.",
    },
    {
        "config_id": "rules#campus-default#misc",
        "allowed_paths": ["reuse", "repair", "donate", "recycle", "manual_review"],
        "restricted_categories": ["chemical_containers", "unknown_liquids"],
        "wording_guidance": "Unknown containers require manual review. Do not suggest reuse.",
    },
]


def seed_table(table_name: str, items: list):
    table = dynamodb.Table(table_name)
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)
    print(f"  ✅ Seeded {len(items)} items into '{table_name}'")


def main():
    print("\n🌱 CampusCycle AI — Seeding Demo Data")
    print(f"   Region: {REGION}")
    print()

    seed_table(DEMAND_TABLE, DEMO_DEMANDS)
    seed_table(CONFIG_TABLE, DEMO_CONFIGS)

    print()
    print("✅ Demo data seeded. Ready for demo!")
    print("   Demand requests: 4 seeded (HDMI cable, table fan, chair, keyboard)")
    print("   Config rules: 3 categories seeded")


if __name__ == "__main__":
    main()
