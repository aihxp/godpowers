#!/usr/bin/env bash
# Godpowers Release Script
# Tags + publishes a new version. Run with: bash scripts/release.sh <version>

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.4.1"
  exit 1
fi

VERSION="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

cd "$ROOT"

echo "Releasing Godpowers v$VERSION"
echo ""

# 1. Verify clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is dirty. Commit or stash first."
  exit 1
fi

# 2. Verify on main branch
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "main" ]; then
  echo "ERROR: not on main branch (on $BRANCH)"
  exit 1
fi

# 3. Run all tests
echo "Running smoke tests..."
bash scripts/smoke.sh

echo "Running skill validation..."
node scripts/validate-skills.js

# 4. Verify version in package.json matches
PKG_VERSION="$(node -p "require('./package.json').version")"
if [ "$PKG_VERSION" != "$VERSION" ]; then
  echo "ERROR: package.json version is $PKG_VERSION, but releasing as $VERSION"
  echo "Update package.json first."
  exit 1
fi

# 5. Verify install.js VERSION matches
INSTALL_VERSION="$(grep "^const VERSION" bin/install.js | sed -E "s/.*'([^']+)'.*/\\1/")"
if [ "$INSTALL_VERSION" != "$VERSION" ]; then
  echo "ERROR: install.js VERSION is $INSTALL_VERSION, but releasing as $VERSION"
  echo "Update bin/install.js VERSION constant first."
  exit 1
fi

# 6. Verify CHANGELOG has entry for this version
if ! grep -q "## \[$VERSION\]" CHANGELOG.md; then
  echo "ERROR: CHANGELOG.md has no entry for v$VERSION"
  exit 1
fi

echo ""
echo "All pre-release checks passed."
echo ""

# 7. Confirm with user
read -r -p "Tag v$VERSION and publish to npm? (yes/no) " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# 8. Tag
git tag -a "v$VERSION" -m "Godpowers v$VERSION"
echo "Tagged v$VERSION"

# 9. Publish to npm
npm publish

# 10. Push tag
git push origin "v$VERSION"

echo ""
echo "Release v$VERSION complete."
echo "  - npm: https://www.npmjs.com/package/godpowers/v/$VERSION"
echo "  - tag: git tag $VERSION pushed"
echo ""
echo "Next: create a GitHub Release at https://github.com/godpowers/godpowers/releases"
