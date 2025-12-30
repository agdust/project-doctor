# Comprehensive Check Proposal

All checks for project-doctor, grouped by implementation cost. Each check includes motivation for both human developers and LLM agents.

---

## Tier 1: Trivial (file existence only)

These checks only verify file presence. Implementation: single `fs.stat` call.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `nvmrc-exists` | Ensures team uses consistent Node version | Knows which Node version to expect |
| `gitignore-exists` | Prevents accidental commits of artifacts | Understands what files are ignored |
| `editorconfig-exists` | Consistent formatting across editors | Knows indentation/formatting rules |
| `readme-exists` | Project documentation present | Entry point for understanding project |
| `license-exists` | Legal compliance | Knows usage restrictions |
| `changelog-exists` | Track version history | Understands project evolution |
| `contributing-exists` | Guide for contributors | Knows contribution workflow |
| `prettierrc-exists` | Code formatting configured | Knows formatting rules apply |
| `eslint-config-exists` | Linting configured | Knows linting rules apply |
| `tsconfig-exists` | TypeScript configured | Knows TS compilation settings |
| `package-json-exists` | Valid Node project | Entry point for dependencies |
| `lockfile-exists` | Reproducible installs | Knows exact dependency versions |
| `git-repo-exists` | Version controlled | Can use git commands |
| `docker-exists` | Containerization available | Knows deployment approach |
| `github-actions-exists` | CI/CD configured | Understands automation |
| `env-example-exists` | Environment template available | Knows required env vars |
| `jest-config-exists` | Test framework configured | Knows testing approach |
| `vitest-config-exists` | Vitest configured | Knows testing framework |
| `playwright-config-exists` | E2E tests configured | Knows E2E testing setup |
| `cypress-config-exists` | Cypress configured | Knows E2E testing setup |

---

## Tier 2: Low Cost (simple file parsing)

These checks read and parse files with minimal logic. Implementation: read file + basic validation.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `nvmrc-valid-format` | Catch malformed version strings | Parse Node version correctly |
| `package-json-valid` | Catch JSON syntax errors | Reliably parse package info |
| `package-json-has-name` | Project is publishable | Know project identity |
| `package-json-has-version` | Version tracking | Know current version |
| `package-json-has-description` | Project purpose documented | Quick project summary |
| `package-json-has-license` | Legal field present | Know usage rights |
| `package-json-has-engines` | Node version requirement | Know runtime constraints |
| `package-json-type-module` | ESM project detection | Know import syntax to use |
| `package-json-has-main-or-exports` | Entry point defined | Know where code starts |
| `tsconfig-valid-json` | Catch JSON errors in tsconfig | Parse TS settings |
| `tsconfig-strict-enabled` | Catch type errors early | Know type strictness level |
| `tsconfig-has-outdir` | Build output configured | Know build artifacts location |
| `editorconfig-has-root` | Config applies from root | Know formatting scope |
| `editorconfig-has-indent` | Indentation defined | Know indent style/size |
| `gitignore-has-node-modules` | Don't commit dependencies | Know deps are excluded |
| `gitignore-has-dist` | Don't commit build output | Know build is excluded |
| `gitignore-has-env` | Don't commit secrets | Know secrets excluded |
| `prettierrc-valid` | Catch config errors | Parse formatting rules |
| `readme-has-title` | Minimal documentation | Quick project name |
| `readme-has-install-section` | Setup instructions exist | Know how to install |
| `readme-has-usage-section` | Usage documented | Know how to use |
| `env-example-not-empty` | Env vars documented | Know required vars |
| `dockerfile-has-from` | Valid Dockerfile | Know base image |

---

## Tier 3: Medium Cost (content analysis / pattern matching)

These checks analyze file content for patterns, duplicates, or missing elements.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `gitignore-no-duplicates` | Clean config, avoid confusion | Accurate ignore list |
| `gitignore-project-type-patterns` | Type-specific ignores (e.g., .next for Next.js) | Know framework artifacts |
| `gitignore-no-secrets-committed` | Security: ensure .env ignored | Confirm secrets safe |
| `package-json-scripts-build` | Build command exists | Know how to build |
| `package-json-scripts-dev` | Dev command exists | Know how to run dev |
| `package-json-scripts-test` | Test command exists | Know how to test |
| `package-json-scripts-lint` | Lint command exists | Know how to lint |
| `package-json-scripts-format` | Format command exists | Know how to format |
| `package-json-no-unused-scripts` | Clean scripts section | Trust script list |
| `package-json-deps-no-duplicates` | No dep in both deps and devDeps | Accurate dep graph |
| `package-json-deps-sorted` | Alphabetical for merge conflicts | Predictable ordering |
| `tsconfig-no-any-enabled` | Prevent accidental any | Know if any is banned |
| `tsconfig-paths-valid` | Path aliases resolve | Use correct imports |
| `eslint-flat-config` | Using modern config format | Know config format |
| `eslint-no-legacy-config` | No deprecated .eslintrc | Single source of truth |
| `prettier-eslint-conflict` | No conflicting rules | Consistent formatting |
| `readme-links-valid` | No broken links | Reliable documentation |
| `readme-code-blocks-valid` | Code examples parseable | Trust code examples |
| `env-vars-documented` | All vars in example file | Know all env vars |
| `imports-no-circular` | No circular dependencies | Reliable imports |
| `exports-public-api-defined` | Package exports defined | Know public API |
| `files-no-console-log` | No debug logs in prod | Clean production code |
| `files-no-todo-fixme` | Track tech debt | Know pending work |
| `files-consistent-newlines` | LF vs CRLF consistency | Predictable line endings |
| `files-no-trailing-whitespace` | Clean formatting | Consistent whitespace |
| `files-final-newline` | POSIX compliance | Predictable file endings |

---

## Tier 4: High Cost (external tool execution)

These checks run external tools and parse their output.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `typescript-no-errors` | Type-safe codebase | Trust type annotations |
| `eslint-no-errors` | Lint-clean code | Code follows rules |
| `eslint-no-warnings` | Strict lint compliance | No ignored issues |
| `prettier-formatted` | Code is formatted | Consistent style |
| `tests-pass` | Tests are green | Code works as expected |
| `tests-coverage-minimum` | Coverage threshold met | Tests are comprehensive |
| `knip-no-unused-deps` | No dead dependencies | Accurate dep list |
| `knip-no-unused-exports` | No dead code | All exports used |
| `knip-no-unused-files` | No orphan files | All files needed |
| `npm-audit-no-critical` | No critical vulnerabilities | Secure dependencies |
| `npm-audit-no-high` | No high vulnerabilities | Secure dependencies |
| `npm-outdated-major` | Track major updates | Know upgrade needs |
| `npm-outdated-minor` | Track minor updates | Know patch needs |
| `lockfile-in-sync` | Lockfile matches package.json | Reproducible installs |
| `node-version-matches` | Running correct Node | Correct runtime |
| `build-succeeds` | Project builds | Deployable state |
| `bundle-size-limit` | Bundle under threshold | Performance maintained |
| `lighthouse-performance` | Performance score acceptable | Fast loading |
| `lighthouse-accessibility` | A11y score acceptable | Accessible UI |

---

## Tier 5: Complex (multi-step analysis)

These checks require deep analysis across multiple files or complex logic.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `project-size-reasonable` | Not bloated | Context fits in memory |
| `large-files-detected` | Find binary/generated files | Know what to skip |
| `node-modules-bloat` | Dependencies not excessive | Reasonable dep tree |
| `dead-code-detected` | Find unreachable code | Trust all code is used |
| `api-endpoints-documented` | API has docs | Know available endpoints |
| `api-types-exported` | Types for API consumers | Know API types |
| `database-migrations-sequential` | Migrations in order | DB state predictable |
| `env-vars-used-but-missing` | All used vars defined | No runtime env errors |
| `imports-external-pinned` | External deps versioned | Reproducible builds |
| `security-no-hardcoded-secrets` | No secrets in code | Code is safe to share |
| `security-no-eval` | No eval() usage | Secure code patterns |
| `security-dependencies-signed` | Verify package integrity | Trusted packages |
| `monorepo-workspace-valid` | Workspace config correct | Know package structure |
| `monorepo-deps-internal` | Internal deps use workspace | Correct linking |
| `ci-matches-local` | CI commands match npm scripts | CI/local parity |
| `dockerfile-node-version-matches` | Docker uses same Node | Consistent runtime |
| `git-hooks-installed` | Hooks active after clone | Pre-commit works |
| `conventional-commits` | Commit format followed | Parseable history |
| `branch-naming-convention` | Branch names follow pattern | Predictable branches |

---

## Tier 6: Opinionated / Framework-Specific

These checks enforce specific patterns or are framework-dependent.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `svelte-5-runes` | Using $state/$derived | Modern Svelte patterns |
| `svelte-no-stores` | Prefer runes over stores | Current best practice |

---

## Tier 7: Supply Chain Security

Checks to prevent supply chain attacks via npm dependencies.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `npm-no-postinstall-scripts` | Prevent malicious install scripts | Know install is safe |
| `npm-postinstall-allowlist` | Only allowed packages run scripts | Controlled script execution |
| `npm-deps-age-minimum` | Reject packages published < X days ago | Avoid typosquatting/new malicious packages |
| `npm-deps-download-threshold` | Reject packages with < X weekly downloads | Avoid unpopular/suspicious packages |
| `npm-deps-maintainer-count` | Flag single-maintainer critical deps | Supply chain risk awareness |
| `npm-no-deprecated-deps` | No deprecated packages | Avoid unmaintained code |
| `npm-deps-license-check` | All deps have compatible licenses | Legal compliance |
| `npm-deps-source-available` | Deps have public repo | Auditable dependencies |
| `npm-lockfile-integrity` | Lockfile hashes valid | Detect tampering |
| `npm-registry-official` | Using official npm registry | No malicious mirrors |
| `npm-no-http-deps` | No http:// git deps | Secure transport only |
| `npm-deps-no-wildcards` | No `*` or `latest` versions | Reproducible builds |
| `npm-ignore-scripts-config` | `.npmrc` has `ignore-scripts=true` | Scripts disabled by default |
| `npm-deps-provenance` | Deps have build provenance | Verified build origin |

---

## Tier 8: Docker Analysis

Checks for Docker image optimization and security.

| Check | Motivation (Human) | Motivation (LLM Agent) |
|-------|-------------------|----------------------|
| `docker-image-size-limit` | Image under threshold (e.g., 500MB) | Deployment efficiency |
| `docker-base-image-slim` | Using alpine/slim variants | Minimal attack surface |
| `docker-base-image-pinned` | Using specific tag, not `latest` | Reproducible builds |
| `docker-base-image-official` | Using official images only | Trusted base |
| `docker-no-root-user` | Running as non-root USER | Security best practice |
| `docker-healthcheck-defined` | HEALTHCHECK instruction present | Container orchestration |
| `docker-multistage-build` | Using multi-stage for smaller images | Optimized final image |
| `docker-no-secrets-in-layers` | No secrets copied into image | Secrets not in history |
| `docker-labels-present` | Metadata labels defined | Image documentation |
| `docker-no-add-use-copy` | Prefer COPY over ADD | Predictable behavior |
| `docker-apt-no-cache` | `apt-get clean` or `--no-install-recommends` | Smaller layers |
| `docker-node-modules-excluded` | node_modules in .dockerignore | Smaller build context |
| `docker-prod-deps-only` | Only production deps in final image | Smaller image |
| `docker-security-scan-clean` | No CVEs from trivy/grype scan | Secure base image |
| `docker-no-privileged-ports` | Not exposing ports < 1024 | Non-root compatible |
| `docker-read-only-fs` | Can run with read-only root fs | Security hardening |
| `docker-no-cap-add` | No extra capabilities needed | Minimal privileges |
| `docker-distroless-compatible` | Can use distroless base | Maximum security |

---

## Implementation Priority Recommendation

### Phase 1: Core Health (implement first)
- All Tier 1 checks (file existence)
- Essential Tier 2 checks (package.json, tsconfig validation)
- `gitignore-has-*` checks

### Phase 2: Quality Gates
- `typescript-no-errors`
- `eslint-no-errors`
- `tests-pass`
- `lockfile-in-sync`

### Phase 3: Maintenance
- All knip checks
- `npm-audit-*` checks
- `npm-outdated-*` checks
- Project size checks

### Phase 4: Deep Analysis
- Security checks
- Dead code detection
- Framework-specific checks

### Phase 5: Supply Chain Security
- `npm-no-postinstall-scripts`
- `npm-deps-age-minimum`
- `npm-lockfile-integrity`
- `npm-ignore-scripts-config`

### Phase 6: Docker Analysis
- `docker-image-size-limit`
- `docker-base-image-slim`
- `docker-no-root-user`
- `docker-multistage-build`
- `docker-security-scan-clean`

---

## Check Categories for CLI

Suggested groupings for `--group` flag:

- `essential` - Tier 1 + core Tier 2
- `quality` - Linting, formatting, types
- `security` - Audit, secrets, vulnerabilities
- `supply-chain` - npm supply chain security checks
- `docker` - Docker optimization and security
- `maintenance` - Unused code, outdated deps
- `performance` - Bundle size, lighthouse
- `docs` - README, CHANGELOG, API docs
- `ci` - CI/CD configuration checks
- `framework:svelte` - Svelte-specific
