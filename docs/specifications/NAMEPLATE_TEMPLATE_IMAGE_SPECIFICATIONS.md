# Giftora — Nameplate 3D Template Image Specifications

**Document Status:** Production Reference Specification (Phase 2)  
**Scope:** Accurate 3D image-generation specifications for all 15 Nameplate templates in Giftora 3D Application.  
**Target System:** `apps/customer-frontend/src/features/nameplateStudio` and `apps/backend/src/modules/nameplateDesigner`.

> [!NOTE]
> All geometry, base shapes, font hierarchies, dimensions, and hex colors in this specification are extracted directly from `presets.ts`, `baseGeometry.ts`, `mountingGeometry.ts`, and `textGeometry.ts`. Nothing is speculative or guessed.

## 1. Master Template Catalog & Authentic Asset Status

| # | Template ID | Display Name | Theme Category | Application Type | Silhouette Shape | Dedicated Image Exists? | Image Path |
|---|---|---|---|---|---|---|---|
| 1 | `tpl-minimalist` | **Nordic Slate Desk Block** | `Minimalist` | `desk` | `rounded-rectangle` | ✅ Authentic | `/showcase/templates/nameplate.png` |
| 2 | `tpl-luxury` | **Obsidian & 24K Gold Plaque** | `Luxury` | `desk` | `rounded-rectangle` | ✅ Authentic | `/hero-4.png` |
| 3 | `tpl-royal` | **Sovereign Crown Shield** | `Royal` | `wall` | `shield` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 4 | `tpl-floral` | **Botanical Arch Door Plaque** | `Floral` | `door` | `arch` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 5 | `tpl-cartoon` | **Comic Pop Kids Plaque** | `Cartoon` | `kids` | `cloud` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 6 | `tpl-superhero` | **Sentinel Crest Emblem** | `Superhero` | `kids` | `shield` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 7 | `tpl-gaming` | **Cyber Hex Battlestation** | `Gaming` | `gaming` | `hexagon` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 8 | `tpl-corporate` | **Enterprise Engraved Brass** | `Corporate` | `business` | `rounded-rectangle` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 9 | `tpl-nature` | **Teakwood Cabin Sign** | `Nature` | `house-number` | `rectangle` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 10 | `tpl-birthday` | **Celebration Cake Topper / Sign** | `Birthday` | `decorative-3d` | `circle` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 11 | `tpl-wedding` | **Sweetheart Table Heart** | `Wedding` | `wedding` | `heart` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 12 | `tpl-tamil-traditional` | **Traditional Tamil Home Plaque** | `Traditional Indian` | `door` | `arch` | ✅ Authentic | `/hero-3.png` |
| 13 | `tpl-nursery` | **Little Star Nursery Cloud** | `Kids & Nursery` | `kids` | `cloud` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 14 | `tpl-led-cutout` | **Backlit LED Stencil Sign** | `Gaming` | `led` | `rectangle` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 15 | `tpl-3d-text-only` | **Freestanding 3D Word Block** | `Minimalist` | `decorative-3d` | `text-outline` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |

---

## 2. Global Photographic & Visual Staging Standards

To ensure visual harmony across the Nameplate studio, every generated preview image must strictly follow these staging parameters:

- **Camera Projection:** Perspective (36° Field of View), reproducing the exact camera rig in `NameplateCanvas.tsx`.
- **Camera Angle:** Elevated Isometric 3/4 View (`camPos = [dist * 0.72, dist * 0.58, dist * 0.88]`). Tilted to display the top surface typography relief, front face, and crisp multi-layer extrusion thickness.
- **Studio Lighting:**
  - Key Directional Light: Position `[120, 200, 150]`, intensity 1.15, crisp directional casting subtle drop shadows behind raised letters.
  - Ambient / Fill Light: Position `[-120, 80, -120]`, intensity 0.65, soft slate-gray (`#94A3B8`).
  - Underfill: Position `[0, -100, 50]`, intensity 0.25 (`#475569`) to illuminate base bevels.
- **Mounting Staging:**
  - Desk Plaques (`freestanding-desk`): Displayed resting on its rear integrated kickstand feet tilted at 18°.
  - Wall / Door Plaques (`flat-wall`): Displayed hovering slightly over a premium architectural wall surface (e.g. subtle fine plaster, limestone or oak texture) with soft ambient contact shadow.
  - Freestanding 3D Words (`text-only-3d`): Displayed freestanding on a tabletop base runner without backing plate.
- **Aspect Ratio & Framing:** Aspect ratio 4:3 (1024x768). Nameplate centered, occupying ~80% of width.
- **Material Realism:** Sharp dual-color filament extrusion. Crisp 0.2mm layer height transition between base plate and raised typography. No blurry blending at the boundary layer.

---

## 3. Individual Template Specifications

### 3.1 `tpl-minimalist` — Nordic Slate Desk Block
**Theme:** `Minimalist` | **Application Type:** `desk` | **Shape:** `rounded-rectangle` | **Dedicated Image:** ✅ Authentic (`/showcase/templates/nameplate.png`)  
*Subtitle:* "Clean geometric proportions with crisp matte contrast"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `rounded-rectangle` — Planar rectangle with smooth 6mm rounded radius corners.
- **Perimeter Border:** Disabled — Clean borderless edge with polished chamfer.
- **Mounting System:** `freestanding-desk` (Rear desk stand angled at 18°, reinforced with triangular support ribs).

#### 2. Main Components & Structural Details
- **Base Plate Slab:** Solid extruded volume (Width: 180mm × Height: 50mm × Thickness: 4.5mm).
- **Lettering Extrusion:** Mode `raised` — Solid 3D letters projecting +3.2mm above the plate surface.

#### 3. Default Material, Colors & Surface Finish
- **Material Finish:** `matte-pla`.
- **Base Color:** `#1E293B` (Nordic Deep Slate)
- **Line 1 Text Color:** `#F8FAFC` (Pure Matte White)
- **Line 2 Text Color:** `#CBD5E1` (Cool Muted Gray)

#### 4. Default Text Lines & Typography Hierarchy
- **Line 1:** `"ARJUN MEHTA"` (Font: `outfit`, Size: 15pt, Letter Spacing: 1.4, Bold: Yes, Color: `#F8FAFC`)
- **Line 2:** `"PRODUCT ARCHITECT"` (Font: `dm-sans`, Size: 6pt, Letter Spacing: 1.6, Bold: No, Color: `#CBD5E1`)

---

### 3.2 `tpl-luxury` — Obsidian & 24K Gold Plaque
**Theme:** `Luxury` | **Application Type:** `desk` | **Shape:** `rounded-rectangle` | **Dedicated Image:** ✅ Authentic (`/hero-4.png`)  
*Subtitle:* "Silk gold lettering raised over deep charcoal chamfered plate"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `rounded-rectangle` (Width: 200mm × Height: 55mm × Thickness: 5.5mm, Corner Radius: 4mm).
- **Perimeter Border:** Enabled — 2.2mm thick raised gold perimeter border ridge.
- **Mounting System:** `freestanding-desk` (Desk stand angled at 18°).

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `silk-pla`.
- **Base Color:** `#0A0A0A` (Obsidian Charcoal)
- **Border & Line 1 Color:** `#D4AF37` (24K Silk Gold)
- **Line 2 Color:** `#E2E8F0`

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"VIKRAMADITYA SINGHANIA"` (Font: `cinzel`, Size: 13.5pt, Bold: Yes, Color: `#D4AF37`)
- **Line 2:** `"MANAGING DIRECTOR & CEO"` (Font: `plus-jakarta`, Size: 6pt, Bold: True, Color: `#E2E8F0`)

---

### 3.3 `tpl-royal` — Sovereign Crown Shield
**Theme:** `Royal` | **Application Type:** `wall` | **Shape:** `shield` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Regal serif crest with ornamental crown relief"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `shield` — Classical heraldic heater shield with pointed bottom apex, curved side flanks, and flat top with sharp corner spurs.
- **Perimeter Border:** Enabled — Raised ornate shield border ridge (`#D4AF37`).
- **Mounting System:** `flat-wall` with dual rear keyhole hanging slots.
- **Integrated 3D Relief Ornament:** `crown` sovereign imperial crown relief centered above Line 1.

#### 2. Default Dimensions & Proportions
- **Plate Dimensions:** Width 160mm × Height 80mm × Base Thickness 5.0mm.
- **Lettering Mode:** `raised` (+3.4mm projection).

#### 3. Default Material, Colors & Surface Finish
- **Material Finish:** `metallic-pla`.
- **Base Color:** `#1E1B4B` (Royal Imperial Navy)
- **Border & Crown Color:** `#D4AF37` (Imperial Gold)
- **Line 1 Text Color:** `#FDE047` (Regal Gold)
- **Line 2 Text Color:** `#E0E7FF` (Soft Ivory)

#### 4. Default Text Lines & Typography Hierarchy
- **Line 1:** `"THE ROYALS"` (Font: `cinzel`, Size: 17pt, Bold: Yes, Letter Spacing: 1.5, Color: `#FDE047`)
- **Line 2:** `"ESTD. 2018"` (Font: `playfair`, Size: 7pt, Bold: No, Letter Spacing: 2.0, Color: `#E0E7FF`)

#### 5. Strict Negative Constraints (Do NOT Invent)
- Do NOT add hanging metal chains or keyrings.
- Do NOT flatten the heraldic shield shape into a generic rectangle.

---

### 3.4 `tpl-floral` — Botanical Arch Door Plaque
**Theme:** `Floral` | **Application Type:** `door` | **Shape:** `arch` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Soft sage arch framed with corner floral reliefs"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `arch` — Semicircular roman arch top transitioning into flat vertical side pillars and horizontal bottom base.
- **Perimeter Border:** Enabled — Raised fluted border molding (`#15803D`).
- **Integrated 3D Relief Ornament:** `floral-corner` — Sculpted botanical corner vine / leaf filigree reliefs in top corners.

#### 2. Default Dimensions & Proportions
- **Plate Dimensions:** Width 150mm × Height 75mm × Base Thickness 4.8mm.

#### 3. Default Material, Colors & Surface Finish
- **Material Finish:** `matte-pla`.
- **Base Color:** `#ECFDF5` (Soft Botanical Sage Green)
- **Border & Foliage Color:** `#15803D` (Forest Green)
- **Line 1 Text Color:** `#064E3B` (Deep Emerald)
- **Line 2 Text Color:** `#047857`

#### 4. Default Text Lines & Typography Hierarchy
- **Line 1:** `"THE GREENWOODS"` (Font: `great-vibes`, Size: 18pt, Cursive Script, Color: `#064E3B`)
- **Line 2:** `"HOUSE NO. 42"` (Font: `cormorant`, Size: 7.5pt, Classic Serif, Color: `#047857`)

---

### 3.5 `tpl-cartoon` — Comic Pop Kids Plaque
**Theme:** `Cartoon` | **Application Type:** `kids` | **Shape:** `cloud` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Chunky cartoon typography with vibrant contrast"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `cloud` — Playful scalloped cloud contour formed by overlapping tangent circular lobes.
- **Perimeter Border:** Enabled — Chunky 3mm rounded bumper border (`#F43F5E`).
- **Integrated Ornament:** `stars` — 3D relief cartoon stars scattered around typography.

#### 2. Default Dimensions & Proportions
- **Plate Dimensions:** Width 170mm × Height 65mm × Base Thickness 5.0mm.

#### 3. Default Material, Colors & Surface Finish
- **Material Finish:** `dual-color` (High-contrast gloss).
- **Base Color:** `#FEF08A` (Vibrant Sunshine Yellow)
- **Border & Accent Color:** `#F43F5E` (Pop Red-Pink)
- **Line 1 Text Color:** `#4F46E5` (Electric Indigo)

#### 4. Default Text Lines & Typography Hierarchy
- **Line 1:** `"AARAV'S DEN"` (Font: `fredoka`, Size: 17pt, Ultra-Bold Rounded, Color: `#4F46E5`)
- **Line 2:** `"KEEP OUT · GAMING IN PROGRESS"` (Font: `space-grotesk`, Size: 6pt, Bold, Color: `#E11D48`)

---

### 3.6 `tpl-superhero` — Sentinel Crest Emblem
**Theme:** `Superhero` | **Application Type:** `kids` | **Shape:** `shield` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Original geometric superhero shield with bold bevels"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `shield` — Aggressive angular heraldic shield with dual bevel facets.
- **Perimeter Border:** Enabled — 3.5mm wide faceted bevel border (`#DC2626`).
- **Integrated Ornament:** `wings-emblem` geometric crest.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `dual-color`.
- **Base Color:** `#1E293B` (Hero Slate)
- **Border Color:** `#DC2626` (Crimson)
- **Line 1 Color:** `#FBBF24` (Hero Gold)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"KAVIN"` (Font: `bebas-neue`, Size: 22pt, Ultra-Condensed Bold, Color: `#FBBF24`)
- **Line 2:** `"PROTECTOR OF THE REALM"` (Font: `plus-jakarta`, Size: 6.5pt, Color: `#E2E8F0`)

---

### 3.7 `tpl-gaming` — Cyber Hex Battlestation
**Theme:** `Gaming` | **Application Type:** `gaming` | **Shape:** `hexagon` | **Dedicated Image:** ❌ Missing  
*Tagline:* "Chamfered hexagon base with LED rim diffuser channel"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `hexagon` — Regular 6-sided geometric hexagon with sharp 120° vertices.
- **Perimeter Border:** Enabled — Chamfered edge border with recessed light diffuser channel.
- **Integrated Ornament:** `gaming-brackets` angled corner HUD brackets.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `matte-pla` (Cyberpunk Dark).
- **Base Color:** `#09090B` (Stealth Matte Black)
- **Border Color:** `#A855F7` (Neon Purple)
- **Line 1 Color:** `#06B6D4` (Cyberpunk Cyan)
- **Line 2 Color:** `#E2E8F0`

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"CYBER_NINJA"` (Font: `orbitron`, Size: 16pt, Futuristic Stencil, Color: `#06B6D4`)
- **Line 2:** `"LVL 99 BATTLESTATION"` (Font: `space-grotesk`, Size: 6.5pt, Color: `#A855F7`)

---

### 3.8 `tpl-corporate` — Enterprise Engraved Brass
**Theme:** `Corporate` | **Application Type:** `business` | **Shape:** `rounded-rectangle` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Precision recessed engraving for boardrooms & reception"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `rounded-rectangle` (Width: 210mm × Height: 55mm × Thickness: 5.0mm, Corner Radius: 4mm).
- **Lettering Mode:** `engraved` — Precision intaglio grooves carved -1.8mm into the plate surface.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `metallic-pla` (Brushed Brass Plaque).
- **Base Color:** `#B45309` (Warm Architectural Brass)
- **Engraved Infill Color:** `#1C1917` (Deep Obsidian Enamel)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"BOARDROOM 01"` (Font: `outfit`, Size: 14pt, Bold: Yes, Infill Color: `#1C1917`)
- **Line 2:** `"EXECUTIVE SUITE"` (Font: `dm-sans`, Size: 7pt, Bold: No, Infill Color: `#292524`)

---

### 3.9 `tpl-nature` — Teakwood Cabin Sign
**Theme:** `Nature` | **Application Type:** `house-number` | **Shape:** `rectangle` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Wood-fill PLA texture with carved forest serif lettering"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `rectangle` — Rustic rectangular timber slab with crisp corners.
- **Mounting System:** Dual precision screw holes (Diameter: 4mm, Inset: 8mm).
- **Lettering Mode:** `engraved` — Deep carved rustic lettering.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `wood-pla`.
- **Base Color:** `#78350F` (Deep Teakwood Brown)
- **Carved Letter Infill:** `#FEF3C7` (Natural Birch Infill)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"WHISPERING PINES"` (Font: `cormorant`, Size: 15pt, Classic Carved Serif, Color: `#FEF3C7`)
- **Line 2:** `"NO. 128"` (Font: `dm-sans`, Size: 8pt, Color: `#FDE68A`)

---

### 3.10 `tpl-birthday` — Celebration Cake Topper / Sign
**Theme:** `Birthday` | **Application Type:** `decorative-3d` | **Shape:** `circle` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Festive rounded sign for milestone birthdays & parties"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `circle` — Perfectly circular disc medallion plaque (Diameter: 120mm).
- **Integrated Ornament:** `stars` — Raised celebratory confetti star reliefs.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `silk-pla` (Party Pearl).
- **Base Color:** `#FDF4FF` (Pearl Lavender)
- **Border & Text Color:** `#D946EF` (Vibrant Fuchsia)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"HAPPY 1ST BIRTHDAY"` (Font: `fredoka`, Size: 13pt, Rounded Bold, Color: `#D946EF`)
- **Line 2:** `"RHEA"` (Font: `great-vibes`, Size: 22pt, Flourished Script, Color: `#A21CAF`)

---

### 3.11 `tpl-wedding` — Sweetheart Table Heart
**Theme:** `Wedding` | **Application Type:** `wedding` | **Shape:** `heart` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Romantic script lettering on pearl marble heart base"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `heart` — Symmetrical dual-lobed sweetheart silhouette with central cleft and bottom taper.
- **Mounting System:** `freestanding-desk` (Desk stand angled at 18° for tabletop display).

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `marble-pla`.
- **Base Color:** `#F8FAFC` (Carrara White Marble)
- **Lettering & Border Color:** `#F43F5E` (Romantic Rose) / `#D4AF37` (Soft Gold)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"MR. & MRS. SHARMA"` (Font: `great-vibes`, Size: 19pt, Romantic Script, Color: `#F43F5E`)
- **Line 2:** `"DECEMBER 14, 2026"` (Font: `cormorant`, Size: 7pt, Elegant Serif, Color: `#BE123C`)

---

### 3.12 `tpl-tamil-traditional` — Traditional Tamil Home Plaque
**Theme:** `Traditional Indian` | **Application Type:** `door` | **Shape:** `arch` | **Dedicated Image:** ✅ Authentic (`/hero-3.png`)  
*Subtitle:* "Bilingual Tamil & English temple-arch doorway plaque"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `arch` — Classical South Indian temple doorway arch with ornate stepped gopuram / temple-arch motif.
- **Existing Asset Status:** Genuinely represented by `/hero-3.png` in production.

---

### 3.13 `tpl-nursery` — Little Star Nursery Cloud
**Theme:** `Kids & Nursery` | **Application Type:** `kids` | **Shape:** `cloud` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Soft pastel cloud nameplate for crib wall or shelf"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `cloud` — Soft billowing cloud contour with rounded baby-safe curves (Radius: 10mm).
- **Integrated Ornament:** `moon-stars` crescent moon and sleepy stars relief.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `matte-pla` (Pastel Nursery).
- **Base Color:** `#F0F9FF` (Soft Sky Blue)
- **Border & Star Color:** `#FDE047` (Pastel Starlight Yellow)
- **Text Color:** `#0284C7` (Baby Blue)

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"ANANYA'S ROOM"` (Font: `fredoka`, Size: 16pt, Playful Bubble, Color: `#0284C7`)
- **Line 2:** `"SWEET DREAMS LITTLE ONE"` (Font: `dm-sans`, Size: 6pt, Color: `#38BDF8`)

---

### 3.14 `tpl-led-cutout` — Backlit LED Stencil Sign
**Theme:** `Gaming` | **Application Type:** `led` | **Shape:** `rectangle` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Cut-out letter channels over translucent LED diffuser plate"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `rectangle` (Width: 200mm × Height: 60mm × Thickness: 5.5mm).
- **Lettering Mode:** `cut-out` — Complete stencil letter apertures penetrating entirely through the dark faceplate.
- **Diffuser System:** Rear-mounted translucent white plate illuminated by internal LED backlight.

#### 2. Default Material, Colors & Surface Finish
- **Material Finish:** `dual-color` (Backlit).
- **Faceplate Color:** `#09090B` (Opaque Matte Jet Black)
- **LED Glow Accent:** `#38BDF8` (Bright Electric Cyan LED Glow radiating through stencil cutouts).

#### 3. Default Text Lines & Typography Hierarchy
- **Line 1:** `"STREAMING NOW"` (Font: `orbitron`, Size: 18pt, Stencil Cut-Out, Glow Color: `#38BDF8`)
- **Line 2:** `"ON AIR"` (Font: `space-grotesk`, Size: 8pt, Stencil Cut-Out, Glow Color: `#38BDF8`)

---

### 3.15 `tpl-3d-text-only` — Freestanding 3D Word Block
**Theme:** `Minimalist` | **Application Type:** `decorative-3d` | **Shape:** `text-outline` | **Dedicated Image:** ❌ Missing  
*Subtitle:* "Solid extruded letters joined on a sleek base bar"

#### 1. Geometry & Silhouette Shape
- **Base Silhouette:** `text-outline` — No solid rectangular backing plate! Letterforms themselves form the physical 3D object, joined at their bases by a continuous low-profile baseline runner bar (Height: 4mm, Depth: 16mm).
- **Mounting System:** `text-only-3d` (Freestanding on any flat desk surface).

#### 2. Default Dimensions & Proportions
- **Total Span:** Width ~160mm × Height ~42mm × Total Extrusion Depth 22mm.
- **Letter Thickness:** Solid 22mm thick freestanding letters with subtle 0.8mm top-face bevel.

#### 3. Default Material, Colors & Surface Finish
- **Material Finish:** `matte-pla`.
- **Word Color:** `#1E293B` (Nordic Slate)
- **Baseline Runner Color:** `#0F172A` (Deep Shadow)

#### 4. Default Text Lines & Typography Hierarchy
- **Line 1:** `"CREATE"` (Font: `outfit`, Size: 28pt, All-Caps Ultra-Bold, Letter Spacing: 0.95 for interlocking structural contact)
- **Line 2:** None (Single solid freestanding wordmark).

#### 5. Strict Negative Constraints (Do NOT Invent)
- Do NOT add a backing plaque or background frame; the letters MUST stand independently on their baseline runner.
- Do NOT separate letters so they float in mid-air; baseline connection must be structurally continuous.
