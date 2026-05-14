# Design: keep drag indices and persisted `order` aligned after add/delete

<!-- Status: draft -->
<!-- Addresses: .kiro/specs/fix-drag-after-add-task/bugfix.md -->

## Approach

Two surgical changes, both small. No schema change, no migration, no API change to consumers outside the touched files.

1. **`TasksState.addRoot` and `TasksState.addSubtask`** assign the new task's
   `order` as `max(existing.order) + 1` (or `0` if there are no siblings),
   instead of `existing.length`. This guarantees the new task is strictly
   greater than every existing sibling's order, so it always sorts to the
   end — even when prior deletions have left non-contiguous orders.

2. **`GroupItemComponent.onTaskDrop`** translates the visible-list index
   (what CDK reports) into the absolute-array index (what `TasksState.reorder`
   needs), mirroring the pattern already used by `GroupsState.reorderVisible`.
   This closes the second, latent variant of the same bug class: drag of any
   root task while a hidden-until-future task sits adjacent to it.

The existing defensive sort in `sortedChildren()` and `visibleTasks()` is
**kept**. Removing it would be more code churn for marginal benefit; keeping
it means the fix degrades gracefully if any future code path violates the
"array sorted by order" invariant.

Subtasks need no index-translation fix because `task-item.component.html`
renders one `<div cdkDrag>` per `sortedChildren()` item with no filtering —
hidden subtasks render their inner template empty but still occupy a CDK
drag slot, so visible-index == array-index for subtasks.

## The fix

### Change 1 — `src/app/features/tasks/data-access/tasks.state.ts`

Replace `order: tree.length` and `order: parent.task.tasks.length` with a
shared helper that computes `max + 1`. One helper, two call sites:

```ts
// inside TasksState (private)
private nextOrder(siblings: readonly { order: number }[]): number {
  let max = -1;
  for (const s of siblings) if (s.order > max) max = s.order;
  return max + 1;
}

addRoot(groupId: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const tree = this.tasksFor(groupId);
  const newTask: Task = {
    id: uid(),
    name: trimmed,
    order: this.nextOrder(tree),   // <-- was: tree.length
    hiddenUntil: null,
    completedDate: null,
    isOpen: true,
    alarm: null,
    timerSets: [],
    activeTimerSetId: null,
    tasks: [],
  };
  this.replaceTree(groupId, [...tree, newTask]);
  void this.repository.put(toTaskRow(newTask, groupId, null));
}

addSubtask(groupId: string, parentTaskId: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const tree = this.tasksFor(groupId);
  const parent = findTaskInTree(tree, parentTaskId);
  if (!parent) return;
  const newTask: Task = {
    id: uid(),
    name: trimmed,
    order: this.nextOrder(parent.task.tasks),   // <-- was: parent.task.tasks.length
    hiddenUntil: null,
    completedDate: null,
    isOpen: true,
    alarm: null,
    timerSets: [],
    activeTimerSetId: null,
    tasks: [],
  };
  this.replaceTree(groupId, insertSubtask(tree, parentTaskId, newTask));
  void this.repository.put(toTaskRow(newTask, groupId, parentTaskId));
}
```

Why a one-pass loop instead of `Math.max(...siblings.map(s => s.order))`:
the spread version creates an intermediate array and call-stack frame per
add; the loop is allocation-free and trivially readable. For lists this
small the perf delta is irrelevant, but the loop has no edge case at
empty input (returns `-1 + 1 = 0`), where `Math.max(...[])` returns
`-Infinity` and needs a guard.

### Change 2 — `src/app/features/workspace/ui/group-item/group-item.component.ts`

Translate visible index → absolute index inside `onTaskDrop`:

```ts
protected onTaskDrop(event: CdkDragDrop<Task[]>): void {
  if (event.previousIndex === event.currentIndex) return;

  const tasks = this.state.tasksFor(this.group().id);
  const visibleAbsIndices: number[] = [];
  for (let i = 0; i < tasks.length; i++) {
    if (isVisibleToday(tasks[i])) visibleAbsIndices.push(i);
  }

  const fromAbs = visibleAbsIndices[event.previousIndex];
  const toAbs = visibleAbsIndices[event.currentIndex];
  if (fromAbs === undefined || toAbs === undefined) return;

  this.state.reorderTasks(this.group().id, null, fromAbs, toAbs);
}
```

The helper is computed inline rather than memoized — it runs only on a
drop event, not on every render, and the cost is linear in the (small)
root task count. Inlining keeps the bug fix self-contained in one method.

(`isVisibleToday` is already imported from
`@features/tasks/data-access/tasks.tree`.)

### Alternatives considered

| Approach | Verdict |
|---|---|
| Make `deleteTaskById` reindex surviving siblings (keep orders dense) | Larger blast radius: `TasksState.remove` would have to compute and persist the reindexed siblings, and the recursive tree shape makes the persistence layer harder to keep consistent. `max + 1` solves the same surface symptom with one helper. Rejected for size. |
| Remove `sortedChildren` / `visibleTasks` sorts; iterate `task.tasks` directly | Would force the "array sorted by order" invariant to be load-bearing — any single regression in a mutation re-introduces the bug silently. The defensive sort is cheap. Rejected. |
| Change `TasksState.reorder` to take task IDs instead of `(fromIndex, toIndex)` | Cleanest conceptually (no index translation anywhere), but ripples through three call sites and the state API. Larger than needed for the reported bug. Rejected for scope. |
| Fix only Change 1; ignore the hidden-task index drift | Would ship a fix that "works" for the reported symptom while leaving an identically-shaped bug latent on the visible-tasks codepath. The bugfix doc explicitly scoped both. Rejected. |

## What is not changing

- **Storage shape.** `Task.order` is still a `number`. Existing IndexedDB rows
  are still valid. No migration required.
- **`TasksState.reorder` signature.** Still takes `(groupId, parentId,
  fromIndex, toIndex)`. The fix is at the *caller* (group-item), not the
  state API.
- **`reorderTasksByParent`** in `tasks.tree.ts`. Continues to consume raw
  array indices and to `reindexOrder` after `moveInArray`. (The
  `reindexOrder` step is what makes the bug self-healing after the first
  bad drag — and what makes the array dense again after every successful
  drag.)
- **Subtask drop handler** in `task-item.component.ts`. Subtasks have no
  visible/filter mismatch, so `onChildrenDrop` is left alone.
- **Group drag-and-drop.** Unaffected; already correct.
- **Defensive sorts** in `sortedChildren()` (task-item) and `visibleTasks()`
  (group-item).

## Behavior at the boundaries

| Scenario | Before fix | After fix |
|---|---|---|
| Parent has dense orders `[0,1,2,3,4]`, user adds 1 subtask | New order = 5, renders at end, drag works | Same — `max+1 = 5`, identical outcome |
| Parent has orders `[0,1,4]` after deletions, user adds 1 subtask | New order = 3, renders at sorted index 2 (middle); first drag moves wrong row | New order = 5, renders at end (sorted index 3); first drag moves the correct row |
| Root list has tasks `[A(visible), B(hidden), C(visible)]`, user drags C above A | CDK reports `prev=1, curr=0`; reorder calls `moveInArray(tasks, 1, 0)` which moves B (the hidden task), not C | Translation maps visible `1→2`, visible `0→0`; reorder calls `moveInArray(tasks, 2, 0)` which moves C as intended |
| Root list with no hidden tasks; user drags within | CDK indices already equal absolute indices; works | Translation is a no-op (`visibleAbsIndices[i] === i`); works |
| Subtask drag | Unchanged (no filter) | Unchanged |
| Group drag | Unchanged | Unchanged |

## Persistence

- **`addRoot` / `addSubtask`** still call `repository.put(toTaskRow(newTask, …))`
  exactly once per new task. The persisted `order` is `max + 1` instead of
  `length`, but the field type and meaning are identical.
- **`reorder`** continues to call `getSiblingsOf` + `repository.putBatch`,
  which (via `reindexOrder` in `reorderTasksByParent`) writes dense
  orders for every sibling. So the *first* successful drag after this fix
  re-densifies a previously-sparse sibling list automatically.
- **Existing sparse data in IndexedDB** stays sparse until the user
  interacts. No proactive migration. The next add will append at the
  current max+1; the next drag will reindex to dense. Both are
  self-healing.

## Testing

### `src/app/features/tasks/data-access/tasks.state.spec.ts` (extend)

The existing file already has the TestBed + FakeTasksRepository harness.
Add three cases:

1. **`addSubtask` assigns `max(orders) + 1` when orders are dense.** Seed a
   parent with three subtasks (orders `0,1,2`). Call `addSubtask`. Assert
   the new task's `order === 3` and the parent's `tasks` array length is 4.
2. **`addSubtask` assigns `max(orders) + 1` when orders are sparse.** Seed a
   parent with subtasks at orders `[0, 1, 4]` (e.g., by hydrating from a
   TaskRow set). Call `addSubtask`. Assert the new task's `order === 5`.
3. **`addSubtask` returns `0` for the first child.** Seed a parent with no
   subtasks. Call `addSubtask`. Assert the new task's `order === 0`.
4. **`addRoot` mirrors the same three cases** on the root list.

These tests pin the new contract directly without going through the UI.

### `src/app/features/workspace/ui/group-item/group-item.component.spec.ts` (new file)

This component has no existing spec. The minimum useful test is
behavioural, using Angular's component testing utilities:

1. **`onTaskDrop` translates visible→absolute when no hidden tasks exist.**
   Stub `WorkspaceState.tasksFor` to return `[A, B, C]` all visible. Call
   `onTaskDrop({previousIndex: 2, currentIndex: 0})`. Assert
   `state.reorderTasks` was called with `(groupId, null, 2, 0)` — i.e., the
   translation is a no-op.
2. **`onTaskDrop` translates visible→absolute when a hidden task sits
   between visible ones.** Stub `tasksFor` to return
   `[A(visible), B(hiddenUntil=tomorrow), C(visible)]`. CDK sees only
   `[A, C]`. Call `onTaskDrop({previousIndex: 1, currentIndex: 0})`
   (dragging C above A). Assert `reorderTasks` was called with
   `(groupId, null, 2, 0)` — C's absolute index is 2, not 1.
3. **`onTaskDrop` does nothing when the translated indices are missing.**
   Stub `tasksFor` to return an empty array. Call `onTaskDrop({previousIndex:
   0, currentIndex: 1})`. Assert `reorderTasks` was *not* called.
4. **`onTaskDrop` short-circuits when `previousIndex === currentIndex`.**
   Already covered by existing code; add a regression test.

The component-spec setup mirrors `tasks.state.spec.ts`: TestBed with
`provideZonelessChangeDetection()` and a stub `WorkspaceState` whose
`tasksFor` is configurable per-test and whose `reorderTasks` is a spy.

### Manual smoke

After unit tests pass:

1. Seed a parent with 5 subtasks, delete the last two, add a new subtask.
   Verify the new subtask appears at the end (not middle). Drag it to
   the top on the first try. Verify it moved.
2. Hide one of three root tasks until tomorrow. Drag the last visible
   task to the top. Verify the correct task moved (not the hidden one).

No e2e test is added — the new unit + component specs cover both
codepaths directly.

## Risk and rollback

- **Risk: low.** Two small additive changes; no removal of existing
  behaviour, no schema change, no API change.
- **Bundle impact:** none material; the `nextOrder` helper is a few
  bytes, the `onTaskDrop` change adds a single loop.
- **Rollback:** revert the commit. Persisted `order` values from after
  the fix are still valid integers; reverting won't cause data
  corruption. Users may transiently see the original bug return.
- **Forward-compat:** if a future change does adopt the "dense orders"
  invariant (Alternative 1 above), this fix doesn't block it — `max+1`
  on dense orders is identical to `length`.

## Out of scope

- Reindexing surviving siblings on delete to keep orders dense (Alternative 1).
- Removing the redundant `sortedChildren` / `visibleTasks` sorts.
- Migrating existing sparse-order rows in IndexedDB to dense values.
- Refactoring `TasksState.reorder` to take task IDs instead of indices.

## Steering files referenced

None — there is no `.kiro/steering/` directory in this repo yet. The
angular-typescript skill rules (OnPush, signals, no `any`, no `!`) are
implicitly satisfied by the existing code we are modifying.
