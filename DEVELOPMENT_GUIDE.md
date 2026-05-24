# GramMate Development Guide

Complete setup and development instructions for the GramMate project.

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git

### Setup

1. **Clone Repository**
```bash
git clone https://github.com/evilhere7/GramMate.git
cd GramMate
```

2. **Environment Variables**
```bash
# Copy example env file
cp .env.example .env

# Update with your credentials:
# - Firebase credentials
# - Stripe API keys
# - Database password
# - JWT secret
```

3. **Start Services**
```bash
docker-compose up -d
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Frontend Development

### Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
echo "NEXT_PUBLIC_FIREBASE_CONFIG={...}" >> .env.local
```

### Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Core UI components (Button, Input, Card)
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   ├── feed/            # Feed components (VideoCard, EngagementOverlay)
│   │   └── creator/         # Creator components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── store/               # State management (Zustand)
│   ├── types/               # TypeScript types
│   └── design-system/       # Design tokens
├── public/                  # Static assets
└── package.json
```

### Key Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Component Development

Create new components in `src/components/`:

```typescript
// Example: Creating a new component
import React from 'react';
import styled from 'styled-components';
import { tokens } from '@/design-system/tokens';

const Container = styled.div`
  // Your styles here using tokens
`;

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  return (
    <Container>
      {/* Component content */}
    </Container>
  );
};
```

### Design System Usage

All components should use the design tokens for consistency:

```typescript
import { tokens } from '@/design-system/tokens';

// Colors
tokens.COLORS.purple.bright  // #8E48FF
tokens.COLORS.blue.bright    // #36D0FF
tokens.COLORS.background.base  // #05070F

// Spacing
tokens.SPACING.xs   // 8px
tokens.SPACING.md   // 16px
tokens.SPACING.lg   // 24px

// Motion
tokens.MOTION.EASE_OUT  // cubic-bezier(0.16, 1, 0.3, 1)
tokens.MOTION.DURATION_STANDARD  // 200ms

// Typography
tokens.TYPOGRAPHY.headings.h1  // Font specs
tokens.TYPOGRAPHY.body.regular  // Font specs
```

---

## Backend Development

### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://grammate:grammate_dev_password@localhost:5432/grammate

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Firebase
FIREBASE_CREDENTIALS_JSON={...}

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=grammate-uploads

# Environment
ENVIRONMENT=development
DEBUG=true
```

### Start Development Server

```bash
# Option 1: Direct
python main.py

# Option 2: With reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Docker
docker-compose up backend
```

### Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # API endpoints
│   ├── services/
│   │   └── core_services.py   # Business logic
│   ├── models/
│   │   └── *.py               # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── *.py               # Pydantic schemas
│   ├── core/
│   │   ├── security.py        # Auth, JWT, password hashing
│   │   ├── config.py          # Settings
│   │   └── constants.py       # Magic numbers
│   ├── cache/
│   │   └── redis.py           # Redis client
│   ├── database/
│   │   └── db.py              # Database setup
│   └── tasks/
│       └── celery_tasks.py    # Async tasks
├── main.py                    # FastAPI app
└── requirements.txt
```

### Creating Endpoints

Add new routes in `app/api/routes.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from app.services.core_services import VideoService

router = APIRouter(prefix="/videos", tags=["videos"])

@router.get("/{video_id}")
async def get_video(
    video_id: str,
    current_user = None,
    db = None
):
    """Get video details."""
    service = VideoService(db)
    video = service.get_video_by_id(video_id, current_user.id)
    
    if not video:
        raise HTTPException(status_code=404, detail="Not found")
    
    return video
```

### Creating Services

Add business logic in `app/services/core_services.py`:

```python
class VideoService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_video_by_id(self, video_id: str, viewer_id: str = None):
        # Implement business logic
        pass
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test
pytest tests/test_auth.py::test_login

# Run with verbose output
pytest -v
```

### Key Commands

```bash
# Development server
python main.py

# Database migrations
alembic upgrade head

# Run tests
pytest

# Format code
black app/

# Lint
flake8 app/

# Type checking
mypy app/
```

---

## Database

### Connection String

```
postgresql://user:password@host:port/database
```

### Local Development

```bash
# Using Docker Compose
docker-compose up postgres

# Using local PostgreSQL
createdb grammate
psql grammate < schema.sql
```

### Running Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply all migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Show migration status
alembic current
```

---

## Redis Caching

### Local Setup

```bash
# Using Docker
docker-compose up redis

# Using local Redis
redis-server
```

### Usage

```python
from app.cache.redis import cache

# Set value
cache.set("key", "value", ttl=300)

# Get value
value = cache.get("key")

# Delete value
cache.delete("key")

# Increment counter
cache.incr("counter")
```

### Cache Keys Pattern

```
user:{user_id}:profile
user:{user_id}:feed:{page}
video:{video_id}:detail
video:{video_id}:analytics
trending:videos:{period}
```

---

## API Documentation

Once backend is running:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Example Requests

**Authentication**

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "username": "username",
    "display_name": "User Name"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Videos**

```bash
# Get feed
curl -X GET http://localhost:8000/api/v1/videos/feed \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get video
curl -X GET http://localhost:8000/api/v1/videos/{video_id} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Like video
curl -X POST http://localhost:8000/api/v1/videos/{video_id}/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Debugging

### Frontend

```bash
# Enable React DevTools
# Install browser extension: React Developer Tools

# Console logs
console.log('Debug message')

# Network tab
# Check API calls and responses in Network tab

# Performance
# Use Lighthouse in Chrome DevTools
```

### Backend

```bash
# Logging
import logging
logger = logging.getLogger(__name__)
logger.info("Message")
logger.error("Error")

# Debug mode
# Set DEBUG=true in .env

# Database queries
# Enable query logging in SQLAlchemy
engine = create_engine(DATABASE_URL, echo=True)
```

---

## Deployment

### Docker Build

```bash
# Frontend
docker build -t grammate-frontend ./frontend

# Backend
docker build -t grammate-backend ./backend

# Run locally
docker-compose up
```

### Production Checklist

- [ ] Set strong JWT_SECRET_KEY
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set database password
- [ ] Enable rate limiting
- [ ] Configure monitoring/alerts
- [ ] Set up automated backups
- [ ] Enable audit logging
- [ ] Review security headers
- [ ] Test payment processing

---

## Troubleshooting

### Frontend Issues

**Problem**: Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Problem**: Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Backend Issues

**Problem**: Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL
```

**Problem**: Port 8000 already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

**Problem**: Migrations failed
```bash
# Check migration status
alembic current

# Downgrade and retry
alembic downgrade -1
alembic upgrade head
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

### Code Style

**Frontend**: Prettier + ESLint
```bash
npm run format
npm run lint
```

**Backend**: Black + Flake8
```bash
black app/
flake8 app/
```

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## Support

For issues and questions:
1. Check existing issues on GitHub
2. Create detailed bug report with reproduction steps
3. Include environment info (OS, Node version, Python version)
4. Share relevant error messages and logs

---

Last Updated: May 24, 2026
