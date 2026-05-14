# Tasks: fix-task-completion-timezone

<!-- Status: draft -->

Three tasks. All small. Tasks 1 and 2 are landed together (the unit test is the only mechanism that proves task 1 is right). Task 3 is a manual verification before the PR is opened.

---

## 1. Rewrite `todayIso()` in terms of local-calendar components

- [x] **File:** `src/app/shared/utils/dates.ts`
- **Change:** replace the existing body so the function builds `YYYY-MM-DD` from `Date.getFullYear()`, `Date.getMonth() + 1`, and `Date.getDate()` (all local accessors), zero-padding month and day. Extract the pure transformation as `dateToLocalIso(date: Date): string` and have `todayIso()` call it with `new Date()`.
- **Exports after change:** `todayIso` (existing, signature unchanged), `dateToLocalIso` (new).
- **Implements:** bugfix.md → "Expected behavior" + "Root cause analysis"; design.md → "The fix".
- **Acceptance:**
  - The file exports both `todayIso` and `dateToLocalIso`.
  - `todayIso()` returns a 10-character `YYYY-MM-DD` string.
  - For any `Date d`, `dateToLocalIso(d)` equals `` `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` ``.
  - `npm run lint` passes.
  - TypeScript build (`ng build`) passes.
  - No call-site change anywhere else under `src/` (grep for `todayIso` and verify the four expected call sites still match).

---

## 2. Add unit tests for `dates.ts`

- [x] **File (new):** `src/app/shared/utils/dates.spec.ts`
- **Framework:** Jasmine (the project's existing test setup — see `package.json`: `karma-jasmine`, `jasmine-core`).
- **Tests to add** (one `describe('dates', ...)` block):
  1. `dateToLocalIso(new Date(2026, 0, 5))` returns `'2026-01-05'` — zero-padding of single-digit month and day.
  2. `dateToLocalIso(new Date(2026, 11, 31, 23, 59, 59))` returns `'2026-12-31'` — end-of-year, end-of-day local values.
  3. `dateToLocalIso(new Date(2026, 4, 14, 0, 0, 0))` returns `'2026-05-14'` — local-midnight regression. (In any timezone east of UTC, the same instant is `'2026-05-13'` when sliced from `toISOString()`; this test fails on the old implementation in those timezones, locking in the fix.)
  4. `todayIso()` equals `` `${y}-${pad(m+1)}-${pad(d)}` `` where `y`, `m`, `d` come from `new Date()` via the same local accessors — proves the wrapper uses local time, not UTC.
- **Implements:** design.md → "Testing".
- **Acceptance:**
  - `npm test` (i.e. `ng test`) discovers the new `dates.spec.ts` and all four specs pass.
  - No reliance on the test-runner's timezone, on `jasmine.clock()`, or on global state.

---

## 3. Manual repro verification before opening the PR

- [ ] **What to verify:** the exact reproduction steps from `bugfix.md` no longer reproduce the bug.
- **Steps:**
  1. Set system timezone to `Asia/Manila` (UTC+8).
  2. `npm start`, open the app, mark any task done.
  3. Set system clock to 00:05 the next day (still in `Asia/Manila`).
  4. Reload the tab.
  5. **Expected:** the task no longer shows as completed.
  6. Restore the system clock and timezone.
- **Implements:** bugfix.md → "Reproducible" steps.
- **Acceptance:** step 5's expected outcome is observed. If it is not, stop and re-open the spec — the design is wrong, not the implementation.

---

## Out of scope (do not do as part of this spec)

- Real-time midnight tick that auto-resets the UI in an already-open tab. Captured in design.md as a deliberate omission; revisit as a separate feature spec if needed.
- Any change to the storage shape of `completedDate` / `hiddenUntil`.
- Any refactor of the four call sites of `todayIso()`. They are already correct.
