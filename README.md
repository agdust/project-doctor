# project-doctor

A CLI tool for project health checks and maintenance. Technology-independent linting for your project configuration.

## Usage

```sh
npx project-doctor          # Interactive wizard
npx project-doctor check    # Run all checks
npx project-doctor fix all  # Auto-fix all issues
```

## CLI Commands

### Running Checks

```sh
project-doctor check [options] [path]
  -g, --group <name>      Filter by group
  -t, --tag <tag>         Filter by tag
  --format json           Output as JSON
  --no-config             Ignore config file

project-doctor overview [path]    # Health summary
project-doctor deps [path]        # Check outdated dependencies
```

### Fixing Issues

```sh
project-doctor fix [path]              # List fixable issues
project-doctor fix all [options] [path] # Fix all issues
project-doctor fix <check> [path]      # Fix specific check

# Options for 'fix all':
  --group <name>          Fix only checks in group
  --tag <tag>             Fix only checks with tag
  --pick <option-id>      Select fix option for checks with multiple options
```

### Configuration Management

```sh
project-doctor config [path]                        # Show current config
project-doctor config set project-type <js|generic> # Set project type

project-doctor disable check <name>    # Disable a check permanently
project-doctor disable tag <name>      # Disable all checks with tag
project-doctor disable group <name>    # Disable entire group

project-doctor enable check <name>     # Re-enable a check
project-doctor enable tag <name>       # Re-enable a tag
project-doctor enable group <name>     # Re-enable a group

project-doctor mute <check> [options]  # Temporarily mute a check
  --weeks <n>             Mute for n weeks (default: 2)
  --months <n>            Mute for n months
  --until <YYYY-MM-DD>    Mute until date

project-doctor unmute <check>          # Remove mute from check
```

### Listing & Info

```sh
project-doctor list [options]
  -g, --group <name>      Filter by group
  -t, --tag <tag>         Filter by tag
  --status <status>       Filter: all, enabled, disabled, muted
  --format <format>       Output: table, json, names

project-doctor info <check> [--format json]   # Show check details
```

### Other Commands

```sh
project-doctor init [path]       # Create config file
project-doctor snapshot [path]   # Save current status
project-doctor history [path]    # View progress over time
```

## Configuration

Create `.project-doctor/config.json5`:

```json5
{
  projectType: "js",  // or "generic"
  checks: { "changelog-exists": "off" },
  tags: { "opinionated": "off" },
  groups: { "eslint": "off" },
  // Temporarily skip:
  checks: { "some-check": "skip-until-2025-06-01" },
}
```

## CI/CD Usage

All commands are non-interactive:

```sh
# Fail CI if any check fails
project-doctor check --format json

# Auto-fix low-effort issues
project-doctor fix all --tag effort:low

# Disable opinionated checks for CI
project-doctor disable tag opinionated
project-doctor check
```
