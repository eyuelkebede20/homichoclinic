#!/usr/bin/env bash
# =====================================================
#  Bure Clinic ERP - Version Management System (Linux)
# =====================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
cd "$ROOT"

CURRENT_VER="0.1.29"
if [ -f "VERSION" ]; then
    CURRENT_VER="$(tr -d ' \r\n' < VERSION)"
elif [ -f "package.json" ]; then
    CURRENT_VER="$(node -p "require('./package.json').version" 2>/dev/null || echo "0.1.29")"
fi

echo "====================================================="
echo "  Bure Clinic ERP - Version Management System"
echo "====================================================="
echo ""
echo "Current Version: $CURRENT_VER"
echo ""
echo "Choose the type of version bump:"
echo "1) Patch - Bug fixes and minor clinical tweaks"
echo "2) Minor - New features (e.g. lab, pharmacy, reports)"
echo "3) Major - Major system overhaul / breaking changes"
echo "4) Custom - Enter a specific version string"
echo "5) Cancel"
echo ""

read -p "Enter choice [1-5]: " choice

if [ "$choice" == "5" ]; then
    echo "Version bump cancelled."
    exit 0
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VER"
MAJOR="${MAJOR:-0}"
MINOR="${MINOR:-1}"
PATCH="${PATCH:-0}"

if [ "$choice" == "1" ]; then
    PATCH=$((PATCH + 1))
    NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
elif [ "$choice" == "2" ]; then
    MINOR=$((MINOR + 1))
    NEW_VER="${MAJOR}.${MINOR}.0"
elif [ "$choice" == "3" ]; then
    MAJOR=$((MAJOR + 1))
    NEW_VER="${MAJOR}.0.0"
elif [ "$choice" == "4" ]; then
    read -p "Enter custom version (e.g. 0.2.0): " NEW_VER
    if [ -z "$NEW_VER" ]; then
        echo "Invalid version. Cancelled."
        exit 1
    fi
else
    echo "Version bump cancelled."
    exit 0
fi

echo ""
echo "Bumping version: $CURRENT_VER -> $NEW_VER..."

# 1. Update VERSION file
echo "$NEW_VER" > VERSION

# 2. Update package.json
node -e "const fs = require('fs'); const p = './package.json'; if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf-8')); j.version = '$NEW_VER'; j.name = 'bure-clinic'; fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n'); }"

# 3. Resolve git hash and stamp version.json & version.txt
GIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
echo "$GIT_HASH" > version.txt

node -e "const fs = require('fs'); const info = { name: 'Bure Clinic ERP', version: '$NEW_VER', gitCommit: '$GIT_HASH', buildTime: new Date().toISOString() }; fs.writeFileSync('./version.json', JSON.stringify(info, null, 2) + '\n');"

echo ""
echo "[OK] Successfully bumped version to $NEW_VER!"
echo "     - VERSION updated"
echo "     - package.json updated"
echo "     - version.json stamped"
echo "     - version.txt synced"
echo ""

read -p "Do you want to create a Git release commit and tag? (Y/N): " commit_ans
if [[ "$commit_ans" =~ ^[Yy]$ ]]; then
    git add VERSION package.json version.json
    git commit -m "chore(release): bump version to v$NEW_VER"
    git tag -a "v$NEW_VER" -m "Release v$NEW_VER"
    echo "[OK] Created commit and tag v$NEW_VER!"
    echo ""
    read -p "Do you want to push to GitHub (origin main --tags)? (Y/N): " push_ans
    if [[ "$push_ans" =~ ^[Yy]$ ]]; then
        git push origin main
        git push origin "v$NEW_VER"
        echo "[OK] Pushed v$NEW_VER to GitHub!"
    fi
fi

echo ""
echo "====================================================="
echo "  Version bump to v$NEW_VER complete!"
echo "====================================================="
