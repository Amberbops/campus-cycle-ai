"""
CampusCycle AI — Day 2 Agent & Rule Engine Tests.
Verifies the SRS Section 10 Agent Decision Policy:
  1. Usable items with demand -> REUSE + match_ids.
  2. Repairable items -> REPAIR + inspect + safety note.
  3. Hazardous items -> MANUAL_REVIEW + contact_moderator.
  4. Damaged items -> RECYCLE.
  5. Low-confidence cases -> MANUAL_REVIEW.
"""
from __future__ import annotations

import json
from unittest.mock import patch, MagicMock

import pytest

from backend.agent.schemas import (
    AgentRecommendation,
    ItemCategory,
    VisibleCondition,
    RecommendedPath,
    NextAction,
)
from backend.agent.campuscycle_agent import run_triage


def test_triage_reusable_with_match():
    """Test Case 1: Usable HDMI Cable should match active demand in Block B."""
    vision_mock = json.dumps({
        "item_name": "HDMI Cable",
        "category": "electronics",
        "condition": "usable",
        "confidence": 0.94,
        "safety_flags": [],
    })
    with patch("backend.agent.campuscycle_agent.analyze_item_image", return_value=vision_mock):
        rec = run_triage(
            image_s3_uri="s3://campuscycle-items-dev/hdmi.jpg",
            user_description="Black HDMI Cable",
            location={"hostel": "Block B", "campus_id": "campus-default"},
        )
        assert rec.recommended_path == RecommendedPath.reuse
        assert rec.category == ItemCategory.electronics
        assert rec.next_action == NextAction.match
        assert len(rec.match_ids) > 0


def test_triage_repairable_item():
    """Test Case 2: Broken table fan should route to REPAIR/INSPECT with safety warning."""
    vision_mock = json.dumps({
        "item_name": "Table Fan",
        "category": "electronics",
        "condition": "repairable-looking",
        "confidence": 0.88,
        "safety_flags": ["unverified_wiring"],
    })
    with patch("backend.agent.campuscycle_agent.analyze_item_image", return_value=vision_mock):
        rec = run_triage(
            image_s3_uri="s3://campuscycle-items-dev/fan.jpg",
            user_description="Table Fan with noisy motor",
            location={"hostel": "Block C", "campus_id": "campus-default"},
        )
        assert rec.recommended_path == RecommendedPath.repair
        assert rec.next_action == NextAction.inspect
        assert "safety" in rec.reason.lower() or "inspected" in rec.reason.lower()


def test_triage_hazardous_unknown_chemical():
    """Test Case 3: Unknown chemical bottle must NEVER be auto-reused; must go to MANUAL_REVIEW."""
    vision_mock = json.dumps({
        "item_name": "Unknown Chemical Container",
        "category": "misc",
        "condition": "unknown",
        "confidence": 0.42,
        "safety_flags": ["potential_hazard", "unverified_chemical"],
    })
    with patch("backend.agent.campuscycle_agent.analyze_item_image", return_value=vision_mock):
        rec = run_triage(
            image_s3_uri="s3://campuscycle-items-dev/chemical.jpg",
            user_description="Unknown chemical liquid bottle",
            location={"hostel": "Lab Block", "campus_id": "campus-default"},
        )
        assert rec.recommended_path == RecommendedPath.manual_review
        assert rec.next_action == NextAction.contact_moderator
        assert len(rec.safety_flags) > 0
        assert rec.match_ids == []  # Never match hazard with student demand


def test_triage_study_chair():
    """Test Case 4: Study chair in usable condition matched with student demand."""
    vision_mock = json.dumps({
        "item_name": "Study Chair",
        "category": "furniture",
        "condition": "usable",
        "confidence": 0.92,
        "safety_flags": [],
    })
    with patch("backend.agent.campuscycle_agent.analyze_item_image", return_value=vision_mock):
        rec = run_triage(
            image_s3_uri="s3://campuscycle-items-dev/chair.jpg",
            user_description="Study Chair",
            location={"hostel": "Block A", "campus_id": "campus-default"},
        )
        assert rec.recommended_path == RecommendedPath.reuse
        assert rec.category == ItemCategory.furniture
        assert len(rec.match_ids) > 0
