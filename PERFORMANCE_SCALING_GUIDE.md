/**
 * GramMate Performance Optimization & Scaling Guide
 * Production-grade performance benchmarks and optimization strategies
 */

// ============================================================
// PERFORMANCE TARGETS & METRICS
// ============================================================

/*
CORE WEB VITALS TARGETS:

Frontend:
- Largest Contentful Paint (LCP): < 2.5s (target: 1.5s)
- First Input Delay (FID): < 100ms (target: 50ms)
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.8s
- First Contentful Paint (FCP): < 1.8s

Backend:
- API response time (p99): < 200ms
- Database query time (p95): < 50ms
- Cache hit rate: > 85%
- Video upload processing: < 5 minutes per 1GB
- Webhook latency: < 5s (p99)

Database:
- Query execution time (p95): < 50ms
- Connection pool utilization: 60-80%
- Slow query threshold: 1s
- Replication lag: < 100ms

Realtime:
- WebSocket message delivery: < 100ms
- Redis pubsub latency: < 50ms
- Notification delivery: < 3s

INFRASTRUCTURE:
- Availability: 99.95% uptime target
- Error rate: < 0.1%
- Disk usage: < 80%
- Memory utilization: 60-75%
- CPU utilization: 50-70%
*/

// ============================================================
// FRONTEND OPTIMIZATION
// ============================================================

/*
1. CODE SPLITTING STRATEGY:

```typescript
// routes/index.ts
export const routes = {
  // Immediate load (critical)
  landing: '/',
  login: '/login',
  
  // Lazy load (user authenticated)
  feed: lazy(() => import('./pages/FeedPage')),
  
  // Lazy load on demand
  admin: lazy(() => import('./pages/admin/Dashboard')),
  studio: lazy(() => import('./pages/creator/Studio')),
  settings: lazy(() => import('./pages/Settings')),
  
  // Modal routes (instant)
  modals: {
    upload: lazy(() => import('./modals/UploadModal'))
  }
};
```

2. IMAGE OPTIMIZATION:

```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  loading?: 'lazy' | 'eager';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  width,
  height,
  alt,
  loading = 'lazy'
}) => {
  // Generate srcset for different resolutions
  const srcSet = [
    `${getImageUrl(src, width, 1)} 1x`,
    `${getImageUrl(src, width * 2, 2)} 2x`,
  ].join(', ');
  
  // Use picture element for format selection
  return (
    <picture>
      {/* WebP for modern browsers */}
      <source 
        srcSet={srcSet}
        type="image/webp"
      />
      
      {/* Fallback */}
      <img
        src={getImageUrl(src, width)}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
};

// Image optimization sizes:
// Avatars: 32px, 64px, 128px
// Thumbnails: 320px, 640px (2x)
// Banners: 1200px, 1920px
// All converted to WebP + JPEG fallback
```

3. BUNDLE SIZE OPTIMIZATION:

```json
{
  "name": "grammate-frontend",
  "scripts": {
    "analyze": "source-map-explorer 'build/static/js/*.js'"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.0.0",
    "webpack-bundle-analyzer": "^4.9.0"
  }
}
```

Bundle size targets:
- Initial bundle: < 200KB (gzipped)
- Per-route chunk: < 100KB
- Total app: < 500KB (gzipped)

Optimization techniques:
- Tree-shaking (remove unused code)
- Dynamic imports for routes
- Vendor splitting
- Remove console logs in production
- Minify + compress

4. CACHING STRATEGY:

```typescript
// services/api.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale while revalidate
      staleTime: 1000 * 60 * 5,      // 5 min
      gcTime: 1000 * 60 * 30,        // 30 min (was cacheTime)
      
      // Refetch behavior
      refetchOnWindowFocus: 'stale',
      refetchInterval: 1000 * 60,    // 1 min polling
      refetchIntervalInBackground: false,
      
      // Retry
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// Service worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // Cache video files, API responses, assets
    const cache = caches.open('grammate-v1');
    
    // Cache patterns:
    // - Static assets: 1 year
    // - API responses: 5 minutes
    // - Images: 30 days
  });
}
```

5. PERFORMANCE MONITORING:

```typescript
// utils/performance.ts
export const metrics = {
  recordMetric: (name: string, duration: number) => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        navigator.sendBeacon('/api/metrics', {
          name,
          duration,
          timestamp: Date.now(),
          url: window.location.pathname
        });
      });
    }
  },
  
  observeLCP: () => {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.recordMetric('LCP', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
};

// Call on app mount
useEffect(() => {
  metrics.observeLCP();
}, []);
```
*/

// ============================================================
// BACKEND OPTIMIZATION
// ============================================================

/*
1. DATABASE QUERY OPTIMIZATION:

```python
# Slow query (avoid):
for user_id in user_ids:
    user = db.query(User).get(user_id)
    videos = db.query(Video).filter_by(user_id=user_id).all()
    print(f"{user.name}: {len(videos)} videos")
# N+1 queries!

# Optimized (batch loading):
users = db.query(User).filter(User.id.in_(user_ids)).all()
videos = db.query(Video).filter(
    Video.user_id.in_(user_ids)
).all()

# Or with eager loading:
from sqlalchemy.orm import joinedload

users = db.query(User).options(
    joinedload(User.videos)
).filter(User.id.in_(user_ids)).all()

# Index strategy:
# - Index on user_id for frequent lookups
# - Index on created_at for time-range queries
# - Composite index on (user_id, created_at)
# - Partial index on status = 'active'

# Query optimization examples:

# Before (slow)
users_with_videos = []
for user in all_users:
    if len(user.videos) > 100:
        users_with_videos.append(user)

# After (fast)
prolific_users = db.query(User).join(Video).group_by(User.id).having(
    func.count(Video.id) > 100
).all()
```

2. CACHING PATTERNS:

```python
# Cache Key Patterns
class CacheKeys:
    # User
    USER_PROFILE = "user:{user_id}:profile"
    USER_STATS = "user:{user_id}:stats"
    USER_FEED = "user:{user_id}:feed:{page}"
    
    # Video
    VIDEO_DETAIL = "video:{video_id}:detail"
    VIDEO_ANALYTICS = "video:{video_id}:analytics"
    TRENDING_VIDEOS = "videos:trending:{period}"
    
    # Feed
    HOME_FEED = "feed:home:{user_id}:{page}"
    EXPLORE_FEED = "feed:explore:{page}"
    
    # Leaderboards
    TOP_CREATORS = "leaderboard:creators:weekly"

# Cache invalidation
async def like_video(user_id: str, video_id: str):
    # Invalidate related caches
    cache.delete(f"video:{video_id}:detail")
    cache.delete(f"video:{video_id}:analytics")
    cache.delete("leaderboard:videos:trending")
    
    # Increment cache (don't invalidate)
    cache.hincrby(f"video:{video_id}:likes", "count", 1)

# Time-based expiration (TTL)
cache.set(
    f"user:{user_id}:profile",
    user_data,
    ttl=300  # 5 minutes
)
```

3. BACKGROUND TASKS (Celery):

```python
# Priority queue
from celery import Task

class HighPriority(Task):
    queue = 'high_priority'
    routing_key = 'task.high'

class LowPriority(Task):
    queue = 'low_priority'
    routing_key = 'task.low'

# High priority tasks
@shared_task(base=HighPriority)
def process_video_upload(video_id: str):
    '''Process immediately on high-priority queue.'''
    pass

# Low priority tasks
@shared_task(base=LowPriority)
def send_weekly_digest(user_id: str):
    '''Send email digest, can wait.'''
    pass

# Scheduled tasks (Celery Beat)
app.conf.beat_schedule = {
    'process-pending-payouts': {
        'task': 'app.tasks.payout_tasks.process_pending_payouts',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
    'update-trending': {
        'task': 'app.tasks.analytics_tasks.update_trending',
        'schedule': 30.0,  # Every 30 seconds
    },
    'cleanup-old-notifications': {
        'task': 'app.tasks.notification_tasks.cleanup_old',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    }
}
```

4. DATABASE CONNECTION POOLING:

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # Connections in pool
    max_overflow=40,       # Additional connections when needed
    pool_timeout=30,       # Wait 30s for connection
    pool_recycle=3600,     # Recycle connections after 1 hour
    pool_pre_ping=True,    # Test connection before using
    echo_pool=False,       # Log pool events (debug only)
)
```

5. API RESPONSE COMPRESSION:

```python
from fastapi.middleware.gzip import GZIPMiddleware

app.add_middleware(GZIPMiddleware, minimum_size=1000)

# Selective compression
@router.get("/videos/feed")
async def get_feed(...):
    # This response will be gzipped if > 1000 bytes
    return videos
```
*/

// ============================================================
// SCALING ARCHITECTURE
// ============================================================

/*
HORIZONTAL SCALING:

1. Load Balancing (Nginx):

```nginx
upstream backend {
    least_conn;  # Connection-based load balancing
    server backend-1:8000;
    server backend-2:8000;
    server backend-3:8000;
    server backend-4:8000;
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.grammate.com;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

2. Database Replication:

```yaml
# Primary-replica setup
Primary DB:
  - All writes
  - Full dataset
  - Synchronous replication

Read Replicas (3):
  - Read-only
  - Async replication (lag < 100ms)
  - Load balanced for reads

Configuration:
backend/main.py
  - Write operations → primary
  - Read operations → replicas (round-robin)
```

3. Redis Cluster:

```python
# Redis cluster (6 nodes)
from rediscluster import RedisCluster

redis = RedisCluster(
    startup_nodes=[
        {"host": "redis-1", "port": 6379},
        {"host": "redis-2", "port": 6379},
        {"host": "redis-3", "port": 6379},
        {"host": "redis-4", "port": 6379},
        {"host": "redis-5", "port": 6379},
        {"host": "redis-6", "port": 6379},
    ],
    decode_responses=True
)

# Automatic failover, sharding, replication
# Throughput: 1M+ ops/sec
```

4. CDN for Static Assets:

```typescript
// CloudFlare / Cloudfront
const CDN_URL = "https://cdn.grammate.com";

const getImageUrl = (path: string) => {
  return `${CDN_URL}/${path}`;
};

// Cache headers
// Static assets: 1 year
// HTML: 1 hour
// API: no-cache
```

5. Search Optimization (Elasticsearch):

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(['localhost:9200'])

# Index video
es.index(
    index='videos',
    id=video_id,
    document={
        'title': video.title,
        'description': video.description,
        'creator': video.creator.username,
        'tags': video.tags,
        'view_count': video.view_count
    }
)

# Search
results = es.search(
    index='videos',
    query={
        'multi_match': {
            'query': search_term,
            'fields': ['title^2', 'description', 'tags']
        }
    }
)
```

VERTICAL SCALING:
- CPU: 32+ cores
- Memory: 256GB+
- Storage: 50TB+ (NVMe)
- Network: 10Gbps+

MONITORING INFRASTRUCTURE:
- Prometheus (metrics collection)
- Grafana (visualization)
- ELK stack (logging)
- Jaeger (distributed tracing)
- PagerDuty (alerting)
*/

// ============================================================
// COST OPTIMIZATION
// ============================================================

/*
1. Compute Resources:
   - Reserved instances (3 year): 40-50% savings
   - Spot instances (non-critical): 70-90% savings
   - Auto-scaling groups: Scale down during off-peak
   - Target: ~$10K/month for 1M monthly active users

2. Database:
   - Read replicas (async): $200-500/month
   - Automated backups: $50-100/month
   - Data transfer costs: Minimize cross-region traffic

3. Storage & CDN:
   - S3/equivalent: $0.02 per GB
   - CDN egress: $0.085 per GB
   - Target: ~$2-5K/month for 100TB videos

4. Services:
   - Stripe: 2.9% + $0.30 per transaction
   - Firebase: $0-100/month (pay per use)
   - SendGrid/Twilio: $10-50/month

Total estimated monthly cost (at 1M MAU):
- Compute: $10K
- Database: $1K
- Storage/CDN: $3K
- Services: $1K
- Monitoring/misc: $1K
= ~$16K/month

Revenue model (1M MAU):
- 30% conversion to revenue
- $50K monthly revenue (30% platform fee)
- 3x gross margin on costs
*/
