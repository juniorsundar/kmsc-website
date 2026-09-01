#!/usr/bin/env bash
# Prepare the shared VM for static releases. Nothing is changed unless --apply is
# supplied. This script deliberately does not inspect, reload, or reconfigure
# Headscale, Tailscale, or SSH.
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
root=${KMSC_RELEASE_ROOT:-/srv/kmsc-website}
deploy_user=${KMSC_DEPLOY_USER:-kmsc-deploy}
config=${KMSC_CADDYFILE:-/etc/caddy/Caddyfile}
mode=dry-run

usage() { echo "usage: $0 [--apply] [--root PATH] [--user NAME] [--caddyfile PATH]"; }
while (($#)); do
  case "$1" in
    --apply) mode=apply ;;
    --root) root=${2:?--root requires a path}; shift ;;
    --user) deploy_user=${2:?--user requires a name}; shift ;;
    --caddyfile) config=${2:?--caddyfile requires a path}; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done

case "$root" in /*) ;; *) echo 'release root must be a simple absolute path' >&2; exit 2 ;; esac
case "$root" in *[!a-zA-Z0-9_./-]*) echo 'release root must be a simple absolute path' >&2; exit 2 ;; esac
case "$deploy_user" in ''|*[!a-zA-Z0-9_-]*) echo 'invalid deployment username' >&2; exit 2 ;; esac

deploy_group=$deploy_user
if id "$deploy_user" >/dev/null 2>&1; then
  deploy_group=$(id -gn "$deploy_user")
fi

run() {
  printf '+ %q' "$1"; shift; printf ' %q' "$@"; printf '\n'
  if [[ "$mode" == apply ]]; then
    "$@"
  fi
}

if [[ "$mode" == apply && $EUID -ne 0 ]]; then
  echo '--apply must be run as root' >&2
  exit 1
fi

if ! id "$deploy_user" >/dev/null 2>&1; then
  run "create restricted deployment account" useradd --system --user-group --home-dir "$root" --shell /bin/bash "$deploy_user"
fi
run "create release directories" install -d -o "$deploy_user" -g "$deploy_group" -m 0755 "$root" "$root/.incoming" "$root/releases"
run "protect release root from web-server writes" chmod 0755 "$root" "$root/.incoming" "$root/releases"

if [[ ! -f "$script_dir/deploy/caddy/Caddyfile" ]]; then
  echo 'deploy/caddy/Caddyfile is missing' >&2
  exit 1
fi
if [[ "$mode" == apply ]]; then
  config_dir=$(dirname -- "$config")
  install -d -o root -g root -m 0755 "$config_dir"
  candidate=$(mktemp "$config.XXXXXX")
  trap 'rm -f -- "$candidate"' EXIT
  # Keep --root useful for disposable/pre-production VM layouts while retaining
  # one checked-in Caddyfile as the source configuration.
  sed "s#/srv/kmsc-website/live#${root}/live#g" "$script_dir/deploy/caddy/Caddyfile" > "$candidate"
  caddy validate --config "$candidate" --adapter caddyfile
  chown root:root "$candidate"
  chmod 0644 "$candidate"
  mv -f -- "$candidate" "$config"
  trap - EXIT
  systemctl reload caddy
else
  echo "+ install validated Caddy configuration at $config (root=$root)"
  echo "+ caddy validate --config $config --adapter caddyfile"
  echo '+ systemctl reload caddy'
fi

# Additive firewall changes only. Existing SSH, Headscale, and Tailscale rules
# are intentionally neither deleted nor modified.
run "allow public HTTP" ufw allow 80/tcp comment 'KMSC website HTTP'
run "allow public HTTPS" ufw allow 443/tcp comment 'KMSC website HTTPS'

echo "$mode VM preparation plan complete: root=$root user=$deploy_user group=$deploy_group"
