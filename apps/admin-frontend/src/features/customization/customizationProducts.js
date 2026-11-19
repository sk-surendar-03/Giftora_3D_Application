/**
 * Registry of 3D Customizable products for JAS 3D Printing / Giftora.
 * Strict Scope: Name Keychain and Phone & Pen Stand.
 */
export const CUSTOMIZATION_PRODUCTS = [
  {
    id: 'name-keychain',
    name: 'Name Keychain',
    subtitle: 'Personalised 3D Typography Keychain',
    description: 'Create personalised name keychains with custom text, fonts and styles. Features multi-layer dual-color printing, customizable thicknesses, and articulated joints.',
    status: 'active',
    statusLabel: 'Active',
    badge: 'Popular Studio',
    badgeColor: 'emerald',
    manageRoute: '/customization/name-keychain',
    customerRoute: 'https://www.jasvel3dmakers.co.in/customise',
    thumbnail: '/hero-products.png',
    stats: [
      { label: 'Pricing Model', value: 'Per-character + Base' },
      { label: 'Colors', value: 'Admin Palette' },
      { label: 'Sizes / Thickness', value: 'Dynamic tiers' },
    ],
    tags: ['Dual Color', 'Articulated', 'Manifold CSG'],
  },
  {
    id: 'phone-pen-stand',
    name: 'Phone & Pen Stand',
    subtitle: 'Custom Desktop Organizers & Docks',
    description: 'Design personalised phone stands, pen holders and combined desk organisers. Features real-time 3D solid modeling, custom name embossing, and volume-based pricing.',
    status: 'active',
    statusLabel: 'Active',
    badge: 'New Studio',
    badgeColor: 'amber',
    manageRoute: '/customization/phone-pen-stand',
    customerRoute: 'https://www.jasvel3dmakers.co.in/customise/stand',
    thumbnail: '/hero-2.png',
    stats: [
      { label: 'Categories', value: '5 Studio Styles' },
      { label: 'Pricing Model', value: 'Base + Volume (cm³)' },
      { label: 'Customization', value: '9 Finishes · 10 Themes' },
    ],
    tags: ['Volume Pricing', 'STL Generation', 'Real-time 3D'],
  },
]
