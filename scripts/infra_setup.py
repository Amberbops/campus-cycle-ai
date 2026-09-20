"""
CampusCycle AI — AWS infrastructure setup script.
Creates S3 bucket and all DynamoDB tables. Safe to re-run (idempotent).

Usage:
    python scripts/infra_setup.py
"""
from __future__ import annotations

import os
import sys
import json
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")

REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "campuscycle-items-dev")

TABLES = [
    {
        "TableName": os.getenv("DYNAMO_USERS_TABLE", "CampusCycle_Users"),
        "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "user_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_ITEMS_TABLE", "CampusCycle_Items"),
        "KeySchema": [{"AttributeName": "item_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "item_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_DEMAND_TABLE", "CampusCycle_DemandRequests"),
        "KeySchema": [{"AttributeName": "request_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "request_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_MATCHES_TABLE", "CampusCycle_Matches"),
        "KeySchema": [{"AttributeName": "match_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "match_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_TASKS_TABLE", "CampusCycle_Tasks"),
        "KeySchema": [{"AttributeName": "task_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "task_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_IMPACT_TABLE", "CampusCycle_ImpactEvents"),
        "KeySchema": [{"AttributeName": "impact_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "impact_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents"),
        "KeySchema": [{"AttributeName": "event_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "event_id", "AttributeType": "S"}],
    },
    {
        "TableName": os.getenv("DYNAMO_CONFIG_TABLE", "CampusCycle_Config"),
        "KeySchema": [{"AttributeName": "config_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "config_id", "AttributeType": "S"}],
    },
]


def create_s3_bucket(s3_client, bucket_name: str, region: str):
    print(f"  S3: Creating bucket '{bucket_name}' in {region}...")
    try:
        if region == "us-east-1":
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": region},
            )
        # Block all public access
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            },
        )
        print(f"  ✅ Bucket created and public access blocked.")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("BucketAlreadyExists", "BucketAlreadyOwnedByYou"):
            print(f"  ⚡ Bucket already exists — skipping.")
        else:
            raise


def create_dynamodb_table(dynamo_client, table_def: dict):
    table_name = table_def["TableName"]
    print(f"  DynamoDB: Creating table '{table_name}'...")
    try:
        dynamo_client.create_table(
            TableName=table_name,
            KeySchema=table_def["KeySchema"],
            AttributeDefinitions=table_def["AttributeDefinitions"],
            BillingMode="PAY_PER_REQUEST",
            Tags=[
                {"Key": "Project", "Value": "CampusCycleAI"},
                {"Key": "Environment", "Value": os.getenv("ENVIRONMENT", "development")},
            ],
        )
        # Wait until table is active
        waiter = dynamo_client.get_waiter("table_exists")
        waiter.wait(TableName=table_name, WaiterConfig={"Delay": 2, "MaxAttempts": 20})
        print(f"  ✅ Table '{table_name}' created.")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            print(f"  ⚡ Table '{table_name}' already exists — skipping.")
        else:
            raise


def main():
    print("\n🚀 CampusCycle AI — Infrastructure Setup")
    print(f"   Region : {REGION}")
    print(f"   Bucket : {S3_BUCKET}")
    print()

    s3_client = boto3.client("s3", region_name=REGION)
    dynamo_client = boto3.client("dynamodb", region_name=REGION)

    print("── S3 ─────────────────────────────────────────")
    create_s3_bucket(s3_client, S3_BUCKET, REGION)

    print()
    print("── DynamoDB ────────────────────────────────────")
    for table_def in TABLES:
        create_dynamodb_table(dynamo_client, table_def)

    print()
    print("✅ Infrastructure setup complete.")
    print("   Next step: python scripts/seed_demo.py")


if __name__ == "__main__":
    main()
