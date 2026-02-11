# 🎬 GramMate - Creator Economy Platform

A modern, Web3-enabled short-form video platform that transparently rewards both viewers and creators.

## ✨ Features

- **Creator Monetization**: Creators earn 80% of ad revenue + direct viewer payments
- **Viewer Rewards**: Earn $0.01-$0.50 per video watched
- **Non-Custodial Wallet**: Web3 integration for transparent, secure earnings
- **Real-Time Analytics**: Track performance metrics and earnings instantly
- **Content Moderation**: AI-powered content safety system
- **Fraud Detection**: Advanced bot and manipulation detection
- **Stripe Integration**: Seamless payout processing to bank accounts

## 🏗️ Architecture

### Tech Stack

**Backend**:
- FastAPI (Python 3.11+)
- PostgreSQL (primary database)
- Redis (caching & sessions)
- Stripe API (payments)
- Plaid API (bank account linking)

**Frontend**:
- React 18+ with TypeScript
- styled-components (styling)
- Axios (API client)

**Infrastructure**:
- Docker & Docker Compose (local development)
- Kubernetes (production deployment)
- AWS (S3, CloudFront, RDS)
- GitHub Actions (CI/CD)

### Database Schema

13 tables managing:
- User accounts & authentication
- Video content & metadata
- Engagement tracking (views, likes, comments, shares)
- Wallet & transaction management
- Payout history
- Ad campaigns
- Content flags & moderation
- Bans & restrictions

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 16+ (for frontend development)
- Python 3.11+ (for backend development)

### Development Setup

1. **Clone and setup**:
```bash
cd /workspaces/GramMate

# Copy environment template
cp backend/.env.example backend/.env

# Edit .env with your API keys
nano backend/.env
```

2. **Start with Docker Compose**:
```bash
docker-compose up -d
```

This spins up:
- PostgreSQL database (localhost:5432)
- Redis cache (localhost:6379)
- Backend API (localhost:8000)
- Frontend app (localhost:3000)

3. **Access the application**:
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

### Manual Setup (Without Docker)

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL database
# psql -U postgres -c "CREATE DATABASE grammate;"
# psql -U postgres -d grammate -f schema.sql

# Run development server
python -m uvicorn main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
GramMate/
├── backend/
│   ├── main.py                 # FastAPI main app (850+ lines, 18 endpoints)
│   ├── advanced_features.py    # Rate limiting, fraud detection, payouts
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   └── Dockerfile              # Backend container image
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app shell with routing
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx   # Login/signup component
│   │   │   ├── FeedPage.jsx   # Video feed (4.2KB, infinite scroll)
│   │   │   ├── UploadPage.jsx # Video upload form (7.5KB)
│   │   │   ├── WalletPage.jsx # Balance & withdrawal (8.1KB)
│   │   │   └── CreatorProfilePage.jsx  # Creator analytics (9.3KB)
│   │   └── index.js           # React entry point
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── package.json           # Node dependencies
│   └── Dockerfile             # Frontend container image
├── docker-compose.yml         # Local dev environment
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login with email/password
- `POST /auth/verify-email` - Verify email address

### Users
- `GET /users/{user_id}` - Get user profile
- `PUT /users/profile/update` - Update profile

### Videos
- `POST /videos/upload` - Upload new video
- `GET /videos/{video_id}` - Get video details
- `GET /feed` - Get personalized feed

### Engagement
- `POST /engagements/{video_id}/view` - Track video view + earn reward
- `POST /engagements/{video_id}/like` - Like video
- `POST /engagements/{video_id}/comment` - Comment on video

### Wallet
- `GET /wallet` - Get balance
- `GET /wallet/transactions` - View transaction history
- `POST /wallet/withdraw` - Initiate withdrawal

### Creators
- `GET /creators/{creator_id}` - Creator profile
- `GET /creators/{creator_id}/videos` - Creator's videos
- `GET /creators/{creator_id}/analytics` - Performance metrics

### Advanced
- `POST /fraud/check-view` - Check if view is suspicious
- `POST /moderation/review-content` - Content moderation check
- `POST /payouts/request` - Request creator payout

## 💰 Reward System

**Viewer Earnings**:
- Base reward: $0.005-$0.015 per video watched
- Duration bonus: Full watch = higher reward
- Country multipliers:
  - US: 1.2x
  - UK: 1.1x
  - India: 0.5x
- Verification bonus: +20% for email-verified users

**Creator Earnings**:
- Ad revenue share: 80% (platform takes 20%)
- Per-view rewards from viewers
- Direct sponsorship payments
- Payout threshold: $5 minimum
- Payout frequency: Weekly

## 🔐 Security Features

- JWT authentication (24-hour tokens)
- bcrypt password hashing
- Rate limiting (100 req/min per IP)
- CORS protection
- Non-custodial wallet (no money transmitter license needed)
- KYC/AML integration ready
- Content moderation pipeline
- Fraud detection system

## 📊 Analytics & Monitoring

Session tracking for:
- Video views & engagement
- User retention & growth
- Creator performance
- Revenue metrics
- Platform health

Metrics dashboard available at `/analytics`

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose exec backend pytest tests/
```

## 📦 Deployment

### To Kubernetes:
```bash
kubectl apply -f k8s/
```

### To AWS:
```bash
# Build images
docker build -t grammate-backend:latest backend/
docker build -t grammate-frontend:latest frontend/

# Push to ECR
aws ecr push-image grammate-backend:latest
aws ecr push-image grammate-frontend:latest

# Deploy via ECS or EKS
```

### Environment Variables

See `backend/.env.example` for full list. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `SECRET_KEY` - JWT signing key (change in prod!)
- `STRIPE_API_KEY` - Stripe account key
- `PLAID_CLIENT_ID` - Bank linking API
- `AWS_S3_BUCKET` - Video storage

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test locally: `docker-compose up`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📈 Roadmap

### MVP (Month 1-6)
- ✅ Core platform (feed, upload, wallet)
- ✅ Basic reward system
- ✅ User authentication
- ⏳ Stripe payout integration

### V1 (Month 7-12)
- AI recommendation engine
- Advanced creator analytics
- Brand/advertiser tools
- Mobile app (iOS/Android)

### Scale (Month 13-24)
- Web3 wallet integration
- Creator marketplace
- NFT support
- International expansion

## 📞 Support

- Documentation: See `/BLUEPRINT.md`, `/TECHNICAL_SPECIFICATION.md`
- Issues: GitHub Issues
- Email: dev@grammate.io

## 📄 License

Proprietary - GramMate Inc. All rights reserved.

---

Built with ❤️ by the GramMate team
