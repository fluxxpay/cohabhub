# ---- Builder ----

FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer dépendances (React 19 -> npm install --force)
RUN echo "=== Installing dependencies ===" && \
    npm install --force --verbose 2>&1 | tee /tmp/npm-install.log || { \
        echo "❌ npm install failed"; \
        tail -100 /tmp/npm-install.log; \
        exit 1; \
    } && \
    echo "=== Dependencies installed successfully ==="

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

# Prisma Client - vérifier que ça fonctionne
RUN echo "=== Generating Prisma Client ===" && \
    npx prisma generate && \
    echo "=== Prisma Client generated ===" && \
    ls -la node_modules/.prisma/client 2>&1 || echo "⚠️ Prisma client directory not found"

# Build Next.js avec le script qui capture toutes les erreurs
# Le script affiche les logs et sort avec le bon code d'erreur
RUN ./build.sh || { \
        echo "=== BUILD SCRIPT FAILED ==="; \
        echo "=== Checking if .next exists ==="; \
        ls -la .next/ 2>&1 || echo "No .next directory"; \
        if [ -d ".next" ]; then \
            echo "=== Contents of .next ==="; \
            find .next -maxdepth 2 -type d 2>&1 | head -20; \
        fi; \
        if [ -f /tmp/build.log ]; then \
            echo "=== Last 300 lines of build log ==="; \
            tail -300 /tmp/build.log; \
        fi; \
        exit 1; \
    }

# Vérification finale que standalone existe
RUN if [ ! -d ".next/standalone" ]; then \
        echo "❌ FINAL CHECK FAILED: .next/standalone not found after build"; \
        echo "=== Contents of .next directory ==="; \
        ls -la .next/ 2>&1 || echo "No .next directory"; \
        if [ -d ".next" ]; then \
            echo "=== Listing .next contents ==="; \
            find .next -maxdepth 3 -type d 2>&1 | head -30; \
        fi; \
        exit 1; \
    fi && \
    echo "✓ Build verification successful: .next/standalone exists"

# ---- Runner ----

FROM node:20-alpine AS runner
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
