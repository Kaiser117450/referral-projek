# F&B Referral System - Deployment Guide

This guide covers deploying the F&B Referral System on a VPS using Docker.

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- SMTP server for email authentication

## Quick Start

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply Docker group changes
```

### 2. Application Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd referral-projek

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Environment Configuration

Configure your `.env` file with the following required variables:

```bash
# Turso DB Configuration (REQUIRED)
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# NextAuth.js Configuration (REQUIRED)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_here_generate_with_openssl_rand_base64_32

# Email Configuration for NextAuth.js (REQUIRED)
EMAIL_SERVER=smtp://username:password@smtp.gmail.com:587
EMAIL_FROM=noreply@yourdomain.com

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Security (REQUIRED)
ENCRYPTION_KEY=79BAeW+ilVHGlRumUpYtLgKS7s33bTRB6SsJWyTkQ8Y=

# F&B Specific Configuration (OPTIONAL)
RESTAURANT_NAME="Your Restaurant Name"
RESTAURANT_LOGO_URL="/logo.png"
POINTS_PER_REFERRAL=1
MAX_CODES_PER_USER_PER_DAY=5
```

### 4. Database Setup

Before deploying, set up your Turso database:

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create database
turso db create your-database-name

# Get database URL and auth token
turso db show your-database-name
turso db tokens create your-database-name

# Run database schema setup
turso db shell your-database-name < scripts/setup-turso-schema.sql
```

### 5. Deploy Application

```bash
# Build and start the application
docker-compose up -d

# Check logs
docker-compose logs -f

# Check health
curl http://localhost:3000/api/health
```

## Production Deployment

### SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Create nginx configuration
sudo nano /etc/nginx/sites-available/referral-system
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Monitoring and Maintenance

#### Health Monitoring

```bash
# Check application health
curl https://yourdomain.com/api/health

# Monitor logs
docker-compose logs -f --tail=100

# Check resource usage
docker stats
```

#### Backup Strategy

```bash
# Backup receipt storage
docker run --rm -v referral-projek_receipt-storage:/data -v $(pwd):/backup alpine tar czf /backup/receipts-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup database (Turso handles this automatically, but you can export)
turso db shell your-database-name ".dump" > backup-$(date +%Y%m%d).sql
```

#### Updates and Maintenance

```bash
# Update application
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Clean up old images
docker image prune -f

# View application logs
docker-compose logs -f referral-app
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TURSO_DATABASE_URL` | Turso database connection URL | `libsql://db-name.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso authentication token | `eyJhbGciOiJFZERTQS...` |
| `NEXTAUTH_URL` | Application base URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `generate with openssl rand -base64 32` |
| `EMAIL_SERVER` | SMTP server configuration | `smtp://user:pass@smtp.gmail.com:587` |
| `EMAIL_FROM` | From email address | `noreply@yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESTAURANT_NAME` | Restaurant branding name | `"Your Restaurant"` |
| `POINTS_PER_REFERRAL` | Points awarded per referral | `1` |
| `CODE_EXPIRY_MINUTES` | Code expiration time | `5` |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit | `100` |

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check Turso credentials
   turso db show your-database-name
   
   # Test connection
   curl https://yourdomain.com/api/health
   ```

2. **Email Not Sending**
   ```bash
   # Check SMTP configuration
   # Test with a simple SMTP client
   ```

3. **Application Won't Start**
   ```bash
   # Check logs
   docker-compose logs referral-app
   
   # Check environment variables
   docker-compose config
   ```

4. **Storage Issues**
   ```bash
   # Check volume permissions
   docker exec -it fnb-referral-system ls -la /app/storage
   
   # Fix permissions if needed
   docker exec -it fnb-referral-system chown -R nextjs:nodejs /app/storage
   ```

### Performance Optimization

1. **Enable Gzip Compression** (in Nginx)
2. **Set up CDN** for static assets
3. **Configure Redis** for session storage (optional)
4. **Monitor resource usage** and scale as needed

### Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Strong passwords and secrets
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] Application logs monitored
- [ ] Backup strategy implemented

## Support

For issues and questions:
1. Check the application logs
2. Review this deployment guide
3. Check the health endpoint: `/api/health`
4. Contact system administrator

## Scaling

For high-traffic scenarios:
1. Use a load balancer (nginx, HAProxy)
2. Deploy multiple application instances
3. Consider using Redis for session storage
4. Monitor database performance
5. Implement CDN for static assets