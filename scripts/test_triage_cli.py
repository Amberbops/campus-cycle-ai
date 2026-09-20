"""
CampusCycle AI — Day 2 End-to-End CLI Triage Runner.
Tests the complete circular triage flow:
  Image/Description -> analyze_item_image -> circularity rules -> search_local_demand -> match.

Usage:
    python scripts/test_triage_cli.py
    python scripts/test_triage_cli.py --item "HDMI Cable"
    python scripts/test_triage_cli.py --item "Table Fan"
    python scripts/test_triage_cli.py --item "Unknown Chemical Bottle"
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Add project root and backend to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from backend.agent.campuscycle_agent import run_triage
from backend.agent.schemas import AgentRecommendation


def main():
    parser = argparse.ArgumentParser(description="CampusCycle AI - Day 2 CLI Triage Test")
    parser.add_argument(
        "--item",
        type=str,
        default="HDMI Cable",
        help="Demo item name or description (e.g. 'HDMI Cable', 'Table Fan', 'Study Chair', 'Mechanical Keyboard', 'Old Laptop', 'Unknown Chemical Bottle')",
    )
    parser.add_argument(
        "--image",
        type=str,
        default="",
        help="Optional S3 URI or local image path",
    )
    parser.add_argument(
        "--hostel",
        type=str,
        default="Block B",
        help="Hostel location of user",
    )
    args = parser.parse_args()

    image_uri = args.image or f"s3://campuscycle-items-dev/uploads/{args.item.lower().replace(' ', '_')}.jpg"

    print("\n" + "=" * 65)
    print("🔄 CampusCycle AI — Item Triage Scout (Day 2 Pipeline)")
    print("=" * 65)
    print(f"📥 Input Item Description: {args.item}")
    print(f"🖼️  Image Reference       : {image_uri}")
    print(f"📍 Location               : {args.hostel}")
    print("-" * 65)
    print("⏳ Invoking Triage Engine (Multimodal Analysis -> Rules -> Demand Match)...")

    location = {"hostel": args.hostel, "campus_id": "campus-default"}
    rec: AgentRecommendation = run_triage(
        image_s3_uri=image_uri,
        user_description=args.item,
        location=location,
    )

    print("\n✨ Structured Agent Result (SRS Section 10.5 Contract):")
    print(json.dumps(rec.model_dump(), indent=2))

    print("\n" + "-" * 65)
    print("📋 Decision Summary:")
    print(f"  • Item Identified  : {rec.item_name} ({rec.category.value})")
    print(f"  • Visible Condition: {rec.condition.value} (Confidence: {rec.confidence * 100:.0f}%)")
    print(f"  • Recommended Path : 👉 {rec.recommended_path.value.upper()} 👈")
    print(f"  • Next Action      : {rec.next_action.value}")
    print(f"  • Safety Flags     : {rec.safety_flags or 'None (Safe)'}")
    print(f"  • Reasoning        : {rec.reason}")
    if rec.action_summary:
        print(f"  • Action Summary   : 💡 {rec.action_summary}")
    if rec.match_ids:
        print(f"  • 🎯 Campus Demand Matches Found: {rec.match_ids}")
    else:
        print(f"  • Campus Matches   : None (Offer to general campus pool)")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
