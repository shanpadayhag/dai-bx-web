# dai-bx-web — DaiBX 3

The web frontend for DaiBX: one open-source workspace for nested tasks, a board and a calendar. Starting a task opens a calendar event and finishing it sets the end, with check-ins for when you step away.

This branch (`release/v3.0.0`) is the design: every page of the marketing site, the changelog and the app, in the blue theme, with no functionality wired in. Screens read from `data_sources/sample/`, which the Axum API replaces.

## Stack

- Next.js 16 (App Router) and React 19, strict TypeScript
- Tailwind CSS 4, tokens in `src/core/styles/globals.css`
- Changelog entries as MDX in `content/changelog/`
- Vitest, Testing Library

## Layout

- `src/app/` holds routes only, in three groups: `(marketing)`, `(auth)` and `(app)`.
- `src/features/<feature>/` holds each feature's pages, components, entities and data sources.
- `src/core/` holds what no single feature owns: config, the design system components, and styles.

## Backend

Next.js is frontend only: there are no route handlers, server actions or `proxy.ts`. The browser calls the Axum API at `/backend/...` on this app's own origin, and a rewrite in `next.config.ts` forwards it to `API_ORIGIN` with the `/backend` prefix removed. The page and the API share one origin, so the API's HttpOnly cookies are first-party.

Set `API_ORIGIN` before `dev` or `build` (see `.env.example`). Locally it's the API's `cargo lambda watch` on `http://localhost:9000`; on Vercel each environment points at its own Lambda Function URL.

## Changelog

Add a release by adding `content/changelog/<yyyy-mm-dd>-<slug>.mdx` that exports `metadata` with `title`, `version`, `date` and `summary`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:run
```
