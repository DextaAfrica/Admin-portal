# syntax=docker/dockerfile:1.4

# ==============================================================================
# Dexta Africa Enterprise Admin Portal - Production Multi-Stage Dockerfile
# Optimized for minimal image size, enterprise security, and standalone execution
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Alpine Image with Native Prerequisites
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Dependencies Cache Layer
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install exact dependencies with clean npm ci
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Builder - Compile Prisma Client & Standalone Next.js Bundle
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time arguments and default environment configuration
ARG DATABASE_URL="file:/app/prisma/admin_portal.db"
ARG APP_SECRET="dexta_build_fallback_secret_key_production_standalone"

# Environment variables for build optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV APP_SECRET=${APP_SECRET}

# 1. Generate type-safe Prisma Client
RUN npx prisma generate

# 2. Build Next.js application in standalone mode
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Runner - Minimal Non-Root Image
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime utilities:
# - libc6-compat & openssl: required for Prisma engines
# - curl: for container healthcheck probe
# - dumb-init: for proper PID 1 signal forwarding and graceful container termination
RUN apk add --no-cache libc6-compat openssl curl dumb-init

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/prisma/admin_portal.db"
ENV APP_SECRET="dexta_africa_portal_super_secure_enterprise_secret_key_2026_xyz"

# Create unprivileged system user & group (UID/GID 1001) for strict container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create persistent storage directories with proper permissions
RUN mkdir -p /app/prisma /app/data && \
    chown -R nextjs:nodejs /app/prisma /app/data

# Copy Next.js public assets and static build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Next.js standalone application build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy Prisma schema, migrations, and seed scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma CLI and engine binaries from builder for runtime schema sync
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy and configure container entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose HTTP port
EXPOSE 3000

# Container liveness & readiness healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Launch through dumb-init for graceful termination signal handling
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "server.js"]

