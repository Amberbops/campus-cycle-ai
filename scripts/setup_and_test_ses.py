"""
CampusCycle AI — AWS SES Setup, Identity Verification & Live Match Test.
Verifies your Gmail address in Amazon SES and dispatches a live, structured
CampusCycle Table Fan Match HTML notification to test real cloud delivery.

Usage:
    python scripts/setup_and_test_ses.py [your_email@gmail.com]
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
import boto3
from dotenv import load_dotenv

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

workspace_root = Path(__file__).resolve().parent.parent
env_path = workspace_root / ".env"
load_dotenv(env_path)
load_dotenv()

AWS_REGION = os.getenv("SES_REGION", os.getenv("AWS_REGION", "us-east-1"))

print("=" * 65)
print("✉️ CampusCycle AI — Amazon SES Live Setup & Match Email Tester")
print(f"   Target Region: {AWS_REGION}")
print("=" * 65)

# Get email from argument, env, or prompt
target_email = ""
if len(sys.argv) > 1:
    target_email = sys.argv[1].strip()
elif os.getenv("DEMO_STUDENT_EMAIL"):
    target_email = os.getenv("DEMO_STUDENT_EMAIL", "").strip()

if not target_email:
    print("\n👉 Please enter the Gmail address you want to receive the demo match email:")
    try:
        target_email = input("Gmail address: ").strip()
    except EOFError:
        pass

if not target_email or "@" not in target_email:
    print("❌ Error: A valid email address is required.")
    sys.exit(1)

print(f"\n🔍 Testing AWS credentials for Amazon SES in '{AWS_REGION}'...")
try:
    ses = boto3.client("ses", region_name=AWS_REGION)
    identities_resp = ses.list_identities(IdentityType="EmailAddress")
    verified_emails = identities_resp.get("Identities", [])
    print(f"✅ Connected to Amazon SES. Existing verified identities: {verified_emails}")
except Exception as exc:
    print(f"❌ Failed to connect to Amazon SES: {exc}")
    print("Please check that your AWS credentials in .env or ~/.aws/credentials are valid.")
    sys.exit(1)

# Check verification status
is_verified = target_email in verified_emails
if not is_verified:
    # Check verification attributes
    try:
        attrs = ses.get_identity_verification_attributes(Identities=[target_email])
        status = attrs.get("VerificationAttributes", {}).get(target_email, {}).get("VerificationStatus")
        if status == "Success":
            is_verified = True
    except Exception:
        pass

if not is_verified:
    print(f"\n📨 Sending Amazon SES verification request to: {target_email}...")
    try:
        ses.verify_email_identity(EmailAddress=target_email)
        print("\n" + "!" * 65)
        print(f"⚠️  VERIFICATION REQUIRED:")
        print(f"Amazon SES has sent a verification email from 'no-reply-aws@amazon.com' to:")
        print(f"👉 {target_email}")
        print("\nPlease open your Gmail inbox, click the confirmation link, and run this")
        print("script again to send the live demo email!")
        print("!" * 65)
    except Exception as exc:
        print(f"❌ Could not initiate verification: {exc}")
        sys.exit(1)

    # Save to .env for future runs
    lines = env_path.read_text(encoding="utf-8").splitlines()
    updated_lines = []
    found_demo = False
    found_ses = False
    for line in lines:
        if line.startswith("DEMO_STUDENT_EMAIL="):
            updated_lines.append(f"DEMO_STUDENT_EMAIL={target_email}")
            found_demo = True
        elif line.startswith("SES_SENDER_EMAIL="):
            updated_lines.append(f"SES_SENDER_EMAIL={target_email}")
            found_ses = True
        else:
            updated_lines.append(line)
    if not found_demo:
        updated_lines.append(f"DEMO_STUDENT_EMAIL={target_email}")
    if not found_ses:
        updated_lines.append(f"SES_SENDER_EMAIL={target_email}")
    env_path.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
    print(f"\n💾 Saved {target_email} to .env as default DEMO_STUDENT_EMAIL.")
    sys.exit(0)

# Email is verified! Proceed with sending the live test email
print(f"\n🎉 {target_email} is VERIFIED in Amazon SES! Preparing live email...")

email_subject = "♻️ CampusCycle Match: We found a match for your Table Fan request!"
email_body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusCycle Match Notification</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 580px; width: 100%; background: #111827; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0d2824 0%, #111827 100%); border-bottom: 1px solid #1e293b;">
              <span style="background: #14b8a626; border: 1px solid #14b8a64d; color: #2dd4bf; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">
                CampusCycle AI · Circular Scout
              </span>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0; letter-spacing: -0.02em;">
                🎉 Great news! Match found for your request
              </h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                A peer in your residence scanned an item matching your campus wishlist!
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="font-size: 15px; color: #f1f5f9; margin-top: 0; line-height: 1.6;">
                Hi <b>Priya S. ({target_email})</b>,
              </p>
              <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
                A student has scanned an item through <b>CampusCycle AI</b> that matches your dorm wishlist. Here are the verified triage details:
              </p>

              <!-- Item Card -->
              <table role="presentation" width="100%" style="background: #0f172a; border-radius: 14px; border: 1px solid #334155; margin-bottom: 22px;" border="0" cellspacing="0" cellpadding="18">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Matched Item</span>
                          <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 4px 0 8px 0;">
                            Table Fan (Oscillating 400mm)
                          </h2>
                        </td>
                        <td align="right" valign="top">
                          <span style="background: #22c55e20; border: 1px solid #22c55e40; color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                            usable (repairable)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #1e293b; padding-top: 12px;">
                          <p style="margin: 0 0 6px 0; font-size: 13px; color: #cbd5e1;">
                            📍 <b>Location:</b> <span style="color: #2dd4bf; font-weight: 600;">Hostel 4 (Godavari), Block C, Room 214</span>
                          </p>
                          <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
                            🌱 <b>Impact:</b> <span style="color: #34d399; font-weight: 600;">~8.5 kg CO₂ diverted from landfill</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <a href="mailto:{target_email}?subject=Re:%20CampusCycle%20Handoff%20for%20Table%20Fan" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #022c22; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
                      Reply to Coordinate Handoff →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safety Notice -->
              <div style="background: #451a0333; border: 1px solid #b453094d; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
                  ⚡ <b>Safety Tip:</b> Please physically inspect cables and plugs before operating in dorm rooms. Never leave appliances plugged in unattended.
                </p>
              </div>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                Thanks for keeping campus items out of landfills and in circular motion!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #0b0f19; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                CampusCycle AI · Team DrogonTech
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                Automated Transactional Notification via Amazon SES (Simple Email Service) · AWS Serverless Architecture ({AWS_REGION})
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

try:
    print(f"🚀 Dispatching email via Amazon SES from '{target_email}' to '{target_email}'...")
    send_resp = ses.send_email(
        Source=target_email,
        Destination={"ToAddresses": [target_email]},
        Message={
            "Subject": {"Data": email_subject},
            "Body": {
                "Html": {"Data": email_body_html},
                "Text": {
                    "Data": f"Hi Priya ({target_email}), a student in Hostel 4 has matched your request for Table Fan!\n\nCoordinate dorm handoff via CampusCycle AI."
                },
            },
        },
    )
    message_id = send_resp.get("MessageId")
    print("\n" + "=" * 65)
    print("✅ SUCCESS! Live email sent via Amazon SES!")
    print(f"• AWS Message ID : {message_id}")
    print(f"• Destination    : {target_email}")
    print(f"• Status         : Delivered to Gmail inbox")
    print("=" * 65)
    print("\n👉 Check your Gmail inbox (or Promotions/Updates tab) to view the live email!")

    # Save to .env
    lines = env_path.read_text(encoding="utf-8").splitlines()
    updated_lines = []
    found_demo = False
    found_ses = False
    for line in lines:
        if line.startswith("DEMO_STUDENT_EMAIL="):
            updated_lines.append(f"DEMO_STUDENT_EMAIL={target_email}")
            found_demo = True
        elif line.startswith("SES_SENDER_EMAIL="):
            updated_lines.append(f"SES_SENDER_EMAIL={target_email}")
            found_ses = True
        else:
            updated_lines.append(line)
    if not found_demo:
        updated_lines.append(f"DEMO_STUDENT_EMAIL={target_email}")
    if not found_ses:
        updated_lines.append(f"SES_SENDER_EMAIL={target_email}")
    env_path.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
    print(f"💾 Updated .env: DEMO_STUDENT_EMAIL={target_email} & SES_SENDER_EMAIL={target_email}")

except Exception as exc:
    print(f"❌ Error sending live email: {exc}")
    sys.exit(1)
