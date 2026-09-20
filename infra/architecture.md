# CampusCycle AI — AWS Architecture Reference

## Service Map

| # | Service | Role | Notes |
|---|---|---|---|
| 1 | AWS Amplify Hosting | React/Vite PWA frontend | Git-based CI/CD, CDN-backed |
| 2 | Amazon API Gateway | HTTPS API entry point | REST API; all routes secured |
| 3 | AWS Lambda | Request handlers + agent orchestration | Stateless; one function per route group |
| 4 | Amazon S3 | Item image storage | Private bucket; access via signed URLs |
| 5 | Amazon Bedrock | Multimodal AI — Amazon Nova Pro | Image analysis + text reasoning |
| 6 | Strands Agents SDK | Agent + tool orchestration | Tool-calling loop with structured output |
| 7 | Amazon DynamoDB | All persistent data | PAY_PER_REQUEST; 8 tables |
| 8 | Amazon CloudWatch | Logs + operational metrics | All Lambda logs; agent trace |

## Request Flow

```
Student Browser (Amplify)
    │  HTTPS
    ▼
Amazon API Gateway
    │
    ▼
AWS Lambda (analyze handler)
    │  invoke
    ▼
Strands Agent
    ├── analyze_item_image ──► Amazon Bedrock (Nova Pro)
    │                            └── S3 (fetch image bytes)
    ├── get_circular_rules ──► DynamoDB (Config table)
    ├── search_local_demand ──► DynamoDB (DemandRequests table)
    └── create_item_listing / record_impact_event ──► DynamoDB
    │
    ▼
Structured JSON response
    │
    ▼
Student Browser — Recommendation card + match cards
```

## Security
- Frontend never holds AWS credentials
- Lambda IAM role: least-privilege (S3 read/write to bucket prefix, DynamoDB full on project tables, Bedrock InvokeModel)
- S3 bucket: Block All Public Access enabled
- API Gateway: HTTPS only; CORS restricted to Amplify domain in production
- CloudWatch: Raw image content not logged
