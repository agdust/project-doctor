# Project Doctor

A CLI tool for setting up healthy and robust project configs. Security best practices, audit and linting tool recommendations, and many other health checks, often with auto-fix. All in interactive and easy to use CLI app. For now main focus on JS ecosystem, but not limited to.

This tool comes with 2 main running modes: interactive wizard and classic cli tool.

- Interactive wizard does not expect from you to know anything about this tool, everything is super-intuitive, and you can do everything from it.
- Classic cli interface intentionally has 0 interactiveness, and expects that you know what you are doing. Mainly targeted at automation scripts and AI agents.

<gif>

## Motivation

In these weird new times, when a lot of code is written by clankers, it's more important than ever to create strict guardrails. Linters, formatters, dead code detectors, copy-paste detectors, secret trackers, and many other great tools and practices. It's hard to keep everything in the head, especially if you have tens of projects.

Project Doctor was designed as easy to use, lean, fast, non-demanding, universal, opinionated, yet configurable and extendable tool, that helps you to track and implement all those thousands of very best practices. Just launch it and fix what you want, postpone what can wait, disable what you don't like.

## Usage

To open interactive wizard, just run `npx project-doctor@latest`, or any analogue from your package manager

```sh
npx project-doctor
```

## I want you to know

This project was created by one person, and some things might be missing. I only have one device, use one terminal with just one theme. If something breaks on another OS or in another setup — please bring all possible details, and keep in mind that I cannot test every possible scenario or setup by my own.

This project was written by LLM Coding Agent, but I've designed it, and read and approved every line of it. So if there is something stupid in the codebase, shame on me only. I'm the responsible adult here, though no guarantees or anything, it's still open source.

## Configuration

Projects uses own directory with config and optional history records. You are not required to create anything manually, just open interactive wizard or run `init` command.

Default config format is JSON5, to allow you to leave comments, but regular `.json` is supported, if you prefer it.

`.project-doctor/config.json5`:

```json5
{
  // Project type is a top-level preset of what checks are enabled.
  // For now must be either "js" or "generic"
  projectType: "js",

  // control checks individually, with configuration in eslint style
  checks: {
    // value can be one of these:
    //    "off"
    //    "error"
    //    ["error", { options: "when relevant for check" }]
    //    "mute"
    //    "mute-until-2025-06-01"
    "changelog-exists": "off"
    },

  // control whole tags
  // these can be:
  //    types of importance: required, recommended, opinionated, etc
  //    groups named after tools or subtools: eslint, gitignore, prettier, etc.
  //    other custom tags
  tags: {
    // accept same values as individual checks
    "opinionated": "off"
  },
}
```

## Contributing

All contributions are welcome! But please, do not open Merge Request until you create an issue and I approve it for certain problem or feature. Sadly, in the age of slop contributions, silent Merge Requests will be closed. No Elaboration — no Consideration! ☝️🥸

## History

Project Doctor can save the snapshot of current state of project. This can be helpful to track your progress over time. History file is stored in `.project-doctor` folder, and intended to be tracked by git just as regular file. You can view the history and create snapshots either via wizard, or via `history` and `snapshot` cli commands accordingly.

<image of history screen>

## CLI Commands

This is designed not for daily usage, but for scripting and AI agents. Classic CLI interface is fine and fully functional, just considered secondary interface, while main interface is human-oriented wizard.

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
project-doctor fix all [options] [path] # Fix all issues that have simple auto fixes
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

### Manual Checks

Manual checks require human verification and can't be auto-detected.

```sh
project-doctor manual [options] [path]              # List manual checks
project-doctor manual done <name> [path]            # Mark as done
project-doctor manual undone <name> [path]          # Mark as not done
project-doctor manual info <name> [options] [path]  # Show check details

# List options:
  --status <status>       Filter: all, done, not-done, muted, disabled
  --format <format>       Output: table, json, names

# Info options:
  --format <format>       Output: text, json
```

### Other Commands

```sh
project-doctor init [path]       # Create config file
project-doctor snapshot [path]   # Save current status
project-doctor history [path]    # View progress over time
```
