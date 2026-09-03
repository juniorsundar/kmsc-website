#!/usr/bin/env bash
# Vendor the Decap CMS editor bundle into public/admin so the editor is served
# same-origin instead of from a public CDN.
#
# The editor bundle is the code that receives the GitHub access token, so it is
# never loaded from a third-party host: a CDN able to answer for that hostname
# would be able to exfiltrate a token with push access to main.
#
# Re-run this to change version, then commit the updated bundle:
#   scripts/vendor-decap.sh 3.8.3
set -euo pipefail

version=${1:?version is required, for example 3.8.3}
case "$version" in
  ''|*[!0-9.]*) echo 'version must be a plain semantic version, for example 3.8.3' >&2; exit 2 ;;
esac

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target="$repo_root/public/admin"
workspace=$(mktemp -d)
trap 'rm -rf -- "$workspace"' EXIT

# npm verifies the tarball against the registry integrity hash on download, so
# the bytes are checked before anything is copied into the served directory.
echo "Fetching decap-cms@$version from the npm registry..."
(cd "$workspace" && npm pack "decap-cms@$version" --silent >/dev/null)
tarball=$(find "$workspace" -maxdepth 1 -name '*.tgz' -print -quit)
[ -n "$tarball" ] || { echo 'npm pack produced no tarball' >&2; exit 1; }

expected=$(npm view "decap-cms@$version" dist.integrity --silent | tr -d "'\" ")
actual="sha512-$(openssl dgst -sha512 -binary "$tarball" | openssl base64 -A)"
if [ "$expected" != "$actual" ]; then
  echo "integrity mismatch for decap-cms@$version" >&2
  echo "  expected: $expected" >&2
  echo "  actual:   $actual" >&2
  exit 1
fi
echo "Verified tarball integrity: $actual"

tar -xzf "$tarball" -C "$workspace"
bundle="$workspace/package/dist/decap-cms.js"
[ -f "$bundle" ] || { echo 'the package contains no dist/decap-cms.js' >&2; exit 1; }

mkdir -p "$target"
# The source maps are ~23 MB each and are not needed to serve the editor.
install -m 0644 "$bundle" "$target/decap-cms.js"
install -m 0644 "$workspace/package/dist/decap-cms.js.LICENSE.txt" "$target/decap-cms.js.LICENSE.txt"

echo "Vendored decap-cms@$version to public/admin/decap-cms.js"
echo "  sha384-$(openssl dgst -sha384 -binary "$target/decap-cms.js" | openssl base64 -A)"
echo 'Commit the updated bundle, then confirm the editor loads and can publish.'
