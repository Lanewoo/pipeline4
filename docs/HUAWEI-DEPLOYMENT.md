# Huawei Cloud Deployment Guide

## Overview

This guide walks you through deploying the Pipeline Manager application on Huawei Cloud using:
- **SWR** (Software Repository for Containers) - Container registry
- **ECS** (Elastic Cloud Server) - Virtual machine hosting
- **GitHub Actions** - Automated CI/CD pipeline

---

## Prerequisites

1. **Huawei Cloud Account** - Sign up at https://www.huaweicloud.com/
2. **GitHub Account** - Repository already pushed  
3. **Huawei Cloud CLI** (optional) - For manual management
4. **Docker Desktop** (optional) - For local testing

---

## Step 1: Set Up Huawei Cloud Services

### 1.1 Create a Container Registry (SWR)

```bash
# 1. Log in to Huawei Cloud Console
# 2. Navigate to: Container Registry (SWR)
# 3. Create Organization
#    - Organization Name: my-org (or your preference)
#    - Click "Create"

# 4. Your SWR registry URL will be:
#    swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager
```

**Note**: Change `cn-east-3` to your region if needed:
- `cn-north-4` - Beijing
- `cn-east-3` - Shanghai
- `cn-south-1` - Guangzhou
- `ap-southeast-1` - Singapore

### 1.2 Generate Access Credentials

```bash
# 1. Log in to Huawei Cloud Console
# 2. Click your account icon (top-right) → My Credentials
# 3. Go to "API Credentials" tab
# 4. Create new AK/SK pair:
#    - Click "Create Access Key"
#    - Download the CSV file (save securely!)
#    - You'll get: Access Key ID and Secret Access Key

# For SWR login (simple way):
# 1. Go to Container Registry → My Organizations
# 2. Click the "Generate Login Command" button
# 3. Get your temporary login credentials
```

### 1.3 Create ECS Instance

```bash
# 1. Navigate to: Elastic Cloud Server (ECS)
# 2. Click "Create ECS"
# 3. Configure:
#    - Image: Ubuntu 20.04 LTS (recommended)
#    - Flavor: 2 vCPU, 4GB RAM minimum
#    - Storage: 20GB
#    - Network: Create VPC or use default
#    - Public IP: Assign elastic IP
#    - Security Group: Allow inbound 22 (SSH), 5000 (HTTP), 443 (HTTPS)

# 4. Save the instance ID and public IP
```

### 1.4 Set Security Group Rules

```bash
# Allow inbound traffic:
Protocol | Port   | Source
---------|--------|----------
TCP      | 22     | Your IP (for SSH)
TCP      | 5000   | 0.0.0.0/0 (app traffic) OR 0.0.0.0/::/0 (IPv6)
TCP      | 443    | 0.0.0.0/0 (HTTPS)
```

---

## Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository:

**Navigate to**: Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `HUAWEI_CLOUD_USERNAME` | Your Huawei Cloud email/username | Huawei Cloud account |
| `HUAWEI_CLOUD_PASSWORD` | Your Huawei Cloud password | Huawei Cloud account |
| `HUAWEI_CLOUD_ORGANIZATION` | Your SWR organization (e.g., `my-org`) | Container Registry → My Organizations |
| `HUAWEI_CLOUD_AK` | Access Key ID | My Credentials → API Credentials |
| `HUAWEI_CLOUD_SK` | Secret Access Key | My Credentials → API Credentials |
| `HUAWEI_CLOUD_PROJECT_ID` | Project ID | My Credentials → Projects |
| `HUAWEI_ECS_INSTANCE_ID` | Your ECS instance ID | ECS → Instances |

---

## Step 3: Deploy with GitHub Actions

### Option A: Automatic Deployment (Recommended)

```bash
# 1. Commit and push code to GitHub
git add .
git commit -m "Deploy to Huawei Cloud"
git push origin main

# 2. Go to GitHub → Actions
# 3. The "Deploy to Huawei Cloud" workflow will run automatically
# 4. Watch the build and push progress
# 5. Once complete, proceed to Step 4
```

### Option B: Manual Docker Push

```bash
# Build locally
docker build -t pipeline-manager:latest .

# Log in to Huawei SWR
docker login -u [USERNAME] -p [PASSWORD] swr.cn-east-3.myhuaweicloud.com

# Tag image
docker tag pipeline-manager:latest \
  swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest

# Push to SWR
docker push swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
```

---

## Step 4: Deploy on ECS Instance

### 4.1 SSH into ECS

```bash
# Use your private key from ECS creation
ssh -i your-key.pem ubuntu@[ECS_PUBLIC_IP]

# Or use your key pair if stored in Huawei Cloud
```

### 4.2 Install Docker (if not pre-installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### 4.3 Pull and Run Application

```bash
# Log in to Huawei SWR
docker login -u [USERNAME] -p [PASSWORD] swr.cn-east-3.myhuaweicloud.com

# Pull the latest image
docker pull swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest

# Create data directory
mkdir -p ~/pipeline-data

# Run the container
docker run -d \
  --name pipeline-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secure-secret-key-here \
  -e DATABASE_URL=sqlite:///data/pipeline.db \
  -v ~/pipeline-data:/app/data \
  --restart unless-stopped \
  swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest

# View logs
docker logs -f pipeline-manager

# Check status
docker ps
```

### 4.4 Set Up Reverse Proxy (Nginx) - Recommended

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/pipeline-manager > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/pipeline-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4.5 Set Up HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace your-domain.com)
sudo certbot certonly --nginx -d your-domain.com

# Update Nginx config with SSL
sudo tee /etc/nginx/sites-available/pipeline-manager > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 5: Verify Deployment

```bash
# Check if app is running
curl http://localhost:5000

# Check container status
docker ps

# View logs
docker logs pipeline-manager

# Access application
# Browser: http://[ECS_PUBLIC_IP]:5000
# Or: https://your-domain.com (if domain configured)

# Default credentials
# Username: admin
# Password: (set via DEFAULT_ADMIN_PASSWORD in .env)
# ⚠️ SET A STRONG PASSWORD IN .env BEFORE FIRST RUN!
```

---

## Step 6: Database Setup (Production)

### Option A: SQLite (Simpler, Single ECS)
```bash
# Data already persists in the volume
# ~/pipeline-data/pipeline.db is automatically created
```

### Option B: RDS PostgreSQL (More Scalable)

```bash
# 1. Create RDS for PostgreSQL in Huawei Cloud Console
# 2. Get connection string: 
#    postgresql://user:pass@host:port/dbname

# 3. Update Docker run command:
docker run -d \
  --name pipeline-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=postgresql://user:pass@rds-host:5432/pipeline_db \
  --restart unless-stopped \
  swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
```

---

## Updating the Application

After making changes to your code:

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "Update feature"
git push origin main

# 2. GitHub Actions automatically builds and pushes new image

# 3. On ECS, pull new image and restart
docker stop pipeline-manager
docker rm pipeline-manager
docker pull swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
docker run -d \
  --name pipeline-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -v ~/pipeline-data:/app/data \
  --restart unless-stopped \
  swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
```

Or automate with:
```bash
# Create deployment script on ECS
cat > ~/deploy.sh <<'EOF'
#!/bin/bash
docker stop pipeline-manager || true
docker rm pipeline-manager || true
docker pull swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
docker run -d \
  --name pipeline-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=${JWT_SECRET} \
  -v ~/pipeline-data:/app/data \
  --restart unless-stopped \
  swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager:latest
EOF

chmod +x ~/deploy.sh
```

---

## Monitoring & Maintenance

### Check Application Health

```bash
# Application health endpoint
curl http://localhost:5000/health

# Container logs
docker logs -f --tail 50 pipeline-manager

# System resources
docker stats pipeline-manager
free -h
df -h
```

### Database Backup

```bash
# Backup SQLite database
cp ~/pipeline-data/pipeline.db ~/pipeline-data/pipeline-$(date +%Y%m%d-%H%M%S).db

# Or set up automated backups
# crontab -e
# 0 2 * * * cp ~/pipeline-data/pipeline.db ~/backups/pipeline-$(date +\%Y\%m\%d).db
```

### View Huawei Cloud Metrics

1. Log in to Huawei Cloud Console
2. Go to ECS → Instances
3. Click your instance → Monitor
4. View CPU, memory, network usage

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port
sudo lsof -i :5000

# Kill process
sudo kill -9 [PID]

# Or change port in docker run
docker run -d -p 8080:5000 ... # Map 8080 → 5000
```

### Docker Image Pull Fails
```bash
# Re-authenticate
docker login -u [USERNAME] -p [PASSWORD] swr.cn-east-3.myhuaweicloud.com

# Verify image exists in SWR
docker search swr.cn-east-3.myhuaweicloud.com/my-org/pipeline-manager
```

### Application Crashes
```bash
# Check logs
docker logs pipeline-manager

# Restart
docker restart pipeline-manager

# Or recreate
docker stop pipeline-manager
docker rm pipeline-manager
docker run -d ... # Full docker run command
```

### Database Lock Error
```bash
# Remove corrupted database
rm ~/pipeline-data/pipeline.db

# Restart application (will recreate database)
docker restart pipeline-manager
```

---

## Security Checklist

- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure Nginx with security headers
- [ ] Restrict SSH access to specific IPs
- [ ] Enable Huawei Cloud account MFA
- [ ] Set up automated backups
- [ ] Monitor application logs regularly
- [ ] Update Docker image regularly
- [ ] Use environment variables for secrets (no hardcoding)

---

## Support & Resources

- **Huawei Cloud Docs**: https://support.huaweicloud.com/
- **Docker Docs**: https://docs.docker.com/
- **Application Issues**: Check GitHub repository issues/discussions
- **Huawei Community**: https://bbs.huaweicloud.com/

