#!/usr/bin/env bash
# Atomically select a previously retained, fully verified static release.
# This script uses only Bash and standard Ubuntu utilities; Node.js is not needed.
set -euo pipefail

root=${1:?release root is required}
release_id=${2:?release id is required}
releases="$root/releases"
live="$root/live"
release="$releases/$release_id"
tmp_live="$root/.live.rollback.$$"

case "$release_id" in
  ''|.*|*/*|*..*) echo 'invalid release id' >&2; exit 2 ;;
esac

required=(
  index.html about/index.html services/index.html blog/index.html
  contact/index.html privacy/index.html admin/index.html
  media/social-preview.png favicon.svg favicon-32.png apple-touch-icon.png
  robots.txt sitemap.xml
)

[ -d "$release" ] || { echo "missing release: $release_id" >&2; exit 1; }
for path in "${required[@]}"; do
  [ -f "$release/$path" ] || { echo "missing required artifact: $path" >&2; exit 1; }
done

# Create and rename a sibling symlink. live is not removed first, so readers see
# either the old complete tree or the new complete tree, never a partial tree.
trap 'rm -f -- "$tmp_live"' EXIT
rm -f -- "$tmp_live"
ln -s -- "$release" "$tmp_live"
mv -Tf -- "$tmp_live" "$live"
trap - EXIT

echo "rolled back to $release_id"
