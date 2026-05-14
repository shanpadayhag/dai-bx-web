# Implementation Plan: fix drag after add task

<!-- Status: in progress — 1.1, 1.2, 2.1, 2.2 complete; 3.1 awaiting manual smoke by user -->
<!-- Bugfix: see .kiro/specs/fix-drag-after-add-task/bugfix.md -->
<!-- Design: see .kiro/specs/fix-drag-after-add-task/design.md -->

Two surgical code changes plus their tests. Tasks 1.x and 2.x are
independent of each other and can be done in either order. Task 3 is the
manual smoke test that ties them together.

## 1. Fix the new-task `order` assignment

- [x] 1.1 Replace `order: length` with `max(order) + 1` in `TasksState`
  - Files: `src/app/features/tasks/data-access/tasks.state.ts`
  - Acceptance:
    - Add a private `nextOrder(siblings: readonly { order: number }[]): number`
      helper on `TasksState` that returns `0` for an empty list and
      `max(order) + 1` otherwise, using a single-pass loop.
    - `addRoot` uses `this.nextOrder(tree)` in place of `tree.length`.
    - `addSubtask` uses `this.nextOrder(parent.task.tasks)` in place of
      `parent.task.tasks.length`.
    - No other code paths changed in this file.
    - `npm run lint` clean. `npm run build` clean.
  - _Addresses: bugfix.md causes (2), (3); design.md Change 1_

- [x] 1.2 Unit tests for the new order assignment
  - Depends on: 1.1
  - Files: `src/app/features/tasks/data-access/tasks.state.spec.ts`
  - Acceptance:
    - New `describe('order assignment for new tasks', …)` block.
    - `addSubtask` test: parent with subtasks at orders `[0, 1, 2]` →
      new task gets `order === 3`.
    - `addSubtask` test: parent hydrated from rows with orders `[0, 1, 4]`
      (sparse, as if order 2 and 3 had been deleted) → new task gets
      `order === 5`.
    - `addSubtask` test: parent with zero subtasks → new task gets
      `order === 0`.
    - `addRoot` test: group with root tasks at orders `[0, 1, 2]` →
      new task gets `order === 3`.
    - `addRoot` test: group hydrated with sparse root orders `[0, 1, 4]`
      → new task gets `order === 5`.
    - `addRoot` test: empty group → new task gets `order === 0`.
    - All tests pass via `npm run test`.
  - _Addresses: bugfix.md expected behavior bullet (1)_

## 2. Fix the visible-index → absolute-index translation in `group-item`

- [x] 2.1 Translate visible drag index to absolute array index in `onTaskDrop`
  - Files: `src/app/features/workspace/ui/group-item/group-item.component.ts`
  - Acceptance:
    - `onTaskDrop` reads `this.state.tasksFor(this.group().id)`, walks
      the array once to collect indices of `isVisibleToday(task)` rows
      into a local `visibleAbsIndices: number[]`, then maps
      `event.previousIndex` and `event.currentIndex` through that array
      before calling `this.state.reorderTasks(...)`.
    - Returns early without calling `reorderTasks` if either translated
      index is `undefined`.
    - Existing `previousIndex === currentIndex` short-circuit is
      preserved.
    - `isVisibleToday` is already imported; no new imports beyond what
      already exists at the top of the file.
    - `npm run lint` clean. `npm run build` clean.
  - _Addresses: bugfix.md cause (4); design.md Change 2_

- [x] 2.2 New component spec for `GroupItemComponent.onTaskDrop`
  - Depends on: 2.1
  - Files: `src/app/features/workspace/ui/group-item/group-item.component.spec.ts` (new)
  - Acceptance:
    - TestBed setup with `provideZonelessChangeDetection()` and a stub
      `WorkspaceState` whose `tasksFor` returns a configurable array and
      whose `reorderTasks` is a Jasmine spy.
    - Test: all-visible list `[A, B, C]`, drop `{previousIndex: 2,
      currentIndex: 0}` → `reorderTasks` called with `(groupId, null,
      2, 0)` (translation is no-op).
    - Test: list with hidden task in the middle
      `[A(visible), B(hiddenUntil=tomorrow), C(visible)]`; CDK reports
      drop `{previousIndex: 1, currentIndex: 0}` (dragging C above A in
      the rendered list) → `reorderTasks` called with `(groupId, null,
      2, 0)`.
    - Test: list with hidden task at the start
      `[A(hidden), B(visible), C(visible)]`; CDK reports drop
      `{previousIndex: 1, currentIndex: 0}` → `reorderTasks` called with
      `(groupId, null, 2, 1)`.
    - Test: empty list (`tasksFor` returns `[]`); drop
      `{previousIndex: 0, currentIndex: 1}` → `reorderTasks` is *not*
      called.
    - Test: `previousIndex === currentIndex` → `reorderTasks` is *not*
      called (regression guard for the existing short-circuit).
    - All tests pass via `npm run test`.
  - _Addresses: design.md Testing section, component-spec cases_

## 3. Manual smoke verification

- [ ] 3.1 Manually reproduce both pre-fix scenarios and confirm they pass
  - Depends on: 1.1, 1.2, 2.1, 2.2
  - Files: none (manual)
  - Acceptance:
    - Run `npm start`, open the app in a browser.
    - **Subtask scenario:** Create a parent task with at least 5
      subtasks. Delete the subtasks at the 3rd and 4th positions. Add a
      new subtask "X". Verify "X" appears at the **end** of the subtask
      list, not in the middle. Drag "X" to the top **on the first
      attempt**. Verify "X" moved to the top (not some other row).
    - **Hidden-task scenario:** In a group with at least 3 root tasks,
      hide one of the middle tasks "until tomorrow" via the existing
      hide affordance. Drag the visible task that follows the hidden
      one to the top of the list. Verify the **correct** visible task
      moved (not the hidden one and not the wrong sibling).
    - **Regression check:** Drag-and-drop of groups still works. Drag
      a subtask in a parent whose orders are dense. Both behave as
      before.
  - _Addresses: bugfix.md expected behavior bullets (1), (2), (3)_

## Notes

- No DB migration. Sparse-order rows already in IndexedDB stay sparse
  until the user's next add (which now correctly appends past the
  sparse max) or next successful drag (which re-densifies via the
  existing `reindexOrder` in `reorderTasksByParent`).
- The bundle delta is a few bytes (one helper + one inline loop).
  No need to run `ng build --stats-json` for this fix unless CI
  surfaces a budget violation.
- Commit suggestion: one commit per major-numbered section (1, 2) so
  each can be reviewed and reverted independently. Task 3 is verification,
  not a commit.
