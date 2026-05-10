# Product

## Register

product

## Users

People organizing personal to-do lists where time matters. Two recurring shapes drive the product:

- **Time-pinned tasks** — things due at a specific clock time (a meeting, a medication, a stand-up). Alarms exist for these.
- **Time-measured tasks** — things done in stages, measured by elapsed duration (a workout interval, a study block, a recipe step). Timers exist for these.

A primary user opens DaiBX several times a day on a desktop or large tablet, scans their groups, checks off finished work, kicks off the next timer, and acts on alarms when they fire. Sessions are short and frequent rather than long and contemplative. The user is alone with the app — no collaboration, no team features.

## Product Purpose

DaiBX is a to-do list app for tasks that have a time dimension. Groups organize related work; alarms enforce specific clock times; timers measure multi-stage work. Success is the user trusting the app enough to stop juggling reminders elsewhere — the alarm fires when it should, the timer doesn't drift, the list is fast to scan and faster to mutate.

## Brand Personality

**Tactile tool. Mechanical. Confident.**

DaiBX is an instrument, not a productivity platform. The references are Braun calculators, Casio F-91W digital watches, analog kitchen timers, hi-fi component faceplates — objects that feel like dedicated single-purpose hardware. Every interaction should feel like depressing a real key: positive feedback, audible-feeling motion, no decorative flourish. Time is rendered with the seriousness of an instrument display (tabular numerals, segmented digits when a timer is live), not as decorative typography.

Voice is direct and short. Labels are functional ("Next", "Active", "25:00"), not chatty. The product never apologizes, never congratulates, never editorializes — it reports state.

## Anti-references

- **Generic SaaS to-do apps** — Todoist's calm pastels, TickTick's gradients, Microsoft To Do's friendly rounded cards. The cheerful, soft-edged "wellness productivity" aesthetic is what DaiBX is rejecting.
- **Decorative neobrutalism** — Gumroad-clone landing pages where hard shadows and bright primaries are pure ornament. DaiBX uses neobrutalism because hard edges and tactile press feedback fit an instrument; not because the style is trending.
- **Notion-style flexible workspaces** — DaiBX is a single-purpose tool, not a canvas. No "build your own workflow" energy.
- **Calendar-app chrome** — Fantastical/Cron-style time-block grids, day/week views, color-coded categories with airy backgrounds. DaiBX is a list with time, not a calendar.
- **Gamified habit trackers** — streaks, confetti, encouraging copy, character avatars. DaiBX is mute about feelings.

## Design Principles

1. **The instrument never apologizes.** State is reported, not narrated. No friendly empty-state copy, no celebratory micro-interactions, no "Great job!" toasts. The app trusts the user to know what they did.
2. **Time is sacred typography.** Anywhere a clock time, duration, or count appears, it uses tabular monospace numerals. Active timers shift to a segmented-digit treatment so a glance distinguishes "running" from "set for later".
3. **Every press has a depth.** Mechanical tactility is the signature interaction. Buttons depress, cards settle, drag previews lift. Motion exists to confirm physical-feeling action — never to decorate.
4. **Flat hierarchy, sharp signals.** The list is the product. Most surface is uniform; deviation (alarm banner, active timer, destructive action) is reserved for things that genuinely demand a glance.
5. **Density over breathing room.** A user with 40 tasks across 6 groups should see them without scrolling on a 1440px desktop. Whitespace serves rhythm, not decoration.

## Accessibility & Inclusion

- WCAG 2.2 AA across all surfaces. AAA on text-on-primary combinations where feasible.
- All time information must be available to screen readers in plain prose form alongside the visual segmented-digit rendering.
- Respect `prefers-reduced-motion`: depress feedback collapses to instant state changes; no transform animations.
- Color is never the sole signal — the warning banner, destructive actions, and active states each carry an icon and a text label in addition to color.
- All interactive controls reachable by keyboard with visible focus rings. Focus rings adopt the brand blue at full chroma for clear visibility against the neutral background.
- Hit targets minimum 44×44px on the workspace surface (where users tap-select tasks).
