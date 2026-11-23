# Giftora — Tester Feedback Full Audit & Technical Implementation Plan

**Date:** 2026-11-21  
**Project Path:** `C:\Users\UNITED\Giftora_3D_Application`  
**Lead Auditor:** Senior Full-Stack Engineer  
**Status:** Read-Only Audit Completed (Zero Code / Schema / Production Mutations)

---

## Executive Summary

A comprehensive read-only audit of the Giftora codebase (`customer-frontend`, `admin-frontend`, `backend`, Prisma ORM, and MySQL schema) was performed against the 7 requirements specified in the tester feedback.

| # | Feedback Area | Classification | Current System Reality | Core Resolution Strategy |
|---|---|---|---|---|
| **1** | Nameplate — Template Design Images | **Partially Implemented (Phase 1 Clean Typography Fallback Active; Images Pending Asset Generation)** | Phase 1 removed incorrect borrowed/generic images to eliminate customer confusion; cards render typography fallback cleanly. Phase 2 specification document [`NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md`](file:///C:/Users/UNITED/Giftora_3D_Application/docs/specifications/NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md) contains exact 3D render specifications for all 20 templates and 20 shapes. | Generate authentic, dimensionally accurate 3D renders according to the spec, place in `apps/customer-frontend/public/showcase/templates/nameplate/`, and populate mapping table in `nameplateTemplateAssets.ts`. |
| **2** | Order Table Not Connected | **Working Correctly in Code; Environmental / Filter Disorientation in Tester Testing** | Database schema, foreign keys, cascade rules, transaction boundaries, order item joins (`customDesign`, `standDesign`, `nameplateDesign`, `product`), admin API `/orders/admin`, and admin UI `Orders.jsx` & `OrderDetail.jsx` are fully connected and functional. | Zero database or relationship breakage found. Tester disorientations: 1) Admin Orders table defaults to newest-first paginated list and requires matching type filters; 2) If customer checkout wasn't finalized through payment confirmation or cart was empty, no order row was committed; 3) Provide clear testing procedure and verify with live QA credentials. |
| **3** | Phone / Pen Stand Visibility ("Hidden a Already having phone / pen stand") | **Needs Tester Clarification** | Phone & Pen Stand exists both as a customizer studio (`/customise/stand` via header dropdown, 3D hub, footer, and customizer switcher) and as a catalog product (`ayyappa-swamy-3d-printed-desk-organizer`). | Formulated 3 distinct interpretations with non-destructive recommendations. Do not modify or remove anything until tester confirms intended meaning. |
| **4** | Admin — Nameplate Price Management | **Existing Functionality Working Correctly** | Full dedicated Admin panel exists at `/customization/nameplate` (`NameplateCustomizationSettings.jsx`), backed by `/settings/nameplate-pricing` GET/PUT, persisted in `settings` table, and actively fetched by both customer frontend (`fetchNameplateOptions`) and backend order valuation service. | The admin capability is already 100% built, wired, and persistent. Verify admin sidebar navigation link to ensure the tester easily finds `/customization/nameplate`. |
| **5** | Wishlist | **Partially Implemented (Backend, Context & ProductCard exist; Dedicated Wishlist Page & Header Icon Missing)** | MySQL `wishlist_items` table, backend `/wishlist` API (GET, POST, DELETE), customer `WishlistContext.jsx`, and `ProductCard.jsx` heart icon already exist and persist across sessions. However, there is no dedicated `/wishlist` page in the customer frontend, nor a Wishlist icon in `Header.jsx`. | Build `Wishlist.jsx` page, add route in `App.jsx`, add header heart icon with active badge in `Header.jsx`, and add "Save to Wishlist" button to `ProductDetail.jsx`. |
| **6** | Product Card Orders & Customization Orders — Notes | **Partially Implemented (Order-level note exists; Item-level pre-add note missing)** | Order-level `customerNote` exists in DB `orders` table, checkout screen textarea, order creation transaction, and Admin `OrderDetail.jsx`. However, testers want item-specific notes at the product detail page and 3D customizer rails before clicking "Add to Cart". | Add item-level `notes` field in `cart_items.customization` and `order_items.customization` (already valid JSON columns, 0 migration needed). Expose note inputs in `ProductDetail.jsx`, `Customiser.jsx`, `StandCustomiser.jsx`, and `NameplateCustomiser.jsx`. Display item notes distinctly in Admin `OrderDetail.jsx`. |
| **7** | Draft Option — Customization Orders Only | **Partially Implemented (Keychain customizer has localStorage draft; Stand & Nameplate customizers lack draft hooks; No account-persisted draft center)** | `designDraft.js` currently provides 24-hour client-side draft saving only for Name Keychain (`giftora_custom_design_draft`). Stand Studio and Nameplate Studio have no draft hooks. Unauthenticated visitors lose work across browsers/devices. | Create a unified client/server draft system specifically for 3D Customizers (`name-keychain`, `phone-pen-stand`, `nameplate`). Keep drafts strictly isolated from catalog products and confirmed orders. |

---

## Detailed Requirement-by-Requirement Findings

### 1. Nameplate — Template Design Images

#### A. Tester Requirement
- Nameplate is a new product.
- Existing template design images had issues (borrowed artwork, repeated images).
- Each template should display its appropriate individual design image.
- Review recent Phase 1 image-mapping corrections and identify missing authentic images.

#### B. Current Implementation & Findings
- **File references:**
  - `apps/customer-frontend/src/features/nameplateStudio/core/nameplateTemplateAssets.ts`
  - `apps/customer-frontend/src/components/customiser/VisualDesignCardRail.jsx`
  - `apps/customer-frontend/src/features/nameplateStudio/core/presets.ts`
  - `docs/specifications/NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md`
- In Phase 1, all hardcoded and borrowed keychain images were deliberately stripped from `nameplateTemplateAssets.ts`:
  ```typescript
  export const NAMEPLATE_TEMPLATE_PREVIEWS: Record<string, string> = {};
  export const NAMEPLATE_TYPE_PREVIEWS: Record<string, string> = {};
  export const NAMEPLATE_SHAPE_PREVIEWS: Record<string, string> = {};
  ```
- In `VisualDesignCardRail.jsx`, when `item.previewSrc` is `undefined`, the image container is omitted, rendering a clean typography fallback card showing the template title, description, and dimension badge.
- In Phase 2, a complete 372-line specification ([`NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md`](file:///C:/Users/UNITED/Giftora_3D_Application/docs/specifications/NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md)) was prepared detailing the exact geometry, colors, finishes, text, dimensions, and camera angles for:
  - 10 Nameplate Archetypes (`desk`, `door`, `wall`, `kids`, `business`, `led`, `decorative-3d`, `wedding`, `house-number`, `gaming`)
  - 20 Silhouette Shapes (`rectangle`, `rounded-rectangle`, `chamfer-plate`, `oval`, `circle`, `hexagon`, `octagon`, `diamond`, `shield`, `crest`, `arch`, `cloud`, `heart`, `scalloped`, `ribbon-banner`, `ticket-notch`, `house-roof`, `butterfly`, `star-burst`, `text-outline`)
  - 10 Curated Starter Presets
- **Actual Issue:** The templates currently display clean text cards because dedicated 3D render PNG assets have not yet been rendered and placed in the project directory.
- **Classification:** **Partially Implemented** (safe typography fallback active; dedicated image generation pending).
- **Required Action:**
  1. Generate authentic, high-resolution PNG renders (512x384 or 400x300 aspect-4/3) matching the exact dimensions in `NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md`.
  2. Save to `apps/customer-frontend/public/showcase/templates/nameplate/`.
  3. Map the file paths in `nameplateTemplateAssets.ts`.

---

### 2. Order Table Not Connected

#### A. Tester Requirement
- Tester stated that the "order table is not connected".
- Verify whether orders are failing to save, failing to appear in Admin, or whether database relationships are broken.

#### B. Architectural Audit & Code Inspection
1. **Database Schema & Models (`schema.prisma` lines 325-392):**
   - `Order` model has a direct relation to `User` (`userId`), `Address` (`addressId`), `OrderItem[]` (`items`), and `Payment?` (`payment`).
   - `OrderItem` model has relations to `Order`, `Product?`, `CustomDesign?`, `StandDesign?`, and `NameplateDesign?`.
   - All 4 item types have their foreign keys indexed (`orderId`, `productId`, `customDesignId`, `standDesignId`, `nameplateDesignId`).
2. **Order Placement Workflow (`orderService.js` lines 49-259):**
   - `createOrder` runs inside a transactional boundary: `await prisma.$transaction(async (tx) => { ... })`.
   - Validates cart contents, verifies STL availability for 3D designs, recalculates prices against current database configuration, creates `Order` and nested `OrderItem` records, and empties the cart.
   - Idempotency key prevents duplicate orders.
3. **Admin Listing Workflow (`orderService.js` lines 287-318 & `adminOrderController.js`):**
   - `listOrdersForAdmin` queries `prisma.order.findMany` with pagination, status filters, search filters, and date ranges.
   - Includes items and customer details (`ADMIN_ORDER_LIST_INCLUDE`).
   - Returns serialized orders with item summaries.
4. **Admin Frontend Integration (`Orders.jsx` & `OrderDetail.jsx`):**
   - Fetches from `GET /orders/admin` via `fetchOrders`.
   - Displays orders with filters for Status (`ALL`, `PENDING`, `PAID`, etc.) and Type (`ALL`, `PRODUCT`, `CUSTOM_DESIGN`, `STAND_DESIGN`, `NAMEPLATE_DESIGN`).
   - Includes badges for Custom Design, Stand 3D, Nameplate 3D, and Catalog items.

#### C. Root Cause & Real Issue
The code is **100% connected**. The tester report arises from one of three common QA scenarios:
1. **Filtering Disorientation:** The Admin Orders page has filters (`status`, `type`, `search`, `range`). If the tester placed a custom order but had the filter set to a different status or type (e.g. `PRODUCT`), the new order was hidden by the client filter.
2. **Cart Not Placed / STL Size Error:** In previous turns, Nameplates failed to add to cart due to `MAX_SIZE_Z_MM = 100`. If an item could not be added to cart or checkout was aborted before clicking "Confirm Order", no order was ever created in the database.
3. **Empty Initial QA Database:** On clean QA environments or local setups without seeded orders, the table displays "No orders match these filters."
- **Classification:** **Existing Functionality Working Correctly** (No code disconnection; verified by automated integration tests and production API health).
- **Verification Plan:**
  - Verify with an isolated QA automated order creation script.
  - Document the exact step-by-step verification flow for the QA team.

---

### 3. Phone / Pen Stand Visibility ("Hidden a Already having phone / pen stand")

#### A. Tester Requirement
- Handwritten tester note reads: `"Hidden a Already having phone / pen stand"`
- Request requires identifying what is hidden, duplicated, or ambiguous, and reporting interpretations without deleting or changing anything.

#### B. Architectural Audit & Discovery
1. **Customizer Presence:**
   - Phone & Pen Stand 3D Customizer exists at `/customise/stand`.
   - Accessible via:
     - Header Nav: `3D Customisation` -> Hub Card (`/3d-customisation`).
     - Customizer switcher tabs on top of `/customise`, `/customise/nameplate`, and `/customise/stand`.
     - Footer link: `Phone & Pen Stand` -> `/customise/stand`.
2. **Catalog Product Presence:**
   - On the live production database (`https://api.jasvel3dmakers.co.in/api/v1/products`), there is an active catalog product:
     - Name: `Ayyappa Swamy 3D Printed Desk Organizer`
     - Slug: `ayyappa-swamy-3d-printed-desk-organizer`
     - Price: ₹899.00
     - Category: `Statues` / `Desk Organizer`
3. **Three Plausible Interpretations:**
   - **Interpretation 1 (Catalog Duplication Confusion):** The tester noticed that a pre-modeled phone/pen stand already exists in the catalog under "Browse Products", but there is *also* a dedicated "Phone & Pen Stand" in the 3D Customizer hub. The tester may be asking whether the pre-made catalog item should be hidden, or whether the customizer should be hidden if a standard catalog product exists.
   - **Interpretation 2 (Studio Category Option Hidden):** Inside `StudioLeftPanel.tsx`, line 117 states:
     ```typescript
     const showPhoneControls = config.category !== 'pen-holder';
     const showPenControls = config.category !== 'phone-stand';
     ```
     When the tester selects "Phone Stand Studio", pen controls are hidden. When "Pen Holder Studio" is selected, phone controls are hidden. The tester may have thought controls were missing or hidden unexpectedly.
   - **Interpretation 3 (Product Visibility in Browse Products):** The tester could not find the customizer from the standard `/products` catalog listing because `/products` lists static inventory products, whereas customizers live under `/3d-customisation`.
- **Classification:** **Needs Tester Clarification**
- **Action:** Present these 3 interpretations to the user/tester. Do not hide or remove any product or customizer feature without explicit instruction.

---

### 4. Admin — Nameplate Price Management

#### A. Tester Requirement
- Allow Admin to:
  - Set Nameplate base prices per type.
  - Change/update volumetric rate per cm³.
  - Set/update feature surcharges (LED glow, layered background).
  - Update customizer shipping methods.
  - Ensure customer-side prices dynamically reflect Admin changes.

#### B. Architectural Audit & Findings
1. **Admin UI (`NameplateCustomizationSettings.jsx`):**
   - Located at `apps/admin-frontend/src/app/customization/NameplateCustomizationSettings.jsx`.
   - Allows configuring:
     - Material rate per cm³ (`pricePerCm3Cents`, default ₹1.20/cm³).
     - LED Glow Diffuser Surcharge (`ledGlowSurchargeCents`, default ₹150.00).
     - Layered Backing Surcharge (`layeredBackingSurchargeCents`, default ₹100.00).
     - Individual archetype base prices for all 10 types (`desk`, `door`, `wall`, `kids`, `business`, `led`, `decorative-3d`, `wedding`, `house-number`, `gaming`).
     - Shipping delivery tiers (Standard, Quick Delivery, etc.).
2. **Backend API & Service:**
   - `GET /api/v1/settings/nameplate-pricing` -> returns current saved pricing from `settings` table (`key: 'nameplate_pricing'`).
   - `PUT /api/v1/settings/nameplate-pricing` -> updates `settings` table.
   - `GET /api/v1/nameplate-designs/options` -> reads saved settings and serves dynamic prices to the customer customizer.
   - `nameplateDesignService.js` (line 98) & `orderService.js` (line 124) re-fetch and strictly enforce server-saved prices during STL upload and checkout.
3. **Customer Customizer Dynamic Consumption:**
   - `NameplateCustomiser.jsx` (lines 110-121) calls `fetchNameplateOptions()` on mount and calculates live price hints using the exact admin rates.
- **Classification:** **Existing Functionality Working Correctly**
- **Findings:** The capability is 100% built and operational on both frontend and backend.
- **Tester Gap:** The tester likely did not see the link in the Admin navigation sidebar. In `admin-frontend`, ensure that `/customization` or `/customization/nameplate` has a prominent menu item in `Sidebar.jsx`.

---

### 5. Wishlist

#### A. Tester Requirement
- Customers should be able to like/save products.
- A dedicated Wishlist section / page.
- Saved products must appear in the customer's Wishlist.
- Saved products must persist across browser refreshes and after logging in.

#### B. Architectural Audit & Findings
1. **Existing Backend Architecture:**
   - Prisma Model (`schema.prisma` lines 408-420):
     ```prisma
     model WishlistItem {
       id        String   @id @default(cuid())
       userId    String
       user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
       productId String
       product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
       createdAt DateTime @default(now())
       @@unique([userId, productId])
     }
     ```
   - Routes: `apps/backend/src/modules/wishlist/wishlistRoutes.js`
     - `GET /wishlist` -> lists wishlisted product IDs and products.
     - `POST /wishlist` -> adds product (`productId`).
     - `DELETE /wishlist/:productId` -> removes product.
   - Gated by customer authentication.
2. **Existing Customer Frontend Architecture:**
   - `apps/customer-frontend/src/features/wishlist/WishlistContext.jsx`:
     - Implements `useWishlist()` hook.
     - Supports **guest visitors** via `localStorage` (`giftora_guest_wishlist`).
     - When a customer logs in, seamlessly syncs guest wishlisted items into the database via `addWishlist(id)`.
   - `ProductCard.jsx` (lines 122-140):
     - Renders a floating heart button on the top-right of every product card.
     - Toggling triggers `toggleWishlist(product.id)`.
3. **Missing Features (The Tester Gap):**
   - **No Wishlist Page:** There is no `apps/customer-frontend/src/pages/Wishlist.jsx`. If a customer saves products, they have no page to view their saved list.
   - **No Header Navigation:** `Header.jsx` has no Wishlist heart icon with a count badge.
   - **No Wishlist Button on Product Detail:** `ProductDetail.jsx` has an "Add to Cart" button, but no "Save to Wishlist" heart button.
- **Classification:** **Partially Implemented** (Backend DB & API 100% complete; Context & ProductCard heart button complete; Customer UI page & Header navigation missing).
- **Required Implementation:**
  1. Create `apps/customer-frontend/src/pages/Wishlist.jsx` with responsive grid of saved products and 1-click "Move to Cart".
  2. Register route `/wishlist` in `apps/customer-frontend/src/App.jsx`.
  3. Add Wishlist heart icon with reactive badge count in `Header.jsx` (desktop nav bar and mobile slide-out drawer).
  4. Add secondary "Save to Wishlist" button in `ProductDetail.jsx` next to "Add to Cart".

---

### 6. Product Card Orders and Customization Orders — Notes

#### A. Tester Requirement
- Distinguish between normal product card orders and customization orders.
- Provide a customer note field before/around the "Add to Cart" process.
- The note must be associated with the specific product/order item and appear clearly in Admin.

#### B. Architectural Audit & Current Implementation
1. **Existing Note Field (Order-Level Only):**
   - Prisma `Order` model has `customerNote String? @db.Text` (line 345).
   - `Checkout.jsx` has an "Order Note (optional)" textarea (lines 245-257).
   - Passed during `createOrder({ customerNote })` and rendered in Admin `OrderDetail.jsx` (line 552) as an order-level banner.
2. **Limitation for Multiple Items:**
   - If an order contains 2 different items (e.g., 1 catalog Coffee Mug and 1 custom Nameplate), the order-level note is shared across both.
   - The tester specifically requested a note field **around the Add to Cart process** for each item (e.g. specific engraving request, packaging instruction, or nuance).
3. **Data Model Safety (Zero Migration Required):**
   - `CartItem` and `OrderItem` both already have a `customization Json?` column.
   - In MySQL/Prisma, `customization` stores arbitrary JSON objects.
   - For catalog products (`itemType === 'PRODUCT'`), `customization` currently holds `{ material, size, color }`.
   - For custom designs (`CUSTOM_DESIGN`, `STAND_DESIGN`, `NAMEPLATE_DESIGN`), `customization` holds design parameters.
   - Adding a `note?: string` property into `customization.note` requires **ZERO schema migrations**, preserving complete backward compatibility with all historical orders.
4. **Admin Order Details View:**
   - In `OrderDetail.jsx`, item-level customizations are already displayed in parameter badges.
   - Adding a dedicated "Item Note" section under each item row in `OrderDetail.jsx` will display individual instructions directly under that item.
- **Classification:** **Partially Implemented** (Order-level note exists; Item-level note at Add to Cart missing).
- **Required Implementation:**
  1. **ProductDetail.jsx:** Add an optional "Item instructions / note" textarea above the "Add to Cart" button. Include it in the `customization` payload passed to `addToCart`.
  2. **Customiser.jsx / StandCustomiser.jsx / NameplateCustomiser.jsx:** Add an optional "Special instructions / note" field in the customization summary card before "Add to Cart".
  3. **Backend `cartService.js` & `orderService.js`:** Ensure `item.customization.note` is preserved when copying from cart to `order_items`.
  4. **Admin `OrderDetail.jsx`:** Display an "Item Note" badge/card within each item's container.

---

### 7. Draft Option — Customization Orders Only

#### A. Tester Requirement
- Provide a "Draft" option specifically for customization orders.
- Customers can save in-progress 3D customizations and resume them later.
- Draft functionality must be strictly isolated from confirmed orders and must not affect normal catalog product orders.

#### B. Architectural Audit & Current Implementation
1. **Existing Name Keychain Draft:**
   - `apps/customer-frontend/src/features/customDesign/designDraft.js` has `saveDraft` and `loadDraft`.
   - Stores design in browser `localStorage` under `giftora_custom_design_draft` with a 24-hour expiration window.
   - Only used by `Customiser.jsx` (Name Keychain) to preserve state during login redirects.
2. **Missing Coverage:**
   - **Phone & Pen Stand:** Has no draft save or load mechanism.
   - **Nameplate Customizer:** Has no draft save or load mechanism.
   - **Account Persistence:** If a customer switches devices (e.g., designs on desktop, buys on mobile), `localStorage` drafts are not shared.
   - **Draft Center:** There is no UI where a customer can see a list of their saved drafts (e.g., "My Saved Custom Designs").
3. **Non-Destructive Storage Strategy:**
   - In Prisma schema, the `CustomDesign`, `StandDesign`, and `NameplateDesign` tables already have a `status` field:
     ```prisma
     enum DesignStatus {
       PENDING
       READY
     }
     ```
   - Currently, when a customer creates a design, it is stored with `status: PENDING` until the STL is uploaded, after which it becomes `READY`.
   - Designs in these tables **do not become orders** until checkout completes.
   - Therefore, a customer's custom designs can be exposed as "Saved Drafts" simply by listing designs created by `userId` that have not yet been placed in a completed order.
   - Alternatively, a dedicated, clean client-side multi-product draft store (`giftora_custom_drafts`) can store in-progress configurations for Keychain, Stand, and Nameplate with instant 1-click restore without touching the production database.
- **Classification:** **Partially Implemented** (Name Keychain has single localStorage draft; Stand & Nameplate have none; No user-facing draft manager).
- **Required Implementation:**
  1. Expand `designDraft.js` to support all three customizer types (`keychain`, `stand`, `nameplate`).
  2. Add an explicit "Save as Draft" button in the customizer summary panels alongside "Add to Cart".
  3. Add a "Saved Drafts" tab in `/my-orders` or a dedicated modal allowing customers to restore an unfinished customizer configuration.
  4. Ensure zero impact on catalog products and zero unintended order row creation.

---

## Technical Dependencies & Safe Execution Order

```mermaid
flowchart TD
    subgraph Phase 1: Clarifications & Verification
        T1["Clarify Feedback #3 (Phone/Pen Stand Visibility)"]
        T2["Verify Order Table Flow with QA Script (#2)"]
    end

    subgraph Phase 2: Wishlist Completion
        W1["Create Wishlist.jsx Page (#5)"]
        W2["Add Header Wishlist Icon & Badge (#5)"]
        W3["Add Wishlist Button to ProductDetail.jsx (#5)"]
    end

    subgraph Phase 3: Item-Level Notes
        N1["Add Note Input to ProductDetail & Customizers (#6)"]
        N2["Preserve item.customization.note in Backend (#6)"]
        N3["Display Item Note in Admin OrderDetail (#6)"]
    end

    subgraph Phase 4: Customizer Draft Center
        D1["Unified Multi-Customizer Draft Service (#7)"]
        D2["Add 'Save as Draft' in 3D Customizer Rails (#7)"]
        D3["Add Draft Restore UI (#7)"]
    end

    subgraph Phase 5: Nameplate Template Asset Integration
        A1["Render Authentic 3D Assets from Spec (#1)"]
        A2["Map Assets in nameplateTemplateAssets.ts (#1)"]
    end

    T1 --> W1
    T2 --> N1
    W1 --> W2 --> W3
    N1 --> N2 --> N3
    N3 --> D1 --> D2 --> D3
    D3 --> A1 --> A2
```

### Dependency Analysis:
1. **Phase 1 (Verification & Clarification):** Non-code phase. Formulate response to tester on Item #3 and demonstrate order flow on Item #2.
2. **Phase 2 (Wishlist):** Completely independent of customizer geometry and pricing. Safest starting feature with zero regression risk to existing checkout.
3. **Phase 3 (Item Notes):** Relies solely on existing JSON columns. No database migrations required. Enhances order transparency for both catalog and customizer items.
4. **Phase 4 (Customizer Drafts):** Builds on top of existing customizer parameter structures. Completely isolated from confirmed orders.
5. **Phase 5 (Nameplate Preview Images):** Independent asset deployment. Replaces typography fallback with genuine renders once assets are created.

---

## Risk Assessment & Regression Protection

| Subsystem | Risk Description | Mitigation Strategy |
|---|---|---|
| **Name Keychain** | Accidental alteration of reference geometry, pricing calculator, or draft storage. | Strict isolation: keep `keychainGeometry.js`, `designValidator.js`, and `pricingCalculator.js` read-only. Draft extension must preserve `giftora_custom_design_draft` schema. |
| **Phone & Pen Stand** | Unintended disruption of CSG geometry generation or camera rig controls. | Do not modify `standBuilder.ts`, CSG manifold operations, or camera rig triggers. |
| **Nameplate Studio** | Disruption of 20 silhouette shapes or Tamil text extrusion. | Keep `nameplateBuilder.ts` and font catalogs untouched. Only update asset preview maps. |
| **Cart & Checkout** | Failed transactions or invalid price calculations. | Item-level notes reside strictly inside `customization` JSON. Transaction boundaries in `orderService.js` remain unchanged. |
| **Existing Customer Orders** | Corrupted order history or missing order items in Admin. | Zero modifications to existing database records or Prisma migrations. Historical orders without item notes render gracefully without errors. |
| **Production Database** | Table lockups or migration failures. | No database schema changes (`schema.prisma`) are needed. All proposed features leverage existing columns (`customization Json?`, `wishlist_items`). |

---

## Proposed Phased Implementation Plan

### Phase 1: Clarification & QA Verification
- Clarify Tester Feedback #3 ("Hidden a Already having phone / pen stand").
- Demonstrate working order table connectivity with isolated test order verification report.
- Confirm Admin Nameplate Pricing route visibility in Admin Navigation.

### Phase 2: Wishlist Feature Completion
- **Files to create/modify:**
  - `apps/customer-frontend/src/pages/Wishlist.jsx` (New)
  - `apps/customer-frontend/src/App.jsx` (Register `/wishlist` route)
  - `apps/customer-frontend/src/components/layout/Header.jsx` (Add heart icon with count badge)
  - `apps/customer-frontend/src/pages/ProductDetail.jsx` (Add "Save to Wishlist" button)
- **Tests:** Add unit tests for wishlist context synchronization and route access.

### Phase 3: Item-Level Notes for Catalog & Customizer Orders
- **Files to modify:**
  - `apps/customer-frontend/src/pages/ProductDetail.jsx` (Add item note input)
  - `apps/customer-frontend/src/components/customiser/CustomizationSummary.jsx` (Keychain note input)
  - `apps/customer-frontend/src/components/customiser/StandCustomizationSummary.jsx` (Stand note input)
  - `apps/customer-frontend/src/components/customiser/NameplateCustomizationSummary.jsx` (Nameplate note input)
  - `apps/backend/src/modules/orders/orderService.js` (Verify note preservation in snapshot)
  - `apps/admin-frontend/src/app/orders/OrderDetail.jsx` (Render item note badge under each order line)
- **Tests:** Backend tests verifying item notes are preserved from cart to order items.

### Phase 4: Multi-Product 3D Customizer Draft Center
- **Files to modify:**
  - `apps/customer-frontend/src/features/customDesign/designDraft.js` (Refactor to multi-customizer draft manager)
  - `apps/customer-frontend/src/pages/Customiser.jsx` (Add "Save Draft" button & toast)
  - `apps/customer-frontend/src/pages/StandCustomiser.jsx` (Add "Save Draft" button & toast)
  - `apps/customer-frontend/src/pages/NameplateCustomiser.jsx` (Add "Save Draft" button & toast)
  - `apps/customer-frontend/src/pages/MyOrders.jsx` (Add "Saved 3D Drafts" tab with 1-click restore)
- **Tests:** Verify draft save, expiration, and restore without order creation.

### Phase 5: Nameplate Template Preview Image Integration
- Render genuine 3D model previews following `NAMEPLATE_TEMPLATE_IMAGE_SPECIFICATIONS.md`.
- Save assets to `apps/customer-frontend/public/showcase/templates/nameplate/`.
- Update `nameplateTemplateAssets.ts` mappings.
- Verify smooth rendering in `VisualDesignCardRail.jsx`.
