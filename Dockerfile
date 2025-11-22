# Dockerfile pour Cohab - Application Next.js

FROM node:18-alpine AS builder

# Installer les dépendances nécessaires
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
# Utiliser --force comme recommandé dans le README pour résoudre les conflits React 19
RUN npm install --force

# Copier le code source (y compris Prisma schema)
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Variables d'environnement par défaut pour le build (seront remplacées par Coolify)
# Ces valeurs sont nécessaires pour éviter les erreurs de build
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Générer le client Prisma (si nécessaire)
RUN echo "Generating Prisma client..." && npx prisma generate || echo "Prisma generate skipped"

# Vérifier que les fichiers essentiels sont présents
RUN echo "Checking essential files..." && \
    ls -la prisma/schema.prisma && \
    ls -la next.config.mjs && \
    ls -la package.json

# Build de l'application Next.js
RUN echo "Starting Next.js build..." && npm run build

# Vérifier que le build a créé les fichiers nécessaires
RUN echo "Verifying build output..." && \
    if [ ! -d ".next/standalone" ]; then \
        echo "ERROR: .next/standalone directory not found!" && \
        echo "Build output:" && ls -la .next/ 2>/dev/null || echo "No .next directory" && \
        exit 1; \
    fi && \
    if [ ! -d ".next/static" ]; then \
        echo "WARNING: .next/static directory not found, creating empty directory..." && \
        mkdir -p .next/static; \
    fi && \
    echo "✓ Build output verified"

# Stage de production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le build standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier le schéma Prisma si nécessaire pour le runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Changer les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"]

