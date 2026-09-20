# CampusCycle AI 🔄

> **Camera-first campus circular-economy scout** — turns discarded items into actionable reuse, repair, donation, or recycling decisions and proactively connects reusable items with people nearby who need them.

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node 20+ (frontend, Day 3+)
- AWS CLI v2 configured with `aws configure`
- Amazon Bedrock model access enabled for `amazon.nova-pro-v1:0` in your account

### 1. Backend setup
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Open .env and fill in your AWS Account ID and verify the region.
```

### 3. Provision AWS resources (idempotent — safe to re-run)
```bash
python scripts/infra_setup.py
```

### 4. Seed demo data
```bash
python scripts/seed_demo.py
```

### 5. Smoke-test Bedrock connectivity
```bash
python scripts/bedrock_smoke_test.py
```

### 6. Run health endpoint locally
```bash
cd backend
uvicorn lambda.health.handler:app --reload --port 8000
# Test: GET http://localhost:8000/health
```

### 7. Run tests
```bash
cd backend
pytest ../tests/ -v
```

---

## AWS Region
All resources: **`ap-south-1`** (Mumbai). Override via `AWS_REGION` in `.env`.

---

## Architecture

| Service | Role |
|---|---|
| AWS Amplify Hosting | React/Vite PWA frontend, CDN-backed |
| Amazon API Gateway | HTTPS API entry point |
| AWS Lambda | Request handlers + agent orchestration |
| Amazon S3 | Item image storage (private) |
| Amazon Bedrock | Multimodal AI — Amazon Nova Pro |
| Strands Agents SDK | Agent + tool orchestration |
| Amazon DynamoDB | Items, demands, matches, events (8 tables) |
| Amazon CloudWatch | Logs + metrics |

See `infra/architecture.md` for detailed service map and request flow.

---

## Repository Structure
```
campuscycle/
├── frontend/               # React + Vite + Tailwind (Day 2+)
├── backend/
│   ├── lambda/
│   │   ├── health/         # GET /health
│   │   ├── analyze/        # POST /api/items/analyze
│   │   ├── items/          # POST /api/items, GET /api/items/{id}
│   │   ├── demand/         # GET /api/demand, POST /api/demand
│   │   ├── review/         # POST /api/review/{id}
│   │   └── dashboard/      # GET /api/dashboard
│   ├── agent/
│   │   ├── campuscycle_agent.py  # Strands agent + singleton
│   │   ├── tools.py              # All 6 agent tools
│   │   ├── prompts.py            # System + user templates
│   │   └── schemas.py            # Pydantic I/O schemas
│   └── config/
│       └── settings.py           # Pydantic-settings config
├── infra/
│   ├── dynamodb_schema.md
│   └── architecture.md
├── data/
│   ├── demo_items.json
│   └── demo_requests.json
├── scripts/
│   ├── infra_setup.py       # Creates S3 + DynamoDB
│   ├── seed_demo.py         # Seeds demo data
│   ├── reset_demo.py        # Resets to clean demo state
│   └── bedrock_smoke_test.py
├── tests/
│   ├── test_health.py
│   └── test_schemas.py
└── README.md
```

---

## Day 1 Checklist
- [ ] `scripts/infra_setup.py` runs without error
- [ ] `scripts/bedrock_smoke_test.py` prints ✅
- [ ] DynamoDB: all 8 tables visible in AWS Console
- [ ] S3: bucket created with Block Public Access
- [ ] `uvicorn lambda.health.handler:app` → GET /health returns 200
- [ ] `pytest tests/` → all tests pass (with mocks)
- [ ] Strands agent skeleton imports: `from backend.agent import run_triage`
