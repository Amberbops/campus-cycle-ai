"""
CampusCycle AI — Strands Agent definition.
This file wires the system prompt, model config, and tools together.
The agent is invoked by the Lambda analyze handler.
"""
from __future__ import annotations

import json
import logging

try:
    from strands import Agent
    from strands.models.bedrock import BedrockModel
except ImportError:
    Agent = None
    BedrockModel = None

try:
    from ..config.settings import get_settings
except (ImportError, ValueError):
    try:
        from backend.config.settings import get_settings
    except (ImportError, ValueError):
        from config.settings import get_settings
from .prompts import SYSTEM_PROMPT, ANALYZE_USER_TEMPLATE
from .schemas import (
    AgentRecommendation,
    VisionResult,
    CircularRules,
    ItemCategory,
    VisibleCondition,
    RecommendedPath,
    NextAction,
)
from .tools import (
    analyze_item_image,
    get_circular_rules,
    search_local_demand,
    create_item_listing,
    create_recycle_task,
    record_impact_event,
)

logger = logging.getLogger(__name__)
settings = get_settings()


def _build_agent():
    """Instantiate and return the Strands agent if available."""
    if Agent is None or BedrockModel is None:
        return None
    try:
        model = BedrockModel(
            model_id=settings.bedrock_model_id,
            region_name=settings.aws_region,
            temperature=settings.agent_temperature,
            max_tokens=settings.agent_max_tokens,
        )
        return Agent(
            model=model,
            system_prompt=SYSTEM_PROMPT,
            tools=[
                analyze_item_image,
                get_circular_rules,
                search_local_demand,
                create_item_listing,
                create_recycle_task,
                record_impact_event,
            ],
        )
    except Exception as exc:
        logger.info("Strands agent init note: %s", exc)
        return None


# Module-level singleton
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = _build_agent()
    return _agent


def run_triage(
    image_s3_uri: str,
    user_description: str = "",
    location: dict | None = None,
) -> AgentRecommendation:
    """
    Run the full item-triage workflow enforcing SRS Section 10 Agent Decision Policy:
      1. Calls analyze_item_image tool (Bedrock multimodal Nova / vision).
      2. Evaluates safety flags and confidence thresholds deterministically.
      3. Searches local campus demand in DynamoDB when reuse or repair is viable.
      4. Returns structured, validated AgentRecommendation JSON.
    """
    location = location or {}
    campus_id = location.get("campus_id", "campus-default")
    hostel = location.get("hostel", "")

    logger.info("Starting item triage for %s (hostel: %s)", image_s3_uri, hostel)

    # Step 1: Vision / Identification tool
    raw_vision = analyze_item_image(image_s3_uri=image_s3_uri, user_description=user_description)
    vision_data = json.loads(raw_vision)
    vision_result = VisionResult(**vision_data)

    # Step 2: Retrieve category circularity rules
    raw_rules = get_circular_rules(category=vision_result.category.value, campus_id=campus_id)
    rules_data = json.loads(raw_rules)
    circular_rules = CircularRules(**rules_data)

    # Step 3: Enforce Deterministic Safety & Confidence Policies (SRS 10.3)
    # 3a. Safety check
    hazardous = any(
        flag in vision_result.safety_flags
        for flag in ("potential_hazard", "unverified_chemical", "content_moderation_flagged")
    )
    if hazardous:
        return AgentRecommendation(
            item_name=vision_result.item_name,
            category=vision_result.category,
            condition=VisibleCondition.unknown,
            recommended_path=RecommendedPath.manual_review,
            confidence=round(vision_result.confidence, 2),
            safety_flags=vision_result.safety_flags,
            action_summary=vision_result.action_summary or "Do not discard in common bins. Flagged for review by campus safety/warden.",
            reason=vision_result.reason or "Potential hazard or unidentified substance detected. Automatic reuse/donation blocked; routed to manual review and safe disposal.",
            next_action=NextAction.contact_moderator,
            match_ids=[],
        )

    # 3b. Confidence threshold check
    if vision_result.confidence < settings.agent_confidence_threshold:
        return AgentRecommendation(
            item_name=vision_result.item_name,
            category=vision_result.category,
            condition=vision_result.condition,
            recommended_path=RecommendedPath.manual_review,
            confidence=round(vision_result.confidence, 2),
            safety_flags=vision_result.safety_flags,
            action_summary=vision_result.action_summary or f"Review {vision_result.item_name} manually to determine suitable circular path.",
            reason=vision_result.reason or f"Identification confidence ({vision_result.confidence:.2f}) is below threshold ({settings.agent_confidence_threshold}). Routed to manual review.",
            next_action=NextAction.contact_moderator,
            match_ids=[],
        )

    # Step 4: Circularity Path Reasoning & Local Demand Matching
    match_ids = []

    # Case A: Usable or New-like condition -> Prioritize REUSE & MATCH
    if vision_result.condition in (VisibleCondition.usable, VisibleCondition.new_like):
        # Query campus demand from DynamoDB
        raw_matches = search_local_demand(
            category=vision_result.category.value,
            keywords=vision_result.item_name,
            hostel=hostel,
            limit=3,
        )
        matches = json.loads(raw_matches)
        match_ids = [m["request_id"] for m in matches if "request_id" in m]

        if match_ids:
            return AgentRecommendation(
                item_name=vision_result.item_name,
                category=vision_result.category,
                condition=vision_result.condition,
                recommended_path=RecommendedPath.reuse,
                confidence=round(vision_result.confidence, 2),
                safety_flags=vision_result.safety_flags,
                action_summary=f"🎉 Match found! Connect with {len(match_ids)} student request(s) in {hostel} or drop at hostel reuse station.",
                reason=vision_result.reason or f"{vision_result.item_name} appears in good usable condition. Matched with active student demand on campus.",
                next_action=NextAction.match,
                match_ids=match_ids,
            )
        else:
            return AgentRecommendation(
                item_name=vision_result.item_name,
                category=vision_result.category,
                condition=vision_result.condition,
                recommended_path=RecommendedPath.reuse,
                confidence=round(vision_result.confidence, 2),
                safety_flags=vision_result.safety_flags,
                action_summary=vision_result.action_summary or f"List {vision_result.item_name} on CampusCycle peer-to-peer exchange or drop at hostel reuse shelf.",
                reason=vision_result.reason or f"{vision_result.item_name} appears usable and structurally intact. Ready to offer to the campus reuse pool.",
                next_action=NextAction.list_item,
                match_ids=[],
            )

    # Case B: Repairable-looking condition -> REPAIR / INSPECT
    elif vision_result.condition == VisibleCondition.repairable_looking:
        raw_matches = search_local_demand(
            category=vision_result.category.value,
            keywords=vision_result.item_name,
            hostel=hostel,
            limit=2,
        )
        matches = json.loads(raw_matches)
        match_ids = [m["request_id"] for m in matches if "request_id" in m]

        return AgentRecommendation(
            item_name=vision_result.item_name,
            category=vision_result.category,
            condition=vision_result.condition,
            recommended_path=RecommendedPath.repair,
            confidence=round(vision_result.confidence, 2),
            safety_flags=vision_result.safety_flags,
            action_summary=vision_result.action_summary or f"Bring {vision_result.item_name} to campus MakerSpace/repair workshop for inspection and maintenance.",
            reason=vision_result.reason or f"{vision_result.item_name} appears repairable with minor refurbishment.",
            next_action=NextAction.inspect,
            match_ids=match_ids,
        )

    # Case C: Damaged condition -> RECYCLE
    elif vision_result.condition == VisibleCondition.damaged:
        default_action = "Deposit in campus organic wet-waste or compost collection." if any(w in vision_result.item_name.lower() for w in ["peel", "food", "fruit", "organic", "scraps", "vegetable"]) else f"Deposit in designated campus {vision_result.category.value} recycling bin."
        return AgentRecommendation(
            item_name=vision_result.item_name,
            category=vision_result.category,
            condition=vision_result.condition,
            recommended_path=RecommendedPath.recycle,
            confidence=round(vision_result.confidence, 2),
            safety_flags=vision_result.safety_flags,
            action_summary=vision_result.action_summary or default_action,
            reason=vision_result.reason or f"{vision_result.item_name} cannot be reused in current state. Divert to campus recovery stream.",
            next_action=NextAction.recycle,
            match_ids=[],
        )

    # Case D: Unknown condition -> MANUAL_REVIEW
    else:
        return AgentRecommendation(
            item_name=vision_result.item_name,
            category=vision_result.category,
            condition=VisibleCondition.unknown,
            recommended_path=RecommendedPath.manual_review,
            confidence=round(vision_result.confidence, 2),
            safety_flags=vision_result.safety_flags,
            action_summary=vision_result.action_summary or f"Submit {vision_result.item_name} for moderator inspection to determine recycling or reuse.",
            reason=vision_result.reason or f"Condition of {vision_result.item_name} is uncertain from the photograph. Escalated to manual review.",
            next_action=NextAction.contact_moderator,
            match_ids=[],
        )
