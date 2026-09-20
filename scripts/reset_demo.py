"""
CampusCycle AI — Demo reset script.
Clears Items, ImpactEvents, Tasks, and AuditEvents tables,
then re-seeds demand requests and config. Run before recording demo.

Usage:
    python scripts/reset_demo.py
"""
from __future__ import annotations

import os
from pathlib import Path
import sys
import boto3
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

REGION = os.getenv("AWS_REGION", "us-east-1")
dynamodb = boto3.resource("dynamodb", region_name=REGION)

TABLES_TO_CLEAR = [
    (os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items"), "item_id"),
    (os.getenv("DYNAMO_IMPACT_TABLE", "CampusCycle_ImpactEvents"), "impact_id"),
    (os.getenv("DYNAMO_TASKS_TABLE", "CampusCycle_Tasks"), "task_id"),
    (os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents"), "event_id"),
    (os.getenv("DYNAMO_MATCHES_TABLE", "CampusCycle_Matches"), "match_id"),
]


def clear_table(table_name: str, key_attr: str):
    table = dynamodb.Table(table_name)
    resp = table.scan(ProjectionExpression=key_attr)
    items = resp.get("Items", [])
    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={key_attr: item[key_attr]})
    print(f"  🗑️  Cleared {len(items)} items from '{table_name}'")


def main():
    print("\n🔄 CampusCycle AI — Demo Reset")
    print("   Clearing transactional tables...")

    for table_name, key_attr in TABLES_TO_CLEAR:
        clear_table(table_name, key_attr)

    print("\n   Re-seeding demand and config...")
    sys.path.insert(0, str(Path(__file__).parent))
    import seed_demo
    seed_demo.main()

    print("\n✅ Demo reset complete. All tables are in clean demo state.")


if __name__ == "__main__":
    main()
