import sys
import os
import uuid
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app


def test_signup_and_login():
    unique = uuid.uuid4().hex[:8]
    email = f"testuser_{unique}@example.com"
    payload = {
        "username": f"testuser_{unique}",
        "email": email,
        "password": "TestPass123!",
        "country_code": "US"
    }
    with TestClient(app) as client:
        res = client.post('/auth/signup', json=payload)
        assert res.status_code in (200, 201)
        data = res.json()
        assert 'access_token' in data

        login_res = client.post(
            '/auth/login',
            json={
                "email": email,
                "password": "TestPass123!"})
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert 'access_token' in login_data
