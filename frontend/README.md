# CampusCycle AI — Frontend Web App 🔄

> Modern, camera-first progressive web application for **CampusCycle AI** — built with React 18, Vite, TypeScript, and Tailwind CSS by **Team DrogonTech** for **WeMakeDevs**.

[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Features

- 📷 **Live Device Camera Scout**: Instant webcam or mobile phone camera capture with camera-switching (front/back), live retakes, and upload fallback.
- ⚡ **Real-Time Visual Triage**: Communicates directly with the backend Multimodal Vision AI to diagnose item condition, safety status, and circular recommendations.
- 📋 **Campus Demands Wishlist (`/demand`)**: View and filter 22+ live campus requests across hostels; post new student requests directly into Amazon DynamoDB.
- ✉️ **Amazon SES Peer Connection Card**: One-click pairing triggers live transactional email dispatch to coordinate dorm room handoffs.
- 📦 **My Items & Diverted Gear (`/my-items`)**: Track campus items through their circular lifecycle (Matched, Active, In Repair, Recycled).
- 🛡️ **Moderation & Safety Dashboard (`/admin`)**: Inspect flagged electrical cables, monitor e-waste queues, and audit CO₂ savings.
- 🍌 **Nano Banana Celebration (`/thank-you`)**: Interactive celebratory page honoring Team DrogonTech and WeMakeDevs contributors.

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
```bash
# Default backend runs on http://localhost:8000
# To point to live AWS API Gateway:
cp .env.example .env
# Set: VITE_API_BASE_URL=https://n85mg3jwef.execute-api.us-east-1.amazonaws.com/dev
```

### 3. Run Development Server
```bash
npm run dev
# Open http://localhost:5173
```

### 4. Build for Production
```bash
npm run build
# Verified 0 errors — outputs optimized static bundle to dist/
```

---

## 👥 Authors
**Team DrogonTech**:
- Amber (`amber`)
- PurpleChiku25 (`purplechiku25`)
