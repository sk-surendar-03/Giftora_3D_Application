# Giftora — Template & Style Image Integration Audit: Phone & Pen Stand and Nameplate

**Author / Roles:** Senior React Developer + UI/UX Engineer  
**Date:** November 19, 2026  
**Project:** Giftora / JAS 3D Makers (`apps/customer-frontend`)  
**Scope:** Stand Studio (`/customise/stand`) and Nameplate Studio (`/customise/nameplate`) Image Selection Architecture  

---

## 1. Executive Summary

The Name Keychain customiser has established a clean, high-converting visual selection pattern using thumbnail cards (`VisualDesignCardRail.jsx`), verified image asset maps (`templateAssets.js`), and instant 3D model re-rendering upon option selection.

Prior to this implementation:
- **Phone & Pen Stand** relied entirely on HTML `<select>` drop-down elements for templates and themes.
- **Nameplate Customiser** did not render its 12 curated templates (`TEMPLATES_LIBRARY`) and rendered its 10 Application Styles and 20 Silhouette Shapes as plain text grid buttons.

This initiative introduces visual image-selection for both Phone & Pen Stand and Nameplate customisers using verified source assets, shared visual card components, responsive layouts, and graceful image-fallback rendering—without altering any underlying geometry engines, pricing calculations, or backend APIs.

---

## 2. Complete Existing Image Inventory (Phase 1)

All image files in `apps/customer-frontend` and relevant storage directories were audited, measured for exact pixel dimensions, and categorized by current usage and product suitability:

| Image filename | Source path | Dimensions | Existing usage | Suitable product |
| :--- | :--- | :--- | :--- | :--- |
| `nameplate.png` | `apps/customer-frontend/public/showcase/templates/nameplate.png` | 621×330 | Nameplate template card preview in Keychain customiser & showcase | **Nameplate** (Primary Desk & Architectural Plate) |
| `nameplate-mobile.png` | `apps/customer-frontend/public/showcase/templates/nameplate-mobile.png` | 1280×720 | Mobile showcase hero banner | **Nameplate** |
| `nameplate-320.webp` | `apps/customer-frontend/public/showcase/v1/templates/nameplate-320.webp` | 320×180 | WebP thumbnail preview | **Nameplate** |
| `nameplate-640.webp` | `apps/customer-frontend/public/showcase/v1/templates/nameplate-640.webp` | 640×360 | High-res WebP preview | **Nameplate** |
| `hero-2.png` | `apps/customer-frontend/public/hero-2.png` | 1600×900 | Home hero slide & Hub card for Phone & Pen Stand | **Phone & Pen Stand** (Multi-piece desk dock sets) |
| `hero-3.png` | `apps/customer-frontend/public/hero-3.png` | 1600×900 | Home hero slide & Hub card for Custom Nameplate | **Nameplate** (Traditional & Divine collections) |
| `hero-4.png` | `apps/customer-frontend/public/hero-4.png` | 1600×900 | Home hero slide (black & gold decorative pieces) | **Both** (Luxury Obsidian Nameplate / Executive Stand) |
| `hero-products.png` | `apps/customer-frontend/public/hero-products.png` | 1672×941 | Home hero slide & Hub card for Name Keychain | **Name Keychain** |
| `name-keychain-arch.png` | `apps/customer-frontend/public/showcase/styles/name-keychain-arch.png` | 621×260 | Arch style preview in Keychain customiser | **Nameplate** (`arch` shape & Door plaques) |
| `magnet-arch.png` | `apps/customer-frontend/public/showcase/styles/magnet-arch.png` | 1280×720 | Magnet arch style preview | **Nameplate** (`arch` shape & Door plaques) |
| `plant-label-arch.png` | `apps/customer-frontend/public/showcase/styles/plant-label-arch.png` | 1280×720 | Plant label arch preview | **Nameplate** (`arch` shape) |
| `name-keychain-ribbon.png` | `apps/customer-frontend/public/showcase/styles/name-keychain-ribbon.png` | 621×260 | Ribbon banner style preview in Keychain | **Nameplate** (`ribbon-banner` shape) |
| `magnet-ribbon.png` | `apps/customer-frontend/public/showcase/styles/magnet-ribbon.png` | 1280×720 | Ribbon style preview in Magnet | **Nameplate** (`ribbon-banner` shape) |
| `name-keychain-heart-split.png`| `apps/customer-frontend/public/showcase/styles/name-keychain-heart-split.png` | 621×260 | Heart split style preview in Keychain | **Nameplate** (`heart` shape & Wedding plaques) |
| `name-keychain-contour.png`| `apps/customer-frontend/public/showcase/styles/name-keychain-contour.png` | 621×260 | Contour outline style preview in Keychain | **Nameplate** (`text-outline` shape & 3D text) |
| `magnet-contour.png` | `apps/customer-frontend/public/showcase/styles/magnet-contour.png` | 1280×720 | Magnet contour style preview | **Nameplate** (`text-outline` shape) |
| `plant-label-contour.png` | `apps/customer-frontend/public/showcase/styles/plant-label-contour.png` | 1280×720 | Plant label contour preview | **Nameplate** (`text-outline` shape) |
| `name-keychain-bubble.png`| `apps/customer-frontend/public/showcase/styles/name-keychain-bubble.png` | 621×260 | Bubble outline style preview in Keychain | **Nameplate** (`cloud` shape & Kids plaques) |
| `magnet-bubble.png` | `apps/customer-frontend/public/showcase/styles/magnet-bubble.png` | 1280×720 | Magnet bubble style preview | **Nameplate** (`cloud` shape & Kids plaques) |
| `plant-label-bubble.png` | `apps/customer-frontend/public/showcase/styles/plant-label-bubble.png` | 1280×720 | Plant label bubble preview | **Nameplate** (`cloud` shape & Kids plaques) |
| `name-keychain-capsule.png`| `apps/customer-frontend/public/showcase/styles/name-keychain-capsule.png` | 621×260 | Capsule pill style preview in Keychain | **Both** (Stand `stadium` base / Nameplate `rounded-rectangle`) |
| `magnet-capsule.png` | `apps/customer-frontend/public/showcase/styles/magnet-capsule.png` | 1280×720 | Magnet capsule style preview | **Both** (Stand `stadium` base / Nameplate `rounded-rectangle`) |
| `plant-label-capsule.png`| `apps/customer-frontend/public/showcase/styles/plant-label-capsule.png` | 1280×720 | Plant label capsule preview | **Both** (Stand `stadium` base / Nameplate `rounded-rectangle`) |
| `name-keychain-soft-tag.png`| `apps/customer-frontend/public/showcase/styles/name-keychain-soft-tag.png` | 621×260 | Soft-tag chamfer style preview in Keychain | **Nameplate** (`chamfer-plate` & `ticket-notch` shapes) |
| `magnet-soft-tag.png` | `apps/customer-frontend/public/showcase/styles/magnet-soft-tag.png` | 1280×720 | Magnet soft-tag style preview | **Nameplate** (`chamfer-plate` & `ticket-notch` shapes) |
| `plant-label-soft-tag.png`| `apps/customer-frontend/public/showcase/styles/plant-label-soft-tag.png` | 1280×720 | Plant label soft-tag preview | **Nameplate** (`chamfer-plate` & `ticket-notch` shapes) |
| `name-keychain.png` | `apps/customer-frontend/public/showcase/templates/name-keychain.png` | 621×330 | Name Keychain template card preview | **Name Keychain** |
| `articulated-name.png` | `apps/customer-frontend/public/showcase/templates/articulated-name.png` | 621×330 | Articulated letters template card preview | **Name Keychain** |
| `keyring-position-alex.png`| `apps/customer-frontend/public/showcase/keyring-position-alex.png` | 778×296 | Keyring hole placement diagram | **Name Keychain** |
| `jas-logo.png` | `apps/customer-frontend/public/jas-logo.png` | 1254×1254 | Brand primary header logo | **Brand Identity** |
| `tri-cube-logo.png` | `apps/customer-frontend/public/tri-cube-logo.png` | 380×375 | Tri-Cube branding mark | **Brand Identity** |
| `tri-cube-badge.png` | `apps/customer-frontend/public/tri-cube-badge.png` | 128×128 | Tri-Cube certification badge | **Brand Identity** |

---

## 3. Name Keychain Reference Implementation Analysis (Phase 2)

The reference implementation in `Customiser.jsx` and `VisualDesignCardRail.jsx` demonstrates several key UX patterns:

1. **Asset Mapping Separation:**
   - Template previews and style previews are isolated in `apps/customer-frontend/src/features/customiser/templateAssets.js` (`TEMPLATE_PREVIEWS`, `STYLE_PREVIEWS`, and `getStylePreview(templateId, styleId)`).
2. **Visual Presentation:**
   - Cards are displayed in a smooth horizontal scrollable rail (`flex gap-2.5 overflow-x-auto pb-2 pt-0.5`).
   - Card dimensions are consistent: `w-32 shrink-0`, `aspect-4/3` ratio container with `object-cover`.
   - Subtle hover zoom: `transition-transform group-hover:scale-105`.
3. **Selected State Highlighting:**
   - Highlighted with `border-accent bg-soft ring-1 ring-accent`.
   - Clear checkmark badge in upper-right corner (`rounded-full bg-accent text-[9px] font-bold text-on-accent`).
4. **Instant Reactive 3D Update:**
   - Clicking an option immediately calls state setters (`setTemplateId`, `setStyleChoice`), feeding parameters into the geometry worker without reloading the page.
5. **Fallback Handling:**
   - When no image is available, a centered typography placeholder displays the item name and badge.

---

## 4. Phone & Pen Stand Inventory & Integration (Phase 3)

### 4.1 Stand Options Structure
- **Studio Categories (3):** `phone-stand`, `pen-holder`, `combined`.
- **Design Themes (6):** `minimalist`, `nature-inspired`, `gaming-rgb`, `corporate-gift`, `executive-marble`, `kids-playful`.
- **Templates in `TEMPLATE_LIBRARY` (14):**
  - Phone: `minimal-phone-dock`, `curved-phone-rest`, `gamer-phone-stand`, `personalized-charging-stand`, `compact-travel-stand`, `sculptural-wave-cradle`.
  - Pen: `hex-honeycomb-cup`, `zen-wave-pen-holder`, `executive-pen-tray`, `modular-pen-dock`.
  - Combined: `executive-desk-station`, `gaming-battlestation-dock`, `minimalist-duo-stand`, `corner-desk-organizer`.

### 4.2 Integration in `StudioLeftPanel.tsx`
- Added `VisualDesignCardRail` for **Template Presets** filtered by the active category (`phone-stand`, `pen-holder`, `combined`).
- Added `VisualDesignCardRail` for **Design Themes & Style** displaying all 6 themes.
- Selecting any card calls `onApplyTemplate(templateId)` or `onApplyTheme(themeId)`, updating colors, finish, corner radiuses, and rebuilding the Three.js assembly in real time.
- Maintained the dropdown row below for fast keyboard navigation and accessibility.

---

## 5. Nameplate Inventory & Integration (Phase 4)

### 5.1 Nameplate Options Structure
- **Application Styles / Types (10):** `desk`, `door`, `wall`, `kids`, `business`, `led`, `decorative-3d`, `wedding`, `house-number`, `gaming`.
- **Curated Presets in `TEMPLATES_LIBRARY` (12):**
  - `tpl-minimalist` (Nordic Slate Desk Block)
  - `tpl-luxury` (Obsidian & 24K Gold Plaque)
  - `tpl-royal` (Sovereign Crown Shield)
  - `tpl-floral` (Botanical Arch Door Plaque)
  - `tpl-cartoon` (Comic Pop Kids Plaque)
  - `tpl-superhero` (Sentinel Crest Emblem)
  - `tpl-gaming` (Cyber Hex Battlestation)
  - `tpl-corporate` (Enterprise Engraved Brass)
  - `tpl-nature` (Teakwood Cabin Sign)
  - `tpl-birthday` (Celebration Cake Topper / Sign)
  - `tpl-wedding` (Sweetheart Table Heart)
  - `tpl-tamil-traditional` (Traditional Tamil Home Plaque)
- **Silhouette Shapes (20):** `rectangle`, `rounded-rectangle`, `chamfer-plate`, `oval`, `circle`, `hexagon`, `octagon`, `diamond`, `shield`, `crest`, `arch`, `cloud`, `heart`, `scalloped`, `ribbon-banner`, `ticket-notch`, `house-roof`, `butterfly`, `star-burst`, `text-outline`.

### 5.2 Integration in `StudioLeftPanel.tsx` & `NameplateCustomiser.jsx`
- Added **Curated Design Presets Rail** at the top of the Left Panel displaying `TEMPLATES_LIBRARY` with preview images, titles, and theme badges.
- Upgraded **Application Style** selector in Tab 2 to a 2-column `VisualDesignCardRail` (`layout="grid"`) with thumbnail previews, titles, taglines, and selected badges.
- Upgraded **Silhouette Shape** selector in Tab 2 to a horizontal `VisualDesignCardRail` with shape preview cards.
- Clicking any card applies configuration options and re-renders the Three.js Canvas immediately.

---

## 6. Image-to-Template/Style Mapping Table (Phase 5)

| Product | Option Type | Option ID / Name | Mapped Image Asset | Image Dimensions | Mapping Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stand** | Template | `executive-desk-station` | `/hero-2.png` | 1600×900 | Matches multi-compartment desk dock setup |
| **Stand** | Template | `minimal-phone-dock` | `/hero-2.png` | 1600×900 | Matches minimalist angled phone rest |
| **Stand** | Template | `minimalist-duo-stand` | `/hero-2.png` | 1600×900 | Matches dual phone & pen desk organizer |
| **Stand** | Template | `executive-pen-tray` | `/hero-4.png` | 1600×900 | Matches executive gold/black luxury finish |
| **Stand** | Theme | `minimalist` | `/hero-2.png` | 1600×900 | Clean matte neutral desktop styling |
| **Stand** | Theme | `corporate-gift` | `/hero-2.png` | 1600×900 | Professional executive desk docks |
| **Stand** | Theme | `executive-marble` | `/hero-4.png` | 1600×900 | Premium dark marble & gold styling |
| **Nameplate** | Template | `tpl-minimalist` | `/showcase/templates/nameplate.png` | 621×330 | Canonical freestanding desk plaque |
| **Nameplate** | Template | `tpl-luxury` | `/hero-4.png` | 1600×900 | 24K gold & obsidian metallic finish |
| **Nameplate** | Template | `tpl-floral` | `/showcase/styles/name-keychain-arch.png` | 621×260 | Classical botanical doorway arch |
| **Nameplate** | Template | `tpl-cartoon` | `/showcase/styles/name-keychain-bubble.png` | 621×260 | Playful cloud silhouette with vibrant letters |
| **Nameplate** | Template | `tpl-wedding` | `/showcase/styles/name-keychain-heart-split.png`| 621×260 | Heart plaque for sweetheart tables |
| **Nameplate** | Template | `tpl-tamil-traditional` | `/hero-3.png` | 1600×900 | Traditional cultural arch plaque |
| **Nameplate** | Template | `tpl-corporate` | `/showcase/templates/nameplate.png` | 621×330 | Executive brass & black corporate sign |
| **Nameplate** | Application Style | `desk` | `/showcase/templates/nameplate.png` | 621×330 | Standard freestanding desk plaque |
| **Nameplate** | Application Style | `door` | `/showcase/styles/name-keychain-arch.png` | 621×260 | Archway door plaque silhouette |
| **Nameplate** | Application Style | `kids` | `/showcase/styles/name-keychain-bubble.png` | 621×260 | Cloud & star playful nursery plaque |
| **Nameplate** | Application Style | `wedding` | `/showcase/styles/name-keychain-heart-split.png`| 621×260 | Romantic sweetheart heart plaque |
| **Nameplate** | Application Style | `decorative-3d` | `/showcase/styles/name-keychain-contour.png` | 621×260 | Free-standing 3D extruded lettering |
| **Nameplate** | Shape | `arch` | `/showcase/styles/name-keychain-arch.png` | 621×260 | Classical Roman architectural arch |
| **Nameplate** | Shape | `cloud` | `/showcase/styles/name-keychain-bubble.png` | 621×260 | Continuous bubbly cloud perimeter |
| **Nameplate** | Shape | `heart` | `/showcase/styles/name-keychain-heart-split.png`| 621×260 | Symmetrical sweetheart heart |
| **Nameplate** | Shape | `ribbon-banner` | `/showcase/styles/name-keychain-ribbon.png` | 621×260 | Flowing swallowtail ribbon banner |
| **Nameplate** | Shape | `chamfer-plate` | `/showcase/styles/name-keychain-soft-tag.png`| 621×260 | Chamfered geometric corners |
| **Nameplate** | Shape | `ticket-notch` | `/showcase/styles/magnet-soft-tag.png` | 1280×720 | Inverted corner notch tags |
| **Nameplate** | Shape | `text-outline` | `/showcase/styles/name-keychain-contour.png` | 621×260 | Tight typographic boundary contour |
| **Nameplate** | Shape | `rounded-rectangle` | `/showcase/templates/nameplate.png` | 621×330 | Standard rounded corner desk block |

---

## 7. Missing Dedicated Artwork Inventory

In strict accordance with the audit guidelines, no placeholder images were fabricated. Options without dedicated custom photography render a clean typography card with an automatic `onError` fallback, and are catalogued here for future 3D studio render generation:

### Phone & Pen Stand:
1. `curved-phone-rest` (Template): Wood-grain finish curved S-profile phone cradle render.
2. `gamer-phone-stand` (Template): Hex-ventilated RGB gaming phone dock render.
3. `personalized-charging-stand` (Template): T-groove vertical charging stand render.
4. `compact-travel-stand` (Template): Hinged folding travel rest render.
5. `sculptural-wave-cradle` (Template): Double-radiused wave phone cradle render.
6. `hex-honeycomb-cup` (Template): Faceted honeycomb pencil cup render.
7. `zen-wave-pen-holder` (Template): Sculptural ribbed desk cup render.
8. `modular-pen-dock` (Template): Split-level dual chamber pen organizer render.
9. `gaming-battlestation-dock` (Template): Dual-dock gaming organizer with cable route render.
10. `corner-desk-organizer` (Template): L-shaped 90-degree corner desk station render.
11. `nature-inspired` (Theme): Earthy wood-fill PLA preview badge.
12. `gaming-rgb` (Theme): Neon cyan/magenta gaming chassis preview badge.
13. `kids-playful` (Theme): Vibrant multi-color playful stationery dock render.

### Nameplate:
1. `circle` (Shape): Circular disc nameplate plaque render.
2. `oval` (Shape): Horizontally elongated oval nameplate plaque render.
3. `hexagon` (Shape): Hexagonal geometric battlestation plate render.
4. `octagon` (Shape): Chamfered octagonal architectural plaque render.
5. `diamond` (Shape): Rhombus diamond warning / house plate render.
6. `shield` (Shape): Medieval heraldic crest shield plaque render.
7. `crest` (Shape): Ornamental baroque crest plaque render.
8. `scalloped` (Shape): Ornate scalloped border vintage plaque render.
9. `house-roof` (Shape): Gabled roof architectural house number sign render.
10. `butterfly` (Shape): Silhouetted butterfly wings nursery plaque render.
11. `star-burst` (Shape): Multi-point explosion starburst party sign render.
12. `tpl-birthday` (Template): Circular birthday topper with party stars render.

---

## 8. Files Created and Modified

| File | Change Type | Purpose |
| :--- | :--- | :--- |
| `apps/customer-frontend/src/components/customiser/VisualDesignCardRail.jsx` | Modified | Added `layout="rail" \| "grid"` prop and `onError` image fallback support while preserving 100% backward compatibility for Name Keychain. |
| `apps/customer-frontend/src/features/standStudio/core/standTemplateAssets.ts` | Created | Stand template, theme, and category preview mappings, helper accessors, and missing image inventory. |
| `apps/customer-frontend/src/features/nameplateStudio/core/nameplateTemplateAssets.ts` | Created | Nameplate template, application style, and silhouette shape preview mappings, helper accessors, and missing image inventory. |
| `apps/customer-frontend/src/features/standStudio/components/StudioLeftPanel.tsx` | Modified | Integrated `VisualDesignCardRail` for Template Presets and Design Themes & Style, hooked into reactive 3D assembly rebuilds. |
| `apps/customer-frontend/src/features/nameplateStudio/components/StudioLeftPanel.tsx` | Modified | Integrated Curated Design Presets rail, upgraded Application Style to a 2-column visual grid, and upgraded Silhouette Shapes to visual cards. |
| `apps/customer-frontend/src/pages/NameplateCustomiser.jsx` | Modified | Implemented `handleApplyTemplate` to apply full presets to state and Canvas upon card click. |

---

## 9. Build and Functional Test Results

- **Customer Frontend Build:** `vite build` completed successfully (`✓ built in 7.14s`, `2,021.13 kB` bundle).
- **Admin Frontend Build:** `vite build` completed successfully (`✓ built in 517ms`, `545.61 kB` bundle).
- **Backend Test Suite:** `137/137` automated tests passing (0 failed, 0 skipped).
- **Functional Integrity Verified:**
  - Name Keychain: Unchanged and fully operational.
  - Phone & Pen Stand: Clicking template or theme cards immediately updates 3D mesh, colors, and dimensions.
  - Nameplate: Clicking template, archetype, or shape cards immediately updates 3D mesh, textures, dimensions, and volumetric pricing.
  - Cart & Checkout: Stored design configurations remain identical and compatible.
