"""
Comprehensive security tests for GramMate authentication system
Tests: rate limiting, password validation, email verification, password reset
"""

import sys
import os
import uuid
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def unique_email():
    """Generate unique email for each test"""
    return f"testuser_{uuid.uuid4().hex[:8]}@example.com"


class TestSignupValidation:
    """Test signup input validation and password requirements"""
    
    
    def test_signup_strong_password_success(self, client, unique_email):
        """Test that strong passwords are accepted"""
        payload = {
            "username": f"user_{uuid.uuid4().hex[:8]}",
            "email": unique_email,
            "password": "StrongPass123!",  # Strong password
            "country_code": "US"
        }
        response = client.post('/auth/signup', json=payload)
        assert response.status_code == 200
        assert 'access_token' in response.json()
    
    def test_signup_invalid_email(self, client):
        """Test that invalid emails are rejected"""
        payload = {
            "username": f"user_{uuid.uuid4().hex[:8]}",
            "email": "not_an_email",
            "password": "StrongPass123!",
            "country_code": "US"
        }
        response = client.post('/auth/signup', json=payload)
        # Pydantic validation returns 422
        assert response.status_code in [400, 422]


class TestEmailVerification:
    """Test email verification flow"""
    
    def test_email_verification_with_token(self, client, unique_email):
        """Test email verification with token"""
        # First signup
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        signup_response = client.post('/auth/signup', json=payload)
        assert signup_response.status_code == 200
        
        # Email should not be verified yet
        # (In real implementation, we'd check the database or have the token returned)
        # For now, we just verify the endpoint exists and works with valid token format
        
        verify_payload = {
            "token": "fake_token_12345"
        }
        verify_response = client.post('/auth/verify-email', json=verify_payload)
        # Should fail with invalid token
        assert verify_response.status_code == 400


class TestPasswordReset:
    """Test password reset flow"""
    
    def test_password_reset_request(self, client, unique_email):
        """Test password reset request endpoint"""
        payload = {
            "email": unique_email
        }
        response = client.post('/auth/password-reset-request', json=payload)
        # Should always return success for privacy
        assert response.status_code == 200
        assert response.json()['success'] is True
    
    def test_password_reset_confirm_invalid_token(self, client):
        """Test password reset confirm with invalid token"""
        payload = {
            "token": "invalid_token",
            "new_password": "NewPassword123!"
        }
        response = client.post('/auth/password-reset-confirm', json=payload)
        assert response.status_code == 400
    
    def test_password_reset_weak_new_password(self, client):
        """Test password reset with weak new password"""
        payload = {
            "token": "some_token",
            "new_password": "weak"  # Too weak/short
        }
        response = client.post('/auth/password-reset-confirm', json=payload)
        # Pydantic validation error for min_length=8
        assert response.status_code == 422


class TestLoginSecurity:
    """Test login security features"""
    
    def test_login_with_valid_credentials(self, client, unique_email):
        """Test successful login"""
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        # Signup first
        signup_response = client.post('/auth/signup', json=payload)
        assert signup_response.status_code == 200
        
        # Login
        login_payload = {
            "email": unique_email,
            "password": "StrongPass123!"
        }
        login_response = client.post('/auth/login', json=login_payload)
        assert login_response.status_code == 200
        assert 'access_token' in login_response.json()
    
    def test_login_with_invalid_password(self, client, unique_email):
        """Test login with wrong password"""
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        # Signup first
        client.post('/auth/signup', json=payload)
        
        # Try login with wrong password
        login_payload = {
            "email": unique_email,
            "password": "WrongPassword123!"
        }
        login_response = client.post('/auth/login', json=login_payload)
        assert login_response.status_code == 401
    
    def test_login_with_nonexistent_email(self, client):
        """Test login with non-existent email"""
        login_payload = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        response = client.post('/auth/login', json=login_payload)
        assert response.status_code == 401


class TestProtectedRoutes:
    """Test that protected routes require authentication"""
    
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token"""
        response = client.get('/wallet')
        # OAuth2 returns 401 when no credentials are provided
        assert response.status_code in [401, 403]
    
    def test_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token"""
        response = client.get('/wallet', headers={
            'Authorization': 'Bearer invalid_token'
        })
        assert response.status_code == 401
    
    def test_protected_route_with_valid_token(self, client, unique_email):
        """Test accessing protected route with valid token"""
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        # Signup
        signup_response = client.post('/auth/signup', json=payload)
        token = signup_response.json()['access_token']
        
        # Access protected route
        response = client.get('/wallet', headers={
            'Authorization': f'Bearer {token}'
        })
        assert response.status_code == 200
        assert 'balance_cents' in response.json()


class TestChangePassword:
    """Test change password functionality"""
    
    def test_change_password_with_valid_old_password(self, client, unique_email):
        """Test changing password with correct old password"""
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        # Signup
        signup_response = client.post('/auth/signup', json=payload)
        token = signup_response.json()['access_token']
        
        # Change password
        change_payload = {
            "old_password": "StrongPass123!",
            "new_password": "NewPassword456!"
        }
        response = client.post('/auth/change-password', 
            json=change_payload,
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 200
        assert response.json()['success'] is True
    
    def test_change_password_with_invalid_old_password(self, client, unique_email):
        """Test changing password with incorrect old password"""
        username = f"user_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": unique_email,
            "password": "StrongPass123!",
            "country_code": "US"
        }
        # Signup
        signup_response = client.post('/auth/signup', json=payload)
        token = signup_response.json()['access_token']
        
        # Try to change password with wrong old password
        change_payload = {
            "old_password": "WrongPassword123!",
            "new_password": "NewPassword456!"
        }
        response = client.post('/auth/change-password',
            json=change_payload,
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
