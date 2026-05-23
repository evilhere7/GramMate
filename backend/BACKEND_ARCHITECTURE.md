/**
 * GramMate Backend Architecture & Database Schema
 * Production-grade specifications
 */

// ============================================================
// BACKEND FOLDER STRUCTURE
// ============================================================

/*
backend/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py (env variables, settings)
│   │   ├── security.py (JWT, auth, encryption)
│   │   ├── constants.py (magic numbers, status codes)
│   │   └── logging.py (structured logging)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py (User model)
│   │   ├── video.py (Video model)
│   │   ├── engagement.py (Like, Comment, Save)
│   │   ├── wallet.py (Balance, Transaction)
│   │   ├── payout.py (PayoutMethod, PayoutRequest)
│   │   ├── admin.py (Admin, Moderation, Report)
│   │   ├── notification.py (Notification, Message)
│   │   ├── subscription.py (Subscription tier)
│   │   └── analytics.py (Event, Metric)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py (Pydantic models)
│   │   ├── video.py
│   │   ├── engagement.py
│   │   ├── wallet.py
│   │   ├── admin.py
│   │   └── common.py (shared schemas)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── video_service.py
│   │   ├── feed_service.py
│   │   ├── wallet_service.py
│   │   ├── notification_service.py
│   │   ├── analytics_service.py
│   │   ├── fraud_detection.py
│   │   └── payment_service.py (Stripe integration)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py (login, signup, firebase)
│   │   │   ├── users.py (profile, follow, creators)
│   │   │   ├── videos.py (CRUD, upload, process)
│   │   │   ├── feed.py (feed, explore, trending)
│   │   │   ├── engagement.py (like, comment, save)
│   │   │   ├── wallet.py (balance, withdraw, transactions)
│   │   │   ├── notifications.py (get, mark read)
│   │   │   ├── messages.py (DM, realtime)
│   │   │   ├── admin.py (users, moderation, payouts)
│   │   │   ├── health.py (status checks)
│   │   │   └── analytics.py (events, metrics)
│   │   └── v2/ (future API version)
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py (task broker)
│   │   ├── video_processing.py (encoding, thumbnail)
│   │   ├── notification_tasks.py
│   │   ├── payout_tasks.py
│   │   ├── analytics_tasks.py
│   │   └── fraud_detection_tasks.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth_middleware.py
│   │   ├── rate_limit.py
│   │   ├── cors.py
│   │   ├── error_handler.py
│   │   └── logger.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   ├── media_utils.py (video encoding, compression)
│   │   ├── storage_utils.py (S3, CDN)
│   │   ├── email_templates.py
│   │   └── helpers.py
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db.py (SQLAlchemy setup)
│   │   ├── models.py (ORM models - same as models/)
│   │   └── session.py (connection pooling)
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── redis.py (Redis client)
│   │   └── cache_keys.py (key patterns)
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_videos.py
│       ├── test_wallet.py
│       ├── test_admin.py
│       └── fixtures/
├── main.py (FastAPI app init)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── pytest.ini
├── .env.example
└── alembic/ (database migrations)
*/

// ============================================================
// DATABASE SCHEMA (PostgreSQL)
// ============================================================

/*
DATABASE NAME: grammate
USER: grammate
PASSWORD: grammate_dev_password

TABLES:

1. USERS TABLE
┌─────────────────────────────────────────────┐
│ users                                       │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ email: VARCHAR(255) [UNIQUE, NOT NULL]      │
│ username: VARCHAR(50) [UNIQUE, NOT NULL]    │
│ display_name: VARCHAR(255)                  │
│ bio: TEXT                                   │
│ avatar_url: VARCHAR(512)                    │
│ banner_url: VARCHAR(512)                    │
│ password_hash: VARCHAR(255)                 │
│ firebase_uid: VARCHAR(255) [UNIQUE]         │
│ is_verified: BOOLEAN [DEFAULT: false]       │
│ is_creator: BOOLEAN [DEFAULT: false]        │
│ creator_badge: VARCHAR(50) [check]          │
│ account_status: VARCHAR(50) [default:active]│
│ followers_count: INTEGER [DEFAULT: 0]       │
│ following_count: INTEGER [DEFAULT: 0]       │
│ videos_count: INTEGER [DEFAULT: 0]          │
│ total_earned: DECIMAL(15,2) [DEFAULT: 0]   │
│ total_views: BIGINT [DEFAULT: 0]            │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│ last_login_at: TIMESTAMP                    │
│ deleted_at: TIMESTAMP [soft delete]         │
│                                             │
│ INDEXES:                                    │
│ - email (unique)                            │
│ - username (unique)                         │
│ - firebase_uid (unique)                     │
│ - is_creator                                │
│ - is_verified                               │
│ - account_status                            │
│ - created_at (DESC)                         │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - account_status IN ('active', 'suspended',│
│   'banned', 'inactive')                     │
│ - creator_badge IN ('verified', 'official',│
│   'trusted', null)                          │
└─────────────────────────────────────────────┘

2. VIDEOS TABLE
┌─────────────────────────────────────────────┐
│ videos                                      │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ title: VARCHAR(255) [NOT NULL]              │
│ description: TEXT                           │
│ thumbnail_url: VARCHAR(512)                 │
│ video_url: VARCHAR(512) [NOT NULL]          │
│ duration_seconds: INTEGER                   │
│ video_quality: VARCHAR(50) [4K, 1080p, etc]│
│ file_size_bytes: BIGINT                     │
│ category: VARCHAR(50)                       │
│ tags: TEXT[] (array of hashtags)            │
│ view_count: BIGINT [DEFAULT: 0]             │
│ like_count: INTEGER [DEFAULT: 0]            │
│ comment_count: INTEGER [DEFAULT: 0]         │
│ save_count: INTEGER [DEFAULT: 0]            │
│ share_count: INTEGER [DEFAULT: 0]           │
│ earnings: DECIMAL(15,2) [DEFAULT: 0]        │
│ status: VARCHAR(50) [draft, processing,     │
│         approved, rejected, deleted]        │
│ is_monetized: BOOLEAN [DEFAULT: false]      │
│ monetization_status: VARCHAR(50)            │
│ ai_captions_generated: BOOLEAN              │
│ captions_text: TEXT                         │
│ copyright_checked: BOOLEAN                  │
│ copyright_issues: TEXT                      │
│ published_at: TIMESTAMP                     │
│ scheduled_publish_at: TIMESTAMP             │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│ deleted_at: TIMESTAMP [soft delete]         │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - status                                    │
│ - published_at (DESC)                       │
│ - is_monetized                              │
│ - category                                  │
│ - tags (GIN index)                          │
│ - view_count (DESC)                         │
│ - created_at (DESC)                         │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - status IN ('draft', 'processing',        │
│   'approved', 'rejected', 'deleted')        │
│ - duration_seconds > 0                      │
│ - earnings >= 0                             │
└─────────────────────────────────────────────┘

3. LIKES TABLE
┌─────────────────────────────────────────────┐
│ likes                                       │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ video_id: UUID [FK → videos, NOT NULL]      │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ UNIQUE CONSTRAINT:                          │
│ - (user_id, video_id)                       │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - video_id                                  │
│ - created_at (DESC)                         │
│                                             │
│ TRIGGER:                                    │
│ - ON INSERT: INCREMENT videos.like_count    │
│ - ON DELETE: DECREMENT videos.like_count    │
└─────────────────────────────────────────────┘

4. COMMENTS TABLE
┌─────────────────────────────────────────────┐
│ comments                                    │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ video_id: UUID [FK → videos, NOT NULL]      │
│ parent_comment_id: UUID [FK → comments]     │
│ text: TEXT [NOT NULL, max 1000 chars]       │
│ reply_count: INTEGER [DEFAULT: 0]           │
│ is_pinned: BOOLEAN [DEFAULT: false]         │
│ status: VARCHAR(50) [approved, pending,     │
│         rejected, deleted]                  │
│ flagged_count: INTEGER [DEFAULT: 0]         │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│ deleted_at: TIMESTAMP [soft delete]         │
│                                             │
│ INDEXES:                                    │
│ - video_id                                  │
│ - user_id                                   │
│ - parent_comment_id                         │
│ - created_at (DESC)                         │
│                                             │
│ TRIGGER:                                    │
│ - ON INSERT (parent_id IS NULL):            │
│   INCREMENT videos.comment_count             │
│ - ON DELETE (parent_id IS NULL):            │
│   DECREMENT videos.comment_count             │
└─────────────────────────────────────────────┘

5. FOLLOWERS TABLE
┌─────────────────────────────────────────────┐
│ followers                                   │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ follower_id: UUID [FK → users, NOT NULL]    │
│ following_id: UUID [FK → users, NOT NULL]   │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ UNIQUE CONSTRAINT:                          │
│ - (follower_id, following_id)               │
│                                             │
│ CHECK CONSTRAINT:                           │
│ - follower_id != following_id                │
│                                             │
│ INDEXES:                                    │
│ - follower_id                               │
│ - following_id                              │
│ - created_at (DESC)                         │
│                                             │
│ TRIGGERS:                                   │
│ - ON INSERT:                                │
│   INCREMENT users.following_count (follower)│
│   INCREMENT users.followers_count (following)
│ - ON DELETE: DECREMENT both                 │
└─────────────────────────────────────────────┘

6. WALLET_BALANCE TABLE
┌─────────────────────────────────────────────┐
│ wallet_balance                              │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, UNIQUE, NOT NULL]
│ available_balance: DECIMAL(15,2) [default:0]
│ pending_balance: DECIMAL(15,2) [default:0] │
│ locked_balance: DECIMAL(15,2) [default:0]  │
│ total_earned: DECIMAL(15,2) [default:0]    │
│ total_withdrawn: DECIMAL(15,2) [default:0] │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - user_id (unique)                          │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - available_balance >= 0                    │
│ - pending_balance >= 0                      │
│ - total_earned >= 0                         │
└─────────────────────────────────────────────┘

7. TRANSACTIONS TABLE
┌─────────────────────────────────────────────┐
│ transactions                                │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ type: VARCHAR(50) [earn, withdraw, refund,  │
│       bonus, adjustment]                    │
│ amount: DECIMAL(15,2) [NOT NULL]            │
│ status: VARCHAR(50) [completed, pending,    │
│        failed, cancelled]                   │
│ description: TEXT                           │
│ source_video_id: UUID [FK → videos]         │
│ related_transaction_id: UUID                │
│ metadata: JSONB (custom data)               │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - type                                      │
│ - status                                    │
│ - created_at (DESC)                         │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - amount > 0                                │
│ - type IN ('earn', 'withdraw', 'refund',   │
│   'bonus', 'adjustment')                    │
└─────────────────────────────────────────────┘

8. PAYOUT_METHODS TABLE
┌─────────────────────────────────────────────┐
│ payout_methods                              │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ type: VARCHAR(50) [bank, stripe, paypal,    │
│       crypto, check]                        │
│ is_default: BOOLEAN [DEFAULT: false]        │
│ account_holder_name: VARCHAR(255)           │
│ account_number_hash: VARCHAR(255)           │
│ routing_number_hash: VARCHAR(255) [bank]    │
│ stripe_account_id: VARCHAR(255) [stripe]    │
│ paypal_email_hash: VARCHAR(255)             │
│ crypto_address_hash: VARCHAR(255)           │
│ country_code: VARCHAR(2)                    │
│ verified_at: TIMESTAMP                      │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ deleted_at: TIMESTAMP [soft delete]         │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - is_default                                │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - type IN ('bank', 'stripe', 'paypal',     │
│   'crypto', 'check')                        │
└─────────────────────────────────────────────┘

9. PAYOUT_REQUESTS TABLE
┌─────────────────────────────────────────────┐
│ payout_requests                             │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ payout_method_id: UUID [FK, NOT NULL]       │
│ amount: DECIMAL(15,2) [NOT NULL]            │
│ fee: DECIMAL(15,2)                          │
│ net_amount: DECIMAL(15,2)                   │
│ status: VARCHAR(50) [pending, approved,     │
│        processing, completed, failed]       │
│ reason_for_rejection: TEXT                  │
│ external_payout_id: VARCHAR(255)            │
│ risk_score: DECIMAL(3,2) [0-10]             │
│ is_flagged: BOOLEAN                         │
│ manual_approval_required: BOOLEAN            │
│ approver_id: UUID [FK → users]              │
│ approved_at: TIMESTAMP                      │
│ processing_started_at: TIMESTAMP            │
│ completed_at: TIMESTAMP                     │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - status                                    │
│ - is_flagged                                │
│ - created_at (DESC)                         │
│                                             │
│ CHECK CONSTRAINTS:                          │
│ - amount > 0                                │
│ - net_amount > 0                            │
│ - fee >= 0                                  │
└─────────────────────────────────────────────┘

10. ADMIN_MODERATION TABLE
┌─────────────────────────────────────────────┐
│ admin_moderation                            │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ admin_id: UUID [FK → users, NOT NULL]       │
│ target_type: VARCHAR(50) [video, comment,   │
│             user, account]                  │
│ target_id: UUID [NOT NULL]                  │
│ action: VARCHAR(50) [approve, reject,       │
│        suspend, ban, warn, flag]            │
│ reason: TEXT [NOT NULL]                     │
│ category: VARCHAR(50) [abuse, copyright,    │
│          spam, explicit, misinformation]    │
│ metadata: JSONB                             │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ updated_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - admin_id                                  │
│ - target_type                               │
│ - target_id                                 │
│ - action                                    │
│ - created_at (DESC)                         │
└─────────────────────────────────────────────┘

11. FRAUD_FLAGS TABLE
┌─────────────────────────────────────────────┐
│ fraud_flags                                 │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ flag_type: VARCHAR(50) [velocity, pattern,  │
│           device, location, behavioral]     │
│ risk_score: DECIMAL(3,2) [0-10]             │
│ description: TEXT                           │
│ is_active: BOOLEAN [DEFAULT: true]          │
│ auto_action_taken: VARCHAR(50)              │
│ reviewed_by_admin: BOOLEAN                  │
│ admin_id: UUID [FK → users]                 │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│ resolved_at: TIMESTAMP                      │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - is_active                                 │
│ - risk_score                                │
│ - flag_type                                 │
│ - created_at (DESC)                         │
└─────────────────────────────────────────────┘

12. ANALYTICS_EVENTS TABLE
┌─────────────────────────────────────────────┐
│ analytics_events                            │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ video_id: UUID [FK → videos]                │
│ event_type: VARCHAR(50) [view, click,       │
│            share, engage, purchase]         │
│ event_properties: JSONB                     │
│ user_agent: TEXT                            │
│ ip_address: VARCHAR(45)                     │
│ device_type: VARCHAR(50) [mobile, desktop,  │
│             tablet, unknown]                │
│ session_id: VARCHAR(255)                    │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - video_id                                  │
│ - event_type                                │
│ - created_at (DESC)                         │
│                                             │
│ PARTITIONING:                               │
│ - By month on created_at                    │
└─────────────────────────────────────────────┘

13. NOTIFICATIONS TABLE
┌─────────────────────────────────────────────┐
│ notifications                               │
├─────────────────────────────────────────────┤
│ id: UUID [PK]                               │
│ user_id: UUID [FK → users, NOT NULL]        │
│ type: VARCHAR(50) [follow, like, comment,   │
│      message, payout, system]               │
│ title: VARCHAR(255)                         │
│ body: TEXT                                  │
│ action_url: VARCHAR(512)                    │
│ related_user_id: UUID [FK → users]          │
│ related_video_id: UUID [FK → videos]        │
│ is_read: BOOLEAN [DEFAULT: false]           │
│ read_at: TIMESTAMP                          │
│ created_at: TIMESTAMP [DEFAULT: now()]      │
│                                             │
│ INDEXES:                                    │
│ - user_id                                   │
│ - is_read                                   │
│ - created_at (DESC)                         │
│                                             │
│ PARTITIONING:                               │
│ - By month on created_at                    │
└─────────────────────────────────────────────┘

14. SESSIONS TABLE (Redis-backed, optional)
┌─────────────────────────────────────────────┐
│ sessions (Redis hash)                       │
├─────────────────────────────────────────────┤
│ Key: session:{session_id}                   │
│ Values:                                     │
│   - user_id: UUID                           │
│   - token: JWT                              │
│   - device_id: VARCHAR                      │
│   - ip_address: VARCHAR                     │
│   - user_agent: TEXT                        │
│   - created_at: timestamp                   │
│   - expires_at: timestamp                   │
│                                             │
│ TTL: 30 days                                │
│ Backup: Optional PostgreSQL sync            │
└─────────────────────────────────────────────┘

MATERIALIZED VIEWS:

1. creator_stats_summary
   - user_id, total_videos, total_views, 
     total_earnings, avg_video_performance
   - Refreshed daily

2. daily_revenue_by_source
   - date, source_type, total_amount
   - Refreshed hourly

3. trending_videos
   - video_id, engagement_score, view_velocity
   - Refreshed every 30 minutes
*/

// ============================================================
// KEY API ENDPOINTS
// ============================================================

/*
BASE URL: http://localhost:8000/api/v1

AUTH ENDPOINTS:
POST   /auth/register              - Create new account
POST   /auth/login                 - Email/password login
POST   /auth/firebase-login        - Firebase ID token exchange
POST   /auth/logout                - Invalidate session
POST   /auth/refresh               - Refresh JWT token
POST   /auth/verify-2fa            - Verify 2FA code
POST   /auth/request-password-reset - Send reset email
POST   /auth/reset-password        - Reset password with token

USER ENDPOINTS:
GET    /users/me                   - Get current user profile
PATCH  /users/me                   - Update profile
GET    /users/{id}                 - Get user profile (public)
POST   /users/{id}/follow          - Follow user
DELETE /users/{id}/follow          - Unfollow user
GET    /users/{id}/followers       - Get followers list
GET    /users/{id}/following       - Get following list
GET    /creators/{id}/stats        - Get creator stats
POST   /creators/{id}/verify       - Request verification
GET    /creators/trending          - Get trending creators
GET    /creators/recommendations   - Get creator recommendations

VIDEO ENDPOINTS:
GET    /videos/feed                - Get home feed (infinite scroll)
GET    /videos/explore             - Get explore page
GET    /videos/trending            - Get trending videos
GET    /videos/{id}                - Get video details
GET    /videos/{id}/engagement     - Get video engagement stats
POST   /videos/upload              - Initiate upload (returns S3 URL)
POST   /videos/{id}/process        - Start video processing
PATCH  /videos/{id}                - Update video metadata
DELETE /videos/{id}                - Delete video
POST   /videos/{id}/like           - Like video
DELETE /videos/{id}/like           - Unlike video
POST   /videos/{id}/save           - Save video
DELETE /videos/{id}/save           - Unsave video
GET    /videos/{id}/comments       - Get comments
POST   /videos/{id}/comments       - Post comment
POST   /videos/{id}/share          - Record share event
GET    /videos/analytics/{id}      - Get video analytics

WALLET ENDPOINTS:
GET    /wallet/balance             - Get wallet balance
GET    /wallet/transactions        - Get transaction history
GET    /wallet/monthly-earnings    - Get earnings chart data
POST   /wallet/withdraw            - Request withdrawal
GET    /wallet/payouts             - Get payout history
GET    /wallet/payout-methods      - Get saved payout methods
POST   /wallet/payout-methods      - Add payout method
PATCH  /wallet/payout-methods/{id} - Update payout method
DELETE /wallet/payout-methods/{id} - Remove payout method

NOTIFICATION ENDPOINTS:
GET    /notifications              - Get notifications
POST   /notifications/{id}/read    - Mark as read
POST   /notifications/read-all     - Mark all as read
GET    /messages                   - Get DMs
POST   /messages                   - Send DM
WS     /notifications/ws           - WebSocket for realtime

ADMIN ENDPOINTS (Requires admin role):
GET    /admin/dashboard            - Get dashboard stats
GET    /admin/users                - List users (with filters)
PATCH  /admin/users/{id}           - Update user status
GET    /admin/moderation           - Get moderation queue
POST   /admin/moderation/{id}      - Take moderation action
GET    /admin/fraud                - Get fraud dashboard
GET    /admin/payouts              - Get payout queue
PATCH  /admin/payouts/{id}         - Approve/reject payout
GET    /admin/analytics            - Get analytics dashboard
POST   /admin/analytics/export     - Export analytics data

HEALTH ENDPOINTS:
GET    /health                     - Service health check
GET    /health/db                  - Database health check
GET    /health/redis               - Redis health check
GET    /health/s3                  - S3 connectivity check
*/
