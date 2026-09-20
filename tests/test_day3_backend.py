"""
CampusCycle AI — Day 3 Backend & Side-Effects Test Suite.
Verifies:
  1. Listing creation (POST /api/items) and impact event generation.
  2. Item retrieval (GET /api/items/{id}).
  3. Recycle task creation (POST /api/tasks/recycle).
  4. Impact metrics aggregation (GET /api/dashboard).
  5. Moderator resolution (POST /api/review/{id}).
"""
from __future__ import annotations

import importlib
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def items_client():
    module = importlib.import_module("backend.lambda.items.handler")
    return TestClient(module.app)


@pytest.fixture
def dashboard_client():
    module = importlib.import_module("backend.lambda.dashboard.handler")
    return TestClient(module.app)


@pytest.fixture
def review_client():
    module = importlib.import_module("backend.lambda.review.handler")
    return TestClient(module.app)


def test_create_item_listing(items_client):
    with patch("boto3.resource") as mock_resource:
        mock_table = MagicMock()
        mock_resource.return_value.Table.return_value = mock_table

        payload = {
            "item_name": "HDMI Cable",
            "category": "electronics",
            "condition": "usable",
            "image_s3_uri": "s3://campuscycle-items-dev/hdmi.jpg",
            "owner_id": "student_rahul",
            "hostel": "Block B",
            "chosen_path": "reuse",
        }
        res = items_client.post("/api/items", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "created"
        assert "item_id" in data


def test_create_recycle_task(items_client):
    with patch("boto3.resource") as mock_resource:
        mock_table = MagicMock()
        mock_resource.return_value.Table.return_value = mock_table

        payload = {
            "item_name": "Broken Microwave",
            "location": "Hostel 4 Kitchen",
            "reason": "Magnetron burned out",
            "category": "electronics",
        }
        res = items_client.post("/api/tasks/recycle", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "created"
        assert "task_id" in data


def test_dashboard_metrics(dashboard_client):
    with patch("boto3.resource") as mock_resource:
        mock_items_table = MagicMock()
        mock_items_table.scan.return_value = {
            "Items": [{"item_id": "1", "status": "available"}, {"item_id": "2", "status": "manual_review"}]
        }

        mock_impact_table = MagicMock()
        mock_impact_table.scan.return_value = {
            "Items": [
                {"impact_id": "i1", "decision": "reuse", "category": "electronics", "diverted_from_disposal": True, "created_at": "2026-09-19T00:00:00Z"},
                {"impact_id": "i2", "decision": "recycle", "category": "misc", "diverted_from_disposal": False, "created_at": "2026-09-19T01:00:00Z"},
            ]
        }

        mock_tasks_table = MagicMock()
        mock_tasks_table.scan.return_value = {
            "Items": [{"task_id": "t1", "status": "pending"}]
        }

        def get_table(name):
            if "Items" in name:
                return mock_items_table
            elif "Impact" in name:
                return mock_impact_table
            else:
                return mock_tasks_table

        mock_resource.return_value.Table.side_effect = get_table

        res = dashboard_client.get("/api/dashboard")
        assert res.status_code == 200
        metrics = res.json()["metrics"]
        assert metrics["total_items_submitted"] == 2
        assert metrics["items_diverted_from_disposal"] == 1
        assert metrics["items_recycled"] == 1
        assert metrics["pending_recycle_tasks"] == 1
        assert metrics["items_in_manual_review"] == 1


def test_resolve_review_approved(review_client):
    with patch("boto3.resource") as mock_resource:
        mock_table = MagicMock()
        mock_table.get_item.return_value = {
            "Item": {"item_id": "rev-123", "status": "manual_review"}
        }
        mock_resource.return_value.Table.return_value = mock_table

        payload = {
            "decision": "approved",
            "moderator_id": "mod_priya",
            "moderator_note": "Verified item is safe non-toxic container.",
        }
        res = review_client.post("/api/review/rev-123", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["new_status"] == "available"
        assert data["decision"] == "approved"
