# Dockerfile pour Cohab - Application Next.js

FROM node:18-alpine AS builder

# Installer les dépendances nécessaires
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY package-lock.json* ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copier le code source (y compris Prisma schema)
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Générer le client Prisma (si nécessaire)
RUN npx prisma generate || echo "Prisma generate skipped"

# Build de l'application Next.js
RUN npm run build

# Stage de production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le build standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

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

