# Deployment Guide

## Local Development

### Prerequisites
- Node.js 14+ 
- npm 6+
- Modern web browser

### Setup

```bash
# Clone repository
git clone <repo-url>
cd pipeline-manager-deployed

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Access at `http://localhost:5000`

**Default Credentials:**
- Username: `admin`
- Password: (set via `DEFAULT_ADMIN_PASSWORD` in `.env`)

⚠️ Set a strong password in `.env` before first run!

---

## Docker Deployment

### With Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### With Docker CLI

```bash
# Build image
docker build -t pipeline-manager:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -v pipeline-data:/app/data \
  --name pipeline-manager \
  pipeline-manager:latest

# Check logs
docker logs -f pipeline-manager
```

---

## Cloud Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create pipeline-manager-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init -p node.js-16 pipeline-manager

# Create environment
eb create production

# Deploy
eb deploy

# Monitor
eb logs
```

### Google Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/pipeline-manager

# Deploy
gcloud run deploy pipeline-manager \
  --image gcr.io/PROJECT-ID/pipeline-manager \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Azure App Service

```bash
# Create resource group
az group create -n pipeline-rg -l eastus

# Create App Service plan
az appservice plan create -n pipeline-plan -g pipeline-rg --sku B1 --is-linux

# Create web app
az webapp create -g pipeline-rg -p pipeline-plan -n pipeline-manager --runtime "NODE|16-lts"

# Deploy from Git
az webapp deployment source config-zip -g pipeline-rg -n pipeline-manager --src deployment.zip
```

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=sqlite://./data/pipeline.db
# For PostgreSQL: postgresql://user:pass@host:port/dbname

# Security
JWT_SECRET=your_secret_key_here_32_characters_long
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

---

## database Setup

### SQLite (Development)
- Automatically created in `./data/pipeline.db`
- Perfect for single-server deployments

### PostgreSQL (Production)

```sql
-- Create database
CREATE DATABASE pipeline_manager;

-- Connect to the database
\c pipeline_manager

-- Tables will be created on first run
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for trusted domains
- [ ] Set NODE_ENV=production
- [ ] Run behind a reverse proxy (Nginx/Apache)
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Regular security updates
- [ ] Restrict file uploads

---

## Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:5000/health
```

### Database Backup (SQLite)
```bash
cp data/pipeline.db backups/pipeline_$(date +%Y%m%d).db
```

### Log Rotation
Configure with PM2 or systemd for log rotation

### Performance
- Monitor response times
- Check error rates
- Track database query performance

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or use different port
PORT=3000 npm start
```

### Database Locked
```bash
# Remove corrupted database
rm data/pipeline.db
# Will be recreated on next start
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Support

For issues, questions, or suggestions, please create an issue in the repository or contact the development team.
