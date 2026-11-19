# Future Customiser Development Guide & Architecture Manual

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Audience:** Full-Stack Engineers & 3D Platform Developers  
**Scope:** Developer Handbook, Sequence Diagrams, ERD, Boilerplates, and Quality Standards  
**Status:** `VERIFIED` & `PRODUCTION_ACTIVE`  

---

## 1. System Architecture Overview

Giftora's 3D customisation platform orchestrates browser-based 3D parametric modeling, server-authoritative geometric verification, and an e-commerce order fulfillment pipeline.

```mermaid
graph TD
    subgraph Client Tier [Customer Frontend - React + Three.js]
        A[Customer Studio Viewport] -->|Parametric Changes| B[Geometry Builder Engine]
        B -->|Geometry Mesh| C[Preflight Slicing Validator]
        C -->|Valid Mesh| D[Three.js STLExporter]
        D -->|Binary STL + SHA-256| E[Customizer API Client]
    end

    subgraph Server Tier [Backend Node.js API - Express + Prisma]
        E -->|POST /designs| F[Design Validation & Canonicalizer]
        E -->|PUT /designs/:id/stl| G[Binary STL & Volume Validator]
        G -->|computeSignedVolumeCm3| H[Pricing Engine]
        H -->|Status: READY| I[Design Record DB]
        J[Cart Service] -->|Add Custom Line| K[Polymorphic Cart Table]
        L[Order Service] -->|Checkout Transaction| M[Order & OrderItems DB]
    end

    subgraph Storage & Manufacturing Tier
        G -->|Content-Addressed Put| N[Object/Disk File Storage]
        O[Admin Back-Office] -->|GET /orders/:id/stl| P[Production Slicer Software]
    end

    I --> K
    K --> L
    N --> O
```

---

## 2. Complete End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Studio as Studio UI (React)
    participant Engine as 3D Engine (Three.js/Manifold)
    participant API as Backend API (Express)
    participant Storage as File Storage (Disk/S3)
    participant DB as MySQL Database (Prisma)
    actor Admin

    Note over Customer, Studio: 1. Customisation & Preflight
    Customer->>Studio: Adjusts dimensions, colors, slots, text
    Studio->>Engine: buildGeometry(config)
    Engine-->>Studio: Returns 3D Solid Mesh
    Studio->>Studio: validatePreflight() (Wall thickness, bounds)
    
    Note over Studio, Storage: 2. File Generation & Persistence
    Customer->>Studio: Clicks "Add to Cart"
    Studio->>Engine: Export Binary STL & Compute SHA-256
    Studio->>API: POST /api/v1/[product]-designs (canonical config)
    API->>DB: Insert Design (Status: PENDING, unitPrice: 0)
    DB-->>API: Returns design.id
    Studio->>API: PUT /api/v1/[product]-designs/:id/stl (Binary Buffer)
    API->>API: computeSignedVolumeCm3(buffer) & checksum check
    API->>Storage: put(key, buffer, immutable=true)
    API->>DB: Update Design (solidVolumeCm3, unitPriceCents, status=READY)
    API-->>Studio: 200 OK (Design Ready)

    Note over Studio, DB: 3. Cart & Transactional Checkout
    Studio->>API: POST /api/v1/cart/items (designId, quantity, shippingMethod)
    API->>DB: Insert CartItem (itemType=[PRODUCT]_DESIGN, customDesignId/standDesignId)
    Customer->>API: POST /api/v1/orders (addressId, idempotencyKey)
    API->>API: Recompute every line item price from live settings
    API->>DB: Atomic Transaction: Create Order, Snapshot Items, Clear Cart
    API-->>Customer: Order Confirmation (orderNumber)

    Note over Admin, Storage: 4. Manufacturing & Fulfillment
    Admin->>API: GET /api/v1/admin/orders/:id
    API->>DB: Query Order + OrderItems + Custom Specs
    API-->>Admin: Render Order Details & Specs
    Admin->>API: GET /api/v1/admin/orders/:id/items/:itemId/stl
    API->>Storage: get(design.stlKey)
    Storage-->>API: Stream Binary STL
    API-->>Admin: Download Production STL (Ready for Bambu Studio / PrusaSlicer)
```

---

## 3. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ CustomDesign : owns
    User ||--o{ StandDesign : owns
    User ||--o| Cart : has
    User ||--o{ Order : places
    User ||--o{ Address : saves

    Cart ||--o{ CartItem : contains
    Order ||--o{ OrderItem : contains
    Order ||--o| Payment : has

    CartItem }o--|| Product : references
    CartItem }o--|| CustomDesign : references
    CartItem }o--|| StandDesign : references

    OrderItem }o--|| Product : snapshots
    OrderItem }o--|| CustomDesign : snapshots
    OrderItem }o--|| StandDesign : snapshots

    CustomDesign {
        string id PK
        string userId FK
        json params
        string paramsHash
        int unitPriceCents
        string status
        string stlKey
        string reliefStlKey
    }

    StandDesign {
        string id PK
        string userId FK
        string category
        json designConfig
        string paramsHash
        float solidVolumeCm3
        int unitPriceCents
        string status
        string stlKey
    }

    CartItem {
        string id PK
        string cartId FK
        string itemType
        string productId FK
        string customDesignId FK
        string standDesignId FK
        int quantity
        int unitPriceCents
        json customization
    }

    OrderItem {
        string id PK
        string orderId FK
        string itemType
        string productId FK
        string customDesignId FK
        string standDesignId FK
        string productName
        int quantity
        int unitPriceCents
        json customization
    }
```

---

## 4. Standardized Implementation Boilerplates

### 4.1 Canonical Input Validator & Params Hash Generator
```javascript
// src/modules/<product>/<product>Validator.js
import crypto from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'

export function validateInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new HttpError(400, 'Invalid configuration payload.')
  }

  // 1. Strict schema canonicalization
  const canonical = {
    category: String(rawInput.category || 'default').trim(),
    dimensions: {
      widthMm: Math.max(10, Math.min(200, Number(rawInput.dimensions?.widthMm) || 50)),
      heightMm: Math.max(10, Math.min(200, Number(rawInput.dimensions?.heightMm) || 50)),
    },
    appearance: {
      finish: String(rawInput.appearance?.finish || 'matte').trim(),
      baseColor: String(rawInput.appearance?.baseColor || '#D9AE4E').trim(),
    }
  }

  // 2. Deterministic Hash Computation (Key-sorted JSON)
  const canonicalJson = JSON.stringify(canonical, Object.keys(canonical).sort())
  const paramsHash = crypto.createHash('sha256').update(canonicalJson).digest('hex')

  return { canonical, paramsHash, title: `${canonical.category.toUpperCase()} Custom Design` }
}
```

### 4.2 Divergence Theorem Volume Engine
```javascript
// src/utils/meshVolumeCalculator.js
export function computeSignedVolumeCm3(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 84) return 0
  const triangleCount = buffer.readUInt32LE(80)
  if (buffer.length !== 84 + triangleCount * 50) return 0

  let totalVolumeMm3 = 0
  let offset = 84

  for (let i = 0; i < triangleCount; i++) {
    offset += 12 // Skip normal vector
    const x1 = buffer.readFloatLE(offset); const y1 = buffer.readFloatLE(offset + 4); const z1 = buffer.readFloatLE(offset + 8);
    const x2 = buffer.readFloatLE(offset + 12); const y2 = buffer.readFloatLE(offset + 16); const z2 = buffer.readFloatLE(offset + 20);
    const x3 = buffer.readFloatLE(offset + 24); const y3 = buffer.readFloatLE(offset + 28); const z3 = buffer.readFloatLE(offset + 32);
    offset += 38 // Advance to next triangle (36 bytes vertices + 2 bytes attribute)

    // Scalar triple product: v1 . (v2 x v3)
    totalVolumeMm3 += (x1 * (y2 * z3 - z2 * y3) - y1 * (x2 * z3 - z2 * x3) + z1 * (x2 * y3 - y2 * x3)) / 6.0
  }

  return Math.abs(totalVolumeMm3) / 1000.0 // Convert mm³ to cm³
}
```

---

## 5. Development & Code Quality Checklist

Before submitting a Pull Request for a new customisable product:
- [ ] **Design System:** Does the studio adhere strictly to Giftora's Obsidian (`#0D0D0D`) and Gold (`#D9AE4E`) palette?
- [ ] **Sticky Viewport:** Does the 3D canvas remain sticky on the right during desktop scrolling?
- [ ] **Bottom Pricing:** Is the specification and shipping card positioned at the bottom of the left configuration column?
- [ ] **Server Authority:** Is pricing completely recalculated on the server without trusting client prices?
- [ ] **Mesh Validation:** Is the binary STL header validated and volume bounded ($1.0 \le V \le 5000\text{ cm}^3$)?
- [ ] **Zero Duplicate Races:** Is `@@unique([userId, paramsHash])` catching `P2002` concurrent requests safely?
- [ ] **Cart Polymorphism:** Are `CartItem` and `OrderItem` foreign keys mutually exclusive?
- [ ] **Admin Fulfillment:** Can the admin inspect custom specifications and download the production STL from `/orders/:id`?
- [ ] **Build & Unit Tests:** Do `npm test` in backend and `npm run build` in frontends pass cleanly?
