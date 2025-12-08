# Server Deployment Guide - Phase 3

This guide covers deploying your Eduverse backend to production. We'll cover both **free** and **paid** options.

## 🆓 FREE Deployment Options (Recommended for Prototypes)

### Option 1: Railway.app (EASIEST - Recommended)
**Cost:** FREE tier with $5/month credit (enough for small apps)
**Why:** No server management, automatic SSL, built-in domain

#### Steps:

1. **Create Railway Account**
   ```
   Visit: https://railway.app
   Sign up with GitHub
   ```

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin dev
   ```

3. **Create New Project on Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects Node.js

4. **Configure Environment Variables**
   - Go to your project → Variables
   - Add all variables from `.env`:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<your-jwt-secret>
   OPENAI_API_KEY=<your-openai-key>
   GOOGLE_API_KEY=<your-google-key>
   SEARCH_ENGINE_ID=<your-search-id>
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Railway automatically builds and deploys
   - You get a URL like: `https://your-app.up.railway.app`
   - SSL is automatic ✅

6. **Custom Domain (Optional)**
   - Settings → Domains → Add custom domain
   - Update DNS records as shown

**Total Time:** 10 minutes  
**Total Cost:** $0 (free tier)

---

### Option 2: Render.com (EASY)
**Cost:** FREE tier (apps sleep after 15 min inactivity)
**Why:** Simple, automatic SSL, good free tier

#### Steps:

1. **Create Render Account**
   ```
   Visit: https://render.com
   Sign up with GitHub
   ```

2. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Settings:
     - **Name:** eduverse-api
     - **Environment:** Node
     - **Build Command:** `cd server && npm install`
     - **Start Command:** `cd server && npm start`
     - **Instance Type:** Free

3. **Environment Variables**
   Add in Environment tab (same as Railway above)

4. **Deploy**
   - Click "Create Web Service"
   - Automatic SSL ✅
   - URL: `https://eduverse-api.onrender.com`

**Total Time:** 15 minutes  
**Total Cost:** $0 (free tier)  
**Note:** Free tier sleeps after 15 min - first request takes ~30s to wake up

---

### Option 3: Fly.io (FREE with limitations)
**Cost:** FREE tier (3 VMs, 3GB storage)
**Why:** More control, runs 24/7 on free tier

#### Steps:

1. **Install Fly CLI**
   ```powershell
   # Using PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login to Fly**
   ```powershell
   fly auth login
   ```

3. **Launch App**
   ```powershell
   cd "d:\VIisual Studio Code\EduVerse\Eduverse-Initial\server"
   fly launch
   ```
   
   Answer prompts:
   - App name: `eduverse-api`
   - Region: Choose closest to you
   - PostgreSQL: No (using Neon)
   - Deploy now: No

4. **Configure fly.toml**
   Edit the generated `fly.toml`:
   ```toml
   app = "eduverse-api"
   primary_region = "lax"

   [build]
     [build.args]
       NODE_VERSION = "22.17.0"

   [env]
     PORT = "3001"
     NODE_ENV = "production"

   [[services]]
     internal_port = 3001
     protocol = "tcp"

     [[services.ports]]
       port = 80
       handlers = ["http"]

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]

   [[services.http_checks]]
     interval = 10000
     timeout = 2000
     grace_period = "5s"
     method = "GET"
     path = "/api/health"
   ```

5. **Set Secrets**
   ```powershell
   fly secrets set NODE_ENV=production
   fly secrets set DATABASE_URL="your-neon-url"
   fly secrets set JWT_SECRET="your-jwt-secret"
   fly secrets set OPENAI_API_KEY="your-key"
   # ... add all environment variables
   ```

6. **Deploy**
   ```powershell
   fly deploy
   ```

**Total Time:** 20 minutes  
**Total Cost:** $0 (free tier)

---

## 💰 PAID Option: VPS with PM2 + Nginx (Traditional)

**Cost:** $4-6/month (DigitalOcean, Linode, Vultr)  
**Why:** Full control, best performance, learning experience

### Step 1: Get a VPS

#### DigitalOcean ($6/month - $200 free credit for students)
```
Visit: https://www.digitalocean.com/github-students
OR: https://m.do.co/c/your-referral (get $200 credit)

Create Droplet:
- Ubuntu 22.04 LTS
- Basic Plan - $6/month (1GB RAM)
- Choose datacenter region
- Add SSH key (recommended)
```

#### Alternative VPS Providers:
- **Linode/Akamai:** $5/month (https://www.linode.com)
- **Vultr:** $2.50/month starter (https://www.vultr.com)
- **Oracle Cloud:** FREE tier forever (2 VMs) (https://www.oracle.com/cloud/free/)

---

### Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v22.x
npm --version

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Create a non-root user (security best practice)
adduser eduverse
usermod -aG sudo eduverse
su - eduverse
```

---

### Step 3: Deploy Your Application

```bash
# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/Eduverse-Initial.git
cd Eduverse-Initial/server

# Install dependencies
npm install --production

# Create .env.production file
nano .env.production
```

Paste your production environment variables:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="your-neon-connection-string"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="your-openai-key"
GOOGLE_API_KEY="your-google-key"
SEARCH_ENGINE_ID="your-search-id"
CORS_ORIGINS=https://yourdomain.com
```

Save and exit (Ctrl+X, Y, Enter)

---

### Step 4: Configure PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Paste this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'eduverse-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Build and start the application:
```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs eduverse-api
```

**PM2 Useful Commands:**
```bash
pm2 restart eduverse-api    # Restart app
pm2 stop eduverse-api        # Stop app
pm2 logs eduverse-api        # View logs
pm2 monit                    # Monitor resources
pm2 reload eduverse-api      # Zero-downtime reload
```

---

### Step 5: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/eduverse
```

Paste this configuration:
```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream backend
upstream eduverse_backend {
    least_conn;
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;  # Change to your domain

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/eduverse-access.log;
    error_log /var/log/nginx/eduverse-error.log;

    # Proxy settings
    location / {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://eduverse_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Caching
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://eduverse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check endpoint (no rate limit)
    location /api/health {
        proxy_pass http://eduverse_backend;
        access_log off;
    }

    # File upload size limit
    client_max_body_size 50M;
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/eduverse /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If successful, restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

### Step 6: Setup SSL with Let's Encrypt (FREE)

**Prerequisites:** You need a domain name pointing to your server IP

1. **Get a Domain Name (FREE options):**
   - Freenom: https://www.freenom.com (free .tk, .ml, .ga domains)
   - DuckDNS: https://www.duckdns.org (free subdomain)
   - Or buy cheap domain: Namecheap, Cloudflare (~$10/year)

2. **Point Domain to Server:**
   - Create A record: `api.yourdomain.com` → `your-server-ip`
   - Wait 5-10 minutes for DNS propagation

3. **Install SSL Certificate:**
   ```bash
   # Get certificate
   sudo certbot --nginx -d api.yourdomain.com
   
   # Follow prompts:
   # - Enter email
   # - Agree to terms
   # - Choose to redirect HTTP to HTTPS (option 2)
   
   # Test auto-renewal
   sudo certbot renew --dry-run
   ```

4. **Verify SSL:**
   ```bash
   # Visit your domain
   https://api.yourdomain.com/api/health
   
   # Should show green padlock 🔒
   ```

**Certbot auto-renews certificates** every 60 days automatically!

---

### Step 7: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Deployment Comparison

| Feature | Railway | Render | Fly.io | VPS (DO) |
|---------|---------|--------|--------|----------|
| **Cost** | $0-5/mo | $0-7/mo | $0 | $6/mo |
| **Setup Time** | 10 min | 15 min | 20 min | 60 min |
| **SSL** | Auto ✅ | Auto ✅ | Auto ✅ | Manual |
| **Scaling** | Auto | Auto | Manual | Manual |
| **Sleep on Free** | No | Yes (15min) | No | N/A |
| **Learning Value** | Low | Low | Medium | High |
| **Control** | Low | Low | Medium | Full |
| **Best For** | Quick demo | MVP | Production | Learning |

---

## 🎯 RECOMMENDATION for Your Prototype

### For Quick Demo (Today):
→ **Railway.app** - Fastest, zero config, just works

### For Learning Experience:
→ **DigitalOcean VPS** - Learn PM2, Nginx, SSL (valuable skills)

### For Long-term Free:
→ **Fly.io** - Good free tier, doesn't sleep

---

## 🔄 Complete VPS Deployment Checklist

Using DigitalOcean as example:

```bash
# ✅ Step 1: Create Droplet (5 min)
# ✅ Step 2: SSH and update system (5 min)
# ✅ Step 3: Install Node.js + PM2 + Nginx (5 min)
# ✅ Step 4: Clone and setup app (5 min)
# ✅ Step 5: Configure PM2 (5 min)
# ✅ Step 6: Configure Nginx (10 min)
# ✅ Step 7: Setup SSL with Certbot (10 min)
# ✅ Step 8: Configure firewall (5 min)

# Total: ~50 minutes
```

---

## 🆘 Troubleshooting

### PM2 app won't start:
```bash
pm2 logs eduverse-api --lines 100
# Check for errors in environment variables
```

### Nginx 502 Bad Gateway:
```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/eduverse-error.log
```

### SSL certificate fails:
```bash
# Make sure domain points to server
dig api.yourdomain.com

# Check Nginx config
sudo nginx -t

# Try manual mode
sudo certbot certonly --standalone -d api.yourdomain.com
```

### Can't connect to database:
```bash
# Test Neon connection
node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); pool.query('SELECT NOW()', (err, res) => {console.log(err || res.rows); pool.end()});"
```

---

## 📚 Additional Resources

- **PM2 Documentation:** https://pm2.keymetrics.io/docs
- **Nginx Guide:** https://www.nginx.com/resources/wiki/start
- **Let's Encrypt:** https://letsencrypt.org/getting-started
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Fly.io Docs:** https://fly.io/docs

---

## 🎓 GitHub Student Pack (FREE Credits)

If you're a student, get FREE hosting credits:

**GitHub Student Developer Pack:**
- DigitalOcean: $200 credit (1 year)
- Azure: $100 credit
- Heroku: Free dyno hours
- And 50+ other tools

**Apply here:** https://education.github.com/pack

---

## Next Steps After Deployment

1. ✅ Deploy backend to Railway/VPS
2. ✅ Update frontend `API_URL` to point to deployed backend
3. ✅ Deploy frontend (Vercel/Netlify - covered in separate guide)
4. ✅ Test full application end-to-end
5. ✅ Setup monitoring (optional)
6. ✅ Configure backups (Neon does this automatically)

Good luck! 🚀
