# Issue Patterns

Recurring code issues found during review. Use as a checklist when adding new code or reviewing PRs.

---

## 1. Magic strings

**Pattern:** Navigation IDs, action values, or behavioral flags as raw string literals scattered across files.

**Fix:** Central const object. One typo = compile error instead of silent runtime bug.

```ts
// bad
return "issue-detail";

// good
import { SCREEN } from "../screen-ids.js";
return SCREEN.issueDetail;
```

**Applies to:** screen IDs, special return values (`__back__`, `__exit__`), ESC behavior modes.

---

## 2. Duplicated inline error handling

**Pattern:** `error instanceof Error ? error.message : "Unknown error"` copy-pasted in every catch block.

**Fix:** Shared `getErrorMessage(error: unknown): string` utility.

---

## 3. Duplicated date formatting

**Pattern:** `date.toISOString().split("T")[0]` in multiple files, sometimes mixed with local-time equivalents.

**Fix:** Single `toDateString(date: Date): string` using UTC consistently. Single `parseISODate(str)` with shared regex.

**Bonus bug:** Mixing `getFullYear()` (local) with `toISOString()` (UTC) produces different dates near midnight.

---

## 4. Duplicated small functions across screens

**Pattern:** Identical logic in multiple screen files (e.g. `moveToNextIssue`, mute/disable action blocks).

**Fix:** Extract to a shared module. For action blocks with minor variations, use a factory function with callbacks.

---

## 5. `console.log("")` instead of `blank()`

**Pattern:** Using `console.log("")` or `console.log()` for blank lines when a `blank()` helper exists.

**Fix:** Import and use `blank()`. Grep for `console.log("")` and `console.log()` (no args) periodically.

---

## 6. Raw `writeFile` instead of `atomicWriteFile`

**Pattern:** Fix functions use `writeFile` from `node:fs/promises` directly. If the process crashes mid-write, the file is corrupted.

**Fix:** Use `atomicWriteFile` from `utils/safe-fs.js` (writes to temp file, then renames).

---

## 7. Direct `readFile` bypassing file cache

**Pattern:** Check `run()` or `fix()` functions reading project files via `readFile()` instead of `global.files.readText()`.

**Fix:** Use the cache for project files. Exceptions: reading bundled assets or files outside the project directory.

---

## 8. Line ending inconsistency

**Pattern:** Some file-modifying fixes hardcode `\n`, others detect and preserve existing line endings.

**Fix:** Use `readFileWithLineEnding()` from `safe-fs.js` when appending to existing files.

---

## 9. Hardcoded `/tmp`

**Pattern:** Test files use `"/tmp/..."` paths directly.

**Fix:** `path.join(os.tmpdir(), "...")` for cross-platform compatibility.

---

## 10. Same interface defined in multiple files

**Pattern:** `PackageJson` (or similar) defined as a different subset in each consumer.

**Fix:** Single superset interface in a shared types file. Consumers import and use it.

---

## 11. Config format not preserved

**Pattern:** Config loader reads JSON5 or JSON but always writes back as one format, orphaning the other.

**Fix:** Track the original format and write back in the same format.

---

## 12. Two separate icon/constant registries

**Pattern:** Same concept (icons, duration constants) defined independently in different files with different encodings or values.

**Fix:** Single source of truth, imported everywhere.

---

## 13. Lookup functions rebuilding data structures on every call

**Pattern:** Functions like `getValidCheckNames()` creating a new `Set` from a full iteration on every invocation.

**Fix:** Lazy-cached module-level variable, built once on first call.

---

## 14. Dead exports still imported

**Pattern:** Module marked for removal but still imported and called elsewhere.

**Fix:** Grep for all imports before deleting. Remove call sites first, then delete the module.
