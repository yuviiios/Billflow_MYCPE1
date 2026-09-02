import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import requests


def send_invoice_email(
    to_email: str,
    client_name: str,
    invoice_number: str,
    public_url: str,
    business_name: str = "My Business",
) -> bool:
    """
    Send invoice email to client.

    Supports:
    - Resend API (if RESEND_API_KEY is set)
    - SMTP (if SMTP_* env vars are set)
    - Console logging only (fallback for development)
    """
    subject = f"Invoice {invoice_number} from {business_name}"
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000;">Invoice {invoice_number}</h2>
          <p>Hello {client_name},</p>
          <p>Thank you for your business. Please find your invoice below:</p>
          <div style="margin: 30px 0;">
            <a href="{public_url}"
               style="display: inline-block; padding: 12px 24px; background-color: #000;
                      color: #fff; text-decoration: none; border-radius: 4px;">
              View Invoice
            </a>
          </div>
          <p>You can view and pay your invoice online by clicking the button above.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            {business_name}
          </p>
        </div>
      </body>
    </html>
    """

    text_body = f"""
Invoice {invoice_number}

Hello {client_name},

Thank you for your business. Please find your invoice at:
{public_url}

Best regards,
{business_name}
    """.strip()

    # Try Resend first
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        return _send_via_resend(to_email, subject, html_body, text_body, resend_key)

    # Try SMTP
    smtp_host = os.getenv("SMTP_HOST")
    if smtp_host:
        return _send_via_smtp(to_email, subject, html_body, text_body)

    # Fallback: log to console
    print("=" * 60)
    print("EMAIL SENDING (Development Mode)")
    print("=" * 60)
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Public URL: {public_url}")
    print("=" * 60)
    return True


def _send_via_resend(
    to_email: str, subject: str, html_body: str, text_body: str, api_key: str
) -> bool:
    """Send email via Resend API."""
    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            },
            timeout=10,
        )
        response.raise_for_status()
        print(f"Email sent via Resend to {to_email}")
        return True
    except Exception as e:
        print(f"Resend error: {e}")
        return False


def _send_via_smtp(
    to_email: str, subject: str, html_body: str, text_body: str
) -> bool:
    """Send email via SMTP."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)

        print(f"Email sent via SMTP to {to_email}")
        return True
    except Exception as e:
        print(f"SMTP error: {e}")
        return False
