# Giftora UI/UX Design System

**Status:** Design artifact — documentation only. No code in this repository has been changed to produce this document.
**Scope:** Customer frontend (`apps/customer-frontend`) and Admin frontend (`apps/admin-frontend`).
**Method:** Every statement about "current" UI below was verified by reading the actual source (routes, components, `index.css` design tokens) — not assumed or templated.

---

## 0. Audit Summary (what actually exists today)

### Customer frontend
- **Design tokens already exist and are good**, defined in `src/index.css` via Tailwind v4's `@theme`:
  - Fonts: `--font-display: "Fraunces", Georgia, serif` (headings), `--font-sans: "Plus Jakarta Sans"` (body).
  - Colors: `ink #1a1712`, `paper #fbf9f6`, `surface #ffffff`, `muted #8a8273`, `border #e7e1d6`, `accent #a8763e`, `accent-dark #7c5629`, `accent-soft #f1e6d6`, `danger #b3432c`, `success #3f6b4a`.
  - Radii: `--radius-card: 1rem`, `--radius-control: 0.65rem`.
  - One shadow token: `--shadow-card`.
- A real component library already exists: `ui/{Button,Badge,Card,Input,Skeleton}.jsx`, `product/*` (ProductCard, CatalogFilters, ColorSwatchPicker, QuantitySelector, SortMenu, skeletons, empty/unavailable states), `orders/*` (StatusBadge, Timeline, ItemsList, AddressSummary), `customiser/*` (the 3D engine's own UI), `home/*` (Hero, CategoryGrid, HowItWorks, TrustBar, PromoBanner), `layout/{Header,Footer}`.
- 15 routes: `/`, `/products`, `/products/:slug`, `/customise/:productId`, `/cart`, `/addresses`, `/checkout`, `/order-success/:orderId`, `/track-order`, `/login`, `/register`, `/my-orders`, `/orders/:orderId`, `/contact`, `404`.
- The **3D Customizer** (`/customise/:productId`) already has a deliberate two-column layout: ~60% 3D viewport (light-blue grid background, drag-to-rotate/zoom, live dimensions overlay) / ~40% scrollable numbered-step panel (Text → Font → Colors → Thickness), with secondary controls tucked into a collapsed "More options" disclosure. **This is the most visually developed screen in the app already** and is treated as the anchor for the rest of the system's visual language, not a blank slate.
- `/track-order` and `/contact` are still placeholder pages (`PagePlaceholder` component) — no real UI to audit there yet.

### Admin frontend
- **No design tokens at all** — `src/index.css` is a bare `@import "tailwindcss"`. Every screen is built from raw Tailwind grayscale utilities (`gray-50`...`gray-900`), `white`/`black` buttons, and ad-hoc `rounded-md`/`rounded-lg`. It works, but has no brand identity and looks interchangeable with any other admin template.
- Real functional components exist (`Banner`, `StatCard`, `DateRangeFilter`, `SimpleBarChart`, `AdminLayout`) built during earlier phases, but they're all styled individually with inline Tailwind, not against shared tokens.
- 11 routes: `/login`, `/` (dashboard), `/products`, `/products/new`, `/products/:id/edit`, `/categories`, `/orders`, `/orders/:id`, `/customers`, `/customers/:id`, `/reports`.
- Layout: a single top header bar (logo-left, horizontal nav-right) + content area — no sidebar yet, despite the brief's "Sidebar/navigation" ask (flagged explicitly in the blueprint document as a proposed structural change).

**Conclusion driving this document:** the customer frontend has a genuine, tasteful starting point (warm neutrals, serif display type, a named "accent" bronze/ochre) that reads as intentional, not generic. The design system below **extends that existing direction** rather than replacing it, and brings the admin frontend up to the same standard using a parallel, more utilitarian palette appropriate for a working tool.

---

## 1. Brand and Visual Direction

**Positioning:** Giftora sells personalized, 3D-printed keepsakes (keychains, nameplates). The brand should feel like a **craft studio**, not a generic "tech" storefront — warm, tactile, considered. Avoid the generic-AI-UI tells: pure black/white + one saturated "brand blue," heavy glassmorphism, oversized rounded-everything, emoji-as-icons, and centered-everything hero sections with no asymmetry.

**Direction:** "Warm atelier." Cream/paper backgrounds, ink-black text, a single confident bronze/ochre accent (already present — keep it), generous whitespace, a serif display face for headings paired with a clean geometric sans for everything else. Asymmetric, editorial layouts over centered template layouts.

### Color palette

**Customer (extends the existing tokens — no breaking renames):**

| Token | Hex | Use |
|---|---|---|
| `--color-ink` | `#1a1712` | Primary text, high-emphasis UI |
| `--color-paper` | `#fbf9f6` | App background |
| `--color-surface` | `#ffffff` | Cards, elevated panels |
| `--color-muted` | `#8a8273` | Secondary text |
| `--color-border` | `#e7e1d6` | Hairlines, dividers |
| `--color-accent` | `#a8763e` | Primary actions, links, focus |
| `--color-accent-dark` | `#7c5629` | Hover/active states |
| `--color-accent-soft` | `#f1e6d6` | Badge fills, subtle highlights |
| `--color-danger` | `#b3432c` | Errors, destructive actions |
| `--color-success` | `#3f6b4a` | Success states |
| **New:** `--color-info` | `#3f5a73` | Informational banners (distinct from accent so "info" ≠ "brand action") |
| **New:** `--color-ink-soft` | `#4a4336` | Secondary headings, de-emphasized large text |

**Admin (new — a cooler, denser palette for a working tool, visually related but distinct from the customer brand so the two apps are never confused for each other):**

| Token | Hex | Use |
|---|---|---|
| `--admin-ink` | `#171a1f` | Primary text |
| `--admin-canvas` | `#f6f7f9` | App background |
| `--admin-surface` | `#ffffff` | Cards, tables, panels |
| `--admin-muted` | `#6b7280` | Secondary text |
| `--admin-border` | `#e3e6eb` | Hairlines |
| `--admin-accent` | `#3b5bdb` | Primary actions (deliberately a cool blue — reads as "tool," contrasts with the customer app's warm bronze) |
| `--admin-accent-dark` | `#2d47ad` | Hover/active |
| `--admin-accent-soft` | `#e8edfb` | Badge fills |
| `--admin-success` | `#1f8a4c` | Delivered, active, success |
| `--admin-warning` | `#b5790a` | Pending, low-stock-style warnings |
| `--admin-danger` | `#c0392b` | Cancelled, refunded, destructive |
| `--admin-info` | `#3f5a73` | Neutral informational states |

### Typography

| Role | Customer | Admin |
|---|---|---|
| Display / H1-H2 | Fraunces (serif), -0.01em tracking | Same sans as body, 600-700 weight (admin stays utilitarian, no serif) |
| Body / UI | Plus Jakarta Sans | Inter (new — a standard, highly legible UI sans; not currently loaded anywhere in the project) |
| Monospace (order numbers, SKUs, JSON) | — | `ui-monospace, SFMono-Regular, Menlo, monospace` (system stack, zero extra dependency) |

Type scale (both apps, rem-based, 16px root):
`text-xs 0.75` / `text-sm 0.875` / `text-base 1` / `text-lg 1.125` / `text-xl 1.25` / `text-2xl 1.5` / `text-3xl 1.875` / `text-4xl 2.25` / `text-5xl 3`. (These are Tailwind's own defaults — kept deliberately standard so nothing new has to be configured.)

### Spacing scale
Standard Tailwind 4px base scale (`1 = 0.25rem` ... `96 = 24rem`), used as-is. No custom spacing tokens are introduced — the existing codebase already composes spacing utilities directly (`p-5`, `gap-3`, `mt-8`, etc.) consistently; inventing a parallel scale would only create drift.

### Border radius
| Token | Value | Use |
|---|---|---|
| `--radius-control` | `0.65rem` (existing) | Inputs, buttons, small controls |
| `--radius-card` | `1rem` (existing) | Cards, panels, modals |
| **New:** `--radius-pill` | `9999px` | Badges, status chips, filter pills |
Admin reuses the **same** radius values (not a separate scale) — radius is a shape language, not a brand color, so sharing it keeps both apps feeling like one product family.

### Shadows
| Token | Value | Use |
|---|---|---|
| `--shadow-card` (existing) | `0 1px 2px rgba(26,23,18,.04), 0 8px 24px -12px rgba(26,23,18,.12)` | Cards, dropdowns |
| **New:** `--shadow-popover` | `0 4px 10px rgba(26,23,18,.08), 0 20px 40px -16px rgba(26,23,18,.18)` | Menus, dialogs, toasts — one step more pronounced than card shadow |

### Iconography
Use a single, consistent **outline-style icon set at 1.5-1.8px stroke weight** (the existing hand-drawn SVGs in `Header.jsx`'s menu icon and `CategoryGrid.jsx` already use this exact stroke style — standardize on it everywhere rather than mixing in a filled/emoji icon set later). No emoji as functional icons anywhere in the product.

### Animation principles
- **Purposeful, not decorative.** Every transition confirms an action already happened (hover, focus, success) or orients the user during a layout change (route transition, panel open/close). Nothing animates just to look alive.
- Durations: micro-interactions (hover/focus) 120-150ms; panel/dialog open-close 200-250ms; page-level transitions 250-300ms. Easing: `ease-out` for things entering/appearing, `ease-in` for things leaving.
- Respect `prefers-reduced-motion: reduce` — all transform/opacity transitions collapse to instant or near-instant.
- The one place genuine motion is justified: the 3D Customizer's own live preview (inherent to the feature) and a subtle skeleton shimmer on loading states (already implemented via `ui/Skeleton.jsx`).

---

## 2. Customer Design System

### Homepage
Current: Hero (asymmetric text-left/illustration-right — good, keep this asymmetry), CategoryGrid (3 static cards), featured/best-seller ProductSections, HowItWorks, TrustBar, PromoBanner. Direction: keep the existing structure; the opportunity is depth and photography, not restructuring. Replace the hero's placeholder SVG illustration with an actual rendered product photo/3D-render once real product photography exists (currently every seeded product uses a text-placeholder image service). Category cards should eventually read from the real `/categories` API (noted as a known gap from Phase 4) once there's real category artwork to show, rather than the current hardcoded 3-card set.

### Navigation and footer
Header: sticky, blurred-background bar, logo left, inline nav center, auth/cart actions right — already solid. Proposed refinement: cart icon should show an item-count badge (currently absent — flagged in Phase 6's own limitations). Footer: not yet audited in depth in this pass beyond confirming it exists and renders a `Date`-driven year (flagged separately as a minor lint purity warning, not a design issue).

### Product cards
Current `ProductCard.jsx`: square image, material badge, name, price — clean and already on-brand. Refinement: add a subtle "from ₹X" price framing once products have per-variant pricing, and a quick-view affordance on hover (secondary priority).

### Product catalog
`/products`: sidebar facet filters (category/material/price) + sort + search, with loading skeleton and empty state already implemented. This is functionally complete; the visual opportunity is tightening the facet sidebar's typography hierarchy and adding active-filter pill chips above the grid (component already exists: `ActiveFilters.jsx` — ensure it's styled as pills per the component spec below).

### Product details
Two-column gallery + info, color/material/size pickers, related products. Solid. Add a sticky "Add to Cart" bar on mobile once the page scrolls past the primary CTA (common ecommerce pattern, currently absent).

### 3D Customizer
Already the strongest screen (see Audit Summary). Treat as the reference for: numbered step cards, the light-blue preview grid, and the collapsed "More options" disclosure pattern — **reuse these exact patterns** anywhere else in the app that needs progressive disclosure (e.g., checkout's address form, admin's product form).

### Cart and checkout
Cart: line items with image/customization/qty/line-total, subtotal/total — functional and clear. Checkout: address selection + server-revalidated order summary + blocking/non-blocking issue badges (price-changed vs. unavailable) — this is genuinely good UX (transparent revalidation) and should be preserved exactly, only re-skinned with the visual system below.

### Customer account and orders
Addresses, My Orders (list with status badge + item summary), Order Details (adds a status timeline). All present and functional. Opportunity: a lightweight account-overview page could later tie addresses + orders + profile together (not currently a route) — flagged as a future idea, not a Phase 1 requirement.

---

## 3. Admin Design System

### Dashboard
Currently a stat-card grid (12 cards) fed by real `/admin/reports/dashboard` data, with a link to full Reports. Keep the stat-grid pattern; apply the new admin tokens (cool accent, `--admin-*` palette) and group related stats visually (revenue cluster, order-status cluster, catalog cluster) instead of one flat 12-up grid.

### Sidebar/navigation
**Structural change proposed**: move from the current single top horizontal nav bar to a **persistent left sidebar** (Dashboard, Products, Categories, Orders, Customers, Reports, grouped with section labels) + a slim top bar (search, account menu). This is the standard, higher-information-density pattern for admin tools with this many sections, and leaves room to grow (future Inventory/Contact-notifications entries) without the nav bar overflowing.

### Analytics cards
`StatCard.jsx` already exists and is simple/correct. Add a trend indicator slot (↑/↓ vs. previous period) once period-over-period comparison is implemented (not yet — current reports are single-range only).

### Tables and filters
`Orders.jsx`/`Customers.jsx`/`Categories.jsx` already use a consistent table pattern (header row in `gray-50`, hover-free plain rows, action links). Formalize this into the shared `Table` component specified below, with: zebra-free but hover-highlighted rows, right-aligned numeric columns, and a consistent empty-state message pattern (already present ad hoc, standardize via the shared `EmptyState` admin component).

### Forms and dialogs
`ProductForm.jsx`/`Categories.jsx` use plain stacked label+input blocks — functional, no visual system. Standardize via the shared `Input`/`Select` components below. Destructive actions (delete product/category) currently use a native `window.confirm()` — acceptable for now, but the component spec below defines a proper `Dialog` for when this is revisited.

### Status indicators
`OrderStatusBadge`-equivalent patterns already exist inline in `Orders.jsx`/`CustomerDetail.jsx` (colored pill per status). Formalize into one shared `Badge` component (see below) driven by a single status→tone mapping, reused for order status, active/deactivated customer status, and product active/inactive status.

### Reports and charts
`SimpleBarChart.jsx` (CSS-only, no charting dependency) already renders sales-by-date and orders-over-time. Keep this dependency-free approach; refine with axis labels and a hover tooltip (currently only a native `title` attribute) as a visual upgrade, not a library swap.

---

## 4. UI Components (shared specification)

Each component below lists: purpose, states, and visual rule. Customer and Admin each get their own token values (per §1) but share the same *shape* (radius, spacing, interaction states).

| Component | States | Rule |
|---|---|---|
| **Button** | primary / secondary / ghost / danger × default/hover/focus/disabled/loading | `radius-control`; primary = solid accent/ink; focus = 2px ring in accent at 30% opacity (already the exact pattern in `Input.jsx` — reuse it) |
| **Input / Textarea** | default/focus/error/disabled | Label above, hint or error below (never both); error replaces hint, never stacks |
| **Select** | default/focus/error/disabled | Same frame as Input; native `<select>` is acceptable (already used) — no custom dropdown required for Phase 1 |
| **Card** | static / interactive (hoverable) | `radius-card`, `shadow-card`; interactive cards get a hover shadow step-up only, never a scale transform (avoids layout jitter) |
| **Badge** | tone: neutral/accent/success/danger/warning/info | `radius-pill`, soft background + matching dark text, never a hard-filled saturated badge |
| **Dialog / Modal** | opening/open/closing | Centered, `shadow-popover`, backdrop at ink/40%, focus-trapped, closes on Escape and backdrop click |
| **Table** | default row / hover row / empty / loading | Header row uses `muted` text at `text-xs uppercase tracking-wide`; numeric columns right-aligned; one `EmptyState` row spanning all columns when empty |
| **Navigation (nav link / sidebar item)** | default/active/hover | Active state = filled pill (customer) or filled sidebar row (admin), never just a color change with no shape change (shape changes are easier to scan) |
| **Loading skeleton** | — | Already implemented (`Skeleton.jsx`, `ProductGridSkeleton`, `ProductDetailSkeleton`) — extend the same pattern to every admin list/table view, which currently just shows a plain "Loading…" text line |
| **Empty state** | — | Icon (outline style per §1) + one-line message + one primary action when applicable (already implemented well on the customer side via `EmptyState.jsx`; admin needs the same treatment, currently plain text) |
| **Toast notification** | success/error/info | **New component, not yet implemented anywhere** — currently success/error messages are static inline `Banner`s (admin) or inline `<p>` tags (customer) that don't auto-dismiss. Proposed: a bottom-right (desktop) / bottom-center (mobile) toast stack, auto-dismiss after 4s for success/info, manual-dismiss for error, `shadow-popover` |

---

## 5. Responsive Design

| Breakpoint | Width | Customer behavior | Admin behavior |
|---|---|---|---|
| Mobile | `<640px` | Single column everywhere; Customizer stacks preview above controls (already implemented); Header collapses to hamburger menu (already implemented); product grid 2-up | Sidebar collapses to an off-canvas drawer (hamburger trigger in the slim top bar); tables scroll horizontally within a bounded card rather than overflowing the page |
| Tablet | `640-1024px` | Product grid 3-up; Customizer's 60/40 split may compress to ~55/45 or stack depending on available width; catalog facet sidebar can remain visible | Sidebar can auto-collapse to icon-only (tooltips on hover) to reclaim width for tables |
| Desktop | `>1024px` | Full layouts as currently implemented (product grid up to 3-up within the 6xl max-width container, Customizer at 60/40) | Full sidebar + content, tables show all columns |

General rule carried over from the existing codebase (already followed consistently): a single `max-w-*xl mx-auto px-4 sm:px-6` container pattern per page — keep it, don't introduce a second container convention.

---

## 6. UX Standards

- **Accessibility:** every interactive element must have a visible focus ring (the `focus:ring-2 focus:ring-accent/30` pattern already exists in `Input.jsx`/`Login.jsx` forms — extend it to every button/link, including admin, which currently relies on browser-default focus outlines only in places). All images require `alt` text (product images already do via `product.name`). Color is never the only signal for status — every status badge also carries a text label (already true everywhere audited).
- **Keyboard navigation:** all forms must be fully submittable via keyboard (already true — native `<form onSubmit>` is used throughout). Dialogs (once implemented per §4) must trap focus and restore it to the triggering element on close. The mobile menu (`Header.jsx`) should close on Escape (currently only closes on link click/outside click — a small real gap worth fixing in implementation).
- **Loading/error/success states:** already a strong, consistent pattern across the whole app (every data-fetching hook built since Phase 4 returns `{data, isLoading, error}` and every page branches on it explicitly). Formalize this as a hard rule going forward: no page may render its "happy path" without having first handled loading and error.
- **Form validation:** inline, field-level, on submit (not on every keystroke) — matches the current implementation (e.g., `ProductForm.jsx`, `Addresses.jsx`). Keep client-side validation as a UX convenience only; the backend remains the source of truth (already the architecture — every form surfaces the backend's real error message).
- **Interaction feedback:** every async action (add to cart, place order, update status, save form) must show a busy/disabled state on its trigger control during the request (already implemented via `disabled={mutating}`-style patterns) and a confirmation afterward (currently inconsistent — some flows show an inline success message, others silently redirect; standardize on the new Toast component for anything that doesn't navigate away).
- **Responsive usability:** touch targets ≥40px on mobile (the existing `QuantitySelector`/button sizing already meets this); no hover-only affordances on mobile (already avoided — all current interactive elements are click/tap-triggered, not hover-reveal).

---

## 7. Design Tokens Reference (for implementation phase only — not applied yet)

```css
/* apps/customer-frontend/src/index.css — additive, non-breaking */
@theme {
  /* existing tokens unchanged */
  --color-info: #3f5a73;
  --color-ink-soft: #4a4336;
  --radius-pill: 9999px;
  --shadow-popover: 0 4px 10px rgba(26, 23, 18, 0.08), 0 20px 40px -16px rgba(26, 23, 18, 0.18);
}
```

```css
/* apps/admin-frontend/src/index.css — net-new, admin only */
@theme {
  --color-admin-ink: #171a1f;
  --color-admin-canvas: #f6f7f9;
  --color-admin-surface: #ffffff;
  --color-admin-muted: #6b7280;
  --color-admin-border: #e3e6eb;
  --color-admin-accent: #3b5bdb;
  --color-admin-accent-dark: #2d47ad;
  --color-admin-accent-soft: #e8edfb;
  --color-admin-success: #1f8a4c;
  --color-admin-warning: #b5790a;
  --color-admin-danger: #c0392b;
  --color-admin-info: #3f5a73;
  --radius-control: 0.65rem;
  --radius-card: 1rem;
  --radius-pill: 9999px;
  --shadow-card: 0 1px 2px rgba(23, 26, 31, 0.04), 0 8px 24px -12px rgba(23, 26, 31, 0.12);
  --shadow-popover: 0 4px 10px rgba(23, 26, 31, 0.08), 0 20px 40px -16px rgba(23, 26, 31, 0.18);
}
```

This reference is provided for the implementation phase and has **not** been added to either `index.css` file in this pass.

---

See `GIFTORA_PAGE_REDESIGN_BLUEPRINT.md` for the page-by-page breakdown.
