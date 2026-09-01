#!/usr/bin/env bash
# Activate a fully uploaded static release without ever changing live in place.
# This script intentionally uses only the VM's shell and core utilities; it does
# not require Node.js, npm, Astro, or any application runtime.
set -euo pipefail

root=${1:?release root is required}
release_id=${2:?release id is required}
retain=${3:-5}
incoming="$root/.incoming/$release_id"
releases="$root/releases"
live="$root/live"
release="$releases/$release_id"

case "$release_id" in
  ''|.*|*/*|*..*) echo 'invalid release id' >&2; exit 2 ;;
esac
case "$retain" in
  ''|*[!0-9]*) echo 'retain must be a non-negative integer' >&2; exit 2 ;;
esac

required=(
  index.html
  about/index.html
  services/index.html
  blog/index.html
  contact/index.html
  privacy/index.html
  admin/index.html
  media/social-preview.png
  favicon.svg
  favicon-32.png
  apple-touch-icon.png
  robots.txt
  sitemap.xml
)

# Verification happens before the release directory is moved into the retained
# set and before the live symlink is replaced.
[ -d "$incoming" ] || { echo "missing uploaded release: $incoming" >&2; exit 1; }
for path in "${required[@]}"; do
  [ -f "$incoming/$path" ] || { echo "missing required artifact: $path" >&2; exit 1; }
done

mkdir -p "$releases"
[ ! -e "$release" ] || { echo "release already exists: $release_id" >&2; exit 1; }
mv -- "$incoming" "$release"

# Rename replaces the symlink in one filesystem operation. The old target is
# untouched until this succeeds, so visitors see either the old or new tree.
tmp_live="$root/.live.$release_id.$$"
rm -f -- "$tmp_live"
ln -s -- "$release" "$tmp_live"
mv -Tf -- "$tmp_live" "$live"

# Keep at most $retain release directories. Never remove the target of live.
# Sort by mtime because release IDs are not guaranteed to sort chronologically.
current=$(readlink -f -- "$live")
keep=$((retain < 1 ? 1 : retain))
kept=0
mapfile -t old_releases < <(find "$releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %f\n' | sort -nr | cut -d' ' -f2-)
for name in "${old_releases[@]}"; do
  candidate="$releases/$name"
  if [ "$(readlink -f -- "$candidate")" = "$current" ]; then
    continue
  fi
  kept=$((kept + 1))
  if [ "$kept" -ge "$keep" ]; then
    rm -rf -- "$candidate"
  fi
done

echo "activated $release_id"
