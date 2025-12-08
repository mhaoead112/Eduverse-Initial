# 🚀 EduVerse Production Deployment - Step-by-Step Guide

## 📋 Prerequisites

- [ ] Node.js 18+ installed on production server
- [ ] PostgreSQL 14+ database
- [ ] Domain name configured
- [ ] SSL/TLS certificates
- [ ] Production server access (SSH)

---

## Phase 1: Pre-Deployment Preparation (30 minutes)

### Step 1: Generate Production Secrets

```bash
# Generate JWT Secret (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and save for Step 3

# Generate VAPID Keys for Push Notifications
cd server
npx web-push generate-vapid-keys
# Copy both public and private keys and save for Step 3
```

### Step 2: Set Up Production Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create production database
CREATE DATABASE eduverse_production;

-- Create database user
CREATE USER eduverse_admin WITH ENCRYPTED PASSWORD 'your-secure-password-here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE eduverse_production TO eduverse_admin;

-- Exit
\q
```

Get your connection string:
```
postgresql://eduverse_admin:your-secure-password-here@your-db-host:5432/eduverse_production
```

### Step 3: Configure Environment Variables

**On your production server**, create `server/.env`:

```bash
# Copy the production template
cp server/.env.production server/.env

# Edit with production values
nano server/.env
```

**Fill in these REQUIRED values:**

```env
# Database
DATABASE_URL="postgresql://eduverse_admin:password@your-db-host:5432/eduverse_production"

# JWT Secret (from Step 1)
JWT_SECRET="paste-your-generated-secret-here"

# Environment
NODE_ENV="production"

# CORS - YOUR PRODUCTION DOMAINS
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# VAPID Keys (from Step 1)
VAPID_SUBJECT="mailto:admin@yourdomain.com"
VAPID_PUBLIC_KEY="paste-public-key-here"
VAPID_PRIVATE_KEY="paste-private-key-here"

# Optional: OpenAI (if using AI features)
OPENAI_API_KEY="sk-your-production-key"

# Optional: Sentry (recommended for error tracking)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Cookie Secret (can be same as JWT_SECRET or different)
COOKIE_SECRET="paste-your-generated-secret-here"
```

**Create `client/.env.production`:**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## Phase 2: Database Setup (15 minutes)

### Step 4: Run Database Migrations

```bash
cd server

# Install dependencies if not already done
npm install

# Run migrations
npm run db:push
# or if you have a migration script:
npm run migrate
```

### Step 5: Add Database Indexes (Performance)

```bash
# Connect to production database
psql -U eduverse_admin -d eduverse_production
```

```sql
-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_participant ON conversation_participants(participant_id);

-- Exit
\q
```

### Step 6: Set Up Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-eduverse-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/eduverse"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U eduverse_admin eduverse_production | gzip > $BACKUP_DIR/eduverse_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "eduverse_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/eduverse_backup_$DATE.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-eduverse-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-eduverse-db.sh
```

---

## Phase 3: Server Deployment (30 minutes)

### Step 7: Build the Backend

```bash
cd server

# Install production dependencies
npm ci --production

# Build TypeScript
npm run build
# This creates the dist/ folder
```

### Step 8: Install Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'eduverse-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Follow the command it shows

# Monitor
pm2 monit
```

### Step 9: Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/eduverse
```

```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API Routes
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # File Upload Size
    client_max_body_size 50M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/eduverse /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 10: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## Phase 4: Frontend Deployment (20 minutes)

### Step 11: Build the Frontend

```bash
cd client

# Install dependencies
npm ci

# Build for production
npm run build
# This creates the dist/ folder
```

### Step 12: Deploy Frontend (Choose One)

#### Option A: Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd client
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://api.yourdomain.com
# VITE_WS_URL=wss://api.yourdomain.com
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd client
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

#### Option C: Self-Hosted with Nginx

```bash
# Copy build to server
scp -r client/dist/* user@server:/var/www/eduverse/

# Nginx config for frontend
sudo nano /etc/nginx/sites-available/eduverse-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/eduverse;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/eduverse-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Phase 5: Post-Deployment Verification (15 minutes)

### Step 13: Health Checks

```bash
# Test API health endpoint
curl https://api.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","environment":"production","uptime":...}

# Test WebSocket
# Use browser console on your frontend:
# const ws = new WebSocket('wss://api.yourdomain.com');
# ws.onopen = () => console.log('Connected');
```

### Step 14: Test Core Functionality

**Manual Testing Checklist:**
- [ ] Open https://yourdomain.com
- [ ] Register a new user
- [ ] Login with credentials
- [ ] Test file upload (profile picture)
- [ ] Test real-time messaging
- [ ] Test push notifications
- [ ] Check AI chat functionality
- [ ] Verify database connectivity
- [ ] Test each user role (student, teacher, parent, admin)

### Step 15: Set Up Monitoring

#### A. Application Monitoring (Sentry)

1. Sign up at https://sentry.io
2. Create new project
3. Copy DSN
4. Add to `server/.env`:
   ```env
   SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   ```
5. Restart server: `pm2 restart eduverse-api`

#### B. Uptime Monitoring

**Option 1: UptimeRobot (Free)**
1. Sign up at https://uptimerobot.com
2. Add monitor: https://api.yourdomain.com/api/health
3. Set check interval: 5 minutes
4. Add alert contacts (email/SMS)

**Option 2: Pingdom**
1. Sign up at https://pingdom.com
2. Add uptime check
3. Configure alerts

#### C. Server Monitoring

```bash
# Install htop for server monitoring
sudo apt install htop

# Monitor PM2 processes
pm2 monit

# Check logs
pm2 logs eduverse-api

# Check system logs
sudo journalctl -u nginx -f
```

### Step 16: Configure Log Rotation

```bash
# PM2 logs are already handled
# Configure system log rotation
sudo nano /etc/logrotate.d/eduverse
```

```
/var/www/eduverse/server/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Phase 6: Security Hardening (10 minutes)

### Step 17: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 5432/tcp # PostgreSQL (only if remote)
sudo ufw enable

# Check status
sudo ufw status
```

### Step 18: Fail2Ban (Protect against brute force)

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true
```

```bash
# Restart
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

---

## Phase 7: Maintenance & Operations

### Daily Tasks

```bash
# Check server status
pm2 status

# Check logs for errors
pm2 logs --lines 100

# Monitor resource usage
htop
```

### Weekly Tasks

```bash
# Check database size
psql -U eduverse_admin -d eduverse_production -c "SELECT pg_size_pretty(pg_database_size('eduverse_production'));"

# Review error logs
tail -n 100 server/logs/error.log

# Check SSL certificate expiry
sudo certbot certificates
```

### Monthly Tasks

```bash
# Update server packages
sudo apt update && sudo apt upgrade

# Review and clean old logs
pm2 flush

# Database maintenance
psql -U eduverse_admin -d eduverse_production -c "VACUUM ANALYZE;"
```

---

## 🆘 Troubleshooting

### Server Won't Start

```bash
# Check PM2 logs
pm2 logs eduverse-api --lines 50

# Check if port 3001 is in use
sudo lsof -i :3001

# Restart PM2
pm2 restart eduverse-api
```

### Database Connection Errors

```bash
# Test database connection
psql -U eduverse_admin -d eduverse_production -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo journalctl -u postgresql -n 50
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

---

## 📊 Performance Optimization

### Enable Redis Caching (Optional)

```bash
# Install Redis
sudo apt install redis-server

# Install Redis client in Node.js
cd server
npm install redis

# Configure in your code for session storage and caching
```

### Database Query Optimization

```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add EXPLAIN ANALYZE to slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

---

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] Database migrated and indexed
- [ ] Backups scheduled (daily)
- [ ] SSL certificates installed
- [ ] PM2 running and configured for auto-restart
- [ ] Nginx reverse proxy configured
- [ ] Frontend deployed and accessible
- [ ] Health endpoint responding
- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured
- [ ] Firewall rules applied
- [ ] Fail2Ban configured
- [ ] All user roles tested
- [ ] Push notifications working
- [ ] WebSocket connections stable
- [ ] File uploads working
- [ ] Email notifications configured (if applicable)
- [ ] Documentation updated with production URLs

---

## 📞 Support Contacts

**Server Issues:** Check PM2 logs first  
**Database Issues:** Check PostgreSQL logs  
**SSL Issues:** Check Certbot and Nginx logs  
**Application Errors:** Check Sentry dashboard  
**Performance Issues:** Check server resources with `htop`

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production URL:** https://yourdomain.com  
**API URL:** https://api.yourdomain.com  

✅ **Production deployment complete!**
