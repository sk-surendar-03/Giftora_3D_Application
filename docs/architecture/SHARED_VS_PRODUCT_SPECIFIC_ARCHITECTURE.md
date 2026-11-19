# Shared vs Product-Specific Architecture Blueprint

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Scope:** Layer Separation, Module Boundaries, and Interface Contracts  
**Status:** `VERIFIED` & `PRODUCTION_ACTIVE`  

---

## 1. Architectural Layer Separation

To maintain system stability and allow new customisable products to be added rapidly without regressing existing features, Giftora enforces a strict separation between the **Shared Platform Layer** and the **Product-Specific Customizer Layer**.

```
+---------------------------------------------------------------------------------------+
|                                  SHARED PLATFORM LAYER                                |
|  User Auth (JWT/OTP)  |  Cart & Orders  |  Payments  |  Shipping  |  Storage  |  Admin UI |
+---------------------------------------------------------------------------------------+
            ^                                                               ^
            | (Interface Contracts)                                         | (Interface Contracts)
+-----------------------------------+             +-------------------------------------+
| PRODUCT LAYER 1: NAME KEYCHAIN    |             | PRODUCT LAYER 2: PHONE & PEN STAND  |
| - Route: /customise               |             | - Route: /customise/stand           |
| - Engine: Manifold-3D WASM CSG    |             | - Engine: Three.js Parametric Solid |
| - Pricing: Character-Count Driven |             | - Pricing: Volumetric cm³ Driven    |
| - Storage: custom_designs Table   |             | - Storage: stand_designs Table      |
| - Output: Base/Text STL + 3MF     |             | - Output: Monolithic Production STL |
+-----------------------------------+             +-------------------------------------+
```

---

## 2. Shared Platform Layer Responsibilities

The Shared Platform Layer is product-agnostic and provides the foundational infrastructure:

1. **Authentication & Session Security:**  
   - Handled via `apps/backend/src/modules/auth/`.
   - Supports 6-digit email OTP registration (`registration_otps` table) and stateless JWT sessions.
   - Enforces persistent Redis/MySQL rate limiting (`auth_rate_limits` table).

2. **Polymorphic Cart Subsystem:**  
   - Handled via `apps/backend/src/modules/cart/cartService.js`.
   - The `cart_items` table acts as a polymorphic container using `itemType: OrderItemType` (`PRODUCT`, `CUSTOM_DESIGN`, `STAND_DESIGN`).
   - Standardized quantity updates, removal, and item validation.

3. **Transactional Order Fulfillment:**  
   - Handled via `apps/backend/src/modules/orders/orderService.js`.
   - Atomically transitions cart items into immutable `order_items` records within a Prisma database transaction.
   - Idempotency key tracking prevents duplicate order submissions on network retries.
   - Performs a mandatory server-authoritative price re-verification guard before order commitment.

4. **Shipping & Delivery Matrix:**  
   - Reusable shipping configuration stored in the `settings` table (`customizer_shipping`).
   - Resolves delivery methods (Standard Delivery vs Quick Courier) server-side and injects safe cost records into cart and checkout lines.

5. **Storage Abstraction Driver:**  
   - Encapsulated in `apps/backend/src/modules/storage/storage.js`.
   - Implements a uniform API: `put(key, buffer, options)`, `get(key)`, `exists(key)`, `delete(key)`.
   - Supports local disk storage (`./uploads/`) in development and S3-compatible object storage in production.

6. **Admin Back-Office Harness:**  
   - `apps/admin-frontend/src/app/customization/CustomizationHub.jsx`: Central registry and routing hub for all studio managers.
   - `apps/admin-frontend/src/app/orders/OrderDetail.jsx`: Unified order inspector rendering manufacturing specs, shipping status, carrier tracking, and production asset downloads.

---

## 3. Product-Specific Customizer Layer Responsibilities

Each 3D customizer product is strictly encapsulated within its own module namespace across frontend and backend:

1. **Parametric Geometry Engine:**  
   - Owns the 3D mathematical transformation from configuration parameters to geometry.
   - Runs client-side in the browser to provide zero-latency interactive feedback.
   - Encapsulated in `features/<product>/geometry/`.

2. **Viewport & Camera Rig:**  
   - Owns the Three.js canvas, lighting setup (ambient, directional, rim lights), materials, shaders, and camera angle controls.
   - Encapsulated in `features/<product>/components/`.

3. **Domain State Management & Canonicalization:**  
   - Defines the exact shape of customer selections and serializes them into a normalized JSON payload.
   - Responsible for computing the deterministic `paramsHash`.

4. **Product-Specific Validation & Slicing Preflight:**  
   - Validates physical manufacturing rules (e.g. wall thicknesses, overhangs, minimum gap clearances, print bed envelopes).
   - Prevents unprintable designs from reaching the cart or database.

5. **Server-Authoritative Pricing Algorithm:**  
   - Implements the specific formula (e.g. character-based, volume-based, area-based, bounding-box-based).
   - Recalculates prices purely from server-stored facts and admin settings.

6. **Dedicated Database Persistence Model:**  
   - Defines a dedicated Prisma model (`CustomDesign`, `StandDesign`) with strict columns for domain-specific metrics.

---

## 4. Standardized Integration Interfaces (Contracts)

Any future customiser product MUST implement these 5 standardized contracts to integrate cleanly into Giftora:

### Contract 1: `ICustomizerEngine` (Frontend)
```typescript
interface ICustomizerEngine<TConfig, TGeometryResult> {
  buildGeometry(config: TConfig): Promise<TGeometryResult>;
  validatePreflight(config: TConfig, geometry: TGeometryResult): PreflightValidationResult;
  exportBinaryStl(geometry: TGeometryResult): Promise<{ buffer: ArrayBuffer; sha256: string }>;
  generatePreviewImage(canvas: HTMLCanvasElement): Promise<Blob>;
}
```

### Contract 2: `IPriceCalculator` (Backend)
```typescript
interface IPriceCalculator<TConfig, TMetrics> {
  calculatePrice(config: TConfig, metrics: TMetrics, settings: Record<string, any>): number; // in cents
}
```

### Contract 3: `IDesignRepository` (Backend Service)
```typescript
interface IDesignRepository<TInput, TDesignRecord> {
  createPendingDesign(userId: string, input: TInput): Promise<{ design: TDesignRecord; created: boolean }>;
  storeAndVerifyStl(userId: string, designId: string, buffer: Buffer, claimedSha256?: string): Promise<TDesignRecord>;
  storePreviewImage(userId: string, designId: string, buffer: Buffer): Promise<void>;
  getOwnedDesign(userId: string, designId: string): Promise<TDesignRecord>;
  toPublicDTO(design: TDesignRecord, options: { admin?: boolean }): Record<string, any>;
}
```

### Contract 4: `ICartOrderBridge` (Backend Cart & Orders)
```typescript
interface ICartOrderBridge {
  verifyItemAvailability(item: CartItem): Promise<boolean>;
  recomputeUnitPriceCents(item: CartItem, globalSettings: any): Promise<number>;
  serializeOrderItem(item: OrderItem, options: { admin?: boolean }): Record<string, any>;
}
```

### Contract 5: `IAdminStudioController` (Frontend & Backend Admin)
```typescript
interface IAdminStudioController {
  getSettings(): Promise<Record<string, any>>;
  updateSettings(payload: Record<string, any>): Promise<void>;
  getManufacturingSpecs(orderItem: OrderItem): Array<{ label: string; value: string; hex?: string }>;
}
```
