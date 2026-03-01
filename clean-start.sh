#!/bin/bash

# Magic Bullet: Deep Clean & Start for PetFind
# This script forcefully cleans all caches, kills hung processes, and restarts the app.

echo "🚀 Starting 'Magic Bullet' Deep Clean..."

# 1. Kill any existing Metro or Node processes related to the project
echo "🛑 Stopping existing processes..."
pkill -f "expo" || true
pkill -f "metro" || true
pkill -f "node" || true

# 2. Clear Metro Cache
echo "🧹 Clearing Metro Cache..."
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/haste-map-* || true

# 3. Clear Watchman (if it exists)
if command -v watchman &> /dev/null; then
    echo "🧹 Clearing Watchman..."
    watchman watch-del-all || true
fi

# 4. Final attempt at clearing Expo caches
echo "🧹 Clearing Expo Caches..."
cd "$(dirname "$0")/apps/mobile"
rm -rf .expo || true

# 5. Start with a clean slate in Tunnel Mode
echo "✨ Everything is clean! Starting API and Mobile App in Tunnel Mode..."
echo "📱 Please have your iPhone ready with Expo Go."
echo ""

cd "../.."
pnpm dev:tunnel
