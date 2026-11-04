# Giftora Page-by-Page Redesign Blueprint

**Status:** Design artifact — documentation only. No code changed.
**Companion document:** `GIFTORA_UI_UX_DESIGN_SYSTEM.md` (tokens, components, standards referenced throughout).
**Method:** every "Current" note below reflects the actual file read for that route, not an assumption.

---

## Part A — Customer Frontend

### `/` — Home (`pages/Home.jsx`)
- **Current UI problems:** Category grid is 3 hardcoded cards with invented copy ("Wooden Keychains" — stale since Wood was removed from the catalog; flagged in an earlier phase's own limitations), not connected to the real `/categories` API. Hero illustration is a placeholder inline SVG, not real product imagery.
- **Proposed layout:** Keep Hero → CategoryGrid → Featured products → HowItWorks → Best sellers → TrustBar → PromoBanner structure (it's sound). Swap CategoryGrid to render real categories once category artwork exists.
- **Main components:** `Hero`, `CategoryGrid`, `ProductSection` ×2, `HowItWorks`, `TrustBar`, `PromoBanner`.
- **UX improvements:** Hero CTA already correctly hides when no product is loaded (good defensive UX, keep it). Add a loading skeleton for the hero's product-dependent CTA area instead of just omitting the button.
- **Responsive behavior:** Already stacks correctly (grid-based sections already go 1-up on mobile per Tailwind responsive classes present in the component).

### `/products` — Catalog (`pages/Products.jsx`)
- **Current UI problems:** Filtering/sorting is entirely client-side over a single fetched page (by design, per Phase 4's documented tradeoff) — fine at current catalog size, but the facet sidebar's visual hierarchy (label vs. option vs. count) isn't strongly differentiated.
- **Proposed layout:** Keep the existing `[220px sidebar | grid]` two-column structure (already matches the "catalog sidebar" convention most ecommerce users expect).
- **Main components:** `CatalogFilters`, `ActiveFilters`, `SortMenu`, `ProductGridSkeleton`, `EmptyState`, `ProductCard`.
- **UX improvements:** Style `ActiveFilters` as removable pill chips (component exists, verify/standardize the pill treatment per the Badge spec). Add a results count directly above the grid, not just in the loading-state text (currently the "N products" text disappears into the header area).
- **Responsive behavior:** Already implemented — sidebar moves into a slide-over drawer on mobile (`mobileFiltersOpen` state present and functional).

### `/products/:slug` — Product Detail (`pages/ProductDetail.jsx`)
- **Current UI problems:** No sticky add-to-cart affordance once scrolled past the fold on mobile. "Customize This Keychain" and "Add to Cart" are visually equal-weight buttons, which can blur the primary path (customization is the product's core value proposition).
- **Proposed layout:** Two-column gallery/info retained. Make "Customize This Keychain" the visually primary action (solid accent) and "Add to Cart" secondary (outline) — currently they're styled as accent/secondary respectively already, which is correct; preserve this hierarchy explicitly as a rule, don't let it drift.
- **Main components:** `ProductGallery`, `OptionPicker`, `ColorSwatchPicker`, `QuantitySelector`, `ProductSpecs`, `ProductSection` (related products).
- **UX improvements:** Add a mobile sticky bottom bar with price + the two CTAs once the user scrolls past the main action area.
- **Responsive behavior:** Gallery/info already stack on mobile (`sm:grid-cols-2`).

### `/customise/:productId` — 3D Customizer (`pages/Customiser.jsx`)
- **Current UI problems:** Minimal — this is the most mature screen. The only notable gap: the "Keychain type" template picker and advanced shape sliders are tucked into a generic "More options" disclosure, which is correct for focus but slightly under-labeled (a first-time user may not know what's behind it).
- **Proposed layout:** No structural change. Retain the 60/40 split, light-blue grid preview, numbered step cards (Text/Font/Colors/Thickness), and dimensions overlay exactly as implemented.
- **Main components:** `Viewport3D`, `CustomizerStepCard`, `FontPickerCards`, `ThicknessPicker`, `PreflightPanel`, `ExportButtons`, `CustomizationSummary`.
- **UX improvements:** Rename "More options" to something slightly more descriptive (e.g., "Shape & advanced options") so it reads as discoverable rather than a generic catch-all. Add a brief helper caption under the Printability panel explaining what "Ready, with warnings" actually means for a first-time customer.
- **Responsive behavior:** Already correct — preview stacks above controls on mobile (documented and verified in Phase 4's Customizer UI update).

### `/cart` — Cart (`pages/Cart.jsx`)
- **Current UI problems:** None structural. Minor: the "no longer available" flag on a deactivated product's line item is styled as plain danger text, not visually separated enough from an otherwise-normal row (easy to miss while scanning).
- **Proposed layout:** Keep the single-column item list + right-aligned subtotal/total summary.
- **Main components:** `QuantitySelector`, `CustomizationDetails`, line-item rows, `Button` (Proceed to Checkout).
- **UX improvements:** Give an unavailable line item a subtle background tint (e.g., `danger/5`) so it's scannable at a glance, not just a small caption.
- **Responsive behavior:** Already single-column and functional at all widths (no multi-column layout to break).

### `/addresses` — Address Management (`pages/Addresses.jsx`)
- **Current UI problems:** The add/edit form is a dense 2-column grid of plain inputs with no visual grouping (e.g., "Recipient" vs. "Address" vs. "Location" are not separated).
- **Proposed layout:** Group the form into three visual clusters with small section labels: Recipient (name, phone) / Address (line 1, line 2) / Location (city, state, postal code, country).
- **Main components:** `AddressForm` (internal), address cards with Edit/Delete/Set-default actions.
- **UX improvements:** Move "Set as default" into a small radio-style selector at the top of the list rather than a text link per card, so default-ness is scannable as a single column, not buried per-card.
- **Responsive behavior:** Form grid already collapses to 1 column on mobile (`sm:grid-cols-2` present).

### `/checkout` — Checkout (`pages/Checkout.jsx`)
- **Current UI problems:** None structural — this page has genuinely good UX already (server-revalidated summary, clear blocking vs. non-blocking issue distinction). Visual gap: the address radio-card list and the order summary card use slightly different border/spacing treatments.
- **Proposed layout:** Keep address selection → order summary → totals → Place Order, top to bottom.
- **Main components:** Address radio cards, `CustomizationDetails`, issue badges, `Button` (Place Order).
- **UX improvements:** Unify the address-card and order-summary-card visual treatment (same border weight, same corner radius, same internal padding) so the page reads as one system rather than two juxtaposed patterns.
- **Responsive behavior:** Already single-column, functional at all widths.

### `/order-success/:orderId` — Order Success (`pages/OrderSuccess.jsx`)
- **Current UI problems:** None functional. The checkmark icon is a plain text "✓" character in a circle, not a real icon glyph — acceptable but slightly flat for a moment meant to feel celebratory/reassuring.
- **Proposed layout:** Keep the centered confirmation header → order summary → address → actions structure.
- **Main components:** `OrderItemsList`, `OrderAddressSummary`, `Button` ×2 (View order details / Continue shopping).
- **UX improvements:** Replace the text checkmark with a proper outline-style check icon per the iconography rule in the design system.
- **Responsive behavior:** Already a single centered column at all widths — fine as-is.

### `/track-order` — Track Order (`pages/TrackOrder.jsx`)
- **Current UI problems:** Still a bare `PagePlaceholder` — no real UI exists yet (this is a guest order-lookup feature, distinct from the logged-in "My Orders"/"Order Details" pair, and was never implemented in any backend phase either).
- **Proposed layout (new):** A single centered form — order number + email — submitting to a (currently nonexistent) guest-lookup endpoint, returning the same `OrderStatusTimeline` component already built for `/orders/:orderId`.
- **Main components:** `Input` ×2, `Button`, (reuse) `OrderStatusTimeline`, `OrderItemsList`.
- **UX improvements:** N/A — not yet built.
- **Responsive behavior:** Single column, trivially responsive once built.

### `/login` and `/register` (`pages/Login.jsx`, `pages/Register.jsx`)
- **Current UI problems:** Functional and already on-brand (uses the shared design tokens, proper focus rings). No real problems found.
- **Proposed layout:** Keep the centered single-column form.
- **Main components:** `Input`-style fields (currently hand-rolled per-field, could be swapped for the shared `Input` component for consistency), `Button`.
- **UX improvements:** Replace the hand-rolled `<label><input>` blocks with the existing shared `ui/Input.jsx` component for 1:1 visual consistency with the rest of the app (currently these two pages style inputs inline rather than reusing it — a small drift worth closing).
- **Responsive behavior:** Already a simple centered column, fine at all widths.

### `/my-orders` — My Orders (`pages/MyOrders.jsx`)
- **Current UI problems:** None structural. Each order row is a single dense block; on a long order history this could benefit from a touch more breathing room between rows.
- **Proposed layout:** Keep the card-per-order list.
- **Main components:** `OrderStatusBadge`, order summary row.
- **UX improvements:** Add a status filter/sort (e.g., "Show: All / Active / Delivered / Cancelled") once order volume justifies it — not urgent at current scale.
- **Responsive behavior:** Already a single column, wraps correctly (`flex-wrap` present).

### `/orders/:orderId` — Order Details (`pages/OrderDetails.jsx`)
- **Current UI problems:** None structural — this page is well-composed (breadcrumb, status badge, timeline, items, address, totals, all in a sensible order).
- **Proposed layout:** No change.
- **Main components:** `OrderStatusBadge`, `OrderStatusTimeline`, `OrderItemsList`, `OrderAddressSummary`.
- **UX improvements:** None significant found.
- **Responsive behavior:** `OrderStatusTimeline` already has an explicit mobile (vertical) vs. desktop (horizontal) layout built in — verified in the component.

### `/contact` — Contact (`pages/Contact.jsx`)
- **Current UI problems:** Still a bare `PagePlaceholder` — no contact form exists yet (explicitly out of scope for every phase completed so far; Phase 15 territory per the project's own phase plan).
- **Proposed layout (new):** Simple contact form (name, email, message) + static contact details (support email, hours) side-by-side on desktop, stacked on mobile.
- **Main components:** `Input` ×2, a `Textarea` (not yet in the shared component set — add per §4 of the design system), `Button`.
- **UX improvements:** N/A — not yet built.
- **Responsive behavior:** Two-column desktop / single-column mobile, trivially responsive once built.

### `*` — Not Found (`pages/NotFound.jsx`)
- **Current UI problems:** Not inspected in depth this pass (low priority, but present and functional per the route table).
- **Proposed layout:** Centered message + a primary action back to `/products` or `/`.
- **Main components:** `Button`.
- **UX improvements:** Ensure it uses the same token-driven styling as every other page, not a bespoke one-off.
- **Responsive behavior:** Trivially responsive (single centered block).

---

## Part B — Admin Frontend

### `/login` (`app/login/Login.jsx`)
- **Current UI problems:** Plain gray/white form with no brand identity — functionally correct (real auth, real error handling) but visually indistinguishable from any default admin template.
- **Proposed layout:** Centered card on the new `--color-admin-canvas` background, with the Giftora wordmark above the form (shared across both apps) rendered in the admin palette.
- **Main components:** `Input`, `Button` (admin-tokened versions per the design system).
- **UX improvements:** None functional — this is purely a visual/token pass.
- **Responsive behavior:** Already a simple centered card, fine at all widths.

### `/` — Dashboard (`app/dashboard/Dashboard.jsx`)
- **Current UI problems:** 12 stat cards in one flat responsive grid with no grouping — revenue, order-status counts, and catalog counts are visually equal-weight, making the most important number (revenue) no more prominent than "Total products."
- **Proposed layout:** Three visually distinct clusters — **Revenue & Orders** (total revenue, total orders, total customers — the headline numbers, larger card), **Order Pipeline** (the 5 active statuses as a connected row, echoing the customer-facing timeline's visual language), **Catalog Health** (total products, low/out-of-stock placeholders).
- **Main components:** `StatCard` (restyled per cluster), link to `/reports`.
- **UX improvements:** Add the proposed sidebar (see below) so Dashboard isn't competing with a horizontal nav bar for the page's top visual space.
- **Responsive behavior:** Stat grid already responds (`sm:grid-cols-3 lg:grid-cols-4`) — preserve, just regroup.

### `/products` and `/products/new` / `/products/:id/edit` (`app/products/*`)
- **Current UI problems:** Product list table is plain and functional. The create/edit form is a single long vertical stack of fields including a raw JSON textarea for `colorsByMaterial` — functional but intimidating for a non-technical admin user.
- **Proposed layout:** List page unchanged structurally. Form page: group into **Basics** (name, slug, description, price) / **Organization** (category, materials, sizes) / **Media** (images) / **Colors** (the JSON editor, clearly labeled as advanced/optional) / **Visibility** (active toggle) — using the same collapsible-section pattern already proven in the customer Customizer's "More options."
- **Main components:** `Table`, `Input`, `Select`, `Textarea`, the JSON editor (kept as-is functionally, just visually demoted/labeled).
- **UX improvements:** Move the raw JSON colors field behind a clearly-labeled "Advanced: colors by material (JSON)" disclosure, collapsed by default, so the common path (name/price/category) isn't visually competing with it.
- **Responsive behavior:** Form currently a `sm:grid-cols-2` grid — collapses to 1 column on mobile already; keep.

### `/categories` (`app/categories/Categories.jsx`)
- **Current UI problems:** Inline add form + table with inline edit — functional, no visual problems beyond the general lack of tokens.
- **Proposed layout:** No structural change.
- **Main components:** `Table`, `Input`, `Button`.
- **UX improvements:** None functional — token pass only.
- **Responsive behavior:** Table may need horizontal scroll handling on narrow mobile widths (not currently wrapped in an overflow container — a real gap to fix in implementation).

### `/orders` and `/orders/:id` (`app/orders/*`)
- **Current UI problems:** List page's search/status-filter row and the table are visually disconnected (no shared container). Detail page's two-column (items+address / customer+status) layout is sound but the status-update `<select>` + button pairing doesn't visually confirm the workflow-transition constraint (a user can pick an invalid next status and only find out after clicking).
- **Proposed layout:** Wrap filters+table in one card. On the detail page, gray out / mark as disabled the status options that aren't valid next transitions from the current status (the backend already encodes this exact transition map — surface it in the UI instead of only enforcing it server-side).
- **Main components:** `Table`, `DateRangeFilter`-style filter row, `OrderStatusBadge`, status `Select`.
- **UX improvements:** Disable invalid transition options in the dropdown (data already available via the known `ALLOWED_TRANSITIONS` map in the backend — would need either duplicating that map client-side or a small API addition in a future phase, not this one).
- **Responsive behavior:** Status-count grid on the report-adjacent order view already responsive (`sm:grid-cols-4 lg:grid-cols-7`); the orders table itself needs horizontal-scroll wrapping on mobile (same gap as Categories).

### `/customers` and `/customers/:id` (`app/customers/*`)
- **Current UI problems:** List table is dense (6 columns) with no visual priority — email, phone, joined-date, and order stats all compete equally with the primary "status" signal.
- **Proposed layout:** Keep the table but make the Active/Deactivated badge and the customer name the two highest-contrast elements in each row; de-emphasize phone/joined-date to the `--color-admin-muted` tone (some already are, standardize fully).
- **Main components:** `Table`, `Badge` (active/deactivated), pagination controls (already implemented).
- **UX improvements:** The deactivate/reactivate button on the detail page should show a confirmation step (currently a direct action) given its real consequence (blocks login/orders) — align with the `Dialog` component once implemented, in the meantime a `window.confirm()` is an acceptable interim step (same pattern already used for category/product delete).
- **Responsive behavior:** Same horizontal-scroll gap as Orders/Categories tables on narrow mobile.

### `/reports` (`app/reports/Reports.jsx` + 4 tabs)
- **Current UI problems:** Tab bar is plain text with an underline — functional, no real problems. The dependency-free `SimpleBarChart` has no axis labels or value gridlines, which can make exact values hard to read at a glance (the native `title` tooltip only appears on hover, not touch).
- **Proposed layout:** No structural change to the 4-tab (Sales/Orders/Products/Customers) layout.
- **Main components:** `SimpleBarChart`, `DateRangeFilter`, `StatCard`, tables (best-sellers, top customers, recent/cancelled orders).
- **UX improvements:** Add a lightweight value label on top of each bar (text, not a tooltip) so touch users and anyone scanning quickly don't need to hover.
- **Responsive behavior:** Stat grids already responsive; the bar chart's horizontal-scroll-on-overflow behavior (present in the component) should be verified on narrow phone widths once real implementation begins.

---

## Summary of structural (non-visual-polish) proposals requiring explicit approval before implementation

1. **Admin sidebar navigation** — replaces the current single top nav bar. This is the one change in this document that alters page structure, not just visual tokens.
2. **Toast notification system** — net-new component, doesn't exist anywhere in the app today.
3. **`/track-order` and `/contact` real implementations** — currently placeholders; out of scope for every phase completed so far and would need their own backend work (guest order lookup doesn't exist as an API yet; contact form is explicitly Phase 15).
4. **Admin status-transition-aware dropdowns** (disabling invalid next-statuses in the UI) — would ideally be backed by exposing the transition map to the frontend, a (small) backend touch, not purely visual.

Everything else in this blueprint is a visual/token-level change implementable without touching any backend, API, or 3D Customizer engine code.
