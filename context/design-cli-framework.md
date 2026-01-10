# Design: Multi-Screen CLI Framework

## Vision

Build a CLI that feels like an app - fast, intuitive, and pleasant to use. Users should never feel stuck, always know what's happening, and trust the tool's recommendations.

**Philosophy:**
- CLI is a conversation, not a command
- Every screen tells a story
- Every option explains itself
- Escape routes are always available
- Predict confusion, address it proactively

---

## Core Concepts

### 1. Screens

A **Screen** is a discrete UI state that shows information and offers options.

```typescript
type Screen<TContext = unknown> = {
  id: string;

  // What to show the user
  render: (ctx: TContext) => void;

  // Available actions (can be dynamic based on context)
  getOptions: (ctx: TContext) => ScreenOption[];

  // Optional: run before showing screen
  onEnter?: (ctx: TContext) => Promise<void>;

  // Optional: run when leaving screen
  onExit?: (ctx: TContext) => Promise<void>;
};
```

### 2. Screen Options

Options are what users can do on a screen. Two types:

```typescript
type ScreenOption = ActionOption | NavigationOption;

// Does something, stays on same screen or auto-advances
type ActionOption = {
  type: "action";
  value: string;
  label: string;
  description?: string;      // Shown in menu
  why?: string;              // Detailed explanation (shown on demand)
  hint?: string;             // Keyboard shortcut hint
  disabled?: boolean;        // Greyed out with reason
  disabledReason?: string;
  run: (ctx: TContext) => Promise<ActionResult>;
};

// Opens another screen
type NavigationOption = {
  type: "navigation";
  value: string;
  label: string;
  description?: string;
  targetScreen: string;      // Screen ID to navigate to
  badge?: string;            // e.g., "3 issues" or "NEW"
};

type ActionResult = {
  success: boolean;
  message: string;
  nextScreen?: string;       // Optional: navigate after action
  updateContext?: Partial<TContext>;
};
```

### 3. Screen Hierarchy

Screens form a tree. Navigation creates a stack (like browser history).

```
HomeScreen
├── CheckResultsScreen
│   ├── CheckDetailScreen (for each failed check)
│   │   └── FixOptionsScreen
│   └── FixAllScreen
├── ConfigScreen
│   ├── EnableDisableChecksScreen
│   └── SeverityScreen
└── HelpScreen
```

### 4. App State

```typescript
type AppState<TContext> = {
  // Navigation
  screenStack: string[];     // Stack of screen IDs
  currentScreen: string;

  // Shared context (checks, results, config, etc.)
  context: TContext;

  // UI state
  selectedIndex: number;     // Currently highlighted option

  // Exit handling
  exitRequested: boolean;
  exitCode: number;
};
```

---

## Navigation Model

### Always Available

| Input | Action | Behavior |
|-------|--------|----------|
| `ESC` | Go back | Pop screen stack, return to parent |
| `Ctrl+C` | Exit | Graceful exit, show summary if applicable |
| `↑/↓` | Navigate | Move selection in current screen |
| `Enter` | Select | Execute selected option |
| `?` | Help | Show contextual help for current screen |

### Back Button

Every screen (except root) shows "← Back" as last option. Pressing ESC or selecting Back returns to parent screen.

```typescript
// Automatically added by framework
const backOption: NavigationOption = {
  type: "navigation",
  value: "__back__",
  label: "← Back",
  description: "Return to previous screen",
  targetScreen: "__parent__",
};
```

### Exit Handling

```typescript
// Ctrl+C triggers graceful exit
app.onExit = async (state) => {
  if (state.context.hasUnsavedChanges) {
    // Could prompt "Save before exit?" but keep it simple for now
    console.log("\n  Changes not saved.\n");
  }

  // Show summary
  if (state.context.fixedCount > 0) {
    console.log(`  ✓ ${state.context.fixedCount} issues fixed this session`);
  }

  console.log("\n  Goodbye!\n");
};
```

---

## Screen Examples for Project Doctor

### 1. Home Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   project-doctor                        │
│   Health check for Node.js projects     │
│                                         │
│   Project: my-app                       │
│   Status: 3 issues found                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ❯ View issues (3)                     │
│     Fix all issues                      │
│     Run checks again                    │
│     Configure                           │
│     Help                                │
│     Exit                                │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Issues Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   Issues (3)                            │
│                                         │
│   Required:                             │
│   ✗ gitignore-exists                    │
│     .gitignore not found                │
│                                         │
│   Recommended:                          │
│   ✗ readme-has-install-section          │
│     Missing installation instructions   │
│                                         │
│   ✗ license-exists                      │
│     No LICENSE file                     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ❯ Fix: gitignore-exists (easy)        │
│     Fix: readme-has-install-section     │
│     Fix: license-exists (easy)          │
│     ─────────────────────               │
│     Fix all (3 issues)                  │
│     ← Back                              │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Single Issue Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   ✗ gitignore-exists                    │
│   .gitignore not found                  │
│                                         │
│   Tags: universal, required, effort:low │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ❯ Apply fix                           │
│       Create .gitignore with defaults   │
│                                         │
│     Why is this important?              │
│       Learn why this check matters      │
│                                         │
│     Skip for now                        │
│     Disable this check                  │
│     ← Back                              │
│                                         │
└─────────────────────────────────────────┘
```

### 4. "Why" Detail Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   Why: gitignore-exists                 │
│                                         │
│   A .gitignore file tells Git which     │
│   files to exclude from version         │
│   control. Without it, you risk         │
│   committing:                           │
│                                         │
│   • Build artifacts (dist/, build/)     │
│   • Dependencies (node_modules/)        │
│   • Secrets (.env files)                │
│   • IDE files (.vscode/, .idea/)        │
│                                         │
│   This is marked "required" because     │
│   committing these files causes:        │
│                                         │
│   • Repository bloat                    │
│   • Security vulnerabilities            │
│   • Merge conflicts                     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ❯ Got it, fix this issue              │
│     ← Back to issue                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## UX Principles

### 1. Never Leave User Stuck

- ESC always works (except at root, where it does nothing)
- Ctrl+C always exits gracefully
- Long operations show progress and can be cancelled
- Errors show what to do next

### 2. Progressive Disclosure

- Show summary first, details on demand
- "Why?" is always available but not forced
- Advanced options hidden until needed

### 3. Trust Building

Users don't trust new tools. Build trust by:

1. **Explain, don't dictate**: "This is recommended because..." not "You must do this"
2. **Show impact**: "This will create .gitignore with these patterns:"
3. **Allow escape**: Skip, disable, or configure any check
4. **Be honest**: If we're unsure, say so

### 4. Predictive UX

Anticipate user questions and answer them before asked:

| User Thought | Our Response |
|--------------|--------------|
| "Why is this failing?" | Show clear error message |
| "Why do I care?" | "Why?" option with explanation |
| "Will this break something?" | Show preview of changes |
| "What if I disagree?" | Disable option available |
| "Can I undo this?" | "This created .gitignore. Delete to revert." |

### 5. Speed & Responsiveness

- Screens render instantly
- Async operations show spinners
- No unnecessary delays or animations
- Keyboard-first (mouse optional)

---

## Framework API

### Creating an App

```typescript
import { createApp, Screen } from "./cli-framework";

type MyContext = {
  projectPath: string;
  issues: Issue[];
  fixedCount: number;
};

const homeScreen: Screen<MyContext> = {
  id: "home",
  render: (ctx) => {
    console.log("  project-doctor\n");
    console.log(`  Project: ${ctx.projectPath}`);
    console.log(`  Issues: ${ctx.issues.length}\n`);
  },
  getOptions: (ctx) => [
    {
      type: "navigation",
      value: "issues",
      label: `View issues (${ctx.issues.length})`,
      targetScreen: "issues",
      badge: ctx.issues.length > 0 ? `${ctx.issues.length}` : undefined,
    },
    {
      type: "action",
      value: "exit",
      label: "Exit",
      run: async () => ({ success: true, message: "" }),
    },
  ],
};

const app = createApp({
  initialScreen: "home",
  screens: [homeScreen, issuesScreen, ...],
  context: { projectPath: ".", issues: [], fixedCount: 0 },
  onExit: async (ctx) => {
    if (ctx.fixedCount > 0) {
      console.log(`\n  ✓ Fixed ${ctx.fixedCount} issues\n`);
    }
  },
});

await app.run();
```

### Screen Lifecycle

```
onEnter() → render() → getOptions() → [user selects] →
  if action: run() → re-render or navigate
  if navigation: push screen → new screen's onEnter()
  if back: onExit() → pop stack → parent's render()
```

---

## Implementation Status

### Phase 1: Core Framework - DONE
- [x] Screen types and interfaces (`src/cli-framework/types.ts`)
- [x] Navigation stack management (`src/cli-framework/app.ts`)
- [x] Input handling (arrows, enter, esc, ctrl+c)
- [x] Option rendering with descriptions
- [x] Back button injection
- [x] Renderer utilities (`src/cli-framework/renderer.ts`)

### Phase 2: Project Doctor Screens - DONE
- [x] Home screen (`src/app/screens/home.ts`)
- [x] Issues list screen (`src/app/screens/issues.ts`)
- [x] Single issue detail screen (`src/app/screens/issue-detail.ts`)
- [x] Why explanation screen (`src/app/screens/why.ts`)
- [x] Session summary screen (`src/app/screens/summary.ts`)
- [x] Scanning screen (`src/app/screens/scanning.ts`)

### Phase 3: Polish - IN PROGRESS
- [x] Loading states during scan
- [x] Error handling and display
- [ ] Keyboard shortcut hints
- [ ] Screen transitions

### Phase 4: Future
- [ ] Config screen (edit checks/tags/groups)
- [ ] Deps screen (outdated dependencies)
- [ ] Separate npm package for framework
- [ ] Generic theming

---

## Out of Scope (For Now)

- Mouse support
- Custom themes/colors
- Window resizing
- Multi-select options
- Text input fields (beyond simple prompts)
- Split panes or complex layouts
- Scrolling within screens (keep screens short)

---

## Technical Notes

### Dependencies

- `@inquirer/prompts` - Base select/input prompts
- `@inquirer/core` - For error handling (CancelPromptError)
- `chalk` or ANSI codes - Colors (already using ANSI)

### File Structure

```
src/cli-framework/
├── types.ts          # Core types
├── app.ts            # App class, navigation, lifecycle
├── screen.ts         # Screen base class/helpers
├── input.ts          # Keyboard input handling
├── renderer.ts       # Console output helpers
└── index.ts          # Public exports
```

### Testing Strategy

- Unit test navigation logic (push, pop, back)
- Unit test option filtering and sorting
- Integration test screen flows with mock input
- No snapshot tests (output changes often)

---

## Questions to Resolve

1. **Confirm before destructive actions?**
   - For now: No extra confirmation, but show preview

2. **Remember position when going back?**
   - For now: No, always reset to first option

3. **Persist state across runs?**
   - For now: No, fresh start each time

4. **Support for very long option lists?**
   - For now: Keep lists short, paginate if >10 items
