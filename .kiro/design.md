# Design — Import a group from JSON

**Status:** Locked
**Last updated:** 2026-06-01
**Based on:** requirements.md (locked 2026-06-01)

## Architecture Overview

A user picks a `.json` file in a dialog. The raw text is parsed and validated by a **pure** module (no Solid, no DB). On success it produces a domain `Group` plus a `Task[]` tree (ids, order, and runtime defaults generated). The workspace context orchestrates an atomic create: it asks the tasks store to persist the tree and the groups store to persist the group, each store keeping ownership of its own IndexedDB write (preserving the `unwrap()` safeguard). The new group appends to the bottom, expanded; the dialog shows a brief confirmation and auto-closes.

```
ImportGroupDialog (file pick)
        │ text
        ▼
parse.ts  ──fail──▶ inline error in dialog (nothing created)
        │ ok: ImportedGroup
        ▼
build.ts → { Group, Task[] }
        │
        ▼
context.importGroup ──▶ tasks.importTree(gid, tree)  → setState + putTaskRowBatch(unwrap)
                   └──▶ groups.importGroup(group)     → setState + putGroup
        │
        ▼
group appears (bottom, expanded) + "Imported 'X' with N tasks" → auto-close
```

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Project standard; no `any`. |
| UI | SolidJS + native `<dialog>` | Matches `ManageGroupsModal`; free focus-trap/ESC/inert backdrop. |
| Styling | Tailwind | Project standard. |
| Persistence | IndexedDB via existing repos | Reuse `putGroup` / `putTaskRowBatch`; client-only, no backend. |
| Tests | Vitest + @solidjs/testing-library | Colocated `.test.ts(x)`. |

## Data Model

No new persisted entities. Two transient parse-layer types plus reuse of existing `Group` / `Task`.

### Entity: `ImportedGroup` (transient, parse layer)
- **Fields:** `name: string`, `tasks: ImportedTask[]`
- **Lifecycle:** Created by `parse.ts` from file text; consumed by `build.ts`; never persisted.

### Entity: `ImportedTask` (transient, parse layer)
- **Fields:** `name: string`, `tasks: ImportedTask[]` (defaulted to `[]` when absent)
- **Relationships:** Recursive, arbitrary depth.

### JSON schema (authored by Claude)
```json
{
  "name": "Errands",
  "tasks": [
    { "name": "Buy groceries", "tasks": [{ "name": "Milk" }, { "name": "Eggs" }] },
    { "name": "Call the bank" }
  ]
}
```
- Root: object with `name` (non-empty string, required) and `tasks` (array, required, may be empty).
- Task: `name` (non-empty string, required), `tasks` (array, optional → `[]`).
- Unknown/extra fields are ignored (forward-compatible).

### Mapping to domain (`build.ts`)
- `Group`: `{ id: uid(), name, order: <assigned by store on insert>, isOpen: true, isHidden: false }`.
- `Task` (each node): `{ id: uid(), name, order: <index among siblings>, hiddenUntil: null, completedDate: null, isOpen: true, alarm: null, timerSets: [], activeTimerSetId: null, tasks: [...] }`.

## Key Interfaces

### `src/features/import/parse.ts`
- `parseGroupJson(text: string): ParseResult`
- `type ParseResult = { ok: true; group: ImportedGroup } | { ok: false; error: string }`
- Pure. Catches `JSON.parse` errors and shape errors, returning a specific human-readable `error` (e.g. `"Task at position 3 is missing a name"`). Walks nested tasks, reporting a path on the first failure.

### `src/features/import/build.ts`
- `buildGroupAndTree(imported: ImportedGroup): { group: Group; tree: Task[] }`
- Pure. Generates ids via `uid()`, assigns `order` per sibling index, applies runtime defaults. `group.order` is left at `0`/placeholder and finalised by the groups store on insert (store owns append position).

### Groups store — new method
- `importGroup(group: Group): Promise<void>` — set `order = state.groups.length`, push into `state.groups`, `repo.putGroup`. (Mirrors `create`, but takes a pre-built group instead of a name.)

### Tasks store — new method
- `importTree(groupId: string, tree: Task[]): Promise<void>` — `setState('byGroup', groupId, tree)`, then `repo.putTaskRowBatch(flattenTasks(unwrap(tree), groupId, null))`.

### Workspace context — new action
- `importGroup(text: string): Promise<ImportResult>` where `type ImportResult = { ok: true; groupName: string; taskCount: number } | { ok: false; error: string }`.
- Flow: `parseGroupJson` → on fail return error; on ok `buildGroupAndTree`, `await tasks.importTree(group.id, tree)`, `await groups.importGroup(group)`, return `{ ok, groupName, taskCount }`. `taskCount` counts all nodes in the tree (via `flattenTasks` length or a small recursive count).

### UI Components
- `ImportGroupTrigger` — icon-button (`Upload`) beside "New" in `GroupCreateInput`; a11y label "Import group from JSON"; opens the dialog. (Likely just markup added to `GroupCreateInput` + a callback prop, rather than a standalone file, to keep the row layout cohesive.)
- `ImportGroupDialog` — native `<dialog>` like `ManageGroupsModal`. Holds a file input (`accept=".json,application/json"`). On file selection: read text, call `ws.importGroup(text)`; on `ok:false` render the inline error and stay open; on `ok:true` render "Imported '<name>' with <N> tasks" and auto-close after ~1s. Resets state on open/close.

## State & Data Flow

- Parse/build are synchronous and pure; nothing touches state until validation passes (atomicity at the validation boundary).
- The two store writes update in-memory state synchronously and persist optimistically (await the promises but tolerate swallowed repo errors, consistent with the app).
- The new group renders via the existing `visibleGroups()` `<For>`; `isOpen: true` makes it expanded. No new global state; dialog open/close is local signal state in the workspace page (mirroring `manageOpen`).

## External Dependencies

| Service / Library | Used for | Failure mode |
|---|---|---|
| `crypto.randomUUID()` (`~/lib/ids`) | Generating ids | Available in evergreen browsers + jsdom; no fallback needed. |
| `idb` via existing repos | Persistence | Repos swallow errors; worst case the in-memory import shows but a write is lost (same as every other action). |
| `FileReader` / `File.text()` | Reading the chosen file | If the read throws, treat as a parse failure and show the inline error. |

## Auth & Authorization
N/A — client-only, single-user local app.

## Open Questions / Risks
- **Parser is the main risk** (untrusted Claude-authored input, requirement for *specific* error messages). De-risk with thorough unit tests: not-JSON, non-object root, missing/empty `name`, `tasks` not an array, a nested task missing `name` (path reported), extra fields ignored, empty-`tasks` happy path, deep nesting.
- **`taskCount` semantics** — counts every node (tasks + subtasks), not just top-level. Confirmed by "Imported 'Errands' with 12 tasks" wording.
- **Very large files** — no explicit size cap in v1; arbitrary depth/size "supported" per requirements. If this ever bites, a guard can be added later (noted, not built).

## Changelog
