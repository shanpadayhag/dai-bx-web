# Bugfix: first drag of a newly-added task can move the wrong row

<!-- Status: draft -->

## Summary

After adding a new subtask (or root task), the new row sometimes renders **in the middle** of the list instead of at the end. The user's first drag attempt on that new row appears to fail — the row jumps to an unexpected position because the reorder operation moves a *different* row than the one being dragged. The second drag works correctly. The same defect affects root tasks inside a group. Groups themselves are not affected.

Severity: **high**. Drag-and-drop is the primary way users organize their lists. The bug silently corrupts user intent (the wrong row moves) without any error, so users assume the app is broken.

## Current behavior

The list of children is rendered sorted by `task.order`:

```ts
// src/app/features/workspace/ui/task-item/task-item.component.ts:144
protected readonly sortedChildren = computed(() =>
  this.task().tasks.slice().sort((a, b) => a.order - b.order),
);
```

But the reorder handler operates on the raw `task.tasks` array (insertion order), using indices that came from the *sorted* render:

```ts
// src/app/features/tasks/data-access/tasks.tree.ts:122
return tasks.map((task) => {
  if (task.id === parentId) {
    return {
      ...task,
      tasks: reindexOrder(moveInArray(task.tasks, fromIndex, toIndex)),
    };
  }
  ...
});
```

`addSubtask` (and `addRoot`) assign the new task's order as the array length:

```ts
// src/app/features/tasks/data-access/tasks.state.ts:127
order: parent.task.tasks.length,
```

`deleteTaskById` removes a task via `filter` and does **not** reindex surviving orders:

```ts
// src/app/features/tasks/data-access/tasks.tree.ts:30
export const deleteTaskById = (tasks: Task[], taskId: string): Task[] =>
  tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({ ...task, tasks: deleteTaskById(task.tasks, taskId) }));
```

So after deletions, surviving orders can be non-contiguous and `max(order)` can exceed `length - 1`. When a new task is then appended with `order = length`, that new value is no longer the largest — the sort drops the new row into the middle of the rendered list, while the raw array still has it at the end. The two views of the list have desynchronized.

Reproducible with:

```
1. Open a task whose parent has at least 5 subtasks (orders 0..4, dense).
2. Delete the subtasks at positions 3 and 4 (order=2 and order=3 in the data).
   Surviving orders: [0, 1, 4]. Surviving length: 3.
3. Open the "+" affordance on the parent and add a new subtask "X".
   - The new task is assigned order = 3 (length=3).
   - task.tasks array (insertion order): [order 0, order 1, order 4, X(order 3)]
   - Rendered (sorted by order): [order 0, order 1, X(order 3), order 4]
   - "X" appears at sorted index 2 — visually in the middle of the list.
4. Try to drag "X" to the top of the list.
   - CDK reports previousIndex=2, currentIndex=0.
   - reorderTasksByParent calls moveInArray(task.tasks, 2, 0).
   - task.tasks[2] is the OLD order-4 row, not "X". The wrong row jumps to position 0.
5. After the bad move, reindexOrder rebuilds orders dense 0..n-1, which realigns
   the two views. The second drag on "X" now works as expected.
```

The same shape of failure occurs for root tasks inside a group:

- `addRoot` assigns `order: tree.length` (`tasks.state.ts:105`).
- `visibleTasks` sorts the rendered list by order and additionally filters out
  tasks with `hiddenUntil > today` (`group-item.component.ts:46`).
- `onTaskDrop` passes the visible-list index straight into the same
  `reorderTasksByParent` (`group-item.component.ts:107`).

Groups themselves are unaffected: `visibleGroups` only filters (no sort)
(`groups.state.ts:29`), `GroupsState.remove` already calls `reindexOrder`
after the filter (`groups.state.ts:60`), and `reorderVisible` correctly
translates visible-index → absolute-index before reordering
(`groups.state.ts:110`).

## Expected behavior

1. A newly-added subtask or root task is always rendered **at the end** of its
   sibling list, regardless of prior deletions. Its sort key is strictly
   greater than every existing sibling's sort key.
2. The first drag of that newly-added row moves *that row* (not a different
   row) to the drop target.
3. The same guarantees hold for root tasks inside a group, including when the
   group contains hidden-until-future tasks.

This is filling a previously undocumented requirement. After this fix the
requirements should be:

- *When the user adds a new task as a sibling under a parent (or as a root
  task within a group), the system shall render the new task at the end of
  the sibling list.*
- *When the user drags any task — including one just added — the system shall
  reorder exactly the dragged task to the drop position, with no off-by-one
  or wrong-row effects, on the first drag attempt.*

## Behavior that must not change

- Drag-and-drop of pre-existing tasks within a parent that has *dense*,
  *consecutive* orders continues to work as it does today.
- Drag-and-drop of groups in the workspace continues to work as it does
  today.
- Deletion semantics: deleting a task still removes it and all its
  descendants from the tree and from the repository.
- Completion semantics: toggling completion does not affect a task's `order`
  field.
- Hidden-until semantics: a task with `hiddenUntil > today` is still excluded
  from the rendered root list of a group.
- The persisted `Task.order` value remains a finite integer suitable for
  ascending sort. (The fix may change which integer is written, but the
  field's type and meaning stay the same.)
- No migration of existing IndexedDB rows is required — the fix is
  self-healing on the next reorder of each affected sibling list.

## Root cause analysis

1. **The rendered list is sorted by `order`, but the reorder operation
   indexes into the unsorted `task.tasks` array.** These two views are only
   identical when `task.tasks` happens to be already sorted by `order` —
   which is true at hydration time (`buildTreeFromRows` calls
   `sortRecursive`) and after every reorder (`reindexOrder` rebuilds the
   array), but is *not* guaranteed after add+delete sequences.

2. **`addRoot` / `addSubtask` use `length` as the new task's `order`.** This
   is correct only when surviving siblings have dense, consecutive orders
   `0..length-1`. After a deletion that leaves a gap above the new `length`
   (e.g., orders `[0, 1, 4]` with length 3), the new task's `order = 3` is
   less than an existing sibling's `order = 4`, so it sorts into the middle
   while remaining at the end of the raw array.

3. **`deleteTaskById` does not reindex surviving siblings.** Deletion is a
   pure `filter`, so non-contiguous orders can accumulate over time. The
   array stays sorted by `order` (filter preserves order), but the order
   values themselves become sparse.

4. **`group-item.component.ts:onTaskDrop` passes the visible-list index
   straight through.** Even after fixing the sort-vs-array mismatch, root
   tasks have a *second* off-by-one risk: when a hidden-until-future task
   sits between two visible tasks, the visible drag index is smaller than
   the absolute array index. (`GroupsState.reorderVisible` already handles
   the analogous case for groups; tasks have no equivalent.)

Synthesis: causes (1)–(3) combine to produce the user's reported symptom for
newly-added subtasks. Cause (4) is a latent variant of the same bug class —
it does not require an add operation to trigger; merely reordering visible
root tasks while a hidden one sits between them would move the wrong row.
The fix must address both classes to prevent the user encountering a
"works on the first try" version of the same surprise on a different
codepath.
