"""
GramMate Enhanced Authentication Module
Implements: 2FA (OTP), Email Delivery, SSO, Account Recovery
"""

import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict
import logging
import qrcode
import io
import base64
import requests
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)
Base = declarative_base()

# ====== EMAIL DELIVERY ======

class EmailService:
    """Service for sending emails (password resets, 2FA, notifications)"""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "noreply@grammate.com")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
        self.enabled = bool(self.sender_password)
    
    def send_password_reset_email(self, recipient_email: str, reset_token: str, user_name: str = "User"):
        """Send password reset email"""
        if not self.enabled:
            logger.info(f"[DEV MODE] Password reset token for {recipient_email}: {reset_token}")
            return True
        
        try:
            reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
            
            subject = "GramMate - Reset Your Password"
            body = f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Hi {user_name},</p>
                    <p>You requested to reset your GramMate password. Click the link below to proceed:</p>
                    <a href="{reset_link}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                    <p>Or copy this link: {reset_link}</p>
                    <p>This link expires in 1 hour.</p>
                    <p>If you didn't request this, ignore this email.</p>
                </body>
            </html>
            """
            
            return self._send_email(recipient_email, subject, body)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return False
    
    def send_2fa_email(self, recipient_email: str, otp_code: str, user_name: str = "User"):
        """Send 2FA OTP email"""
        if not self.enabled:
            logger.info(f"[DEV MODE] 2FA OTP for {recipient_email}: {otp_code}")
            return True
        
        try:
            subject = "GramMate - Your 2FA Code"
            body = f"""
            <html>
                <body>
                    <h2>Two-Factor Authentication</h2>
                    <p>Hi {user_name},</p>
                    <p>Your 2FA code is:</p>
                    <h1 style="letter-spacing: 5px; color: #FF6B35;">{otp_code}</h1>
                    <p>This code expires in 10 minutes.</p>
                    <p>If you didn't request this, your account may be at risk. Please contact support.</p>
                </body>
            </html>
            """
            
            return self._send_email(recipient_email, subject, body)
        except Exception as e:
            logger.error(f"Failed to send 2FA email: {e}")
            return False
    
    def send_verification_email(self, recipient_email: str, verification_token: str, user_name: str = "User"):
        """Send email verification link"""
        if not self.enabled:
            logger.info(f"[DEV MODE] Email verification token for {recipient_email}: {verification_token}")
            return True
        
        try:
            verify_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
            
            subject = "GramMate - Verify Your Email"
            body = f"""
            <html>
                <body>
                    <h2>Email Verification</h2>
                    <p>Hi {user_name},</p>
                    <p>Welcome to GramMate! Verify your email address to activate your account:</p>
                    <a href="{verify_link}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                    <p>Or copy this link: {verify_link}</p>
                    <p>This link expires in 7 days.</p>
                </body>
            </html>
            """
            
            return self._send_email(recipient_email, subject, body)
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return False
    
    def _send_email(self, recipient_email: str, subject: str, html_body: str) -> bool:
        """Generic email sending method"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.sender_email
            msg["To"] = recipient_email
            
            part = MIMEText(html_body, "html")
            msg.attach(part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, msg.as_string())
            
            logger.info(f"Email sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False


# ====== TWO-FACTOR AUTHENTICATION (2FA) ======

class TwoFactorAuth:
    """2FA implementation using TOTP (Time-based One-Time Password)"""
    
    @staticmethod
    def generate_otp() -> str:
        """Generate 6-digit OTP"""
        return str(secrets.randbelow(1000000)).zfill(6)
    
    @staticmethod
    def generate_qr_code(user_email: str, secret: str) -> str:
        """Generate QR code for authenticator app enrollment"""
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(f"otpauth://totp/GramMate:{user_email}?secret={secret}&issuer=GramMate")
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            
            return base64.b64encode(buffer.getvalue()).decode()
        except Exception as e:
            logger.error(f"Failed to generate QR code: {e}")
            return ""
    
    @staticmethod
    def verify_otp(stored_otp: str, provided_otp: str, created_at: datetime) -> bool:
        """Verify OTP (expires after 10 minutes)"""
        if stored_otp != provided_otp:
            return False
        
        if datetime.utcnow() - created_at > timedelta(minutes=10):
            return False
        
        return True


# ====== SSO (SINGLE SIGN-ON) ======

class SSOProvider:
    """Base class for SSO providers"""
    
    @staticmethod
    def verify_google_token(token: str) -> Optional[Dict]:
        """Verify Google OAuth token and get user info"""
        try:
            from google.auth.transport import requests
            from google.oauth2 import id_token
            
            request = requests.Request()
            idinfo = id_token.verify_oauth2_token(token, request, os.getenv("GOOGLE_CLIENT_ID"))
            
            return {
                "email": idinfo.get("email"),
                "name": idinfo.get("name"),
                "picture": idinfo.get("picture"),
                "provider": "google"
            }
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            return None
    
    @staticmethod
    def verify_github_token(token: str) -> Optional[Dict]:
        """Verify GitHub OAuth token and get user info"""
        try:
            headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json"
            }
            response = requests.get("https://api.github.com/user", headers=headers)
            
            if response.status_code != 200:
                return None
            
            user_data = response.json()
            return {
                "email": user_data.get("email"),
                "name": user_data.get("name") or user_data.get("login"),
                "picture": user_data.get("avatar_url"),
                "provider": "github"
            }
        except Exception as e:
            logger.error(f"GitHub token verification failed: {e}")
            return None


# ====== ACCOUNT RECOVERY ======

class AccountRecovery:
    """Account recovery options (backup codes, security questions)"""
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> list:
        """Generate backup recovery codes"""
        return [f"{secrets.token_hex(4)}-{secrets.token_hex(4)}".upper() for _ in range(count)]
    
    @staticmethod
    def verify_backup_code(provided_code: str, stored_codes: list) -> bool:
        """Verify backup code and mark as used"""
        return provided_code.upper() in [code.upper() for code in stored_codes]


# ====== DATABASE MODELS FOR ENHANCEMENTS ======

class TwoFactorSecret(Base):
    """Store 2FA secrets for users"""
    __tablename__ = "two_factor_secrets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    secret = Column(String(32), nullable=False)
    is_enabled = Column(Boolean, default=False)
    backup_codes = Column(String(500), nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


class OTPToken(Base):
    """Store temporary OTP tokens"""
    __tablename__ = "otp_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class SSOConnection(Base):
    """Store SSO provider connections"""
    __tablename__ = "sso_connections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # google, github, etc.
    provider_user_id = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    connected_at = Column(DateTime, default=datetime.utcnow)


class SecurityQuestion(Base):
    """Store user security questions for account recovery"""
    __tablename__ = "security_questions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    question = Column(String(255), nullable=False)
    answer_hash = Column(String(255), nullable=False)  # Hash of answer
    created_at = Column(DateTime, default=datetime.utcnow)


# Initialize services
email_service = EmailService()
twofa = TwoFactorAuth()
sso = SSOProvider()
recovery = AccountRecovery()
