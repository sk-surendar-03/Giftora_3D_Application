# Product Model Comparison: Name Keychain vs Phone & Pen Stand

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Scope:** Technical Comparative Audit of Product Model 1 vs Product Model 2  
**Status:** `VERIFIED` & `PRODUCTION_ACTIVE`  

---

## 1. Executive Summary

Giftora operates two distinct 3D customisation models:
1. **Name Keychain:** A typography-centric, CSG boolean model where pricing is based on character counts and geometry is evaluated using WebAssembly (Manifold-3D).
2. **Phone & Pen Stand:** A multi-part functional model where geometry is generated parametrically in Three.js and pricing is derived from the server-calculated physical plastic volume ($\text{cm}^3$).

Both models integrate seamlessly into the shared Giftora e-commerce substrate (Cart, Checkout, Orders, Shipping, Payments, and Admin).

---

## 2. Technical Comparison Matrix (11 Facets)

| Technical Facet | Product Model 1: Name Keychain (`/customise`) | Product Model 2: Phone & Pen Stand (`/customise/stand`) | Architectural Rationale & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **1. Product Domain & Concept** | Flat prismatic personal accessory; typography as the primary structural element. | Volumetric desktop organizer; functional cavities and ergonomics (phone tilt, pen slots) with decorative personalization. | Keychain requires precise text connectivity; Stand requires structural stability and device clearance. |
| **2. 3D Engine Architecture** | **Manifold-3D WASM** inside a Web Worker. Performs heavy 2D/3D boolean unions and subtractions. | **Three.js Parametric Solid Builder** (`standBuilder.ts`). Direct buffer geometry extrusions and procedural mesh assembly. | Manifold provides robust, manifold CSG for arbitrary font curves; Three.js provides instant, low-latency rendering for complex parametric assemblies without WASM overhead. |
| **3. State Management & Serialization** | Discrete React state hooks (`text`, `fontId`, `templateId`, `styleChoice`, `sizeChoice`, `baseChoice`, `textChoice`, `thickness`). | Hierarchical, domain-grouped JSON state (`DesignConfig`: `category`, `phone`, `pen`, `personalization`, `appearance`, `print`). | Discrete hooks evolved from early prototype; grouped JSON configuration provides better extensibility and schema validation for complex products. |
| **4. Preflight & Geometry Validation** | Client-side `preflight.js`: glyph overlap check ($\ge 1.2\text{ mm}$), keyring eyelet wall thickness ($\ge 2.0\text{ mm}$), bounding envelope. | Client-side `validation.ts`: phone thickness vs slot width clearance, wall thickness ($\ge 2.5\text{ mm}$), print bed limits ($220 \times 220 \times 250\text{ mm}$). | Both products enforce zero-failure printability before enabling cart actions. |
| **5. Pricing Engine Algorithm** | **Character Count Driven:**<br>$\text{Base} + (\text{Chars} - \text{BaseChars}) \times \text{Rate} + \text{Size} + \text{Thickness}$ | **Volumetric Displacement Driven:**<br>$\text{CategoryBase} + (\lceil \text{SolidVolumeCm3} \rceil \times \text{RatePerCm3})$ | Keychain cost scales with engraving time and character length; Stand cost scales with mass of filament consumed. |
| **6. Persistence & DB Schema** | Table `custom_designs`: Stores `params`, `engineParams`, `paramsHash`, `stlKey`, `reliefStlKey`, `previewKey`. | Table `stand_designs`: Stores `category`, `designConfig`, `solidVolumeCm3`, `paramsHash`, `stlKey`, `previewKey`. | Both tables use `@@unique([userId, paramsHash])` for zero-duplication retries. Stand table explicitly tracks measured volume. |
| **7. STL & File Pipeline** | Dual-mesh client generation: Exports Base STL and Text Relief STL. Server verifies binary header and bounding box. | Single-mesh client generation via Three.js `STLExporter`. Server computes exact signed volume using divergence theorem. | Stand requires volume verification to lock authoritative price; Keychain price is locked prior to upload based on validated text params. |
| **8. Cart & Checkout Polymorphism** | `cart_items.itemType = 'CUSTOM_DESIGN'`<br>`cart_items.customDesignId = FK`<br>Prices re-verified against character rates at checkout. | `cart_items.itemType = 'STAND_DESIGN'`<br>`cart_items.standDesignId = FK`<br>Prices re-verified against volume and category base at checkout. | Unified cart table handles both custom types alongside standard catalog products without schema collisions. |
| **9. Fulfillment & Manufacturing Exports** | Exports single STL + **Multi-material 3MF** container with embedded filament color metadata. | Exports production single-body binary **STL** with parametric specs sheet in admin. | 3MF enables dual-extrusion printing on Bambu/Prusa; Stand STL enables slicing with category-specific infill percentages. |
| **10. Admin Configuration & Controls** | Dedicated panel `/customization/name-keychain`: Base characters, character rates, color swatches, sizes, shipping rates. | Dedicated panel `/customization/phone-pen-stand`: Category base rates, volume rate per $\text{cm}^3$, and integrated shipping manager. | Both products provide full financial autonomy to admins without code deployment. |
| **11. UI/UX Layout & Ergonomics** | Giftora Obsidian & Gold (`#D9AE4E`) 2-column layout: Sticky 3D canvas on right, scrollable options on left, bottom price/order summary. | **Identical layout**: Sticky 3D canvas, left-column accordion configuration, bottom specification/shipping card. | Uniform user experience ensures seamless cognitive transition when browsing between customizers. |

---

## 3. Shared vs Divergent Architectural Patterns

```mermaid
flowchart TD
    subgraph Shared Platform Layer
        AUTH["JWT & OTP Authentication"]
        CART["Polymorphic Cart & CartItems"]
        ORDERS["Order Lifecycle & Transactions"]
        SHIP["Shipping Manager & Rates"]
        STORAGE["Content-Addressed File Storage"]
        UI_THEME["Obsidian & Gold Design System"]
    end

    subgraph Product Model 1: Name Keychain
        CSG["Manifold-3D WASM CSG"]
        CHAR_PRICE["Character-Count Pricing"]
        DUAL_MESH["Dual-Mesh & 3MF Export"]
        TABLE_CD["custom_designs Table"]
    end

    subgraph Product Model 2: Phone & Pen Stand
        PARAM_3JS["Three.js Parametric Builder"]
        VOL_PRICE["Solid Volume cm³ Pricing"]
        SINGLE_STL["Solid STL & Divergence Theorem"]
        TABLE_SD["stand_designs Table"]
    end

    Shared Platform Layer --> Product Model 1: Name Keychain
    Shared Platform Layer --> Product Model 2: Phone & Pen Stand
```

### 3.1 What is Shared
- **Authentication & User Sessions:** Token-based authentication, guest cart merging, persistent rate limiting.
- **Cart & Order Processing:** Single unified pipeline. Both product types convert to order line items with immutable price and configuration snapshots.
- **File Storage Driver:** Pluggable storage interface (`getStorage()`) storing files at content-addressed keys under `/uploads/`.
- **Admin Order Fulfillment:** Single unified `/orders/:id` page displaying custom specifications and download triggers for manufacturing assets.
- **Visual Design Tokens:** Identical font hierarchies (Playfair Display, Inter), surface elevations, gold gradients, and micro-interactions.

### 3.2 What is Divergent
- **Pricing Authority Timing:**
  - *Keychain:* Calculated synchronously upon input validation before STL upload.
  - *Stand:* Calculated asynchronously during STL upload after the server evaluates the 3D mesh volume.
- **Geometry Kernel:**
  - *Keychain:* Requires robust CSG booleans to fuse arbitrary TTF glyphs with curved backplates.
  - *Stand:* Utilizes procedural Three.js solid primitives, avoiding WASM download overhead (~2.5 MB).

---

## 4. Technical Debt, Tradeoffs & Historical Decisions

1. **Database Schema Denormalization:**  
   `CustomDesign` and `StandDesign` live in separate tables rather than a single unified `Customization` table.  
   *Tradeoff Assessment:* While a single polymorphic table might seem cleaner, dedicated tables allow strict schema typing, individual indexes (`category`, `solidVolumeCm3`), and prevent null-pointer vulnerabilities.
2. **Dual-Mesh vs Single-Mesh Pipelines:**  
   Keychain generates dual meshes to support 3MF multi-color slicing, whereas Stand outputs a single solid body.  
   *Evolutionary Path:* Future products can adopt the dual-mesh pipeline if multi-color filament printing is desired, or the single-mesh pipeline for structural monolithic prints.
