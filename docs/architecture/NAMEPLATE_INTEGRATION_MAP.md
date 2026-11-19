# Nameplate Integration Map & Dependency Audit

**Platform:** Giftora 3D Customisation E-Commerce Platform  
**Target:** Product Model 3 Integration  
**Status:** `READY_FOR_INTEGRATION`  

---

## 1. File Mapping Matrix

### 1.1 Source Project $\longrightarrow$ Giftora Customer Frontend

| Source Project Path (`C:\Users\UNITED\GIFT\3d customization\1`) | Destination Path in Giftora (`apps/customer-frontend`) | Integration Action & Transformation |
| :--- | :--- | :--- |
| `src/types/design.ts` | `src/features/nameplateStudio/core/types.ts` | Extracted core `NameplateDesign`, `NameplateShape`, `MountingStyle`, `TextLine`. Excluded standalone mock page types. |
| `src/data/fonts.ts` | `src/features/nameplateStudio/core/fonts.ts` | Reused full 70+ font library with Google Fonts dynamic stylesheet injector and Tamil font descriptors. |
| `src/data/presets.ts` | `src/features/nameplateStudio/core/presets.ts` | Reused 10 nameplate types, 20 shapes, 18 decorations, 7 PBR material presets, and defaults. |
| `src/utils/contourTracer.ts` | `src/features/nameplateStudio/geometry/contourTracer.ts` | Reused Marching Squares alpha contour tracer and Douglas-Peucker polygon simplifier. |
| `src/utils/baseGeometry.ts` | `src/features/nameplateStudio/geometry/baseGeometry.ts` | Reused 20 procedural silhouette shapes, border frames, and engraved counter-islands. |
| `src/utils/textGeometry.ts` | `src/features/nameplateStudio/geometry/textGeometry.ts` | Reused multi-line Canvas2D HarfBuzz text shaping and polygon triangulation. |
| `src/utils/mountingGeometry.ts` | `src/features/nameplateStudio/geometry/mountingGeometry.ts` | Reused 18 3D emblems, mounting screw holes, keyholes, and angled desk stand ribs. |
| `src/utils/materials.ts` | `src/features/nameplateStudio/geometry/materials.ts` | Reused PBR material property builders (roughness, metalness, clearcoat, emissive glow). |
| `src/utils/geometryValidation.ts` | `src/features/nameplateStudio/geometry/validation.ts` | Reused print bed boundary checks ($220 \times 220 \times 250\text{ mm}$) and minimum wall thickness constraints. |
| `src/utils/stlExporter.ts` | `src/features/nameplateStudio/geometry/stlExporter.ts` | Reused client-side binary STL generator ($Y\text{-up} \to Z\text{-up}$ transformation). |
| `src/components/NameplateMesh.tsx` | `src/features/nameplateStudio/components/NameplateMesh.tsx` | Adapted Three.js mesh assembly with Giftora disposal hooks. |
| `src/components/Viewport3D.tsx` | `src/features/nameplateStudio/components/NameplateCanvas.tsx` | Adapted `@react-three/fiber` canvas with `RoomEnvironment` PMREM lighting and camera rig. |
| *New Giftora Component* | `src/features/nameplateStudio/components/StudioLeftPanel.tsx` | Created 4-tab configuration accordion matching Giftora's Obsidian & Gold luxury styling. |
| *New Giftora Component* | `src/features/nameplateStudio/components/ViewportControlsBar.tsx` | Created camera controls bar (Iso, Front, Top, Side, Perspective). |
| *New Giftora API Client* | `src/features/nameplateStudio/api/nameplateDesignApi.js` | Created client API for options, design creation, and STL upload. |
| *New Giftora Hook* | `src/features/nameplateStudio/hooks/useAddNameplateToCart.js` | Created transactional cart hook with preflight checks and preview capture. |
| *New Giftora Component* | `src/components/customiser/NameplateCustomizationSummary.jsx` | Created bottom specification, volume price, quantity, and shipping card. |
| *New Giftora Component* | `src/components/customiser/NameplateFactsCard.jsx` | Created production specifications card. |
| *New Giftora Page* | `src/pages/NameplateCustomiser.jsx` | Created main page wrapping 2-column workspace with sticky canvas. |

---

### 1.2 Giftora Backend Implementation (`apps/backend`)

| New Backend File Path | Architectural Purpose |
| :--- | :--- |
| `src/modules/nameplateDesigner/nameplateDesignOptions.js` | Catalog options, 10 types, base prices, shapes, finishes, fonts, volume rates, and pricing calculator. |
| `src/modules/nameplateDesigner/nameplateDesignValidator.js` | Strict input schema validation, canonical JSON serialization, and SHA-256 `paramsHash` computation. |
| `src/modules/nameplateDesigner/nameplateDesignService.js` | Design lifecycle (Create pending, verify & store binary STL via `computeSignedVolumeCm3`, public DTO). |
| `src/modules/nameplateDesigner/nameplateDesignController.js` | Express controllers for options, design creation, STL upload, and preview storage. |
| `src/modules/nameplateDesigner/nameplateDesignRoutes.js` | Express route definitions mounted at `/api/v1/nameplate-designer` and `/api/v1/nameplate-designs`. |

---

### 1.3 Giftora Admin Frontend Implementation (`apps/admin-frontend`)

| Admin File Path | Architectural Purpose |
| :--- | :--- |
| `src/app/customization/NameplateCustomizationSettings.jsx` | Full admin management panel: Base pricing for 10 types, volume material rate (₹/cm³), feature surcharges, and integrated `ShippingManager`. |

---

## 2. Modified Existing Giftora Files

| File Path | Modifications Made |
| :--- | :--- |
| `apps/backend/prisma/schema.prisma` | Added `NameplateDesign` model; added `NAMEPLATE_DESIGN` to `OrderItemType` enum; added `nameplateDesignId` FK to `CartItem` and `OrderItem`. |
| `apps/backend/src/app.js` | Mounted `nameplateDesignerRouter` and `nameplateDesignRouter`. |
| `apps/backend/src/modules/settings/settingsService.js` | Added `getNameplatePricingConfig()` and `saveNameplatePricingConfig()` with safe fallbacks. |
| `apps/backend/src/modules/settings/settingsRoutes.js` | Added public `GET /settings/nameplate-pricing` and admin `PUT /admin/settings/nameplate-pricing`. |
| `apps/backend/src/modules/cart/cartService.js` | Added `addNameplateItem()` with volume-based price calculation and shipping resolution. |
| `apps/backend/src/modules/orders/orderService.js` | Handled `NAMEPLATE_DESIGN` in availability checks, price recomputation, item serialization, and order snapshots. |
| `apps/backend/src/modules/orders/adminOrderController.js` | Added STL download and preview routing for `NAMEPLATE_DESIGN` items. |
| `apps/customer-frontend/src/routes/AppRoutes.jsx` | Added route `<Route path="/customise/nameplate" element={<NameplateCustomiser />} />`. |
| `apps/customer-frontend/src/features/customisation/customisationProducts.js` | Registered Nameplate in customer customisation hub registry. |
| `apps/admin-frontend/src/features/customization/customizationProducts.js` | Registered Nameplate in admin customisation hub registry. |
| `apps/admin-frontend/src/App.jsx` | Added admin route `<Route path="/customization/nameplate" element={<NameplateCustomizationSettings />} />`. |
| `apps/admin-frontend/src/app/orders/OrderDetail.jsx` | Added `specsForNameplate()` helper and wired Nameplate STL downloads. |

---

## 3. Dependency Audit

| Package Name | Source Version | Giftora Existing Version | Action Required |
| :--- | :--- | :--- | :--- |
| `three` | `^0.187.0` | `^0.187.0` | Reused existing. No change. |
| `@react-three/fiber`| `^9.0.0` | `^9.8.2` | Reused existing. No change. |
| `@react-three/drei` | `^10.0.0` | `^10.7.9` | Reused existing. No change. |
| `lucide-react` | `^0.546.0` | `^1.73.0` | Reused existing. No change. |
| `motion` | `^12.23.24` | `^14.14.0` | Reused existing. No change. |
| `jszip` | `^3.10.2` | `^3.10.2` | Reused existing. No change. |
| `opentype.js` | Not in source | `^2.0.0` | Retained in Giftora. |
| `manifold-3d` | Not in source | `^3.5.4` | Retained in Giftora (used by Keychain). |

> [!NOTE]
> **Zero new dependencies are required.** Giftora already possesses 100% of the libraries used by Nameplate at compatible or superior versions.
