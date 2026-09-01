# Production domain cutover

This runbook connects `kautilyamsc.com` to the prepared Oracle VM. It is intentionally an operator procedure: registrar, Oracle Cloud, and Cloudflare credentials must never be copied into this repository.

## Preflight and protections

1. Register `kautilyamsc.com` privately. Confirm WHOIS/privacy protection, a strong unique registrar password, MFA, transfer lock, and registrar recovery methods. Do not put payment details, identity documents, API tokens, or recovery codes in GitHub or this repository.
2. Confirm ticket 09 is complete on the VM. Capture a baseline with `sudo scripts/vm-evidence.sh`; verify the existing Headscale listener on TCP 8080 before changing anything.
3. In Oracle Cloud, reserve (or confirm) the VM's public IPv4 address. Record it in the operator's password manager, not in Git. Add only ingress TCP 80 and TCP 443 to the VM's security list/NSG. Preserve the existing SSH, Headscale, and Tailscale rules.
4. Install the checked-in Caddyfile at `/etc/caddy/Caddyfile`, validate it, and reload Caddy:

   ```sh
   sudo install -o root -g root -m 0644 deploy/caddy/Caddyfile /etc/caddy/Caddyfile
   sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   sudo systemctl reload caddy
   ```

   Caddy's automatic HTTPS obtains certificates for both hostnames. Do not disable certificate verification or manually store certificates in the repository. Ensure ports 80 and 443 are reachable from the public internet while certificates are issued.

## DNS cutover (before DNSSEC)

In the authoritative Cloudflare zone, create or update these records and remove conflicting A/AAAA/CNAME records:

| Name | Type | Value | Proxy during issuance |
| --- | --- | --- | --- |
| `@` | A | reserved Oracle IPv4 | DNS only |
| `www` | A | reserved Oracle IPv4 | DNS only |

Use a low TTL while cutting over. Confirm the Cloudflare nameservers are delegated at the registrar, and query those authoritative nameservers directly to verify the records. Leave DNSSEC **disabled**. Do not add a DS record at the registrar yet; a stale DS record can make an otherwise correct DNS zone appear broken.

Wait for authoritative answers and then copy the script to, or run it from, the Oracle VM (so its `ss` check observes the VM's listener). The check is read-only:

```sh
scripts/production-smoke-check.sh --ip RESERVED_ORACLE_IPV4
```

It verifies both A records, certificate-validated HTTPS on representative routes, the permanent `www` redirect, and the unchanged Headscale listener on TCP 8080. `curl` certificate validation also checks that Caddy serves a trusted certificate for the requested hostname. Separately record the direct authoritative `dig` answers and Cloudflare's DNSSEC-disabled state; the script intentionally does not change or infer those control-plane settings.

After the first successful check, capture `sudo scripts/vm-evidence.sh` again. Compare active services, listeners, firewall rules, disk, memory, Caddy, and the `live` target against the baseline. If Cloudflare proxying is desired, enable it only after this DNS-only check and repeat the public smoke checks.

## Launch gate and rollback

DNSSEC stays disabled until ordinary DNS has remained stable and the final launch-readiness gate (ticket 13) explicitly approves enabling it. At that point, enable DNSSEC in Cloudflare, publish the resulting DS record at the registrar, and repeat DNS checks from multiple networks. Never guess or reuse a DS record.

A DNS or Caddy failure is rolled back by restoring the previous Cloudflare record values (or pausing DNS changes), not by changing the static release. A bad website release is rolled back with the retained release procedure in [deployment.md](deployment.md). Caddy and Headscale are not restarted as part of a static release rollback.

Record the following outside Git:

- registration/privacy and account-protection confirmation;
- reserved Oracle public IPv4 and ingress-rule review;
- Cloudflare authoritative answers and DNSSEC-disabled state;
- Caddy validation/reload result and certificate/route smoke output;
- before/after VM evidence and the selected release ID.
