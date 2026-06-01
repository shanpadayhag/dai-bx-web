# Tasks — Import a group from JSON

**Status:** Locked
**Last updated:** 2026-06-01
**Based on:** requirements.md, design.md

## Ordering Strategy
Bottom-up (foundation first): the pure parse/build core is the riskiest part and everything depends on it, so it goes first; UI wiring lands last. Each task ships with its colocated Vitest coverage.

## First Demoable Milestone
T6 — pick a JSON file and watch a group appear (trigger + dialog wired to the context action). Strictly, the on-screen trigger lands at T8, but T6 is the first point the end-to-end import path is exercisable (via the context action in tests / console).

## Task List

### T1: Import types
**Status:** Done
**Description:** Add `src/features/import/types.ts` with `ImportedGroup`, `ImportedTask`, and the `ParseResult` discriminated union, plus the `ImportResult` type used by the context action. No logic, just the parse-layer shapes.
**Acceptance:**
- Types compile under strict mode; no `any`.
- `ParseResult` = `{ ok: true; group: ImportedGroup } | { ok: false; error: string }`.
- `ImportResult` = `{ ok: true; groupName: string; taskCount: number } | { ok: false; error: string }`.
**Depends on:** none
**MVP:** yes

### T2: Pure parser/validator
**Status:** Done
**Description:** `src/features/import/parse.ts` — `parseGroupJson(text)`. Handles `JSON.parse` failure, non-object root, missing/empty `name`, `tasks` not an array, and recursive task validation reporting a specific path on first failure. Ignores unknown fields.
**Acceptance:**
- Not-JSON → `{ ok: false, error }` with a parse message.
- Missing/blank group `name` → specific error.
- `tasks` not an array → specific error.
- A nested task missing `name` → error names the position/path (e.g. "Task at position 3 is missing a name").
- Empty `tasks` array → `{ ok: true }` (valid).
- Extra/unknown fields ignored.
- Colocated `parse.test.ts` covers every branch above.
**Depends on:** T1
**MVP:** yes

### T3: Pure builder
**Status:** Done
**Description:** `src/features/import/build.ts` — `buildGroupAndTree(imported)`. Generates `uid()`s, assigns sibling `order` indices, applies all runtime defaults (`isOpen: true`, `hiddenUntil: null`, etc.), recursing through subtasks.
**Acceptance:**
- Returns a `Group` (`isOpen: true`, `isHidden: false`) and a `Task[]` tree.
- Every task/subtask has a unique id, correct sibling-relative `order`, and defaulted runtime fields.
- Nesting preserved to arbitrary depth.
- Colocated `build.test.ts` (ids unique, order correct, defaults applied, deep nesting).
**Depends on:** T1
**MVP:** yes

### T4: Groups store `importGroup`
**Status:** Done
**Description:** Add `importGroup(group: Group): Promise<void>` to the groups store — sets `order = state.groups.length`, pushes into state, `repo.putGroup`. Extend the store interface.
**Acceptance:**
- New group appended to `state.groups` with correct `order`.
- Persisted via `putGroup`.
- Colocated store test asserts state + a mocked repo write.
**Depends on:** T3
**MVP:** yes

### T5: Tasks store `importTree`
**Status:** Done
**Description:** Add `importTree(groupId, tree): Promise<void>` to the tasks store — `setState('byGroup', groupId, tree)` then `putTaskRowBatch(flattenTasks(unwrap(tree), groupId, null))`. Extend the interface.
**Acceptance:**
- `byGroup[groupId]` holds the tree after the call.
- Persists flattened rows; values are `unwrap`-ed before the repo write (proxy-safe).
- Colocated store test asserts state + batched rows.
**Depends on:** T3
**MVP:** yes

### T6: Workspace context `importGroup` action
**Status:** Done
**Description:** Add `importGroup(text): Promise<ImportResult>` to `workspaceContext` — parse → (on fail) return error; (on ok) build, `await tasks.importTree`, `await groups.importGroup`, return `{ ok, groupName, taskCount }`. `taskCount` = total nodes.
**Acceptance:**
- Invalid text → `{ ok: false, error }`, nothing created in either store.
- Valid text → group + tree in both stores; returns correct name and total task count.
- Colocated context test for both paths.
**Depends on:** T2, T4, T5
**MVP:** yes

### T7: ImportGroupDialog
**Status:** Done
**Description:** `src/features/workspace/ImportGroupDialog.tsx` — native `<dialog>` like `ManageGroupsModal`. File input (`accept=".json,application/json"`); on selection reads text, calls `ws.importGroup`; renders inline error on failure (stays open), success line + auto-close (~1s) on success. Resets on open/close.
**Acceptance:**
- Bad file → inline error shown, dialog stays open, retry possible.
- Good file → "Imported '<name>' with <N> tasks", auto-closes.
- Backdrop click / ESC close it; state resets.
- Colocated `ImportGroupDialog.test.tsx` (success, failure, reset).
**Depends on:** T6
**MVP:** yes

### T8: Trigger + page wiring
**Status:** Done
**Description:** Add the `Upload` icon-button beside "New" in `GroupCreateInput` (via a callback prop) and mount `ImportGroupDialog` in `WorkspacePage` with a local `importOpen` signal (mirroring `manageOpen`).
**Acceptance:**
- Icon-button with a11y label "Import group from JSON" opens the dialog.
- Imported group appears at the bottom of the list, expanded.
- Existing `GroupCreateInput` / `WorkspacePage` tests still green; new interaction covered.
**Depends on:** T7
**MVP:** yes

## MVP Scope
- **MVP:** T1, T2, T3, T4, T5, T6, T7, T8 (all — minimal feature, nothing to cut).
- **Deferred:** none.

## Non-Functional Tasks
- Tests are colocated per task (not separate tasks).
- Exit gate after T8: `npm run typecheck` + full Vitest run green.

## Open Questions
- None outstanding.

## Changelog
