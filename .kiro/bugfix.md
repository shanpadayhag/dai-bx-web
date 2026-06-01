# Bugfix — drag-and-drop misplacement

**Status:** RESOLVED 2026-05-31 by resetting DnD to the stock `@thisbeyond/solid-dnd`
sortable model (user decision). The insertion-point / gap-line layer was removed
entirely, which eliminates the root-cause class below: there are no gap
droppables left to carry stale positional data. Items are now `createSortable`
(draggable + droppable) inside per-list `SortableProvider`s with `closestCenter`
collision; the drop handler resolves dragged/target ids to absolute sibling
indices and calls the stores' existing splice-based `reorder`. `npm run typecheck`
+ full Vitest suite (377 tests) green. Pending: live drag verification + commit.
**Date:** 2026-05-31
**Severity:** High

## Symptom
Dragging an item (group / task / subtask) sometimes drops it in the wrong
position. (Exact conditions TBD — awaiting repro.)

## Expected behavior
The item lands in the gap the cursor is hovering over.

## Reproduction
- Dragged item "suddenly goes at the bottom" instead of the dropped gap.
- Intermittent — not every drag.
- Correlated with **newly created tasks**: after creating a new task, that
  task and "some other task" misbehave when dragged.

Reliability: intermittent; linked to freshly-created tasks.

## Working hypothesis (2026-05-31)
"Jumps to bottom" + "tied to a newly created task" strongly suggests
**duplicate or stale `order` values**. A new task gets `order = max+1`; if two
siblings ever end up sharing an `order`, the render `.sort((a,b)=>a.order-b.order)`
is ambiguous for that pair, so the rendered position (what the cursor/gap math
sees) can disagree with the raw-array position the reorder splices against ->
item lands at the wrong (often last) slot. Need to verify `add` and the gap
`insertAt` indexing in GroupItem/TaskItem.

## Investigation notes (from code read, 2026-05-31)
- DnD is NOT custom-from-scratch. It uses `@thisbeyond/solid-dnd` v0.7.5 with a
  custom **insertion-point** layer (`web/src/features/workspace/dnd.ts`).
- Drop targets are N+1 invisible gap droppables interleaved with items. Custom
  collision detector picks the gap whose center Y is nearest the cursor
  (`WorkspacePage.tsx` `insertionPoint`).
- Index math `visibleToAbsoluteReorder` maps (visible source, visible insert)
  to (from, to) absolute indices, accounting for hidden siblings + the
  splice-out-first shift.
- Ordering consistency CHECKED:
  - Tasks: `buildTreeFromRows` → `sortRecursive` sorts by `order` on load;
    `reorderInArray` reindexes `order = arrayIndex` after every move; `add`
    appends with `nextOrder`. So raw `byGroup[gid]` array stays in `order`
    order, matching the rendered `.sort((a,b)=>a.order-b.order)`. No obvious
    divergence here.
  - Groups: `visibleGroups` = `state.groups.filter(!isHidden)` (no sort);
    `reorderVisible` maps visible→abs against the same `state.groups`.
    Render and math both key off `state.groups` order → consistent.
- Remaining suspects (need repro to confirm):
  - Collision detector picks nearest gap by Y only; variable item heights or
    the dragged item's own gap being excluded could bias selection.
  - `isNoOpInsertion` (insert == source or source+1) may swallow legit moves.
  - Subtask vs root-task gap `insertAt` indices in GroupItem/TaskItem may not
    line up with the visible-index assumption.

## Root cause (high confidence, pending live confirmation)
Gaps encode a POSITIONAL `insertAt` (and an index-bearing `id`) into the
solid-dnd droppable **at creation** (`Gap.tsx` `createDroppable(props.id,
{...insertAt})`). `<For>` reuses Gap instances across list mutations and only
updates `i()` reactively. solid-dnd 0.7.x captures droppable `data`/`id` once
and does not re-read them reactively, so a reused gap keeps a STALE `insertAt`
after its position shifts. `onDragEnd` then reads the stale `gapData.insertAt`
-> drop lands at the wrong slot (often the bottom). Matches: intermittent, tied
to create/delete churn, "jumps to bottom."

RULED OUT: index math (`visibleToAbsoluteReorder`) is correct; `order`
invariant holds (array stays order-sorted; nothing mutates order outside
add/reorder). => A full reset to "basic DnD" would NOT fix this and would lose
the insertion-point model, auto-scroll, accessibility, cross-size symmetry.

## Fix plan (targeted, keeps solid-dnd)
Stop trusting positional data captured at droppable creation. Options:
- (A) Make the gap anchor stable: store the id of the item AFTER the gap
  (or a `tail` flag), then compute the insertion index from the LIVE visible
  list at drop time. Removes the staleness class entirely.
- (B) Re-read insertAt at drop time from the droppable's id by parsing, against
  the current rendered list. (Less clean than A.)
- (C) Force the gap droppable to re-register when insertAt changes (recreate on
  index change). Works but fights the library.
Prefer (A). Verification: reproduce the original misorder, plus a Vitest unit
test on the new live-mapping helper, plus a regression test for "reorder after
create/delete."

## Out of scope for this fix
- Replacing solid-dnd / rewriting DnD from scratch.
- Auto-scroll, drag-ghost styling (unaffected).
