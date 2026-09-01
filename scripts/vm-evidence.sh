#!/usr/bin/env bash
# Capture non-secret before/after evidence for the shared VM change.
set -u
root=${KMSC_RELEASE_ROOT:-/srv/kmsc-website}

section() { printf '\n## %s\n\n' "$1"; }
run() {
  if command -v "$1" >/dev/null 2>&1; then
    "$@" 2>&1 || printf '_command exited non-zero_\n'
  else
    printf '_%s is not installed_\n' "$1"
  fi
}

printf '# KMSC shared VM evidence\n\n- Captured (UTC): `%s`\n- Release root: `%s`\n' "$(date -u +%FT%TZ)" "$root"
section 'Active services'
run systemctl list-units --type=service --state=running --no-pager --no-legend
section 'Listening sockets'
run ss -ltnp
section 'Firewall'
run ufw status numbered
section 'Disk headroom'
run df -h "$root"
section 'Memory headroom'
run free -h
section 'Website release'
if [[ -L "$root/live" ]]; then
  printf -- '- live target: `%s`\n' "$(readlink -f -- "$root/live")"
else
  printf -- '- live target: _not configured_\n'
fi
if command -v caddy >/dev/null 2>&1; then
  printf -- '- Caddy: `%s`\n' "$(caddy version 2>&1 | head -n 1)"
else
  printf -- '- Caddy: _not installed_\n'
fi
