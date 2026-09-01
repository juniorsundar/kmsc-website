# Static release deployment

GitHub Actions runs validation, browser tests, and `npm run build` on `main`. The resulting `dist/` directory is uploaded as the `static-site` artifact and the deploy job consumes that artifact; it never builds again.

The production environment requires these GitHub Actions secrets:

- `KMSC_DEPLOY_PRIVATE_KEY`: a dedicated key for the restricted deployment account
- `KMSC_DEPLOY_KNOWN_HOSTS`: the VM host key
- `KMSC_DEPLOY_HOST`, `KMSC_DEPLOY_USER`, `KMSC_RELEASE_ROOT`: deployment connection and release-root settings

The Ubuntu administrator private key is explicitly rejected as a deployment credential. It must not be copied into GitHub Secrets, this repository, or the build artifact. The deployment account needs only permission to create `.incoming` releases, write `releases`, and replace the `live` symlink under `KMSC_RELEASE_ROOT`.

The action uploads to `.incoming/<run-id>-<commit>/`, then `scripts/activate-static-release.sh` verifies the required static files before moving that directory into `releases/` and atomically replacing `live`. Verification or upload failure leaves the existing `live` target untouched. The newest five release directories are retained, including the current target.

The activation script requires Bash and standard Ubuntu core utilities on the VM. Astro, Node.js, npm, and the source repository are not required there. Rollback is an atomic symlink replacement performed by the restricted operator account, after selecting a retained release and verifying its contents.
