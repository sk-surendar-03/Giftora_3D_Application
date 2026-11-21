# Giftora — Phone & Pen Stand 3D Template Image Specifications

**Document Status:** Production Reference Specification (Phase 2)  
**Scope:** Accurate 3D image-generation specifications for all 24 Phone & Pen Stand templates in Giftora 3D Application.  
**Target System:** `apps/customer-frontend/src/features/standStudio` and `apps/backend/src/modules/standDesigner`.

> [!NOTE]
> All geometry, dimensions, materials, and hex colors in this specification are derived directly from `templates.ts`, `defaults.ts`, `standBuilder.ts`, and `materials.ts`. Nothing is speculative or guessed.

## 1. Master Template Catalog & Authentic Asset Status

| # | Template ID | Display Name | Category | Design Theme | Dedicated Image Exists? | Image Path |
|---|---|---|---|---|---|---|
| 1 | `minimal-phone-dock` | **Minimal Phone Dock** | `phone-stand` | `minimalist` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 2 | `curved-phone-rest` | **Curved Phone Rest** | `phone-stand` | `nature-inspired` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 3 | `gamer-phone-stand` | **Gamer Phone Stand** | `phone-stand` | `gaming-rgb` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 4 | `personalized-charging-stand` | **Personalized Charging Stand** | `phone-stand` | `corporate-gift` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 5 | `foldable-hinge-stand` | **Hinged Travel Stand** | `phone-stand` | `industrial` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 6 | `landscape-cinema-cradle` | **Landscape Cinema Cradle** | `phone-stand` | `modern-geometric` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 7 | `executive-pen-cup` | **Executive Pen Cup** | `pen-holder` | `luxury-executive` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 8 | `hexagonal-pencil-holder` | **Hexagonal Pencil Holder** | `pen-holder` | `modern-geometric` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 9 | `honeycomb-pen-organizer` | **Honeycomb Pen Organizer** | `pen-holder` | `futuristic` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 10 | `multi-slot-pencil-rack` | **Multi-Slot Pencil Rack** | `pen-holder` | `industrial` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 11 | `wave-ribbed-cup` | **Wave Ribbed Vessel** | `pen-holder` | `cute-pastel` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 12 | `spiral-aesthetic-cup` | **Spiral Aesthetic Holder** | `pen-holder` | `minimalist` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 13 | `phone-pen-desk-mate` | **Phone + Pen Desk Mate** | `combined` | `minimalist` | ✅ Authentic | `/hero-2.png` |
| 14 | `dual-cup-phone-organizer` | **Dual Cup Phone Organizer** | `combined` | `modern-geometric` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 15 | `rear-pen-phone-cradle` | **Cradle + Rear Pen Tower** | `combined` | `futuristic` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 16 | `left-pen-right-phone` | **Left-Handed Pen + Phone Dock** | `combined` | `kids-student` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 17 | `luxury-name-desk-stand` | **Luxury Name Desk Stand** | `combined` | `luxury-executive` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 18 | `modular-workstation-organizer` | **Modular Workstation Organizer** | `desk-organizer` | `industrial` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 19 | `compact-corner-organizer` | **Compact Corner Desk Caddy** | `desk-organizer` | `minimalist` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 20 | `creator-desk-station` | **Creator Desk Station** | `desk-organizer` | `gaming-rgb` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 21 | `monogram-gift-plinth` | **Monogram Gift Plinth** | `personalized-gift` | `corporate-gift` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 22 | `pastel-heart-keepsake` | **Pastel Heart Keepsake Stand** | `personalized-gift` | `cute-pastel` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 23 | `botanical-engraved-gift` | **Botanical Engraved Desk Gift** | `personalized-gift` | `nature-inspired` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |
| 24 | `maker-gear-trophy-stand` | **Maker Gear Trophy Stand** | `personalized-gift` | `industrial` | ❌ Missing (Needs Gen) | *None (Clean Fallback)* |

---

## 2. Global Photographic & Visual Staging Standards

To ensure visual unity across the Giftora customizer rails, every generated preview image must strictly follow these staging parameters:

- **Camera Projection:** Perspective (36°–45° Field of View), simulating a 50mm–85mm architectural product lens.
- **Camera Angle:** 3/4 Elevated Isometric Beauty View (~45° horizontal azimuth, ~32°–35° vertical elevation). Must clearly show the front functional face, top entry/tray surface, and right-side depth profile.
- **Studio Lighting:** Three-point balanced studio softbox lighting:
  - Key Light: 45° front-left elevated soft directional light (neutral white 5200K, intensity 1.2).
  - Fill Light: 45° front-right subtle cool fill (intensity 0.65, hex `#94A3B8`).
  - Rim / Accent Light: Low rear-angled rim light to sculpt chamfered silhouettes and edge contours against the background.
- **Ground Plane & Shadow:** Soft, realistic ambient occlusion contact shadow on a seamless, neutral desk plane (very subtle slate-gray matte or neutral light warm studio backdrop `#F8FAFC` / `#0F172A` depending on theme contrast).
- **Aspect Ratio & Framing:** Aspect ratio 4:3 (1024x768). The 3D model should occupy ~78%–82% of the frame canvas with balanced margins.
- **Material Realism:** Authentic FDM 3D printed appearance — ultra-fine 0.16mm layer line micro-texture (subtle, clean, not messy), crisp planar facets, realistic polymer sheen (matte, silk-gloss, or wood-fill depending on specification).

---

## 3. Individual Template Specifications

### 3.1 `minimal-phone-dock` — Minimal Phone Dock
**Category:** `phone-stand` | **Theme:** `minimalist` (Minimalist) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Clean 68° angled desktop rest with bottom cable channel"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Standalone angled desktop phone cradle with 68° resting angle.
- **Base Geometry:** Rounded rectangular slab (Corner Radius: 6mm).
- **Backrest Structure:** Angled planar backplate tilted 22° from vertical with supportive rear triangular buttress fin.
- **Front Retention Lip:** 11mm high retaining wall with a central 16mm cable slot.

#### 2. Main Components & Structural Details
- **Cable Routing Tunnel:** Central pass-through slot (16mm wide) through front lip and base for charging cords.
- **Anti-Slip Recesses:** 4 circular cylindrical recesses on base underside for silicone pads.
- **Fillets & Bevels:** Smooth 0.5mm edge fillets along all exterior corners.

#### 3. Default Dimensions & Proportions
- **Base Dimensions:** Width 78mm × Depth 92mm × Thickness 5mm.
- **Backrest Dimensions:** Width 64mm × Height 90mm × Incline Angle 68°.
- **Cradle Channel:** Slot Depth 11.0mm (Lip Height: 11mm, Lip Width: 66mm).

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`.
- **Color Palette:**
  - Base / Main Body: `#1E293B` (Deep Navy Slate)
  - Backrest / Upright: `#334155` (Slate Gray)
  - Cup / Cylinder: `#475569`
  - Accent Trim / Lip: `#2563EB` (Cobalt Blue)
  - Text / Motif Color: `#F8FAFC`
- **Surface Sheen:** Matte non-reflective polymer with soft diffuse highlights.

#### 5. Default Text & Personalization
- **Status:** Personalization disabled by default for base unpersonalized preview; clean planar surface without embossed letters.

#### 6. Recommended Camera Angle & Presentation
- **Framing:** Elevated 3/4 isometric perspective (Azimuth: 42° right, Elevation: 32° above ground).
- **Focus Point:** Front center lip / base transition, depth of field keeping entire product sharp.

#### 7. Strict Negative Constraints (Do NOT Invent)
- Do NOT add fictitious branding logos, Apple/Samsung icons, or USB charging cables.
- Do NOT add unmodeled screws, metal rivets, rubber suction feet, or hinges.
- Do NOT add shiny chrome or glowing RGB lighting strips.
- Do NOT alter the resting angle (68°) or round sharp functional cable slots.
- Do NOT substitute generic smartphone dummy models inside the cradle; preview must showcase the stand geometry itself.

---

### 3.2 `curved-phone-rest` — Curved Phone Rest
**Category:** `phone-stand` | **Theme:** `nature-inspired` (Nature Inspired) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Sweeping continuous S-curve profile in warm wood-grain finish"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Standalone curved phone rest with sweeping continuous S-curve ergonomic Bezier profile.
- **Base Geometry:** Rounded rectangular slab (Corner Radius: 10mm).
- **Backrest Structure:** Continuous flowing S-curve profile with ergonomic Bezier transitions, double-radiused back support.
- **Front Retention Lip:** 12mm high retaining wall with smooth organic curvature.

#### 2. Main Components & Structural Details
- **Cable Routing Tunnel:** Central pass-through slot (15mm wide) through base.
- **Anti-Slip Recesses:** 4 circular recesses on underside.
- **Rear Support:** Seamless sculpted backrest that merges into base with no separate buttress fin.

#### 3. Default Dimensions & Proportions
- **Base Dimensions:** Width 80mm × Depth 96mm × Thickness 5.5mm.
- **Backrest Dimensions:** Width 66mm × Height 88mm × Incline Angle 64°.
- **Cradle Channel:** Slot Depth 11.0mm (Lip Height: 12mm, Lip Width: 66mm).

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `wood-grain`.
- **Color Palette:**
  - Base / Main Body: `#8B5E3C` (Warm Teakwood)
  - Backrest / Upright: `#6F4E37` (Dark Walnut)
  - Cup / Cylinder: `#A47551`
  - Accent Trim / Lip: `#15803D` (Forest Green)
  - Text / Motif Color: `#ECFDF5`
- **Surface Sheen:** Warm wood-fill composite texture with subtle organic fiber grain.

#### 5. Default Text & Personalization
- **Status:** Enabled.
- **Default Text:** `"FLOW"`
- **Typography Style:** `handwritten` (Font Size: 8.5mm, Letter Spacing: 1.1).
- **Relief Mode:** `engraved` (Depth: 1.6mm).
- **Placement:** Front lip surface.
- **Integrated 3D Motif:** `leaf` botanical emblem (Size: 11mm, engraved).

#### 6. Recommended Camera Angle & Presentation
- **Framing:** Elevated 3/4 isometric perspective highlighting the flowing side-profile S-curve.

#### 7. Strict Negative Constraints (Do NOT Invent)
- Do NOT render sharp angular corners; every transition must be smooth and organic.
- Do NOT add metallic or plastic trim; maintain the unified wood-composite look.

---

### 3.3 `gamer-phone-stand` — Gamer Phone Stand
**Category:** `phone-stand` | **Theme:** `gaming-rgb` (Gaming RGB) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Faceted hexagonal chassis with ventilated rear hex cutouts"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Aggressive faceted hexagonal desktop chassis with 70° resting angle.
- **Base Geometry:** Chamfered hexagonal footprint (Corner Radius: 3mm).
- **Backrest Structure:** Chamfered polygonal backplate with two stacked hexagonal cutout vents penetrating the plate.
- **Front Retention Lip:** 12mm high faceted retaining wall with angular styling.

#### 2. Main Components & Structural Details
- **Ventilation Cutouts:** Two centered 6-sided hexagonal cutouts (Radius: 8.5mm) through the backplate for passive device cooling.
- **Cable Routing Tunnel:** Integrated bottom channel for charging cables.
- **Chamfers:** 45° crisp architectural bevels on all outer edges.

#### 3. Default Dimensions & Proportions
- **Base Dimensions:** Width 88mm × Depth 100mm × Thickness 6mm.
- **Backrest Dimensions:** Width 72mm × Height 96mm × Incline Angle 70°.
- **Cradle Channel:** Slot Depth 11.0mm (Lip Height: 12mm, Lip Width: 66mm).

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte` (Gaming High-Contrast).
- **Color Palette:**
  - Base / Main Body: `#09090B` (Stealth Matte Black)
  - Backrest / Upright: `#18181B` (Chassis Charcoal)
  - Cup / Cylinder: `#27272A`
  - Accent Trim / Lip: `#EC4899` (Hot Magenta)
  - Text / Motif Color: `#06B6D4` (Electric Cyan)
- **Surface Sheen:** Matte non-reflective stealth polymer with vibrant cyan/magenta colorway.

#### 5. Default Text & Personalization
- **Status:** Enabled.
- **Default Text:** `"APEX"`
- **Typography Style:** `futuristic` (Font Size: 8.5mm).
- **Relief Mode:** `raised` (Extrusion: 1.6mm).
- **Placement:** Front lip surface.
- **Integrated 3D Motif:** `hexagon` geometric crest (Size: 11mm).

#### 6. Recommended Camera Angle & Presentation
- **Framing:** Elevated 3/4 perspective looking slightly through the rear hexagonal cutouts.

#### 7. Strict Negative Constraints (Do NOT Invent)
- Do NOT add glowing neon LED light strips or battery packs; contrast is achieved strictly via colored PLA filament.
- Do NOT round off the faceted chamfered corners.

---

### 3.4 `personalized-charging-stand` — Personalized Charging Stand
**Category:** `phone-stand` | **Theme:** `corporate-gift` (Corporate Gift) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Vertical charging dock with rear T-groove cord pass-through and nameplate"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Upright desktop charging dock (74° angle) with prominent front nameplate shelf.
- **Base Geometry:** Rounded rectangular slab (Corner Radius: 6.5mm).
- **Backrest Structure:** Upright backplate with deep rear vertical T-groove channel for cable anchoring.
- **Front Retention Lip:** 13mm high retaining wall with central cable notch.

#### 2. Main Components & Structural Details
- **T-Groove Cable Channel:** Precision vertical slot channel (16mm wide × 32mm deep) running up the backrest.
- **Front Plinth:** Angled forward nameplate plinth integrated into the base.

#### 3. Default Dimensions & Proportions
- **Base Dimensions:** Width 86mm × Depth 98mm × Thickness 6.5mm.
- **Backrest Dimensions:** Width 68mm × Height 98mm × Incline Angle 74°.
- **Cradle Channel:** Slot Depth 11.0mm.

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `silk-gloss`.
- **Color Palette:**
  - Base: `#0F172A` (Executive Midnight Blue)
  - Backrest: `#1E293B` (Deep Navy)
  - Accent Trim: `#0EA5E9` (Sky Blue)
  - Text Color: `#F1F5F9`

#### 5. Default Text & Personalization
- **Status:** Enabled.
- **Default Text:** `"GIFTORA"` (Mode: `raised`, Font: `bold`, Motif: `star`).

---

### 3.5 `foldable-hinge-stand` — Hinged Travel Stand
**Category:** `phone-stand` | **Theme:** `industrial` (Industrial) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Print-ready interlocking hinge-knuckle stand with pin clearance"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Two-piece articulating travel stand featuring functional 3-knuckle interlocking hinge.
- **Base Geometry:** Rounded rectangular base plate with integrated hinge barrels.
- **Backrest Structure:** Angled back leaf connected via horizontal cylindrical hinge pin (Radius: 2.4mm).
- **Knuckle Configuration:** 3 hinge knuckles along X (`[-backW*0.3, 0, backW*0.3]`, outer radius 5.5mm).

#### 2. Main Components & Structural Details
- **Mechanical Hinge:** Print-in-place knuckle hinge assembly with visible 0.4mm clearances.
- **Front Lip:** Low-profile retaining lip with dual cable notches.

#### 3. Default Dimensions & Proportions
- **Base Dimensions:** Width 76mm × Depth 90mm × Thickness 6mm.
- **Backrest Dimensions:** Width 62mm × Height 84mm × Angle 66°.

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `metallic-silver`.
- **Color Palette:** Base `#374151` (Gunmetal), Back `#4B5563` (Graphite), Accent `#F59E0B` (Safety Amber).

#### 5. Default Text & Personalization
- **Status:** Enabled. Text `"MOBIL"` (Mode: `engraved`, Font: `bold`).

---

### 3.6 `landscape-cinema-cradle` — Landscape Cinema Cradle
**Category:** `phone-stand` | **Theme:** `modern-geometric` (Modern Geometric) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Wide horizontal cradle engineered for video calls and streaming"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Ultra-wide horizontal media stand engineered specifically for landscape phone orientation.
- **Base Geometry:** Wide rounded rectangular base (Width: 126mm, Depth: 84mm).
- **Backrest Structure:** Wide 118mm backplate supported by wide reinforced central buttress.
- **Front Lip:** Continuous 116mm wide retaining lip with twin speaker acoustic sound-reflection channels.

#### 2. Default Dimensions & Proportions
- **Base:** Width 126mm × Depth 84mm × Thickness 5mm. Backrest Width 118mm × Height 72mm × Angle 62°.

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`. Palette: Base `#18181B`, Back `#27272A`, Accent `#6366F1` (Indigo).

#### 4. Default Text & Personalization
- **Status:** Enabled. Text `"STREAM"` (Mode: `raised`, Font: `modern-sans`).

---

### 3.7 `executive-pen-cup` — Executive Pen Cup
**Category:** `pen-holder` | **Theme:** `luxury-executive` (Luxury Executive) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Heavy-walled architectural cylinder with chamfered brass-tone plaque"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Substantial architectural cylinder with weighted solid base and heavy 3.8mm walls.
- **Base Geometry:** Circular weighted plinth base (Diameter: 72mm).
- **Interior Cavity:** Deep circular pen chamber (Depth: 96mm) with smooth rounded bottom fillet.

#### 2. Main Components & Structural Details
- **Front Plaque:** Integrated chamfered rectangular plaque relief on cylinder front face.
- **Rim Profile:** Precision 1.0mm 45° chamfered upper rim.

#### 3. Default Dimensions & Proportions
- **Dimensions:** Outer Diameter 72mm × Total Height 104mm × Wall Thickness 3.8mm × Base Thickness 8mm.

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `metallic-gold`.
- **Color Palette:** Body `#18181B` (Obsidian), Accent/Plaque `#D4AF37` (Brushed Gold).

#### 5. Default Text & Personalization
- **Status:** Enabled. Text `"DIRECTOR"` engraved into gold front plaque.

---

### 3.8 `hexagonal-pencil-holder` — Hexagonal Pencil Holder
**Category:** `pen-holder` | **Theme:** `modern-geometric` (Modern Geometric) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Crisp six-sided faceted prism cup with reinforced rim"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Regular six-sided hexagonal prism cup with crisp planar faces and vertical edges.
- **Base Geometry:** Hexagonal solid base (Exterior Diameter: 70mm across vertices).

#### 2. Default Dimensions & Proportions
- **Dimensions:** Outer Diameter 70mm × Height 98mm × Wall Thickness 3.2mm × Bottom Thickness 5mm.

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`. Palette: Body `#0F172A`, Rim Accent `#06B6D4` (Cyan).

#### 4. Default Text & Personalization
- **Status:** Enabled. Text `"HEXA"` raised on one hexagonal face.

---

### 3.9 `honeycomb-pen-organizer` — Honeycomb Pen Organizer
**Category:** `pen-holder` | **Theme:** `futuristic` (Futuristic) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Hexagonal lattice divider grid separating pens, styluses, and markers"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Hexagonal exterior housing containing an internal 7-cell honeycomb divider lattice.
- **Lattice Architecture:** 1 central hexagonal tube surrounded by 6 perimeter hexagonal chambers.

#### 2. Main Components & Structural Details
- **Chamber Dividers:** 2.2mm thick internal honeycomb walls extending down to the solid base.
- **Upper Rim:** Stepped chamfered rim exposing individual honeycomb cell mouths.

#### 3. Default Dimensions & Proportions
- **Dimensions:** Outer Diameter 78mm × Height 102mm × Individual Cell Diameter ~22mm.

#### 4. Default Material, Colors & Surface Finish
- **Finish Tier:** `gradient`. Palette: Body `#E5E7EB` (Pearl White), Dividers `#0284C7` (Electric Blue).

#### 5. Default Text & Personalization
- **Status:** Enabled. Text `"MATRIX"` engraved on front base bezel.

---

### 3.10 `multi-slot-pencil-rack` — Multi-Slot Pencil Rack
**Category:** `pen-holder` | **Theme:** `industrial` (Industrial) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Precision 9-bore vertical rack with staggered 11 mm pen sockets"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Solid rectangular monolith with 9 precision vertical cylindrical bores.
- **Bore Layout:** 3×3 grid of 12mm cylindrical bores with staggered row spacing.

#### 2. Default Dimensions & Proportions
- **Dimensions:** Width 82mm × Depth 82mm × Height 80mm. Bore Diameter 12mm × Depth 72mm.

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `metallic-silver`. Palette: Body `#374151`, Bore Chamfers `#D97706`.

#### 4. Default Text & Personalization
- **Status:** Enabled. Text `"TOOL"` engraved on side flank.

---

### 3.11 `wave-ribbed-cup` — Wave Ribbed Vessel
**Category:** `pen-holder` | **Theme:** `cute-pastel` (Cute Pastel) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Fluted sinusoidal vertical ribs for tactile desk appeal"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Tactile cylindrical cup with 16 fluted sinusoidal vertical ribs undulating around the circumference.
- **Rib Geometry:** Continuous sine wave cross-section (Rib Count: 16, Radial Depth: 1.8mm).

#### 2. Default Dimensions & Proportions
- **Dimensions:** Outer Diameter 68mm × Height 94mm × Wall Thickness 3.2mm.

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte` (Pastel). Palette: Body `#FDF2F8` (Soft Pink), Rim `#EC4899`, Text `#F472B6`.

#### 4. Default Text & Personalization
- **Status:** Enabled. Text `"STUDY"` (Mode: `raised`, Font: `rounded`).

---

### 3.12 `spiral-aesthetic-cup` — Spiral Aesthetic Holder
**Category:** `pen-holder` | **Theme:** `minimalist` (Minimalist) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Helical twisted polygon flutes climbing a weighted round base"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Sculptural fluted vase with 14 helical twisted flutes rotating through a 0.45 turn spiral from base to rim.

#### 2. Default Dimensions & Proportions
- **Dimensions:** Outer Diameter 70mm × Height 98mm × Helical Spiral Twist 162° (0.45 turn).

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`. Palette: Body `#1E293B`, Spiral Ridges `#38BDF8`.

---

### 3.13 `phone-pen-desk-mate` — Phone + Pen Desk Mate
**Category:** `combined` | **Theme:** `minimalist` (Minimalist) | **Dedicated Image:** ✅ Authentic (`/hero-2.png`)  
*Tagline:* "Phone stand on left, cylindrical pen cup on right, unified solid base"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Monolithic unified organizer featuring an angled phone cradle on the left and a cylindrical pen cup on the right.
- **Footprint:** Single solid baseplate with rounded rectangular corners (Total Width: ~164mm, Depth: ~96mm).
- **Existing Asset Status:** Genuinely represented by `/hero-2.png` in production.

---

### 3.14 `dual-cup-phone-organizer` — Dual Cup Phone Organizer
**Category:** `combined` | **Theme:** `modern-geometric` (Modern Geometric) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Symmetrical central phone cradle flanked by twin hexagonal pen cups"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Perfectly symmetrical workstation stand: central angled phone cradle flanked on left and right by twin hexagonal pen cups.
- **Base Geometry:** Continuous solid footprint encompassing all 3 modules.

#### 2. Default Dimensions & Proportions
- **Total Span:** Width 218mm × Depth 96mm × Height 96mm.
- **Left/Right Cups:** Hexagonal cups (Diameter: 60mm each). Center Cradle: Width 74mm.

#### 3. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`. Palette: Base `#18181B`, Hex Cups `#27272A`, Accents `#6366F1`.

---

### 3.15 `rear-pen-phone-cradle` — Cradle + Rear Pen Tower
**Category:** `combined` | **Theme:** `futuristic` (Futuristic) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Compact footprint placing pen storage directly behind the phone backrest"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Space-saving compact desktop footprint: elevated pen storage tower located directly behind the angled phone backrest.
- **Footprint:** Narrow width (~86mm), elongated depth (~128mm).

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `gradient`. Palette: Base `#0F172A`, Tower `#1E293B`, Accents `#06B6D4`.

---

### 3.16 `left-pen-right-phone` — Left-Handed Pen + Phone Dock
**Category:** `combined` | **Theme:** `kids-student` (Kids & Student) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Pen cup positioned on the left for natural left-hand reach"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Left-handed ergonomic workstation: tall rounded pen cup on the left side, angled phone stand on the right side.
- **Total Span:** Width 162mm × Depth 94mm.

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte` (Vibrant). Palette: Base `#0284C7`, Pen Cup `#38BDF8`, Accent `#F59E0B`.

---

### 3.17 `luxury-name-desk-stand` — Luxury Name Desk Stand
**Category:** `combined` | **Theme:** `luxury-executive` (Luxury Executive) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Two-part executive assembly with raised brass-tone nameplate"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Executive two-tiered plinth with raised brass-tone personalized nameplate on the front bevel, phone cradle on left, executive cup on right.
- **Plinth Geometry:** Dual-stepped chamfered baseplate with 45° angled nameplate shelf.

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `metallic-gold`. Palette: Body `#09090B` (Slate Obsidian), Plaque/Accents `#D4AF37` (24K Gold).

#### 3. Default Text & Personalization
- **Status:** Enabled. Text `"EXECUTIVE"` in raised serif letters over brushed gold plate.

---

### 3.18 `modular-workstation-organizer` — Modular Workstation Organizer
**Category:** `desk-organizer` | **Theme:** `industrial` (Industrial) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Complete workstation with angled phone dock, multi-slot pen rack, and clip tray"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** 3-zone comprehensive desktop command station: left angled phone dock with cable groove, center 6-bore pen rack, right shallow paperclip/trinket catch-all tray.
- **Footprint:** Solid unified rectangular tray platform (Width: 236mm × Depth: 104mm × Base Thickness: 6mm).
- **Accessory Tray:** Rectangular pocket (Width: 54mm, Depth: 48mm, Wall Height: 14mm).

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `metallic-silver`. Palette: Base `#1F2937`, Rack `#374151`, Tray Accent `#F59E0B`.

#### 3. Default Text & Personalization
- **Status:** Enabled. Text `"WORK"` on front plinth.

---

### 3.19 `compact-corner-organizer` — Compact Corner Desk Caddy
**Category:** `desk-organizer` | **Theme:** `minimalist` (Minimalist) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Space-saving L-profile desk caddy with dual-height cup and front pocket"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** 90° right-angled L-profile organizer engineered to nest into desk corners.
- **Features:** Dual-height stepped pen cups along the corner vertex, front recessed phone rest, side clip pocket.

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte`. Palette: Body `#1E293B`, Interior `#334155`, Accent `#2563EB`.

---

### 3.20 `creator-desk-station` — Creator Desk Station
**Category:** `desk-organizer` | **Theme:** `gaming-rgb` (Gaming RGB) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Dual-tone station with hex pen bay, SD/clip tray, and cable-routed phone stand"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Dual-tone creator battlestation: faceted phone dock with cable routes, hexagonal stylus cup, and dedicated SD card / flash drive slot organizer.

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `matte` (Cyberpunk). Palette: Base `#09090B`, Accents `#EC4899` & `#06B6D4`.

---

### 3.21 `monogram-gift-plinth` — Monogram Gift Plinth
**Category:** `personalized-gift` | **Theme:** `corporate-gift` (Corporate Gift) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Stepped executive plinth with raised monogram initials and pen socket"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Heavy stepped presentation award plinth featuring large 3D monogram initials and a single vertical luxury pen plinth socket.

#### 2. Default Material, Colors & Surface Finish
- **Finish Tier:** `silk-gloss`. Palette: Base `#0F172A`, Monogram Initials `#D4AF37` (Silk Gold).
- **Default Monogram:** `"GIFT"` (Raised 3.2mm, Font: `bold`).

---

### 3.22 `pastel-heart-keepsake` — Pastel Heart Keepsake Stand
**Category:** `personalized-gift` | **Theme:** `cute-pastel` (Cute Pastel) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Rounded pastel gift stand featuring a 3D heart motif and custom script name"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Soft rounded organic gift plinth with sculpted 3D heart emblem and single pen socket.
- **Default Material & Colors:** Finish `matte`. Palette: Base `#FCE7F3` (Soft Pink), Heart Emblem `#F43F5E` (Rose).
- **Default Text:** `"SWEET"` (Font: `rounded`, Motif: `heart`).

---

### 3.23 `botanical-engraved-gift` — Botanical Engraved Desk Gift
**Category:** `personalized-gift` | **Theme:** `nature-inspired` (Nature Inspired) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Wood-look stand with CSG-engraved nameplate and sculpted leaf emblem"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Wood-look sculptured stand with CSG-engraved nameplate and 3D sculpted leaf relief emblem.
- **Default Material & Colors:** Finish `wood-grain`. Palette: Base `#78350F`, Back `#92400E`, Leaf Accent `#16A34A`.
- **Default Text:** `"NATURE"` (Engraved intaglio relief, Motif: `leaf`).

---

### 3.24 `maker-gear-trophy-stand` — Maker Gear Trophy Stand
**Category:** `personalized-gift` | **Theme:** `industrial` (Industrial) | **Dedicated Image:** ❌ Missing  
*Tagline:* "Mechanical gear-accented phone & pen award stand for engineers"

#### 1. Geometry & Silhouette
- **Primary Silhouette:** Engineering trophy stand featuring an authentic involute mechanical gear silhouette with interlocking cog teeth, front phone cradle, and dual pen sockets.
- **Default Material & Colors:** Finish `metallic-silver`. Palette: Base `#1F2937`, Gear Cog `#F59E0B` (Amber Gold), Accents `#9CA3AF`.
- **Default Text:** `"MAKER"` (Raised 2.4mm, Font: `bold`, Motif: `gear`).
