---
name: DaiBX
description: Tactile to-do instrument with hard-edged neobrutalism, instrument blue, and segmented-digit time
colors:
  instrument-blue: "oklch(67.47% 0.1726 259.49)"
  instrument-blue-soft: "oklch(85% 0.07 259)"
  instrument-blue-pale: "oklch(94.5% 0.04 259)"
  concrete-plate: "oklch(93.46% 0.0305 255.11)"
  paper-white: "oklch(100% 0 0)"
  pure-carbon: "oklch(0% 0 0)"
  graphite: "oklch(45% 0 0)"
  pencil-grey: "oklch(60% 0 0)"
  ash: "oklch(96% 0 0)"
  caution-yellow: "oklch(85% 0.18 90)"
  hazard-orange: "oklch(64% 0.22 25)"
  operating-green: "oklch(72% 0.18 145)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
  readout:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0"
    fontVariation: "tabular-nums"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.75rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.instrument-blue}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  button-neutral:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.pure-carbon}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  button-destructive:
    backgroundColor: "{colors.hazard-orange}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pure-carbon}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.pure-carbon}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.pure-carbon}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  banner-alarm:
    backgroundColor: "{colors.caution-yellow}"
    textColor: "{colors.pure-carbon}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
---

# Design System: DaiBX

## 1. Overview

**Creative North Star: "The Instrument Panel"**

DaiBX looks and feels like a dedicated piece of hardware — a Casio F-91W watch face, a Braun calculator, an analog kitchen timer with a satisfying click. The system is built from three load-bearing primitives: a hard 2-pixel carbon border, a 4-pixel offset shadow that collapses on press, and a confident instrument-blue accent that signals state. Every surface obeys the same vocabulary so the product reads as one tool, not a screen full of widgets.

The aesthetic explicitly rejects the genre adjacent to it. Generic SaaS productivity (Todoist's calm pastels, Microsoft To Do's friendly cards) is wrong; decorative neobrutalism that uses hard edges as ornament rather than as structural honesty is wrong; calendar-app chrome is wrong. DaiBX uses brutalism the way a measuring instrument uses it — because the lines are honest about what the object does.

**Key Characteristics:**
- 2px pure carbon border on every interactive surface
- 4px offset hard shadow, no blur, never tinted
- Tabular monospace numerals on every clock time, duration, and count
- Instrument blue used as a state signal, not as decoration
- Mechanical depress on press: 2px translate at hover, 4px translate at active
- Dot-grid concrete plate background, fixed in viewport
- Type weight contrast: 500 body against 700 / 900 headings

## 2. Colors

A near-monochrome canvas with a single saturated accent. The blue is the only color carrying brand weight; warning, destructive, and success exist for state, not flavor.

### Primary
- **Instrument Blue** (`oklch(67.47% 0.1726 259.49)`): The accent. Used on primary buttons, focus rings, selection highlights, the active timer's running readout, and the "Next alarm" pill emphasis. Never used as page background, never as decoration. If the user's eye should land here, this is the color. If it shouldn't, this color is absent.
- **Instrument Blue Soft** (`oklch(85% 0.07 259)`): Reduced-chroma companion for subtle blue tints — drag-over hints, secondary fill states.
- **Instrument Blue Pale** (`oklch(94.5% 0.04 259)`): Background tint of the same family. Used for `accent` containers — mute, on-brand, recedes.

### Neutral
- **Concrete Plate** (`oklch(93.46% 0.0305 255.11)`): The page background. Slightly cool, slightly tinted toward the instrument hue — never a flat grey, never paper-white. The fixed dot-grid texture rides on top.
- **Paper White** (`oklch(100% 0 0)`): Card, input, and elevated-surface fill. Reserved for elements that read as "above" the plate.
- **Pure Carbon** (`oklch(0% 0 0)`): The border, the ring, the input outline, the body text. The primary structural line of the entire system.
- **Graphite** (`oklch(45% 0 0)`): Muted secondary text. Captions, supporting metadata.
- **Pencil Grey** (`oklch(60% 0 0)`): Subtle/disabled text and placeholder copy.
- **Ash** (`oklch(96% 0 0)`): Secondary surface fill — the soft grey under non-elevated rows.

### Tertiary (state signals)
- **Caution Yellow** (`oklch(85% 0.18 90)`): Reserved for alarm banners and time-sensitive notifications. Not a brand color. Not used decoratively.
- **Hazard Orange** (`oklch(64% 0.22 25)`): Destructive actions only. Delete, remove, irreversible.
- **Operating Green** (`oklch(72% 0.18 145)`): Success state confirmation. Used sparingly.

### Named Rules

**The Single Voice Rule.** Instrument Blue carries every brand-positive moment on a screen. If two surfaces both want to be blue, only the more important one gets it. The other goes neutral.

**The Tinted-Neutral Rule.** Page background tints toward the brand hue (Concrete Plate). Pure paper-white (`#ffffff`) and pure black (`#000000`) are forbidden — every neutral has trace chroma toward the instrument hue.

**The State-Color Reserve.** Caution Yellow, Hazard Orange, and Operating Green never decorate. They appear when the app is reporting a state the user must read. If a screen has more than one state-colored region, the design is wrong.

## 3. Typography

**Display Font:** Geist (system fallback)
**Body Font:** Geist (same family)
**Readout Font:** Geist Mono (monospace, tabular numerals)

**Character:** Geist provides the structural grotesque seriousness — clean, tall x-height, subtle squareness — that fits an instrument. Geist Mono carries every numeral that means time, duration, count, or measurement. The two faces are siblings, not strangers, which keeps the tool reading as one object.

### Hierarchy
- **Display** (weight 900, `clamp(2.5rem, 6vw, 3.75rem)`, line-height 1, letter-spacing -0.025em): The page-level brand title (DaiBX wordmark on the workspace home). Used at most once per route.
- **Headline** (weight 700, 1.25rem, letter-spacing -0.01em): Group titles, modal titles, prominent section headers.
- **Title** (weight 700, 1rem): Card titles, feature subheaders.
- **Body** (weight 500, 1rem, line-height 1.5): Default reading weight. Tasks, descriptions, paragraph text. Never below 0.875rem on the workspace.
- **Label** (weight 700, 0.75rem, uppercase, letter-spacing 0.05em): Small functional labels — "NEXT", "ACTIVE", group counts, badge text.
- **Readout** (Geist Mono, weight 600, 0.875rem, `font-variant-numeric: tabular-nums`): Every clock time, every duration, every count. Always tabular. Active timers use the same family but increase weight to 700 and may switch to a segmented digit treatment when running.

### Named Rules

**The Tabular-Numeral Rule.** Any numeric value that represents time, duration, or count uses Geist Mono with tabular numerals. Mixing proportional numerals into a list of times is forbidden — they jitter when values change and that jitter is exactly what an instrument must not do.

**The Weight-Contrast Rule.** Hierarchy is built from weight contrast (500 vs 700 vs 900), not from size alone. A 1rem 700 reads as "title"; a 1rem 500 reads as "body". The weight does the lifting.

**The No-Italic Rule.** Italics imply tone. The instrument has no tone. Forbidden across all surfaces.

## 4. Elevation

The system has exactly one elevation language: a hard 4-pixel offset shadow with zero blur, in pure carbon. The shadow is never tinted, never softened, never feathered. It exists to give edges physical weight, not to suggest light.

### Shadow Vocabulary
- **shadow-brutal** (`box-shadow: 4px 4px 0 0 var(--border)`): The default. Cards, buttons, inputs at hover, the workspace header logo.
- **shadow-brutal-sm** (`box-shadow: 2px 2px 0 0 var(--border)`): Inputs at rest, alarm banner, smaller surfaces. The half-step.
- **shadow-brutal-lg** (`box-shadow: 6px 6px 0 0 var(--border)`): Drag previews and lifted-state surfaces. The full-step up.
- **shadow-brutal-press** (`box-shadow: 0 0 0 0 var(--border)`): The collapsed state. Reached at `:active`. The element has been "pressed in".

### Named Rules

**The Press-Depth Rule.** Buttons settle when pressed. Default sits at `shadow-brutal` and `translate(0,0)`. Hover translates `(2px, 2px)` and reduces shadow to `2px 2px`. Active translates `(4px, 4px)` and collapses shadow to `0 0`. The shadow + translate sums always equal the base offset, so the bottom-right corner of the element appears stationary in space — the element is depressing into a fixed-position hole.

**The Carbon-Only Rule.** All shadows are pure carbon. Tinted shadows (blue-tinted, warm-tinted, cool grey) are forbidden. The honest-edge identity depends on this.

**The Reduced-Motion Rule.** When `prefers-reduced-motion` is set, the press transition collapses to instant — no transform, no shadow animation. The element still depresses, just instantly.

## 5. Components

### Buttons
- **Shape:** Rounded edges (`var(--radius-md)`, 0.5rem).
- **Default / Primary:** Instrument Blue fill, paper-white text, 2px carbon border, shadow-brutal, brutal-press transition. The single most-emphasized control on any screen.
- **Neutral:** Paper-white fill, carbon text. Same border + shadow + press behavior. Used for secondary or icon actions.
- **Destructive:** Hazard Orange fill, paper-white text. For irreversible actions only.
- **Success / Warning:** Operating Green / Caution Yellow fills. For affirmative confirmations and time-bound nudges. Rare.
- **Ghost:** No border, no shadow, no fill. Carbon text. Background fades to `foreground/5` on hover. Used inside dense rows where bordered buttons would create visual chaos.
- **Sizes:** `default` (h-10 px-4), `sm` (h-9 px-3), `lg` (h-12 px-6), `icon` (10×10), `icon-sm` (8×8). Hit targets stay above 36×36 even at the smallest size.
- **Press feedback (signature):** Hover translates `(2px, 2px)` and collapses shadow to 2px. Active translates `(4px, 4px)` and collapses shadow to zero. 100ms ease-out.

### Cards
- **Corner Style:** Rounded-lg (0.625rem).
- **Background:** Paper White (elevated surface above the Concrete Plate).
- **Border:** 2px Pure Carbon.
- **Shadow:** shadow-brutal at rest. Cards do not press.
- **Internal Padding:** 1.25rem (`p-5`) for primary content; 1rem on tighter rows.
- **Nested cards are forbidden.** A card inside a card is always a layout failure.

### Inputs
- **Style:** Paper-white fill, 2px carbon border, rounded-md, h-10. shadow-brutal-sm at rest.
- **Focus:** Shadow expands to shadow-brutal (the half-step grows to a full step). 3px Instrument Blue outline-ring at focus-visible.
- **Disabled:** 50% opacity, cursor not-allowed.
- **Placeholder:** Pencil Grey, weight 400 (lighter than the input value).

### Alarm Banner (signature)
- **Anatomy:** A pill displayed inline below the workspace header when an upcoming alarm exists.
- **Style:** Caution Yellow fill, 2px carbon border, rounded-md, shadow-brutal-sm, height implied by content (py-1.5).
- **Content order:** bell icon → "NEXT" label (uppercase, label-style) → tabular-nums clock time → middle dot separator → truncated task name. Every part except the task name is fixed-width so the eye lands on the time first.
- **Behavior:** Static. Does not animate. The bell icon may pulse only within 60 seconds of fire.

### Group Item & Task Item (signature)
- **Group item:** Card-shaped container with a header strip (group name, count, controls) and a stacked list of task rows.
- **Task row:** A 44px-tall row with a checkbox, task name (Body weight), optional time/timer chip on the right (Readout font, tabular). Drag handle on the far left for reorder. Active timer rows promote to a slightly heavier row (background tint Instrument Blue Pale, weight 600 on the readout).
- **Empty state:** Dashed-border container with a centered icon-in-card and one short instruction. No illustration. No celebratory copy.

### Drag Preview
- **Style:** Floating card at shadow-brutal-lg, 2px carbon border, paper-white fill.
- **Placeholder behind it:** Opacity zero — the slot disappears, the preview is the only visible artifact during drag.

## 6. Do's and Don'ts

### Do:
- **Do** use Instrument Blue (`oklch(67.47% 0.1726 259.49)`) only on the single most-emphasized control of a given screen. The Single Voice Rule is non-negotiable.
- **Do** render every clock time, duration, and count in Geist Mono with tabular numerals. Time is sacred typography.
- **Do** use the depress-on-press shadow + translate for every interactive button. The mechanical feel is the brand.
- **Do** tint backgrounds toward the instrument hue. Pure white (`#ffffff`) and pure black (`#000000`) are forbidden — Concrete Plate and Pure Carbon (which still has chroma 0 but reads as ink, not RGB black) replace them.
- **Do** keep the dot-grid background fixed in the viewport. It's a texture, not a scrollable element.
- **Do** restrict Caution Yellow, Hazard Orange, and Operating Green to genuine state signals. If you reach for them as accents, you are wrong.
- **Do** keep card corners at rounded-lg (0.625rem) and button corners at rounded-md (0.5rem). Shape is part of the system.

### Don't:
- **Don't** introduce decorative neobrutalism. Hard shadows that don't correspond to a press behavior are forbidden. If a surface has shadow-brutal but no brutal-press, it is a card — never an interactive control.
- **Don't** use side-stripe borders. `border-left` greater than 1px as a colored accent is banned across the entire system.
- **Don't** use gradient text, glassmorphism, or any blur as decoration.
- **Don't** mix proportional numerals into a column of times. Mixing destroys the readability that's the whole point of tabular numerals.
- **Don't** italicize anything, anywhere. The No-Italic Rule.
- **Don't** nest cards inside cards. Use spacing and weight contrast instead.
- **Don't** let the visual mimic Todoist's pastels, TickTick's gradients, Notion's flexible workspace chrome, or any calendar app's color-block grid. PRODUCT.md anti-references apply directly.
- **Don't** add celebratory empty states or "Great job!" toasts. The instrument never apologizes and never congratulates.
- **Don't** apply tinted shadows. Shadows are pure carbon, period.
- **Don't** use shadow-brutal-lg outside drag previews and explicitly lifted states. It's the loudest elevation token; restraint protects its meaning.
