# F&B Referral System - Production Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create storage directory for receipts
RUN mkdir -p storage/receipts

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create storage directory with proper permissions
RUN mkdir -p storage/receipts
RUN chown -R nextjs:nodejs storage

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy storage directory
COPY --from=builder --chown=nextjs:nodejs /app/storage ./storage

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/api/health || exit 1' > healthcheck.sh
RUN chmod +x healthcheck.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ./healthcheck.sh

# Start the application
CMD ["node", "server.js"]
