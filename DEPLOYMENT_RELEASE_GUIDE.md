# GramMate Deployment & Release Guide

Production deployment strategies and release management for GramMate.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (100% green on CI/CD)
- [ ] No console warnings/errors
- [ ] Code linted and formatted
- [ ] No hardcoded secrets or API keys
- [ ] Performance benchmarks met
- [ ] Load testing completed

### Security
- [ ] HTTPS/TLS configured
- [ ] CORS headers set correctly
- [ ] Rate limiting enabled
- [ ] JWT secrets rotated
- [ ] Database credentials updated
- [ ] API keys and tokens rotated
- [ ] Security headers configured
- [ ] Vulnerability scan clean

### Infrastructure
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Logging configured
- [ ] CDN configured
- [ ] DNS records updated
- [ ] SSL certificates valid
- [ ] Load balancer configured
- [ ] Auto-scaling policies set

### Data
- [ ] Database migration tested on staging
- [ ] Data migration script prepared
- [ ] Rollback procedure documented
- [ ] Backup taken

---

## Deployment Strategies

### Strategy 1: Blue-Green Deployment

Maintain two identical production environments.

```yaml
# deployment-blue-green.yaml
apiVersion: v1
kind: Service
metadata:
  name: grammate-api
spec:
  selector:
    version: blue  # Toggle between blue/green
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000

# Deploy to green
kubectl apply -f grammate-backend-green.yaml

# Run tests on green
./run_smoke_tests.sh http://grammate-green.example.com

# Switch traffic to green
kubectl patch service grammate-api -p '{"spec":{"selector":{"version":"green"}}}'

# Blue remains ready for instant rollback
```

### Strategy 2: Canary Deployment

Gradually roll out to percentage of users.

```yaml
# Istio VirtualService for canary
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: grammate-api
spec:
  hosts:
  - grammate.com
  http:
  # 90% to stable, 10% to canary
  - match:
    - headers:
        user-cookie:
          regex: ".*canary.*"
    route:
    - destination:
        host: grammate-api-canary
        port:
          number: 8000
  - route:
    - destination:
        host: grammate-api-stable
        port:
          number: 8000
      weight: 90
    - destination:
        host: grammate-api-canary
        port:
          number: 8000
      weight: 10
```

### Strategy 3: Rolling Deployment

Gradually replace old instances with new ones.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grammate-backend
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # One extra pod during update
      maxUnavailable: 0  # Never go below 4 pods
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
        image: grammate/backend:v1.2.0
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Release Process

### Version Management

Follow semantic versioning: `MAJOR.MINOR.PATCH`

```
v1.2.3
├── 1 = Breaking changes
├── 2 = New features (backward compatible)
└── 3 = Bug fixes
```

### Release Steps

1. **Prepare Release Branch**
```bash
git checkout -b release/v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

2. **Update Version Numbers**
```bash
# Frontend
sed -i 's/"version": "1.1.0"/"version": "1.2.0"/' frontend/package.json

# Backend
sed -i "s/__version__ = '1.1.0'/__version__ = '1.2.0'/" backend/app/__init__.py

git commit -am "Bump version to v1.2.0"
```

3. **Build & Test**
```bash
# Backend
docker build -t grammate/backend:v1.2.0 ./backend
docker tag grammate/backend:v1.2.0 grammate/backend:latest

# Frontend
npm run build

# Run test suite
pytest
npm run test
```

4. **Deploy to Staging**
```bash
# Deploy to staging environment
kubectl set image deployment/grammate-backend-staging \
  backend=grammate/backend:v1.2.0

# Run smoke tests
./tests/smoke_tests.sh https://staging.grammate.com

# Load testing
./tests/load_tests.sh https://staging.grammate.com
```

5. **Deploy to Production**

**Option A: Blue-Green**
```bash
# Deploy to green
docker-compose -f docker-compose.prod.green.yml up -d

# Verify health
curl https://green.grammate.com/health

# Switch traffic
aws elb set-instance-ports grammate-load-balancer \
  --load-balancer-port 443:8000 \
  --instance-port 8000:9000

# Monitor
./monitor_deployment.sh
```

**Option B: Rolling Update**
```bash
# Update deployment image
kubectl set image deployment/grammate-backend \
  backend=grammate/backend:v1.2.0 --record

# Monitor rollout
kubectl rollout status deployment/grammate-backend

# Get rollout history
kubectl rollout history deployment/grammate-backend
```

---

## Database Migrations

### Migration Workflow

```bash
# Create migration
alembic revision --autogenerate -m "Add user preferences table"

# Review generated migration
vim alembic/versions/001_add_user_preferences.py

# Test migration locally
alembic upgrade head

# Dry-run on staging
alembic upgrade head --sql > migration_preview.sql

# Apply on production (with backup)
backup_database.sh
alembic upgrade head
```

### Safe Migration Practices

1. **Always Backup First**
```bash
pg_dump grammate > backup_$(date +%s).sql
```

2. **Test on Staging**
```bash
# Clone production data to staging
pg_dump grammate | psql grammate_staging

# Run migration
alembic upgrade head
```

3. **Use Transactions**
```python
# alembic/versions/001_migration.py
def upgrade():
    op.create_table(...)  # Wrapped in transaction

def downgrade():
    op.drop_table(...)    # Can rollback
```

4. **Rollback Plan**
```bash
# Save downgrade version
alembic current  # e.g., ace1027cdc5a

# Rollback if needed
alembic downgrade ace1027cdc5a
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

```yaml
# prometheus/alerts.yml
groups:
  - name: grammate-alerts
    rules:
      # API Response Time
      - alert: HighAPILatency
        expr: histogram_quantile(0.99, rate(api_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations:
          summary: "API latency > 500ms"

      # Error Rate
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: "Error rate > 1%"

      # Database Connection Pool
      - alert: DatabaseConnectionPoolExhausted
        expr: db_connection_pool_available{job="grammate"} < 5
        for: 5m
        annotations:
          summary: "Only {{ $value }} DB connections available"

      # Memory Usage
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 10m
        annotations:
          summary: "Memory usage > 90%"

      # Disk Space
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        annotations:
          summary: "Disk space < 10%"
```

### Dashboards

Create dashboards in Grafana:

```
1. Service Health
   - API response time (p50, p99)
   - Error rate
   - Request throughput

2. Business Metrics
   - Active users
   - Videos uploaded
   - Total views
   - Revenue

3. Infrastructure
   - CPU/Memory usage
   - Disk I/O
   - Network bandwidth
   - Database metrics

4. Security
   - Failed logins
   - Rate limit hits
   - Suspicious activity
```

---

## Rollback Procedures

### Code Rollback

```bash
# Kubernetes rollback
kubectl rollout undo deployment/grammate-backend

# Or specific revision
kubectl rollout undo deployment/grammate-backend --to-revision=5

# Docker Compose rollback
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback

```bash
# Single migration
alembic downgrade -1

# Multiple migrations
alembic downgrade -2

# Specific version
alembic downgrade ace1027cdc5a
```

### Emergency Rollback

```bash
# 1. Stop new version
kubectl scale deployment grammate-backend --replicas=0

# 2. Restore from backup
restore_database.sh backup_20260524_100000.sql

# 3. Restart old version
kubectl set image deployment/grammate-backend \
  backend=grammate/backend:v1.1.0

# 4. Verify health
curl https://grammate.com/health

# 5. Notify team
./notify_team.sh "ROLLED BACK TO v1.1.0 - Database restored"
```

---

## Incident Response

### Incident Severity Levels

**P0 - Critical** (< 1 min response)
- Service completely down
- Data loss occurring
- Security breach

**P1 - High** (< 5 min response)
- Degraded performance (>50% error rate)
- Major feature broken
- > 1000 users affected

**P2 - Medium** (< 30 min response)
- Moderate performance issue
- Minor feature broken
- < 1000 users affected

**P3 - Low** (< 4 hour response)
- Minor issue
- Workaround available
- < 100 users affected

### Response Procedure

1. **Declare Incident**
```bash
./declare_incident.sh "P1" "API response time degraded"
```

2. **Page On-Call Team**
```
PagerDuty → Slack → SMS
```

3. **Investigate**
```bash
# Check logs
kubectl logs deployment/grammate-backend --tail=1000

# Check metrics
# Check recent deployments
kubectl rollout history deployment/grammate-backend
```

4. **Mitigate**
- Rollback to last known good version
- Scale up resources
- Enable circuit breakers
- Redirect traffic

5. **Document & Post-Mortem**
- Root cause analysis
- Action items
- Prevention measures

---

## Performance Optimization

### Pre-Deployment Performance Checks

```bash
# Frontend build size
npm run build
du -sh build/

# Frontend bundle analysis
npm run build:analyze

# Backend query analysis
# Enable query logging and check slow queries

# Load testing
ab -n 10000 -c 100 https://api.grammate.com/health

# Lighthouse audit
lighthouse https://grammate.com --output=json
```

### Post-Deployment Validation

```bash
# Check Web Vitals
curl https://api.grammate.com/metrics/web-vitals

# Check error rate
curl https://api.grammate.com/metrics/errors

# Check API latency
curl https://api.grammate.com/metrics/latency
```

---

## Cost Optimization

### Resource Limits

```yaml
# Set appropriate limits to prevent runaway costs
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: grammate-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grammate-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Backup & Disaster Recovery

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="grammate_backup_${DATE}.sql"

# Database backup
pg_dump grammate | gzip > /backups/${BACKUP_FILE}.gz

# Upload to S3
aws s3 cp /backups/${BACKUP_FILE}.gz s3://grammate-backups/

# Cleanup old backups
find /backups -name "*.gz" -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore latest backup
LATEST_BACKUP=$(aws s3 ls s3://grammate-backups/ | tail -1 | awk '{print $NF}')
aws s3 cp s3://grammate-backups/${LATEST_BACKUP} /tmp/

# Restore to database
gunzip -c /tmp/${LATEST_BACKUP} | psql grammate

# Verify data integrity
psql grammate -c "SELECT COUNT(*) FROM users;"
```

---

## Compliance & Auditing

### Security Audit Checklist

- [ ] All logs retention > 90 days
- [ ] API audit logging enabled
- [ ] Authentication attempts logged
- [ ] Data access logs reviewed
- [ ] SSL/TLS certificates valid
- [ ] Security patches applied
- [ ] Vulnerability scan complete

### GDPR Compliance

- [ ] Data export functionality implemented
- [ ] Data deletion functionality implemented
- [ ] Consent logging in place
- [ ] Data processing agreements signed

---

## Documentation

Every deployment should include:

1. **Release Notes**
   - New features
   - Bug fixes
   - Breaking changes
   - Migration instructions

2. **Deployment Notes**
   - Prerequisites
   - Steps taken
   - Configuration changes
   - Rollback instructions

3. **Performance Impact**
   - Before/after metrics
   - Resource usage
   - User experience changes

---

Last Updated: May 24, 2026
