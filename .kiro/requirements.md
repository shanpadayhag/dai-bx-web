# Requirements — Import a group from JSON

**Status:** Locked
**Last updated:** 2026-06-01

## Problem & User
Building a group's task tree by hand, one task at a time, is tedious. The user wants to have Claude generate a JSON file describing a group and its tasks, then import that file to create the whole group and its task tree in one action instead of manual entry.

## Success Criteria
- A user can select a Claude-authored `.json` file and, on success, see a new group appended to the bottom of the workspace, expanded, with its full task tree present.
- A brief confirmation reports what was imported (e.g. "Imported 'Errands' with 12 tasks").
- A malformed or wrong-shape file never creates anything and instead shows a clear, specific error the user can act on.

## Functional Requirements

### Entry point
- The system shall present an "Import group" control near the existing "Create group" input on the workspace page.
- When the user activates "Import group", the system shall open a dialog offering a `.json` file picker.

### Input & parsing
- When the user selects a file, the system shall read and parse it as JSON.
- The system shall accept a file describing exactly one group: a group `name` plus a nested tree of tasks, where each task has a `name` and an optional list of child tasks (to arbitrary depth).
- The system shall generate or default all other fields (ids, order, isOpen, hiddenUntil, completedDate, alarm, timerSets, activeTimerSetId) rather than reading them from the file.

### Validation
- If the file is not valid JSON, then the system shall reject the import and show an inline error in the dialog.
- If the JSON does not match the expected shape (e.g. missing group `name`, `tasks` is not an array, a task missing its `name`), then the system shall reject the import and show an inline error naming what is wrong (e.g. "Task at position 3 is missing a name").
- The system shall treat import as atomic: on any validation failure, nothing is created (no partial import).
- Where the file is well-formed but the group has zero tasks, the system shall create an empty group (not an error).

### Creating the group
- When a file passes validation, the system shall create a new group from it and never merge into or overwrite an existing group.
- Where the imported group's name matches an existing group, the system shall still create a new group with that name (no warning, rename, or merge), consistent with manual "Create group".
- The system shall append the new group to the bottom of the group list and persist it (and its tasks) to IndexedDB.

### Success feedback
- When an import succeeds, the system shall close the dialog automatically.
- When an import succeeds, the system shall show the new group expanded so its imported tasks are visible.
- When an import succeeds, the system shall show a brief confirmation message reporting the group name and task count.

## Out of Scope (v1)
- Exporting a group to JSON (import only).
- More than one group per file.
- Importing into, or merging with, an existing group.
- Editing the JSON inside the app before import (fix in an external editor and re-upload).
- Importing runtime state: alarms, timers, completion status, hidden-until. Names and structure only.

## Constraints
- Client-only: parsing and persistence happen in the browser against IndexedDB; no network/backend.
- Arbitrary task nesting depth and reasonable file sizes are supported.
- SolidJS + TypeScript strict, Tailwind, accessible dialog; colocated Vitest coverage for parse/validation and the component.

## Open Questions
- Exact JSON schema field naming (e.g. `name` vs `title` for tasks; top-level `group` wrapper vs flat) — to be settled in design, since the user controls the format via Claude.

## Changelog
