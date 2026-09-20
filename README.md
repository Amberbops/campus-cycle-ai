# CampusCycle AI 🔄

> **Camera-first campus circular-economy scout** — transforms dormant and discarded campus items into actionable reuse, repair, or recycling decisions, and proactively connects them with peers nearby who need them.

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Amazon DynamoDB](https://img.shields.io/badge/Amazon-DynamoDB-4053D6?logo=amazon-dynamodb)](https://aws.amazon.com/dynamodb/)
[![Amazon SES](https://img.shields.io/badge/Amazon-SES-232F3E?logo=amazon-aws)](https://aws.amazon.com/ses/)
[![React + Vite](https://img.shields.io/badge/React%2018-Vite%208-61DAFB?logo=react)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Built by Team DrogonTech](https://img.shields.io/badge/Team-DrogonTech-14b8a6)](#team--contributors)

---

## 👥 Team & Contributors (DrogonTech)
Built with ❤️ for **WeMakeDevs** and the circular campus movement:
- **Amber** (`amber`) — Team Lead & Cloud Architect (AWS Serverless, DynamoDB schema, Lambda, SES pipeline)
- **PurpleChiku25** (`purplechiku25`) — Full-Stack & AI Engineer (React/Vite UI, Camera Scanner, Strands Agent integration)

---

## 🎯 The Problem & Our Solution

Every semester, thousands of usable dorm items — table fans, scientific calculators, study lamps, chargers, and textbooks — are abandoned in hostel corridors or dumped into campus landfills during move-outs. Meanwhile, junior students only a few dorm rooms away are actively searching and spending money on those exact same items.

**CampusCycle AI** solves this disconnect:
1. **Spot**: A student points their phone camera at an idle or discarded item.
2. **Triage**: Multimodal Vision AI detects the item, assesses its condition, and performs safety screening (e.g. flagging frayed wires or electrical hazards).
3. **Match**: The agent queries **Amazon DynamoDB** to find students in nearby dorm blocks who submitted requests for that item.
4. **Notify**: With one click, **Amazon SES** dispatches a formatted transactional notification directly to the matched peer's inbox to coordinate a dorm room handoff.
5. **Impact**: Every diverted item logs saved kilograms of CO₂ into an immutable audit ledger.

---

## 🏗️ AWS Cloud Architecture

CampusCycle AI runs on a resilient, zero-idle-cost AWS Serverless stack:

```text
 ┌─────────────────────────────────────────────────────────┐
 │               Frontend (React + Vite PWA)               │
 │           AWS Amplify Hosting / Global CDN              │
 └────────────────────────────┬────────────────────────────┘
                              │ HTTPS
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │                   Amazon API Gateway                    │
 │         (REST API /dev: /analyze, /demand, etc.)        │
 └──────┬─────────────────────┬────────────────────┬───────┘
        │                     │                    │
        ▼                     ▼                    ▼
 ┌──────────────┐      ┌──────────────┐     ┌──────────────┐
 │ Lambda:      │      │ Lambda:      │     │ Lambda:      │
 │ Analyze/Agent│      │ Demand       │     │ Items/Match  │
 └──────┬───────┘      └──────┬───────┘     └──────┬───────┘
        │                     │                    │
        ├─────────────────────┴────────────────────┤
        ▼                                          ▼
 ┌───────────────────────────┐             ┌───────────────┐
 │   Amazon DynamoDB         │             │  Amazon SES   │
 │   • CampusCycle_Demands   │             │  Live Handoff │
 │   • CampusCycle_Items     │             │  Peer Email   │
 │   • CampusCycle_Matches   │             └───────────────┘
 │   • CampusCycle_Users     │                     ▲
 │   • CampusCycle_Tasks     │                     │
 │   • CampusCycle_Audit     │                     │
 │   • CampusCycle_Impact    │                     │
 │   • CampusCycle_Config    │                     │
 └─────────────┬─────────────┘                     │
               │                                   │
               ▼                                   │
 ┌───────────────────────────┐                     │
 │   Amazon S3 (Private)     │                     │
 │   campuscycle-items-dev   │─────────────────────┘
 └───────────────────────────┘
```

### AWS Services Breakdown
| AWS Service | Production Role in CampusCycle |
|---|---|
| **Amazon DynamoDB** | Ultra-low latency NoSQL store for 8 core tables: demands, items, matches, users, tasks, audit trails, circular policies, and impact events. |
| **Amazon SES** | High-deliverability transactional email service notifying peers immediately when their dorm request is matched. |
| **AWS Lambda** | Microservice handlers for image processing, agent reasoning, demand wishlist management, and handoff orchestration. |
| **Amazon API Gateway** | Managed REST entry point routing traffic securely with CORS and stage management. |
| **Amazon S3** | Encrypted, private cloud object storage for captured item photos. |
| **Amazon Bedrock / Vision AI** | Multimodal reasoning for visual condition triage and safety hazard detection. |

---

## 🚀 Key Features

- 📸 **Camera-First Live Scanner**: Point mobile or laptop webcam directly at appliances, dorm gear, or textbooks with instant photo capture and live preview.
- ⚡ **Autonomous Circular Reasoning**: Decides whether an item should be **Reused**, **Repaired**, **Donated**, or **Recycled** based on campus safety policies.
- 📋 **Live Campus Demands Wishlist**: Browse and filter 22+ active dorm requests across hostels; post new requests in seconds.
- 📬 **Live Amazon SES Notification Engine**: Dispatches structured, dark-mode email alerts with item triage condition, hostel location, and a direct `Reply to Coordinate Handoff` CTA button.
- 🛡️ **Electrical Safety Screening**: Automatically flags damaged power cords and exposed wiring before items can be listed for dorm room reuse.
- 🌱 **Campus Carbon Ledger**: Real-time tracking of diverted e-waste and kilograms of CO₂ prevented from entering landfills.
- 🍌 **Interactive Nano Banana Celebration**: Celebratory easter egg and credits for the hackathon team.

---

## ⚡ Quick Start (Local Setup)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Amberbops/proyekt-6.git
cd proyekt-6

# Copy example environment
cp .env.example .env
# Fill in your AWS credentials (AWS_REGION=us-east-1, AWS_ACCOUNT_ID, etc.)
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Seed Live DynamoDB Tables & Circular Rules
```bash
python scripts/seed_aws_live.py
```
*Populates all 8 DynamoDB tables with 22 campus demands, student profiles, items, repair tasks, and policy rules.*

### 4. Test Live Amazon SES Email Dispatch
```bash
python scripts/setup_and_test_ses.py your_email@gmail.com
```
*Verifies your email identity and dispatches the live Table Fan Match HTML email directly to your inbox.*

### 5. Run the Full Stack

**Terminal 1 — Backend API:**
```bash
cd backend
uvicorn main:app --reload --port 8000
# OpenAPI Docs: http://localhost:8000/docs
```

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm install
npm run dev
# Web App: http://localhost:5173
```

---

## 📂 Project Structure

```text
proyekt-6/
├── frontend/                     # React 18 + Vite + Tailwind CSS PWA
│   ├── src/
│   │   ├── components/           # UI, Camera Scanner, Hero, Navbar, Result cards
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Circular scout hero & interactive flow
│   │   │   ├── ScanPage.tsx      # Live camera scanning + SES match notifications
│   │   │   ├── DemandPage.tsx    # Live student wishlist & post new requests
│   │   │   ├── MyItemsPage.tsx   # Diverted item catalog & dorm tracking
│   │   │   ├── AdminPage.tsx     # E-waste moderation & safety queue
│   │   │   └── ThankYouPage.tsx  # DrogonTech & WeMakeDevs celebration page
│   │   └── lib/api.ts            # Full-featured API client with AWS endpoints
│   └── package.json
├── backend/
│   ├── lambda/
│   │   ├── analyze/              # Multimodal vision analysis handler
│   │   ├── demand/               # /api/demand DynamoDB CRUD handler
│   │   ├── items/                # /api/items & /api/matches/connect (SES dispatch)
│   │   ├── dashboard/            # Metrics & CO2 impact calculations
│   │   └── health/               # AWS Lambda health check
│   ├── agent/
│   │   ├── campuscycle_agent.py  # Strands agent core
│   │   ├── tools.py              # 6 custom tools for search, triage, safety
│   │   └── schemas.py            # Pydantic contracts
│   └── main.py                   # Unified FastAPI Gateway
├── scripts/
│   ├── infra_setup.py            # Automated AWS S3 & DynamoDB table provisioner
│   ├── seed_aws_live.py          # Production seeder for all 8 DynamoDB tables
│   └── setup_and_test_ses.py     # Live Amazon SES verification and tester
└── README.md
```

---

## 📜 License & Acknowledgments
Built with passion by **Team DrogonTech** for the **WeMakeDevs** hackathon. Empowering universities worldwide to eliminate avoidable waste through circular AI.
