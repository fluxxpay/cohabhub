# ---- Builder ----

FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer dépendances (React 19 -> npm install --force)
RUN npm install --force

# Copier le script de build d'abord
COPY build.sh ./

# Copier tout le code
COPY . .

# Env nécessaires au build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Rendre le script exécutable
RUN chmod +x build.sh

# Prisma Client
RUN npx prisma generate

# Diagnostics avant le build
RUN echo "=== Pre-build diagnostics ===" && \
    echo "Node: $(node --version)" && \
    echo "NPM: $(npm --version)" && \
    echo "NODE_ENV=$NODE_ENV" && \
    echo "NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL" && \
    echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" && \
    ls -la package.json next.config.mjs tsconfig.json prisma/schema.prisma

# Build Next.js - capturer la sortie et l'afficher
RUN echo "=== Starting Next.js build ===" && \
    (npm run build 2>&1 | tee /tmp/build-output.log) || { \
        EXIT_CODE=$?; \
        echo "❌ BUILD FAILED with exit code $EXIT_CODE"; \
        echo "=== Build output (last 200 lines) ==="; \
        tail -200 /tmp/build-output.log 2>/dev/null || echo "No build output captured"; \
        echo "=== Searching for errors ==="; \
        grep -i "error\|failed\|fatal" /tmp/build-output.log 2>/dev/null | head -30 || echo "No error patterns found"; \
        exit $EXIT_CODE; \
    }

# Vérifier le résultat du build
RUN echo "=== Verifying build output ===" && \
    ls -la .next/ 2>&1 || (echo "❌ No .next directory!" && exit 1) && \
    if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: .next/standalone not found!"; \
        find .next -type f -o -type d 2>&1 | head -20; \
        exit 1; \
    fi && \
    if [ ! -d ".next/static" ]; then \
        echo "⚠️  Creating .next/static..."; \
        mkdir -p .next/static; \
    fi && \
    echo "✓ Build verified"

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
