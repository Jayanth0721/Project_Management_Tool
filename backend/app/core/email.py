import smtplib
import logging
from email.mime.text import MIMEText
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.smtp_configured:
        logger.info("[email] SMTP not configured — would send to %s: %s", to, subject)
        logger.info("[email] Body preview: %s", body[:200])
        return False

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to], msg.as_string())
        logger.info("[email] Sent to %s: %s", to, subject)
        return True
    except Exception as exc:
        logger.warning("[email] Failed to send to %s: %s", to, exc)
        return False


def send_invitation_email(to: str, workspace_name: str, invite_url: str) -> bool:
    body = f"""
    <h2>You're invited to {workspace_name}</h2>
    <p>Click the link below to join:</p>
    <p><a href="{invite_url}">{invite_url}</a></p>
    """
    return send_email(to, f"Invitation to {workspace_name}", body)


def send_password_reset_email(to: str, reset_url: str) -> bool:
    body = f"""
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>This link expires in 1 hour.</p>
    """
    return send_email(to, "Password Reset Request", body)
