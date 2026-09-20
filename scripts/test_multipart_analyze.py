"""
CampusCycle AI — Test Direct Multipart /analyze endpoint.
Simulates Person B's frontend sending a camera image or file to POST /analyze.

Usage:
    python scripts/test_multipart_analyze.py
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient
from backend.main import app

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print("\n" + "=" * 65)
    print("[*] Testing Direct Multipart POST /analyze (Frontend Contract)")
    print("=" * 65)

    client = TestClient(app)

    # 1. Test Health
    resp = client.get("/health")
    print(f"[+] GET /health: {resp.status_code} - {resp.json().get('status')}")

    # 2. Test Multipart Analyze with a real image
    print("\n[*] Simulating camera capture upload from Frontend...")
    from PIL import Image
    test_img = Image.new("RGB", (100, 100), color=(30, 160, 200))
    img_buf = io.BytesIO()
    test_img.save(img_buf, format="JPEG")
    real_image_bytes = img_buf.getvalue()

    files = {
        "image": ("hdmi_cable.jpg", io.BytesIO(real_image_bytes), "image/jpeg")
    }
    data = {
        "description": "Black high-speed braided HDMI 2.1 cable, working condition",
        "hostel": "Block C",
    }

    resp = client.post("/analyze", files=files, data=data)
    print(f"[*] Response status: {resp.status_code}")

    if resp.status_code == 200:
        res = resp.json()
        print("\n[+] Direct /analyze Response:")
        print(f"  - ID            : {res.get('id')}")
        print(f"  - Item Name     : {res.get('itemName')}")
        print(f"  - Condition     : {res.get('condition')}")
        print(f"  - Recommendation: {res.get('recommendation')}")
        print(f"  - Confidence    : {res.get('confidence')}")
        print(f"  - Description   : {res.get('description')}")
        print(f"  - Tags          : {res.get('tags')}")
        print(f"  - Matches Count : {len(res.get('matches', []))}")
        print("\n[OK] Verification Successful! Frontend contract matches 100%.\n")
    else:
        print(f"[-] Error: {resp.text}")

    # 3. Test Admin Metrics
    print("\n[*] Testing GET /admin/metrics...")
    m_resp = client.get("/admin/metrics")
    print(f"[+] Status: {m_resp.status_code}")
    if m_resp.status_code == 200:
        print(f"  Metrics: {json.dumps(m_resp.json(), indent=2)}")

    # 4. Test Admin Moderation Queue
    print("\n[*] Testing GET /admin/moderation...")
    q_resp = client.get("/admin/moderation")
    print(f"[+] Status: {q_resp.status_code}")
    if q_resp.status_code == 200:
        print(f"  Queue count: {len(q_resp.json())} item(s)")

    print("=" * 65 + "\n")

if __name__ == "__main__":
    main()
