#!/bin/sh
set -x  # Mode debug pour voir toutes les commandes
set +e  # Ne pas arrêter sur les erreurs pour capturer tout

echo "=== Starting Next.js build ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "Environment:"
echo "  NODE_ENV=$NODE_ENV"
echo "  NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL"
echo "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

echo "=== Checking files before build ==="
ls -la package.json next.config.mjs tsconfig.json 2>&1
echo "=== Checking Prisma ==="
ls -la prisma/schema.prisma 2>&1

echo "=== Running npm run build ==="
BUILD_EXIT_CODE=0
npm run build > /tmp/build.log 2>&1 || BUILD_EXIT_CODE=$?

echo "=== Build command finished with exit code: $BUILD_EXIT_CODE ==="
echo "=== Full build output (first 500 lines) ==="
head -500 /tmp/build.log
echo "=== Full build output (last 500 lines) ==="
tail -500 /tmp/build.log

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ BUILD FAILED with exit code $BUILD_EXIT_CODE"
    echo "=== Checking .next directory ==="
    ls -la .next/ 2>&1 || echo "No .next directory found"
    echo "=== Searching for error patterns in build log ==="
    grep -i "error\|failed\|fatal" /tmp/build.log | head -50
    exit $BUILD_EXIT_CODE
fi

echo "=== Build completed successfully ==="
echo "=== Verifying build output ==="
ls -la .next/ 2>&1 || (echo "❌ No .next directory found!" && exit 1)

if [ ! -d ".next/standalone" ]; then
    echo "❌ ERROR: .next/standalone directory not found!"
    echo "Contents of .next:"
    find .next -type f -o -type d 2>&1 | head -20
    echo "=== Build log may contain clues ==="
    tail -100 /tmp/build.log
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo "⚠️  WARNING: .next/static directory not found, creating empty directory..."
    mkdir -p .next/static
fi

echo "✓ Build output verified successfully"
set -e  # Réactiver set -e pour les vérifications finales

