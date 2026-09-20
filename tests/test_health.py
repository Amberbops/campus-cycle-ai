"""
CampusCycle AI — Health endpoint unit tests.
Uses FastAPI TestClient (no real AWS calls needed).
"""
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    # Patch AWS calls before importing handler
    with patch("boto3.client") as mock_boto:
        mock_dynamo = MagicMock()
        mock_s3 = MagicMock()
        mock_dynamo.describe_table.return_value = {"Table": {"TableStatus": "ACTIVE"}}
        mock_s3.head_bucket.return_value = {}
        mock_boto.side_effect = lambda service, **kw: mock_dynamo if service == "dynamodb" else mock_s3

        import importlib
        health_module = importlib.import_module("backend.lambda.health.handler")
        yield TestClient(health_module.app)


def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_health_has_required_fields(client):
    data = client.get("/health").json()
    assert "status" in data
    assert "timestamp" in data
    assert "checks" in data
    assert "dynamodb" in data["checks"]
    assert "s3" in data["checks"]
