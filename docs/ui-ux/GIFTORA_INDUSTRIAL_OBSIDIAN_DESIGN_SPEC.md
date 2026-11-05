# Giftora — Industrial Obsidian Design Specification

| | |
|---|---|
| **Theme** | Industrial Obsidian (`id: 'industrial-obsidian'`, preview theme "7") |
| **Status** | Study + specification only. **Nothing in this document has been implemented in the application.** |
| **Written** | 2026-11-05 |
| **Source of truth** | `giftora-design-preview-main/` — `index.html`, `styles.css`, `app.js`, `assets/jas-logo.png` (the snapshot that is also live on the GitHub Pages preview) |
| **Target** | `apps/customer-frontend` (primary), `apps/admin-frontend` (secondary). Backend, Prisma and the 3D geometry engine are out of scope. |
| **Scope rule** | Industrial Obsidian only. No colour, font or style from any other preview theme is used anywhere in this file. |

## How to read this document

Every value is tagged so an implementer knows how much to trust it.

| Tag | Meaning |
|---|---|
| **[SRC]** | Copied exactly from the preview source (file and line given in §10). |
| **[DER]** | Derived from source by arithmetic, `calc()`, `color-mix()` or CSS cascade order. Computed by reading, **not** by rendering in a browser. |
| **[EST]** | Estimated. The preview does not define it. |
| **[REC]** | A recommendation that **deviates from or extends** the preview. Needs the owner's approval before use (listed in §14). |

Where the preview's own value has a defect (for example white text on gold at 2.08:1), the spec gives the **source value first**, then a **[REC]** correction. Never silently apply a [REC].

---

## 1. Theme overview and visual principles

**Source description [SRC]:** "DARK — pure black, white text, thin gold and blue accents, sharp modern-industrial".
**Best for [SRC]:** "Technical/industrial positioning, dark-mode default, spec-heavy pages".
**Preview ratings [SRC]:** premium 5, gifting warmth 1, product fit 4.
**Strengths [SRC]:** sharpest, most "modern industrial 3D-printing" look; pure black plus white text gives maximum contrast and a tech-forward edge; thin gold/blue accents keep it tied to the brand.
**Weaknesses [SRC]:** coldest theme, needs strong product renders to avoid feeling empty; sharp 4 px corners feel severe in dense forms.

### Visual principles (derived from how the source is built)

1. **Pure-black canvas.** Page `#000000`; raised surfaces are only 1–5 % lighter (`#0D0D0D`, `#141414`, `#161616`). Depth comes from **1 px hairlines**, not shadows (cards carry no shadow at all in the source).
2. **Gold means action and emphasis.** `#D9AE4E` is used for primary buttons, the active nav underline, links, eyebrows, stars, step numbers, selected states and the key bar in charts. Never for body text.
3. **Blue is the secondary accent.** `#3D6AA3` is used for badges ("Best seller", "Made to order"), the promo eyebrow and check icons, admin count chips, the hero sun disc and one chart series. It is thin and sparing.
4. **Sharp geometry.** Control radius is **4 px**; cards **8 px**; the promo band **16 px**; pills and avatars fully round. Small radius resolves to **0 px**.
5. **Display type is tight and technical.** Space Grotesk 600, letter-spacing −0.02 em, line-height 1.12. Small uppercase eyebrows with wide tracking (0.16 em).
6. **Flat chrome.** No gradients, blur or backdrop effects on UI chrome. Gradients exist only inside product illustrations.
7. **A light "viewport island".** The 3D preview area is deliberately light (`#F3F6FB` with a `#DBE4F0` 32 px grid) inside the black UI, with white floating controls. This is fixed and does not follow theme tokens [SRC].
8. **Fixed semantic colours.** Success/warning/danger never change with the theme, and are shown as light-tinted pills.

---

## 2. Colour palette

### 2.1 Theme tokens (exact) [SRC]

| CSS variable | Hex | Role in the source |
|---|---|---|
| `--bg` | `#000000` | Page canvas, hero background, `.frame` background |
| `--surf` | `#0D0D0D` | Header, cards, inputs, popovers, trust strip, cart/summary cards, customiser panel |
| `--alt` | `#141414` | Alternate section bands, search pill, assurance box, disabled input, table-row hover |
| `--soft` | `#161616` | Image tiles, selected-state fill, badge default fill, icon circles, sidebar active item, hero arch |
| `--band` | `#000000` | Announcement bar, footer, promo band, admin sidebar |
| `--line` | `#262626` | Every 1 px border and divider; chart grid lines |
| `--ink` | `#FFFFFF` | Headings and body text |
| `--muted` | `#8A8A8A` | Secondary text, hints, placeholders, table headers |
| `--brand` | `#D9AE4E` | Gold: primary action, active nav, links, eyebrows, stars, step circles |
| `--brand-d` | `#A9823A` | Gold dark: hover fill, default-badge text, drop-zone text |
| `--acc` | `#3D6AA3` | Blue accent: badges, promo eyebrow and icons, count chips, hero sun disc |
| `--acc-ink` | `#FFFFFF` | Text on `--acc` |
| `--hero-bg` | `#000000` | Hero background |
| `--hero-fg` | `#FFFFFF` | Hero heading and ghost-button text |
| `--hero-fg2` | `#D9AE4E` | Hero lead paragraph and trust mini-row (gold) |
| `--hero-arch` | `#161616` | Arch shape behind the hero product scene |
| `--hero-btn` | `#D9AE4E` | Hero primary button fill |
| `--hero-btn-fg` | `#000000` | Hero primary button text (**black on gold**) |
| `--fig` | `#D9AE4E` | Figure colour inside product illustrations |
| `--fig2` | `#f2f2f6` | Second figure colour; **inherited from the shared base object**, not set by this theme |
| `--r` | `4px` | Control radius |
| `--disp-w` | `600` | Display font weight |
| `--disp-ls` | `-0.02em` | Display letter-spacing |
| `--disp` | `"Space Grotesk",system-ui,sans-serif` | Display font stack |
| `--body` | `"Inter",system-ui,sans-serif` | Body font stack |

### 2.2 Derived values [DER]

| Value | Result | Formula |
|---|---|---|
| `--card-r` | **8 px** | `calc(var(--r) + 4px)` |
| Small radius | **0 px** | `calc(var(--r) - 4px)` |
| Promo band radius | **16 px** | `calc(var(--card-r) + 8px)` |
| `.ph.alt2` tile fill | `#1F3046` | `color-mix(in srgb, #3D6AA3 38%, #0D0D0D)` |
| Chart bar (non-highlight) | `#463A1F` | `color-mix(in srgb, #D9AE4E 28%, #0D0D0D)` |
| Hero ghost-button border | ≈ `#474747` on `#000` | `color-mix(in srgb, #fff 28%, transparent)` |
| Drop-zone dashed border | `#776338` | `color-mix(in srgb, #D9AE4E 45%, #262626)` |
| Focus ring (demo class) | ≈ `#4C3D1B` on `#000` | `color-mix(in srgb, #D9AE4E 35%, transparent)` |

### 2.3 Fixed colours that do **not** follow the theme [SRC]

| Colour | Hex | Where |
|---|---|---|
| Success text / "% off" / "Free" | `#17683f` | `.badge.ok`, `.price .off`, `.preflight`, cart "Free" |
| Success tint | `#e3f4ea` (badge), `#e8f5ee` (preflight) | pill and panel backgrounds |
| Warning | text `#8a5c00` on `#fcefd0` | `.badge.warn` |
| Danger | text `#a82d1a` on `#fbe6e2` | `.badge.bad`, `.hint.err` |
| Danger fill / error border | `#b3321f` | `.btn-d` (white text), `.inp.err` border |
| Chart series 3 and 4 | `#2f9e6e`, `#d3524a` | orders-by-status stack (inline in `app.js`) |
| Viewport background | `#f3f6fb` + grid `#dbe4f0` (32 px) | `.vp` |
| Viewport floating UI | `rgba(255,255,255,.92)` text `#1d2230` | `.dim`, `.hintchip`; buttons `#fff`, mini-panel `#fff`, its input border `#dbe1ea` |
| Toggle thumb | `#fff` | `.tog::after` |
| Illustration neutrals | `#17171c`, `#0d0d11`, `#1c1c21`, `#9fa4ad`, `#e5e8ed`, `#cfd4db`, glass gradients | inside the SVG product symbols |

### 2.4 Contrast audit (computed from the exact hex values, WCAG 2.x)

| Pair | Ratio | Result |
|---|---|---|
| `--ink` on `--bg` | **21.00:1** | AAA |
| `--ink` on `--surf` / `--alt` / `--soft` | 19.44 / 18.42 / 18.10 | AAA |
| `--muted` on `--bg` / `--surf` / `--alt` / `--soft` | 6.08 / 5.63 / 5.34 / 5.24 | AA |
| `--brand` on `--bg` / `--surf` / `--soft` | 10.11 / 9.36 / 8.72 | AAA |
| `--brand-d` on `--soft` (default badge) | 5.12 | AA |
| `--brand-d` on `--bg` | 5.94 | AA |
| **Black on `--brand`** (`.btn-hero`) | **10.11:1** | AAA |
| Black on `--brand-d` (hover, if black text kept) | 5.94 | AA |
| White on `--acc` (`.badge.acc`, sidebar chip) | 5.54 | AA |
| `--acc` on `--bg` (promo eyebrow, icons) | 3.79 | AA for large text and icons only |
| White on `#b3321f` (`.btn-d`) | 6.19 | AA |
| `#2f9e6e` / `#d3524a` on `--surf` (chart) | 5.77 / 4.70 | non-text, pass |

**Defects in the preview source (these must be resolved before implementation, see §14):**

| # | Defect | Ratio | Where it occurs |
|---|---|---|---|
| D1 | **White text on gold** | **2.08:1 (fails AA)** | `.btn-p`, `.promo .btn-p`, `.ftr .sub .btn`, `.cnt`, `.stepcard .sh i`, `.range span.on`, `.tick.on`. The hover state (white on `#A9823A`) is 3.53:1, also failing for normal text. |
| D2 | **"New" badge is invisible** | **1.00:1** | `.badge.dark` is `background: var(--ink)` (white) with `color:#fff`. |
| D3 | Green "% off" and `.preflight` text on black | 3.09:1 / 2.86:1 | `.price .off` (`#17683f` on `--bg`/`--surf`). |
| D4 | Danger text on black | 3.06:1 | `.hint.err` (`#a82d1a`). The error border `#b3321f` is 3.39:1. |
| D5 | Hairlines are barely visible | `--line` vs `--bg` 1.39:1, vs `--surf` 1.28:1 | Every border, including form-field borders (WCAG 1.4.11 asks 3:1 for input boundaries). |
| D6 | Surfaces barely separate | `--surf` vs `--bg` 1.08:1; `--soft` vs `--bg` 1.16:1 | Cards and tiles are distinguishable only by their hairline. |

**[REC] corrections** (not in the preview; pending approval):
- D1: use **`#000000` text on every gold fill** (the preview already does this for `.btn-hero`). 10.11:1 at rest, 5.94:1 on hover.
- D2: give the "New" badge `background: var(--acc); color: var(--acc-ink)` or `background:#fff;color:#000`; never `--ink` fill with white text.
- D3/D4: on black, use lighter semantic text colours (values need to be chosen and approved; none are defined in the preview).
- D5: consider a lighter field border (value to be chosen) while keeping `#262626` for decorative dividers.

---

## 3. Typography

### 3.1 Fonts [SRC]

| Role | Family | Fallback stack | Weights used |
|---|---|---|---|
| Display / headings | **Space Grotesk** | `system-ui, sans-serif` | 600 (`--disp-w`) |
| Body / UI | **Inter** | `system-ui, sans-serif` | 400, 500, 600, 700 |

Loaded in the preview via Google Fonts (`index.html:9`): `Space+Grotesk:wght@500;600;700` and `Inter:wght@400;500;600;700`, `display=swap`. The preview's link also loads fonts used by *other* themes; **none of those belong to this theme**. This theme needs only Space Grotesk and Inter.

Rendering: `-webkit-font-smoothing: antialiased` on `body` [SRC, studio level].

### 3.2 Which font applies where [SRC]

The base rule `.frame h1,h2,h3,h4,.disp` sets **Space Grotesk 600, −0.02 em, line-height 1.12**. Many card-level headings then override back to **Inter**. Do not assume every heading is Space Grotesk.

| Space Grotesk (display) | Inter (body) even though the element is a heading |
|---|---|
| Hero `h1`; section `h2` (`.sec-head h2`); promo `h2`; PDP `h1`; page-head `h1` (Cart/Checkout); customiser panel `h1`; admin page `h1`; `.step .n` numerals; the `.logo` wordmark | `.cat h3`, `.prod h3`, `.step h3`, `.line h3`, `.sumcard h3`, `.chart h3`/`.tbl h3`/`.listc h3`, `.opt h4`, `.ftr h4`, all prices, KPI values, buttons, nav, inputs |

### 3.3 Text styles (desktop value, then ≤760 px container value) [SRC]

| Style | Font | Size | Weight | Line-height | Tracking | Selector |
|---|---|---|---|---|---|---|
| Body base | Inter | 15 px | 400 | 1.55 | normal | `.frame` |
| Hero H1 | Space Grotesk | `clamp(36px, 5.4cqw, 70px)` → mobile `clamp(36px, 10.5cqw, 52px)` | 600 | 1.12 | −0.02 em | `.hero h1` |
| Section H2 | Space Grotesk | 38 px → 28 | 600 | 1.12 | −0.02 em | `.sec-head h2` |
| Promo H2 | Space Grotesk | 38 px → 30 | 600 | 1.12 | −0.02 em | `.promo h2` |
| PDP / page-head H1 | Space Grotesk | 40 px → 30 | 600 | 1.12 | −0.02 em | `.pdp h1`, `.pagehead h1` |
| Customiser H1 | Space Grotesk | 28 px | 600 | 1.12 | −0.02 em | `.cz-panel > h1` |
| Admin page H1 | Space Grotesk | 30 px → 24 | 600 | 1.12 | −0.02 em | `.ph-row h1` |
| Step numerals | Space Grotesk | 44 px | 600 | 1 | −0.02 em | `.step .n` |
| Logo wordmark | Space Grotesk | 26 px → 23 (admin sidebar 22) | 600 | — | −0.02 em | `.logo` |
| Hero lead | Inter | 18 px → 16 | 400 | 1.55 | normal | `.hero .lead` |
| Eyebrow | Inter | 12 px | 700 | 1 | 0.16 em, UPPERCASE | `.eyebrow` |
| Nav link | Inter | 14.5 px (→ 13.5 at ≤1040) | 500 | — | — | `.nav` |
| Announcement | Inter | 12.5 px → 11.5 | 500 | — | 0.02 em | `.announce` |
| Button | Inter | 14.5 px (sm 13.5, lg 15.5) | 600 | — | — | `.btn` |
| Badge | Inter | 11.5 px | 600 | — | — | `.badge` |
| Field label | Inter | 13 px | 600 | — | — | `.field label` |
| Input text | Inter | 15 px | 400 | — | — | `.inp` |
| Hint / error | Inter | 12.5 px | 400 | — | — | `.hint` |
| Category name | Inter | 16 px | 600 | — | — | `.cat h3` (+ `span` 13 px muted) |
| Product category label | Inter | 12.5 px | 600 | — | 0.08 em, UPPERCASE | `.prod .cat-l` |
| Product title | Inter | 16 px (14.5 mobile) | 600 | 1.3 | — | `.prod h3` |
| Price | Inter | 18 px (PDP 30 px) | 700 | — | — | `.price b` |
| Struck price / % off | Inter | 14 px / 13 px | 400 / 600 | — | — | `.price s`, `.price .off` |
| Step title | Inter | 19 px | 600 | — | — | `.step h3` |
| Review quote | Inter | 16 px | 400 | — | — | `.rv p` |
| Footer heading | Inter | 12 px | 700 | — | 0.14 em, UPPERCASE | `.ftr h4` |
| Footer link / copy | Inter | 14 px / 13 px | 400 | — | — | `.ftr ul`, `.ftr .bot` |
| Option heading | Inter | 13 px | 700 | — | 0.04 em | `.opt h4` |
| Font-picker sample | (the font being previewed) | 22 px | — | 1.1 | — | `.fontc` |
| Cart line title / amount | Inter | 16 px / 17 px | 600 / 700 | — | — | `.line h3`, `.line .amt` |
| Summary heading / total row | Inter | 19 px / 18 px | 700 | — | — | `.sumcard h3`, `.sumrow.tot` |
| Customiser total | Inter | 26 px | 700 | — | — | `.sumbar .row b` |
| Admin nav item | Inter | 14 px | 500 | — | — | `.side a` |
| Admin nav group label | Inter | 10.5 px | 700 | — | 0.14 em, UPPERCASE | `.side h5` |
| KPI label / value | Inter | 13 px / 28 px (→ 22) | 500 / 700 | — | value −0.01 em | `.kpi .t`, `.kpi .v` |
| Table header / cell | Inter | 11.5 px / 14 px | 600 / 400 | — | 0.08 em UPPERCASE (header) | `.tbl th`, `.tbl td` |
| Order id (mono) | `ui-monospace, SFMono-Regular, Menlo, monospace` | 13 px | 400 | — | — | `.mono` |

`cqw` is 1 % of the **`.frame` container width**, not the viewport. At a 1280 px frame the hero H1 is ≈ 69.1 px [DER]; at 820 px ≈ 44.3 px; at the 372 px mobile frame ≈ 39.1 px.

---

## 4. CSS variables and design tokens

### 4.1 Preview mechanism [SRC]
Each theme is injected as `[data-theme="industrial-obsidian"]{ --brand:…; … }` (`app.js:94-95`). Components read only `var(--token)`. The themed region sets `container: f/inline-size` on `.frame`, and `--card-r: calc(var(--r) + 4px)`.

### 4.2 The Industrial Obsidian variable block (resolved) [SRC]+[DER]

```css
[data-theme="industrial-obsidian"] {
  --brand:        #D9AE4E;
  --brand-d:      #A9823A;
  --soft:         #161616;
  --bg:           #000000;
  --surf:         #0D0D0D;
  --ink:          #FFFFFF;
  --muted:        #8A8A8A;
  --line:         #262626;
  --alt:          #141414;
  --acc:          #3D6AA3;
  --acc-ink:      #FFFFFF;
  --band:         #000000;
  --hero-bg:      #000000;
  --hero-fg:      #FFFFFF;
  --hero-fg2:     #D9AE4E;
  --hero-arch:    #161616;
  --hero-btn:     #D9AE4E;
  --hero-btn-fg:  #000000;
  --fig:          #D9AE4E;
  --fig2:         #f2f2f6;            /* shared-base default */
  --r:            4px;
  --disp-w:       600;
  --disp-ls:      -0.02em;
  --disp:         "Space Grotesk", system-ui, sans-serif;
  --body:         "Inter", system-ui, sans-serif;
  --card-r:       calc(var(--r) + 4px);   /* = 8px */
}
```

The verbatim source object is reproduced in **Appendix A**.

### 4.3 Spacing, radius, elevation (from the preview's design-system page) [SRC]

| Scale | Values |
|---|---|
| Spacing base | 4 px unit; components use **4 / 8 / 12 / 16 / 24 / 32 / 48 / 64** |
| Radius | small `0` · control `4px` · card `8px` · promo `16px` · pill `999px` |
| Elevation (as defined) | Card `0 1px 2px rgba(20,20,30,.05), 0 8px 24px -12px rgba(20,20,30,.14)` · Popover `0 4px 10px rgba(20,20,30,.08), 0 20px 40px -16px rgba(20,20,30,.22)` · Dialog `0 30px 70px -24px rgba(20,20,30,.4)` |

**Important:** the elevation values above are shown on the design-system page only. In the real components, **cards have no `box-shadow`**. Shadows are applied only to: `.float` (`0 18px 40px -18px rgba(0,0,0,.35)`), `.prod .wish` (`0 4px 12px -4px rgba(0,0,0,.25)`), `.sticky-buy` (`0 -10px 30px -16px rgba(0,0,0,.3)`), and the light viewport widgets. On a `#000` page, dark shadows are essentially invisible, so elevation in this theme is carried by borders [DER].

### 4.4 Proposed Tailwind v4 `@theme` mapping for the app [REC]

The app defines tokens in `apps/customer-frontend/src/index.css` under `@theme`. Mapping preview → app token names:

| Preview | App token (existing name kept) | New value | Note |
|---|---|---|---|
| `--bg` | `--color-paper` | `#000000` | |
| `--surf` | `--color-surface` | `#0D0D0D` | |
| `--ink` | `--color-ink` | `#FFFFFF` | see §12 rule on `bg-ink` |
| `--muted` | `--color-muted` | `#8A8A8A` | |
| `--line` | `--color-border` | `#262626` | |
| `--brand` | `--color-accent` | `#D9AE4E` | |
| `--brand-d` | `--color-accent-dark` | `#A9823A` | |
| `--soft` | `--color-accent-soft` | `#161616` | now a dark tile, not a tint |
| `--alt` | **new** `--color-alt` | `#141414` | |
| `--band` | **new** `--color-band` | `#000000` | |
| `--acc` | **new** `--color-secondary` | `#3D6AA3` | the blue accent |
| `--acc-ink` | **new** `--color-on-secondary` | `#FFFFFF` | |
| `--hero-btn-fg` | **new** `--color-on-accent` | `#000000` | text on gold, applies to all gold fills [REC] |
| `--r` | `--radius-control` | `4px` | was 0.65rem |
| `--card-r` | `--radius-card` | `8px` | was 1rem |
| `--disp` | `--font-display` | `"Space Grotesk", system-ui, "Segoe UI", sans-serif` | |
| `--body` | `--font-sans` | `"Inter", system-ui, "Segoe UI", sans-serif` | |

Also set `:root { color-scheme: dark; }` (currently `light`). Danger/success tokens: see §14 Q6.

---

## 5. Component-by-component specification

All values are **[SRC]** unless tagged. "Resolved" means the Industrial token values are substituted.

### 5.1 Buttons (`.btn`)

Base: `display:inline-flex; align-items:center; justify-content:center; gap:9px; height:48px; padding:0 24px; border-radius:4px; border:1px solid transparent; font:600 14.5px Inter; white-space:nowrap; cursor:pointer; text-decoration:none`. Icon inside: 18×18.

| Variant | Class | Resolved style |
|---|---|---|
| Primary | `.btn-p` | bg `#D9AE4E`, text `#FFF` **(fails, see D1; [REC] text `#000`)**; hover bg `#A9823A` |
| Secondary | `.btn-s` | bg `#0D0D0D`, text `#FFF`, border `1px #262626`; hover border `#D9AE4E` and text `#D9AE4E` |
| Ghost | `.btn-g` | transparent, text `#D9AE4E`, `padding:0 12px` |
| Danger | `.btn-d` | bg `#b3321f`, text `#fff` |
| Hero primary | `.btn-hero` | bg `#D9AE4E`, text `#000000` (no hover rule defined) |
| Hero secondary | `.btn-hero2` | transparent, text `#FFF`, border ≈ `#474747` |

| Size | Class | Height | Horizontal padding | Font |
|---|---|---|---|---|
| Small | `.btn-sm` | 38 px | 16 px | 13.5 px |
| Default | `.btn` | 48 px | 24 px | 14.5 px |
| Large | `.btn-lg` | 54 px | 30 px | 15.5 px |
| Block | `.btn-block` | — | `width:100%` | — |

Disabled: `opacity:.45; pointer-events:none`. Focus (demo class `.btn.focus`): `outline:3px solid color-mix(in srgb,#D9AE4E 35%,transparent); outline-offset:2px`.
Rule from the design-system page: **one primary action per view**; gold fill is for the single most important action.

### 5.2 Badges (`.badge`)

`inline-flex; gap:6px; height:24px; padding:0 10px; border-radius:999px; font:600 11.5px Inter`.

| Variant | Background | Text | Used for |
|---|---|---|---|
| default | `#161616` | `#A9823A` | neutral status, KPI label chip |
| `.acc` | `#3D6AA3` | `#FFFFFF` | "Best seller", "Made to order" |
| `.dark` | `#FFFFFF` | `#FFFFFF` | "New" — **invisible, defect D2** |
| `.ok` | `#e3f4ea` | `#17683f` | delivered, positive delta, "Secure", "Confirmed" |
| `.warn` | `#fcefd0` | `#8a5c00` | processing |
| `.bad` | `#fbe6e2` | `#a82d1a` | cancelled, negative delta |

Status badges carry a 6 px dot (`.dot`, `currentColor`) plus a text label; status is never colour-only.

### 5.3 Inputs and form controls

| Control | Style |
|---|---|
| Field wrapper `.field` | `display:grid; gap:6px`; label above (600 13 px), hint/error below, never both |
| Input `.inp` | `height:46px; width:100%; border:1px solid #262626; background:#0D0D0D; border-radius:4px; padding:0 14px; font:400 15px Inter; color:#FFF` |
| Error | border `#b3321f`; hint `.hint.err` colour `#a82d1a` |
| Disabled `.inp.off` | bg `#141414`, text `#8A8A8A` |
| Focus `.inp.focus` | same 3 px gold-35 % outline, offset 2 px |
| Checkbox `.tick` | 20×20, `border:1.5px solid #262626`, radius 5 px, bg `#0D0D0D`; `.on` bg `#D9AE4E`, border gold, check icon 13 px stroke 2.4, icon colour `#fff` (**D1**) |
| Toggle `.tog` | 42×24, radius 99, off `#262626`, on `#D9AE4E`; thumb 18 px `#fff` at left 3 px (off) / 21 px (on) |
| Radio card `.radio` | `border:1px solid #262626; radius 4px; padding:14px 16px; bg #0D0D0D; gap:14px`; dot 18 px circle; `.on` border gold + `inset 0 0 0 1px gold`, bg `#161616`, inner dot 8 px gold; price `.r` right-aligned 600 |
| Pill option `.pill` | `height:44px; padding:0 18px; border:1px solid #262626; radius 4px; bg #0D0D0D; font-weight:500`; `.on` border gold, inset 1px gold, text gold, bg `#161616` |
| Quantity `.qty` | `height:54px; border:1px solid #262626; radius 4px; bg #0D0D0D`; buttons 44 px wide; value min-width 30 px, 600; cart-line variant height 40 / buttons 36 |
| Drop zone `.drop` | `1.5px dashed #776338; radius 8px; bg #161616; padding:22px; gap:16px; text #A9823A`; icon circle 48 px bg `#0D0D0D` icon gold; title `#FFF`; sub 13 px muted |
| Swatch `.swatches i` | 24 px circle, `box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)`; `.on` → `outline:2px solid #D9AE4E; outline-offset:2px`; gap 8 px |

Preview inputs are `div` elements (mock). Real implementation must use real `<input>` controls with these styles.

### 5.4 Cards and surfaces

| Surface | Style |
|---|---|
| `.card` | `bg #0D0D0D; border:1px solid #262626; radius 8px`; no shadow. `.card.pad` padding 24 |
| `.ph` image tile | `bg #161616; radius 8px; overflow:hidden; position:relative`; `.alt1` bg `#141414`; `.alt2` bg `#1F3046`; tint cycles `['', alt1, alt2]` by index |
| `.float` (hero floating card) | bg `#0D0D0D`, text `#FFF`, radius 8, padding `12px 16px`, shadow as §4.3, icon circle 38 px bg `#161616` icon gold; label 14 px/600 + 13 px muted |
| `.assure` | bg `#141414`, radius 8, padding 20, gap 12, 14 px text, icons inline |
| `.sec.alt` | full-width band bg `#141414` |

### 5.5 Icons [SRC]
One outline set, 24×24 viewBox sprite referenced with `<use href="#i-name">`. `.ic`: `20×20; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap/linejoin:round`. The `star` icon is the only filled one (`fill:currentColor; stroke:none`). Sizes in use: 12, 13, 14, 16, 18, 19, 20 (default), 24. Rule: "No emoji anywhere in the interface". Full verbatim sprite in **Appendix B**. Colour is always inherited (`currentColor`): gold in icon circles/links/stars, ink in header buttons, muted elsewhere.

Stars (`.stars`): 14 px icons, 1 px gap, colour `#D9AE4E`. Rating row: 13 px muted, stars + "4.9 (812)".

### 5.6 Announcement bar (`.announce`)
bg `#000000`, text `#FFFFFF`, `font:500 12.5px Inter`, centred, `padding:9px 16px`, `letter-spacing:.02em`, **no border**. Because bg equals page bg it reads as part of the canvas; the header's bottom hairline is the only separator. Mobile: 11.5 px. Sample copy: "Free shipping over ₹999 · Made to order and dispatched in 3 working days".

### 5.7 Header (`.hdr`)

| Property | Value |
|---|---|
| Background / border | `#0D0D0D` / `border-bottom:1px solid #262626`; `position:relative` (**not sticky in the preview**) |
| Inner `.wrap` | `display:flex; align-items:center; gap:32px; height:76px; padding:0 40px; max-width:1200px; margin:0 auto` |
| Logo | `<img>` 40×40, `border-radius:50%`, `object-fit:contain`, + wordmark text "JAS 3D Printing"; wordmark Space Grotesk 600 26 px; gap 10 px |
| Nav `.nav` | `flex:1; display:flex; gap:22px; font:500 14.5px Inter`; link `padding:6px 0; border-bottom:2px solid transparent; color:#FFF; white-space:nowrap`; **active** `border-color:#D9AE4E; color:#D9AE4E` |
| Nav items | Home · Shop all · Gifts for couples · Corporate · 3D Customiser · Contact |
| Search pill `.srch` | height 42, width 220, radius 999, bg `#141414`, text muted 14 px, padding `0 16px`, search icon 18 px |
| Icon button `.iconbtn` | 42×42 circle, transparent, icon `#FFF`; hover bg `#161616` |
| Count chip `.cnt` | abs `top:3px; right:2px`; `min-width:18px; height:18px; radius 9px; bg #D9AE4E; text #fff 700 10.5px` (**D1**) |
| Tools | search pill, account, wishlist (hidden ≤760), cart with count |

Mobile (≤760): height 64, menu button first, logo `flex:1` at 23 px, search icon button, cart; nav, search pill, account and wishlist hidden. **The preview never shows the opened mobile menu** (see §14).

### 5.8 Footer (`.ftr`)
bg `#000000`, text `#8A8A8A`, `padding:64px 0 28px`, `border-top:1px solid #262626`. Grid `1.5fr 1fr 1fr 1.3fr`, gap 40. Logo text `#FFF`. Column headings: 700 12 px, 0.14 em, uppercase, `#FFF`, margin-bottom 16. Lists: no bullets, gap 10, 14 px. Newsletter: flex gap 8, margin-top 14; input height 44 bg `#0D0D0D` border `#262626` text `#FFF`; button height 44 bg `#D9AE4E` text `#fff` (**D1**). Bottom row: margin-top 44, padding-top 22, `border-top:1px solid #262626`, 13 px, space-between, wraps. Copyright "© 2026 JAS 3D Printing. All rights reserved." and "Privacy · Terms · Refunds".

### 5.9 Product card (`.prod`)

| Part | Style |
|---|---|
| Tile | `.ph` with product illustration filling width; aspect 1:1 |
| Badge | abs `left:12px; top:12px` |
| Wishlist `.wish` | abs `right:12px; top:12px`; 36 px circle bg `#0D0D0D` text `#FFF`; shadow `0 4px 12px -4px rgba(0,0,0,.25)`; icon 18 px |
| Category label | 12.5 px, 600, uppercase, 0.08 em, muted; margin-top 16 |
| Title | Inter 600 16/1.3; margin 4 0 |
| Rating row | flex, gap 8, 13 px muted, margin 6 0 |
| Price row | flex, baseline, gap 8, margin-top 6; `b` 700 18; `s` muted 14; `.off` `#17683f` 600 13 |
| CTA | `.btn-s .btn-sm`, `width:100%`, `margin-top:14px` ("Personalise") |

Grid `.prods`: 4 columns, gap 24 (2 columns ≤1040; gap 14 at ≤760). Category tile grid `.cats`: 6 columns, gap 18 (3 ≤1040, 2 at ≤760 with gap 12); tile hover `transform:translateY(-3px)` with `transition:transform .2s` (the **only** transition in the source).

### 5.10 Promo / customiser band (`.promo`)
bg `#000000`, `border:1px solid #262626`, radius 16, `overflow:hidden`, grid `1fr 1.05fr`. Text block padding `64px 56px`. Eyebrow colour `#3D6AA3`. H2 38 px `#FFF`, margin `16px 0 18px`. Paragraph muted, `max-width:44ch`. List: gap 12, text `#FFF`, check icons `#3D6AA3`; margin `26px 0 32px`. Button `.btn-p .btn-lg`. Right side `.vp` viewport (see §5.12).

### 5.11 Trust strip (`.trust`)
bg `#0D0D0D`, `border-bottom:1px solid #262626`. 4 columns, gap 20, padding `24px 0`. Item: icon circle 44 px bg `#161616` icon gold; bold 14 px title + muted 13 px sub.

### 5.12 3D viewport island (`.vp`) and controls
`min-height:420px` (customiser 720, mobile 320 / 340), `background:#f3f6fb` with two `linear-gradient(#dbe4f0 1px,transparent 1px)` layers at `background-size:32px 32px`; content centred; artwork width `min(86%,430px)` (customiser `min(78%,560px)`).

| Overlay | Position / style |
|---|---|
| Hint chip `.hintchip` | top 16, centred; `rgba(255,255,255,.92)` bg, `#1d2230` text, 999 radius, `6px 14px`, 500 12 px |
| Tool buttons `.tools button` | right 16, top 16, 38 px circles, `#fff` bg, `#1d2230` icon, shadow `0 4px 14px -6px rgba(0,0,0,.3)`, vertical gap 8 |
| Size chip `.dim` | left 18, bottom 16; `rgba(255,255,255,.92)`, 8 px radius, `7px 12px`, 600 12 px |
| Mini panel `.mini-panel` | right 20, bottom 20, width 210, `#fff`, radius 14, padding 14, deep shadow, gap 10 (hidden ≤760) |

### 5.13 Customiser panel (`.cz`, `.cz-panel`, `.stepcard`)
Layout: grid `1.5fr 1fr`, `min-height:720px`, `border-top:1px solid #262626`. Panel: bg `#0D0D0D`, `padding:26px 28px`, `gap:14px`, `border-left:1px solid #262626`.

| Part | Style |
|---|---|
| Step card | `border:1px solid #262626; radius 8px; padding:18px 20px; gap:14px` |
| Step header `.sh` | flex, gap 12, 600; number circle 28 px bg `#D9AE4E` text `#fff` 700 13 px (**D1**); right-aligned value 500 13 px muted |
| Font cards `.fonts` | 3 columns gap 10; `.fontc` border `#262626`, radius 4, padding `12px 8px`, centred, 22 px/1.1; sub-label 500 11 px muted; `.on` border gold, bg `#161616`, inset 1px gold |
| Thickness `.segc` | 3 columns gap 8; cell border line, radius 4, padding 10, 600 14 px, sub 500 11.5 px muted; `.on` border gold, bg `#161616`, text `#A9823A` |
| Disclosure `.disc` | border line, radius 8, `14px 20px`, 600, chevron right |
| Preflight `.preflight` | bg `#e8f5ee` text `#17683f`, radius 4, `12px 14px`, 13.5 px, icon + bold lead line (light panel on dark UI, fixed) |
| Summary bar `.sumbar` | gap 12; total row flex space-between baseline; total 700 26 px; full-width `.btn-p .btn-lg` |

### 5.14 Cart and checkout
| Part | Style |
|---|---|
| Page head `.pagehead` | padding `34px 0 26px`; H1 40 px |
| Two-column `.two` | grid `1.6fr 1fr`, gap 36, `align-items:start`, bottom padding 70 |
| Cart line `.line` | grid `104px 1fr auto`, gap 20, padding `22px 0`, `border-bottom:1px solid #262626` (last none); title 600 16; specs 13 px muted, gap 2, margin `4px 0 12px`; "Remove" muted 13 px underlined, margin-left 14; amount 700 17 right-aligned |
| Summary `.sumcard` | `.card`, padding 28, `position:sticky; top:20px`; rows flex space-between padding 8 muted, values `#FFF` 600; total row `border-top:1px solid #262626; margin-top:10; padding-top:18; 700 18` |
| Free-shipping bar `.ship-bar` | height 6, radius 9, track `#161616`, fill gold (here 100 %) |
| Promo input row | flex gap 8, margin `16px 0 8px`; input + `.btn-s` |
| Checkout stepper `.steps` | flex gap 12, 600 14; circle 28 px `border:1.5px solid #262626`; `.on` gold fill, `#fff` number (**D1**); `.done` bg `#161616`, gold border, gold check; connector 36×1.5 `#262626` |
| Form grid `.fgrid` | 2 columns gap 16; `.full` spans both (1 column ≤760) |
| Delivery / payment | `.radio` cards stacked, gap 10 |
| Order lines in summary `.mini-line` | grid `56px 1fr auto`, gap 12, padding 10 0, 14 px |

### 5.15 Admin
| Part | Style |
|---|---|
| Shell `.adm` | grid `248px 1fr`, `min-height:860px`, bg `#000` |
| Sidebar `.side` | bg `#000`, text `#8A8A8A`, `padding:22px 14px`, column, gap 6, `border-right:1px solid #262626` |
| Sidebar logo | 32 px circular image + text 22 px, padding `0 10px 18px` |
| Group label `.side h5` | 700 10.5 px, 0.14 em uppercase, muted, margin `14px 10px 6px` |
| Nav item `.side a` | flex, gap 12, padding `10px 12px`, radius 4, 500 14 px; **active** bg `#161616`, text `#FFF` |
| Count chip | static, `margin-left:auto`, bg `#3D6AA3`, text `#FFF` |
| User block `.me` | pinned bottom, `border-top:1px solid #262626`, padding `12px 10px`, 13 px; avatar bg `#3D6AA3` text `#FFF` |
| Main `.main` | padding `0 32px 40px` |
| Top bar `.top` | height 72, gap 16; search pill bg `#0D0D0D` border `#262626` max-width 420; bell with count; avatar |
| Page head `.ph-row` | flex space-between, align end, margin `6px 0 22px`; H1 30 px; sub muted |
| Date range `.range` | segmented, bg `#0D0D0D`, border line, radius 4, padding 3; items `6px 12px` 600 13 muted; `.on` bg gold text `#fff` (**D1**) |
| KPI cards `.kpis` | 4 columns gap 16; `.kpi` padding 20; label row muted 13 px with 34 px icon circle (bg `#161616`, gold); value 700 28 px; delta badge (`ok`/`bad`) with text "vs last period" |
| Charts row `.grid2` | `1.7fr 1fr`, gap 16, margin-top 16 |
| Bar chart | `.bars` grid `36px 1fr`, height 330; y-axis 11.5 px muted; plot 12 columns gap 10 with `repeating-linear-gradient` hairlines every 25 % in `#262626`; bar radius `6px 6px 0 0`, fill `#463A1F`; highlighted (latest) bar `#D9AE4E`; month labels 11 px muted below |
| Orders by status | 12 px stack bar (gap 2, radius 99) in gold / blue / `#2f9e6e` / `#d3524a`; legend 13 px with 10 px swatches and bold % at right |
| Top products list `.li` | grid `48px 1fr auto`, gap 12, padding 12 0, hairline between |
| Orders table `.tbl` | card padding 22; table min-width 560; header 11.5 px uppercase muted with bottom hairline; cells padding `14px 12px`, bottom hairline; **row hover bg `#141414`**; numeric columns right-aligned; id in mono |

---

## 6. Page-by-page visual specification

Copy in the preview is **sample copy** and not final.

### 6.1 Homepage (section order) [SRC `app.js:193-242`]
1. Announcement bar → 2. Header → 3. **Hero** → 4. Trust strip → 5. "Shop by category" (`.sec`, black) → 6. "Best-selling gifts" (`.sec.alt`, `#141414`) → 7. Promo/3D customiser band (`.sec`) → 8. "How it works" (`.sec.alt`) → 9. Reviews (`.sec`) → 10. Footer.

Sections alternate black and `#141414`; vertical padding 84 px (64 ≤1040, 48 ≤760); section heads: eyebrow (gold) + 38 px H2, optional right-hand link (gold, 600, arrow icon) or muted paragraph (`max-width:44ch`).

**Hero**
| Property | Value |
|---|---|
| Background / text | `#000000` / `#FFFFFF` |
| Layout | grid `1.02fr .98fr`, gap 40, `min-height:620px`, align center, padding-top 40; **effective padding-bottom 0** [DER, `styles.css:518` overrides line 159]; text column `align-self:center; padding-bottom:48px`; art column `align-self:end` so the scene sits flush with the bottom edge |
| Eyebrow | white at 85 % opacity, 28×2 px line before it (`currentColor`, 10 px gap) |
| H1 | see §3.3; margin `20px 0` |
| Lead | gold `#D9AE4E`, 18 px, `max-width:46ch` |
| CTAs | flex gap 12, margin `32px 0 36px`, wrap; `.btn-hero .btn-lg` (gold, black text, arrow icon) + `.btn-hero2 .btn-lg` (ghost) |
| Mini row | flex gap 28, wrap, gold, 13.5 px, 20 px icons: "Ships in 3 days", "Secure checkout", "4.8 average rating" |
| Art | SVG 640×560: arch path filled `#161616`; blue disc (`#3D6AA3`, r 54, 85 % opacity) at top-right; blurred floor ellipse in `#FFF` at 12 % opacity; four product illustrations; faint white sheen gradient over the arch |
| Floating card | left −8, top 120; icon + "Preview in 3D / Before we print"; hidden ≤760 |

**Category tiles:** 6 columns of `.ph` tiles (tinted by index) + name + muted "24 designs".
**Trust strip, product cards, promo, steps, reviews, footer:** as §5.

How-it-works cards: 3 columns gap 24, `.card.step` padding 30; numeral `01/02/03` in Space Grotesk 44 px gold at 90 % opacity; title Inter 600 19 px margin `18px 0 8px`; text muted.
Reviews: 3 columns gap 24, `.card.rv` padding 28; stars; quote 16 px margin `14px 0 20px`; author row: 40 px avatar circle (bg `#161616`, text `#A9823A`, 700 13 px initials) + bold name 14 px + muted city 13 px.

### 6.2 Product catalog [NOT mocked in the preview]
The preview has **no catalog/listing page and no filter UI**. The nearest elements are the home "Best-selling gifts" grid, `.prod` card and `.pill` options. [EST] Build the listing from: section head (eyebrow + 38 px H2), 4-column `.prods` grid, `.pill` chips for filters/sort, `.btn-s` actions, `.card` surfaces. Document any choice made here as an implementation decision.

### 6.3 Product detail (`pdp`) [SRC `app.js:244-275`]
Header (active "Shop all") → breadcrumb (`.crumbs`: 13 px muted, chevrons rotated −90°, current page `#FFF` bold) → two columns `1.05fr 1fr`, gap 56 (32 ≤1040; 1 column, gap 26, ≤760).
- **Gallery:** grid `84px 1fr`, gap 16; thumbnails (gap 12) are `.ph` tiles with `2px solid transparent` border, radius 4, selected `border-color:#D9AE4E`; main tile with badge at `left:16; top:16`. ≤760: single column, thumbnails in a 4-column row placed *after* the main image.
- **Info:** eyebrow, H1 40 px (margin `12px 0 10px`), rating row, price (30 px bold + struck + % off), description (muted, `max-width:52ch`), option groups (`.opt`, margin-top 26: heading 700 13 px with muted selected value on the right), pill sizes, engraving field + hint "24 of 40 characters", drop zone, **buy row** (grid `auto 1fr`, gap 12, margin-top 28: qty + `.btn-p .btn-lg .btn-block`), full-width `.btn-s .btn-lg` "Preview in 3D" (margin-top 12), assurance box (`.assure`), accordion (`details`, border-top and bottom hairlines, padding `16px 0`, summary 600 with chevron, body muted).
- **Related:** section head "Pairs well with" (H2 30 px) + 4-column `.prods`.
- **Mobile sticky buy bar:** `position:sticky; bottom:0; z-index:5`, flex, gap 12, bg `#0D0D0D`, `border-top:1px solid #262626`, padding `12px 18px`, shadow `0 -10px 30px -16px rgba(0,0,0,.3)`; price 700 18; button `flex:1; height:46px`.

> Note: the preview PDP places "Preview in 3D" as a secondary button. The application owner has separately decided the customiser link lives **only in the homepage Hero**; this must be resolved before building the PDP (§14 Q8).

### 6.4 Customiser (`cz`) [SRC `app.js:277-297`]
Header (active "3D Customiser", no announcement bar) → grid `1.5fr 1fr` (1:1 at ≤1040, stacked at ≤760: viewport 340 px tall, panel border-top instead of border-left, padding `20px 18px`). Panel contents in order: eyebrow "Customise", H1 product name, four step cards (1 Your text · 2 Font · 3 Colour · 4 Thickness), "Shape and advanced options" disclosure, preflight, summary bar. Viewport includes hint chip, three tool buttons, live-size chip. Footer follows.

### 6.5 Cart and checkout [SRC `app.js:299-333`]
Cart: announcement + header, page head "Your cart", `.two` layout (lines card + sticky summary). Checkout (rendered below cart in the preview): header only, page head "Checkout", stepper (Cart ✓ → Address → Delivery → Payment), left column of three cards (Delivery address with an inline validation error example, Delivery options, Payment), right order summary card with mini-lines and a "Price check — Confirmed" row, `.btn-p .btn-lg .btn-block` "Place order".

### 6.6 Admin dashboard [SRC `app.js:335-362`]
Sidebar + main as §5.15. Order of main content: top bar → page head with date range → 4 KPI cards → chart + status/top-products row → recent-orders table. Nav groups: Overview (Dashboard, Reports), Catalog (Products, Categories), Sales (Orders [count 12], Customers), System (Settings).

### 6.7 Pages that are **not** mocked [EST]
Login, Register, Addresses, Order success, My orders, Order details, Track order, Contact, 404, Products listing; admin Login, Products list/form, Categories, Orders list/detail, Customers, Reports, Settings. Compose these only from the components in §5 and record each choice.

---

## 7. Layout dimensions, spacing and sizing

| Item | Value |
|---|---|
| Content container `.wrap` | `max-width:1200px; padding:0 40px` (28 px ≤1040; 18 px ≤760) |
| Section padding | 84 px vertical (64 ≤1040; 48 ≤760) |
| Section head | margin-bottom 34 (24 ≤760); H2 margin-top 12 |
| Header height | 76 px (64 ≤760) |
| Hero min-height | 620 px (0 ≤900) |
| Card radius / control radius | 8 px / 4 px |
| Control heights | input 46; button 38 / 48 / 54; pill 44; quantity 54 (40 in cart); search pill 42; icon button 42; badge 24 |
| Icon circles | 34 (admin KPI), 36 (wishlist), 38 (float/tools), 44 (trust), 48 (drop zone), 40 (avatar) |
| Grid gaps | cats 18, prods 24, how/reviews 24, footer 40, pdp 56, cart 36, kpis 16 |
| Admin | sidebar 248 (76 icon rail ≤1040), top bar 72, content padding 32 |

---

## 8. Responsive behaviour

The preview responds to the **frame (container) width**, via `container: f/inline-size`. Device frames: desktop `max-width:1280`, tablet `820`, mobile `390` with a 9 px device border → **372 px usable** [DER].

| Breakpoint | Rules added |
|---|---|
| **≤1040** (twice in source; later block wins) | `.wrap` 28 px; section padding 64; nav gap 16 and 13.5 px; **header search pill hidden**; categories 3 columns; products 2 columns; promo 1 column (text padding `44px 36px`); PDP gap 32; customiser 1:1; KPIs 2 columns; admin charts stack; **admin sidebar → 76 px icon rail** (labels, group titles, user name and count chips hidden); footer 2 columns |
| **≤900** | hero 1 column, min-height 0, padding-top 44, text padding-bottom 8, art `max-width:560px` centred; trust strip 2 columns |
| **≤760** | `.wrap` 18; section padding 48; section head stacks; header 64 px with menu + search icon buttons, nav/search pill/account/wishlist hidden; announcement 11.5 px; hero H1 `clamp(36px,10.5cqw,52px)`, lead 16, eyebrow rule and floating card hidden, CTAs fill width; trust 2 columns; categories 2 columns (gap 12); product CTA height 40 / 13 px; promo padding `34px 22px`, H2 30, viewport 320 tall, mini panel hidden; how/reviews 1 column; footer 2 columns with brand block full-width; PDP 1 column + sticky buy bar; customiser stacked; cart/checkout 1 column, sumcard static, line grid `76px 1fr` with amount under; form grid 1 column; **admin sidebar hidden**, hamburger in top bar, search hidden, KPIs 2 columns (value 22 px) |

**Cascade subtleties [DER]** (resolved by source order, not by rendering):
- `.hdr .wrap` gap at ≤760 is **20 px**, not the 10 px declared in the ≤760 block, because the later ≤1040 block (line 526) wins.
- Hero `padding-bottom` is **0** at every width (line 518), and at ≤760 `padding-top` is **44 px** (the ≤900 block, line 530, overrides 30 px).
- `.nav` is **13.5 px / gap 16** at ≤1040 (second block overrides the first).
- At **761–1040 px there is no search control at all** in the header (pill hidden, icon button shown only ≤760). A gap in the preview.

**Mapping to the app [REC]:** the app uses viewport breakpoints (Tailwind `sm 640 / md 768 / lg 1024`). For an exact match use arbitrary values (`max-[760px]:`, `max-[1040px]:`, `max-[900px]:`) or define matching `--breakpoint-*` tokens. The app is full-width, so viewport width equals the preview's container width.

---

## 9. Component states and interactions

### 9.1 What the source defines
| State | Defined rules (themed region) |
|---|---|
| **Hover** | `.btn-p` bg → `#A9823A`; `.btn-s` border + text → gold; `.iconbtn` bg → `#161616`; `.cat:hover .ph` → `translateY(-3px)`; `.promo .btn-p` bg → `#A9823A`; `.tbl tr:hover td` bg → `#141414` (6 rules; the other 2 `:hover` rules are studio chrome) |
| **Focus** | only the demo classes `.btn.focus` and `.inp.focus`: `outline:3px solid color-mix(in srgb,#D9AE4E 35%,transparent); outline-offset:2px` |
| **Active / pressed** | **none** (`:active` appears 0 times) |
| **Selected** | `.nav a.on`, `.side a.on`, `.pill.on`, `.fontc.on`, `.segc div.on`, `.radio.on`, `.thumbs .ph.on`, `.swatches i.on`, `.range span.on`, `.tick.on`, `.tog.on`, `.steps span.on/.done`, `.b.hi` (chart) |
| **Disabled** | `.btn[disabled], .btn.is-off`: `opacity:.45; pointer-events:none`; `.inp.off`: bg `#141414`, muted text |
| **Error** | `.inp.err` border `#b3321f` + `.hint.err` |
| **Transitions** | exactly one: `.cat .ph{transition:transform .2s}` |
| **Animations / keyframes** | none |
| **Not defined anywhere** | `:focus` / `:focus-visible` on real elements, `:active`, `prefers-reduced-motion`, `::selection`, scrollbar styling, backdrop blur, loading/skeleton states |

### 9.2 Interactions in the preview
Static mockups. The only live behaviour is studio navigation (views, themes, devices via the URL hash) and native `<details>` accordions on the PDP.

### 9.3 Recommended state set for implementation [REC]
Keep the source behaviour and complete the gaps with token-only values:
- **Focus-visible:** apply the source focus ring (`3px`, gold at 35 %, offset 2px) to every interactive element via `:focus-visible`.
- **Active:** primary → `--brand-d`; secondary → border `--brand`; no transforms.
- **Transitions:** 120–250 ms colour/border/transform only, matching the design-system rule "120 to 250 ms … respect reduced motion"; wrap in `@media (prefers-reduced-motion: no-preference)`.
- **Loading skeleton:** `--soft` fill with a subtle pulse (the app already has `Skeleton`).

---

## 10. Preview source-file references

| Topic | File | Lines |
|---|---|---|
| Theme definition (Industrial Obsidian) | `app.js` | 82–90 |
| Shared theme base and `T()` helper | `app.js` | 4–9 |
| Theme CSS injection | `app.js` | 92–95 |
| Contrast helpers | `app.js` | 97–100 |
| Mock products and categories | `app.js` | 102–113 |
| Logo, stars, tiles, icon helper | `app.js` | 115–120 |
| Keychain viewport art | `app.js` | 122–135 |
| Hero scene SVG | `app.js` | 137–149 |
| Announcement, header, footer, product card | `app.js` | 152–188 |
| Home / PDP / Customiser | `app.js` | 193–242 / 244–275 / 277–297 |
| Cart + checkout | `app.js` | 299–333 |
| Admin dashboard | `app.js` | 335–362 |
| Design-system page (rules, type table, elevation) | `app.js` | 364–399 |
| Router, devices | `app.js` | 453–514 |
| Fonts link | `index.html` | 9 |
| Icon sprite | `index.html` | 28–60 |
| Product illustration symbols | `index.html` | 63–153 |
| Frame base, container, tokens usage | `styles.css` | 83–99 |
| Buttons / badges / inputs / cards | `styles.css` | 101–138 |
| Announcement + header | `styles.css` | 140–155 |
| Hero / trust / tiles / products | `styles.css` | 157–203 |
| Promo + viewport + swatches | `styles.css` | 205–226 |
| How / reviews / footer | `styles.css` | 228–250 |
| PDP | `styles.css` | 252–282 |
| Customiser | `styles.css` | 284–306 |
| Cart / checkout | `styles.css` | 308–343 |
| Admin | `styles.css` | 345–397 |
| Design-system page | `styles.css` | 399–434 |
| Responsive blocks | `styles.css` | 436–534 |
| Logo asset | `assets/jas-logo.png` | 1254×1254, 8-bit RGB (no alpha), 1,314,504 bytes |

The complete themed stylesheet (`styles.css:83-534`) is reproduced verbatim in **Appendix C**, so this document is self-contained.

### The logo asset
A circular gold-and-peacock emblem ("JAS / 3D PRINTING / DREAM · DESIGN · CREATE") on a **solid near-black square background** (not transparent). The preview crops it to a circle (`border-radius:50%; object-fit:contain`) at 40 px (header, footer) and 32 px (admin). At 40 px the lettering is not legible; only the silhouette and gold read. It is 1.3 MB and unoptimised.

---

## 11. Current application component mapping

Facts below come from an inspection of the current repo. "Not inspected in detail" means only its role is known.

### 11.1 Global
| Preview concept | Current app | Change required |
|---|---|---|
| Tokens | `apps/customer-frontend/src/index.css` `@theme` (warm bronze, `Fraunces` + `Plus Jakarta Sans`, `color-scheme: light`) | Replace values per §4.4; add `alt`, `band`, `secondary`, `on-accent`; set `color-scheme: dark`; swap fonts |
| Fonts | `index.html` Google Fonts link (Fraunces, Plus Jakarta Sans) | Load Space Grotesk 500/600/700 and Inter 400–700; drop the old pair |
| Logo / favicon | text wordmark "Giftora"; `public/favicon.svg` is the default Vite logo | Add optimised logo asset; replace favicon; update `<title>` |
| Card shadow token | `--shadow-card` (warm, light) | Remove from cards (preview uses border only) |

### 11.2 Customer frontend
| Preview component | App file(s) | Current implementation | Change |
|---|---|---|---|
| Announcement bar | none | — | New component above header |
| Header | `components/layout/Header.jsx` | sticky `bg-surface/95 backdrop-blur`, container `max-w-6xl`, text wordmark, nav at `md`, dark "Cart" pill without count | Logo image, 76 px bar, active-underline nav, search pill, icon buttons, cart count chip; decide whether to keep sticky |
| Footer | `components/layout/Footer.jsx` | 3-column grid | 4 columns, newsletter UI (no backend), bottom row |
| Hero | `components/home/Hero.jsx` | `border-b bg-surface`, grid `1.1fr/.9fr`, accent-soft chip, `text-4xl/5xl` heading, simple keychain SVG with hard-coded fills (`#ffffff`, `#1a1712`, `#a8763e`) | Black hero, eyebrow rule, `clamp` H1, gold lead, new CTA styles, redo the SVG art with tokens |
| Trust strip | `components/home/TrustBar.jsx` | not inspected in detail | Match §5.11 |
| How it works | `components/home/HowItWorks.jsx` | not inspected in detail | Match §6.1 |
| Promo band | `components/home/PromoBanner.jsx` | not inspected in detail | Match §5.10 |
| Category tiles | `components/home/CategoryGrid.jsx` (exists, **unused** after an approved change) | — | Do not reinstate without approval (§14 Q8) |
| Product card | `components/product/ProductCard.jsx`, `ProductSection.jsx` | not inspected in detail | Match §5.9 |
| Product detail | `pages/ProductDetail.jsx`, `ProductGallery.jsx`, `OptionPicker.jsx`, `ColorSwatchPicker.jsx`, `QuantitySelector.jsx`, `ProductSpecs.jsx` | accent "Add to Cart" only; gallery has 3 hard-coded colour classes | Match §5.3 and §6.3 |
| Catalog + filters | `pages/Products.jsx`, `CatalogFilters.jsx`, `ActiveFilters.jsx`, `SortMenu.jsx` | filter drawer on mobile | No preview design; derive per §6.2 |
| Customiser chrome | `components/customiser/CustomizerStepCard.jsx`, `FontPickerCards.jsx`, `FontChooserModal.jsx`, `KeychainColorSwatches.jsx`, `ThicknessPicker.jsx`, `PrintFactsCard.jsx`, `VisualDesignCardRail.jsx`, `PreflightPanel.jsx`, `CustomizationSummary.jsx` | token classes plus a few hard-coded colours (`KeychainColorSwatches` 5, `FontChooserModal` 1) | Restyle to §5.13; **do not touch the geometry engine** |
| Viewport | `components/customiser/Viewport3D.jsx` | three surface presets with hard-coded colours (`#f3efe8` matte with a **bronze** `rgba(168,118,62,.06)` grid, `#e6e2da` graph, `#1e232d` dark), toolbar `bg-[#212735]` with `bg-white/10` buttons | Retint the bronze grid; decide the default preset (§14 Q10) |
| Cart / Checkout | `pages/Cart.jsx`, `pages/Checkout.jsx`, `pages/Addresses.jsx` | token classes (Addresses 25, Checkout 14, Cart 8 uses of `ink/paper`) | Match §5.14 |
| Orders | `components/orders/OrderStatusBadge.jsx`, `OrderStatusTimeline.jsx`, `OrderItemsList.jsx`, `OrderAddressSummary.jsx`, `pages/MyOrders.jsx`, `OrderDetails.jsx`, `OrderSuccess.jsx` | token classes | Map statuses to the badge variants in §5.2 |
| Auth | `pages/Login.jsx`, `Register.jsx` | token classes | Inputs per §5.3 |

### 11.3 UI primitives (`components/ui/`)
| File | Current | Target |
|---|---|---|
| `Button.jsx` | variants `primary` = `bg-ink text-paper hover:bg-ink/90`; `accent` = `bg-accent text-white hover:bg-accent-dark`; `secondary` = surface + border; `ghost` = `text-ink hover:bg-ink/5`; sizes `sm px-4 py-2 text-xs`, `md px-5 py-2.5 text-sm`, `lg px-6 py-3.5 text-sm` | Heights 38 / 48 / 54, radius 4, `font-semibold` 14.5 px; one gold-fill variant with **black** text; `secondary` = §5.1; add a `danger` variant; `ghost` = gold text |
| `Badge.jsx` | tones neutral / accent / success / danger | Variants per §5.2 |
| `Card.jsx` | `rounded-card border bg-surface shadow-card` | drop the shadow, keep border |
| `Input.jsx` | label + input, `focus:ring-accent/30` | 46 px height, radius 4, border `--border`, focus ring §5.1 |
| `Skeleton.jsx` | `animate-pulse bg-ink/8` | `bg-white/…` equivalent token, see §12 rule 2 |

### 11.4 Admin frontend
| Preview component | App file | Current | Change |
|---|---|---|---|
| Sidebar layout | `src/components/AdminLayout.jsx` | single top header "Giftora Admin", 7 horizontal nav links, `max-w-6xl`, `bg-gray-50` | Replace with the §5.15 sidebar + top bar (this layout change is also proposed in `docs/ui-ux/GIFTORA_PAGE_REDESIGN_BLUEPRINT.md`) |
| Tokens | `src/index.css` is only `@import "tailwindcss";` | no tokens, no fonts, ~286 raw `gray-*` class uses | Add the same token set; replace gray utilities page by page |
| KPI / chart / range / banner | `StatCard.jsx`, `SimpleBarChart.jsx`, `DateRangeFilter.jsx`, `Banner.jsx` | raw gray styles | §5.15 |
| Login | `src/app/login/Login.jsx` | "Giftora Admin Login" | Restyle, rename if the brand changes |

### 11.5 Hard-coded values that will not follow tokens (audit list)
Customer frontend: **31** occurrences of `bg-white`/`text-white`/`bg-black`/`bg-gray`/hex across 8 files (`Hero.jsx` 5, `Viewport3D.jsx` 14, `KeychainColorSwatches.jsx` 5, `ProductGallery.jsx` 3, `Button.jsx`, `ProductModel.jsx`, `FontChooserModal.jsx`, `VisualDesignCardRail.jsx` 1 each) and **204** uses of `ink`/`paper` utilities across 51 files. Admin: ~286 `gray-*` uses.

---

## 12. Implementation guidelines

1. **Tokens only.** No hex values in components. Every colour comes from the token set in §4.
2. **`ink` and `paper` flip meaning.** The app uses `bg-ink text-paper` for dark-filled controls (header Cart pill, primary button). With `ink=#FFF` and `paper=#000` that becomes a *white* button. Audit all 204 uses; gold-filled controls use `bg-accent text-on-accent`, light-on-dark text uses `text-ink`.
3. **Text on gold is black** [REC, resolves D1] for buttons, count chips, step circles, selected range items, checkmarks.
4. **Gold is for action and emphasis only.** One primary per view. Do not use gold for body text or large fills (the only gold fill larger than a button is the highlighted chart bar).
5. **Blue is sparing:** badges, promo eyebrow/icons, count chips, the hero disc, one chart series.
6. **Borders carry depth.** Cards = `bg-surface` + 1 px `--border`, no shadow. Do not add shadows to dark cards.
7. **Keep fixed colours fixed:** viewport island, semantic pills, preflight panel (§2.3).
8. **Headings:** display font on H1/H2/numerals/logo only; Inter for card-level headings (§3.2).
9. **Icons:** copy the sprite (Appendix B) or an equivalent outline set at 1.6 px stroke, round caps, `currentColor`. No emoji.
10. **Use real controls.** The preview's `div`/`span` buttons and inputs are mockups; use `<button>`, `<input>`, `<details>`, with visible `:focus-visible`.
11. **Fonts:** load only Space Grotesk and Inter; consider self-hosting (the app already self-hosts customiser fonts under `public/fonts`).
12. **Do not change** the geometry engine, backend, Prisma or the database.
13. **Product imagery:** the preview's vector illustrations stand in for photography. Use real product images on `.ph` tiles (`#161616`, radius 8); placeholders must not be pure white.
14. **Order of work (suggested):** tokens and fonts → `ui/` primitives → layout (announcement, header, footer) → Home → PDP/catalog → cart/checkout/orders → customiser chrome → admin.
15. **Verification:** run the contrast audit in §2.4 on every changed pair; check at 390, 820 and 1280 px; build both frontends; compare against `#home/industrial-obsidian/…`, `#product/…`, `#customiser/…`, `#cart/…`, `#admin/…`, `#system/…` in the preview URL hash.

---

## 13. Design consistency checklist

- [ ] Page background is exactly `#000000`; no pure-white page surface anywhere (except the viewport island)
- [ ] Header is `#0D0D0D` with a 1 px `#262626` bottom border; footer and announcement are `#000000`
- [ ] Only Space Grotesk (display) and Inter (body) are loaded and used
- [ ] H1/H2 are Space Grotesk 600 with −0.02 em tracking and 1.12 line-height
- [ ] Eyebrows are Inter 700 12 px uppercase 0.16 em in gold
- [ ] Control radius 4 px, card radius 8 px, promo 16 px, pills round
- [ ] Every gold-filled control uses black text; contrast ≥ 4.5:1
- [ ] Exactly one primary (gold) action per view
- [ ] Secondary buttons are `#0D0D0D` + 1 px `#262626`, gold on hover
- [ ] Active nav item has a 2 px gold underline and gold text
- [ ] Selected options use gold border + inset 1 px gold + `#161616` fill
- [ ] Cards have a hairline border and **no** shadow
- [ ] Section bands alternate `#000000` and `#141414`
- [ ] Blue (`#3D6AA3`) appears only on badges, promo eyebrow/icons, count chips, the hero disc and one chart series
- [ ] Semantic colours (success/warning/danger) are the fixed values; status is never colour-only
- [ ] Icons are the outline set, 1.6 px stroke, `currentColor`; no emoji
- [ ] Every interactive element has a visible `:focus-visible` ring
- [ ] No hard-coded hex values remain in components (audit §11.5)
- [ ] `color-scheme: dark` is set
- [ ] Layout verified at 390 / 820 / 1280 px, including the 761–1040 px search gap
- [ ] Customiser viewport keeps its light island and the geometry engine is untouched
- [ ] Admin uses the sidebar layout and the same tokens as the storefront

---

## 14. Missing information, uncertain findings and confirmations needed

| # | Item | Finding | Recommended default |
|---|---|---|---|
| Q1 | **Brand name** | Preview UI says "JAS 3D Printing" everywhere (logo, footer, copyright, admin), while the studio chrome still says "Giftora Design Studio" and the app says "Giftora". | Confirm rename (≈7 UI strings, titles, logo). |
| Q2 | **White-on-gold (D1)** | Source value fails at 2.08:1 (hover 3.53:1). | Black text on gold everywhere. |
| Q3 | **"New" badge (D2)** | Invisible in source (1.00:1). | Use the blue accent fill. |
| Q4 | **Hairlines and field borders (D5)** | `#262626` is 1.28–1.39:1 against its surfaces; input boundaries need 3:1 for WCAG 1.4.11. | Keep `#262626` for dividers; choose a lighter field border (value needed). |
| Q5 | **Mid-tone semantic text on black (D3, D4)** | `#17683f` and `#a82d1a` are 2.86–3.09:1 on black; the preview only defines them as badge text on light tints. | Provide lighter variants for text on black (values not defined in the preview). |
| Q6 | **Danger/success tokens in the app** | Current app tokens `#b3432c` / `#3f6b4a` were built for a light page. | Re-evaluate on black. |
| Q7 | **Logo asset** | 1.3 MB, opaque near-black square, circle-cropped. | Provide an optimised file (and ideally a transparent or SVG version). |
| Q8 | **Conflicts with earlier decisions** | Preview PDP has "Preview in 3D"; preview Home has a category grid. The owner removed the category grid and decided the customiser link lives only in the Hero. | Follow the owner's decisions, not the preview. |
| Q9 | **Features shown but not backed by the app** | Wishlist, ratings/reviews, "was" price/% off, product badges, promo code, express delivery, UPI/COD choice, photo upload, newsletter, "Corporate" and "Gifts for couples" nav, crystal/figurine/mug/frame products. | Build visually as static, or omit; needs a decision. |
| Q10 | **3D viewport colours** | Preview viewport is a light grid island. The app has 3 selectable surface presets, one with a bronze grid line. | Keep presets, retint the bronze grid, choose the default. |
| Q11 | **Mobile menu, mobile search, 761–1040 px search** | Not designed in the preview. | Design needed. |
| Q12 | **Sticky header** | Preview header is not sticky; the app's is. | Keep sticky, with an opaque `#0D0D0D` background. |
| Q13 | **Active/pressed, focus-visible, reduced motion, skeletons** | Not defined in the preview (§9). | Adopt §9.3. |
| Q14 | **Cascade-derived values** | §8 values marked [DER] came from reading source order, not from rendering in a browser. | Verify visually during implementation. |
| Q15 | **Preview copy** | Prices, reviews, stats, names are sample content; the "Body 15/24 px" label on the design-system page conflicts with the CSS `line-height:1.55` (≈23.25 px). | CSS value wins (1.55). |
| Q16 | **Pages without mockups** | See §6.2 and §6.7. | Derive from §5; record choices. |
| Q17 | **Illustrations** | Product SVG symbols use `--fig2:#f2f2f6` (inherited default) and the white glass gradients; they were designed as stand-ins. | Replace with real photography. |

Nothing in this document has been applied to the application. Implementation begins only after these confirmations.

---

## Appendix A — Verbatim theme definition (`app.js:82-90`)

```js
  { id: 'industrial-obsidian', n: '7', name: 'Industrial Obsidian', mood: 'DARK — pure black, white text, thin gold and blue accents, sharp modern-industrial',
    pair: ['Space Grotesk', 'Inter'],
    v: T({ brand: '#D9AE4E', 'brand-d': '#A9823A', soft: '#161616', bg: '#000000', surf: '#0D0D0D', ink: '#FFFFFF', muted: '#8A8A8A', line: '#262626', alt: '#141414',
      acc: '#3D6AA3', 'acc-ink': '#FFFFFF', band: '#000000', 'hero-bg': '#000000', 'hero-fg': '#FFFFFF', 'hero-fg2': '#D9AE4E', 'hero-arch': '#161616',
      'hero-btn': '#D9AE4E', 'hero-btn-fg': '#000000', fig: '#D9AE4E', r: '4px', 'disp-w': '600', 'disp-ls': '-0.02em',
      disp: '"Space Grotesk",system-ui,sans-serif', body: '"Inter",system-ui,sans-serif' }),
    strengths: ['Sharpest, most "modern industrial 3D-printing" of the seven themes', 'Pure black plus white text gives maximum contrast and a tech-forward edge', 'Thin gold/blue accents keep it tied to the brand without softening the look'],
    weaknesses: ['Coldest theme; needs strong product renders to avoid feeling empty', 'Sharp 4px corners feel severe in dense forms'],
    best: 'Technical/industrial positioning, dark-mode default, spec-heavy pages', premium: 5, warmth: 1, photo: 4 },
```

Shared base (`app.js:4-9`), which supplies `fig2` and defaults:

```js
/* ============================================================ THEMES */
const base = {
  'brand-d': '', alt: '', 'acc-ink': '', 'hero-btn': '', 'hero-btn-fg': '#fff',
  fig: '', fig2: '#f2f2f6', r: '10px', 'disp-w': '600', 'disp-ls': '-0.01em',
};
const T = (o) => ({ ...base, ...o });
```

## Appendix B — Verbatim icon sprite (`index.html:28-60`)

All symbols are `viewBox="0 0 24 24"` and are drawn with the `.ic` rules from §5.5.

```html
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z"/></symbol>
  <symbol id="i-truck" viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-cube" viewBox="0 0 24 24"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/></symbol>
  <symbol id="i-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-3 0-5-1-5-3s3-3 5 0c2-3 5-2 5 0s-2 3-5 3"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/></symbol>
  <symbol id="i-box" viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z"/><path d="M3 7l9 4 9-4M12 11v10"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-5-5-5.7"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.2"/></symbol>
  <symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4v-9Z"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4l2-2ZM10 21h4"/></symbol>
  <symbol id="i-rotate" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></symbol>
  <symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>
  <symbol id="i-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></symbol>
  <symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-type" viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></symbol>
  <symbol id="i-palette" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/></symbol>
  <symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
  <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></symbol>
```

## Appendix C — Verbatim themed stylesheet (`styles.css:83-534`)

Every colour here is `var(--token)`; substitute the §4.2 values. This block excludes the neutral "studio chrome" (lines 1–81), which is not part of the theme.

```css
/* ===================== THEMED FRAME (everything below uses theme tokens) ===================== */
.frame{container:f/inline-size;background:var(--bg);color:var(--ink);font:400 15px/1.55 var(--body);--card-r:calc(var(--r) + 4px)}
.frame *{box-sizing:border-box}
.frame h1,.frame h2,.frame h3,.frame h4,.frame .disp{font-family:var(--disp);font-weight:var(--disp-w);letter-spacing:var(--disp-ls);margin:0;line-height:1.12;color:inherit}
.frame p{margin:0}
.frame button{font-family:var(--body)}
.frame .ic{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.frame svg.art{display:block;width:100%;height:auto}
.wrap{max-width:1200px;margin:0 auto;padding:0 40px}
.sec{padding:84px 0}
.sec.alt{background:var(--alt)}
.eyebrow{font:700 12px/1 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--brand)}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:34px}
.sec-head h2{font-size:38px;margin-top:12px}
.sec-head p{color:var(--muted);max-width:44ch;margin-top:10px}
.link{display:inline-flex;align-items:center;gap:8px;color:var(--brand);font-weight:600;text-decoration:none}
.muted{color:var(--muted)}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:48px;padding:0 24px;border-radius:var(--r);border:1px solid transparent;font:600 14.5px var(--body);cursor:pointer;text-decoration:none;white-space:nowrap}
.btn .ic{width:18px;height:18px}
.btn-p{background:var(--brand);color:#fff}
.btn-p:hover{background:var(--brand-d)}
.btn-s{background:var(--surf);color:var(--ink);border-color:var(--line)}
.btn-s:hover{border-color:var(--brand);color:var(--brand)}
.btn-g{background:transparent;color:var(--brand);padding:0 12px}
.btn-d{background:#b3321f;color:#fff}
.btn-sm{height:38px;padding:0 16px;font-size:13.5px}
.btn-lg{height:54px;padding:0 30px;font-size:15.5px}
.btn[disabled],.btn.is-off{opacity:.45;pointer-events:none}
.btn.focus,.inp.focus{outline:3px solid color-mix(in srgb,var(--brand) 35%,transparent);outline-offset:2px}
.btn-hero{background:var(--hero-btn);color:var(--hero-btn-fg)}
.btn-hero2{background:transparent;color:var(--hero-fg);border-color:color-mix(in srgb,var(--hero-fg) 28%,transparent)}
.btn-block{width:100%}

/* badges */
.badge{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;font:600 11.5px var(--body);background:var(--soft);color:var(--brand-d)}
.badge.acc{background:var(--acc);color:var(--acc-ink)}
.badge.ok{background:#e3f4ea;color:#17683f}
.badge.warn{background:#fcefd0;color:#8a5c00}
.badge.bad{background:#fbe6e2;color:#a82d1a}
.badge.dark{background:var(--ink);color:#fff}
.badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* inputs */
.field{display:grid;gap:6px}
.field label{font:600 13px var(--body);color:var(--ink)}
.inp{height:46px;width:100%;border:1px solid var(--line);background:var(--surf);border-radius:var(--r);padding:0 14px;font:400 15px var(--body);color:var(--ink);display:flex;align-items:center}
.inp.err{border-color:#b3321f}
.inp.off{background:var(--alt);color:var(--muted)}
.hint{font-size:12.5px;color:var(--muted)}
.hint.err{color:#a82d1a}
.card{background:var(--surf);border:1px solid var(--line);border-radius:var(--card-r)}
.card.pad{padding:24px}
.stars{display:inline-flex;gap:1px;color:var(--brand)}
.stars .ic{width:14px;height:14px;stroke:none}

/* announce + header */
.announce{background:var(--band);color:var(--ink);font:500 12.5px var(--body);text-align:center;padding:9px 16px;letter-spacing:.02em}
.hdr{background:var(--surf);border-bottom:1px solid var(--line);position:relative}
.hdr .wrap{display:flex;align-items:center;gap:32px;height:76px}
.logo{display:flex;align-items:center;gap:10px;font:var(--disp-w) 26px var(--disp);letter-spacing:var(--disp-ls);color:var(--ink);text-decoration:none}
.logo b{width:34px;height:34px;border-radius:calc(var(--r) - 1px);background:var(--brand);color:#fff;display:grid;place-items:center}
.logo b .ic{width:19px;height:19px}
.nav{display:flex;gap:22px;font:500 14.5px var(--body);flex:1}
.nav a{white-space:nowrap;text-decoration:none;color:var(--ink);padding:6px 0;border-bottom:2px solid transparent}
.nav a.on{border-color:var(--brand);color:var(--brand)}
.hdr-tools{display:flex;gap:6px;align-items:center}
.srch{display:flex;align-items:center;gap:8px;background:var(--alt);border-radius:999px;padding:0 16px;height:42px;color:var(--muted);width:220px;font-size:14px}
.iconbtn{position:relative;width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:none;border:0;color:var(--ink)}
.iconbtn:hover{background:var(--soft)}
.cnt{position:absolute;top:3px;right:2px;min-width:18px;height:18px;border-radius:9px;background:var(--brand);color:#fff;font:700 10.5px var(--body);display:grid;place-items:center;padding:0 4px}
.hdr .only-m{display:none}

/* hero */
.hero{background:var(--hero-bg);color:var(--hero-fg);overflow:hidden}
.hero .wrap{display:grid;grid-template-columns:1.02fr .98fr;gap:40px;align-items:center;min-height:620px;padding-top:40px;padding-bottom:40px}
.hero h1{font-size:clamp(36px,5.4cqw,70px);margin:20px 0 20px}
.hero .eyebrow{color:var(--hero-fg);opacity:.85;display:inline-flex;align-items:center;gap:10px}
.hero .eyebrow::before{content:"";width:28px;height:2px;background:currentColor}
.hero .lead{font-size:18px;color:var(--hero-fg2);max-width:46ch}
.hero .cta{display:flex;gap:12px;margin:32px 0 36px;flex-wrap:wrap}
.hero .mini{display:flex;gap:28px;flex-wrap:wrap;color:var(--hero-fg2);font-size:13.5px}
.hero .mini div{display:flex;align-items:center;gap:9px}
.hero-fig{position:relative}
.hero-fig svg{overflow:visible}
.float{position:absolute;background:var(--surf);color:var(--ink);border-radius:var(--card-r);padding:12px 16px;box-shadow:0 18px 40px -18px rgba(0,0,0,.35);display:flex;align-items:center;gap:12px;font-size:13px}
.float b{display:block;font-size:14px}
.float .ico{width:38px;height:38px;border-radius:50%;background:var(--soft);color:var(--brand);display:grid;place-items:center}

/* trust strip */
.trust{background:var(--surf);border-bottom:1px solid var(--line)}
.trust .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding-top:24px;padding-bottom:24px}
.trust .it{display:flex;align-items:center;gap:14px}
.trust .ico{width:44px;height:44px;border-radius:50%;background:var(--soft);color:var(--brand);display:grid;place-items:center}
.trust b{display:block;font-size:14px}
.trust span{color:var(--muted);font-size:13px}

/* tiles */
.ph{background:var(--soft);border-radius:var(--card-r);overflow:hidden;position:relative}
.ph.alt1{background:var(--alt)}
.ph.alt2{background:color-mix(in srgb,var(--acc) 38%,var(--surf))}
.ph svg{display:block;width:100%;height:auto}
.cats{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
.cat{text-decoration:none;color:var(--ink);display:block}
.cat .ph{transition:transform .2s}
.cat:hover .ph{transform:translateY(-3px)}
.cat h3{font:600 16px var(--body);margin:14px 0 2px}
.cat span{font-size:13px;color:var(--muted)}
.prods{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.prod .ph .badge{position:absolute;left:12px;top:12px}
.prod .wish{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;background:var(--surf);color:var(--ink);display:grid;place-items:center;border:0;box-shadow:0 4px 12px -4px rgba(0,0,0,.25)}
.prod .wish .ic{width:18px;height:18px}
.prod h3{font:600 16px/1.3 var(--body);margin:16px 0 4px}
.prod .cat-l{font-size:12.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.prod .rt{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);margin:6px 0}
.price{display:flex;align-items:baseline;gap:8px;margin-top:6px}
.price b{font:700 18px var(--body)}
.price s{color:var(--muted);font-size:14px}
.price .off{color:#17683f;font-weight:600;font-size:13px}
.prod .btn{margin-top:14px;width:100%}

/* promo / customiser band */
.promo{background:var(--band);color:var(--ink);border:1px solid var(--line);border-radius:calc(var(--card-r) + 8px);overflow:hidden;display:grid;grid-template-columns:1fr 1.05fr}
.promo .txt{padding:64px 56px}
.promo .eyebrow{color:var(--acc)}
.promo h2{font-size:38px;margin:16px 0 18px;color:var(--ink)}
.promo p{color:var(--muted);max-width:44ch}
.promo ul{list-style:none;padding:0;margin:26px 0 32px;display:grid;gap:12px}
.promo li{display:flex;gap:12px;align-items:center;color:var(--ink)}
.promo li .ic{color:var(--acc)}
.promo .btn-p{background:var(--brand);color:#fff}
.promo .btn-p:hover{background:var(--brand-d)}
.vp{position:relative;min-height:420px;background:#f3f6fb;background-image:linear-gradient(#dbe4f0 1px,transparent 1px),linear-gradient(90deg,#dbe4f0 1px,transparent 1px);background-size:32px 32px;display:grid;place-items:center}
.vp .art{width:min(86%,430px)}
.vp .dim{position:absolute;left:18px;bottom:16px;background:rgba(255,255,255,.92);color:#1d2230;border-radius:8px;padding:7px 12px;font:600 12px var(--body);box-shadow:0 4px 14px -6px rgba(0,0,0,.3)}
.vp .tools{position:absolute;right:16px;top:16px;display:grid;gap:8px}
.vp .tools button{width:38px;height:38px;border-radius:50%;background:#fff;border:0;display:grid;place-items:center;color:#1d2230;box-shadow:0 4px 14px -6px rgba(0,0,0,.3)}
.vp .hintchip{position:absolute;left:50%;transform:translateX(-50%);top:16px;background:rgba(255,255,255,.92);color:#1d2230;border-radius:999px;padding:6px 14px;font:500 12px var(--body)}
.mini-panel{position:absolute;right:20px;bottom:20px;width:210px;background:#fff;color:#1d2230;border-radius:14px;padding:14px;box-shadow:0 18px 40px -16px rgba(0,0,0,.4);display:grid;gap:10px}
.mini-panel .inp{height:36px;font-size:13px;color:#1d2230;background:#fff;border-color:#dbe1ea}
.swatches{display:flex;gap:8px}
.swatches i{width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.swatches i.on{outline:2px solid var(--brand);outline-offset:2px}

/* how */
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.step{padding:30px}
.step .n{font:var(--disp-w) 44px var(--disp);color:var(--brand);line-height:1;opacity:.9}
.step h3{font:600 19px var(--body);margin:18px 0 8px}
.step p{color:var(--muted)}
.reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.rv{padding:28px}
.rv p{margin:14px 0 20px;font-size:16px}
.who{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)}
.who b{display:block;color:var(--ink);font-size:14px}
.av{width:40px;height:40px;border-radius:50%;background:var(--soft);color:var(--brand-d);display:grid;place-items:center;font:700 13px var(--body)}

/* footer */
.ftr{background:var(--band);color:var(--muted);padding:64px 0 28px;border-top:1px solid var(--line)}
.ftr .wrap>.g{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.3fr;gap:40px}
.ftr .logo{color:var(--ink)}
.ftr h4{font:700 12px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--ink);margin-bottom:16px}
.ftr ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:14px}
.ftr .sub{display:flex;gap:8px;margin-top:14px}
.ftr .sub .inp{background:var(--surf);border:1px solid var(--line);color:var(--ink);height:44px}
.ftr .sub .btn{height:44px;background:var(--brand);color:#fff}
.ftr .bot{margin-top:44px;padding-top:22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:13px;flex-wrap:wrap;gap:10px}

/* breadcrumb / PDP */
.crumbs{display:flex;gap:10px;font-size:13px;color:var(--muted);padding:22px 0}
.pdp{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;padding-bottom:70px}
.gal{display:grid;grid-template-columns:84px 1fr;gap:16px}
.thumbs{display:grid;gap:12px;align-content:start}
.thumbs .ph{border:2px solid transparent;border-radius:var(--r)}
.thumbs .ph.on{border-color:var(--brand)}
.pdp h1{font-size:40px;margin:12px 0 10px}
.pdp .price b{font-size:30px}
.opt{margin-top:26px}
.opt h4{font:700 13px var(--body);letter-spacing:.04em;margin-bottom:10px;display:flex;justify-content:space-between}
.opt h4 span{font-weight:500;color:var(--muted)}
.pills{display:flex;gap:10px;flex-wrap:wrap}
.pill{height:44px;padding:0 18px;border:1px solid var(--line);border-radius:var(--r);display:inline-flex;align-items:center;font-weight:500;background:var(--surf)}
.pill.on{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);color:var(--brand);background:var(--soft)}
.drop{border:1.5px dashed color-mix(in srgb,var(--brand) 45%,var(--line));border-radius:var(--card-r);background:var(--soft);padding:22px;display:flex;align-items:center;gap:16px;color:var(--brand-d)}
.drop b{display:block;color:var(--ink)}
.drop span{font-size:13px;color:var(--muted)}
.drop .ico{width:48px;height:48px;border-radius:50%;background:var(--surf);display:grid;place-items:center;color:var(--brand)}
.buy{display:grid;grid-template-columns:auto 1fr;gap:12px;margin-top:28px}
.qty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:var(--r);height:54px;background:var(--surf)}
.qty button{width:44px;height:100%;background:none;border:0;color:var(--ink);display:grid;place-items:center}
.qty span{min-width:30px;text-align:center;font-weight:600}
.assure{display:grid;gap:12px;margin-top:26px;padding:20px;background:var(--alt);border-radius:var(--card-r);font-size:14px}
.assure div{display:flex;gap:12px;align-items:center}
.accord{margin-top:22px;border-top:1px solid var(--line)}
.accord details{border-bottom:1px solid var(--line);padding:16px 0}
.accord summary{font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center}
.accord summary::-webkit-details-marker{display:none}
.accord p{margin-top:10px;color:var(--muted)}
.sticky-buy{display:none}

/* customiser */
.cz{display:grid;grid-template-columns:1.5fr 1fr;min-height:720px;border-top:1px solid var(--line)}
.cz .vp{min-height:720px}
.cz .vp .art{width:min(78%,560px)}
.cz-panel{background:var(--surf);padding:26px 28px;display:grid;gap:14px;align-content:start;border-left:1px solid var(--line)}
.cz-panel>h1{font-size:28px}
.stepcard{border:1px solid var(--line);border-radius:var(--card-r);padding:18px 20px;display:grid;gap:14px}
.stepcard .sh{display:flex;align-items:center;gap:12px;font-weight:600}
.stepcard .sh i{width:28px;height:28px;border-radius:50%;background:var(--brand);color:#fff;font:700 13px var(--body);display:grid;place-items:center;font-style:normal}
.stepcard .sh span{margin-left:auto;font-weight:500;font-size:13px;color:var(--muted)}
.fonts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.fontc{border:1px solid var(--line);border-radius:var(--r);padding:12px 8px;text-align:center;font-size:22px;line-height:1.1}
.fontc small{display:block;font:500 11px var(--body);color:var(--muted);margin-top:6px}
.fontc.on{border-color:var(--brand);background:var(--soft);box-shadow:inset 0 0 0 1px var(--brand)}
.segc{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.segc div{border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:center;font-weight:600;font-size:14px}
.segc div small{display:block;font-weight:500;color:var(--muted);font-size:11.5px}
.segc div.on{border-color:var(--brand);background:var(--soft);color:var(--brand-d)}
.disc{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:var(--card-r);padding:14px 20px;font-weight:600}
.sumbar{display:grid;gap:12px;padding-top:6px}
.sumbar .row{display:flex;justify-content:space-between;align-items:baseline}
.sumbar .row b{font:700 26px var(--body)}
.preflight{display:flex;gap:12px;background:#e8f5ee;color:#17683f;border-radius:var(--r);padding:12px 14px;font-size:13.5px;align-items:flex-start}

/* cart / checkout */
.two{display:grid;grid-template-columns:1.6fr 1fr;gap:36px;align-items:start;padding-bottom:70px}
.pagehead{padding:34px 0 26px}
.pagehead h1{font-size:40px}
.line{display:grid;grid-template-columns:104px 1fr auto;gap:20px;padding:22px 0;border-bottom:1px solid var(--line);align-items:start}
.line:last-child{border:0}
.line h3{font:600 16px var(--body)}
.line .spec{color:var(--muted);font-size:13px;margin:4px 0 12px;display:grid;gap:2px}
.line .rm{color:var(--muted);font-size:13px;text-decoration:underline;margin-left:14px}
.line .qty{height:40px}
.line .qty button{width:36px}
.line .amt{font:700 17px var(--body);text-align:right}
.sumcard{padding:28px;position:sticky;top:20px}
.sumcard h3{font:700 19px var(--body);margin-bottom:18px}
.sumrow{display:flex;justify-content:space-between;padding:8px 0;color:var(--muted)}
.sumrow b{color:var(--ink);font-weight:600}
.sumrow.tot{border-top:1px solid var(--line);margin-top:10px;padding-top:18px;color:var(--ink);font-weight:700;font-size:18px}
.ship-bar{height:6px;border-radius:9px;background:var(--soft);overflow:hidden;margin:8px 0 6px}
.ship-bar i{display:block;height:100%;width:100%;background:var(--brand)}
.promo-in{display:flex;gap:8px;margin:16px 0 8px}
.steps{display:flex;align-items:center;gap:12px;margin:0 0 28px;font-size:14px;font-weight:600;flex-wrap:wrap}
.steps span{display:flex;align-items:center;gap:10px;color:var(--muted)}
.steps span i{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;font:700 12.5px var(--body);font-style:normal}
.steps span.on{color:var(--ink)}
.steps span.on i{background:var(--brand);border-color:var(--brand);color:#fff}
.steps span.done i{background:var(--soft);border-color:var(--brand);color:var(--brand)}
.steps .bar{width:36px;height:1.5px;background:var(--line)}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fgrid .full{grid-column:1/-1}
.radio{display:flex;align-items:center;gap:14px;border:1px solid var(--line);border-radius:var(--r);padding:14px 16px;background:var(--surf)}
.radio.on{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);background:var(--soft)}
.radio i{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--line);flex:none;display:grid;place-items:center}
.radio.on i{border-color:var(--brand)}
.radio.on i::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--brand)}
.radio .r{margin-left:auto;font-weight:600}
.mini-line{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px 0;font-size:14px}

/* ============== ADMIN ============== */
.adm{display:grid;grid-template-columns:248px 1fr;min-height:860px;background:var(--bg)}
.side{background:var(--band);color:var(--muted);padding:22px 14px;display:flex;flex-direction:column;gap:6px;border-right:1px solid var(--line)}
.side .logo{color:var(--ink);padding:0 10px 18px;font-size:22px}
.side h5{font:700 10.5px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:14px 10px 6px}
.side a{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r);text-decoration:none;color:inherit;font-weight:500;font-size:14px}
.side a.on{background:var(--soft);color:var(--ink)}
.side a .cnt{position:static;margin-left:auto;background:var(--acc);color:var(--acc-ink)}
.side .me{margin-top:auto;display:flex;gap:10px;align-items:center;padding:12px 10px;border-top:1px solid var(--line);font-size:13px}
.side .me b{display:block;color:var(--ink)}
.main{padding:0 32px 40px;min-width:0}
.top{display:flex;align-items:center;gap:16px;height:72px}
.top .srch{flex:1;max-width:420px;background:var(--surf);border:1px solid var(--line)}
.top .only-m{display:none}
.ph-row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:6px 0 22px}
.ph-row h1{font-size:30px}
.ph-row p{color:var(--muted);margin-top:4px}
.range{display:flex;gap:4px;background:var(--surf);border:1px solid var(--line);border-radius:var(--r);padding:3px}
.range span{padding:6px 12px;border-radius:calc(var(--r) - 3px);font-size:13px;font-weight:600;color:var(--muted)}
.range span.on{background:var(--brand);color:#fff}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kpi{padding:20px}
.kpi .t{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:13px;font-weight:500}
.kpi .t .ico{width:34px;height:34px;border-radius:50%;background:var(--soft);color:var(--brand);display:grid;place-items:center}
.kpi .v{font:700 28px var(--body);margin:10px 0 8px;letter-spacing:-.01em}
.grid2{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-top:16px}
.chart{padding:22px}
.chart h3,.tbl h3,.listc h3{font:700 16px var(--body)}
.bars{display:grid;grid-template-columns:36px 1fr;margin-top:18px;height:330px}
.yax{display:flex;flex-direction:column;justify-content:space-between;font-size:11.5px;color:var(--muted);padding-bottom:22px}
.plot{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:10px;align-items:end;border-bottom:1px solid var(--line);background:repeating-linear-gradient(to top,transparent 0 calc(25% - 1px),var(--line) calc(25% - 1px) 25%)}
.plot .b{position:relative;background:color-mix(in srgb,var(--brand) 28%,var(--surf));border-radius:6px 6px 0 0;min-height:4px}
.plot .b.hi{background:var(--brand)}
.plot .b span{position:absolute;top:100%;left:50%;transform:translateX(-50%);font-size:11px;color:var(--muted);margin-top:5px}
.tbl{padding:22px;margin-top:16px;overflow:auto}
.tbl table{width:100%;border-collapse:collapse;font-size:14px;min-width:560px;margin-top:14px}
.tbl th{font:600 11.5px var(--body);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
.tbl td{padding:14px 12px;border-bottom:1px solid var(--line)}
.tbl tr:hover td{background:var(--alt)}
.tbl td.num,.tbl th.num{text-align:right}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.listc{padding:22px}
.li{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
.li:last-child{border:0}
.li .ph{border-radius:var(--r)}
.li b{display:block;font-size:14px}
.li span{font-size:12.5px;color:var(--muted)}
.stack{display:flex;height:12px;border-radius:99px;overflow:hidden;margin:16px 0 14px;gap:2px}
.stack i{display:block}
.legend{display:grid;gap:8px;font-size:13px}
.legend div{display:flex;align-items:center;gap:10px}
.legend i{width:10px;height:10px;border-radius:3px}
.legend b{margin-left:auto}

/* ============== DESIGN SYSTEM page ============== */
.ds h2.ds-t{font-size:30px;margin-bottom:6px}
.ds .blk{padding:48px 0;border-bottom:1px solid var(--line)}
.ds .blk:last-child{border:0}
.ds .lead2{color:var(--muted);margin:0 0 26px;max-width:70ch}
.sws{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.swc{border-radius:var(--card-r);overflow:hidden;border:1px solid var(--line);background:var(--surf)}
.swc .c{height:84px}
.swc div.m{padding:12px 14px;font-size:13px}
.swc b{display:block;font-size:14px}
.swc code{color:var(--muted);font-size:12px}
.swc em{display:block;font-style:normal;color:var(--muted);margin-top:4px;font-size:12px}
.type-row{display:grid;grid-template-columns:140px 1fr;gap:20px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--line)}
.type-row small{color:var(--muted);font-size:12.5px}
.demo{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.demo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
.space{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
.space div{display:grid;gap:8px;text-align:center;font-size:12px;color:var(--muted)}
.space i{display:block;background:var(--brand);opacity:.85;border-radius:3px}
.radii{display:flex;gap:18px;flex-wrap:wrap}
.radii div{width:104px;height:80px;background:var(--soft);border:1px solid var(--line);display:grid;place-items:center;font-size:12px;color:var(--brand-d);font-weight:600}
.elev{display:flex;gap:22px;flex-wrap:wrap}
.elev div{width:150px;height:84px;background:var(--surf);border-radius:var(--card-r);display:grid;place-items:center;font-size:12.5px;font-weight:600}
.icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px}
.icons div{display:grid;place-items:center;gap:8px;padding:14px 4px;border:1px solid var(--line);border-radius:var(--r);font-size:11.5px;color:var(--muted);background:var(--surf)}
.icons .ic{color:var(--brand);width:24px;height:24px}
.rules{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:0;padding:0;list-style:none}
.rules li{padding:16px 18px;background:var(--surf);border:1px solid var(--line);border-radius:var(--card-r)}
.rules b{display:block;margin-bottom:4px}
.tick{display:inline-grid;place-items:center;width:20px;height:20px;border:1.5px solid var(--line);border-radius:5px;background:var(--surf);vertical-align:middle}
.tick.on{background:var(--brand);border-color:var(--brand);color:#fff}
.tick .ic{width:13px;height:13px;stroke-width:2.4}
.tog{display:inline-block;width:42px;height:24px;border-radius:99px;background:var(--line);position:relative;vertical-align:middle}
.tog::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.tog.on{background:var(--brand)}
.tog.on::after{left:21px}

/* ================= RESPONSIVE (container queries: reacts to the preview width, not the window) ================= */
@container f (max-width: 1040px){
  .wrap{padding:0 28px}
  .sec{padding:64px 0}
  .nav{gap:18px;font-size:14px}
  .srch{width:150px}
  .cats{grid-template-columns:repeat(3,1fr)}
  .prods{grid-template-columns:repeat(2,1fr)}
  .promo{grid-template-columns:1fr}
  .promo .txt{padding:44px 36px}
  .pdp{gap:32px}
  .cz{grid-template-columns:1fr 1fr}
  .kpis{grid-template-columns:repeat(2,1fr)}
  .grid2{grid-template-columns:1fr}
  .adm{grid-template-columns:76px 1fr}
  .side{padding:20px 10px;align-items:center}
  .side h5,.side a span,.side .logo span,.side .me div,.side a .cnt{display:none}
  .side a{padding:12px}
  .side .logo{padding:0 0 14px}
  .ftr .wrap>.g{grid-template-columns:1fr 1fr}
}
@container f (max-width: 760px){
  .wrap{padding:0 18px}
  .sec{padding:48px 0}
  .sec-head{flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:24px}
  .sec-head h2{font-size:28px}
  .hdr .wrap{height:64px;gap:10px}
  .hdr .nav,.hdr .srch,.hdr .hide-m{display:none}
  .hdr .only-m{display:grid}
  .logo{flex:1;font-size:23px}
  .announce{font-size:11.5px}
  .hero .wrap{grid-template-columns:1fr;min-height:0;padding-top:30px;padding-bottom:10px;gap:10px}
  .hero h1{font-size:clamp(36px,10.5cqw,52px);margin:14px 0}
  .hero .lead{font-size:16px}
  .hero .eyebrow::before,.float{display:none}
  .hero .cta{margin:22px 0 22px}
  .hero .cta .btn{flex:1}
  .hero .mini{gap:10px 18px;font-size:12.5px}
  .trust .wrap{grid-template-columns:1fr 1fr;gap:16px}
  .trust .ico{width:38px;height:38px}
  .trust b{font-size:13px}.trust span{font-size:12px}
  .cats{grid-template-columns:repeat(2,1fr);gap:12px}
  .prods{gap:14px}
  .prod h3{font-size:14.5px}
  .prod .btn{height:40px;font-size:13px;padding:0 10px}
  .promo .txt{padding:34px 22px}
  .promo h2{font-size:30px}
  .vp{min-height:320px}
  .mini-panel{display:none}
  .how,.reviews{grid-template-columns:1fr}
  .ftr .wrap>.g{grid-template-columns:1fr 1fr;gap:28px}
  .ftr .wrap>.g>div:first-child{grid-column:1/-1}
  .pdp{grid-template-columns:1fr;gap:26px}
  .pdp h1{font-size:30px}
  .gal{grid-template-columns:1fr}
  .thumbs{grid-template-columns:repeat(4,1fr);order:2}
  .buy{grid-template-columns:1fr}
  .sticky-buy{display:flex;position:sticky;bottom:0;z-index:5;align-items:center;gap:12px;background:var(--surf);border-top:1px solid var(--line);padding:12px 18px;box-shadow:0 -10px 30px -16px rgba(0,0,0,.3)}
  .sticky-buy b{font:700 18px var(--body)}
  .sticky-buy .btn{flex:1;height:46px}
  .cz{grid-template-columns:1fr}
  .cz .vp{min-height:340px}
  .cz-panel{border-left:0;border-top:1px solid var(--line);padding:20px 18px}
  .two{grid-template-columns:1fr;gap:20px}
  .sumcard{position:static}
  .pagehead h1{font-size:30px}
  .line{grid-template-columns:76px 1fr;gap:14px}
  .line .amt{grid-column:2;text-align:left}
  .fgrid{grid-template-columns:1fr}
  .adm{grid-template-columns:1fr}
  .side{display:none}
  .main{padding:0 16px 30px}
  .top .only-m{display:grid}
  .top .srch{display:none}
  .kpis{grid-template-columns:1fr 1fr;gap:10px}
  .kpi{padding:14px}.kpi .v{font-size:22px}
  .type-row{grid-template-columns:1fr;gap:4px}
  .rules{grid-template-columns:1fr}
  .tbl{padding:16px}
  .ph-row h1{font-size:24px}
}
table.cmp td:nth-child(9),table.cmp td:nth-child(10){min-width:250px}
.hero .wrap{padding-bottom:0}
.hero .wrap>div:first-child{align-self:center;padding-bottom:48px}
.hero-fig{align-self:end}
.crumbs{flex-wrap:wrap;align-items:center}
.crumbs .ic{margin:0 -4px;transform:rotate(-90deg)}
@container f (max-width: 760px){.hero .wrap>div:first-child{padding-bottom:8px}}
@container f (max-width: 1040px){
  .hdr .srch{display:none}
  .hdr .wrap{gap:20px}
  .nav{gap:16px;font-size:13.5px}
}
@container f (max-width: 900px){
  .hero .wrap{grid-template-columns:1fr;min-height:0;padding-top:44px}
  .hero .wrap>div:first-child{padding-bottom:8px}
  .hero-fig{max-width:560px;margin:0 auto;width:100%}
  .trust .wrap{grid-template-columns:1fr 1fr}
}
```
