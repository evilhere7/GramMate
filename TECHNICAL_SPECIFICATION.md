# GramMate: Technical Specification
## System Architecture, API Design, and Implementation Details

**Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Ready for Engineering

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ iOS App      │  │ Android App  │  │ Web (PWA)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS/WSS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway & Load Balancer (Nginx)                │
│  - Request routing, rate limiting (1K req/min per IP)           │
│  - SSL/TLS termination, request logging                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Auth     │  │Feed     │  │Creator  │
   │Service  │  │Service  │  │Service  │
   └─────────┘  └─────────┘  └─────────┘
        │              │              │
        ├──────────────┼──────────────┤
        │              │              │
        ▼              ▼              ▼
   ┌──────────────────────────────────────────┐
   │   Core Services Layer                    │
   │  ┌─ Video Service ────────────────────┐  │
   │  ├─ Engagement Service ───────────────┤  │
   │  ├─ Recommendation Engine (ML) ───────┤  │
   │  ├─ Wallet Service ──────────────────┤  │
   │  ├─ Payout Service ──────────────────┤  │
   │  ├─ Moderation Service ──────────────┤  │
   │  ├─ Analytics Service ───────────────┤  │
   │  └─ Notification Service ───────────┘  │
   └──────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │PostgreSQL    │ │Redis Cache   │ │Elasticsearch │
   │(user data,   │ │(sessions,    │ │(video index, │
   │videos,       │ │real-time     │ │search,       │
   │creators,     │ │feed state)   │ │trending)     │
   │payouts)      │ └──────────────┘ └──────────────┘
   └──────────────┘
        │
        ▼
   ┌──────────────────────────────────────────┐
   │   Data Layer (Kafka + Data Warehouse)    │
   │  - Event stream (views, likes, comments) │
   │  - Snowflake/BigQuery aggregation        │
   │  - ML feature store (for recommendations)│
   └──────────────────────────────────────────┘
        │
        ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │AWS S3/CDN    │ │Stripe API    │ │Third-party   │
   │(video files) │ │(payouts)     │ │(auth, SMS)   │
   └──────────────┘ └──────────────┘ └──────────────┘
```

### 1.2 Technology Stack

**Backend:**
- **Language:** Python 3.11+ (FastAPI framework)
- **Web Server:** Gunicorn + Uvicorn (async support)
- **API Framework:** FastAPI (rest + graphql via strawberry)
- **Task Queue:** Celery + RabbitMQ (async jobs: video transcoding, payouts)
- **Database:** PostgreSQL 14+ (primary), Redis 7+ (cache/sessions)
- **Search:** Elasticsearch 8+
- **Data Streaming:** Apache Kafka (event log)
- **Data Warehouse:** Snowflake (analytics/ML features)

**Machine Learning:**
- **Framework:** PyTorch 2.0+ (model inference)
- **Model Serving:** TorchServe or KServe (Kubernetes)
- **Feature Engineering:** Pandas, Polars, dbt
- **MLOps:** MLflow (model registration, versioning)

**Frontend:**
- **iOS:** Swift (SwiftUI)
- **Android:** Kotlin (Jetpack Compose)
- **Web:** React 18+ (TypeScript)
- **Video Player:** Custom player (ExoPlayer for Android, AVPlayer iOS) or Mux Player SDK

**Infrastructure:**
- **Container:** Docker (all services)
- **Orchestration:** Kubernetes (GKE, EKS)
- **CI/CD:** GitHub Actions → ArgoCD
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Secrets:** HashiCorp Vault

**Third-party integrations:**
- **Payments:** Stripe Connect (payouts)
- **Bank connections:** Plaid (ACH deposits)
- **Video CDN:** AWS CloudFront or Cloudflare Stream
- **SMS/Email:** Twilio, SendGrid
- **Cloud storage:** AWS S3 or Google Cloud Storage

---

## 2. Database Schema

### 2.1 Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  country_code CHAR(2),
  is_creator BOOLEAN DEFAULT FALSE,
  creator_verified_tier INT DEFAULT 0, -- 0: unverified, 1: email, 2: KYC, 3: brand
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

**videos**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL, -- S3 path
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  category VARCHAR(50), -- trending, music, comedy, education, etc
  hashtags TEXT[], -- array of strings
  status VARCHAR(20) DEFAULT 'processing', -- processing, published, flagged, removed
  is_monetized BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (creator_id, published_at),
  INDEX (category, published_at),
  INDEX (status)
);
```

**engagements**
```sql
CREATE TABLE engagements (
  id BIGSERIAL PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id),
  user_id UUID NOT NULL REFERENCES users(id),
  engagement_type VARCHAR(20) NOT NULL, -- 'view', 'like', 'comment', 'share'
  watch_duration_seconds INT, -- NULL for non-views
  is_watch_complete BOOLEAN, -- true if >75% watched
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (video_id, created_at),
  INDEX (user_id, created_at),
  UNIQUE (user_id, video_id, engagement_type) -- prevent duplicate likes/views in same session
);
```

**comments**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id),
  user_id UUID NOT NULL REFERENCES users(id),
  parent_comment_id UUID REFERENCES comments(id), -- for threading
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (video_id, created_at),
  INDEX (user_id, created_at)
);
```

**followers**
```sql
CREATE TABLE followers (
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  INDEX (following_id, created_at)
);
```

**wallet_transactions**
```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'earn', 'withdraw', 'refund', 'chargeback'
  amount_cents BIGINT NOT NULL, -- always store as cents (integer)
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, disputed
  payment_method VARCHAR(50), -- 'stripe', 'plaid_ach', 'blockchain'
  external_reference_id VARCHAR(255), -- stripe transaction ID, blockchain txn hash, etc
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  reason TEXT,
  INDEX (user_id, created_at),
  INDEX (status, created_at)
);
```

**payouts**
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_views BIGINT DEFAULT 0,
  total_engagement_count INT DEFAULT 0,
  viewer_contribution_cents BIGINT DEFAULT 0, -- from viewer engagement rewards
  ad_revenue_cents BIGINT DEFAULT 0,
  brand_deal_revenue_cents BIGINT DEFAULT 0,
  subscription_revenue_cents BIGINT DEFAULT 0,
  total_payout_cents BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  payout_method VARCHAR(50), -- 'stripe', 'blockchain'
  external_payout_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX (creator_id, payout_period_end),
  INDEX (status, created_at)
);
```

**ads_campaigns**
```sql
CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES users(id),
  campaign_name VARCHAR(255) NOT NULL,
  budget_cents BIGINT NOT NULL,
  spent_cents BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed
  start_date DATE,
  end_date DATE,
  target_countries TEXT[], -- array
  target_age_min INT,
  target_age_max INT,
  target_interests TEXT[], -- array
  creative_url VARCHAR(500), -- S3 path to video
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (advertiser_id, status)
);
```

**content_flags**
```sql
CREATE TABLE content_flags (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  comment_id UUID REFERENCES comments(id),
  user_id UUID NOT NULL REFERENCES users(id), -- who reported
  flag_type VARCHAR(50) NOT NULL, -- 'spam', 'nudity', 'violence', 'hate_speech', 'copyright'
  severity INT DEFAULT 1, -- 1: low, 2: medium, 3: high
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewer_id UUID REFERENCES users(id),
  reviewer_decision VARCHAR(50), -- 'approved', 'removed', 'shadowban'
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  INDEX (video_id, status),
  INDEX (status, created_at)
);
```

---

## 3. API Endpoints

### 3.1 Authentication & User Management

**POST /auth/signup**
- Request: `{ email, password, username, country_code }`
- Response: `{ user_id, access_token, refresh_token }`
- Rate limit: 5 per IP per hour

**POST /auth/login**
- Request: `{ email, password }`
- Response: `{ user_id, access_token, refresh_token }`
- Rate limit: 10 per IP per hour

**POST /auth/verify-email**
- Request: `{ user_id, verification_code }`
- Response: `{ success }`

**GET /users/{user_id}**
- Response: `{ id, username, display_name, avatar_url, follower_count, is_creator, ... }`

**PUT /users/{user_id}**
- Request: `{ display_name, bio, avatar_url }`
- Response: Updated user object

---

### 3.2 Video Endpoints

**POST /videos/upload**
- Multipart file upload (video file)
- Request: `{ title, description, category, hashtags, monetization_enabled }`
- Response: `{ video_id, upload_status, processing_progress }`
- Rate limit: 10 videos per creator per day

**GET /videos/{video_id}**
- Response: Full video metadata + engagement stats

**GET /feed**
- Query params: `{ limit=20, offset=0, country_code, interests[] }`
- Response: `{ videos: [...], next_offset, has_more }`
- **Note:** Calls recommendation engine; returns personalized feed

**GET /videos/{video_id}/analytics** (creator only)
- Response: `{ total_views, completion_rate, engagement_rate, revenue_breakdown }`

**DELETE /videos/{video_id}** (creator only)
- Response: `{ success }`

---

### 3.3 Engagement Endpoints

**POST /engagements/{video_id}/view**
- Request: `{ watch_duration_seconds, completed }`
- Response: `{ reward_earned_cents }`
- **Note:** Increments view count; calculates viewer reward

**POST /engagements/{video_id}/like**
- Response: `{ success, reward_earned_cents }`

**POST /engagements/{video_id}/unlike**
- Response: `{ success }`

**POST /comments/{video_id}**
- Request: `{ content, parent_comment_id }`
- Response: `{ comment_id, reward_earned_cents }`

**POST /engagements/{video_id}/share**
- Request: `{ platform }` (internal, facebook, twitter, etc)
- Response: `{ success, reward_earned_cents }`

---

### 3.4 Wallet Endpoints

**GET /wallet**
- Response: `{ balance_cents, currency, pending_payouts_cents, last_payout_date, tier }`

**GET /wallet/transactions**
- Query params: `{ limit=50, offset=0, type }`
- Response: `{ transactions: [...], total_count }`

**POST /wallet/withdraw**
- Request: `{ amount_cents, method, recipient_id }`
  - method: 'stripe_ach' | 'blockchain'
  - recipient_id: bank account ID or blockchain address
- Response: `{ transaction_id, status, processed_at_estimate }`
- Rate limit: 1 per hour, max 10 per day

**POST /wallet/link-bank-account**
- Request: Plaid public token (from Plaid Link flow on client)
- Response: `{ account_id, bank_name, last_4 }`

**POST /wallet/blockchain-export**
- Request: None (user already has private key)
- Response: `{ wallet_address, balance_usdc, network }`

---

### 3.5 Creator & Payout Endpoints

**GET /creators/{creator_id}**
- Response: `{ creator_id, follower_count, total_videos, avg_engagement_rate, monthly_earnings }`

**GET /creator/payouts**
- Query params: `{ limit=12, offset=0 }`
- Response: `{ payouts: [...], total_earned_cents }`

**GET /creator/payouts/{payout_id}**
- Response: `{ payout details with breakdown: viewer_contribution, ads, brand_deals, subscriptions }`

---

### 3.6 Ads Endpoints (Advertiser)

**POST /ads/campaigns**
- Request: `{ campaign_name, budget_cents, start_date, end_date, target_countries, target_ages, creative_url, cpc_bid_cents }`
- Response: `{ campaign_id, status }`

**GET /ads/campaigns/{campaign_id}**
- Response: `{ campaign_details, impressions, clicks, spend_cents, ctr, cpc }`

**PUT /ads/campaigns/{campaign_id}**
- Request: `{ budget_cents, status, target_... }`
- Response: Updated campaign

**GET /ads/performance**
- Query params: `{ start_date, end_date }`
- Response: `{ daily_metrics: [...], total_roas }`

---

## 4. ML Recommendation Engine

### 4.1 Architecture

**Offline Training Pipeline (runs daily at 2 AM UTC):**
1. Collection: Kafka stream of events (views, likes, comments) → Snowflake
2. Feature engineering:
   - User features: Country, age, interests, watch history (last 100 videos)
   - Video features: Category, view count, engagement rate, trending score
   - Interaction features (collaborative filtering): User-video similarity
3. Model training:
   - Contextual multi-armed bandit (Thompson sampling)
   - Candidate generation: 1000 videos via collaborative filtering
   - Ranking: GBDT (XGBoost) ranks candidates by predicted engagement
4. Model registry: MLflow pushes new model to TorchServe

**Online Ranking Pipeline (real-time):**
1. User request to `/feed` endpoint
2. Context extraction:
   - Logged-in user ID (or device ID if not logged in)
   - Country (from IP or user profile)
   - User device type, OS version
   - Previous 10 videos watched (session history)
3. Candidate retrieval:
   - Query Elasticsearch: videos posted in last 7 days, category = user interests
   - Return top 1000 by trending score
4. Ranking:
   - Call TorchServe with user features + video features
   - Score each candidate (predicted watch completion %)
   - Apply diversity penalty (if user just watched comedy, boost education)
   - Sort by final score
5. Return top 20 to client

**Features tracked:**
- Watch completion rate (for ranking signal)
- Engagement (like rate, comment rate, share rate)
- Creator reputation (average engagement rate across all videos)
- Freshness (videos posted <24h boost)
- Diversity (don't show 5 comedy videos in a row)

---

### 4.2 A/B Testing Framework

**Test definition:**
```python
{
  "test_id": "ranking_v2_vs_baseline",
  "start_date": "2026-02-15",
  "end_date": "2026-02-25",
  "variation_a": {
    "name": "baseline",
    "model_version": "v1.0",
    "traffic_split": 0.5
  },
  "variation_b": {
    "name": "ranking_v2",
    "model_version": "v2.1",
    "traffic_split": 0.5
  },
  "metrics": ["watch_completion_rate", "engagement_rate", "session_length_seconds"],
  "target_effect_size": 0.05, // 5% improvement
  "significance_level": 0.05 // p-value
}
```

**Bucket assignment:**
```python
def get_test_bucket(user_id, test_id):
    hash_val = hash(f"{user_id}:{test_id}") % 100
    if hash_val < 50:
        return "variation_a"
    else:
        return "variation_b"
```

---

## 5. Engagement & Fraud Detection

### 5.1 Real-time Fraud Scoring

**User behavior anomaly detection:**
```python
class AnomalyDetector:
    def score_user_session(user_id, session_events):
        # Check 1: Engagement velocity (views/minute)
        if views_per_minute > 10:
            score += 0.3  # suspicious: watching too fast
        
        # Check 2: Geographic inconsistency
        if user_last_seen in country_A < 1 hour ago:
            if current_ip in country_B:
                score += 0.4  # impossible travel
        
        # Check 3: Identical engagement patterns
        if all_comments_identical or all_shares_identical:
            score += 0.5  # copy-paste bot
        
        # Check 4: Account age vs. engagement
        if account_age_days < 1 and views > 100:
            score += 0.3  # new account, lots of activity
        
        # Check 5: Device/IP fingerprinting
        if fingerprint matches known bot pattern:
            score += 0.6
        
        return score  # 0-1, >0.7 = flag for review
```

**Video-level fraud detection:**
```python
class VideoFraudDetector:
    def score_video(video_id):
        analytics = get_video_analytics(video_id)
        
        # Check 1: Engagement mismatch
        if views > 100K and likes < 100:
            # 0.1% engagement is suspiciously low
            score += 0.4
        
        # Check 2: View origin anomalies
        if views_from_single_country > 90%:
            # Most views from one country unusual
            if creator_not_in_that_country:
                score += 0.3
        
        # Check 3: Watch duration mismatch
        if avg_watch_duration < 3 seconds:
            # Users not actually watching (skipping too fast)
            score += 0.4
        
        # Check 4: Temporal pattern
        if all_views within 2-hour window:
            # Unnatural spike
            if creator doesn't have followers:
                score += 0.5
        
        return score
```

---

## 6. Payout Calculation Engine

### 6.1 Pseudocode: Weekly Payout Job

```python
def calculate_creator_payout(creator_id, period_start_date, period_end_date):
    """Calculate weekly payout for creator"""
    
    # 1. Get all engagements in period
    engagements = db.query("""
        SELECT e.engagement_type, e.created_at, v.video_id
        FROM engagements e
        JOIN videos v ON e.video_id = v.id
        WHERE v.creator_id = %s
        AND e.created_at BETWEEN %s AND %s
    """)
    
    # 2. Calculate viewer contribution (per-view payouts)
    viewer_contribution = 0
    for engagement in engagements:
        if engagement.type == 'view':
            # Base reward
            reward = BASE_VIEW_REWARD  # $0.005-$0.015 depending on completion
            
            # Country multiplier
            reward *= get_country_multiplier(engagement.viewer_country)
            
            # Engagement depth multiplier
            if has_like_in_same_session:
                reward *= 1.2
            if has_comment_in_same_session:
                reward *= 1.5
            
            viewer_contribution += reward
    
    # 3. Ad revenue share
    ad_impressions = count_ad_impressions_on_creator_videos(creator_id, period)
    ad_revenue = ad_impressions * (AVERAGE_CPM / 1000) * 0.80  # creator gets 80%
    
    # 4. Brand deal commissions
    brand_deals = db.query("""
        SELECT bd.revenue_cents
        FROM brand_deals bd
        WHERE bd.creator_id = %s
        AND bd.completed_at BETWEEN %s AND %s
    """)
    brand_revenue = sum(bd.revenue_cents for bd in brand_deals) * 0.85
    
    # 5. Subscription revenue
    subscribers = db.query("""
        SELECT COUNT(*) FROM subscriptions
        WHERE creator_id = %s AND status = 'active'
        AND subscription_date <= %s
    """)
    subscription_revenue = subscribers * SUBSCRIPTION_PRICE * 0.70
    
    # 6. Fraud deduction
    fraud_deduction = 0
    if creator_flagged_for_engagement_manipulation:
        fraud_deduction = viewer_contribution * 0.25  # 25% penalty
    
    # 7. Calculate total
    total_payout = (
        viewer_contribution +
        ad_revenue +
        brand_revenue +
        subscription_revenue -
        fraud_deduction
    )
    
    # 8. Store calculation
    payout = Payout.create(
        creator_id=creator_id,
        payout_period_start=period_start_date,
        payout_period_end=period_end_date,
        viewer_contribution_cents=int(viewer_contribution * 100),
        ad_revenue_cents=int(ad_revenue * 100),
        brand_deal_revenue_cents=int(brand_revenue * 100),
        subscription_revenue_cents=int(subscription_revenue * 100),
        total_payout_cents=int(total_payout * 100),
        status='pending'
    )
    
    # 9. Queue payout to payment processor
    stripe_payout_job.delay(payout.id)
    
    return payout
```

---

## 7. API Response Schema (JSON Examples)

### 7.1 Feed Response

```json
{
  "videos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "creator": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "jane_creator",
        "avatar_url": "https://grammate.com/avatars/..."
      },
      "title": "Morning Productivity Routine",
      "description": "5 habits that changed my life",
      "video_url": "https://grammate-cdn.com/videos/...",
      "thumbnail_url": "https://grammate-cdn.com/thumbs/...",
      "duration_seconds": 240,
      "category": "lifestyle",
      "view_count": 12450,
      "like_count": 945,
      "comment_count": 234,
      "share_count": 87,
      "engagement_rate": 0.102,
      "is_watched": false,
      "is_liked": false,
      "reward_available": 0.015
    }
  ],
  "next_offset": 20,
  "has_more": true
}
```

### 7.2 Wallet Response

```json
{
  "balance_cents": 5450,
  "currency": "USD",
  "pending_payouts_cents": 12340,
  "last_payout_date": "2026-02-08",
  "tier": "email_verified",
  "withdrawal_limits": {
    "daily_max_cents": 500000,
    "daily_remaining_cents": 475000,
    "monthly_max_cents": 5000000,
    "monthly_remaining_cents": 4800000
  }
}
```

### 7.3 Creator Payout Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "creator_id": "550e8400-e29b-41d4-a716-446655440001",
  "payout_period": {
    "start": "2026-02-01",
    "end": "2026-02-08"
  },
  "breakdown": {
    "viewer_contribution_cents": 240000,
    "ad_revenue_cents": 11200,
    "brand_deal_revenue_cents": 127500,
    "subscription_revenue_cents": 52360
  },
  "total_payout_cents": 431060,
  "status": "completed",
  "payout_method": "stripe_ach",
  "processed_at": "2026-02-09T14:30:00Z"
}
```

---

## 8. Deployment & DevOps

### 8.1 Infrastructure Setup

**Development:**
- Docker Compose (local full-stack simulation)
- SQLite for quick iteration
- Mocked payment processor

**Staging:**
- Kubernetes cluster (GKE / EKS)
- PostgreSQL managed instance (Cloud SQL / RDS)
- Real Stripe integration (test mode)
- Feature parity with production

**Production:**
- Multi-region Kubernetes (US-E, US-W, EU-W)
- Read replicas of PostgreSQL (cross-region replication)
- Managed Redis Cluster
- Managed Kafka (Confluent Cloud)
- CDN: Cloudflare in front of S3
- Secrets: HashiCorp Vault

### 8.2 CI/CD Pipeline

**On commit to main:**
1. Run linters, type checks (mypy), tests (pytest)
2. Build Docker image, scan for vulnerabilities (Trivy)
3. Push to ECR/GCR
4. Deploy to staging (automatic)
5. Run smoke tests (create video, like, comment)
6. Manual approval for production release
7. Blue-green deployment to production (5% canary first)

### 8.3 Monitoring & Alerting

**Key metrics:**
- API latency (P50, P95, P99)
- Error rate (4xx, 5xx)
- Database query latency
- Kafka lag (event processing pipeline)
- Payout job success rate
- ML inference latency (recommendation engine)

**Alert thresholds:**
- P99 latency > 1s → page on-call
- Error rate > 1% → page on-call
- Payout job missing SLA (should complete within 1 hour) → escalate
- Kafka lag > 10 minutes → alert (not page)

---

## 9. Security Checklist

- [ ] All API endpoints behind authentication (JWT tokens)
- [ ] SQL injection prevention (parameterized queries via SQLAlchemy ORM)
- [ ] CSRF protection (SameSite cookies, CSRF tokens for POST/PUT/DELETE)
- [ ] Rate limiting (1K req/min per IP, per-user bucketing)
- [ ] Input validation (Pydantic for all request bodies)
- [ ] Output encoding (prevent XSS)
- [ ] HTTPS/TLS 1.3 enforced
- [ ] Secrets rotation (database passwords, API keys every 90 days)
- [ ] Encryption at rest (AES-256 for PII, video URLs)
- [ ] Audit logging (all transactions, admin actions logged)
- [ ] Bug bounty program (HackerOne or Bugcrowd)

---

## 10. Performance Targets

| Component | Target | Mechanism |
|---|---|---|
| Feed load | <500ms | Redis caching + Elasticsearch |
| Video upload | <5 min | Async transcoding job |
| Payout processing | <1 hour | Scheduled job, batch processing |
| Recommendation inference | <100ms | Model serving in TorchServe |
| Database query | <50ms (p95) | Indexes, query optimization, read replicas |
| API error rate | <0.5% | Circuit breakers, graceful degradation |
| Uptime | 99.95% | Multi-region, auto-scaling, redundancy |

---

**Status:** Ready for engineering team | **Next Step:** Database schema migration planning
