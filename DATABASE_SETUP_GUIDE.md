# GramMate Database Setup Guide

Complete PostgreSQL database schema, SQLAlchemy ORM models, and migrations setup.

## Database Architecture Overview

```
PostgreSQL 15 Database
├── Users (Authentication & Profiles)
├── Videos (Core Content)
├── Engagement (Likes, Comments, Saves)
├── Social (Followers, Relationships)
├── Monetization (Wallet, Transactions, Payouts)
├── Analytics (Events, Metrics)
└── Admin (Moderation, Fraud Detection)
```

---

## Database Setup

### Initial Setup

```bash
# Create database
createdb grammate

# Create user
createuser -P grammate_user
# Enter password: grammate_secure_password

# Grant privileges
psql grammate -c "GRANT ALL PRIVILEGES ON DATABASE grammate TO grammate_user;"

# Verify connection
psql -U grammate_user -d grammate -h localhost
```

### Connection String

```
postgresql://grammate_user:grammate_secure_password@localhost:5432/grammate
```

### Docker Setup

```bash
# Start PostgreSQL container
docker run -d \
  --name grammate-postgres \
  -e POSTGRES_USER=grammate \
  -e POSTGRES_PASSWORD=grammate_dev_password \
  -e POSTGRES_DB=grammate \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## SQLAlchemy ORM Models

Create `backend/app/models/__init__.py`:

```python
"""Database models for GramMate."""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    Text, Enum, ForeignKey, Table, UniqueConstraint,
    Index, CheckConstraint, func
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import enum
import uuid

Base = declarative_base()

# ============================================================
# Enums
# ============================================================

class VideoStatus(str, enum.Enum):
    """Video lifecycle status."""
    DRAFT = "draft"
    PROCESSING = "processing"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"

class TransactionType(str, enum.Enum):
    """Transaction types."""
    EARNINGS = "earnings"
    WITHDRAWAL = "withdrawal"
    SUBSCRIPTION = "subscription"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"

class TransactionStatus(str, enum.Enum):
    """Transaction status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ModerationAction(str, enum.Enum):
    """Admin moderation actions."""
    WARNING = "warning"
    STRIKE = "strike"
    SUSPEND = "suspend"
    BAN = "ban"
    REMOVAL = "removal"

# ============================================================
# Association Tables
# ============================================================

# Followers relationship (many-to-many)
followers_table = Table(
    'followers',
    Base.metadata,
    Column('follower_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('following_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('created_at', DateTime, server_default=func.now()),
    UniqueConstraint('follower_id', 'following_id', name='unique_follower_following')
)

# ============================================================
# Core Models
# ============================================================

class User(Base):
    """User account model."""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Auth
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    display_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    
    # Status
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    is_creator = Column(Boolean, default=False, index=True)
    is_verified = Column(Boolean, default=False)  # Blue check
    is_suspended = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    
    # Security
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    
    # Stats (denormalized for performance)
    followers_count = Column(Integer, default=0, server_default='0')
    following_count = Column(Integer, default=0, server_default='0')
    videos_count = Column(Integer, default=0, server_default='0')
    total_views = Column(Integer, default=0, server_default='0')
    total_earned = Column(Float, default=0.0, server_default='0')
    
    # Relationships
    following = relationship(
        'User',
        secondary=followers_table,
        primaryjoin=id == followers_table.c.follower_id,
        secondaryjoin=id == followers_table.c.following_id,
        backref='followers',
        foreign_keys=[followers_table.c.follower_id, followers_table.c.following_id]
    )
    
    videos = relationship('Video', back_populates='creator', cascade='all, delete-orphan')
    likes = relationship('Like', back_populates='user', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='user', cascade='all, delete-orphan')
    saves = relationship('Save', back_populates='user', cascade='all, delete-orphan')
    wallet = relationship('Wallet', back_populates='user', uselist=False, cascade='all, delete-orphan')
    notifications = relationship('Notification', back_populates='user', cascade='all, delete-orphan')
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index('ix_users_email', 'email'),
        Index('ix_users_username', 'username'),
        Index('ix_users_is_creator', 'is_creator'),
        Index('ix_users_created_at', 'created_at'),
    )

class Video(Base):
    """Video content model."""
    __tablename__ = 'videos'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Metadata
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)
    tags = Column(ARRAY(String(50)), default=[])
    
    # URLs
    video_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Video specs
    duration_seconds = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Status & Processing
    status = Column(Enum(VideoStatus), default=VideoStatus.DRAFT, index=True)
    processing_status = Column(String(50), nullable=True)  # For encoder feedback
    
    # Monetization
    is_monetized = Column(Boolean, default=False)
    earnings = Column(Float, default=0.0, server_default='0')
    cpm = Column(Float, nullable=True)  # Cost per mille (per 1000 views)
    
    # Stats (denormalized)
    view_count = Column(Integer, default=0, server_default='0', index=True)
    like_count = Column(Integer, default=0, server_default='0')
    comment_count = Column(Integer, default=0, server_default='0')
    save_count = Column(Integer, default=0, server_default='0')
    share_count = Column(Integer, default=0, server_default='0')
    
    # Relationships
    creator = relationship('User', back_populates='videos')
    likes = relationship('Like', back_populates='video', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='video', cascade='all, delete-orphan')
    saves = relationship('Save', back_populates='video', cascade='all, delete-orphan')
    analytics = relationship('AnalyticsEvent', back_populates='video', cascade='all, delete-orphan')
    
    # Timestamps
    published_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_videos_user_id', 'user_id'),
        Index('ix_videos_status', 'status'),
        Index('ix_videos_category', 'category'),
        Index('ix_videos_published_at', 'published_at'),
        Index('ix_videos_created_at', 'created_at'),
    )

class Like(Base):
    """Like model (user liking a video)."""
    __tablename__ = 'likes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=False, index=True)
    
    user = relationship('User', back_populates='likes')
    video = relationship('Video', back_populates='likes')
    
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'video_id', name='unique_user_video_like'),
        Index('ix_likes_video_id', 'video_id'),
    )

class Save(Base):
    """Save model (user saving a video)."""
    __tablename__ = 'saves'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=False, index=True)
    
    user = relationship('User', back_populates='saves')
    video = relationship('Video', back_populates='saves')
    
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'video_id', name='unique_user_video_save'),
        Index('ix_saves_video_id', 'video_id'),
    )

class Comment(Base):
    """Comment model."""
    __tablename__ = 'comments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=False, index=True)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey('comments.id'), nullable=True)
    
    content = Column(Text, nullable=False)
    
    # Stats
    like_count = Column(Integer, default=0, server_default='0')
    reply_count = Column(Integer, default=0, server_default='0')
    
    user = relationship('User', back_populates='comments')
    video = relationship('Video', back_populates='comments')
    parent = relationship('Comment', remote_side=[id], backref='replies')
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_comments_video_id', 'video_id'),
        Index('ix_comments_user_id', 'user_id'),
    )

# ============================================================
# Wallet & Monetization
# ============================================================

class Wallet(Base):
    """User wallet for earnings tracking."""
    __tablename__ = 'wallets'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), unique=True, nullable=False)
    
    # Balance breakdown
    available_balance = Column(Float, default=0.0, server_default='0')
    pending_balance = Column(Float, default=0.0, server_default='0')  # Processing
    locked_balance = Column(Float, default=0.0, server_default='0')    # Under dispute
    
    total_earned = Column(Float, default=0.0, server_default='0')
    total_withdrawn = Column(Float, default=0.0, server_default='0')
    
    user = relationship('User', back_populates='wallet')
    transactions = relationship('Transaction', back_populates='wallet', cascade='all, delete-orphan')
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Transaction(Base):
    """Financial transaction record."""
    __tablename__ = 'transactions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey('wallets.id'), nullable=False, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=True)
    
    type = Column(Enum(TransactionType), nullable=False, index=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, index=True)
    
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0, server_default='0')
    net_amount = Column(Float, nullable=False)
    
    description = Column(String(500), nullable=True)
    reference_id = Column(String(255), unique=True, nullable=True)  # External reference
    
    wallet = relationship('Wallet', back_populates='transactions')
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint('amount > 0', name='positive_amount'),
        CheckConstraint('fee >= 0', name='non_negative_fee'),
    )

class PayoutMethod(Base):
    """Payout method (bank account, PayPal, etc)."""
    __tablename__ = 'payout_methods'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    type = Column(String(50), nullable=False)  # bank, paypal, stripe, etc
    is_default = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Encrypted data (in production, use proper encryption)
    encrypted_data = Column(Text, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class PayoutRequest(Base):
    """Payout request tracking."""
    __tablename__ = 'payout_requests'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    payout_method_id = Column(UUID(as_uuid=True), ForeignKey('payout_methods.id'))
    
    amount_requested = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=True)
    fee = Column(Float, default=0.0, server_default='0')
    
    status = Column(String(50), default='pending', index=True)  # pending, approved, processing, completed, failed
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    processed_at = Column(DateTime, nullable=True)

# ============================================================
# Analytics
# ============================================================

class AnalyticsEvent(Base):
    """Analytics event tracking."""
    __tablename__ = 'analytics_events'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    event_type = Column(String(50), nullable=False, index=True)  # view, like, share, etc
    
    # Context
    device_type = Column(String(50), nullable=True)  # mobile, desktop, tablet
    country = Column(String(2), nullable=True)
    referrer = Column(String(500), nullable=True)
    
    metadata = Column(JSONB, nullable=True)  # Additional data
    
    video = relationship('Video', back_populates='analytics')
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('ix_analytics_video_id_type', 'video_id', 'event_type'),
    )

# ============================================================
# Admin & Moderation
# ============================================================

class AdminModeration(Base):
    """Admin moderation record."""
    __tablename__ = 'admin_moderation'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    target_type = Column(String(50), nullable=False)  # user, video, comment
    target_id = Column(UUID(as_uuid=True), nullable=False)
    
    admin_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    action = Column(Enum(ModerationAction), nullable=False)
    
    reason = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    appeal_submitted = Column(Boolean, default=False)
    appeal_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('ix_moderation_target', 'target_type', 'target_id'),
    )

class FraudFlag(Base):
    """Fraud detection flag."""
    __tablename__ = 'fraud_flags'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    flagged_type = Column(String(50), nullable=False)  # user, video, transaction
    flagged_id = Column(UUID(as_uuid=True), nullable=False)
    
    flag_reason = Column(String(255), nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    
    is_resolved = Column(Boolean, default=False)
    resolution = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), index=True)

# ============================================================
# Notifications
# ============================================================

class Notification(Base):
    """User notification."""
    __tablename__ = 'notifications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    type = Column(String(50), nullable=False)  # like, comment, follow, earning, etc
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related objects
    related_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    related_video_id = Column(UUID(as_uuid=True), ForeignKey('videos.id'), nullable=True)
    
    is_read = Column(Boolean, default=False)
    
    user = relationship('User', foreign_keys=[user_id], back_populates='notifications')
    
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('ix_notifications_user_unread', 'user_id', 'is_read'),
    )

__all__ = [
    'User', 'Video', 'Like', 'Save', 'Comment',
    'Wallet', 'Transaction', 'PayoutMethod', 'PayoutRequest',
    'AnalyticsEvent', 'AdminModeration', 'FraudFlag',
    'Notification',
    'VideoStatus', 'TransactionType', 'TransactionStatus', 'ModerationAction'
]
```

---

## Database Migrations

Create `alembic/env.py`:

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from app.models import Base

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = os.getenv('DATABASE_URL')
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = os.getenv('DATABASE_URL')
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Running Migrations

```bash
# Initialize migrations folder (first time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head

# View migration status
alembic current

# Downgrade
alembic downgrade -1
```

---

## Performance Optimization

### Indexes

Indexes are already defined on frequently queried columns:
- `users.email`, `users.username` - Auth lookups
- `videos.user_id`, `videos.status`, `videos.published_at` - Feed queries
- `likes.video_id`, `saves.video_id` - Engagement counts
- `analytics_events.video_id` - Analytics aggregation

### Query Optimization

```python
# ❌ Bad: N+1 query problem
users = session.query(User).all()
for user in users:
    print(user.followers_count)  # Triggers query for each user

# ✅ Good: Eager loading
from sqlalchemy.orm import joinedload
users = session.query(User).options(joinedload(User.followers)).all()

# ✅ Better: Denormalize stats
# followers_count stored directly on user table
users = session.query(User).all()
for user in users:
    print(user.followers_count)  # No additional query
```

### Connection Pooling

```python
# backend/app/database/db.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,        # Min connections
    max_overflow=40,     # Max connections
    pool_pre_ping=True,  # Test connections before use
    echo=DEBUG
)
```

---

## Backup & Restore

### Automated Backups

```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump grammate | gzip > /backups/grammate_${DATE}.sql.gz
aws s3 cp /backups/grammate_${DATE}.sql.gz s3://grammate-backups/
```

### Restore from Backup

```bash
#!/bin/bash
# restore_db.sh
gunzip -c $BACKUP_FILE | psql grammate
```

---

## Security Best Practices

1. **Use strong passwords**
   ```python
   password_hash = hash_password(password)  # Use bcrypt
   ```

2. **Encrypt sensitive data**
   ```python
   encrypted_data = encrypt(bank_account_info)
   ```

3. **SQL Injection Prevention**
   - Always use parameterized queries (SQLAlchemy handles this)
   - Never use string interpolation for SQL

4. **Access Control**
   ```python
   # Verify user owns resource
   if video.user_id != current_user.id:
       raise PermissionError("Not authorized")
   ```

5. **Audit Logging**
   ```python
   # Log all administrative actions
   logger.info(f"Admin {admin_id} {action} on {target_type} {target_id}")
   ```

---

## Monitoring

### Common Queries

```sql
-- Find slow queries
SELECT query, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, n_defs
FROM pg_stats
WHERE n_distinct > 100 AND n_defs > 1000
ORDER BY n_distinct DESC;
```

---

Last Updated: May 24, 2026
