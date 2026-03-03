"""
Email Sending Tool (Gmail SMTP via App Password)
Sends confirmation/connection emails through Gmail.
Used by the LangGraph agent when a visitor confirms they want to connect.
Also forwards connection data to Next.js API for MongoDB storage.
"""

import smtplib
import os
import json
import httpx
import base64
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()

# Gmail SMTP credentials
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")             # your Gmail address
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")    # 16-char app password
OWNER_EMAIL = os.getenv("OWNER_EMAIL", GMAIL_ADDRESS)       # where YOU receive notifications

# Next.js API URL for storing connections
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000/api/portfolio-chat")

# ─── Logo images for email embedding ────────────────────────────
# Resolution order:
#   1. <Agent-root>/Images/  — present in Docker (copied during build)
#   2. <portfolios-root>/Nextjs/src/Images/  — present in local dev
_AGENT_DIR = Path(__file__).resolve().parent.parent   # Agent/
_DEV_IMAGES = _AGENT_DIR.parent / "Nextjs" / "src" / "Images"

def _resolve_logo(filename: str) -> Path:
    """Return the path for a logo, checking Docker-local path first."""
    local = _AGENT_DIR / "Images" / filename
    if local.exists():
        return local
    return _DEV_IMAGES / filename

_LOGO_PATH      = _resolve_logo("logo.png")
_LOGO_NAME_PATH = _resolve_logo("logo_name.png")

def _load_logo_bytes(path: Path) -> bytes | None:
    """Load logo image bytes from disk, return None if not found."""
    try:
        return path.read_bytes()
    except Exception as e:
        print(f"⚠️ Could not load logo from {path}: {e}")
        return None


def _send_email(to_email: str, subject: str, html_body: str, plain_body: str) -> bool:
    """
    Internal helper to send an email via Gmail SMTP using App Password.
    Embeds SIA logo images as CID inline attachments.
    Returns True on success, False on failure.
    """
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("❌ Gmail credentials not configured (GMAIL_ADDRESS / GMAIL_APP_PASSWORD)")
        return False

    # Build multipart/related so CID images render inline
    msg_root = MIMEMultipart("related")
    msg_root["From"] = f"Krishna's Portfolio <{GMAIL_ADDRESS}>"
    msg_root["To"] = to_email
    msg_root["Subject"] = subject

    # Alternative part (plain + html)
    msg_alt = MIMEMultipart("alternative")
    msg_alt.attach(MIMEText(plain_body, "plain"))
    msg_alt.attach(MIMEText(html_body, "html"))
    msg_root.attach(msg_alt)

    # Attach logo images as CID inline
    logo_bytes = _load_logo_bytes(_LOGO_PATH)
    if logo_bytes:
        img = MIMEImage(logo_bytes, _subtype="png")
        img.add_header("Content-ID", "<sia_logo>")
        img.add_header("Content-Disposition", "inline", filename="logo.png")
        msg_root.attach(img)

    logo_name_bytes = _load_logo_bytes(_LOGO_NAME_PATH)
    if logo_name_bytes:
        img = MIMEImage(logo_name_bytes, _subtype="png")
        img.add_header("Content-ID", "<sia_logo_name>")
        img.add_header("Content-Disposition", "inline", filename="logo_name.png")
        msg_root.attach(img)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg_root.as_string())
        print(f"✅ Email sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("❌ Gmail authentication failed. Check GMAIL_ADDRESS and GMAIL_APP_PASSWORD.")
        return False
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False


async def _store_connection_to_db(
    visitor_name: str,
    visitor_email: str,
    reason: str,
    message: str = "",
    mobile_number: str = "",
    about_user: str = "",
    session_id: str = "",
) -> bool:
    """
    Forward connection data to Next.js API for MongoDB storage.
    Returns True on success, False on failure.
    """
    try:
        payload = {
            "name": visitor_name,
            "email": visitor_email,
            "reason": reason,
        }
        if message:
            payload["message"] = message
        if mobile_number:
            payload["phone"] = mobile_number
        if about_user:
            payload["aboutUser"] = about_user
        if session_id:
            payload["sessionId"] = session_id

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NEXTJS_API_URL}/connection",
                json=payload,
                timeout=10.0,
            )
            if response.status_code in (200, 201):
                print(f"✅ Connection stored in DB for: {visitor_name} ({visitor_email})")
                return True
            else:
                print(f"⚠️ Failed to store connection: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"❌ Error storing connection to DB: {e}")
        return False


def _build_visitor_confirmation_email(
    visitor_name: str,
    visitor_email: str,
    reason: str,
    message: str = "",
    mobile_number: str = "",
    about_user: str = "",
) -> tuple[str, str]:
    """Build HTML and plain-text email bodies for the visitor confirmation."""

    # Build optional fields HTML
    optional_html = ""
    if mobile_number:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">Phone:</strong> {mobile_number}</p>'
    if about_user:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">About You:</strong> {about_user}</p>'
    if message:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">Message:</strong> {message}</p>'
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #1a1a2e;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <img src="cid:sia_logo" alt="SIA" style="height: 48px; width: auto; vertical-align: middle;" />
                <img src="cid:sia_logo_name" alt="SIA" style="height: 32px; width: auto; vertical-align: middle; margin-left: -8px;" />
            </div>
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">Thanks for connecting, {visitor_name}! 🚀</h1>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                Hi <strong style="color: #ffffff;">{visitor_name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                I've received your connection request through my portfolio. Here's a summary of the details you shared:
            </p>
            <div style="background: #111827; border-left: 3px solid #294e90; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">Name:</strong> {visitor_name}</p>
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">Email:</strong> {visitor_email}</p>
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #7aa2f7;">Reason:</strong> {reason}</p>
                {optional_html}
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                I'll review your request and get back to you soon. Looking forward to connecting!
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                Best regards,<br>
                <strong style="color: #ffffff;">Krishna Sharma</strong>
            </p>
        </div>
        <div style="background: #111827; padding: 16px 32px; text-align: center; font-size: 12px; color: #666;">
            Sent via SIA — Krishna's Portfolio AI Assistant
        </div>
    </div>
    """

    # Build plain text optional fields
    optional_plain = ""
    if mobile_number:
        optional_plain += f"\nPhone: {mobile_number}"
    if about_user:
        optional_plain += f"\nAbout You: {about_user}"
    if message:
        optional_plain += f"\nMessage: {message}"

    plain_body = f"""
Hi {visitor_name},

Thanks for connecting through my portfolio! Here's a summary:

Name: {visitor_name}
Email: {visitor_email}
Reason: {reason}{optional_plain}

I'll review your request and get back to you soon.

Best regards,
Krishna Sharma
    """.strip()

    return html_body, plain_body


def _build_owner_notification_email(
    visitor_name: str,
    visitor_email: str,
    reason: str,
    message: str = "",
    mobile_number: str = "",
    about_user: str = "",
) -> tuple[str, str]:
    """Build HTML and plain-text notification email for the portfolio owner."""

    # Build optional fields HTML
    optional_html = ""
    if mobile_number:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">Phone:</strong> {mobile_number}</p>'
    if about_user:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">About Visitor:</strong> {about_user}</p>'
    if message:
        optional_html += f'<p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">Message:</strong> {message}</p>'

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #1a1a2e;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <img src="cid:sia_logo" alt="SIA" style="height: 48px; width: auto; vertical-align: middle;" />
                <img src="cid:sia_logo_name" alt="SIA" style="height: 32px; width: auto; vertical-align: middle; margin-left: -8px;" />
            </div>
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">🔔 New Connection Request</h1>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                Someone wants to connect with you through your portfolio AI assistant:
            </p>
            <div style="background: #111827; border-left: 3px solid #22c55e; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">Name:</strong> {visitor_name}</p>
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">Email:</strong> <a href="mailto:{visitor_email}" style="color: #7aa2f7;">{visitor_email}</a></p>
                <p style="margin: 4px 0; color: #d0d0d0;"><strong style="color: #4ade80;">Reason:</strong> {reason}</p>
                {optional_html}
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                A confirmation email has already been sent to the visitor. The connection has been saved to your dashboard.
            </p>
        </div>
        <div style="background: #111827; padding: 16px 32px; text-align: center; font-size: 12px; color: #666;">
            SIA — Portfolio AI Assistant Notification
        </div>
    </div>
    """

    # Build plain text optional fields
    optional_plain = ""
    if mobile_number:
        optional_plain += f"\nPhone: {mobile_number}"
    if about_user:
        optional_plain += f"\nAbout Visitor: {about_user}"
    if message:
        optional_plain += f"\nMessage: {message}"

    plain_body = f"""
🔔 New Connection Request from Portfolio

Name: {visitor_name}
Email: {visitor_email}
Reason: {reason}{optional_plain}

A confirmation email has been sent to the visitor.
The connection has been saved to your dashboard.
    """.strip()

    return html_body, plain_body


# ─────────────────────── LangChain Tools ─────────────────────────

@tool
async def send_connection_email(
    visitor_name: str,
    visitor_email: str,
    reason: str,
    message: str = "",
    mobile_number: str = "",
    about_user: str = "",
    session_id: str = "",
) -> str:
    """
    Send a connection/confirmation email after a visitor confirms they want to connect.
    This does THREE things:
      1. Sends a confirmation email to the VISITOR (thanking them)
      2. Sends a notification email to YOU (the portfolio owner) with the visitor's details
      3. Stores the connection request in the database (Krishna's dashboard)

    ONLY call this tool AFTER the visitor has reviewed and confirmed all their details.
    Do NOT call this if the visitor wants to edit their info — let them edit first.

    Args:
        visitor_name: The visitor's full name.
        visitor_email: The visitor's email address.
        reason: Why they want to connect (e.g., "job opportunity", "collaboration", "freelance project").
        message: Optional additional message from the visitor.
        mobile_number: Optional mobile/phone number of the visitor.
        about_user: Optional brief description about the visitor (who they are, what they do).
        session_id: The chat session ID for tracking (passed automatically).

    Returns:
        A JSON string with the result status.
    """

    # Validate inputs
    if not visitor_name or not visitor_email or not reason:
        return json.dumps({
            "success": False,
            "error": "Missing required fields: visitor_name, visitor_email, and reason are all required."
        })

    if "@" not in visitor_email or "." not in visitor_email:
        return json.dumps({
            "success": False,
            "error": "Invalid email address format."
        })

    # ── Rate Limiting Checks ──────────────────────────────────────────
    # 1. Same email can only receive a connection once per 7 days
    # 2. Each session can send to max 2 unique email addresses
    try:
        async with httpx.AsyncClient() as client:
            check_resp = await client.post(
                f"{NEXTJS_API_URL}/connection/check",
                json={"email": visitor_email, "sessionId": session_id},
                timeout=10.0,
            )
            if check_resp.status_code == 200:
                check_data = check_resp.json()
                if not check_data.get("canSend", True):
                    reason_msg = check_data.get("reason", "Rate limit exceeded.")
                    print(f"⚠️ Rate limit blocked: {reason_msg}")
                    return json.dumps({
                        "success": False,
                        "error": reason_msg,
                        "rate_limited": True,
                    })
    except Exception as e:
        print(f"⚠️ Could not check rate limits (proceeding anyway): {e}")

    results = {
        "visitor_email_sent": False,
        "owner_notification_sent": False,
        "stored_in_dashboard": False,
    }

    # 1. Send confirmation to visitor
    v_html, v_plain = _build_visitor_confirmation_email(
        visitor_name, visitor_email, reason, message, mobile_number, about_user
    )
    results["visitor_email_sent"] = _send_email(
        to_email=visitor_email,
        subject="Thanks for connecting — Krishna Sharma",
        html_body=v_html,
        plain_body=v_plain,
    )

    # 2. Send notification to owner (you)
    if OWNER_EMAIL:
        o_html, o_plain = _build_owner_notification_email(
            visitor_name, visitor_email, reason, message, mobile_number, about_user
        )
        results["owner_notification_sent"] = _send_email(
            to_email=OWNER_EMAIL,
            subject=f"🔔 Portfolio Connection: {visitor_name} — {reason}",
            html_body=o_html,
            plain_body=o_plain,
        )

    # 3. Store connection in MongoDB via Next.js API
    results["stored_in_dashboard"] = await _store_connection_to_db(
        visitor_name=visitor_name,
        visitor_email=visitor_email,
        reason=reason,
        message=message,
        mobile_number=mobile_number,
        about_user=about_user,
        session_id=session_id,
    )

    if results["visitor_email_sent"]:
        return json.dumps({
            "success": True,
            "message": f"Confirmation email sent to {visitor_name} at {visitor_email}. Owner notified: {results['owner_notification_sent']}. Saved to dashboard: {results['stored_in_dashboard']}.",
        })
    else:
        return json.dumps({
            "success": False,
            "error": "Failed to send confirmation email. Please check Gmail credentials.",
            "dashboard_stored": results["stored_in_dashboard"],
        })


# ─────────────────────── Convenience: all tools list ─────────────

email_tools = [
    send_connection_email,
]
