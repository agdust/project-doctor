# changelog-exists

Checks that a CHANGELOG.md file exists.

## Why

A changelog helps users:

- See what changed between versions
- Decide whether to upgrade
- Find migration instructions
- Understand project evolution

## Examples

**Pass**: `CHANGELOG.md` file exists.

**Fail**: No changelog file found.

## How to fix

Create `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [Unreleased]

## [1.0.0] - 2024-01-15

### Added
- Initial release

### Changed
- ...

### Fixed
- ...
```

Consider using [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) for automation.
