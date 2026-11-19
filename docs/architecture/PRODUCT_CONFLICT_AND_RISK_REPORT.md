# Product Conflict, Risk & Vulnerability Audit Report

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Scope:** Cross-Product Architectural Conflict Analysis & Defensive Mitigations  
**Status:** `VERIFIED` & `PRODUCTION_ACTIVE`  

---

## 1. Executive Summary

As a multi-product 3D customisation platform, Giftora combines high-performance WebGL/WASM geometry generation with financial transactions and physical manufacturing pipelines. This report identifies architectural failure modes, concurrency races, financial vulnerabilities, and file corruption risks, detailing verified mitigations implemented in the codebase.

---

## 2. Risk Matrix & Audit Findings

| Risk Category | Severity | Failure Mode | Root Cause | Verified Mitigation in Giftora |
| :--- | :--- | :--- | :--- | :--- |
| **1. Database Polymorphism** | `HIGH` | Corrupted cart/order line referencing multiple products or zero products. | Nullable foreign keys (`productId`, `customDesignId`, `standDesignId`) without strict mutual exclusivity. | **Enforced:** MySQL `CHECK` constraint + Prisma application validation ensuring exactly one foreign key is populated per row. |
| **2. Pricing Desync** | `CRITICAL` | Financial loss via client-side price spoofing or stale cart prices. | Client reporting arbitrary prices, or admin updating rates while items sit in user carts. | **Enforced:** Server strictly recalculates prices from stored geometry/volume at checkout (`orderService.js`). Rejects stale prices with `409 Conflict`. |
| **3. Volume Exploits** | `HIGH` | Artificially low price on volumetric models by uploading invalid geometry. | Slicer mesh with inverted normals or open holes producing negative/zero signed volume. | **Enforced:** `stlValidator.js` computes signed volume via divergence theorem. Enforces strict boundary: $1.0\text{ cm}^3 \le V \le 5000\text{ cm}^3$. Rejects non-closed shells. |
| **4. Concurrency Races** | `MEDIUM` | Duplicate design rows or duplicate order charges on rapid double-clicks. | Parallel HTTP requests with identical parameters racing database insertion. | **Enforced:** `@@unique([userId, paramsHash])` catches `P2002` race conditions. Orders use unique `idempotencyKey` inside Prisma `$transaction`. |
| **5. Storage Collisions** | `MEDIUM` | Overwriting existing customer files or malicious payload injection. | Non-deterministic storage keys or trusting client filenames. | **Enforced:** Content-addressed storage keys containing SHA-256 hash of file buffer (`uploads/[type]/[userId]/[designId]/[sha256].stl`). |
| **6. WebGL/WASM Leaks** | `MEDIUM` | Browser tab crash after repeated customisation steps. | Three.js geometries/textures or Manifold WASM heap pointers not disposed on unmount. | **Enforced:** Explicit `geometry.dispose()`, `material.dispose()`, and Web Worker termination on component unmount. |
| **7. Slicing Failures** | `HIGH` | 3D printer failure due to non-manifold geometry, zero-thickness walls, or floating text. | Untested user input (e.g. disjoint letters or microscopic walls). | **Enforced:** Client-side preflight verification (`preflight.js`, `validation.ts`) blocking cart addition until geometry passes manifoldness and envelope rules. |
| **8. Admin Settings Key Collision** | `LOW` | Overwriting global configuration when adding new customizer settings. | Shared generic `settings` key/value table. | **Enforced:** Strict namespacing for settings keys: `customizer_pricing` (Keychain), `stand-pricing` (Stand), `customizer_shipping` (Global). |

---

## 3. Deep-Dive Conflict Analysis & Defensive Architecture

### 3.1 Cart & Order Polymorphic FK Defense
In `schema.prisma`, both `CartItem` and `OrderItem` handle catalog products and custom designs simultaneously.
- **The Risk:** A bug or malicious API payload could insert a row with both `productId` and `standDesignId` populated, or neither.
- **Defensive Implementation:**
  ```sql
  -- MySQL Database Migration Level Check Constraint
  ALTER TABLE cart_items ADD CONSTRAINT chk_cart_item_mutually_exclusive
  CHECK (
    (CASE WHEN productId IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN customDesignId IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN standDesignId IS NOT NULL THEN 1 ELSE 0 END) = 1
  );
  ```
  In application services (`cartService.js`, `orderService.js`), inputs are defensively normalized to ensure mutual exclusivity.

### 3.2 Volume Pricing Exploits & Divergence Theorem Protection
For Product Model 2 (Phone & Pen Stand), a customer could attempt to tamper with the client-side JavaScript to send `volume: 0.1` for a large $300\text{ cm}^3$ organizer.
- **The Risk:** Undercharging by thousands of rupees.
- **Defensive Implementation (`standDesignService.js`):**
  1. The client-provided volume is discarded immediately.
  2. When the binary STL is received in `storeStl()`, the server executes:
     ```javascript
     const solidVolumeCm3 = computeSignedVolumeCm3(buffer)
     if (!(solidVolumeCm3 >= 1) || solidVolumeCm3 > 5000) {
       throw new HttpError(400, 'The model volume could not be measured reliably.')
     }
     ```
  3. The unit price is derived strictly from this measured server volume and current admin settings.

### 3.3 Transactional Checkout Pricing Lock (`orderService.js`)
If an admin updates filament pricing while a customer has an item in their cart:
- **The Risk:** The customer is charged an unexpected amount, or the company sells at a loss.
- **Defensive Implementation:**
  Inside `prisma.$transaction`, `orderService.js` recomputes every line item's price:
  ```javascript
  if (currentUnitPriceCents !== item.unitPriceCents) {
    priceChangedItems.push(item.customDesign?.title || item.standDesign?.title || item.product?.name)
  }
  if (priceChangedItems.length > 0) {
    throw new HttpError(409, `Prices have changed for: ${priceChangedItems.join(', ')}. Please refresh your cart.`)
  }
  ```

---

## 4. Operational & Infrastructure Risks

### 4.1 Storage Garbage Collection
- **Issue:** Abandoned custom designs that are never ordered leave orphaned STL files in storage.
- **Mitigation:**
  - All uploaded STLs have immutable content-addressed keys.
  - A scheduled maintenance job periodically purges `PENDING` designs older than 14 days that have no associated `cart_items` or `order_items`.

### 4.2 Multi-Worker PM2 Rate Limiting
- **Issue:** In-memory rate limiting fails across multi-core Node.js cluster processes.
- **Mitigation:**
  - Giftora uses persistent database rate limiting via the `auth_rate_limits` table in MySQL, ensuring uniform rate enforcement regardless of PM2 cluster worker distribution.
