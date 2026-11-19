# Nameplate API & Database Architecture Specification

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Scope:** Backend Endpoints, Services, Database Models & Validation  
**Status:** `READY_FOR_INTEGRATION`  

---

## 1. Database Architecture & Prisma Schema

### 1.1 `nameplate_designs` Model Definition
Added to `apps/backend/prisma/schema.prisma`:

```prisma
model NameplateDesign {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  schemaVersion    Int          @default(1)
  title            String
  nameplateType    String       @db.VarChar(40)
  shape            String       @db.VarChar(40)
  mountingStyle    String       @db.VarChar(40)
  designConfig     Json
  paramsHash       String
  unitPriceCents   Int
  solidVolumeCm3   Float?
  status           DesignStatus @default(PENDING)
  stlKey           String?      @unique
  stlSha256        String?
  stlSizeBytes     Int?
  triangleCount    Int?
  bboxMm           Json?
  previewKey       String?
  previewSizeBytes Int?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  cartItems        CartItem[]
  orderItems       OrderItem[]

  @@unique([userId, paramsHash])
  @@index([userId])
  @@index([status])
  @@map("nameplate_designs")
}
```

### 1.2 Polymorphic Cart and Order Relations
Updated in `prisma/schema.prisma`:

```prisma
enum OrderItemType {
  PRODUCT
  CUSTOM_DESIGN
  STAND_DESIGN
  NAMEPLATE_DESIGN
}

model CartItem {
  id                String        @id @default(cuid())
  cartId            String
  cart              Cart          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  itemType          OrderItemType @default(PRODUCT)
  productId         String?
  product           Product?      @relation(fields: [productId], references: [id], onDelete: Restrict)
  customDesignId    String?
  customDesign      CustomDesign? @relation(fields: [customDesignId], references: [id], onDelete: Restrict)
  standDesignId     String?
  standDesign       StandDesign?  @relation(fields: [standDesignId], references: [id], onDelete: Restrict)
  nameplateDesignId String?
  nameplateDesign   NameplateDesign? @relation(fields: [nameplateDesignId], references: [id], onDelete: Restrict)
  quantity          Int           @default(1)
  customization     Json?
  unitPriceCents    Int
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([cartId])
  @@index([productId])
  @@index([customDesignId])
  @@index([standDesignId])
  @@index([nameplateDesignId])
  @@map("cart_items")
}

model OrderItem {
  id                String        @id @default(cuid())
  orderId           String
  order             Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemType          OrderItemType @default(PRODUCT)
  productId         String?
  product           Product?      @relation(fields: [productId], references: [id], onDelete: Restrict)
  customDesignId    String?
  customDesign      CustomDesign? @relation(fields: [customDesignId], references: [id], onDelete: Restrict)
  standDesignId     String?
  standDesign       StandDesign?  @relation(fields: [standDesignId], references: [id], onDelete: Restrict)
  nameplateDesignId String?
  nameplateDesign   NameplateDesign? @relation(fields: [nameplateDesignId], references: [id], onDelete: Restrict)
  productName       String
  productSlug       String?
  productImage      String?
  quantity          Int
  customization     Json?
  unitPriceCents    Int

  @@index([orderId])
  @@index([productId])
  @@index([customDesignId])
  @@index([standDesignId])
  @@index([nameplateDesignId])
  @@map("order_items")
}
```

---

## 2. API Endpoint Contracts

### 2.1 Public & Customer Endpoints

#### `GET /api/v1/nameplate-designer/options`
- **Auth:** None (Public)
- **Description:** Returns studio options, available shapes, fonts, materials, and pricing tiers.
- **Response (200 OK):**
```json
{
  "options": {
    "schemaVersion": 1,
    "types": [
      { "id": "desk", "name": "Desk Nameplates", "basePriceCents": 55000 },
      { "id": "door", "name": "Door Nameplates", "basePriceCents": 65000 },
      { "id": "wall", "name": "Wall-Mounted Signs", "basePriceCents": 75000 },
      { "id": "kids", "name": "Kids' Room Nameplates", "basePriceCents": 60000 },
      { "id": "business", "name": "Business Signs", "basePriceCents": 85000 },
      { "id": "led", "name": "LED-Style Signs", "basePriceCents": 95000 },
      { "id": "decorative-3d", "name": "Decorative 3D Text", "basePriceCents": 50000 },
      { "id": "wedding", "name": "Wedding & Event", "basePriceCents": 70000 },
      { "id": "house-number", "name": "House Number Plates", "basePriceCents": 65000 },
      { "id": "gaming", "name": "Gaming Desk Tags", "basePriceCents": 60000 }
    ],
    "shapes": ["rectangle", "rounded-rectangle", "oval", "circle", "hexagon", "arch", "cloud", "heart", "shield", "crest"],
    "finishes": ["matte-pla", "silk-pla", "metallic-pla", "wood-pla", "marble-pla", "transparent", "dual-color"],
    "pricePerCm3Cents": 120,
    "ledGlowSurchargeCents": 15000,
    "layeredBackingSurchargeCents": 10000
  }
}
```

#### `POST /api/v1/nameplate-designs`
- **Auth:** Required (`Bearer <JWT>`)
- **Request Body:**
```json
{
  "nameplateType": "desk",
  "shape": "rounded-rectangle",
  "mountingStyle": "freestanding-desk",
  "designConfig": {
    "widthMm": 180,
    "heightMm": 50,
    "baseThicknessMm": 4,
    "cornerRadiusMm": 8,
    "textExtrusionMm": 2.5,
    "materialFinish": "metallic-pla",
    "baseColor": "#0D0D0D",
    "borderColor": "#D9AE4E",
    "ledGlowEnabled": false,
    "lines": [
      {
        "id": "line-1",
        "text": "SURENDAR",
        "fontId": "cinzel",
        "fontSize": 14,
        "color": "#D9AE4E",
        "bold": true,
        "italic": false,
        "align": "center"
      }
    ]
  }
}
```
- **Response (201 Created / 200 OK):**
```json
{
  "design": {
    "id": "cm3nameplate0001",
    "title": "DESK NAMEPLATE",
    "status": "PENDING",
    "unitPriceCents": 0,
    "hasStl": false,
    "hasPreview": false
  },
  "created": true
}
```

#### `PUT /api/v1/nameplate-designs/:id/stl`
- **Auth:** Required (`Bearer <JWT>`)
- **Headers:** `Content-Type: application/octet-stream`, `X-STL-SHA256: <hex>`
- **Body:** Raw binary STL buffer.
- **Server Action:**
  1. Computes SHA-256 of buffer and verifies integrity.
  2. Measures solid plastic volume via divergence theorem (`computeSignedVolumeCm3`).
  3. Enforces $1.0\text{ cm}^3 \le V \le 5000\text{ cm}^3$.
  4. Stores file to immutable key `uploads/nameplate-designs/<userId>/<id>/<sha256>.stl`.
  5. Computes unit price: $\text{Base} + (V \times \text{Rate}) + \text{Surcharges}$.
  6. Updates design row: `status = 'READY'`, `solidVolumeCm3 = V`, `unitPriceCents = price`.
- **Response (200 OK):**
```json
{
  "design": {
    "id": "cm3nameplate0001",
    "title": "DESK NAMEPLATE",
    "status": "READY",
    "unitPriceCents": 67000,
    "solidVolumeCm3": 100.0,
    "hasStl": true
  }
}
```

#### `POST /api/v1/cart/items` (Polymorphic Add)
- **Request Body:**
```json
{
  "itemType": "NAMEPLATE_DESIGN",
  "nameplateDesignId": "cm3nameplate0001",
  "quantity": 1,
  "shippingMethod": { "name": "Quick Courier", "priceCents": 3000 }
}
```

---

## 3. Admin Management Endpoints

#### `GET /api/v1/settings/nameplate-pricing`
- Returns active base prices per type, volume rate per cm³, and feature surcharges.

#### `PUT /api/v1/admin/settings/nameplate-pricing`
- **Auth:** Required (`Admin Role`)
- Updates active pricing configuration in the `settings` table (`key: 'nameplate_pricing'`).

#### `GET /api/v1/admin/orders/:orderId/items/:itemId/stl`
- Streams the production binary STL for slicing.
