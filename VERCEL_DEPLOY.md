# Guide de déploiement sur Vercel

Ce guide explique comment déployer le frontend Cohab sur Vercel en plus de votre déploiement VPS existant.

## 📋 Prérequis

1. Un compte Vercel (gratuit ou payant)
2. Un repository Git (GitHub, GitLab, ou Bitbucket)
3. Les variables d'environnement nécessaires

## 🚀 Étapes de déploiement

### 1. Préparer le repository

Assurez-vous que votre code est poussé sur votre repository Git :

```bash
git add .
git commit -m "Configuration pour déploiement Vercel"
git push
```

### 2. Connecter le projet à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"**
3. Importez votre repository Git
4. Sélectionnez le dossier `cohab` comme **Root Directory** (important !)

### 3. Configuration du projet

Vercel détectera automatiquement Next.js. Les paramètres suivants sont déjà configurés dans `vercel.json` :

- **Framework**: Next.js
- **Build Command**: `npm run build` (inclut la génération Prisma)
- **Install Command**: `npm install --force`
- **Output Directory**: `.next` (géré automatiquement par Next.js)

### 4. Variables d'environnement

Dans les paramètres du projet Vercel, allez dans **Settings > Environment Variables** et ajoutez les variables suivantes :

#### Variables publiques (NEXT_PUBLIC_*)

Ces variables sont accessibles côté client :

```
NEXT_PUBLIC_BASE_URL=https://votre-domaine-vercel.vercel.app
NEXT_PUBLIC_API_URL=https://myapi.cohabhub.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=votre-clé-recaptcha-site
```

**Note**: `NEXT_PUBLIC_BASE_URL` sera automatiquement mis à jour par Vercel avec l'URL de déploiement. Vous pouvez aussi utiliser votre domaine personnalisé.

#### Variables privées (serveur uniquement)

```
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=noreply@cohab.space
SMTP_SENDER=Cohab

# ReCAPTCHA
RECAPTCHA_SECRET_KEY=votre-clé-recaptcha-secret

# Storage (S3 ou compatible)
STORAGE_BUCKET=nom-du-bucket
STORAGE_REGION=ams3
STORAGE_ACCESS_KEY_ID=votre-access-key
STORAGE_SECRET_ACCESS_KEY=votre-secret-key
STORAGE_ENDPOINT=https://endpoint.com
STORAGE_CDN_URL=https://cdn.endpoint.com

# Node Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 5. Configuration de la base de données

Vercel nécessite une connexion directe à votre base de données PostgreSQL. Assurez-vous que :

1. Votre base de données est accessible depuis Internet (pas seulement localhost)
2. Les variables `DATABASE_URL` et `DIRECT_URL` pointent vers votre base de données
3. Le firewall de votre base de données autorise les connexions depuis Vercel

**Pour Vercel**, vous pouvez utiliser :
- Une base de données PostgreSQL hébergée (AWS RDS, DigitalOcean, etc.)
- Votre base de données VPS si elle est accessible publiquement
- Une base de données Vercel Postgres (recommandé pour la simplicité)

### 6. Déploiement

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Installer les dépendances (`npm install --force`)
   - Générer le Prisma Client (`prisma generate` via postinstall)
   - Builder l'application (`npm run build`)
   - Déployer l'application

### 7. Domaines personnalisés (optionnel)

Si vous souhaitez utiliser un domaine personnalisé :

1. Allez dans **Settings > Domains**
2. Ajoutez votre domaine (ex: `cohab.space`)
3. Suivez les instructions pour configurer les DNS
4. Mettez à jour `NEXT_PUBLIC_BASE_URL` avec votre domaine personnalisé

## 🔧 Différences avec le déploiement VPS

### Configuration Next.js

Le fichier `next.config.mjs` a été modifié pour être compatible avec Vercel :

- Le mode `standalone` est désactivé automatiquement sur Vercel
- Vercel gère l'optimisation et le build automatiquement

### Scripts de build

Le script `build` dans `package.json` inclut maintenant la génération Prisma :

```json
"build": "prisma generate && next build"
```

Un script `postinstall` a été ajouté pour générer Prisma Client après l'installation des dépendances.

### Fichiers exclus

Le fichier `.vercelignore` exclut les fichiers inutiles pour Vercel :
- Dockerfiles et configurations Docker
- Fichiers de build locaux
- Fichiers de développement

## 🐛 Dépannage

### Erreur de build Prisma

Si vous rencontrez des erreurs liées à Prisma :

1. Vérifiez que `DATABASE_URL` est correctement configurée
2. Vérifiez que votre base de données est accessible depuis Internet
3. Vérifiez les logs de build dans Vercel pour plus de détails

### Erreur de connexion à la base de données

1. Vérifiez que votre base de données accepte les connexions externes
2. Vérifiez que le firewall autorise les IPs de Vercel
3. Vérifiez que les credentials sont corrects

### Variables d'environnement non prises en compte

1. Assurez-vous que les variables sont définies pour l'environnement correct (Production, Preview, Development)
2. Redéployez après avoir ajouté/modifié des variables
3. Vérifiez que les variables `NEXT_PUBLIC_*` sont bien préfixées

## 📝 Notes importantes

- **Dual deployment**: Vous pouvez maintenir les deux déploiements (VPS et Vercel) en parallèle
- **Variables d'environnement**: Assurez-vous que les variables sont synchronisées entre les deux environnements
- **Base de données**: Les deux déploiements peuvent partager la même base de données
- **Domaines**: Vous pouvez utiliser des domaines différents pour chaque déploiement (ex: `cohab.space` pour VPS et `app.cohab.space` pour Vercel)

## 🔄 Mises à jour automatiques

Vercel peut être configuré pour déployer automatiquement à chaque push sur votre branche principale :

1. Allez dans **Settings > Git**
2. Configurez les branches à déployer automatiquement
3. Les déploiements se feront automatiquement à chaque push

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Prisma sur Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

