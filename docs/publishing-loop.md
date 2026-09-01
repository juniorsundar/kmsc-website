# Editor-to-VM publishing loop

This is the release evidence procedure for ticket 12. It separates checks that run in CI from the provider and VM checks that require KMSC-owned accounts. The repository remains the source of truth; the VM only receives the verified `dist/` artifact.

## Automated proof

Every commit made by Decap to `main` runs `.github/workflows/ci.yml` in this order:

1. `npm ci` installs the locked dependencies.
2. `npm run validate` rejects malformed Page Content, Training Services, Blog Posts, and Media Asset references.
3. `npm test` exercises the production build boundary and the isolated release scripts.
4. `npm run build` creates the exact `dist/` artifact uploaded as `static-site`.
5. Only the successful `verify` job can run `deploy`; the deploy job uploads to `.incoming/<run-id>-<commit>` and activates it with `scripts/activate-static-release.sh`.

A failed validation, test, or build has no artifact for `deploy` to consume. Activation verifies the complete static tree before replacing `live`, so a failed upload or verification leaves the current release unchanged. `tests/publishing-loop.spec.ts` additionally proves two revisions followed by atomic rollback and confirms invalid content cannot enter activation.

## Live Editor check

Perform this checklist with the authorized **Editor** account and record the commit SHAs and workflow run URLs outside the repository:

- [ ] Open `/admin/` and choose **Login with GitHub**. Confirm the OAuth client secret is never displayed or requested by Decap.
- [ ] Change one restrained Page Content field, such as the Home introduction, and keep `noindex` enabled. Publish with Decap.
- [ ] Confirm GitHub shows a direct commit on `main`, not a pull request, and that the workflow starts for that commit.
- [ ] Confirm validation, browser tests, and the production build pass before deployment starts.
- [ ] Confirm the changed text is visible at `https://kautilyamsc.com/` and the deployment selected a new release. Confirm `https://www.kautilyamsc.com/` still redirects to the canonical origin.
- [ ] On the VM, compare `scripts/vm-evidence.sh` before and after the release. Confirm Headscale is still listening on TCP 8080 and was not restarted.
- [ ] Reopen the same Page Content in Decap, make a second restrained change, and publish. Record the second commit and release ID.
- [ ] Create a **revert commit on `main`** for the editorial commit (using the repository's approved GitHub controls), and confirm that commit enters the normal validation/build/deploy path. Confirm the previous text returns over HTTPS. This is the required content revert; it is distinct from emergency release rollback.
- [ ] If an emergency release rollback is also being tested, run `scripts/rollback-static-release.sh` against the first retained release. Confirm the first text returns over HTTPS, then redeploy the second revision through the normal workflow if it is still required.

The deployment account must be the restricted `kmsc-deploy` account. Never use or upload the Ubuntu administrator key.

## Temporary Blog Post option

A temporary verification Blog Post may be used instead of changing Page Content only when it is clearly labelled as verification content and has `noindex: true`. Confirm its commit, deployment, reopen/edit cycle, and rollback as above. Delete the temporary Blog Post through Decap, publish that deletion, and verify the Blog index returns to **Insights coming soon**. Remove it before declaring the check complete; no fabricated public article may remain in `content/blog/` or on the production origin.

## Deliberately invalid-content check

In a disposable branch or local copy, remove a required field (for example `summary`) or use an invalid Page Content literal. Run `npm run validate`; it must exit non-zero with the file and field named. Do not bypass the workflow or create a release from that copy. The isolated test demonstrates the same boundary by verifying that no invalid upload is activated and the existing `live` target is unchanged. For the live check, record that the invalid commit's `deploy` job was skipped because `verify` failed.

## Required live evidence

Keep the following in the operator's release record rather than committing credentials or provider output here:

- GitHub OAuth login result, Editor account, commit SHAs, and workflow URLs;
- deployed release IDs, HTTPS route checks, and rollback result;
- before/after VM evidence including the unchanged Headscale TCP 8080 listener;
- confirmation that the temporary Blog Post was removed, if one was used.
