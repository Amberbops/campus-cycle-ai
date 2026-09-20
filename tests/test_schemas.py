"""
CampusCycle AI — Schema validation unit tests.
Verifies that Pydantic schemas enforce correct values.
"""
import pytest
from pydantic import ValidationError

from backend.agent.schemas import (
    AgentRecommendation,
    ItemCategory,
    VisibleCondition,
    RecommendedPath,
    NextAction,
)


def test_valid_recommendation():
    rec = AgentRecommendation(
        item_name="HDMI Cable",
        category=ItemCategory.electronics,
        condition=VisibleCondition.usable,
        recommended_path=RecommendedPath.reuse,
        confidence=0.92,
        safety_flags=[],
        reason="Cable appears intact with no visible damage.",
        next_action=NextAction.match,
        match_ids=["demo-req-001"],
    )
    assert rec.recommended_path == RecommendedPath.reuse


def test_invalid_confidence_above_1():
    with pytest.raises(ValidationError):
        AgentRecommendation(
            item_name="Test",
            category=ItemCategory.misc,
            condition=VisibleCondition.unknown,
            recommended_path=RecommendedPath.manual_review,
            confidence=1.5,  # Invalid
            reason="test",
            next_action=NextAction.contact_moderator,
        )


def test_invalid_category_raises():
    with pytest.raises(ValidationError):
        AgentRecommendation(
            item_name="Test",
            category="invalid_cat",  # type: ignore
            condition=VisibleCondition.unknown,
            recommended_path=RecommendedPath.manual_review,
            confidence=0.5,
            reason="test",
            next_action=NextAction.contact_moderator,
        )


def test_safety_defaults_to_empty():
    rec = AgentRecommendation(
        item_name="Book",
        category=ItemCategory.books,
        condition=VisibleCondition.usable,
        recommended_path=RecommendedPath.donate,
        confidence=0.88,
        reason="Book in good condition.",
        next_action=NextAction.list_item,
    )
    assert rec.safety_flags == []
