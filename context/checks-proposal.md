# Check Proposal Reference

All potential checks for project-doctor, grouped by implementation complexity.

---

## Tier 1: File Existence

Simple `fs.stat` checks for file presence.

| Check | Purpose |
|-------|---------|
| `nvmrc-exists` | Consistent Node version across team |
| `gitignore-exists` | Prevent accidental commits |
| `editorconfig-exists` | Consistent formatting across editors |
| `readme-exists` | Project documentation |
| `license-exists` | Legal compliance |
| `changelog-exists` | Version history |
| `contributing-exists` | Contributor guide |
| `prettierrc-exists` | Code formatting configured |
| `eslint-config-exists` | Linting configured |
| `tsconfig-exists` | TypeScript configured |
| `package-json-exists` | Valid Node project |
| `lockfile-exists` | Reproducible installs |
| `git-repo-exists` | Version controlled |
| `docker-exists` | Containerization available |
| `github-actions-exists` | CI/CD configured |
| `env-example-exists` | Environment template |

---

## Tier 2: Simple Parsing

Read file + basic validation.

| Check | Purpose |
|-------|---------|
| `nvmrc-valid-format` | Valid Node version string |
| `package-json-valid` | Valid JSON syntax |
| `package-json-has-name` | Project identity |
| `package-json-has-version` | Version tracking |
| `package-json-has-description` | Project summary |
| `package-json-has-license` | License field |
| `package-json-has-engines` | Node version requirement |
| `package-json-type-module` | ESM detection |
| `package-json-has-main-or-exports` | Entry point defined |
| `tsconfig-valid-json` | Valid tsconfig |
| `tsconfig-strict-enabled` | Type safety |
| `tsconfig-has-outdir` | Build output location |
| `editorconfig-has-root` | Config scope |
| `editorconfig-has-indent` | Indentation rules |
| `gitignore-has-node-modules` | Deps excluded |
| `gitignore-has-dist` | Build excluded |
| `gitignore-has-env` | Secrets excluded |
| `readme-has-title` | Minimal docs |
| `readme-has-install-section` | Setup instructions |
| `readme-has-usage-section` | Usage docs |

---

## Tier 3: Content Analysis

Pattern matching and content analysis.

| Check | Purpose |
|-------|---------|
| `gitignore-no-duplicates` | Clean config |
| `gitignore-no-secrets-committed` | Security |
| `package-json-scripts-build` | Build command exists |
| `package-json-scripts-dev` | Dev command exists |
| `package-json-scripts-test` | Test command exists |
| `package-json-scripts-lint` | Lint command exists |
| `package-json-deps-no-duplicates` | No dep in both deps/devDeps |
| `eslint-flat-config` | Modern config format |
| `eslint-no-legacy-config` | No deprecated .eslintrc |
| `prettier-eslint-conflict` | No conflicting rules |
| `env-vars-documented` | All vars in example |

---

## Tier 4: External Tools

Run external tools and parse output.

| Check | Purpose |
|-------|---------|
| `typescript-no-errors` | Type-safe codebase |
| `eslint-no-errors` | Lint-clean code |
| `prettier-formatted` | Consistent style |
| `tests-pass` | Tests are green |
| `tests-coverage-minimum` | Coverage threshold |
| `knip-no-unused-deps` | No dead dependencies |
| `knip-no-unused-exports` | No dead code |
| `npm-audit-no-critical` | No critical vulnerabilities |
| `npm-outdated-major` | Track major updates |
| `lockfile-in-sync` | Lockfile matches package.json |
| `build-succeeds` | Project builds |
| `bundle-size-limit` | Performance maintained |

---

## Tier 5: Supply Chain Security

Prevent supply chain attacks via npm dependencies.

| Check | Purpose |
|-------|---------|
| `npm-no-postinstall-scripts` | Prevent malicious install scripts |
| `npm-deps-age-minimum` | Reject packages < X days old |
| `npm-deps-download-threshold` | Reject low-download packages |
| `npm-no-deprecated-deps` | Avoid unmaintained code |
| `npm-deps-license-check` | License compliance |
| `npm-lockfile-integrity` | Detect tampering |
| `npm-registry-official` | No malicious mirrors |
| `npm-no-http-deps` | Secure transport only |
| `npm-deps-no-wildcards` | Reproducible builds |
| `npm-ignore-scripts-config` | Scripts disabled by default |
| `npm-deps-provenance` | Verified build origin |

---

## Tier 6: Docker Analysis

Docker image optimization and security.

| Check | Purpose |
|-------|---------|
| `docker-image-size-limit` | Deployment efficiency |
| `docker-base-image-slim` | Minimal attack surface |
| `docker-base-image-pinned` | Reproducible builds |
| `docker-no-root-user` | Security best practice |
| `docker-healthcheck-defined` | Container orchestration |
| `docker-multistage-build` | Optimized images |
| `docker-no-secrets-in-layers` | Secrets not in history |
| `docker-no-add-use-copy` | Predictable behavior |
| `docker-node-modules-excluded` | Smaller build context |
| `docker-security-scan-clean` | No CVEs |

---

## CLI Groupings

Suggested groupings for `--group` flag:

- `essential` - Tier 1 + core Tier 2
- `quality` - Linting, formatting, types
- `security` - Audit, secrets, vulnerabilities
- `supply-chain` - npm supply chain security
- `docker` - Docker optimization and security
- `maintenance` - Unused code, outdated deps
- `performance` - Bundle size
- `docs` - README, CHANGELOG, API docs
