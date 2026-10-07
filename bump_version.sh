#!/bin/bash
# Bure Clinic - Version Management (Ubuntu)

echo "====================================================="
echo "  Bure Clinic - Version Management"
echo "====================================================="
echo ""
echo -n "Current Version: "
node -p "require('./package.json').version"
echo ""

echo "Choose the type of version bump:"
echo "1) Patch (0.0.x) - Bug fixes and minor tweaks"
echo "2) Minor (0.x.0) - New features"
echo "3) Major (x.0.0) - Major system overhaul"
echo "4) Cancel"
echo ""

read -p "Enter choice [1-4]: " choice

if [ "$choice" == "1" ]; then
    BUMP_TYPE="patch"
elif [ "$choice" == "2" ]; then
    BUMP_TYPE="minor"
elif [ "$choice" == "3" ]; then
    BUMP_TYPE="major"
else
    echo "Version bump cancelled."
    exit 0
fi

echo ""
echo "Bumping $BUMP_TYPE version..."
pnpm version $BUMP_TYPE --no-git-tag-version

echo ""
echo -n "New Version is now: "
NEW_VER=$(node -p "require('./package.json').version")
echo "$NEW_VER"
echo ""

read -p "Do you want to commit and push this new version to GitHub? (Y/N): " push
if [[ "$push" == "Y" || "$push" == "y" ]]; then
    git add package.json
    git commit -m "chore: bump version to v$NEW_VER"
    git push origin main
    echo "Successfully pushed v$NEW_VER to GitHub!"
fi

echo ""
echo "Done! Please restart the app for the new version badge to show in the UI."
