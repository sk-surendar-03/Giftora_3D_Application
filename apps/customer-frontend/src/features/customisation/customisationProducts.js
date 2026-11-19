/**
 * Registry of 3D Customisable Products for the Customer Hub.
 * Strict Scope: Name Keychain and Phone & Pen Stand.
 */
export const CUSTOMISATION_PRODUCTS = [
  {
    id: 'name-keychain',
    name: 'Name Keychain',
    subtitle: 'Dual-Color Typography Keychain',
    description: 'Create personalised name keychains with custom text, fonts and styles.',
    longDescription: 'Design a bespoke keychain with multi-layer color combinations, custom typography, adjustable thicknesses, and articulated joint options. Preview in interactive 3D and order direct.',
    priceHint: 'From ₹199',
    badge: 'Most Popular',
    badgeTone: 'gold',
    status: 'active',
    route: '/customise',
    image: '/hero-products.png',
    features: [
      'Interactive 3D geometry engine',
      'Dual-color print combinations',
      'Articulated letter links & charms',
      'High-durability PLA material',
    ],
    ctaText: 'Customise Now',
  },
  {
    id: 'phone-pen-stand',
    name: 'Phone & Pen Stand',
    subtitle: 'Modular Desktop Docks & Organisers',
    description: 'Design personalised phone stands, pen holders and combined desk organisers.',
    longDescription: 'Craft an industrial-grade desk dock tailored to your smartphone and workspace. Choose your layout, personalize with custom embossed text or logos, and preview with real-time solid rendering.',
    priceHint: 'From ₹500',
    badge: 'New Studio',
    badgeTone: 'emerald',
    status: 'active',
    route: '/customise/stand',
    image: '/hero-2.png',
    features: [
      '5 Studio configurations (Phone, Pen, Combined)',
      'Custom embossed name or corporate logo',
      '9 Premium finishes (Marble, Metallic, Matte)',
      'Exact volumetric pricing & STL generation',
    ],
    ctaText: 'Customise Now',
  },
]
