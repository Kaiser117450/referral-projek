# 🚀 Deployment & Infrastructure - Aplikasi Referral Marketing

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React PWA)   │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│   - Vercel      │    │   - Railway     │    │  - Supabase     │
│   - CDN         │    │   - Load Balancer│   │  - Redis Cache  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   File Storage  │    │   Monitoring    │
│   Business API  │    │   (AWS S3)      │    │   (Sentry)      │
│   (Twilio)      │    │   - Images      │    │   - LogRocket    │
│                 │    │   - Documents   │    │   - Analytics   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Redis
- **Infrastructure**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (Frontend) + Railway (Backend)
- **Monitoring**: Sentry + LogRocket + Custom Analytics

## 🐳 Docker Configuration

### Dockerfile - Frontend
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Dockerfile - Backend
```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run node
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Docker Compose - Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend Development
  frontend-dev:
    build:
      context: ./frontend
      target: deps
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:3001/api
    command: npm start
    depends_on:
      - backend-dev

  # Backend Development
  backend-dev:
    build:
      context: ./backend
      target: deps
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/referral_dev
      - REDIS_URL=redis://redis:6379
    command: npm run dev
    depends_on:
      - postgres
      - redis

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: referral_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Nginx Reverse Proxy (Optional)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend-dev
      - backend-dev

volumes:
  postgres_data:
  redis_data:
```

### Docker Compose - Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Frontend Production
  frontend:
    build:
      context: ./frontend
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=https://api.referralapp.com/api
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Production
  backend:
    build:
      context: ./backend
      target: runner
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - postgres
      - redis

  # PostgreSQL Production
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Production
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Production
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    restart: unless-stopped
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 🔄 CI/CD Pipeline

### GitHub Actions - Main Workflow
```yaml
# .github/workflows/main.yml
name: Main CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Code Quality Check
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Run linting
        run: |
          npm run lint
          cd frontend && npm run lint
          cd ../backend && npm run lint

      - name: Run type checking
        run: |
          npm run type-check
          cd frontend && npm run type-check
          cd ../backend && npm run type-check

      - name: Run tests
        run: |
          npm run test
          cd frontend && npm run test
          cd ../backend && npm run test

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  # Build and Test
  build-and-test:
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - name: Frontend
            directory: frontend
            dockerfile: frontend/Dockerfile
          - name: Backend
            directory: backend
            dockerfile: backend/Dockerfile

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.directory }}
          file: ${{ matrix.dockerfile }}
          push: false
          tags: ${{ env.IMAGE_NAME }}-${{ matrix.name }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run container tests
        run: |
          docker run --rm ${{ env.IMAGE_NAME }}-${{ matrix.name }}:latest npm test

  # Deploy to Staging
  deploy-staging:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Railway (Staging)
        uses: railway/deploy@v1
        with:
          service: backend-staging
          token: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  # Deploy to Production
  deploy-production:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Railway (Production)
        uses: railway/deploy@v1
        with:
          service: backend-production
          token: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run database migrations
        run: |
          npm run migrate:prod

      - name: Health check
        run: |
          curl -f https://api.referralapp.com/health
          curl -f https://referralapp.com/health
```

### GitHub Actions - Database Migration
```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci

      - name: Run database migration
        run: |
          cd backend
          npm run migrate:${{ github.event.inputs.environment }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NODE_ENV: ${{ github.event.inputs.environment }}

      - name: Verify migration
        run: |
          cd backend
          npm run migrate:status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 🌐 Nginx Configuration

### Nginx Main Config
```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;

    # Upstream definitions
    upstream frontend {
        server frontend:3000;
        keepalive 32;
    }

    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    # Main server block
    server {
        listen 80;
        server_name referralapp.com www.referralapp.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name referralapp.com www.referralapp.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/referralapp.com.crt;
        ssl_certificate_key /etc/nginx/ssl/referralapp.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                proxy_pass http://frontend;
            }
        }

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 30s;
            proxy_send_timeout 30s;
        }

        # Authentication endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=login burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Security
        location ~ /\. {
            deny all;
        }

        location ~ /\.ht {
            deny all;
        }
    }
}
```

## 📊 Monitoring & Observability

### Sentry Configuration
```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out health check requests
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });
};

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};
```

### LogRocket Configuration
```typescript
// frontend/src/config/logrocket.ts
import LogRocket from 'logrocket';

export const initLogRocket = () => {
  if (process.env.NODE_ENV === 'production') {
    LogRocket.init(process.env.REACT_APP_LOGROCKET_ID!);
  }
};

export const identifyUser = (userId: string, userData: any) => {
  if (process.env.NODE_ENV === 'production') {
    LogRocket.identify(userId, userData);
  }
};
```

### Custom Analytics
```typescript
// backend/src/services/analytics.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  // Track referral conversion
  static async trackReferralConversion(referralId: string) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'REFERRAL_CONVERSION',
          referralId,
          timestamp: new Date(),
          metadata: {
            source: 'api',
            version: '1.0.0'
          }
        }
      });
    } catch (error) {
      console.error('Failed to track referral conversion:', error);
    }
  }

  // Track reward redemption
  static async trackRewardRedemption(rewardId: string, userId: string) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'REWARD_REDEMPTION',
          rewardId,
          userId,
          timestamp: new Date(),
          metadata: {
            source: 'api',
            version: '1.0.0'
          }
        }
      });
    } catch (error) {
      console.error('Failed to track reward redemption:', error);
    }
  }

  // Get conversion metrics
  static async getConversionMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalReferrals, successfulReferrals, totalRewards] = await Promise.all([
      prisma.referral.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.referral.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'REDEEMED'
        }
      }),
      prisma.rewardCode.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'USED'
        }
      })
    ]);

    return {
      totalReferrals,
      successfulReferrals,
      conversionRate: totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0,
      totalRewards,
      period: `${days} days`
    };
  }
}
```

## 🔒 Security Configuration

### Helmet Security
```typescript
// backend/src/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});
```

### Rate Limiting
```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP',
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

export const referralLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 referral attempts per hour
  message: 'Too many referral attempts, please try again later'
});
```

## 📈 Performance Optimization

### Database Optimization
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling
  __internal: {
    engine: {
      connectionLimit: 20,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Redis Caching
```typescript
// backend/src/services/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
    }
  }
}
```

## 🚀 Scaling Strategies

### Horizontal Scaling
```typescript
// backend/src/config/cluster.ts
import cluster from 'cluster';
import os from 'os';
import { app } from '../app';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  app.listen(process.env.PORT || 3001, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### Load Balancing
```nginx
# nginx/load-balancer.conf
upstream backend_cluster {
    least_conn; # Least connection distribution
    server backend1:3001 max_fails=3 fail_timeout=30s;
    server backend2:3001 max_fails=3 fail_timeout=30s;
    server backend3:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.referralapp.com;

    location / {
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 Environment Management

### Environment Variables Template
```bash
# .env.example
# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/referral_app
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# WhatsApp API (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-whatsapp-number

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=ap-southeast-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOGROCKET_ID=your-logrocket-id

# External Services
GOOGLE_ANALYTICS_ID=your-ga-id
```

### Production Environment Setup
```bash
#!/bin/bash
# scripts/setup-production.sh

echo "Setting up production environment..."

# Create production directories
mkdir -p /opt/referral-app/{logs,ssl,backups}

# Set up SSL certificates
if [ ! -f /opt/referral-app/ssl/referralapp.com.crt ]; then
    echo "Please place SSL certificates in /opt/referral-app/ssl/"
    echo "Files needed: referralapp.com.crt, referralapp.com.key"
fi

# Set up environment variables
cat > /opt/referral-app/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_S3_BUCKET=${AWS_S3_BUCKET}
SENTRY_DSN=${SENTRY_DSN}
LOGROCKET_ID=${LOGROCKET_ID}
EOF

# Set up systemd service
cat > /etc/systemd/system/referral-app.service << EOF
[Unit]
Description=Referral App Backend
After=network.target

[Service]
Type=simple
User=referral-app
WorkingDirectory=/opt/referral-app
EnvironmentFile=/opt/referral-app/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable referral-app
systemctl start referral-app

echo "Production environment setup complete!"
```

## 📊 Health Checks & Monitoring

### Health Check Endpoints
```typescript
// backend/src/routes/health.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/health/detailed', async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
      new Promise(resolve => setTimeout(resolve, 100)) // Simulate external service
    ]);

    const results = {
      database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      external: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
    };

    const allHealthy = Object.values(results).every(status => status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: results
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

---

**Dokumentasi ini memberikan panduan lengkap untuk deployment, monitoring, dan scaling aplikasi referral marketing dengan best practices untuk production environment.**
