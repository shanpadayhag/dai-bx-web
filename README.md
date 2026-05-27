# client-web — DaiBX (SolidJS)

A faithful rewrite of the Angular DaiBX app in SolidJS. Same shadcn-neobrutalism design, same features, same IndexedDB database. The Angular original lives at `../client-web-old/` for reference.

## Stack

- **Framework:** SolidJS via Vite (no SSR)
- **Language:** TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` config)
- **State:** Solid signals + stores; feature-local where possible
- **Routing:** `@solidjs/router`
- **Storage:** IndexedDB (`daibx_app` v3) via `idb`; localStorage for active timer runs
- **Drag-and-drop:** `solid-dnd`
- **Modals:** native HTML `<dialog>` element
- **Icons:** `lucide-solid`
- **Testing:** Vitest + `@solidjs/testing-library` (colocated `.test.tsx`)

## Bundle size

Production `npm run build` output, measured 2026-05-26 after T18:

| Asset | Raw | Gzipped |
|---|---|---|
| `dist/assets/index-*.js` | 144 KB | 44 KB |
| `dist/assets/index-*.css` | 34 KB | 7 KB |
| `dist/index.html` | < 1 KB | < 1 KB |
| **Total `dist/`** | **188 KB** | — |

Angular reference at `../client-web-old/dist/` is **632 KB**. The SolidJS port ships at ~3.4× smaller for the same surface area (workspace + alarms + timers + sounds + settings).

## Reactivity discipline

Anti-patterns audited at T18 — none present:

- No destructured props (`const { x } = props` breaks reactivity in Solid).
- No signal reads stored in `const` at component-body scope; derived values are functions (`const isX = () => signal() === 'x'`).
- No `style={{ ... }}` outside genuinely dynamic transforms.
- `createMemo` used only where a derivation is consumed in multiple places (scheduler, runner).
- Task-store mutations go through `produce` from `solid-js/store` — only the touched field gets new identity, every other `Task` reference stays stable across the tree. Without this, `<For each={visibleTasks()}>` (which keys by identity) would remount every `TaskItem` on every field write. Profiled under 4× CPU throttle with 40 tasks × 6 groups: toggle complete = 0 unnecessary remounts; add task = 1 remount (the new task itself, correct).

## Scripts

```bash
npm run dev         # start dev server
npm run build       # type-check + production build
npm run preview     # preview production build locally
npm run test        # vitest in watch mode
npm run test:run    # vitest, one-shot
npm run typecheck   # tsc -b, no emit
```

## Planning artifacts

The full spec lives in `../.kiro/`:

- `requirements.md` — what the app must do
- `design.md` — how it's built
- `tasks.md` — the ordered task list driving implementation
