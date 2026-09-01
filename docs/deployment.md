# Static release deployment

GitHub Actions runs validation, browser tests, and `npm run build` on `main`. The resulting `dist/` directory is uploaded as the `static-site` artifact and the deploy job consumes that artifact; it never builds again.

The production environment requires these GitHub Actions secrets:

- `KMSC_DEPLOY_PRIVATE_KEY`: a dedicated key for the restricted deployment account
- `KMSC_DEPLOY_KNOWN_HOSTS`: the VM host key
- `KMSC_DEPLOY_HOST`, `KMSC_DEPLOY_USER`, `KMSC_RELEASE_ROOT`: deployment connection and release-root settings

The Ubuntu administrator private key is explicitly rejected as a deployment credential. It must not be copied into GitHub Secrets, this repository, or the build artifact. The deployment account needs only permission to create `.incoming` releases, write `releases`, and replace the `live` symlink under `KMSC_RELEASE_ROOT`.

The action uploads to `.incoming/<run-id>-<commit>/`, then `scripts/activate-static-release.sh` verifies the required static files before moving that directory into `releases/` and atomically replacing `live`. Verification or upload failure leaves the existing `live` target untouched. The newest five release directories are retained, including the current target.

The activation script requires Bash and standard Ubuntu core utilities on the VM. Astro, Node.js, npm, and the source repository are not required there. Rollback is an atomic symlink replacement performed by the restricted operator account, after selecting a retained release and verifying its contents. Use `scripts/rollback-static-release.sh <release-root> <release-id>`; it refuses incomplete releases and never removes `live` before the replacement.

## Shared VM preparation

The VM preparation boundary is deliberately explicit and additive:

1. As the existing Ubuntu administrator, install Caddy from its approved package source and capture a baseline with `sudo scripts/vm-evidence.sh`.
2. Review `scripts/prepare-vm.sh --root /srv/kmsc-website`, then run it with `sudo scripts/prepare-vm.sh --apply`. The script creates `kmsc-deploy` with `/bin/bash` for non-interactive SSH commands, no sudo grant, and ownership of only the release root. It creates:

   ```text
   /srv/kmsc-website/
   ├── .incoming/   # uploads in progress, owned by kmsc-deploy
   ├── releases/   # immutable-by-convention versioned trees
   └── live        # symlink replaced atomically
   ```

   Keep the root and directories mode `0755`; uploaded files must be readable by Caddy and writable only by the deployment account. Caddy reads `live` as its service user and has no write permission to the release tree.
3. Install `deploy/caddy/Caddyfile` at `/etc/caddy/Caddyfile`. The preparation script runs `caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` before `systemctl reload caddy`; a validation failure prevents activation. The pre-DNS config is HTTP-only and intentionally contains no Headscale proxy. Ticket 10 supplies the production hostnames and HTTPS policy.
4. Add the only new host firewall rules with `ufw allow 80/tcp` and `ufw allow 443/tcp`. The preparation script never deletes or edits SSH, Headscale (8080), Tailscale, or unrelated rules. Oracle Cloud ingress must receive the same two-port-only delta.
5. Capture `sudo scripts/vm-evidence.sh` again. Compare active services, listeners, firewall rules, disk, memory, Caddy, and `live` target with the baseline. The expected invariant is an unchanged Headscale listener on TCP 8080 and no new application runtime.

Do not place the administrator key in GitHub. Create a separate key pair, install only its public key in `kmsc-deploy`'s `authorized_keys` with forwarding disabled, and store the private key and host key only as the documented GitHub Actions secrets. The deployment account must not be granted sudo. Preparation is intentionally not run automatically by CI because it changes a shared production host.

### Rollback smoke test

After two complete releases are present, run the activation script for a new release, request a representative page, then run the rollback script against the retained release and request the same page again. Record both `live` targets and the evidence snapshots. A failed artifact verification must leave the old target and content unchanged. No Caddy reload or Headscale operation is part of rollback.
