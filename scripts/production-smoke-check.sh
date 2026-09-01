#!/usr/bin/env bash
# Verify the public production cutover. This script is read-only.
set -euo pipefail

usage() { echo "usage: $0 --ip RESERVED_IPV4 [--canonical HOST] [--www HOST] [--headscale-port PORT]"; }
ip=''
canonical=kautilyamsc.com
www=www.kautilyamsc.com
headscale_port=8080
while (($#)); do
  case "$1" in
    --ip) ip=${2:?--ip requires an IPv4 address}; shift ;;
    --canonical) canonical=${2:?--canonical requires a hostname}; shift ;;
    --www) www=${2:?--www requires a hostname}; shift ;;
    --headscale-port) headscale_port=${2:?--headscale-port requires a port}; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done
[ -n "$ip" ] || { usage >&2; exit 2; }
command -v dig >/dev/null || { echo 'dig is required' >&2; exit 1; }
command -v curl >/dev/null || { echo 'curl is required' >&2; exit 1; }
command -v ss >/dev/null || { echo 'ss is required' >&2; exit 1; }

assert_dns() {
  local host=$1
  local answers
  answers=$(dig +short A "$host" | awk '/^[0-9]+(\.[0-9]+){3}$/')
  [ -n "$answers" ] || { echo "no A record for $host" >&2; exit 1; }
  printf '%s\n' "$answers" | grep -Fx "$ip" >/dev/null || {
    echo "$host does not resolve to reserved IP $ip (answers: $answers)" >&2
    exit 1
  }
  echo "DNS $host -> $ip"
}

assert_dns "$canonical"
assert_dns "$www"

check_routes=(/ /about/ /services/ /blog/ /contact/ /privacy/)
for route in "${check_routes[@]}"; do
  curl --fail --silent --show-error --location --max-time 15 "https://$canonical$route" -o /dev/null
  echo "HTTPS $canonical$route -> 200"
done

headers=$(curl --silent --show-error --max-time 15 -D - -o /dev/null "https://$www/")
printf '%s\n' "$headers" | grep -Eiq '^HTTP/[0-9.]+ 301 ' || { echo "www did not return 301" >&2; exit 1; }
printf '%s\n' "$headers" | grep -Fix "location: https://$canonical/" >/dev/null || { echo "www redirect location is not canonical" >&2; exit 1; }
echo "HTTPS $www/ -> 301 https://$canonical/"

ss -ltn | awk '{print $4}' | grep -E "(^|:)${headscale_port}$" >/dev/null || {
  echo "Headscale listener on TCP $headscale_port was not found" >&2
  exit 1
}
echo "Headscale listener preserved on TCP $headscale_port"
echo 'production smoke checks passed'
