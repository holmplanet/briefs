# Public release checklist

This is the release gate for making the Briefs repository public. It applies to
the open-source System, shared schemas, clients, MCP package, and deployment
examples. It does not make a hosted Daily deployment part of the release.

## Before changing repository visibility

- [ ] `main` is the only long-lived branch and is up to date with the intended release commit.
- [ ] CI is green for pull requests and pushes to `main`.
- [ ] `npm run typecheck`, `npm test`, Daily tests, and `npm run build` pass from a clean checkout.
- [ ] `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, and `SECURITY.md` are present and accurate.
- [ ] Issue forms and the pull request template are present.
- [ ] Tracked files contain no credentials, private paths, personal notes, deployment secrets, or private customer data.
- [ ] Published Git history and tags have been reviewed for personal emails, credentials, and private operational details.
- [ ] Example environment files use placeholders only and keep development bypasses clearly separate from production settings.
- [ ] The repository description and README describe the current items/actors/activities platform, not deferred product ideas.

## Configure GitHub before or immediately after visibility change

Configure protection on `main`:

- Require pull requests; prohibit direct pushes.
- Require the CI workflow to pass before merge.
- Keep merge authority with the repository owner. When additional maintainers
  are added, require at least one independent approving review; while the
  repository has a sole maintainer, PR review plus required CI is the merge gate.
- Disable force pushes and branch deletion for `main`.
- Enable automatic deletion of merged feature branches.

If the current GitHub plan cannot provide these controls while the repository is
private, keep the repository private until the controls can be applied after
the visibility change.

## Hosted deployment boundary

The repository release and hosted deployments are separate gates:

- The SDK documentation site may have its own public domain.
- Daily is an optional reference client and may be offline or deployed separately.
- Do not document a preview URL as the production app.
- Keep preview and production databases, OAuth redirect URIs, email senders,
  and secrets separate.
- Keep Docker Compose + Infisical documented as the portable self-hosted path.

## After changing visibility

- [ ] Confirm the public repository renders its README, license, security policy,
  issue forms, and contribution guide correctly.
- [ ] Confirm the first public pull request runs CI and cannot merge while CI is red.
- [ ] Check that package, Docker, and Vercel examples still build without private
  repository access or local filesystem paths.
- [ ] Record the public release commit, repository URL, and any remaining hosted
  deployment work in the project log.
