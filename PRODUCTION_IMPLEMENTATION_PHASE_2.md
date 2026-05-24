/**
 * GramMate Production Implementation - Phase 2
 * Real-time features, payment integration, and deployment
 */

// ============================================================
// REALTIME SYSTEM ARCHITECTURE (WebSocket + Redis)
// ============================================================

/*
REALTIME FEATURES:

1. Live Notifications
   - Endpoint: WS /notifications/ws?token={jwt}
   - Messages:
     * follow: User followed you
     * like: User liked your video
     * comment: New comment on video
     * reply: Reply to your comment
     * tip: Creator tip received
     * payout: Payout processed
     * message: DM received
     * system: Platform notifications

2. Live Comments
   - Endpoint: WS /videos/{videoId}/comments/ws?token={jwt}
   - Messages:
     * comment_created: New comment
     * comment_deleted: Comment removed
     * comment_liked: Comment liked
     * comment_updated: Comment edited

3. Live Earnings
   - Endpoint: WS /wallet/earnings/ws?token={jwt}
   - Messages:
     * earning_added: New earning
     * balance_updated: Balance changed
     * payout_status: Payout update

REDIS PUBSUB CHANNELS:

notifications:user:{userId}
  - Publishes: {"type": "like", "video_id": "...", "user": {...}}

comments:video:{videoId}
  - Publishes: {"type": "comment_created", "comment": {...}}

earnings:user:{userId}
  - Publishes: {"type": "earning", "amount": 12.50, "source": "like"}

livestream:{streamId}
  - Publishes: {"type": "viewer_joined|chat_message|donation"}

moderation:queue
  - Publishes: {"type": "new_report", "priority": "high"}

IMPLEMENTATION (FastAPI):

```python
# app/api/v1/notifications.py
from fastapi import APIRouter, WebSocket, Depends
from typing import Set
from app.core.security import get_current_user_ws
from app.cache.redis import redis
import json

router = APIRouter(prefix="/notifications")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, user_id: str, websocket: WebSocket):
        self.active_connections[user_id].discard(websocket)
    
    async def broadcast(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(data)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Depends(get_current_user_ws)
):
    await manager.connect(user_id, websocket)
    
    # Subscribe to Redis channel
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"notifications:user:{user_id}")
    
    try:
        while True:
            # Listen for messages from client
            data = await websocket.receive_json()
            
            # Echo or process
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            # Listen for Redis messages
            message = pubsub.get_message()
            if message and message["type"] == "message":
                await websocket.send_json({
                    "type": message["data"]["type"],
                    "data": message["data"]
                })
    except Exception as e:
        await manager.disconnect(user_id, websocket)
        await pubsub.unsubscribe(f"notifications:user:{user_id}")

# Background task to publish notifications
async def send_notification(user_id: str, notification_data: dict):
    '''Called after DB transaction completes.'''
    await redis.publish(
        f"notifications:user:{user_id}",
        json.dumps(notification_data)
    )
    
    # Also save to DB for history
    notification = Notification(
        user_id=user_id,
        type=notification_data["type"],
        title=notification_data["title"],
        body=notification_data["body"]
    )
    db.add(notification)
    db.commit()
```

CELERY TASKS:

```python
# app/tasks/notification_tasks.py
from celery import shared_task
import json

@shared_task
def send_like_notification(video_id: str, liker_id: str):
    '''Called async after like is saved to DB.'''
    video = db.query(Video).get(video_id)
    liker = db.query(User).get(liker_id)
    
    notification_data = {
        "type": "like",
        "title": f"{liker.display_name} liked your video",
        "body": f"'{video.title}' got a new like",
        "action_url": f"/creator/studio/analytics/{video_id}",
        "icon": liker.avatar_url,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Publish to Redis
    redis.publish(
        f"notifications:user:{video.user_id}",
        json.dumps(notification_data)
    )
    
    # Send to mobile (FCM)
    send_fcm_notification(video.user_id, notification_data)
```

CLIENT-SIDE (React):

```typescript
// hooks/useRealtimeNotifications.ts
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useRealtimeNotifications = () => {
  const { token, user } = useAuth();
  
  useEffect(() => {
    if (!token || !user) return;
    
    const ws = new WebSocket(
      `${API_WS}/notifications/ws?token=${token}`
    );
    
    ws.onopen = () => {
      console.log('Connected to notifications');
    };
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      // Show toast notification
      showNotification(notification);
      
      // Update store
      if (notification.type === 'like') {
        updateVideoLikeCount(notification.video_id);
      } else if (notification.type === 'earning') {
        updateWalletBalance(notification.amount);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Reconnect logic with exponential backoff
      setTimeout(() => reconnectWebSocket(), 3000);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from notifications');
    };
    
    return () => ws.close();
  }, [token, user]);
};
```
*/

// ============================================================
// PAYMENT & STRIPE INTEGRATION
// ============================================================

/*
STRIPE INTEGRATION:

1. Connect Account Setup
   - Use Stripe Connect for creator payouts
   - Each verified creator has Stripe account
   - GramMate takes 30% platform fee

2. Customer Subscription (Fan Tips)
   - Product ID: price_xxxxx
   - Tiers: $0.99, $4.99, $9.99, $19.99, $99.99
   - Recurring monthly
   - Webhook: invoice.payment_succeeded

3. Creator Payout
   - Transfer API to creator's Stripe account
   - Weekly payouts to bank account
   - Automatic or manual approval

IMPLEMENTATION:

```python
# app/services/payment_service.py
import stripe
from app.core.config import STRIPE_SECRET_KEY

stripe.api_key = STRIPE_SECRET_KEY

class StripeService:
    
    @staticmethod
    def create_subscription(
        user_id: str,
        creator_id: str,
        tier: str  # 'tier_1' | 'tier_2' | ...
    ):
        '''Create subscription to support creator.'''
        
        # Get or create customer
        user = User.query.get(user_id)
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": user_id}
        )
        
        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{
                "price": TIER_PRICES[tier]
            }],
            metadata={
                "user_id": user_id,
                "creator_id": creator_id,
                "tier": tier
            }
        )
        
        # Save to DB
        sub_record = Subscription(
            user_id=user_id,
            creator_id=creator_id,
            stripe_subscription_id=subscription.id,
            tier=tier,
            status='active'
        )
        db.add(sub_record)
        db.commit()
        
        return subscription
    
    @staticmethod
    def handle_payment_webhook(event):
        '''Handle Stripe events.'''
        
        if event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            subscription_id = invoice['subscription']
            
            # Get subscription
            sub = Subscription.query.filter_by(
                stripe_subscription_id=subscription_id
            ).first()
            
            if sub:
                # Add to creator earnings
                amount = invoice['amount_paid'] / 100
                creator_fee = amount * 0.70  # 70% to creator
                
                transaction = Transaction(
                    user_id=sub.creator_id,
                    type='subscription',
                    amount=creator_fee,
                    status='completed',
                    description=f"Tier {sub.tier} subscription from @{sub.subscriber.username}"
                )
                db.add(transaction)
                
                # Update wallet
                wallet = WalletBalance.query.get(sub.creator_id)
                wallet.available_balance += creator_fee
                
                db.commit()
    
    @staticmethod
    def create_transfer_to_creator(
        creator_id: str,
        amount: float,
        description: str
    ):
        '''Transfer earnings to creator's Stripe account.'''
        
        creator = User.query.get(creator_id)
        stripe_account = creator.stripe_account_id
        
        if not stripe_account:
            raise Exception("Creator not connected to Stripe")
        
        # Create transfer
        transfer = stripe.Transfer.create(
            amount=int(amount * 100),  # cents
            currency="usd",
            destination=stripe_account,
            description=description,
            metadata={"creator_id": creator_id}
        )
        
        # Save payout record
        payout = PayoutRequest(
            user_id=creator_id,
            amount=amount,
            status='completed',
            external_payout_id=transfer.id
        )
        db.add(payout)
        db.commit()
        
        return transfer

# app/api/v1/webhooks.py
@router.post("/stripe")
async def stripe_webhook(request: Request):
    '''Stripe webhook endpoint.'''
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return {"error": "Invalid payload"}
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature"}
    
    # Route to handler
    if event['type'] == 'invoice.payment_succeeded':
        StripeService.handle_payment_webhook(event)
    elif event['type'] == 'payment_intent.succeeded':
        handle_payment_intent(event)
    
    return {"status": "received"}
```

FRONTEND PAYMENT FLOW:

```typescript
// pages/WalletPage/WithdrawalFlow.tsx
const WithdrawalFlow = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  
  const handleInitiateWithdrawal = async () => {
    const response = await api.post('/wallet/withdraw', {
      amount: parseFloat(amount),
      payout_method_id: selectedMethod
    });
    
    const { client_secret } = response.data;
    
    // Initialize Stripe Elements
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
    
    // Confirm payment
    const { error } = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: user.display_name }
      }
    });
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Withdrawal initiated');
      setStep(2);
    }
  };
  
  return (
    <div>
      {step === 1 && (
        <>
          <Input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to withdraw"
          />
          <Select 
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            {payoutMethods.map(m => (
              <option key={m.id} value={m.id}>{m.type}</option>
            ))}
          </Select>
          <Button onClick={handleInitiateWithdrawal}>
            Continue
          </Button>
        </>
      )}
    </div>
  );
};
```
*/

// ============================================================
// DEPLOYMENT & DEVOPS
// ============================================================

/*
DOCKER COMPOSE (Production):

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: grammate
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: grammate
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U grammate"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://grammate:${DB_PASSWORD}@postgres:5432/grammate
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      FIREBASE_CREDENTIALS: ${FIREBASE_CREDENTIALS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_FIREBASE_CONFIG: ${FIREBASE_CONFIG}
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

KUBERNETES DEPLOYMENT:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grammate-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grammate-backend
  template:
    metadata:
      labels:
        app: grammate-backend
    spec:
      containers:
      - name: backend
        image: grammate/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: grammate-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: grammate-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: grammate-backend-service
spec:
  selector:
    app: grammate-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

GITHUB ACTIONS CI/CD:

```yaml
# .github/workflows/deploy.yml
name: Deploy GramMate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        pytest --cov=app tests/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build backend Docker image
      run: |
        docker build -t grammate/backend:latest ./backend
        docker tag grammate/backend:latest grammate/backend:${{ github.sha }}
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push grammate/backend:latest
        docker push grammate/backend:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/grammate-backend \
          backend=grammate/backend:${{ github.sha }} \
          --record
        kubectl rollout status deployment/grammate-backend
```

MONITORING & ALERTING:

```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'grammate-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']

# Alert rules
rule_files:
  - 'alerts.yml'
```
*/

// ============================================================
// SECURITY BEST PRACTICES
// ============================================================

/*
AUTHENTICATION & AUTHORIZATION:

1. JWT Token Structure:
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "creator|user|admin",
  "permissions": ["read:videos", "write:videos"],
  "exp": 1234567890,
  "iat": 1234567800,
  "iss": "grammate.com"
}

2. Token Expiration:
- Access token: 1 hour
- Refresh token: 7 days
- 2FA: 15 minutes

3. Password Requirements:
- Minimum 8 characters
- Must contain uppercase + lowercase + number + symbol
- Salted + hashed with bcrypt (10 rounds)

4. 2FA Implementation:
- TOTP (Time-based One-Time Password)
- Backup codes
- SMS option

5. Rate Limiting:
- Login: 5 attempts per 15 minutes
- API: 100 requests per minute per IP
- Upload: 10 per hour per user

6. CORS Configuration:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://grammate.com", "https://app.grammate.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600
)
```

7. Data Encryption:
- TLS 1.3 for all traffic
- AES-256 for sensitive data at rest
- PII fields encrypted (payment info, SSN)

8. SQL Injection Prevention:
- Use parameterized queries (SQLAlchemy ORM)
- Input validation + sanitization
- No raw SQL queries

9. XSS Prevention:
- HTML escaping on output
- Content Security Policy headers
- React auto-escapes JSX

10. CSRF Protection:
- CSRF tokens for state-changing requests
- SameSite cookies
- Referer validation

11. Audit Logging:
```python
from app.utils.audit import log_action

# Log all sensitive actions
log_action(
    user_id=current_user.id,
    action="payout_requested",
    resource="payout_#12345",
    details={"amount": 500, "method": "bank"},
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)
```

12. API Key Management:
- Keys rotated every 90 days
- Rate limited per key
- Revocation support
- Scoped permissions

13. Secrets Management:
- Use environment variables (never in code)
- Separate keys per environment
- Encryption at rest in secret store
- Regular rotation

14. Dependency Scanning:
```bash
# Check for vulnerabilities
pip install safety
safety check

# Or use Snyk
npm install -g snyk
snyk test
```
*/
