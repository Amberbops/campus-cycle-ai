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

try:
    from scripts.seed_aws_live import EXPANDED_DEMANDS as DEMO_DEMANDS
except ImportError:
    from seed_aws_live import EXPANDED_DEMANDS as DEMO_DEMANDS

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
    print("\n🌱 CampusCycle AI — Seeding Expanded Demo Data")
    print(f"   Region: {REGION}")
    print()

    seed_table(DEMAND_TABLE, DEMO_DEMANDS)
    seed_table(CONFIG_TABLE, DEMO_CONFIGS)

    print()
    print("✅ Expanded campus data seeded into DynamoDB. Ready for demo!")
    print(f"   Demand requests: {len(DEMO_DEMANDS)} student wishlists across campus dorms")
    print("   Config rules: 3 categories seeded")


if __name__ == "__main__":
    main()
