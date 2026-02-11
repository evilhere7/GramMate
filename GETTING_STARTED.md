# GramMate: Quick Start Guide

Getting the GramMate platform up and running locally for development and testing.

## Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 16+ and npm
- Python 3.9+ (for local development without Docker)
- Git

## Option 1: Using Docker Compose (Recommended)

### Start All Services

```bash
# Navigate to project root
cd /workspaces/GramMate

# Start PostgreSQL, Redis, Backend, and Frontend
docker-compose up -d

# Check status
docker-compose ps
```

**Services:**
- **PostgreSQL:** localhost:5432 (user: `grammate`, password: `grammate_dev_password`)
- **Redis:** localhost:6379
- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs (Swagger UI)

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

---

## Option 2: Local Development Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./grammate.db
SECRET_KEY=dev-secret-key-change-in-prod
STRIPE_API_KEY=sk_test_dummy
PLAID_CLIENT_ID=test_id
PLAID_SECRET=test_secret
PLAID_ENV=sandbox
EOF

# Run backend
python main.py
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at `http://localhost:3000`

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest tests/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run tests in watch mode
npm test

# Run tests once
npm test -- --watchAll=false
```

---

## Development Workflow

### Making API Requests

```bash
# Health check
curl http://localhost:8000/health

# User signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "country_code": "US"
  }'

# Get wallet (requires auth token)
curl http://localhost:8000/wallet \
  -H "Authorization: Bearer <your_token_here>"
```

### Database Management

#### Using SQLite (Local Dev)
Database is automatically created at `backend/grammate.db`

#### Using PostgreSQL with Docker
```bash
# Connect to database
docker exec -it grammate-db psql -U grammate -d grammate

# Common commands
\dt              # List tables
\q               # Quit
SELECT * FROM users;
```

### Frontend Development

Hot reload is enabled by default. Edit files in `frontend/src` and changes will reflect immediately in the browser.

---

## Project Structure

```
GramMate/
├── backend/
│   ├── main.py              # FastAPI app + core endpoints
│   ├── advanced_features.py # Analytics, payouts, fraud, moderation
│   ├── requirements.txt     # Python dependencies
│   ├── tests/               # Unit tests
│   ├── Dockerfile           # Backend container
│   └── alembic/             # Database migrations
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── App.jsx          # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json         # npm dependencies
│   ├── Dockerfile           # Frontend container
│   └── public/              # Static assets
├── docker-compose.yml       # Container orchestration
└── docs/                    # Documentation
```

---

## Key Features

### MVP (Currently Implemented)

✅ User authentication (signup/login)  
✅ Video upload & publishing  
✅ Feed (chronological)  
✅ Engagement tracking (views, likes)  
✅ Reward system  
✅ Wallet & balance management  
✅ Basic moderation  
✅ Creator profiles  
✅ Analytics dashboard  

### V1.0 (Coming Soon)

- AI recommendation engine
- Advanced creator analytics
- Brand/advertiser marketplace
- Payout processing (Stripe Connect)
- Creator verification tiers
- International expansion

---

## Environment Variables

### Backend

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | Database connection | `sqlite:///:memory:` |
| `SECRET_KEY` | JWT signing key | `dev-secret-key-change-in-prod` |
| `STRIPE_API_KEY` | Stripe integration | `sk_test_dummy` |
| `PLAID_CLIENT_ID` | Plaid integration | `dummy` |
| `PLAID_SECRET` | Plaid secret | `dummy` |
| `PLAID_ENV` | Plaid environment | `sandbox` |

### Frontend

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_URL` | Backend API URL (default: `http://localhost:8000`) |

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process
kill -9 <PID>
```

### Database Issues

```bash
# Reset SQLite database
rm backend/grammate.db

# Reset PostgreSQL (Docker)
docker-compose down -v
docker-compose up -d
```

### Tests Failing

```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt --force-reinstall

# Clear pytest cache
pytest --cache-clear

# Run with verbose output
pytest -vvv
```

### Frontend Won't Start

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## Useful Commands

```bash
# Format backend code
black backend/

# Check Python style
flake8 backend/

# Frontend linting
cd frontend && npm run lint

# Generate API documentation
# Available at http://localhost:8000/docs

# Database migrations (Alembic)
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

---

## Performance Targets (MVP)

| Metric | Target |
|--------|--------|
| API response time | <200ms (p95) |
| Feed load time | <500ms |
| Reward calculation | <100ms |
| Video upload | <5s (for small files) |
| Database query | <50ms (p95) |
| Uptime | 99.5% |

---

## Security Checklist

- [ ] Change `SECRET_KEY` from default
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Implement request validation
- [ ] Use prepared statements (SQLAlchemy ORM)
- [ ] Enable password hashing (bcrypt)
- [ ] Add request logging
- [ ] Monitor suspicious activity

---

## Next Steps

1. **Run the application:** `docker-compose up -d`
2. **Create an account:** Visit frontend and sign up
3. **Upload a video:** Test the upload flow
4. **Track engagement:** View a video and check reward calculation
5. **View wallet:** Check your earnings

---

## Getting Help

### Documentation
- API Endpoints: See [API_ENDPOINTS.md](API_ENDPOINTS.md)
- Architecture: See [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)
- Roadmap: See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

### Common Issues

**Q: Backend won't start**  
A: Check that port 8000 is available and database URL is correct

**Q: Tests failing**  
A: Run `pytest --cache-clear` and ensure database is properly created

**Q: Frontend showing blank page**  
A: Check browser console for errors and ensure backend is running

---

## Production Deployment

For production deployment, see [BLUEPRINT.md](BLUEPRINT.md) and [GTM_GROWTH_STRATEGY.md](GTM_GROWTH_STRATEGY.md)

Key requirements:
- PostgreSQL RDS database
- AWS S3 for video storage
- CloudFront CDN
- ElastiCache Redis
- Application Load Balancer
- Kubernetes (EKS) for scaling

---

**Version:** 1.0.0  
**Last Updated:** February 11, 2026
