# Design: Multi-Screen CLI Framework

## Vision

A CLI that feels like an app - fast, intuitive, and pleasant to use. Users should never feel stuck, always know what's happening, and trust the tool's recommendations.

**Philosophy:**
- CLI is a conversation, not a command
- Every screen tells a story
- Every option explains itself
- Escape routes are always available

---

## Core Concepts

### Screens

A **Screen** is a discrete UI state that shows information and offers options.

```typescript
type Screen<TContext = unknown> = {
  id: string;
  render: (ctx: TContext) => void;
  getOptions: (ctx: TContext) => ScreenOption[];
  onEnter?: (ctx: TContext) => Promise<void>;
  onExit?: (ctx: TContext) => Promise<void>;
};
```

### Screen Options

Options are what users can do on a screen:

```typescript
type ScreenOption = ActionOption | NavigationOption;

// Does something, stays on same screen or auto-advances
type ActionOption = {
  type: "action";
  value: string;
  label: string;
  description?: string;
  run: (ctx: TContext) => Promise<ActionResult>;
};

// Opens another screen
type NavigationOption = {
  type: "navigation";
  value: string;
  label: string;
  targetScreen: string;
  badge?: string;  // e.g., "3 issues"
};
```

### Screen Hierarchy

Screens form a tree. Navigation creates a stack (like browser history).

```
HomeScreen
├── IssuesScreen
│   ├── IssueDetailScreen
│   └── WhyScreen
├── ScanningScreen
└── SummaryScreen
```

---

## Navigation

### Always Available

| Input | Action |
|-------|--------|
| `ESC` | Go back (pop screen stack) |
| `Ctrl+C` | Graceful exit with summary |
| `↑/↓` | Navigate options |
| `Enter` | Select option |

### Back Button

Every screen (except root) shows "← Back" as last option. ESC or selecting Back returns to parent.

---

## UX Principles

### 1. Never Leave User Stuck

- ESC always works (except at root)
- Ctrl+C always exits gracefully
- Long operations show progress
- Errors show what to do next

### 2. Progressive Disclosure

- Show summary first, details on demand
- "Why?" is always available but not forced
- Advanced options hidden until needed

### 3. Trust Building

1. **Explain, don't dictate**: "This is recommended because..." not "You must do this"
2. **Show impact**: Preview changes before applying
3. **Allow escape**: Mute, disable, or configure any check
4. **Be honest**: If uncertain, say so

### 4. Speed & Responsiveness

- Screens render instantly
- Async operations show spinners
- Keyboard-first navigation

---

## File Structure

```
src/cli-framework/
├── types.ts      # Core types
├── app.ts        # App class, navigation, lifecycle
├── renderer.ts   # Console output helpers
└── index.ts      # Public exports

src/app/
├── types.ts      # AppContext, FixableIssue types
├── loader.ts     # Scans project, creates context
├── index.ts      # Main app entry
└── screens/      # Individual screens
    ├── home.ts
    ├── issues.ts
    ├── issue-detail.ts
    ├── why.ts
    ├── summary.ts
    └── scanning.ts
```

---

## Implementation Notes

### Dependencies

- `@inquirer/prompts` - Base select/input prompts
- `@inquirer/core` - For error handling (CancelPromptError)
- ANSI codes for colors (no external library)

### Screen Lifecycle

```
onEnter() → render() → getOptions() → [user selects] →
  if action: run() → re-render or navigate
  if navigation: push screen → new screen's onEnter()
  if back: onExit() → pop stack → parent's render()
```

---

## Future Considerations

- Config screen (edit checks/tags/groups in app)
- Deps screen (outdated dependencies)
- Keyboard shortcut hints
- Separate npm package for framework
