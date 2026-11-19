# 18-Step Product Integration Blueprint for Future 3D Customisers

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Purpose:** Reusable Step-by-Step Architectural Implementation Guide  
**Status:** `VERIFIED` & `PRODUCTION_ACTIVE`  

---

## 1. Overview & Architectural Principles

When integrating a new 3D customisable product into Giftora, follow this strict 18-step sequence. It ensures that the product adheres to Giftora's luxury design system, maintains server-authoritative financial integrity, and integrates with the shared polymorphic cart and checkout systems without breaking existing products.

```mermaid
flowchart TD
    subgraph Phase 1: Product Specification & Modeling
        S1["Step 1: Taxonomy & Catalog"] --> S2["Step 2: JSON Schema & Zod"]
        S2 --> S3["Step 3: Prisma Schema & DB Migration"]
    end

    subgraph Phase 2: Client 3D Engine & UI
        S4["Step 4: 3D Geometry Builder"] --> S5["Step 5: Canvas Viewport & Camera"]
        S5 --> S6["Step 6: Slicing Preflight & Validation"]
        S6 --> S7["Step 7: UI & Two-Column Layout Alignment"]
    end

    subgraph Phase 3: Backend & Storage Pipeline
        S8["Step 8: STL Exporter & SHA-256 Checksum"] --> S9["Step 9: Backend Routes & Controller"]
        S9 --> S10["Step 10: Server Input Canonicalizer"]
        S10 --> S11["Step 11: Storage Driver Integration"]
        S11 --> S12["Step 12: Server Pricing Calculator"]
    end

    subgraph Phase 4: E-Commerce Integration
        S13["Step 13: Cart Item Polymorphism"] --> S14["Step 14: Transactional Checkout Guard"]
        S14 --> S15["Step 15: Shipping Matrix Bridge"]
    end

    subgraph Phase 5: Admin & Deployment
        S16["Step 16: Admin Studio Panel"] --> S17["Step 17: Admin Order Fulfillment & Downloads"]
        S17 --> S18["Step 18: Multi-Environment E2E Verification"]
    end

    Phase 1 --> Phase 2 --> Phase 3 --> Phase 4 --> Phase 5
```

---

## 2. Phase 1 — Product Specification & Data Modeling

### Step 1: Product Taxonomy & Catalog Registration
- Define the product slug (e.g. `desk-clock`, `coaster-set`).
- Add the product metadata into `apps/customer-frontend/src/features/customisation/customisationProducts.js` and `apps/admin-frontend/src/features/customization/customizationProducts.js`.
- Provide high-resolution WebP badge renders and localized descriptions.

### Step 2: Parametric Configuration Schema (TypeScript / Zod)
- Define a strict TypeScript interface and Zod schema representing the complete configuration state.
- Group parameters into logical domains:
  ```typescript
  interface ProductConfig {
    version: number;
    dimensions: { widthMm: number; heightMm: number; depthMm: number };
    options: { styleId: string; variantId: string };
    personalization?: { text: string; fontId: string };
    appearance: { finish: string; colors: { base: string; accent?: string } };
  }
  ```

### Step 3: Prisma Schema Extension & DB Migration
1. In `apps/backend/prisma/schema.prisma`:
   - Create a dedicated model `[Product]Design` with columns: `id`, `userId`, `schemaVersion`, `title`, `designConfig` (Json), `paramsHash`, `unitPriceCents`, `status`, `stlKey`, `stlSha256`, `stlSizeBytes`, `previewKey`.
   - Add foreign keys on `CartItem` and `OrderItem`:
     ```prisma
     model CartItem {
       ...
       newProductDesignId String?
       newProductDesign   NewProductDesign? @relation(fields: [newProductDesignId], references: [id], onDelete: Restrict)
     }
     ```
   - Add the new value to the `OrderItemType` enum:
     ```prisma
     enum OrderItemType {
       PRODUCT
       CUSTOM_DESIGN
       STAND_DESIGN
       NEW_PRODUCT_DESIGN
     }
     ```
2. Run database migration:
   ```bash
   npx prisma migrate dev --name add_new_product_design
   ```

---

## 3. Phase 2 — Client-Side 3D Geometry Engine & Viewport

### Step 4: Geometry Engine Selection & Builder
- **Choose Geometry Kernel:**
  - *Manifold-3D WASM:* Choose if the product relies on complex 2D vector font extrusions and arbitrary CSG boolean unions/subtractions.
  - *Three.js Parametric Solid Builder:* Choose if the product is an assembly of parametric primitives, chamfered boxes, cylinders, and structural panels.
- Isolate the builder in `features/<product>/geometry/<product>Builder.ts`. Ensure it returns clean buffer geometries.

### Step 5: Viewport Canvas & Camera Controls
- Create `features/<product>/components/<Product>Canvas.tsx`.
- Configure Three.js Scene, Directional / Hemisphere lights, Ambient occlusion, and OrbitControls.
- Implement a standard `ViewportControlsBar.tsx` with Isometric, Front, Top, and Side view presets.

### Step 6: Slicing Preflight & Geometric Boundary Checks
- Create `features/<product>/validation/preflight.ts`.
- Enforce:
  - Minimum wall thickness $\ge 2.0\text{ mm}$.
  - Overhang angles $\le 60^\circ$ from vertical.
  - Maximum dimensions within slicing bed: $220 \times 220 \times 250\text{ mm}$.
  - Reject floating geometry islands.

### Step 7: UI & Two-Column Layout Alignment
- Build the customiser page in `apps/customer-frontend/src/pages/<Product>Customiser.jsx`.
- Strict layout rule:
  - 2-column desktop layout (`#0D0D0D` background, `#1A1A1A` cards, `#D9AE4E` gold accents).
  - Right column: Sticky 3D canvas viewport.
  - Left column: Scrollable parameter controls, ending with the live Specification & Shipping Summary card.

---

## 4. Phase 3 — Backend Processing & Storage Pipeline

### Step 8: STL Exporter & SHA-256 Checksum
- On the client, serialize the completed 3D mesh into a standard binary STL `ArrayBuffer` via Three.js `STLExporter`.
- Compute client-side SHA-256 hash using Web Crypto API (`crypto.subtle.digest('SHA-256', buffer)`).

### Step 9: Backend API Routes & Controller
- Create `apps/backend/src/modules/<product>/<product>Routes.js`:
  - `GET /api/v1/<product>-designer/options`: Public options and presets.
  - `POST /api/v1/<product>-designs`: Create design record.
  - `PUT /api/v1/<product>-designs/:id/stl`: Upload and verify binary STL.
  - `PUT /api/v1/<product>-designs/:id/preview`: Upload PNG preview.

### Step 10: Server Input Canonicalizer & Params Hash
- Create `apps/backend/src/modules/<product>/<product>Validator.js`.
- Canonicalize input JSON keys and sort properties deterministically.
- Generate canonical SHA-256 `paramsHash` to enable zero-duplication design deduplication.

### Step 11: Storage Driver Integration
- In `storeStl()`, write the validated binary buffer using the storage driver:
  ```javascript
  const key = `${productPrefix}/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })
  ```

### Step 12: Server-Authoritative Pricing Calculator
- Implement pricing logic in `apps/backend/src/modules/<product>/<product>Pricing.js`.
- Rule: **Never trust client-reported prices.** Derive price entirely from server-measured volume (`computeSignedVolumeCm3`) or validated discrete options + character counts.

---

## 5. Phase 4 — E-Commerce, Cart & Checkout Integration

### Step 13: Cart Item Polymorphism
- In `apps/backend/src/modules/cart/cartService.js`:
  - Add `addNewProductItem(userId, { designId, quantity, shippingMethod })`.
  - Enforce `design.status === 'READY'`.
  - Re-verify price against server config before inserting into `cart_items`.

### Step 14: Transactional Checkout Guard
- In `apps/backend/src/modules/orders/orderService.js`:
  - In `createOrder()`, add an availability check ensuring the design's STL exists in storage.
  - Add price recalculation logic in the transactional loop. If live pricing settings have changed, reject with `409 Conflict` to prevent silent mischarges.
  - In `tx.order.create()`, populate `order_items` with `newProductDesignId` and an immutable configuration snapshot.

### Step 15: Shipping Matrix Bridge
- Ensure shipping options integrate with `resolveShippingMethod()`.
- Add interactive shipping selection to the customiser summary so shipping totals display dynamically to the customer.

---

## 6. Phase 5 — Admin Back-Office & Production Deployment

### Step 16: Admin Studio Management UI
- Create `apps/admin-frontend/src/app/customization/<Product>CustomizationSettings.jsx`.
- Register the route in `apps/admin-frontend/src/App.jsx` and add the navigation card to `CustomizationHub.jsx`.
- Include pricing controls and the integrated `ShippingManager`.

### Step 17: Admin Order Fulfillment & Manufacturing Downloads
- In `apps/admin-frontend/src/app/orders/OrderDetail.jsx`:
  - Add specification parsing helper (`specsFor<Product>()`).
  - Wire the STL / 3MF download button to `fetchOrderItemStlBlob()`.
- In `apps/backend/src/modules/orders/adminOrderController.js`:
  - Route download requests to `getStlFor<Product>OrderItem()`.

### Step 18: Multi-Environment E2E Verification
- Execute automated unit and integration tests.
- Verify live production behavior:
  1. Design creation & 3D canvas manipulation.
  2. STL binary generation and SHA-256 checksum verification.
  3. Dynamic shipping selection and price calculation.
  4. Cart persistence across sessions.
  5. Checkout completion and order creation.
  6. Admin price editing and verified reflection in customer studio.
  7. Admin STL download verification in slicer software (Bambu Studio / PrusaSlicer).
