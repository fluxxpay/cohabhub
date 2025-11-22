#!/bin/sh
set -e

echo "=== Starting Next.js build ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "Environment:"
echo "  NODE_ENV=$NODE_ENV"
echo "  NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL"
echo "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

echo "=== Running npm run build ==="
npm run build 2>&1 | tee /tmp/build.log || {
    BUILD_EXIT_CODE=$?
    echo "❌ BUILD FAILED with exit code $BUILD_EXIT_CODE"
    echo "=== Full build output ==="
    cat /tmp/build.log
    echo "=== Checking .next directory ==="
    ls -la .next/ 2>/dev/null || echo "No .next directory found"
    exit $BUILD_EXIT_CODE
}

echo "=== Build completed successfully ==="
echo "=== Verifying build output ==="
ls -la .next/ 2>/dev/null || (echo "❌ No .next directory found!" && exit 1)

if [ ! -d ".next/standalone" ]; then
    echo "❌ ERROR: .next/standalone directory not found!"
    echo "Contents of .next:"
    find .next -type f -o -type d | head -20
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo "⚠️  WARNING: .next/static directory not found, creating empty directory..."
    mkdir -p .next/static
fi

echo "✓ Build output verified successfully"

