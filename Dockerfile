# ---- Builder ----

FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer dépendances (React 19 -> npm install --force)
RUN npm install --force

# Copier tout le code
COPY . .

# Env nécessaires au build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Prisma Client
RUN npx prisma generate

# Diagnostics avant le build
RUN echo "=== Pre-build diagnostics ===" && \
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "Environment variables:" && \
    echo "  NODE_ENV=$NODE_ENV" && \
    echo "  NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL" && \
    echo "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" && \
    echo "Checking files:" && \
    ls -la package.json next.config.mjs 2>/dev/null && \
    echo "Checking Prisma:" && \
    ls -la prisma/schema.prisma 2>/dev/null && \
    echo "=== Starting Next.js build ==="

# Build Next.js - afficher directement sans redirection
RUN npm run build
RUN echo "=== Build completed, verifying output ==="
RUN ls -la .next/ 2>/dev/null || (echo "❌ No .next directory found!" && exit 1)
RUN if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: .next/standalone directory not found!"; \
        echo "Contents of .next:"; \
        find .next -type f -o -type d | head -20; \
        exit 1; \
    fi
RUN if [ ! -d ".next/static" ]; then \
        echo "⚠️  WARNING: .next/static directory not found, creating empty directory..."; \
        mkdir -p .next/static; \
    fi
RUN echo "✓ Build output verified successfully"

# ---- Runner ----

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Créer utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copier uniquement le nécessaire
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copier Prisma pour le runtime si migrations locales
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Permissions
USER nextjs

EXPOSE 3000

# Lance Next.js standalone
CMD ["node", "server.js"]
