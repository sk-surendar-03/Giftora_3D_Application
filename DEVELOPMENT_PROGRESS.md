# Giftora — Development Progress

## Phase 1: Customer Frontend Foundation — Complete (2026-11-03)

### Pre-existing state (inspected before changes)

`apps/customer-frontend` was already a working React 19 + Vite 8 + Tailwind CSS v4
app, not a bare scaffold. It already had, before this phase:

- `react-router-dom` v7 with a full route table (`src/routes/AppRoutes.jsx`) covering
  home, products, product detail, customiser, cart, checkout, order success,
  track order, login, register, my-orders, contact, 404.
- `@react-three/fiber`, `@react-three/drei`, `three` installed and a working
  `Customiser` page with a live `<Canvas>`, orbit controls, and a `ProductModel`
  mesh that reacts to text/colour state (preview-only, not STL generation).
- A `MainLayout` (Header/Footer/Outlet), a basic `Button`/`ProductCard` kit,
  sample product data, and an axios client in `src/services/api.js`.
- No TypeScript, no Zustand, no TanStack Query, no React Hook Form, no Zod —
  none of these were installed. Per the brief ("do not install unnecessary
  dependencies", "do not convert JS to TS without approval"), none were added
  in this phase; they'll be introduced in the phase that first needs them
  (cart/checkout state, forms) rather than up front.
- No `DEVELOPMENT_PROGRESS.md` existed yet — created by this phase.

Nothing above was rebuilt. Phase 1 scope was foundation/design-system work:
routing and page wiring were already sound and were left alone except for
import-path updates from the file moves below.

### What changed

**Design system** (`src/index.css`)
- Added a Tailwind v4 `@theme` token set: `--font-display` (Fraunces),
  `--font-sans` (Plus Jakarta Sans), a warm neutral + brass-accent colour
  palette (`ink`, `paper`, `surface`, `muted`, `border`, `accent`,
  `accent-dark`, `accent-soft`, `danger`, `success`), two radius tokens
  (`card`, `control`), and one shadow token (`card`).
- Replaced the generic Tailwind gray scale used ad hoc across components with
  these semantic tokens, so colour/spacing/radius decisions are made once and
  reused everywhere.
- `index.html`: added the Google Fonts link for the two typefaces, a meta
  description, and fixed the page `<title>` (was still the leftover "client"
  title from before the monorepo move).

**Reusable UI primitives** (new — `src/components/ui/`)
- `Button.jsx` — variants (`primary`, `accent`, `secondary`, `ghost`) and sizes
  (`sm`, `md`, `lg`), replacing the old two-variant `Button`.
- `Card.jsx`, `Badge.jsx`, `Input.jsx`, `Skeleton.jsx` — new, used by later
  phases (product grid, forms, loading states) instead of one-off markup.

**Feature-oriented component structure**
- Moved `Header.jsx`, `Footer.jsx` → `src/components/layout/`.
- Moved `ProductCard.jsx` → `src/components/product/`.
- Removed the old `src/components/{Header,Footer,Button,ProductCard}.jsx` and
  updated every import (`MainLayout`, `Home`, `Products`, `ProductDetail`,
  `Customiser`) to the new paths. `PagePlaceholder.jsx` stayed in
  `components/` (shared, not layout/product-specific) and was restyled onto
  the new tokens.
- Footer was expanded from a single copyright line into a real site footer
  (brand blurb + Shop/Support link columns) since it's part of the layout
  foundation every page sits inside.

**Environment / API config**
- Added `apps/customer-frontend/.env.example` with `VITE_API_URL`.
- `src/services/api.js`: the previous fallback baseURL (`:5000/api`) matched
  neither the master-prompt example nor this repo's actual backend scaffold.
  The real backend (`apps/backend/.env.example`, from the earlier monorepo
  restructure) runs on **port 4000** with a `/api/v1` prefix. Followed the
  actual repo over the prompt's illustrative example and set the fallback to
  `http://localhost:4000/api/v1` — flagging this because it's a judgment call,
  not something stated outright in this phase's instructions.

### Files created
- `apps/customer-frontend/src/components/ui/Button.jsx`
- `apps/customer-frontend/src/components/ui/Card.jsx`
- `apps/customer-frontend/src/components/ui/Badge.jsx`
- `apps/customer-frontend/src/components/ui/Input.jsx`
- `apps/customer-frontend/src/components/ui/Skeleton.jsx`
- `apps/customer-frontend/src/components/layout/Header.jsx`
- `apps/customer-frontend/src/components/layout/Footer.jsx`
- `apps/customer-frontend/src/components/product/ProductCard.jsx`
- `apps/customer-frontend/.env.example`
- `DEVELOPMENT_PROGRESS.md` (this file)

### Files modified
- `apps/customer-frontend/index.html`
- `apps/customer-frontend/src/index.css`
- `apps/customer-frontend/src/components/PagePlaceholder.jsx`
- `apps/customer-frontend/src/layouts/MainLayout.jsx`
- `apps/customer-frontend/src/pages/Home.jsx`
- `apps/customer-frontend/src/pages/Products.jsx`
- `apps/customer-frontend/src/pages/ProductDetail.jsx`
- `apps/customer-frontend/src/pages/Customiser.jsx`
- `apps/customer-frontend/src/services/api.js`

### Files removed
- `apps/customer-frontend/src/components/Header.jsx`
- `apps/customer-frontend/src/components/Footer.jsx`
- `apps/customer-frontend/src/components/Button.jsx`
- `apps/customer-frontend/src/components/ProductCard.jsx`
(contents preserved, relocated to the paths above)

### Dependencies added
None.

### Commands executed
```
npm run lint   (apps/customer-frontend)
npm run build  (apps/customer-frontend)
npm run dev -- --port 5180   (manual smoke test, then killed)
```

### Test / verification results
- `npm run lint`: passes. One pre-existing warning (`Footer.jsx:
  react(purity)`, calling `new Date()` during render) — present in the
  original Footer before this phase too; not a regression, not fixed here
  since it's cosmetic (copyright year) and out of this phase's scope.
- `npm run build`: succeeds. Output ~1.37 MB main chunk (three.js is the bulk
  of it) — oxlint/vite warns about chunk size; acceptable for now, to be
  addressed with code-splitting in the performance pass (Section 11 of the
  brief), not Phase 1.
- Manual smoke test: dev server started on an alternate port, all 11 routes
  (`/`, `/products`, `/products/:slug`, `/customise/:id`, `/cart`,
  `/checkout`, `/login`, `/register`, `/my-orders`, `/contact`,
  `/track-order`, unknown path) returned HTTP 200 and the Tailwind theme
  compiled with the new tokens present in the served CSS.

### Backend integration status
Not started. `apps/backend` has only a health-check endpoint
(`GET /api/v1/health`) from the earlier monorepo scaffold — no auth, product,
cart, checkout, order, wishlist, or review endpoints exist yet. The customer
frontend's `services/api.js` is a bare axios client with a correct base URL;
no API service modules (`auth-service`, `product-service`, etc.) were built
in this phase since there's nothing real to call yet. Those land in the phase
that needs them, backed by whatever the backend actually exposes at that
time.

### Known limitations
- No shared types/contracts between frontend and backend yet
  (`packages/shared` is still empty).
- No TypeScript — all phases will stay in JS unless explicitly approved.
- No state management (Zustand) or server-state layer (TanStack Query) yet —
  not needed until cart/checkout (Phase 6/7) and real API data (as soon as
  the backend has endpoints to query).
- `Customiser` still uses a placeholder box mesh, not a loaded STL/GLB model —
  that's Phase 5 scope.

### Next phase
Phase 2 — Homepage and navigation. **Approved and completed — see below.**

---

## Phase 2: Homepage & Navigation — Complete (2026-11-03)

### Inspected before changes
Re-read this file, then `Home.jsx`, `Header.jsx`, `Footer.jsx`,
`sampleProducts.js`, `AppRoutes.jsx`, and the Phase 1 `ui/` and `product/`
components. Phase 1's token system (`ink`/`paper`/`surface`/`muted`/`accent`)
and existing routes were kept as-is; nothing was renamed or restructured.

### What changed

**Homepage** (`src/pages/Home.jsx`) — rebuilt from a single hero + one
product grid into six sections, each a new component under
`src/components/home/`:
- `Hero.jsx` — headline, subcopy, a primary "Customize Your Keychain" CTA
  that links straight into `/customise/:id` using the first sample product
  (a real, working route — not a dead link), a secondary "Browse Products"
  CTA to `/products`, and a hand-drawn inline SVG keychain illustration
  instead of a stock/placeholder photo.
- `CategoryGrid.jsx` — three category entry points (Wooden Keychains,
  Acrylic Nameplates, Metal Keychains) derived directly from the three
  existing sample products' real materials, each linking to `/products`.
  No invented backend category/filter system.
- `ProductSection.jsx` — a reusable section (eyebrow/title/subtitle + product
  grid + "View all" link) used for both "Featured products" and "Best
  sellers".
- `HowItWorks.jsx` — four-step static explainer (choose → personalise →
  review & order → made & shipped).
- `TrustBar.jsx` — four value props (made to order, quality materials,
  nationwide shipping, support) — phrased to avoid claiming anything not yet
  built (deliberately does **not** say "secure checkout" since payment isn't
  implemented).
- `PromoBanner.jsx` — single dark banner strip with a CTA into `/products`,
  no fake discounts or sale claims.

**Navigation** (`src/components/layout/Header.jsx`)
- Added a mobile menu: a hamburger/close toggle button (inline SVG, no icon
  library added) that reveals a dropdown nav panel below `md`. Links close
  the menu on click.
- Header is now `sticky` with a translucent blurred background so it stays
  usable while scrolling a longer homepage.
- Login link is hidden on the smallest widths (still reachable from the
  mobile menu) to keep the top bar from crowding on narrow screens.

**Known data limitation:** there are only 3 sample products. "Featured
products" and "Best sellers" both draw from `sampleProducts` (the second
reversed) since there's no real backend yet to distinguish them — flagged
here rather than inventing fake extra products or a fake "bestseller" flag.

### Files created
- `apps/customer-frontend/src/components/home/Hero.jsx`
- `apps/customer-frontend/src/components/home/CategoryGrid.jsx`
- `apps/customer-frontend/src/components/home/ProductSection.jsx`
- `apps/customer-frontend/src/components/home/HowItWorks.jsx`
- `apps/customer-frontend/src/components/home/TrustBar.jsx`
- `apps/customer-frontend/src/components/home/PromoBanner.jsx`

### Files modified
- `apps/customer-frontend/src/pages/Home.jsx` (rebuilt using the new section components)
- `apps/customer-frontend/src/components/layout/Header.jsx` (mobile nav, sticky header)

### Files removed
None.

### Dependencies added
None — mobile menu icon is hand-written inline SVG, not an icon library.

### Commands executed
```
npm run lint
npm run build
npm run dev -- --port 5181   (manual smoke test, then killed)
```

### Test / verification results
- `npm run lint`: passes. Same single pre-existing warning as Phase 1
  (`Footer.jsx` calling `new Date()` during render) — unchanged, not
  introduced by this phase.
- `npm run build`: succeeds. Bundle grew slightly (~1.38 MB main chunk, up
  from ~1.37 MB) from the new homepage sections; still dominated by
  three.js, same pre-existing chunk-size warning as Phase 1.
- Manual smoke test: dev server on an alternate port, all 11 customer routes
  returned HTTP 200, page `<title>` renders correctly, hero CTA's target
  route (`/customise/<sample-product-id>`) resolves.
- Responsive check: done by reviewing the Tailwind breakpoints used
  (`sm:`/`lg:` stacking to a single column below `sm`, header's `md:hidden`
  mobile menu, `grid-cols-2` product grids at phone width) rather than a
  visual/pixel screenshot, since no browser/screenshot tool is available in
  this session — flagging this as a review-only check, not a verified visual
  pass, in case a manual look in a real browser turns up something to fix.

### Backend integration status
Unchanged from Phase 1 — no new API calls were added. All homepage content
is static/local (`sampleProducts.js` and hand-written copy); no fake
authentication, payment, or backend calls were introduced.

### Known limitations
- Only 3 sample products exist, so "Featured" and "Best sellers" overlap —
  will resolve naturally once real product data/catalog filtering exists
  (Phase 3).
- Hero illustration is a simple inline SVG placeholder, not real product
  photography (none exists yet).
- Responsive layout was verified by class inspection and a 200-status smoke
  test, not an actual rendered screenshot at phone width.

### Next phase
Phase 3 — Product catalog and filtering. **Approved and completed — see below.**

---

## Phase 3: Product Catalog and Filtering — Complete (2026-11-03)

### Inspected before changes
Re-read this file, then the existing `Products.jsx` (a bare grid with no
search/filter/sort), `ProductCard.jsx`, `sampleProducts.js` (3 products, no
`category`/`material`/`createdAt` fields yet), `ui/Input.jsx`, `ui/Badge.jsx`,
and `ProductSection.jsx` from the homepage. Confirmed catalog filtering/sort
did not exist before this phase — nothing was overwriting working logic.

### What changed

**Sample data** (`src/data/sampleProducts.js`)
- Added `category`, `material`, and `createdAt` fields to the **existing
  three products**, derived directly from their existing names/descriptions
  (e.g. the wooden keychain → `category: 'Keychains'`, `material: 'Wood'`).
  No products, prices, images, or descriptions were invented or changed —
  only structured metadata was added so filtering/sorting has something real
  to operate on. `createdAt` is used only for the "Newest" sort order, not
  displayed as a fake timestamp anywhere.

**Reusable catalog logic** (new — `src/features/products/`)
- `filters.js` — pure, framework-free functions: `getCategories`,
  `getMaterials`, `getPriceBounds`, `matchesSearch`, `filterProducts`,
  `sortProducts`, plus the `SORT_OPTIONS` list. No React, no API calls — easy
  to unit-test and to keep once a real backend does the filtering.
- `useProducts.js` — a hook returning `{ data, isLoading, error }` from the
  local sample data. It exists so swapping in a real `product-service` +
  TanStack Query later is a one-file change; `Products.jsx` already codes
  against this shape rather than importing `sampleProducts` directly.

**Catalog UI** (new — `src/components/product/`)
- `CatalogFilters.jsx` — category and material checkbox groups (built only
  from values actually present in the data) and a min/max price range backed
  by the data's real price bounds, plus a "Clear all" control.
- `ActiveFilters.jsx` — removable chips for the active search term, selected
  categories, and selected materials, plus a "Clear all" text action.
- `SortMenu.jsx` — the three sort options (Newest, Price low→high, Price
  high→low).
- `EmptyState.jsx` — shown when filters/search produce zero results, with a
  "Reset filters" button.
- `ProductGridSkeleton.jsx` — skeleton placeholder grid for the `isLoading`
  state (not currently reachable since local data resolves synchronously,
  but wired up so it activates automatically once `useProducts` talks to a
  real, possibly slow, API).
- `ProductCard.jsx` — now shows the product's material as a small badge
  (uses the existing `Badge` component from Phase 1 — no new primitive).

**Page** (`src/pages/Products.jsx`) — rebuilt around this logic:
- Search input (name, description, category, material).
- Sidebar filters on `sm:` and up; a slide-in drawer (toggled by a "Filters"
  button) on mobile, reusing the same `CatalogFilters` component so there's
  one filter UI, not two.
- Sort menu, live product count ("N products"), active-filter chips, empty
  state with reset, and a loading/error branch alongside the normal grid.
- Every `ProductCard` still links to the real `/products/:slug` detail route
  — filtering only ever changes which cards render, never their links.

### Files created
- `apps/customer-frontend/src/features/products/filters.js`
- `apps/customer-frontend/src/features/products/useProducts.js`
- `apps/customer-frontend/src/components/product/CatalogFilters.jsx`
- `apps/customer-frontend/src/components/product/ActiveFilters.jsx`
- `apps/customer-frontend/src/components/product/SortMenu.jsx`
- `apps/customer-frontend/src/components/product/EmptyState.jsx`
- `apps/customer-frontend/src/components/product/ProductGridSkeleton.jsx`

### Files modified
- `apps/customer-frontend/src/data/sampleProducts.js` (added `category`/`material`/`createdAt` to existing products)
- `apps/customer-frontend/src/pages/Products.jsx` (full catalog UI)
- `apps/customer-frontend/src/components/product/ProductCard.jsx` (material badge)

### Files removed
None.

### Dependencies added
None.

### Commands executed
```
npm run lint
npm run build
node -e "…"   (direct checks of filterProducts/sortProducts/getCategories/getMaterials/getPriceBounds against sampleProducts)
npm run dev -- --port 5182   (manual smoke test, then killed)
```

### Test / verification results
- `npm run lint` / `npm run build`: both pass, same single pre-existing
  Footer warning as Phase 1/2, bundle size essentially unchanged.
- Filter/sort logic verified directly (not just by eyeballing the UI):
  - `getCategories` → `['Keychains', 'Nameplates']`, `getMaterials` →
    `['Acrylic', 'Metal', 'Wood']`, `getPriceBounds` → `{min: 299, max: 499}`.
  - Search `"metal"` → `Metal Name Keychain` only.
  - Category filter `Keychains` → the two keychain products, nameplate excluded.
  - Material filter `Acrylic` → `Acrylic Nameplate` only.
  - Price range 300–400 → `Metal Name Keychain` only (299 and 499 correctly excluded).
  - Search for a nonexistent term → empty array (drives the empty state).
  - Sort `price-asc` → `[299, 349, 499]`; `price-desc` → `[499, 349, 299]`;
    `newest` → ordered by `createdAt` descending.
- Route smoke test: `/`, `/products`, and `/products/acrylic-nameplate` all
  return HTTP 200 with the dev server running.
- Responsive behaviour was reviewed by class inspection (`sm:` breakpoint
  switches from the mobile "Filters" button + drawer to the inline sidebar;
  product grid stays `grid-cols-2` → `sm:grid-cols-3`), consistent with how
  Phase 2's responsiveness was checked — no browser/screenshot tool is
  available in this session, so this is not a verified visual pass.

### Backend integration status
Unchanged — everything in this phase operates on local `sampleProducts`
through `useProducts()`. No new API calls, no claim that filtering is
backend-powered (the UI doesn't say "results from server" or similar).
`useProducts.js` is intentionally shaped to make the eventual swap to a real
`product-service` + TanStack Query a contained change.

### Known limitations
- Only 3 sample products and 2 categories exist, so filtering is correct but
  not very visually dramatic yet — will matter more once real product data
  exists.
- Price range uses plain number inputs, not a slider — kept it dependency-free
  per the brief's "avoid unnecessary dependencies" instruction.
- No URL query-string sync for filters/sort/search (e.g. `?category=Keychains`)
  — not requested in this phase; worth considering later for shareable/
  bookmarkable filtered views.
- Responsive layout checked via class inspection and route status codes, not
  an actual rendered screenshot.

### Next phase
Phase 4 — Product Details. **Approved and completed — see below.**

---

## Phase 4: Product Details — Complete (2026-11-03)

### Inspected before changes
Re-read this file, then the existing `ProductDetail.jsx` (name/price/description
and a single grey placeholder box, auto-redirecting via `<Navigate>` on an
unknown slug with no visible "not found" state), `sampleProducts.js` (from
Phase 3: `category`/`material`/`createdAt` but no colour/size options),
`ProductCard.jsx`, `ui/Badge.jsx`, `Customiser.jsx` (reads `useParams().productId`
only — no `location.state` consumption yet, confirming it's safe to start
passing extra state without touching this file), and `AppRoutes.jsx`.

Also used kootzy.in purely as a structural/UX reference per your instruction
(confirmed again in the prior turn): no branding, copy, or assets from that
site were used anywhere in this phase.

### What changed

**Sample data** (`src/data/sampleProducts.js`) — added `materials` (array;
currently one entry per product, structured as an array so a future product
with multiple materials needs no shape change), `colors` (array of
`{label, hex}`), and `sizes` (array of plausible, clearly-labelled size
options, e.g. `"Small (4 cm)"`). These are selectable product attributes, not
stock/discount/rating claims — nothing was invented about availability,
delivery, or pricing.

**New hook** (`src/features/products/useProduct.js`) — mirrors Phase 3's
`useProducts()` shape (`{ data, isLoading, error }`), looking up a product by
slug from local sample data. Keeps the same swap-in point for a real
`product-service` API call later.

**New product-detail components** (`src/components/product/`)
- `ProductGallery.jsx` — a main preview tinted by the selected colour plus
  three labelled view placeholders ("Front"/"Angle"/"Detail"), with a visible
  caption that real product photography isn't in yet — avoids presenting a
  placeholder as a real photo.
- `OptionPicker.jsx` — generic pill selector, used for both Material and Size.
- `ColorSwatchPicker.jsx` — circular swatch selector for colour options.
- `QuantitySelector.jsx` — stepper with min/max clamping.
- `ProductSpecs.jsx` — a specs list built only from fields the product
  actually has (category, material(s), sizes, colours) — nothing fabricated.
- `ProductUnavailable.jsx` — a real "This product isn't available" state with
  a link back to `/products`, replacing the old silent `<Navigate>` redirect.
- `ProductDetailSkeleton.jsx` — loading placeholder, same rationale as
  Phase 3's `ProductGridSkeleton` (not currently reachable since local data
  resolves synchronously, but wired up for when it isn't).

**Moved** `ProductSection.jsx` from `components/home/` → `components/product/`
(updated its one import, inside itself, from `../product/ProductCard` to
`./ProductCard`) so the Product Detail page's "Related products" section and
the homepage's featured/best-seller sections share the same component.
`Home.jsx`'s import path was updated accordingly — no behaviour change there.

**Rewritten page** (`src/pages/ProductDetail.jsx`)
- Breadcrumb, gallery, badge, name, price, description, option pickers,
  quantity, specs, and a related-products section (same category, falling
  back to the other sample products if none share a category — always real
  data, never invented items).
- The outer `ProductDetail` component now keys an inner `ProductDetailView`
  by `slug`, so navigating from one product's "Related products" link to
  another remounts the view and resets option state instead of carrying
  stale selections over (caught by `oxlint`'s `set-state-in-effect` warning
  when I first tried an effect-based reset — the `key` approach is the
  correct React pattern here and avoids the lint warning entirely).
- "Customize This Keychain" links to `/customise/:productId` and passes the
  selected material/colour/size/quantity via React Router `state` — so the
  data is available to Phase 5's customizer without this phase implementing
  any customizer logic itself. `Customiser.jsx` was not modified; it
  currently ignores this state, which is expected until Phase 5.
- Loading / error / not-found states are explicit branches, not a redirect.

### Files created
- `apps/customer-frontend/src/features/products/useProduct.js`
- `apps/customer-frontend/src/components/product/ProductGallery.jsx`
- `apps/customer-frontend/src/components/product/OptionPicker.jsx`
- `apps/customer-frontend/src/components/product/ColorSwatchPicker.jsx`
- `apps/customer-frontend/src/components/product/QuantitySelector.jsx`
- `apps/customer-frontend/src/components/product/ProductSpecs.jsx`
- `apps/customer-frontend/src/components/product/ProductUnavailable.jsx`
- `apps/customer-frontend/src/components/product/ProductDetailSkeleton.jsx`
- `apps/customer-frontend/src/components/product/ProductSection.jsx` (moved from `components/home/`)

### Files modified
- `apps/customer-frontend/src/data/sampleProducts.js` (added `materials`/`colors`/`sizes`)
- `apps/customer-frontend/src/pages/ProductDetail.jsx` (full rewrite)
- `apps/customer-frontend/src/pages/Home.jsx` (import path for the moved `ProductSection`)

### Files removed
- `apps/customer-frontend/src/components/home/ProductSection.jsx` (moved, not deleted — contents live at the new path)

### Dependencies added
None.

### Commands executed
```
npm run lint
npm run build
node --input-type=module -e "…"   (verified slug lookup, not-found handling, and related-products logic directly against sampleProducts)
npm run dev -- --port 5183        (manual smoke test, then killed)
```

### Test / verification results
- `npm run lint` / `npm run build`: both pass. Only the same pre-existing
  Footer warning remains — the `set-state-in-effect` warning raised during
  development was resolved by switching to the `key`-based remount, not
  suppressed.
- Direct logic check (Node): valid slug resolves to the right product;
  invalid slug resolves to `null` (drives `ProductUnavailable`); related-
  products filter correctly returns same-category products excluding the
  current one (`classic-name-keychain` → `Metal Name Keychain`).
- Route smoke test: all three real product slugs, an invalid slug, and
  `/customise/1` return HTTP 200 with the dev server running (the invalid
  slug lands on the client-rendered "not available" state rather than a
  redirect, confirmed via the lookup logic above since this is a
  client-rendered SPA route).
- Option selection and "navigate to customizer" were verified by code
  inspection (state wiring, `Link state={customiseState}`) and the direct
  logic check above, not a browser click-through — no browser/screenshot
  tool is available in this session, same limitation noted in Phases 2–3.
- Responsive layout: reviewed via Tailwind breakpoints (`sm:grid-cols-2` for
  gallery/info, pill and swatch pickers wrap on narrow widths), not a
  rendered screenshot — same caveat as prior phases.

### Backend integration status
Unchanged. No new API calls. `useProduct()` is local-data-only, matching
`useProducts()` from Phase 3.

### Known limitations
- Each product currently has exactly one `materials` entry — the Material
  picker is real and reusable, but today it only ever shows one selectable
  pill per product until the catalog has products with genuine material
  variants.
- No real product photography; the gallery is intentionally labelled as a
  placeholder rather than presented as real images.
- Customization state is passed to `/customise/:productId` via router
  `state`, but `Customiser.jsx` doesn't yet read it — that wiring is Phase 5's
  responsibility, not implemented here per the phase boundary in your
  instructions.
- No visual/browser verification of responsive layout or click interactions,
  consistent with Phases 2–3.

### Next phase
Phase 5 — 3D Customizer. **Approved and completed — see below.**

---

## Phase 5: 3D Customizer — Complete (2026-11-03)

### Inspected before changes
Re-read this file, then:
- `Customiser.jsx` — a flat grey box with rotating text, no zoom/reset
  controls, no error/loading handling, no material/size options, and no
  read of Phase 4's router `state`.
- `features/customiser/ProductModel.jsx` — a single `boxGeometry` auto-
  rotating via `useFrame`.
- `sampleProducts.js` (Phase 4: `materials`/`colors`/`sizes` already present).
- `ProductDetail.jsx`'s `customiseState` shape passed via `Link state={...}`:
  `{ productId, productName, material (string), color ({label,hex}), size
  (string), quantity (number) }`.
- `package.json` — confirmed `three`, `@react-three/fiber`, and
  `@react-three/drei` are already installed. **No new dependency was
  installed or needed** for this phase; everything below is built on what
  was already there.
- Route: `/customise/:productId` links by **product id**, not slug — so a
  new `useProductById` hook was needed (the existing `useProduct` from
  Phase 3/4 looks up by slug).

### What changed

**3D rendering technology:** `@react-three/fiber` (React renderer for
three.js) + `@react-three/drei` (`RoundedBox`, `Text`, `OrbitControls`,
`Environment`) + raw `three` for the zoom/reset vector math. All already
installed before this phase.

**Procedural keychain model** (`features/customiser/ProductModel.jsx`,
rewritten) — a torus (keyring loop) + a rounded tag with the customer's text
engraved on its face, replacing the flat box. This is explicitly a basic
procedural shape, not a scanned/modelled product — the viewport caption says
so directly ("Basic preview shape — not the final production design"), per
the phase's manufacturing-boundary requirement. No auto-rotation (removed
the old `useFrame` spin) — rotation is user-driven via drag, in line with
"avoid unnecessary animations."

**Live preview wiring**
- `features/customiser/materialAppearance.js` — maps each real material name
  (Wood/Metal/Acrylic) to plausible `metalness`/`roughness`/`opacity`
  properties so the preview visibly differs by material; unrecognised
  materials fall back to a neutral default rather than erroring.
- `features/customiser/sizeScale.js` — parses the "(N cm)" figure already
  present in each product's size labels and scales the model between 0.8×
  and 1.25× based on where the selected size falls within that product's own
  size range (not an absolute real-world scale — documented as such).
- `features/customiser/contrastColor.js` — picks black or white engraved
  text based on the selected colour's luminance, so text stays legible
  against any swatch.
- Text, colour, material, and size all feed directly into `ProductModel` as
  props, so every control updates the same frame.

**3D viewport** (`components/customiser/Viewport3D.jsx`, new)
- `OrbitControls` for drag-to-rotate and scroll/pinch-to-zoom (native touch
  support), plus explicit on-screen **Zoom in / Zoom out / Reset view**
  buttons driven by direct camera-distance math (clamped between a min/max
  distance) for devices or users who prefer buttons over gestures.
- **Loading state**: a "Loading 3D preview…" overlay shown until `Canvas`'s
  real `onCreated` callback fires (an actual signal from the renderer, not a
  fake timer).
- **Error handling**: `ThreeErrorBoundary` (new, `components/customiser/`) —
  a standard React error boundary around the whole 3D subtree — catches any
  rendering failure and swaps in a plain-language fallback
  (`PreviewUnavailable.jsx`, new) instead of a crash or blank canvas.
- **Graceful degradation**: `features/customiser/webgl.js` checks WebGL
  support *before* mounting `Canvas` at all; unsupported browsers/devices see
  the same `PreviewUnavailable` fallback immediately, with a note that the
  customization controls below still work.

**Phase 4 integration** (`pages/Customiser.jsx`, rewritten)
- Reads `useLocation().state` (the object `ProductDetail.jsx` passes) to
  initialise text/material/colour/size/quantity; falls back to the
  product's own first material/colour/size and quantity 1 when the
  customizer is opened directly (no router state) — verified both paths.
- Looks the product up by `productId` via the new `useProductById` hook;
  shows the existing `ProductUnavailable` component (from Phase 4) for an
  unknown id instead of crashing or silently redirecting.
- The exported `Customiser` component keys an inner `CustomiserView` by
  `productId`, the same remount-on-identity-change pattern used in Phase 4's
  `ProductDetail`, so switching products resets all selections cleanly.

**Controls**
- Custom text input, reusing the existing `MAX_CHARS = 20` limit, with a
  live "N characters remaining" counter that turns to the danger colour at
  the limit.
- Material/Size via the existing `OptionPicker` (Phase 4), Colour via the
  existing `ColorSwatchPicker` (Phase 4), Quantity via the existing
  `QuantitySelector` (Phase 4) — no new selection primitives were built;
  Phase 4's are reused as-is.
- A **Reset** button restores text/material/colour/size/quantity to the
  product's defaults.

**Customization summary** (`components/customiser/CustomizationSummary.jsx`,
new) — product name, entered text, material, colour, size, quantity, and two
navigation actions: **Back to Product** (`/products/:slug`) and **Continue
Browsing** (`/products`). The old, non-functional "Add to Cart" button (it
had no `onClick` at all in the pre-Phase-5 code — clicking it did nothing)
was removed rather than kept as dead UI, since this phase's own instructions
list only "return to Product Details or continue browsing" as the required
summary actions and explicitly forbid faking checkout/cart success. Real
cart integration is for a future phase.

**Font selection — intentionally not implemented.** The brief says "font
selection, only where supported." `drei`'s `Text` renders via `troika-three-
text`, which needs a loaded font *file* (not an installed system font) to
render anything beyond its bundled default — supporting multiple fonts would
mean fetching external font files at runtime with no reliable, already-
vetted source in this project. Rather than wire up a fragile external-font
fetch or fake a dropdown that doesn't actually change the rendered glyphs,
font selection was left out and is called out below as a limitation, per the
brief's explicit "do not invent unsupported options."

### Files created
- `apps/customer-frontend/src/features/customiser/materialAppearance.js`
- `apps/customer-frontend/src/features/customiser/sizeScale.js`
- `apps/customer-frontend/src/features/customiser/contrastColor.js`
- `apps/customer-frontend/src/features/customiser/webgl.js`
- `apps/customer-frontend/src/features/products/useProductById.js`
- `apps/customer-frontend/src/components/customiser/ThreeErrorBoundary.jsx`
- `apps/customer-frontend/src/components/customiser/PreviewUnavailable.jsx`
- `apps/customer-frontend/src/components/customiser/Viewport3D.jsx`
- `apps/customer-frontend/src/components/customiser/CustomizationSummary.jsx`

### Files modified
- `apps/customer-frontend/src/pages/Customiser.jsx` (full rewrite)
- `apps/customer-frontend/src/features/customiser/ProductModel.jsx` (full rewrite)

### Files removed
None.

### Dependencies added
**None.** `three`, `@react-three/fiber`, and `@react-three/drei` were already
installed (used lightly in the prior placeholder customizer) and are fully
sufficient for drag/zoom/reset controls, procedural geometry, and text
rendering.

### Commands executed
```
npm run lint
npm run build
node --input-type=module -e "…"   (verified getSizeScale, getMaterialAppearance,
                                    getReadableTextColor, and id-based lookup
                                    including an invalid id, directly against
                                    the real product data and logic modules)
npm run dev -- --port 5184        (manual route/module smoke test, then killed)
```

### Tests performed and results
- `npm run lint` / `npm run build`: both pass — same single pre-existing
  Footer warning as every prior phase; no new warnings.
- Route smoke test with the dev server running: `/customise/1`,
  `/customise/2`, `/customise/3` (all three real products), an invalid id
  (`/customise/does-not-exist`), and `/products/classic-name-keychain` all
  return HTTP 200.
- Every new/changed module (`Customiser.jsx`, `Viewport3D.jsx`,
  `ThreeErrorBoundary.jsx`, `CustomizationSummary.jsx`,
  `PreviewUnavailable.jsx`, `ProductModel.jsx`, `materialAppearance.js`,
  `sizeScale.js`, `contrastColor.js`, `webgl.js`, `useProductById.js`) was
  individually fetched from the dev server and returned HTTP 200 (i.e. Vite
  transformed each one without a syntax or import-resolution error).
- Direct logic verification (Node): `getSizeScale` returns 0.8 / 1.025 / 1.25
  for the keychain's Small/Medium/Large sizes (proportional scaling
  confirmed); `getMaterialAppearance` returns distinct, correct PBR values
  for Wood/Metal/Acrylic and a sane default for an unrecognised material;
  `getReadableTextColor` returns light text on a dark swatch and dark text
  on a light swatch; product-by-id lookup resolves real products correctly
  and returns `null` for an invalid id (confirming the `ProductUnavailable`
  branch is reachable).
- **Not tested — stated explicitly per your instruction #11**: actual
  browser rendering of the WebGL canvas, drag-to-rotate/pinch-zoom gesture
  behaviour, on-screen zoom/reset button clicks, the loading-overlay timing,
  the error-boundary fallback triggering in a live browser, console-error
  inspection in a real browser, and visual responsive layout at phone width.
  No browser or headless-rendering tool is available in this session, so
  none of this was click-tested — only verified by code/logic inspection and
  the dev-server/module checks above. This matches the same stated
  limitation from Phases 2–4, now specifically including WebGL rendering,
  which those phases didn't involve.

### Backend integration status
Unchanged. No new API calls. Everything in this phase runs on local sample
data and client-side 3D rendering.

### Known limitations
- **Font selection is not implemented** (see rationale above) — only text
  content, not typeface, can be customised right now.
- Each product still has exactly one `materials` entry (from Phase 4), so
  the Material picker, while fully functional, only shows one pill per
  product today.
- The keychain shape is a deliberately basic procedural tag + ring, not a
  scanned or hand-modelled product — labelled as such in the UI.
- Quantity is shown in the summary but does not render multiple meshes in
  the preview (one representative keychain is shown regardless of quantity).
- **STL generation is not implemented and was not attempted.** Nothing in
  this phase produces, downloads, or claims to produce a manufacturing file;
  the only output is an interactive visual preview. The architecture keeps
  product id, text, material, colour, size, and quantity as a plain,
  serialisable state shape (already assembled in `CustomizationSummary`'s
  props) that a future STL-generation phase could read from without needing
  to change this phase's UI.
- No browser/WebGL click-through testing was performed (see above) — this is
  the phase where that limitation matters most, since it's the first one
  involving real 3D rendering rather than DOM-only UI.

### Next phase
Phase 6 — Cart. **Superseded before starting — see the Open Keychain
integration below, which replaces this phase's placeholder geometry with a
real CSG-generated keychain mesh before Phase 6 begins.**

---

## Phase 5 Addendum: Open Keychain Geometry Engine Integration — Complete (2026-11-03)

This replaces Phase 5's procedural-placeholder-only 3D text with **real,
merged solid geometry** generated via manifold-3d CSG, following Open
Keychain's font-outline → extrude → union pipeline (MIT-licensed, reused and
adapted — see `THIRD-PARTY-NOTICES.md`). A read-only audit of Open Keychain
was performed first (summarized in the prior conversation turn, not
duplicated here); this entry covers the actual integration that followed.

### Phase 0 inspection performed
Read Open Keychain's `LICENSE` (MIT) and `TRADEMARKS.md` (name/logo reserved,
code reuse permitted). Directly inspected (not just the earlier audit
summary): `src/domain/keychain/text/outline.ts` in full, `package.json`'s
exact `manifold-3d`/`opentype.js` versions, `public/fonts/` + their OFL
license files, and — via targeted greps — how `keychain-builder.ts` actually
constructs CSG solids (`new wasm.CrossSection(polygons, 'NonZero')`,
`.extrude()`, `wasm.Manifold.union([...])`) and loads the WASM module
(`Module({ locateFile })` + `wasm.setup()`). Confirmed Giftora's existing
`package.json` had neither dependency installed yet, and that
`Customiser.jsx`/`Viewport3D.jsx` (from the Phase 5 entry above) were the
exact integration points — no major architectural change was required (no
new framework, no routing change); this stayed a scoped feature addition, so
there was no need to stop per the "major architectural changes" condition.

### Integration decision: scoped down from the full upstream pipeline
Open Keychain's own `keychain-builder.ts` builds several configurable
template *styles* (over 1000 lines, ~10 linked files) — far more than
Giftora's single simple tag-and-ring shape needs. Rather than port that whole
system, **Giftora's own new `keychainGeometry.js` implements the same
font-outline → CrossSection → extrude → union pipeline**, sized to Giftora's
actual product shape. This is "reuse the engine's approach and its genuinely
portable pieces," not "reuse the whole builder," which the audit had already
flagged as heavily multi-file and style-specific.

**Also scoped down deliberately: no Web Worker.** Open Keychain runs its CSG
work in a dedicated Worker. Giftora's geometry generation runs on the main
thread, debounced (see below), because the shapes involved (a short name, a
simple tag) are small enough that generation completes quickly without a
worker's added complexity (message protocol, worker bundling). This is
flagged here as an explicit, intentional scope decision, not an oversight —
revisit if real-world text/geometry complexity grows.

### What was reused (see `THIRD-PARTY-NOTICES.md` for full detail)
- **Ported near-verbatim (TS → JS, logic unchanged):**
  `src/domain/keychain/text/outline.ts` → `features/customiser/geometry/textOutline.js`
  (`flattenText`, `hasRequiredGlyphs` — curve flattening and glyph layout).
- **Pattern reused, reimplemented for Giftora's stack:**
  `manifold-utils.ts`'s `asMesh` (→ `meshToBufferGeometry.js`, targeting
  THREE.BufferGeometry instead of Open Keychain's own `MeshBuffer` type) and
  `keychain-builder.ts`'s `createWasm()` (→ `manifoldRuntime.js`).
- **New code, same CSG approach, Giftora's own shape:** `keychainGeometry.js`.
- **Copied with license preserved:** `manifold.wasm` (from the installed
  `manifold-3d` npm package, not from the Open Keychain repo, so it matches
  Giftora's own installed version exactly) and two OFL-licensed font files
  (Montserrat, Nunito) plus their license texts, from Open Keychain's
  `public/fonts/`.

### New dependencies installed
- `manifold-3d@3.5.4` — WASM CSG kernel. This is the one dependency that
  adds real weight (its `.wasm` is ~540 KB), and it's necessary: there is no
  practical way to do true boolean solid union (merging the tag, ring, and
  raised text into one real manufacturable-topology solid) in-browser
  without either this or an equivalent CSG library — three.js alone has no
  boolean-geometry operations.
- `opentype.js@2.0.0` — pure-JS font parser (no native/WASM), needed to turn
  a font file + string into glyph outlines (`font.charToGlyph`,
  `glyph.getPath`, kerning) that `textOutline.js` then flattens into polygons.

Both are exactly the dependencies Open Keychain itself uses for this job, and
both were explicitly pre-approved in your integration instructions.

### Geometry pipeline (what actually happens now)
1. `useKeychainGeometry` (new hook) debounces text/font/size changes (300ms),
   calls `loadFont(url)` (fetches + parses the selected bundled `.ttf` via
   `opentype.js`, cached per URL) and then `generateKeychainGeometry()`.
2. `generateKeychainGeometry()` (`keychainGeometry.js`):
   - Validates text (trims; empty text and font-unsupported characters throw
     a typed `GeometryError` with a user-facing message — never silently
     produce broken geometry).
   - Builds a rounded-rectangle tag `CrossSection` (via the standard
     rect+corner-circles CSG technique) and `.extrude()`s it to a solid.
   - Builds the keyring loop as a small circle `CrossSection.revolve()`d into
     a real torus, positioned above the tag.
   - Flattens the entered text into polygons at a target height, auto-
     shrinking it in a second pass if it would overflow the tag's width, then
     builds a `CrossSection` from those polygons with `'NonZero'` fill
     (this is what correctly produces a *hole* for letters like "O" or "A"
     without any manual polygon-winding/hole-detection code — manifold-3d's
     fill rule handles it), and extrudes it into a raised (embossed) solid
     positioned flush on the tag's front face.
   - **`wasm.Manifold.union([tag, ring, text])`** — a real CSG boolean union,
     producing **one single merged solid**, not three overlapping meshes
     (this is the core thing Phase 5's placeholder didn't have).
   - Applies the selected size's scale factor to the unioned solid.
   - Converts the result to a `THREE.BufferGeometry` (`meshToBufferGeometry.js`)
     and disposes every intermediate WASM `CrossSection`/`Manifold` object in
     a `finally` block (WASM objects need explicit `.delete()` — they aren't
     garbage-collected by the JS engine).
3. `ProductModel.jsx` renders the generated geometry directly
   (`<mesh geometry={geometry}>`) with the existing per-material PBR
   appearance (`materialAppearance.js`, unchanged from Phase 5) when it's
   ready, or falls back to the original Phase 5 procedural tag+ring+drei-Text
   shape while geometry is loading or if generation failed — the viewport is
   **never blank and never shows stale/wrong geometry**.
4. `useKeychainGeometry` disposes the *previous* `BufferGeometry` every time
   a new one replaces it, and on unmount, to avoid leaking GPU buffers.

### Customizer integration
- Added a real **Font** picker (`OptionPicker`, reusing the Phase 4
  component) with the two bundled fonts — Phase 5's original notes said font
  selection was intentionally left out because there was no real font
  pipeline; there is one now, so it's implemented.
- `Viewport3D` now shows "Generating 3D text…" under the canvas while a
  geometry request is in flight, and a plain-language error line if
  generation fails (e.g. an unsupported character), without ever crashing
  the page — the existing Phase 5 WebGL-check and error-boundary layers are
  unchanged and still apply underneath this.
- `CustomizationSummary` now includes the selected font.
- Reset still restores text, font, material, colour, size, and quantity to
  the product's defaults.
- Size selection still drives the same `getSizeScale()` (Phase 5) — now fed
  into the geometry generator itself (the solid is scaled before meshing),
  not just a `<group scale>` wrapper.

### Files added
- `apps/customer-frontend/src/features/customiser/geometry/textOutline.js`
- `apps/customer-frontend/src/features/customiser/geometry/fontCatalog.js`
- `apps/customer-frontend/src/features/customiser/geometry/fontLoader.js`
- `apps/customer-frontend/src/features/customiser/geometry/errors.js`
- `apps/customer-frontend/src/features/customiser/geometry/manifoldRuntime.js`
- `apps/customer-frontend/src/features/customiser/geometry/meshToBufferGeometry.js`
- `apps/customer-frontend/src/features/customiser/geometry/keychainGeometry.js`
- `apps/customer-frontend/src/features/customiser/geometry/index.js`
- `apps/customer-frontend/src/features/customiser/useKeychainGeometry.js`
- `apps/customer-frontend/public/manifold.wasm` (copied from the installed `manifold-3d` package)
- `apps/customer-frontend/public/fonts/montserrat.ttf`, `nunito.ttf` (copied from Open Keychain, OFL)
- `apps/customer-frontend/public/fonts/licenses/montserrat.txt`, `nunito.txt`
- `THIRD-PARTY-NOTICES.md` (repo root)

### Files modified
- `apps/customer-frontend/src/features/customiser/ProductModel.jsx` (renders generated geometry when present; procedural shape becomes the loading/error fallback)
- `apps/customer-frontend/src/components/customiser/Viewport3D.jsx` (accepts `geometry`/`geometryStatus`, shows generation status text)
- `apps/customer-frontend/src/pages/Customiser.jsx` (font picker, wires `useKeychainGeometry`, surfaces geometry errors)
- `apps/customer-frontend/src/components/customiser/CustomizationSummary.jsx` (adds Font row)
- `apps/customer-frontend/package.json` / `package-lock.json` (new dependencies)

### Files removed
None.

### Dependencies added
`manifold-3d@3.5.4`, `opentype.js@2.0.0` (both justified above; no other
packages added).

### License handling
MIT copyright notice and license text preserved in full in
`THIRD-PARTY-NOTICES.md`, along with a description of exactly which files
were ported vs. newly written, per Open Keychain's own MIT terms. Both
bundled fonts keep their individual OFL license files alongside them, per
the OFL's own bundling condition. No Open Keychain branding, name, or logo is
used anywhere in Giftora; `TRADEMARKS.md`'s "don't imply endorsement"
condition is respected.

### Geometry-generation results — actually run, not just inspected
Per your explicit instruction not to claim success from code inspection
alone, the real pipeline was executed end-to-end in Node (manifold-3d runs
outside the browser too, same as it does in Open Keychain's own non-browser
code path) against the actual bundled font files and the actual
`textOutline.js` module:

- **Short text** (`"Ava"`, Montserrat): real merged solid, 1420 triangles /
  712 vertices.
- **Longer text requiring auto-fit** (`"Giftora 2026"`): correctly
  auto-shrank to fit the tag width; 2218 triangles / 1111 vertices.
- **Letter with a hole** (`"O"` alone): 2 polygons (outer contour + the
  counter/hole), confirming `'NonZero'` fill rule correctly produces the
  hole without any manual hole-detection code; 1356 triangles.
- **Multiple holed letters** (`"OAKO"`): 1576 triangles, no errors.
- **Second bundled font** (Nunito, `"Ava"`): 1556 triangles / 780 vertices —
  different glyph shapes produce a different but valid mesh, confirming font
  switching actually changes the generated geometry, not just a label.
- **Size-scale variants** (0.8×/1.025×/1.25×, matching the product's
  Small/Medium/Large): all three produced the identical topology (1420
  triangles) at different scales — confirms scaling doesn't corrupt the
  solid.
- **Empty text**: throws `"empty outline"` (surfaced to the user as "Enter
  at least one character…" by `generateKeychainGeometry`'s own check).
- **Whitespace-only text**: also correctly throws, same path as empty.
- **Unsupported glyph** (CJK characters the bundled fonts don't cover):
  throws `"unsupported glyph: 日"` before any CSG work is attempted.
- **Repeated generation stress test**: 20 consecutive generations (different
  text each time) completed without error or degradation.

### Build/lint and browser-level testing
- `npm run lint`: passes, same single pre-existing Footer warning as every
  prior phase.
- `npm run build`: succeeds. Noted build-time warning: Vite reports
  `node:module` externalized for browser compatibility when bundling
  `manifold-3d` — this is expected/harmless (a Node-only code branch inside
  the package that never executes in the browser), not an error.
- **Known build inefficiency, flagged honestly rather than hidden:** the
  production build ends up with *two* copies of `manifold.wasm` — the one
  manually copied to `public/` (served at `/manifold.wasm`, the one actually
  fetched at runtime) and a second one Vite's bundler auto-discovered and
  copied into `dist/assets/` from `node_modules/manifold-3d` because of a
  static reference inside that package it can't tell is unreachable in a
  browser context. Net effect: roughly 540 KB of unused extra static output,
  not a functional bug. Worth a follow-up to exclude `manifold-3d` from
  Vite's asset auto-detection if bundle size becomes a concern.
- Dev-server smoke test: `/manifold.wasm`, both `.ttf` files, and every new
  JS/JSX module all return HTTP 200 and the correct byte sizes; `/customise/1`,
  `/2`, `/3` all return HTTP 200.
- **Not tested — stated explicitly, as instructed**: actual browser
  rendering of the generated mesh (does it visually look like a keychain,
  does the material shading read correctly), live typing with debounce
  behaviour in a real browser, clicking the font/material/colour/size
  controls and watching the preview update, mobile layout, and browser
  console-error inspection. No browser or headless-rendering tool is
  available in this session. What **was** verified instead is strictly
  stronger than code inspection: the exact geometry-generation code path was
  executed for real, producing real, valid, non-degenerate meshes for every
  case above — but the *rendered, on-screen result* in an actual browser has
  not been visually confirmed.

### Known limitations
- No Web Worker — geometry generation runs on the main thread (debounced).
  Fine for short text/simple shapes; would need revisiting if either grows
  significantly more complex.
- Only 2 fonts (Montserrat, Nunito) are available, both copied from Open
  Keychain's bundle — not the full font list Open Keychain ships.
- The keychain shape itself (rounded tag + torus ring) is still a simple
  procedural design, not one of Open Keychain's more elaborate template
  styles — intentionally scoped down, as explained above.
- The production build currently ships a redundant second copy of
  `manifold.wasm` (see above) — a minor build-output inefficiency, not a
  correctness issue.
- **STL/3MF export remains entirely unimplemented**, exactly as scoped. The
  audit found Open Keychain's `stl-serializer.ts` to be the most directly
  reusable piece of their whole codebase, and `meshToBufferGeometry.js`'s
  mesh shape is deliberately close to what that serializer expects — but no
  export code was written, no download link exists, and nothing claims the
  preview is manufacturing-ready. That stays a separate, future, explicitly-
  approved phase.
- No visual/browser confirmation that the generated mesh actually renders
  correctly on screen (see Testing section above) — only that the
  geometry-generation logic itself is correct and produces valid meshes.

### Next phase
Superseded immediately — this simplified single-shape engine was replaced by
the full upstream geometry engine described in "Open Keychain Full
Integration (Option A)" below (real templates, styles, fonts, worker, and
export pipeline).
## Open Keychain Full Integration (Option A) — Step (a): Parameter Model — Complete (2026-11-03)

Per your approval of Option A (full upstream integration, in carefully
controlled phases), this is Step (a): porting `model/types.ts`,
`model/parameters.ts`, and `model/parameter-constraints.ts` only. **No
existing Giftora file was modified** — this step is new, currently-unused
files (not yet wired into the builder, UI, or routes), exactly as condition
2 required. Build output size is unchanged from before this step, confirming
nothing new is being bundled yet.

### Scope actually ported
`types.ts` (851 lines) imports four smaller model files that are themselves
part of the real parameter model (not optional) — per condition 3 ("do not
remove or simplify parameters"), all four were ported too, not stubbed:
`model-feature.ts` (106), `edge-finish.ts` (55), `keyring-position.ts` (20),
`keyring-presets.ts` (45). Total: 1,713 lines of upstream TypeScript ported
to 7 JavaScript files (1,568 lines — the difference is mostly TS type-only
syntax removed, logic line-for-line unchanged).

### Files created
All under `apps/customer-frontend/src/features/customiser/geometry/model/`:
- `types.js` — `KeychainParams` (as a JSDoc typedef, ~55 fields), `DEFAULT_PARAMS`,
  `normalizeParams`, `reconcileCandidateParams`, `clamp`, `ringWallMm`,
  `keyringMetrics`, `sanitizeFilename`, `validateGeometryResult`,
  `geometryConstraintsFor`/`printProfileFor`, print-appearance helpers,
  and `GeometryResult`/`WorkerRequest`/`WorkerResponse` etc. as documented
  (not yet implemented) JSDoc typedefs for Step (c)'s benefit.
- `parameters.js` — `PARAMETER_RANGES`, `PARAMETER_DEFINITIONS`,
  `TEMPLATE_PARAMETER_KEYS`, `hasActiveParameter`, `parameterRange`,
  `orderedTemplateParameterKeys`, presentation-group helpers.
- `parameterConstraints.js` — `dependentParameterRange`,
  `reconcileDependentParameterValues`.
- `modelFeature.js` — `ModelFeature` type + `validateModelFeatures` (an
  advanced custom-geometry escape hatch upstream exposes; not surfaced in
  any Giftora UI yet, ported because `types.ts` depends on it).
- `edgeFinish.js` — `normalizeEdgeFinish`, printer-grid snapping.
- `keyringPosition.js`, `keyringPresets.js` — keyring hardware enums/values.
- `index.js` — barrel re-exporting all of the above.

### Explicitly excluded (per your condition 6)
No Google Fonts API, no PostHog, no hosted-mode code — none of it appeared
in these three files or their four dependencies to begin with, so there was
nothing to strip here; this exclusion becomes relevant starting at the font-
catalog step.

### What could not be preserved directly from TypeScript
Documented in full inside `types.js`'s own trailing comment block (condition
5), summarized here:
1. **`RecoveryFailure`/`OperationDiagnostics`** (Open Keychain's own
   error-recovery framework) typed a few optional fields
   (`ValidationIssue.failure`, the `WorkerResponse` error branch). Not
   ported — Giftora has no equivalent system and isn't adopting one; these
   fields stay untyped optionals. Giftora's own `GeometryError`
   (`geometry/errors.js`, from the earlier integration step) already covers
   the equivalent need.
2. **`FontDefinition`** (from the not-yet-ported `fonts/catalog.ts`) typed
   `fontDefinition`/`subtitleFontDefinition` on the worker message types.
   Documented as `unknown` until the font-catalog step.
3. **Compile-time exhaustiveness checking** on `StyleId`/`TemplateId`
   discriminated fields exists upstream via the TS compiler; JS has no
   equivalent safety net. The runtime branching logic itself is unchanged —
   verified by exercising real template/style combinations below rather than
   relying on type-checking.

### Mapping: upstream parameter model → Giftora's customizer (current and future)

| Upstream field(s) | Giftora today | Notes |
|---|---|---|
| `text` | `Customiser.jsx`'s text input | Direct match |
| `fontId` | `Customiser.jsx`'s font picker (`FONT_OPTIONS`) | Today: 2 bundled fonts by label; upstream's `fontId` indexes a richer catalog (Step covered by the font-catalog port, not yet done) |
| `templateId` | *(none yet)* | Giftora's customizer only builds one shape today. A template picker (5 options) is new UI, part of Step (e). |
| `styleId` | *(none yet)* | Same — a style picker (8 options, filtered by template via `hasTemplateParameter`) is new UI. |
| `textSizeMm`, `reliefDepthMm`, `baseThicknessMm`, `paddingMm`, etc. (the ~30 shape parameters) | Partially covered by today's single `getSizeScale()` (Phase 5) | These are a much richer, template/style-aware refinement model; today's size picker is a placeholder for this entire system until Step (b)/(e). |
| `holeDiameterMm`/`keyringPreset`/`keyringPosition`/`keyringOpeningShape` | *(none yet)* | Giftora's current ring is fixed-geometry (no hole-size or keyring-hardware controls). New UI in Step (e). |
| `magnetPocketPreset`/`magnetPocketPlacement`, `heartSizeMm` family, `ribbonTailMm`/`ribbonNotchMm`, `bubbleLobeMm`, `archCurveMm`, `tagTailMm`, `nameplateTiltDeg`/`nameplateEmbedMm`, `stakeLengthMm`/`stakeShoulderMm`, `jointClearanceMm`/`mechanicalGapMm`/`maxJointAngleDeg`/`jointBossMm` | *(none yet)* | Style/template-specific fields — each only matters once its owning template/style exists (Step b), then needs a conditionally-shown control (Step e) driven by `hasActiveParameter`/`parameterRange`, exactly as upstream's own UI does. |
| `material`/`colour`/`quantity` (Giftora's own) | Giftora's existing product-data-driven controls | **Not part of upstream's model at all** — these stay Giftora's own ecommerce concepts, deliberately kept separate per "keep the Open Keychain core independent of ecommerce," matching the adapter-boundary design from the integration plan. |

### Verification — actual inputs, not code inspection
Ran a 40-assertion Node test script directly against the ported functions
(not shipped with the app; scratch-only, deleted after the run):
- `DEFAULT_PARAMS` normalizes to itself (idempotent — template/style stay
  `name-keychain`/`contour`, text stays `"ALEX"`).
- Template-specific `baseThicknessMm` bounds: magnet → clamped to `[4.4, 5]`;
  articulated-name → clamped to `≥3.4` and correctly zeroes
  `fontWeightMm`/`letterSpacingMm`, forces `edgeFinish: 'sharp'`.
- Style-specific fields (`bubbleLobeMm`, `tagTailMm`, `archCurveMm`) correctly
  zero out when the style doesn't match, and are preserved (clamped) when it
  does.
- `heart-split` style correctly falls back to `'plain'` on the `magnet`
  template (styleId/templateId cross-validation working) and is retained on
  `name-keychain`.
- Magnet-only fields (`magnetPocketPreset`) reset to defaults off the
  `magnet` template.
- `reconcileCandidateParams` correctly re-clamps `ribbonTailMm` into its
  `[6,24]` range after a style change to `'ribbon'`.
- `keyringPresetValues('standard-round')` and `keyringMetrics()` return
  correct, sane hardware dimensions.
- `hasActiveParameter`: confirmed `holeDiameterMm` applies to `name-keychain`
  but not `nameplate`, and `nameplateTiltDeg` is the exact inverse — the
  template-aware applicability rules work as intended.
- `orderedTemplateParameterKeys` returns the same parameter set as
  `templateParameterKeys` for all 5 templates (topological sort doesn't drop
  or duplicate parameters).
- `parameterRange`'s dependent-range engine actually narrows `ringOffsetMm`'s
  range for a small `textSizeMm` (confirmed numerically, not just that it
  runs without throwing).
- `normalizeEdgeFinish` correctly snaps to the 0.2mm printer-visible grid and
  clamps to bounds.
- `sanitizeFilename` produces a correct, safe slug from text with accents,
  punctuation, and spaces (`"Jöhn O'Brien!! 2026"` → `keychain-john-o-brien-
  2026-contour.stl`) and falls back to `"name"` for text with no alphanumeric
  characters.
- `validateModelFeatures` accepts valid input, rejects >24 features, and
  rejects duplicate feature ids.
- `validateGeometryResult` accepts a well-formed synthetic result and
  rejects one with an out-of-range triangle index.
- `geometryConstraintsFor` correctly picks the larger of
  `jointClearanceMm`/`mechanicalGapMm` for the articulated template.
- `normalizeAppearanceColor` accepts valid hex and throws on invalid input.

**All 40 checks passed** on the first run except one — which turned out to
be a mistake in my own test's expected value (a hand-computed slug), not a
problem in the ported code; confirmed by querying the function directly and
correcting the test. Documenting this rather than silently fixing it,
per your "report any failures honestly" instruction.

### Build/lint
`npm run lint` and `npm run build` both pass, identical output to before
this step (same single pre-existing Footer warning, identical bundle size) —
confirming these new files are inert until something imports them.

### Browser verification
**Not performed.** This step is pure data/logic with no UI or rendering
component — there is nothing to browser-test yet, and none is claimed.

### Known limitations
- These seven files are **not yet used anywhere** — Giftora's actual
  `keychainGeometry.js` builder, `Customiser.jsx`, and routes are completely
  unaware of this parameter model until Step (b) wires the builder to
  consume it and Step (e) adds UI for template/style/parameter selection.
- The font-catalog dependency (`FontDefinition`) referenced in
  `WorkerRequest`/`WorkerResponse` JSDoc is documented but not implemented.
- No automated test suite exists in this repo (consistent with every prior
  phase) — verification here is the same direct-Node-execution method used
  throughout, now covering 40 real assertions against this specific module.

### Proposed Step (b)
Port the builder/template/style cluster (`domain/keychain/build/`,
`domain/keychain/templates/`, `domain/keychain/styles/` — ~4,108 + 830 + 360
+ 798 lines) that actually consumes this parameter model to produce real
manifold-3d geometry for all 5 templates × applicable styles, replacing
`keychainGeometry.js`'s current single hard-coded shape. This is the largest
single remaining piece. I'll report file-by-file as I port it and verify
each template/style combination the same way — direct Node execution against
real `KeychainParams` input, checking for valid, non-degenerate manifold
output — before moving to Step (c) (worker) per your gate.

Waiting for your review before starting Step (b). **Approved — see below.**

---

## Step (b), Sub-step 1 of N: Builder Dependency Cluster — Complete (2026-11-03)

Per your Step (b) approval and condition 2 ("work incrementally... report after
each meaningful sub-step"), this is the first of several reports for Step
(b). `keychain-builder.ts`, `templates/template-builder.ts`,
`templates/nameplate-builder.ts`, and `styles/style-builder.ts` (the actual
template/style geometry producers, ~3,000 lines) are **not yet ported** —
this sub-step ports everything *they depend on*, in dependency order, so
the next sub-step can port them without first discovering missing pieces
mid-file.

### Dependency order established (by reading actual import statements)
`styled-types.ts` and `model/accepted-metrics.ts` depend only on
already-ported Step (a) types → ported first. `build/edge-finish.ts` (**a
different, much larger file than `model/edge-finish.ts`** ported in Step
a — 471 lines of real CSG chamfer/round edge geometry, not the small value-
clamping helper) and `build/feature-graph.ts` depend on `manifold-utils.ts`
(only partially ported before now) and on each other's siblings → ported
next, after completing `manifold-utils.ts`. `build/articulated-validation.ts`
depends on `templates/template-builder.ts`'s `ArticulatedBuild` type only as
a type reference (not a runtime import) → safely portable now, ahead of
`template-builder.ts` itself.

### A correction from Step (a)
Step (a) said `RecoveryFailure`/`OperationDiagnostics` were "Open Keychain's
own error-recovery framework" and excluded them as unrelated. Reading
`build/edge-finish.ts` in full showed this was too hasty: `RecoveryError`
(from `shared/lib/recovery/failure.ts`, 82 lines) is the builder's **actual
mechanism for reporting *why* a geometry request was rejected** (e.g. "text
edge is too large for these letters, increase text size" with structured
`{target, profile, requestedMm, maximumMm}` context) — this is core
geometry-validation logic, not telemetry, and is unlike Google Fonts/
PostHog/hosted-mode (which remain correctly excluded per condition 6). It's
ported now as `geometry/recovery.js`.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/recovery.js` — `RecoveryError`, `failureFrom` (ported from `shared/lib/recovery/failure.ts`, 82 lines)
- `apps/customer-frontend/src/features/customiser/geometry/build/styledTypes.js` — `StandardStyledGeometry` JSDoc typedef only (upstream file is pure types, no runtime code)
- `apps/customer-frontend/src/features/customiser/geometry/model/acceptedMetrics.js` — display-metrics formatting (from `model/accepted-metrics.ts`)
- `apps/customer-frontend/src/features/customiser/geometry/build/manifoldUtils.js` — the **complete** upstream `manifold-utils.ts` API: `asMesh`, `manifoldFromMesh`, `partitionMaterialSolids`, `mergeMeshes`, `disposeGeometry`, `validateMesh`, `finiteBounds`, `sectionArea` (the earlier integration step had only ported `asMesh` indirectly; the rest were missing until now)
- `apps/customer-frontend/src/features/customiser/geometry/build/featureGraph.js` — `applyFeatureGraph` (the custom user-defined `ModelFeature` CSG pipeline: box/sphere/cylinder/extrude/revolve/sweep add/subtract/intersect operations, real manifold-3d boolean ops, three.js `ExtrudeGeometry`/`CatmullRomCurve3` for the sweep case)
- `apps/customer-frontend/src/features/customiser/geometry/build/edgeFinish.js` — `regularizeFinishedSolid`, `extrudeTextFinished`, `extrudeFinished`, `baseFinishLimits`, `assertBaseFinishAmount`, `textFinishLimits`, `intersectTextFinishLimits`, `assertTextFinishAmount` (the real chamfer/round edge-profile CSG: offset contours, `warpBatch` height interpolation, topology-preservation checks via `assertTopology`)
- `apps/customer-frontend/src/features/customiser/geometry/build/articulatedValidation.js` — `validateArticulatedBuild` (joint-collision, motion-envelope, and captive-connector checks for the articulated-name template)

### Files modified
- `apps/customer-frontend/src/features/customiser/geometry/meshToBufferGeometry.js` — refactored to call the new `build/manifoldUtils.js`'s `asMesh` internally instead of duplicating the vertex-extraction loop, so there's one `asMesh` implementation matching upstream's actual module boundary, not two. **This is the only change touching a file the live Phase-5 customizer actually uses** — behavior-preserving, verified below. No Customiser UI, routes, worker, export, or ecommerce logic was touched, per condition 3.

### Verification — actual manifold-3d execution, not code inspection
A 22-assertion Node script ran real CSG operations through every new/changed
function:
- `asMesh`/`manifoldFromMesh` round-trip correctly (scale conversion verified numerically, not just "doesn't throw").
- `partitionMaterialSolids` produces a valid carved base + model.
- `mergeMeshes` correctly concatenates and re-indexes two meshes.
- `finiteBounds`/`sectionArea` behave correctly (a 10×10mm square measures ~100mm²).
- `applyFeatureGraph` correctly **rejects** custom features on the `articulated-name` template (the upstream safety check) and correctly **adds** a box feature to a `name-keychain` base, producing a printable, larger mesh.
- `extrudeFinished` produces valid solids for both `sharp` and `chamfer` profiles (chamfer produces visibly more triangles, confirming the edge geometry is real, not a no-op); `baseFinishLimits` returns sane non-negative limits; `assertBaseFinishAmount` correctly throws when a requested amount exceeds the computed limit.
- `textFinishLimits`/`assertTextFinishAmount` behave correctly on a small text-sized cross-section.
- `validateArticulatedBuild` correctly rejects a synthetic build with too few parts.
- `manifoldToBufferGeometry` (the refactored, now shared, file) still produces valid position/index attributes — confirming the refactor didn't regress the live Phase 5 path.

**All 22 checks passed** on the first run — no corrections needed this time.

### Build/lint
`npm run lint` / `npm run build`: both pass. Bundle size essentially
unchanged (1,695.59 → 1,695.66 kB, a rounding-level difference) — confirms
these files remain unused by the shipped app except for the one
`meshToBufferGeometry.js` internal refactor, which doesn't add new code to
the bundle (it calls the same logic, now from one place).

### Browser verification
**Not performed** — no UI change in this sub-step; nothing to browser-test.

### Known limitations after this sub-step
- `template-builder.ts`'s `ArticulatedBuild` type (referenced by
  `articulatedValidation.js` via JSDoc only) does not exist as a JS file
  yet — the next sub-step.
- The actual per-template/per-style geometry (`keychain-builder.ts`,
  `template-builder.ts`, `nameplate-builder.ts`, `style-builder.ts`) is not
  ported yet, so **no template or style can be generated end-to-end yet** —
  this sub-step only proves the shared plumbing they'll all call into is
  correct.
- `design-document.ts`/`design-schema.ts` (persistence/serialization, 363 +
  105 lines) were not inspected this round — likely not needed for geometry
  generation itself (they look like save/load document codecs), to be
  confirmed when `keychain-builder.ts` is read in full.

### Next sub-step
Port `templates/template-builder.ts` (830 lines) and
`templates/nameplate-builder.ts` (360 lines) next — `articulated-
validation.js`'s `ArticulatedBuild` type reference will then resolve to a
real file, and `style-builder.ts` + `keychain-builder.ts` (which both import
from the templates) can follow. Will report again after that sub-step,
before attempting the full builder. **Approved — see below.**

---

## Step (b), Sub-step 2 of N: Template, Nameplate, and Style Builders — Complete (2026-11-03)

### A dependency discovered mid-step
You approved porting `template-builder.ts` and `nameplate-builder.ts`
specifically. Reading `template-builder.ts`'s imports showed it has a
**hard runtime dependency** on `styles/style-builder.ts` (`buildStyle`,
`capsule`, `effectiveMargin`, `ringAssembly`, `roundedRect`, `sectionBounds`,
`union`) — not just a type reference like the earlier `articulated-
validation.ts` → `template-builder.ts` link. Without it, `template-
builder.ts` cannot run at all. So this sub-step also ports
`styles/style-builder.ts` (798 lines) — all 8 styles' actual geometry
(plain, contour, capsule, soft-tag, bubble, arch, ribbon, heart-split) — since
leaving it out would mean reporting "ported" code that cannot execute or be
verified. Flagging this now per your "report any dependencies or issues
discovered" condition.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/styles/styleBuilder.js` — all 8 named styles (`buildStyle`), plus shared helpers (`roundedRect`, `union`, `sectionBounds`, `archWarp`, `capsule`, `ringAssembly`/`ringAssemblyAtLeft`, `effectiveMargin`, `finishStyle`, `finishMagnetStyle`, magnet-pocket placement/safety logic, heart-split's parametric heart-curve polygon generator, `STYLE_CATALOG`)
- `apps/customer-frontend/src/features/customiser/geometry/templates/templateBuilder.js` — `TEMPLATE_CATALOG` (all 5 templates and which styles each exposes), `buildTemplate` (the dispatcher: articulated-name → its own joint-socket-and-connector geometry; nameplate → its own tilted-plate 2D shape; plant-label → its own stake+foundation-accent geometry per style; everything else → `buildStyle`), `isArticulatedBuild`/`releaseArticulatedBuild`
- `apps/customer-frontend/src/features/customiser/geometry/templates/nameplateBuilder.js` — `buildNameplate`, the real 3D construction that takes a nameplate's 2D backing/relief and tilts, embeds, and warps the text into the plate as one connected, printable solid (iterative embedding-depth search, up to 13 attempts, checking footprint/embedding/visible-cap/connectivity each time)

### Files modified
None — still purely additive, no Customiser UI/routes/worker/export/ecommerce
logic touched, per your condition.

### Templates and styles verified
All **20 catalog-valid template × style combinations** (every style each
template's own `TEMPLATE_CATALOG` entry actually lists) were exercised with
real manifold-3d CSG calls, using a synthetic "text" cross-section (a
rectangle with a circular hole, standing in for a real glyph like "O" with a
counter — `keychain-builder.ts`, not yet ported, is what will supply real
font-derived text):

- **name-keychain**: contour, capsule, soft-tag, bubble, arch, ribbon, heart-split (7/7 pass)
- **articulated-name**: its own joint-based geometry, verified separately (ignores styleId) — correct part/connector counts and valid solid status
- **magnet**: plain, contour, capsule, soft-tag, bubble, arch, ribbon (7/7 pass) — including real magnet-pocket placement/safety metadata
- **nameplate**: its own tilted-plate geometry (ignores styleId) — verified both via `buildTemplate`'s 2D shape and `buildNameplate`'s full 3D embedding (see below)
- **plant-label**: contour, capsule, soft-tag, bubble, arch (5/5 pass)

**20/20 combinations produced valid, non-degenerate geometry** (articulated:
correct part/connector topology and `'NoError'` solid status; everything
else: a 2D backing with real, positive-area bounds).

### A finding worth reporting: "invalid combinations" aren't rejected at this layer
Per your condition 8 ("do not assume all 40 combinations are valid"): at the
builder level tested in this sub-step, **every** template/style pairing I
tried actually ran without throwing — even ones a template's own
`TEMPLATE_CATALOG.styles` list doesn't include (e.g. `heart-split` on
`magnet`, which the catalog doesn't list for magnet). `buildStyle` has a
generic fallback branch (a plain offset around the text) for any
unrecognised `styleId`, so the builder is permissive by design. **The actual
UI-facing restriction lives in Step (a)'s `normalizeParams`**, which
explicitly forces `heart-split` → `plain`/`contour` off the `name-keychain`
template before parameters ever reach the builder (verified back in Step
a's own test: "heart-split style on magnet template falls back to plain").
So the two layers divide responsibility correctly — `normalizeParams`
prevents invalid combinations from being requested; the builder itself is a
generic geometry tool that doesn't need to duplicate that policy — but it's
worth noting explicitly rather than assuming the builder enforces it too.

### Edge cases tested
- **Long text** (an 80mm-wide synthetic shape): backing correctly scales to
  match, confirming width isn't hard-coded.
- **Degenerate / missing-glyph-equivalent input** (a ~0.001mm "point"
  shape, standing in for what a font with zero matching glyphs would
  produce): the builder tolerated it without throwing — in the full
  pipeline, this case is actually meant to be **caught earlier**, by
  `hasRequiredGlyphs` (ported in the first Open Keychain integration step,
  before Step a/b), which rejects unsupported characters before any
  geometry is attempted. This sub-step confirms the builder itself doesn't
  additionally crash if that earlier guard were ever bypassed — a
  reasonable defense-in-depth property, not a required one.
- **Keyring placement**: all 6 positions (`left`/`right`/`top`/`bottom`/
  `top-left`/`top-right`) correctly extend the backing's bounds in the
  expected direction.
- **Keyring opening shapes**: both `round` and `slot` openings produce
  valid, distinct geometry.
- **Magnet pocket near a parameter boundary**: a small plate with the
  largest magnet preset (`15x3`) and an off-center placement correctly
  reports its `safe`/`adjusted` metadata rather than silently placing the
  pocket off the edge of the plate.
- **Heart-split with `heartLeftPresent: false`** (right word only, a real
  supported configuration): produces a valid backing.
- **Nameplate at an extreme 85° tilt** (near Step a's 0–90° clamp boundary):
  completed without throwing, returned a real result object with
  `printable: true` and no issues for this particular geometry — confirming
  the iterative embedding-attempt loop handles steep angles rather than
  crashing, though this doesn't guarantee every extreme-tilt input stays
  printable (that's a geometry-dependent outcome, correctly modelled as an
  `issues`-bearing result rather than a guarantee).

### Geometry validation performed
- Non-degenerate 2D bounds (`max > min` on both axes) for every style-build.
- Articulated builds: correct `parts.length`/`connectors.length` relationship
  (`connectors = parts - 1`) and `'NoError'` solid status on every part.
- `buildNameplate`: `printable` flag, zero error-severity issues on the
  success path, valid (`validateMesh`-passing) non-empty base and relief
  meshes, and finite positive dimensions — checked numerically, not just
  "didn't throw."
- **35/35 checks passed.** Two bugs were found and fixed during verification
  — both in my own test script (a double-`.delete()` on a few style builds
  whose `relief` field is literally the same CrossSection object as the
  input text, not a copy — calling `.delete()` on it twice threw
  `BindingError: CrossSection instance already deleted`), not in the ported
  code. Documenting this per your "report any issues discovered" condition:
  it's a reminder that several style builds return the **same object
  reference** for `relief` as the `text` passed in, which the next sub-step
  (the full `keychain-builder.ts`, which actually owns disposal of these
  objects) needs to handle correctly — upstream's own `keychain-builder.ts`
  disposal code (already read in the audit) does exactly this correctly via
  `new Set([...])` deduplication before deleting, which I've mirrored in
  `nameplateBuilder.js`'s own disposal already.

### Build/lint
`npm run lint` / `npm run build`: both pass, bundle size unchanged — these
files remain unused by the shipped app (dead code) until `keychain-
builder.ts` and the UI are wired up.

### Browser verification
**Not performed.** No UI change in this sub-step.

### Known limitations after this sub-step
- `keychain-builder.ts` (1,024 lines) — the actual orchestrator that turns
  real font text into the `StyleInput` these builders consume, calls
  `buildTemplate`, applies edge finishes, computes final dimensions/issues,
  and produces the final `GeometryResult` — is **not yet ported**. Nothing
  tested here used real font-derived text; all verification used a
  synthetic stand-in shape.
- `design-document.ts`/`design-schema.ts` still not inspected — to confirm
  (most likely persistence-only, not geometry) when reading
  `keychain-builder.ts`.
- Google Fonts, PostHog, and hosted-mode remain excluded — none of
  `style-builder.ts`, `template-builder.ts`, or `nameplate-builder.ts`
  reference any of them.

### Next sub-step
Port `keychain-builder.ts` itself. **Approved — see below.**

---

## Step (b), Sub-step 3 of N: The `keychain-builder.ts` Orchestrator — Complete (2026-11-03)

This is the final piece of the geometry engine itself — the function that
ties the font/text pipeline, template/style builders, edge-finish CSG, and
feature-graph together into one real, callable `buildKeychain(params)`
producing a validated `GeometryResult`. **This sub-step is the first point
at which real font-derived text actually produces real, finished, printable
geometry end-to-end** — everything before this used synthetic stand-in
shapes.

### A font-catalog dependency, resolved without reintroducing Google Fonts
`keychain-builder.ts` imports `fontDefinition`/`fontSupportsArticulatedName`/
`effectiveFontWeightMm` from `fonts/catalog.ts` (375 lines). Reading it
showed every one of its 23 entries is a **bundled local `.ttf` file**
(`file: '/fonts/xxx.ttf'`) — the live Google Fonts API is a wholly separate
file (`google-provider.ts`), not referenced by `catalog.ts` at all. So this
catalog was safe to port in full, and — since the articulated-name template
specifically requires a font with `supportsArticulated: true` (only Bungee,
Rubik, and Montserrat qualify upstream) — the remaining 21 bundled font
files and their OFL license files were copied from Open Keychain's
`public/fonts/` (Giftora previously only had 2 of these 23). This was
necessary to actually exercise and verify the articulated-name template at
all, per your condition 1 ("use real font-derived text, not synthetic
test geometry") and condition 2 ("preserve all supported templates").

### A pre-existing dual-package-hazard fix (small, behaviour-preserving)
While building a real Node verification harness, `opentype.js`'s bare
`'opentype.js'` specifier resolved differently under Node (CommonJS `main`,
only a `default` export) than under Vite (ESM `module` field, real named
exports) — a classic dual-package hazard. It already worked fine in the
browser (confirmed by the build passing), but made honest Node-level
verification impossible without a workaround. Fixed by importing the exact
subpath instead — `'opentype.js/dist/opentype.mjs'` — in **both**
`geometry/fontLoader.js` (the existing, live Phase 5 file) and the new
`geometry/fonts/fontLoader.js`. This resolves to the identical ESM module
Vite was already using; `npm run build` still succeeds with a marginally
smaller bundle (same code, less resolution ambiguity), confirming no
behaviour change to the live customizer.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/fonts/catalog.js` — the full 23-entry bundled font catalog, `fontDefinition`, `fontSupportsText`/`fontSupportsArticulatedName`, `effectiveFontWeightMm`, `textUsesCyrillic`, `articulatedFallbackFont`
- `apps/customer-frontend/src/features/customiser/geometry/fonts/fontLoader.js` — upstream's exact font-loading/caching scheme (content-hash + revision cache key, 16-entry LRU), for the new engine specifically (distinct from the existing simpler `geometry/fontLoader.js` used by Phase 5)
- `apps/customer-frontend/src/features/customiser/geometry/build/keychainBuilder.js` — `buildKeychain`/`buildKeychainGeometry` (the orchestrator), `finalizeArticulated`, `releaseStyledGeometry`, `invalidResult`
- 21 additional bundled `.ttf` font files + their OFL license `.txt` files in `apps/customer-frontend/public/fonts/` (`public/fonts/licenses/`)

### Files modified
- `apps/customer-frontend/src/features/customiser/geometry/textOutline.js` — added `flattenTextGlyphs` and `layoutText` (previously only `flattenText`/`hasRequiredGlyphs` were ported in the original integration step; the articulated-name template needs per-glyph layout, which neither Step a nor b's prior sub-steps required until now)
- `apps/customer-frontend/src/features/customiser/geometry/fontLoader.js` — the opentype.js import-path fix described above (behaviour-preserving)

No Customiser UI, routes, worker, export, or ecommerce logic was touched, per your condition 5.

### Real text-to-geometry verified across all 20 catalog-valid combinations
Using **real bundled fonts** (Nunito for standard templates/styles, Montserrat for articulated-name, since Nunito doesn't support it) and **real text ("Ava")** run through the actual font-outline pipeline — not synthetic shapes:

- **name-keychain**: contour, capsule, soft-tag, bubble, arch, ribbon, heart-split — 7/7 printable, zero error issues
- **articulated-name**: contour (the only entry point; its style is ignored internally) — printable, zero error issues
- **magnet**: plain, contour, capsule, soft-tag, bubble, arch, ribbon — 7/7 printable, zero error issues
- **nameplate**: contour (its 2D shape ignores styleId; the full tilt/embed 3D construction from sub-step 2 ran for real here) — printable, zero error issues
- **plant-label**: contour, capsule, soft-tag, bubble, arch — 5/5 printable, zero error issues

**20/20 produced valid (`validateMesh`-passing), printable, positive-dimension meshes.**

### Auto-fit, validation, and structured issues verified with real scenarios
- **Heart-split with real subtitle** ("Ava" / "Sam"): produced a connected, printable single-solid result; `connectivity` correctly reported as `'assembly'` (the intentional multi-word layout), not flagged as a disconnection error.
- **Articulated-name font gating**: requesting Nunito (not articulated-capable) for `articulated-name` is correctly rejected with issue code `articulated-font`, never attempting geometry generation — confirms the font/template compatibility check works with real font metadata, not just a hypothetical.
- **Missing glyph**: Japanese text ("日本語") against Nunito (Latin/Cyrillic only) correctly rejected with `missing-glyph`, before any CSG work.
- **Empty text**: correctly rejected with `empty-text`.
- **Text too long** (>24 characters): correctly rejected with `text-too-long`.
- **Auto-fit width scaling**: a legitimately wide 12-character name at 28mm text height was automatically scaled down — the binary-search width-fit algorithm (`WIDTH_FIT_ITERATIONS`) correctly converged the output to **exactly 120.0mm width** and recorded the `scaled-to-fit` issue, confirming the auto-fit behaviour upstream describes is actually working, not just present in the ported code.

### Geometry validation performed
`validateMesh` (position/index integrity), `printable` flag, `dimensions` (all positive, finite), `issues` arrays (correct codes for every rejection path exercised), and `connectivity`/`validation.mesh` fields from `buildKeychain`'s own post-processing — all checked against real computed values, not just "didn't throw." **27/27 checks passed on the first run** (no script bugs this time, unlike sub-step 2).

### Build/lint
`npm run lint` / `npm run build`: both pass. Bundle size essentially
unchanged aside from the opentype.js import-path fix noted above. This
engine (now functionally complete for geometry generation) remains entirely
unused by the shipped app — still dead code from the bundler's perspective,
exactly as intended until a future, separately-approved wiring step.

### Browser verification
**Not performed.** Everything above was verified via direct Node execution
of the real, shipped source files (not a reimplementation) against real
inputs. No browser or headless-rendering tool is available in this session,
and I'm not claiming otherwise.

### Known limitations
- **Not wired into the UI, worker, or export anywhere.** This is a
  complete, verified geometry *engine*, parallel to and separate from the
  simpler single-shape engine the live Phase 5 customizer actually uses.
  Connecting the two is explicitly a future, separately-approved step.
- `design-document.ts`/`design-schema.ts` (save/load document persistence)
  remain unexamined — not referenced by anything ported so far, consistent
  with the expectation they're persistence-only, not geometry.
- Font *weight* variation (`effectiveFontWeightMm`) and Cyrillic-specific
  minimum-weight handling were exercised through the code path but not
  specifically tested with Cyrillic input text in this sub-step's test
  battery — worth a follow-up check if Cyrillic support matters for
  Giftora's eventual audience.
- STL/3MF export remains completely unimplemented — `includeExport` was
  passed as `false` throughout this sub-step's verification; no export file
  was produced or claimed.

### Next phase
You asked not to proceed to worker integration until this is reviewed. The
geometry engine itself (Step b) is now functionally complete and verified.
**Approved — see Step (c) below.**

---

## Step (c): Web Worker Integration — Complete (2026-11-03)

Moves `buildKeychain` execution off the main thread via a dedicated Worker,
with request-ID based stale-result handling, a bounded result cache,
request timeouts, and crash recovery — adapted from Open Keychain's
`geometry-worker.ts` + `geometry-client.ts`.

### Scope trimmed, deliberately, per your restrictions
Upstream's worker/client handle three request types (`generate`, `validate`,
`export`) plus a separate "candidate" validation-coalescing flow on top of
preview-coalescing. Per your explicit restriction ("Do not integrate STL or
3MF export yet"), **only `warmup` and `generate` are implemented**; `validate`
and `export` (and the separate candidate-coalescing machinery that exists
only to support them) were left out entirely, not stubbed. This is a real
scope reduction from upstream, not a bug — flagging it clearly rather than
silently matching only part of the original surface.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/build/resultCache.js` — `BoundedResultCache` (ported from `result-cache.ts`, used inside the worker to avoid recomputing an identical request)
- `apps/customer-frontend/src/features/customiser/geometry/worker/geometryWorker.js` — the Worker entry point: `self.onmessage` handling `warmup`/`generate`, calling `buildKeychain` with the already-ported engine, caching by a stable-stringified params+font-hash key, and posting results with their mesh `ArrayBuffer`s in the `transfer` list (zero-copy)
- `apps/customer-frontend/src/features/customiser/geometry/worker/geometryClient.js` — the main-thread `GeometryClient`: `request()` (stale-request superseding — a new request rejects whatever was in-flight or queued, so an old result can never land after a newer one), per-request timeout, worker crash detection (`onerror`/`onmessageerror`) with one automatic replacement, `dispose()`, a mirrored `BoundedResultCache` for instant cache-hit resolution without touching the worker at all

### Files modified
- `apps/customer-frontend/src/features/customiser/geometry/recovery.js` — added `GeometryOperationError`/`OperationDiagnostics` (ported from `shared/lib/recovery/operation-diagnostics.ts`), needed for structured worker error propagation (which stage/kind of failure: initialization, generation, transport, timeout, a crashed worker, etc.)
- `apps/customer-frontend/vite.config.js` — added `worker: { format: 'es' }`. Vite's default worker build format didn't match the `new Worker(url, { type: 'module' })` pattern this architecture (and upstream's own) uses; without this, the bundled worker could mismatch what the browser expects at runtime. This is a build-tool setting, not UI/routes/ecommerce logic.

No Customiser UI, routes, STL/3MF export, backend, admin, or ecommerce logic was touched, per your restrictions. Neither `geometryWorker.js` nor `geometryClient.js` is imported anywhere in the shipped app yet — confirmed by the production bundle size being unchanged from before this step.

### WASM initialization and cleanup
The worker reuses Giftora's existing `manifoldRuntime.js` (`Module({locateFile}) + wasm.setup()`), rather than a duplicate `createWasm()`. Each Worker instance runs in its own independent JS realm, so `manifoldRuntime.js`'s module-level `wasmPromise` singleton correctly initializes the WASM module exactly once *per worker* — no duplicate initialization within a worker, and no cross-worker interference since each worker has its own copy of the module. On `dispose()` or a detected crash/timeout, the client calls `worker.terminate()`, which the browser guarantees frees the worker's entire realm (including its WASM instance) — there is no manual WASM-object disposal needed across the terminate boundary (the CSG-object-level `.delete()` discipline from Steps a/b still applies *within* a single `buildKeychain` call, unchanged).

### Tests performed and results

**1. Vite build-time worker bundling (real, not simulated).** Built a disposable, temporary entry file + temporary Vite config (not part of the app, deleted immediately after) that imports `GeometryClient`, and ran a real `vite build` against it. Result: Vite correctly detected the `new Worker(new URL('./geometryWorker.js', import.meta.url), {type:'module'})` pattern and produced a separate, self-contained worker chunk (`geometryWorker-*.js`, ~495 KB — the whole manifold-3d + keychain-builder dependency graph, with zero remaining bare `import` statements, confirming it's a valid standalone bundle). This verifies the *build-time* wiring is correct for a real browser to load. It does not by itself prove runtime behavior in an actual browser — see the "Not performed" section below.

**2. Worker message-handler simulation (real engine code, simulated thread).** No browser is available in this session to run an actual Worker thread, so I simulated the worker's execution environment in-process: set `globalThis.self = globalThis`, stubbed `self.postMessage` to capture responses, and imported the real `geometryWorker.js` unmodified, then invoked its actual `self.onmessage` handler directly. This runs the exact same code (`buildKeychain`, real manifold-3d WASM, real bundled fonts) — it does not verify actual cross-thread isolation or real browser `postMessage` structured-clone transfer, only the handler's own logic. 14/14 checks passed:
   - `warmup` → `{type: 'ready'}`.
   - `generate` with real text ("Ava") and a real bundled font (Nunito, loaded via embedded font bytes to avoid relying on `fetch` in Node) → a real, printable `GeometryResult`.
   - The response's mesh buffers are genuine `ArrayBuffer` instances with real byte length — i.e., actually eligible for the `transfer` list (zero-copy), not merely present.
   - An identical second request hits the worker's own cache (`timings.workerCacheHit === 1`) instead of recomputing.
   - Empty text correctly produces a non-printable result with the `empty-text` issue — a handled outcome, not a thrown error.
   - A genuinely malformed request (`params: null`) is caught and reported as a structured `{type: 'error'}` response with a diagnostics stage, rather than crashing the handler.

**3. `GeometryClient` logic against a fake Worker double.** Also no-browser; used a minimal duck-typed fake (`postMessage`/`onmessage`/`onerror`/`onmessageerror`/`terminate`) to deterministically control response timing and simulate failures — more precise for these specific scenarios than a real worker thread would allow in an automated test. 20/20 checks passed:
   - Construction immediately posts a `warmup` message.
   - **Stale-request handling** (your condition 6, the one most worth getting right): a second `request()` call while one is in flight correctly rejects the first with `GeometryCandidateSupersededError`, queues the second rather than sending it immediately, and only dispatches it (with a *new* request id) once the in-flight one settles — confirmed by inspecting the exact sequence of posted messages, not just the end state.
   - **Caching**: an identical repeated request never posts a second `generate` message at all, resolving from the client-side cache.
   - **Timeout**: a request that never gets a response is rejected with `GeometryRequestTimeoutError` after the configured timeout, the stalled worker is terminated, and a replacement worker is created automatically.
   - **Crash recovery**: triggering the fake worker's `onerror` handler rejects the pending request, terminates the worker, and spins up a replacement that sends its own `warmup` — confirming the one-time automatic recovery path.
   - **Disposal**: `dispose()` rejects all pending work and terminates the worker; any request made after disposal is itself rejected.

**4. `BoundedResultCache` unit tests.** 9/9 checks passed: basic get/set, LRU-order eviction by entry-count limit (confirms it's insertion-*order*-based with touch-on-read, not just FIFO), weight-based eviction when total weight exceeds the configured budget, rejection of a single entry heavier than the max weight, and `clear()`.

**Total: 43/43 checks passed** across all four test batteries, after fixing one bug in my own first draft of the client test (it responded to a stale request id instead of the dispatched one, which produced a dangling unresolved promise whose 30-second timeout fired well after the surrounding test had moved on — a test-script bug, not a `GeometryClient` bug; corrected by reading the actual posted-message sequence instead of assuming which request was "active").

### Build/lint
`npm run lint` / `npm run build`: both pass. Same single pre-existing Footer
warning as every prior phase. Production bundle size is unchanged from
before this step, confirming the new worker/client files are not yet
imported anywhere in the shipped app.

### Browser verification
**Not performed.** No browser or headless-rendering tool is available in
this session. What *was* verified: real Vite build-time bundling of the
Worker (test 1 above, a genuine browser-targeted build artifact, inspected
directly), and the exact same engine/handler/client logic running in a
simulated-but-real execution of the actual source files (tests 2–4). What
remains unverified: an actual browser spawning the worker thread, real
`postMessage`/structured-clone transfer across a real thread boundary, and
converting a worker-returned mesh into a rendered Three.js `BufferGeometry`
on screen. Manual testing instructions for that are below.

### Known limitations
- `validate`/`export` request types are not implemented in this worker (see
  "Scope trimmed" above) — by design, not oversight.
- Candidate-coalescing (a second coalescing queue upstream uses specifically
  for the separate validate flow) was not ported, since the `validate` type
  it exists to serve wasn't ported either.
- `fontForWorker()` is currently a pass-through (matches upstream, which
  also just passes the font definition through unchanged at this layer —
  upstream's more elaborate font-transfer handling lives in the UI layer
  that constructs `FontDefinition` objects, which Giftora hasn't built yet).
- Not wired into the Customiser UI anywhere — still a complete, separately-
  verified, currently-unused subsystem, exactly as instructed.
- No actual browser/thread-boundary verification (see above).

### Exact instructions for manually testing the worker in a browser
Since this wasn't wired into the live UI, here's how to exercise it directly,
without any further code changes:
1. In `apps/customer-frontend`, run `npm run dev`.
2. Open the dev server in a browser, open DevTools → Console.
3. Run:
   ```js
   const { GeometryClient } = await import('/src/features/customiser/geometry/worker/geometryClient.js')
   const { fontDefinition } = await import('/src/features/customiser/geometry/fonts/catalog.js')
   const client = new GeometryClient()
   const result = await client.request({
     text: 'Ava', subtitle: '', subtitleFontId: 'nunito', fontId: 'nunito',
     templateId: 'name-keychain', styleId: 'contour', textSizeMm: 20,
     fontWeightMm: 0.6, baseThicknessMm: 2.4, reliefDepthMm: 1, paddingMm: 2.4,
     edgeInsetMm: 2.4, letterSpacingMm: 1, holeDiameterMm: 5,
     keyringOpeningShape: 'round', keyringSlotLengthMm: 5, minimumWallMm: 1.2,
     bottomClearanceMm: 0.25, heartInteriorMode: 'relief', edgeFinish: 'sharp',
     textEdgeFinish: 'sharp',
   }, fontDefinition('nunito'))
   console.log(result.printable, result.dimensions)
   ```
4. Check the Network/Application tab or a `performance.getEntriesByType('resource')` filter for `geometryWorker` to confirm a separate worker script loaded.
5. To see it rendered: convert `result.baseMesh`/`result.reliefMesh`
   (`{positions: Float32Array, indices: Uint32Array}`) into a
   `THREE.BufferGeometry` the same way `meshToBufferGeometry.js` already
   does for the simpler engine (`setAttribute('position', ...)`,
   `setIndex(...)`, `computeVertexNormals()`), and inspect it in any
   Three.js scene — this exact conversion is not yet wired up for the new
   engine's output shape, since that's UI-wiring work explicitly deferred.

### Next phase
Per your instruction, stopping here. **Approved — see Step (d) below.**

---

## Step (d): STL/3MF Export and Printability Preflight — Complete (2026-11-03)

Adds real STL and 3MF file export plus a printability preflight report, on
top of Step (c)'s worker/client, using the actual generated Giftora geometry
(not placeholder meshes).

### Tracing the real validation logic (per your instruction not to assume)
Re-read `preflight.ts` in full rather than relying on the earlier audit
summary. Confirmed again, directly: it does **not** itself compute
manifoldness, connectivity, or wall-thickness — it only aggregates
`result.issues`, which is produced inside the builder/template/style/edge-
finish code already ported in Steps a/b (`disconnected`,
`relief-outside-backing`, `text-over-width`, the `articulated-*` and
`nameplate-*` codes, etc.). `buildPreflightReport`'s own real logic is
narrower than its name suggests: classifying a result into
`generating`/`ready`/`ready-with-warnings`/`blocked`, and the one
non-trivial rule it does own — disconnected-only errors become printable
only with an explicit `allowDisconnected` acknowledgement, but any other
error always blocks regardless of that flag. This is ported faithfully, not
reinvented.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/export/stlSerializer.js` — `serializeBinaryStl` (binary STL writer, verbatim logic from `stl-serializer.ts`)
- `apps/customer-frontend/src/features/customiser/geometry/export/threeMfSerializer.js` — `serializeThreeMf` (3MF/ZIP writer: Content_Types, rels, 3D model XML, a Prusa Slic3r per-part config in separate-colors mode, a colorgroup for per-part display colors)
- `apps/customer-frontend/src/features/customiser/geometry/export/preflight.js` — `buildPreflightReport`

### Files modified
- `apps/customer-frontend/src/features/customiser/geometry/worker/geometryWorker.js` — added the `export` message type (builds with `includeExport: true`, checks `printable`/`allowDisconnected`+disconnected-only, serializes via the new STL/3MF modules, sanitizes the filename, transfers the file buffer). The existing `warmup`/`generate` handling is untouched.
- `apps/customer-frontend/src/features/customiser/geometry/worker/geometryClient.js` — added `export()` (its own `pendingExports` map, independent of the preview `request()`/stale-superseding machinery — an export and a preview can be in flight at the same time without interfering, verified below) plus routing in `handleResponse`/`handleWorkerFailure`/`dispose` for `export` responses and failures. The existing preview `request()` flow (stale-superseding, caching, timeout, crash recovery) is unchanged.
- `apps/customer-frontend/package.json` — added `fflate@^0.8.3` as a direct dependency. It was already present transitively (via `manifold-3d` and `three-stdlib`), but 3MF export directly calls `zipSync`/`strToU8` from it, so it needed to be a declared, not incidental, dependency — matching upstream's own `package.json`, which lists the identical version directly.

No Customiser UI, routes, backend, admin, Prisma, or ecommerce logic was
touched, per your restrictions. Neither the export module, the worker's
export branch, nor `GeometryClient.export()` is called from anywhere in the
shipped app yet — confirmed by the production bundle size being unchanged.

### STL implementation details
Direct port of `serializeBinaryStl`: writes the 80-byte STL header + 4-byte
triangle count + 50 bytes per triangle (12-byte normal, three 12-byte
vertices, 2-byte attribute), computing each face normal from the mesh's own
geometry via a cross product (not trusting any pre-existing normal data).
Operates on the real `exportMesh` the already-ported `buildKeychain`
produces when called with `includeExport: true` — for the articulated-name
template, this is the real `mergeMeshes()`-combined multipart mesh (all
letter bodies + connectors in one STL), exactly as upstream does it.

### 3MF implementation details
Direct port of `serializeThreeMf`, using the newly-added `fflate` dependency
for ZIP packaging. Produces a real OPC/3MF package: `[Content_Types].xml`,
`_rels/.rels`, `3D/3dmodel.model` (vertices/triangles + a materials/color
group), and — in `separate-colors` mode — a Prusa-specific
`Metadata/Slic3r_PE_model.config` naming each volume by its
appearance/color. `merged` mode instead emits one unified part. Component/
material information is preserved exactly as upstream supports it: base
material vs. relief material as two named, colored parts (or one merged
part), nothing more elaborate was invented.

### Preflight rules and behavior
`buildPreflightReport(result, appearance, busy, error, allowDisconnected)`:
- No result yet / busy → `generating`.
- An explicit error string (e.g. a worker failure) → `blocked`, with a
  synthetic `generation-error` issue.
- Otherwise, classifies by `result.issues`: any blocking (`severity:
  'error'`) issue → `blocked`, *unless* every blocking issue is specifically
  `disconnected` **and** the caller passed `allowDisconnected: true` — in
  which case it's treated as printable (this is the explicit, opt-in
  "I understand this prints as separate parts" acknowledgement upstream
  uses for things like Heart Split). Any warning-only result (no blocking
  errors) → `ready-with-warnings`, still printable. A fully clean result →
  `ready`.
- Explicitly verified: a genuinely different error present alongside a
  `disconnected` one still blocks even with `allowDisconnected: true` — the
  acknowledgement only ever covers disconnection, never other problems.

### Worker changes
Added the `export` request type to `geometryWorker.js`, reusing the same
`cacheKey()`/`BoundedResultCache` machinery `generate` already uses (now
parameterized by `'exportable'` quality, as it already supported before this
step — no new caching concept introduced). An identical repeated export
request is served from cache rather than recomputed (verified below).
`GeometryClient.export()` mirrors the existing `request()`'s plumbing
(timers, worker-failure handling, error wrapping) but keeps its own pending
map and request ids, deliberately *not* sharing the preview path's stale-
superseding logic — upstream doesn't coalesce export requests into the
preview queue either, since an export is a one-off explicit user action, not
a live-typing preview. Verified that a preview `request()` and an `export()`
can be in flight concurrently without either affecting the other.

### Tests and results
No browser is available in this session, so — consistent with Steps (b)/(c)
— real engine code was exercised via direct Node execution and in-process
worker-handler simulation (not a mocked substitute), run across four
batteries:

**1. Serializer unit tests (19/19 passed).** `serializeBinaryStl`: correct
byte-length formula, correct header text, correct triangle count field,
hand-verified vertex coordinates against the source mesh, unit-length
computed face normals, and a zero-triangle mesh producing a valid
header-only (84-byte) file without crashing. `serializeThreeMf`: the output
is a real ZIP (opened with `fflate.unzipSync`, not just "didn't throw"),
contains all four expected archive entries, the model XML declares
millimeter units, vertex/triangle counts in the XML match the two input
meshes exactly (3+3 vertices, 1+1 triangles), `separate-colors` mode
includes a colorgroup and the Slic3r config while `merged` mode produces
exactly one named part and omits the Slic3r config, and an invalid hex
color is rejected rather than silently producing a malformed file.

**2. Preflight unit tests (13/13 passed).** Busy/error/no-result states,
a clean result (`ready`), a warning-only result (`ready-with-warnings`,
still printable), a blocking error (`blocked`), a disconnected-only error
both without and with `allowDisconnected` (confirming the printable flag
flips correctly), and the mixed case above (a non-disconnected error always
blocks).

**3. Worker `export` message handling — real geometry, real fonts (19/19
passed).** Simulated the worker's message handler in-process exactly as in
Step (c) (`globalThis.self = globalThis`, a stubbed `postMessage`, the real
unmodified `geometryWorker.js`):
- **STL export, name-keychain/contour**: a real `export` response with a
  correctly sanitized filename (`keychain-ava-contour.stl`), the data buffer
  genuinely present in the `transfer` list (zero-copy), a positive triangle
  count, and byte length matching the STL format's own formula for that
  count.
- **3MF export, magnet/bubble**: a valid 3MF archive with non-trivial real
  vertex data (not a stub).
- **Multipart export (magnet with a rear pocket cut + base + relief)**:
  still produces one coherent exported solid with a plausible (>20)
  triangle count for a multi-feature design.
- **Articulated (genuinely multipart) export**: using Montserrat (one of
  the three articulated-capable bundled fonts) with real text, produced a
  substantial (>100 triangle) merged export mesh — the real
  `mergeMeshes()`-combined multi-letter, multi-connector solid, not a
  single simple shape.
- **Invalid geometry correctly rejected, not exported**: empty text and an
  articulated-name request with a non-articulated font (Nunito) both
  produce a structured `{type: 'error'}` response with an explanatory
  message — never a 0-byte or garbage file.
- **Exported dimensions vs. source geometry**: generated the same design
  once via `generate` and once via `export`, then independently recomputed
  the STL's own bounding box by walking its raw triangle data (not trusting
  any reported number) and compared it to the `generate` response's
  `dimensions` — **matched within 0.5mm on all three axes**
  (56.9 × 26.0 × 3.4mm). This is the strongest check in this step: it
  confirms the exported file's actual geometry — not just its metadata —
  corresponds to what the preview shows.
- **Export cache**: an identical repeated export request produces
  byte-identical output and completes faster (served from
  `BoundedResultCache`, not recomputed).

**4. `GeometryClient.export()` logic against a fake Worker double (9/9
passed).** `export()` posts a correctly-shaped message with the right
defaults (`format: 'stl'`, `mode: 'separate-colors'`), resolves on a real
`export` response, rejects on an `error` response, and — the specific
concurrency property worth confirming — a `request()` (preview) and an
`export()` issued back-to-back use distinct request ids and resolve
independently of each other, neither blocking nor being superseded by the
other. `dispose()` correctly rejects a pending export too.

**Total: 60/60 checks passed** across all four batteries, with no bugs
found in the ported/added code this time (none of my own test scripts
needed correction either, unlike Steps b/c).

### Lint/build results
`npm run lint` / `npm run build`: both pass. Same single pre-existing Footer
warning as every prior phase. Production bundle size is unchanged from
before this step, confirming the export module, the worker's new branch,
and `GeometryClient.export()` are not yet imported anywhere in the shipped
app.

### Known limitations
- **Not wired into the Customiser UI** — no download button, no preflight
  display anywhere in the live app, exactly as instructed.
- The separate `validate`/`validateCandidate` flow (and its candidate-
  coalescing machinery) remains unported — still out of scope, as it was in
  Step (c); nothing in Step (d) needed it.
- `fontForWorker()` in the client remains a pass-through, same as Step (c)
  — no change needed for export.
- 3MF color/material support matches upstream exactly (two named/colored
  parts, or one merged part) — no additional material richness was
  invented beyond what's implemented and tested above.
- **No external slicer was used to open an exported file** — verification
  was programmatic (parsing the STL/3MF byte structure directly and cross-
  checking dimensions against the source geometry), not a visual check in
  PrusaSlicer/Bambu Studio/etc. Stating this explicitly per your
  instruction not to claim slicer verification unless it actually happened.
- No browser verification of any kind in this step (consistent with Steps
  b/c) — see the Testing section for exactly what was and wasn't verified.
- The temporary `D:\manifold.wasm` file mentioned in Step (c)'s limitations
  (needed for Node-level WASM path resolution in these simulations) was
  reused again for this step's tests and is still present — a Claude Code
  safety check blocks programmatic deletion of a drive-root path, so it
  remains for you to delete manually; it is not referenced by any shipped
  code.

### Instructions for manually testing exports in a browser
1. In `apps/customer-frontend`, run `npm run dev`.
2. Open the dev server in a browser, open DevTools → Console.
3. Run:
   ```js
   const { GeometryClient } = await import('/src/features/customiser/geometry/worker/geometryClient.js')
   const { fontDefinition } = await import('/src/features/customiser/geometry/fonts/catalog.js')
   const client = new GeometryClient()
   const params = {
     text: 'Ava', subtitle: '', subtitleFontId: 'nunito', fontId: 'nunito',
     templateId: 'name-keychain', styleId: 'contour', textSizeMm: 20,
     fontWeightMm: 0.6, baseThicknessMm: 2.4, reliefDepthMm: 1, paddingMm: 2.4,
     edgeInsetMm: 2.4, letterSpacingMm: 1, holeDiameterMm: 5,
     keyringOpeningShape: 'round', keyringSlotLengthMm: 5, minimumWallMm: 1.2,
     bottomClearanceMm: 0.25, heartInteriorMode: 'relief', edgeFinish: 'sharp',
     textEdgeFinish: 'sharp',
   }
   const file = await client.export(params, 'stl', 'separate-colors', fontDefinition('nunito'))
   console.log(file.filename, file.mimeType, file.data.byteLength)
   // Save it to disk to inspect/open in a slicer:
   const blob = new Blob([file.data], { type: file.mimeType })
   const a = document.createElement('a')
   a.href = URL.createObjectURL(blob)
   a.download = file.filename
   a.click()
   ```
4. Repeat with `'3mf'` as the format to get a `.3mf` file instead.
5. Open the downloaded file in any slicer (PrusaSlicer, Bambu Studio, etc.)
   to visually confirm it's a valid, printable model — **this has not been
   done in this session**; the instructions above are for you to do it, not
   a claim that it was already verified that way.

### Next phase
Per your instruction, stopping here. **Approved — see Step (e) below, which
replaces this entire "not wired into the UI yet" limitation.**

---

## Step (e): Integrate the Geometry Engine into the Production Customizer — Complete (2026-11-03)

This is the step that connects everything built in Steps (a)–(d) to the
actual customer-facing `Customiser.jsx` page. The old simplified single-
shape engine (`keychainGeometry.js`/`useKeychainGeometry.js`/the old
`fontCatalog.js`) is no longer the production path — it still exists on
disk (untouched, so nothing is deleted without approval) but
`Customiser.jsx` no longer imports it.

### What was replaced, precisely
`Customiser.jsx` previously called `useKeychainGeometry({fontUrl, text,
sizeScale})`, which debounced a call to `generateKeychainGeometry()` — the
old engine's single hard-coded tag+ring+text shape, with only 2 bundled
fonts and no template/style/parameter system. It now calls
`useGeometryEngine(params, {fontDefinition, subtitleFontDefinition})`, a new
hook that owns a real `GeometryClient` (Step c) and drives the real
`keychainBuilder.js` orchestrator (Step b) through its Worker, with full
template/style/parameter support (Step a), real local fonts (all 23
bundled), and real STL/3MF export + preflight (Step d). The old engine's
*files* were left in place (per "preserve existing user changes," and
because deleting unused code wasn't requested) — only the import graph
feeding the live page changed.

### Files created
- `apps/customer-frontend/src/features/customiser/geometry/productMapping.js` — Giftora-specific glue (new code, not ported): maps a product's `category` to the template(s) it can offer (`templateOptionsForCategory`), maps a product's size label (e.g. `"Medium (5.5 cm)"`) to real `textSizeMm`/`baseThicknessMm` values within the engine's own valid ranges (`shapeDefaultsForSize`), and auto-corrects the selected font when switching to the articulated-name template if the current font doesn't support it (`fontIdForTemplate`, reusing the already-ported `articulatedFallbackFont`)
- `apps/customer-frontend/src/features/customiser/geometry/useGeometryEngine.js` — the production hook: owns one `GeometryClient` per mount (disposed — and its Worker terminated — on unmount), debounces parameter changes, and relies on `GeometryClient.request()`'s own stale-request superseding (Step c) so an outdated in-flight request can never overwrite a newer result; a superseded request's rejection is swallowed rather than shown as an error, since a newer request is already replacing it
- `apps/customer-frontend/src/features/customiser/geometry/useResultGeometries.js` — converts each new `GeometryResult` into THREE.BufferGeometry pairs and disposes the *previous* pair exactly once (via a ref-tracked comparison, not `setState`-in-effect, to satisfy `react(set-state-in-effect)` — see Testing below) whenever a new result arrives or the component unmounts
- `apps/customer-frontend/src/features/customiser/geometry/meshBufferToThreeGeometry.js` — converts a plain `{positions, indices}` MeshBuffer into a `THREE.BufferGeometry`, scaled from millimetres into the viewer's existing scene-unit convention; deliberately does **not** call `.center()` per-mesh (an earlier draft did, and would have pulled the engraved relief text off the tag's surface, since base and relief must keep their position *relative to each other* — caught and fixed before it reached the committed version)
- `apps/customer-frontend/src/components/customiser/PreflightPanel.jsx` — real printability status (`generating`/`ready`/`ready-with-warnings`/`blocked`), separate error/warning lists, dimensions, and the disconnected-only `allowDisconnected` acknowledgement checkbox (only shown when actually applicable, mirroring upstream's own UX)
- `apps/customer-frontend/src/components/customiser/ExportButtons.jsx` — real "Download STL"/"Download 3MF" buttons calling `GeometryClient.export()`, with a loading state per format, disabled while any export is pending, disabled when preflight says the design isn't printable, Blob+anchor-click download with immediate `URL.revokeObjectURL()` (no blob URL leak), and an error message on export failure
- `apps/customer-frontend/src/components/customiser/ShapeParameterSliders.jsx` — a genuinely generic parameter panel: iterates the real, ported `PARAMETER_GROUPS`/`hasActiveParameter`/`parameterRange` registry (Step a) and renders one range slider per parameter actually applicable to the current template/style, with real min/max/step/unit from the registry — nothing here invents a parameter or a range upstream doesn't define; only the English display labels (`LABELS`/`GROUP_LABELS`) are new, since upstream's `labelKey`s are i18n lookup keys and Giftora has no i18n system (same reasoning already applied to `keyringPositionNameKey` in Step a)

### Files modified
- `apps/customer-frontend/src/pages/Customiser.jsx` — full rewrite of the production customizer (see "Customization controls" and "Ecommerce preserved" below)
- `apps/customer-frontend/src/features/customiser/ProductModel.jsx` — now renders two real meshes (`baseGeometry` + `reliefGeometry`, both from the new engine) with the product's selected color on the base and a contrast-computed color on the relief text, when real geometry is available; falls back to the Phase 5 procedural tag+ring+drei-Text shape otherwise (loading/error) — the fallback path itself is untouched
- `apps/customer-frontend/src/components/customiser/Viewport3D.jsx` — prop rename `geometry` → `baseGeometry`/`reliefGeometry`; camera/orbit/zoom/reset/WebGL-check/error-boundary logic is completely unchanged; the bottom caption now reads differently depending on whether real geometry is present ("Real generated preview — check the printability status below before ordering" vs. the old "basic preview shape" wording for the fallback case)
- `apps/customer-frontend/src/components/product/OptionPicker.jsx` — extended (backward-compatibly) to accept either plain strings (every existing caller's shape, unchanged) or `{value, label}` objects, needed for style/template/keyring-position pickers where the underlying value (`"soft-tag"`) and its display text (`"Soft tag"`) differ
- No existing OptionPicker caller elsewhere (Material/Size pickers in `Customiser.jsx`, `ProductDetail.jsx`) needed any change — verified by re-reading them; they pass plain string arrays, which the extended component still handles identically

Admin frontend, backend, database, Prisma, authentication, payment — none
touched. No Google Fonts API, no PostHog. No new dependencies.

### Existing geometry path replaced
Precisely: `Customiser.jsx`'s import of `useKeychainGeometry` (old) →
`useGeometryEngine` (new, Step c/d-backed). The old hook/engine files
(`useKeychainGeometry.js`, `keychainGeometry.js`, `fontCatalog.js`,
`fontLoader.js` at the old path) are **not deleted** — they're simply no
longer imported by the production page. This was a deliberate choice:
removing them wasn't asked for, and keeping them avoids any risk of
breaking something else that might still reference them (nothing currently
does, confirmed by grep, but leaving them is the safer, reversible choice
per "preserve unrelated user changes").

### Worker integration details
`useGeometryEngine` creates exactly one `GeometryClient` per `Customiser`
mount (via `useRef`/`useEffect`, keyed the same way the page already keys
on `productId` — so switching products tears down the old client/Worker and
spins up a fresh one). Every parameter change (text, font, template, style,
keyring position, any shape slider, subtitle) re-renders `params` and
triggers a new debounced `client.request(...)`; `GeometryClient`'s own
stale-superseding (Step c) guarantees only the latest result ever reaches
`setState`. Worker crashes/timeouts surface as `engine.status === 'error'`
with a **Retry** button that calls `client.recoverForUserRetry()` (Step c's
one-time automatic recovery, now exposed to the user for a second attempt)
before resubmitting. The client (and its Worker) is disposed on unmount via
the `useEffect` cleanup — verified this is the same disposal path Step c's
own tests already covered, just invoked from a real component lifecycle now.

### Customization controls implemented
- **Text** (existing control, now feeding real params; limit raised from 20
  to 24 characters to match the engine's actual `text-too-long` limit rather
  than an arbitrary smaller one)
- **Subtitle** — shown only when `TEMPLATE_CATALOG` says the current
  template supports it (`supportsSubtitle`); hidden entirely otherwise
- **Keychain type** (template) — shown only for "Keychains"-category
  products, offering the two templates that correspond to a real physical
  keychain (`name-keychain`, `articulated-name`); hidden for "Nameplates"
  products, which are fixed to the `nameplate` template. **Scope decision,
  stated plainly**: Giftora's catalog has no magnet or plant-label products
  (no corresponding hardware/pricing), so those two upstream templates are
  never offered in this UI — exposing them would let a customer "buy a
  keychain" but receive a design with a magnet pocket or garden stake
  Giftora doesn't sell or ship. Not a technical limitation of the engine;
  a deliberate catalog-integrity decision.
- **Style** — shown only when the current template's `TEMPLATE_CATALOG`
  entry lists styles (hidden for `nameplate`/`articulated-name`, which
  ignore style entirely); options come from the real `TEMPLATE_CATALOG`/
  `STYLE_CATALOG`, not a hand-picked subset
- **Font** — real `FONT_CATALOG` (23 bundled fonts), filtered to only the
  3 articulated-capable fonts when the articulated-name template is
  selected (`supportsArticulated`) — this is `hasInlineFontData`/
  `fontSupportsArticulatedName` doing real work in the UI, not a cosmetic
  filter
  - Switching *to* articulated-name with a non-capable font selected
    auto-corrects to a supported one (`fontIdForTemplate`) — verified below
  - Subtitle font is deliberately linked to the main font selection (not a
    second picker) — a scope simplification, stated here rather than left
    implicit; the engine itself supports an independent subtitle font
- **Keyring position** — shown only when the template supports a keyring
  (`supportsKeyring`); all 6 real positions from `KEYRING_POSITIONS`
- **Dimensions/thickness and all other template-specific parameters** — the
  new `ShapeParameterSliders`, generic and registry-driven (see above);
  covers `textSizeMm`, `baseThicknessMm`, `reliefDepthMm`, `paddingMm`,
  `cornerRadiusMm`, the heart-split fields, the articulated joint fields,
  and everything else in `PARAMETER_GROUPS`, each only appearing when
  `hasActiveParameter` says it's relevant to the current template/style —
  nothing is manually special-cased per template beyond what the registry
  already encodes
- **Material/Colour/Size/Quantity** — Giftora's own existing ecommerce
  controls, completely unchanged; `Size` now additionally drives real
  `textSizeMm`/`baseThicknessMm` via `shapeDefaultsForSize` instead of the
  old engine's abstract 0.8–1.25× scale factor

### 3D preview behavior
Real generated geometry (base + relief, from the actual Worker-produced
mesh) renders through Giftora's existing `Viewport3D`/`ProductModel` — the
React Three Fiber `Canvas`, `OrbitControls` (drag/zoom/pan-disabled),
on-screen zoom/reset buttons, WebGL availability check, and error boundary
are all the exact Phase 5 components, unchanged. Multipart/articulated
designs render correctly because the engine already merges all parts into
exactly two buffers (`baseMesh`/`reliefMesh`) before the result ever reaches
the client — confirmed in Step (d)'s own testing and re-confirmed here
against the real page wiring (see Testing). Loading and error states are
explicit (`engine.status`), geometry is disposed on every replacement and on
unmount (`useResultGeometries`), and stale geometry cannot appear because
`GeometryClient` guarantees only the latest request's result is ever
returned to React.

### STL and 3MF export integration
`ExportButtons` calls the real `GeometryClient.export()` (Step d) with the
current `params`/`fontDefinition`/`subtitleFontDefinition`/
`allowDisconnected`, gated by `preflight.printable` (both buttons disabled
when the current design isn't exportable). A pending export shows
"Preparing STL…"/"Preparing 3MF…" on its own button and disables both until
it resolves. On success, the real returned `{filename, mimeType, data}` is
turned into a Blob, downloaded via a temporary `<a download>` click, and the
object URL is revoked immediately after — no accumulating blob URLs. On
failure, the real error message is shown inline.

### Preflight integration
`PreflightPanel` renders the real `buildPreflightReport(engine.result,
undefined, engine.status === 'loading', engine.status === 'error' ? ... :
undefined, allowDisconnected)` — always built from `engine.result`, the same
state value driving the 3D preview, so the two can never disagree or show a
stale combination. Errors and warnings are listed separately; the
disconnected-only acknowledgement checkbox only appears when the blocking
issues are *actually* disconnected-only (same logic Step d's own tests
verified); export stays blocked otherwise.

### Ecommerce functionality preserved
- **Product selection / Product Details / router-state behavior**: entirely
  unchanged — `useProductById`, `location.state` reading, and the direct-
  navigation defaults are the same code as Phase 4/5, untouched.
- **Customization summary**: `CustomizationSummary` is unchanged as a
  component; now receives the real selected font's display name
  (`fontDef?.name`) instead of a UI label string, otherwise identical.
- **Add-to-cart / cart / checkout**: **nothing existed to preserve.**
  Re-confirmed by reading `Cart.jsx` (still Phase 1's `PagePlaceholder`,
  unchanged since) and `CustomizationSummary.jsx` (only "Back to Product"/
  "Continue Browsing" links — Phase 5 had already removed the old
  non-functional "Add to Cart" button, since it had no `onClick` at all).
  Stating this plainly rather than inventing cart integration that wasn't
  there to begin with, per "do not start unrelated features."
- **No new cart/backend fields were needed** — nothing in this step
  required a schema or backend change, so there was nothing to stop and
  report under your restriction #7.
- **Pricing**: untouched; `product.price` display is exactly as before.
- **Routes**: unchanged (`/customise/:productId` still resolves the same way).

### Automated test results
No browser is available in this session, so — consistent with every prior
step — the real, unmodified production code was exercised via direct Node
execution and in-process worker-handler simulation, run across three checks:

**1. `productMapping.js` logic (manual spot-check, all correct)**:
`templateOptionsForCategory('Keychains')` → `['name-keychain',
'articulated-name']`; `('Nameplates')` → `['nameplate']` only.
`shapeDefaultsForSize` correctly scaled all 4 real product size labels
(Small 4cm → 13mm text/2.0mm thick, Medium 5.5cm → 18mm/2.5mm, Large 7cm →
22mm/2.9mm, Desk 15cm → clamped to the engine's own 30mm/4mm maximums).
`fontIdForTemplate` correctly auto-corrected Nunito (not articulated-
capable) to Bungee when switching to the articulated template, and left
Montserrat (already capable) unchanged.

**2. End-to-end integration test — the exact `params` shape `Customiser.jsx`
constructs, run through the real engine (11/11 checks passed)**. Built a
test helper that mirrors the page's `params` `useMemo` exactly, then ran it
through the real `geometryWorker.js` (in-process simulation, same method as
Steps c/d) for all three real sample products and several real UI flows:
  - Product 1 (Classic Name Keychain, default name-keychain/contour) →
    printable.
  - Product 1, user switches "Keychain type" to Articulated with Nunito
    still selected → confirmed `fontIdForTemplate` actually changed the
    font away from Nunito → generates a printable, real multi-letter
    articulated result.
  - Product 2 (Acrylic Nameplate) → confirmed `keyringPosition` is
    correctly omitted (template doesn't support one) and `subtitle` is
    correctly included (template does) → text + subtitle together generate
    a printable nameplate.
  - Product 3 (Metal Name Keychain), simulating a `ShapeParameterSliders`
    override (`textSizeMm` bumped from its size-derived default to 26) →
    still printable, and the resulting `dimensions.heightMm` is measurably
    larger than the un-overridden default, confirming the override actually
    reaches the engine, not just the UI state.
  - **One real bug was caught and fixed by this testing, worth reporting
    in full**: my first draft of this test only passed a primary
    `fontDefinition` to the simulated worker message, not a
    `subtitleFontDefinition` — the nameplate-with-subtitle case then failed
    with `subtitle-font-load` (Node has no HTTP server for the subtitle
    font's fallback `fetch()`). Re-reading `Customiser.jsx`'s actual code
    confirmed it *does* pass both (`subtitleFontDefinition: subtitleFontDef`
    in the `useGeometryEngine` call) — so this was a gap in my test's
    fidelity to the real page, not a bug in the page itself. Fixed the test
    to pass both (mirroring the real call), and the same scenario then
    passed cleanly. Documenting this because it's exactly the kind of thing
    worth being transparent about rather than quietly correcting.

**3. `meshBufferToThreeGeometry` against a real generated mesh**: produced
a real, non-trivial `THREE.BufferGeometry` pair (1807 and 1122 position
entries for a sample "Ava" keychain's base and relief respectively), with a
bounding-sphere radius in the expected ballpark for the mesh's actual
millimetre dimensions, and disposed without error.

**Total: counted checks across all three batteries passed; zero outstanding
failures** after the one test-fidelity fix above (which was in my test
script, not the shipped code).

### Lint/build results
`npm run lint`: initially surfaced one new `react(set-state-in-effect)`
warning in `useResultGeometries.js`'s first draft — fixed by deriving the
geometry pair with `useMemo` (keyed on `result`) and using a separate effect
purely for disposal comparison via a ref, rather than calling `setState`
inside the effect. Final `npm run lint`: passes, same single pre-existing
Footer warning as every prior phase, zero new warnings.

`npm run build`: passes. Notably different from every prior step: this is
the **first build where the worker is actually bundled**, because
`Customiser.jsx` now really imports it — `dist/assets/geometryWorker-*.js`
appears as its own ~510 KB chunk (the full manifold-3d + keychain-builder
dependency graph), and the main `index-*.js` bundle **shrank** from
~1,695 KB to ~1,447 KB, since that whole engine moved out of the main
thread's bundle into the worker's own chunk — a real, measurable confirmation
that the wiring took effect, not just that the build didn't error.

### Browser verification status
**Not performed.** No browser or headless-rendering tool is available in
this session. What *was* verified, as detailed above: the real production
`Customiser.jsx`'s exact parameter-construction logic, run through the real
unmodified engine/worker code, for all three real products and several real
user interaction sequences — this is substantially stronger than a pure
code-inspection claim, but it is not the same as a human or automated
browser actually loading `/customise/1`, dragging the 3D preview, clicking
a font button, and downloading a file. See "Instructions for launching and
testing locally" below for exactly how to do that.

### Known limitations
- **No automated browser testing was performed** (see above) — this is the
  single most important thing to actually verify before calling this
  production-ready.
- Subtitle font is linked to the main font (no independent subtitle font
  picker) — a stated scope simplification, not a missing capability of the
  engine itself.
- Magnet and plant-label templates are intentionally never offered in this
  UI (no matching product in Giftora's catalog) — see "Customization
  controls" above.
- `ShapeParameterSliders` exposes every applicable registry parameter as a
  raw slider — functionally complete and correctly scoped (only active
  parameters appear), but not curated/simplified for a first-time customer;
  worth a later design pass if it proves overwhelming in practice.
- The old simplified engine's files remain on disk, unused — left in place
  rather than deleted, per "preserve existing changes" and out of caution
  (not explicitly asked to remove them).
- Cart/checkout remain exactly as unimplemented as they were before this
  step (Phase 6 territory) — nothing was added or faked here.
- The temporary `D:\manifold.wasm` file (Steps c/d) was reused again for
  this step's Node-level tests and is still present; still blocked from
  programmatic deletion by a drive-root safety check — please remove it
  manually when convenient.

### Remaining production-readiness tasks
1. **Actual browser testing** — load the customizer, try every control,
   confirm the 3D preview renders and updates correctly, confirm STL/3MF
   downloads actually open in a slicer, check mobile layout.
2. Decide whether `ShapeParameterSliders`' full registry-driven panel is the
   right end-customer experience, or whether a curated subset (e.g. only
   `textSizeMm`, keyring details) should be the default with the rest
   behind an "Advanced" disclosure.
3. Consider adding an independent subtitle font picker if that distinction
   matters for nameplate customers.
4. Cart/checkout (Phase 6) remains unimplemented — exporting an STL/3MF
   file today has no connection to placing an order.
5. Revisit whether to remove the now-fully-unused old simplified engine
   files, once you're satisfied the new path is solid.

### Instructions for launching and testing Giftora locally
1. From `apps/customer-frontend`, run `npm run dev`.
2. Open the printed local URL in a browser.
3. Navigate to a product (e.g. Classic Name Keychain) → "Customize This
   Keychain" (or go directly to `/customise/1`, `/customise/2`, or
   `/customise/3` for the three sample products).
4. Try: typing text, switching font, switching template (Keychains
   products only), switching style, switching keyring position, moving a
   few shape sliders, switching material/colour/size — the 3D preview
   should update after a short debounce each time, with a "Generating your
   design…" message while a request is in flight.
5. Watch the Printability panel update: a clean design should show "Ready
   to print" or "Ready, with warnings"; try an empty text field or a very
   long name to see the blocked/warning states.
6. Click "Download STL" and "Download 3MF" on a printable design — both
   should download a real file; open either in any slicer or 3D viewer to
   confirm it's a valid, non-empty model (this specific check — actually
   opening a downloaded file — has not been done in this session).
7. Check DevTools → Network/Sources for a separate `geometryWorker` script
   loading, confirming the Worker is genuinely active.
8. Resize the browser or use DevTools' device toolbar to check the mobile
   layout.

### Next phase
Approved — see the PLA Material and Finish Selection update below.

---

## PLA Material and Finish Selection — Complete (2026-11-03)

### Summary
Replaced the `Wood` material option with two real PLA finishes — **Standard
PLA** and **Silk Metallic PLA** — across the product data, the Product
Detail page, the Customiser page, the live 3D preview appearance, and the
STL/3MF export path. In the course of verifying export correctness, found
and fixed a real bug: 3MF exports were not preserving the customer's chosen
colour at all.

### Files modified
- `src/data/sampleProducts.js` — added `colorsForMaterial(product, material)`
  helper; changed product `1` (Classic Name Keychain) from `Wood` to
  `materials: ['Standard PLA', 'Silk Metallic PLA']` with a new
  `colorsByMaterial` map (4 Standard PLA colours: White, Black, Red,
  Natural; 5 Silk Metallic PLA colours: Gold, Silver, Bronze, Copper, Steel
  Grey); description updated from "wooden keychain" to "PLA keychain".
  Products `2` and `3` (Acrylic Nameplate, Metal Name Keychain) were left
  untouched.
- `src/features/customiser/materialAppearance.js` — removed the `Wood`
  entry; added `Standard PLA` (`metalness: 0, roughness: 0.6`) and
  `Silk Metallic PLA` (`metalness: 0.75, roughness: 0.18`).
- `src/pages/ProductDetail.jsx` — colour list now derived per-material via
  `colorsForMaterial`; added an effect that resets the selected colour to
  the new material's first colour when it's no longer valid for the chosen
  material.
- `src/pages/Customiser.jsx` — same per-material colour derivation and
  reset effect as above; fixed `resetCustomization()` (previously reset to
  `product.colors?.[0]`, which no longer exists as a flat default for
  multi-material products); passed the actual selected `material` into
  `CustomizationSummary` (previously omitted); passed `color.hex` into
  `ExportButtons` as `colorHex`.
- `src/components/customiser/CustomizationSummary.jsx` — **bug fix**: the
  "Material" row always displayed `product.materials?.[0]` (the catalog's
  first material) regardless of what the customer actually selected. Now
  accepts and displays the real `material` prop.
- `src/components/product/ProductSpecs.jsx` — the "Available colours" spec
  row now lists colours per material (`Standard PLA: White, Black, …` ·
  `Silk Metallic PLA: Gold, Silver, …`) instead of silently showing only
  one material's colours.
- `src/components/customiser/ExportButtons.jsx` — **bug fix**: 3MF export
  now passes an `appearanceOverrides` object (`{ version: 1, base:
  colorHex, relief: <contrast colour> }`) built from the customer's actual
  selected colour, instead of always passing `undefined` and silently
  falling back to the worker's hardcoded default red/cream appearance.

### Material options implemented
| Material | Finish | Colours |
|---|---|---|
| Standard PLA | Normal matte PLA filament | White, Black, Red, Natural |
| Silk Metallic PLA | Glossy, metallic-*style* PLA filament (plastic, not real metal) | Gold, Silver, Bronze, Copper, Steel Grey |

The UI copy nowhere describes Silk Metallic PLA as actual metal — it is
PLA plastic with a glossy, metallic-looking finish, same as the printed
object really is.

### Preview behaviour
- Colour swatches switch to the selected material's own list immediately;
  an invalid carried-over colour snaps to that material's first colour.
- The live Viewport3D preview's `meshStandardMaterial` picks up
  `metalness`/`roughness` from `materialAppearance.js` keyed on the
  selected material name, so Standard PLA renders matte/plastic and Silk
  Metallic PLA renders glossy/reflective, purely driven by real selections
  — no decorative controls that don't affect the model.
- Geometry generation (template/style/shape/text) is completely unaffected
  by material or colour — verified directly via the real `buildKeychain`
  builder; these remain pure rendering/export concerns.

### Export verification
- **STL**: unaffected, still produces a valid binary mesh. STL has no
  colour/material channel at all — this is a property of the file format
  itself, not a limitation introduced or fixed here.
- **3MF — bug found and fixed**: verified byte-for-byte that, before this
  fix, exporting 3MF ignored the customer's selected colour entirely and
  always embedded the worker's hardcoded default colours. After wiring
  `colorHex` through to `appearanceOverrides`, a customer's selected colour
  hex (e.g. Gold `#C9A227`) is now provably present in the exported 3MF
  XML, and a different selected colour (e.g. Silver `#C0C0C0`) produces a
  measurably different export with Gold's hex absent. All 9 colours (4
  Standard PLA + 5 Silk Metallic PLA) were round-tripped through 3MF export
  with no errors.
- I do not claim 3MF export preserves true PBR metalness/roughness
  properties (3MF's base colour-group mechanism carries flat colour, not a
  metallic/roughness material model) — only that the customer's chosen
  *colour* is now correctly preserved, which was explicitly verified and
  previously was not true.

### Cart compatibility
No cart exists yet in this codebase (Phase 6 — Cart — has not been started
and remains unapproved). Nothing in this change touches checkout, cart
state, or any ecommerce backend; the `customiseState` object passed via
route `state` (`material`, `color`, `size`, `quantity`) already carried
material/colour generically and needed no changes for the new materials.

### Build and test results
- Verified via a Node-executed simulation of the real, unmodified
  `geometryWorker.js` (no browser available in this session): 17/17 checks
  passed — Wood removal, exact colour lists per material, appearance
  metalness/roughness thresholds for both materials, geometry generation
  unaffected by material/colour, STL export working, 3MF export missing
  colour before the fix and present after the fix for multiple distinct
  colours, and all 9 colours exporting cleanly.
- `npm run lint` — clean (only the single pre-existing, unrelated Footer
  `react(purity)` warning present before this task, unchanged).
- `npm run build` — clean production build, bundle sizes consistent with
  the existing worker-based architecture.
- Dev-server route smoke test: `/products/classic-name-keychain`,
  `/customise/1`, `/products/metal-name-keychain`, `/customise/3` all
  returned HTTP 200.
- **No real browser testing was performed in this session** (no browser
  tool available). Manual testing instructions:
  1. Open `/products/classic-name-keychain`, switch between Standard PLA
     and Silk Metallic PLA, and confirm the colour swatches change to the
     correct 4/5-colour lists for each.
  2. Open `/customise/1`, repeat the same material/colour switch, and
     watch the 3D preview: Standard PLA should look like a matte plastic
     tag, Silk Metallic PLA should look noticeably glossier/more
     reflective in each of its 5 colours.
  3. Confirm the "Your customization" summary panel shows the material and
     colour you actually picked (not always the first option).
  4. With a printable design, download both STL and 3MF for a couple of
     different colour selections; open the 3MF files in a text/XML viewer
     or a 3D-print slicer and confirm the colour matches what was picked
     in each case.
  5. Confirm "Reset" returns to Standard PLA and its first colour, not a
     stale `Wood` state.

### Limitations
- No real browser testing was performed in this session (see manual
  instructions above).
- `D:\manifold.wasm`, a temporary file copied to the drive root for
  Node-level WASM testing during Step (c)/(d), still needs manual
  deletion — tool-level safety checks block automated removal of a
  drive-root path.
- Out-of-scope marketing copy (e.g. a homepage "Wooden Keychains" category
  card or "Wood, acrylic and steel" trust-bar text, if present) was not
  touched, since it falls outside this focused material/finish task and
  the instruction not to add unrelated changes; it may now read as stale
  and could be worth a follow-up pass.
- 3MF colour preservation covers flat base colour only, not true
  metalness/roughness PBR data (3MF's colour-group mechanism doesn't carry
  that); this is a format/mechanism limitation, not something left
  unverified.

### Next phase
Approved — see the Customizer UI Update below.

---

## Customizer UI Update — Reference-Based Design — Complete (2026-11-03)

### Summary
Note: no screenshot files were actually attached to this request in this
session — the reference was described only in text. Implemented from that
written description; some layout/visual details may not exactly match the
screenshots the instructions referred to.

Reworked the customer-facing `/customise/:id` page into a two-column
layout (3D preview ~60% / a vertically-scrollable, step-numbered
customization panel ~40%), matching the described reference: light-blue
grid preview background, Back/Cart controls near the top, dimensions
overlay bottom-left, and four numbered steps (Text, Font, Colors,
Thickness). Removed Keyring Position, Material, Shape (style), and
Subtitle from the default customer-facing view — tucked into a collapsed
"More options" disclosure rather than deleted, per the instruction that
other products may still depend on that geometry functionality. The
Material selector itself is not shown at all, anywhere, per the explicit
instruction; material stays fixed to the product's default (Standard PLA).

### Files modified
- `src/pages/Customiser.jsx` — full layout rework: two-column grid (kept
  the existing `3fr_2fr` ratio), sticky/scrollable right panel, default
  example text (`"Alex"`), four `CustomizerStepCard`s, a collapsed
  "More options" `<details>` holding subtitle/keychain-type/shape/keyring
  position/advanced shape sliders, a disabled "Cart" button (no cart
  exists yet) and a real "Back" link, a new `textColor` state (the Step 3
  "Font / Text Color" selection) threaded into the preview and export.
- `src/components/customiser/Viewport3D.jsx` — light-blue grid background;
  accepts and passes through `textColor`; renders real dimensions
  (`preflight.dimensions`) bottom-left.
- `src/features/customiser/ProductModel.jsx` — relief (text) mesh now uses
  an explicit `textColor` prop when supplied, instead of always
  auto-computing a contrast colour.
- `src/components/customiser/ExportButtons.jsx` — accepts `textColorHex`;
  3MF `appearanceOverrides.relief` now uses the customer's chosen text
  colour when present, falling back to the previous auto-contrast
  behaviour otherwise (a strict superset of the prior behaviour, not a
  replacement).
- `src/components/customiser/CustomizerStepCard.jsx` (new) — numbered
  step-card wrapper (number badge, heading, description, content).
- `src/components/customiser/FontPickerCards.jsx` (new) — horizontal font
  preview cards with category tabs, backed entirely by the real, existing
  `FONT_CATALOG` (grouped, not duplicated or invented).
- `src/components/customiser/fontPreview.css` (new) — `@font-face` rules
  pointing at the same local, already-licensed `.ttf` files in
  `public/fonts/` the geometry engine already serves, purely so font cards
  render a true preview (no Google Fonts API, no new font files).
- `src/features/customiser/fontUiCategories.js` (new) — maps the real
  `FontCategory` values (Calligraphic/Handwritten → "Cursive / Script";
  Chunky/Geometric → "Bold & Block"; Playful/Decorative/Marker → "Retro &
  Fun"; plus "All Fonts") onto the catalog — a pure UI grouping, no new
  fonts.
- `src/components/customiser/ThicknessPicker.jsx` (new) +
  `src/features/customiser/thicknessOptions.js` (new) — Standard (2.4 mm)
  / Premium (3.6 mm) `baseThicknessMm` presets, both verified in-range for
  the engine's own `normalizeParams` clamp (1.6–4 mm for
  name-keychain/nameplate templates).

### UI changes
- Two-column desktop layout (preview left, steps right); on mobile the
  grid collapses to a single column (preview above controls), same
  responsive behaviour the existing Tailwind grid already provided.
- Preview background changed to a light-blue grid pattern.
- Real finished dimensions (width × height × thickness, from the live
  preflight report) now also shown as an overlay at the bottom-left of the
  3D preview, not just in the Printability panel below.
- A disabled "Cart" button and a working "Back" link appear above the
  preview.
- Font step redesigned as horizontally-scrollable preview cards with
  category tabs, each card rendering the font's own real sample text in
  its own real typeface (via the new local `@font-face` rules).
- Color step redesigned using the existing `ColorSwatchPicker` (already
  circular swatches with a selection ring and the colour name shown beside
  the label) for two independent pickers: Base Color and Font/Text Color.
- Thickness step added: Standard vs Premium cards, each showing its real
  mm value.

### Removed options (from the default customer-facing view)
- **Keyring Position** — moved into "More options" (collapsed).
- **Material selector** — not shown anywhere; material is fixed to the
  product's default.
- **Shape (style) selector** — moved into "More options" (collapsed).
- **Subtitle (optional)** — moved into "More options" (collapsed).
- The existing advanced `ShapeParameterSliders` panel and the "Keychain
  type" picker (for products that support more than one template) were
  also moved into "More options" rather than being deleted, since they are
  real, functioning geometry controls other products may rely on, and the
  instructions explicitly allow hiding rather than removing.

### Default text behavior
- Opens with `"Alex"` pre-filled in both the input and the 3D preview.
- Fully editable at any time; typing never gets overwritten by font or
  colour changes (separate React state, verified by inspection — this is
  the same state-isolation pattern already used for text vs. other
  controls before this change).
- Clearing the text field is handled the same way it already was: the
  existing preflight validation reports it (not newly introduced by this
  change), the preview doesn't crash.

### Color preview behavior
- Base Color sets the base mesh's `meshStandardMaterial` colour (as
  before).
- Font / Text Color is new: it now independently sets the relief (text)
  mesh's colour, instead of that colour always being auto-computed from
  the base colour's contrast. Both pickers draw from the same
  `colorsForMaterial` list (the product's real supported colours for the
  selected material), so both selections correspond to the real base/relief
  geometry+colour partitions the engine and 3MF exporter already support —
  no cosmetic-only colour option was added.
- **No separate "Outline Color" control was implemented.** Verified via
  the real `styleBuilder.js`/`keychain-builder.js`/3MF export pipeline that
  only two colourable geometry partitions exist: base and relief (text).
  The "outline" group in the existing `ShapeParameterSliders` registry is
  a *shape*-parameter group (corner radius, bubble/tag/arch silhouette
  size), not a colour partition — there is no outline mesh to colour
  independently. Adding an "Outline Color" control would have been exactly
  the kind of unsupported, cosmetic-only option the instructions said to
  avoid, so it was intentionally left out rather than faked.

### Geometry and export verification
- Thickness: both Standard (2.4 mm) and Premium (3.6 mm) values verified
  via a direct Node call to the real `normalizeParams` — both pass through
  unclamped, confirming they're genuinely valid, in-range
  `baseThicknessMm` settings for the current templates, not invented
  numbers.
- Font categories: verified via direct Node checks that every font listed
  under each new UI category tab is a real, existing `FONT_CATALOG` entry
  (no fonts added, renamed, or duplicated), and that each category
  actually contains at least one font.
- Material/colour data (Standard PLA / Silk Metallic PLA, 4/5 colours)
  re-verified unchanged by this UI pass.
- Text, font, and thickness changes all flow through the same `params`
  object already wired into the real `useGeometryEngine`/worker pipeline
  from Step (c)/(e) — unchanged in this pass, so geometry regeneration on
  each of those changes is the same previously-verified mechanism, not new
  code.
- 3MF export: the `appearanceOverrides` contract itself is unchanged from
  the prior Material/Finish task (already verified end-to-end then); this
  pass only changes what value is supplied for `relief` (the customer's
  own Font/Text Color selection when set, the same auto-contrast fallback
  otherwise) — a superset of the previously-verified behaviour, not a new
  mechanism. A full byte-level re-verification of the 3MF pipeline itself
  was not repeated in this pass since the pipeline code was not touched.
- STL export: unaffected (still has no colour channel, same as always).

### Cart compatibility
No cart exists yet (Phase 6 unstarted). The "Cart" button shown near the
top of the preview is a disabled placeholder matching the reference
layout — it does not claim to add anything to a cart, since there is no
cart to add to yet. The existing `customiseState`/export/summary data
flow is unchanged.

### Build and test results
- `npm run lint` — clean (only the pre-existing, unrelated Footer
  `react(purity)` warning).
- `npm run build` — clean production build.
- Dev-server route smoke test: `/`, `/products/classic-name-keychain`,
  `/customise/1`, `/customise/2` all returned HTTP 200.
- 13/13 Node-level checks passed: thickness presets survive
  `normalizeParams` unclamped; every font-category bucket contains only
  real catalog fonts and each new bucket is non-empty; material/colour
  data unaffected.
- **No real browser testing was performed in this session** (no browser
  tool available). Manual testing instructions:
  1. Open `/customise/1` and confirm "Alex" is pre-filled in both the text
     box and the 3D preview; edit it and confirm the preview updates.
  2. Click through the font category tabs (All Fonts / Cursive & Script /
     Bold & Block / Retro & Fun) and confirm each card shows real sample
     text in a visually distinct typeface; select a few and confirm the
     preview's text geometry changes.
  3. Pick different Base Color and Font/Text Color swatches and confirm
     the 3D preview's base and text parts change colour independently.
  4. Switch between Standard and Premium thickness and confirm the
     preview's base visibly thickens/thins and the printability/dimensions
     readouts update.
  5. Confirm Keyring Position, Shape, Subtitle, and the advanced shape
     sliders are hidden by default but reachable via "More options", and
     that no Material selector appears anywhere.
  6. Resize to a mobile width and confirm the preview stacks above the
     controls with no horizontal overflow, and that font cards/colour
     swatches are usable by touch (large enough tap targets).
  7. With a printable design, download STL and 3MF and confirm they still
     produce valid files; open the 3MF in a text/XML viewer and confirm it
     reflects the chosen Font/Text Color for the relief part.

### Remaining limitations
- No screenshots were actually received in this session — this was built
  from the written description only, so some spacing/visual details may
  differ from the actual reference images.
- No real browser testing was performed (manual steps above).
- "Outline Color" was intentionally not implemented — no real outline
  colour partition exists in the geometry/export pipeline (see above).
- The "Keychain type" (template) picker and the advanced shape-parameter
  sliders were hidden rather than deleted, to avoid removing geometry
  functionality other products may depend on; this keeps the panel
  slightly more than the reference's exact 4 steps when expanded.
- `D:\manifold.wasm` (from earlier Steps c/d Node-level testing) still
  needs manual deletion.

### Next phase
No further phase has been authorized. Awaiting your review before any
further work.

---

