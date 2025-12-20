# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

projector-doctor is a CLI tool for running health checks on Node.js projects. It provides checks for common project configuration issues, setup helpers for initializing config files, and migration utilities.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm run check        # Run CLI directly with tsx (development)
```

## Architecture

```
src/
├── cli.ts           # CLI entry point with argument parsing
├── registry.ts      # Central registry of all check groups
├── types.ts         # Shared types (Check, CheckResult, etc.)
├── checks/          # Health check modules (one file per domain)
├── setup/           # Setup helpers for initializing config files
├── migrations/      # Migration utilities (e.g., CJS to ESM)
└── utils/           # Shared utilities (fs, process, reporter, runner)
```

### Check System

Each check module in `src/checks/` exports a `checks` array of `Check` objects. Checks are registered in `src/registry.ts` with a group name and category.

A `Check` has:
- `name`: unique identifier
- `description`: what it checks
- `run(projectPath)`: async function returning `CheckResult`

`CheckResult` contains:
- `status`: "pass" | "fail" | "warn" | "skip"
- `message`: human-readable result
- `details`: optional array of additional info

### Adding New Checks

1. Create or edit a file in `src/checks/`
2. Export a `checks` array with your Check objects
3. Register the group in `src/registry.ts`

## Current State

All check implementations are stubs (`throw new Error("Not implemented")`). The project structure and types are complete.
