"""
CampusCycle AI — /health Lambda handler.
Returns system health including AWS connectivity status.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

import boto3
from fastapi import FastAPI
from mangum import Mangum

from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root if present
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")
load_dotenv()

# Configure basic logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusCycle Health")


def _check_dynamodb(region: str, table_name: str) -> str:
    try:
        client = boto3.client("dynamodb", region_name=region)
        client.describe_table(TableName=table_name)
        return "ok"
    except Exception as exc:
        logger.warning("DynamoDB check failed: %s", exc)
        return "unavailable"


def _check_s3(region: str, bucket: str) -> str:
    try:
        client = boto3.client("s3", region_name=region)
        client.head_bucket(Bucket=bucket)
        return "ok"
    except Exception as exc:
        logger.warning("S3 check failed: %s", exc)
        return "unavailable"


@app.get("/health")
def health():
    region = os.getenv("AWS_REGION", "us-east-1")
    items_table = os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items")
    s3_bucket = os.getenv("S3_BUCKET_NAME", "campuscycle-items-dev")

    dynamo_status = _check_dynamodb(region, items_table)
    s3_status = _check_s3(region, s3_bucket)

    overall = "ok" if dynamo_status == "ok" and s3_status == "ok" else "degraded"

    body = {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0-day1",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "checks": {
            "dynamodb": dynamo_status,
            "s3": s3_status,
        },
    }
    logger.info("Health check: %s", body)
    return body


# Lambda entry point (AWS default: lambda_function.lambda_handler)
lambda_handler = Mangum(app, lifespan="off")
