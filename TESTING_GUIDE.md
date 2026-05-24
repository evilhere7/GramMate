# GramMate Testing Guide

Comprehensive testing strategies and examples for both frontend and backend.

## Backend Testing

### Test Structure

```
backend/tests/
├── conftest.py              # Pytest fixtures
├── test_auth.py             # Authentication tests
├── test_videos.py           # Video endpoint tests
├── test_wallet.py           # Wallet endpoint tests
├── test_users.py            # User endpoint tests
└── fixtures/
    ├── users.json           # Test data
    ├── videos.json
    └── transactions.json
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::test_login_success

# Run with coverage report
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v

# Run tests that match pattern
pytest -k "auth" -v

# Stop on first failure
pytest -x

# Show print statements
pytest -s
```

### Backend Test Examples

**Authentication Tests** (`tests/test_auth.py`)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import User

client = TestClient(app)

@pytest.fixture
def test_user_data():
    """Test user data."""
    return {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "username": "testuser",
        "display_name": "Test User"
    }

@pytest.fixture
def authenticated_user(db, test_user_data):
    """Create test user."""
    user = User(**test_user_data)
    db.add(user)
    db.commit()
    return user

class TestAuthentication:
    
    def test_register_success(self, test_user_data):
        """Test successful registration."""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 201
        assert response.json()["user"]["email"] == test_user_data["email"]
        assert "access_token" in response.json()
    
    def test_register_duplicate_email(self, db, authenticated_user, test_user_data):
        """Test registration with duplicate email."""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_login_success(self, authenticated_user, test_user_data):
        """Test successful login."""
        credentials = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/v1/auth/login", json=credentials)
        assert response.status_code == 200
        assert response.json()["user"]["id"] == authenticated_user.id
        assert "access_token" in response.json()
    
    def test_login_invalid_password(self, authenticated_user, test_user_data):
        """Test login with invalid password."""
        credentials = {
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        }
        response = client.post("/api/v1/auth/login", json=credentials)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user."""
        credentials = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        response = client.post("/api/v1/auth/login", json=credentials)
        assert response.status_code == 401
```

**Video Tests** (`tests/test_videos.py`)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Video

client = TestClient(app)

class TestVideos:
    
    def test_create_video_success(self, client_with_auth):
        """Test creating a video."""
        video_data = {
            "title": "Test Video",
            "description": "Test Description",
            "category": "gaming",
            "tags": ["test", "video"]
        }
        response = client_with_auth.post(
            "/api/v1/videos",
            json=video_data
        )
        assert response.status_code == 201
        assert response.json()["title"] == video_data["title"]
        assert response.json()["status"] == "draft"
    
    def test_create_video_non_creator(self, client_with_auth_non_creator):
        """Test non-creator cannot upload."""
        response = client_with_auth_non_creator.post(
            "/api/v1/videos",
            json={"title": "Test"}
        )
        assert response.status_code == 403
        assert "Only creators" in response.json()["detail"]
    
    def test_get_video_success(self, video, client_with_auth):
        """Test getting video details."""
        response = client_with_auth.get(f"/api/v1/videos/{video.id}")
        assert response.status_code == 200
        assert response.json()["id"] == video.id
        assert response.json()["title"] == video.title
    
    def test_get_video_not_found(self, client_with_auth):
        """Test getting non-existent video."""
        response = client_with_auth.get("/api/v1/videos/nonexistent")
        assert response.status_code == 404
    
    def test_like_video(self, video, client_with_auth):
        """Test liking a video."""
        response = client_with_auth.post(
            f"/api/v1/videos/{video.id}/like"
        )
        assert response.status_code == 204
        
        # Verify like was recorded
        video_response = client_with_auth.get(f"/api/v1/videos/{video.id}")
        assert video_response.json()["is_liked"] == True
        assert video_response.json()["like_count"] >= 1
    
    def test_like_video_twice(self, video, client_with_auth):
        """Test liking same video twice is idempotent."""
        # First like
        response1 = client_with_auth.post(f"/api/v1/videos/{video.id}/like")
        assert response1.status_code == 204
        
        # Second like (should not create duplicate)
        response2 = client_with_auth.post(f"/api/v1/videos/{video.id}/like")
        assert response2.status_code == 204
        
        # Verify only one like
        video_response = client_with_auth.get(f"/api/v1/videos/{video.id}")
        like_count = video_response.json()["like_count"]
        # Should have exactly 1 like (or previous count + 1)
```

**Wallet Tests** (`tests/test_wallet.py`)

```python
import pytest
from decimal import Decimal

class TestWallet:
    
    def test_get_wallet_balance(self, client_with_auth):
        """Test getting wallet balance."""
        response = client_with_auth.get("/api/v1/wallet/balance")
        assert response.status_code == 200
        data = response.json()
        assert "available_balance" in data
        assert "pending_balance" in data
        assert "total_earned" in data
        assert data["available_balance"] >= 0
    
    def test_get_transactions(self, client_with_auth, transaction):
        """Test getting transaction history."""
        response = client_with_auth.get("/api/v1/wallet/transactions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) > 0
        
        first_tx = response.json()[0]
        assert "id" in first_tx
        assert "type" in first_tx
        assert "amount" in first_tx
        assert "status" in first_tx
    
    def test_withdraw_sufficient_balance(self, client_with_auth, wallet_with_balance):
        """Test withdrawal with sufficient balance."""
        withdraw_data = {
            "amount": 50.00,
            "payout_method_id": "method-123"
        }
        response = client_with_auth.post(
            "/api/v1/wallet/withdraw",
            json=withdraw_data
        )
        assert response.status_code == 201
        assert response.json()["status"] == "pending"
    
    def test_withdraw_insufficient_balance(self, client_with_auth):
        """Test withdrawal with insufficient balance."""
        withdraw_data = {
            "amount": 10000.00,
            "payout_method_id": "method-123"
        }
        response = client_with_auth.post(
            "/api/v1/wallet/withdraw",
            json=withdraw_data
        )
        assert response.status_code == 400
        assert "Insufficient balance" in response.json()["detail"]
```

### Pytest Fixtures (`tests/conftest.py`)

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.models import Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

@pytest.fixture
def db():
    """Database session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    """Test client."""
    return TestClient(app)

@pytest.fixture
def client_with_auth(client, authenticated_user):
    """Authenticated test client."""
    token = create_access_token(data={"sub": authenticated_user.id})
    client.headers = {"Authorization": f"Bearer {token}"}
    return client

@pytest.fixture
def authenticated_user(db):
    """Create test user."""
    from app.models import User
    from app.core.security import hash_password
    
    user = User(
        email="test@example.com",
        username="testuser",
        display_name="Test User",
        password_hash=hash_password("SecurePass123!"),
        is_creator=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def video(db, authenticated_user):
    """Create test video."""
    from app.models import Video
    from datetime import datetime
    
    video = Video(
        title="Test Video",
        description="Test Description",
        category="gaming",
        status="approved",
        user_id=authenticated_user.id,
        published_at=datetime.utcnow()
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video
```

---

## Frontend Testing

### Test Structure

```
frontend/__tests__/
├── components/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Card.test.tsx
│   └── VideoCard.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   ├── useFeed.test.ts
│   └── useWallet.test.ts
└── pages/
    ├── LoginPage.test.tsx
    └── FeedPage.test.tsx
```

### Running Tests

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode
npm run test -- --watch

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- Button.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="Button"
```

### Frontend Test Examples

**Component Tests**

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/CoreComponents';

describe('Button Component', () => {
  
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies variant styles', () => {
    const { container } = render(<Button variant="primary">Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveStyle('background: linear-gradient');
  });
  
  it('disables button when disabled prop is true', () => {
    render(<Button isDisabled>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
  
  it('shows loading spinner when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    // Text should be visible but button disabled
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Hook Tests**

```typescript
// hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks';

describe('useAuth Hook', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('initializes with no user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
  
  it('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
  
  it('logs out user', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    // Then logout
    await act(async () => {
      await result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });
  
  it('handles login error', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      try {
        await result.current.login('invalid@example.com', 'wrongpassword');
      } catch (err) {
        // Expected error
      }
    });
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

**Page Tests**

```typescript
// pages/FeedPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { FeedPage } from '@/pages/FeedPage';
import { useAuth } from '@/hooks';

jest.mock('@/hooks');

describe('FeedPage', () => {
  
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true
    });
  });
  
  it('renders feed page', async () => {
    render(<FeedPage />);
    await waitFor(() => {
      expect(screen.getByText(/Home Feed/i)).toBeInTheDocument();
    });
  });
  
  it('loads videos on mount', async () => {
    render(<FeedPage />);
    await waitFor(() => {
      expect(screen.getAllByRole('presentation')).toHaveLength(20);
    });
  });
  
  it('loads more videos on scroll', async () => {
    render(<FeedPage />);
    
    // Scroll to bottom
    window.scrollY = window.innerHeight + 1000;
    fireEvent.scroll(window, { target: { scrollY: 10000 } });
    
    await waitFor(() => {
      expect(screen.getAllByRole('presentation')).toHaveLength(40);
    });
  });
});
```

---

## Test Coverage Goals

- Backend: Aim for > 80% coverage
- Frontend: Aim for > 70% coverage
- Critical paths: 100% coverage

## Test Naming Convention

```
test_<feature>_<scenario>_<expected_result>

Examples:
- test_login_with_valid_credentials_returns_token
- test_create_video_without_title_returns_400
- test_like_video_twice_is_idempotent
```

## Mock Strategies

### API Mocks

```typescript
// jest.setup.ts
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});
```

### Database Mocks

```python
# tests/conftest.py - Use SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
```

---

## CI/CD Testing

Tests should run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

---

Last Updated: May 24, 2026
