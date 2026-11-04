// Idempotent catalog seed — categories and products ONLY.
// Safe to re-run: every write is an upsert keyed by the real unique slug
// column (see Category.slug / Product.slug in schema.prisma), so running
// this again updates the same rows instead of creating duplicates or
// touching anything else in the database (no users/carts/orders/addresses
// are read or written here).
//
// Products are scoped to the two categories the existing customizer
// actually supports (see productMapping.js's templateOptionsForCategory:
// "Nameplates" -> the nameplate template, everything else -> the
// name-keychain/articulated-name templates) and to the real supported
// materials (Standard PLA / Silk Metallic PLA / Metal / Acrylic — "Wood"
// was intentionally removed from the catalog in an earlier phase and is
// not reintroduced here).
//
// Run with: node prisma/seedCatalog.js

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function img(seedText) {
  // A real, stable placeholder image service — returns an actual image for
  // any text, so seeded products render a real picture in the customer
  // frontend instead of a broken <img> link.
  return `https://placehold.co/600x600/png?text=${encodeURIComponent(seedText)}`
}

const STANDARD_PLA_COLORS = [
  { label: 'White', hex: '#f5f3ee' },
  { label: 'Black', hex: '#1a1a1a' },
  { label: 'Red', hex: '#b33a3a' },
  { label: 'Natural', hex: '#e8d9b5' },
]
const SILK_METALLIC_PLA_COLORS = [
  { label: 'Gold', hex: '#c9a227' },
  { label: 'Silver', hex: '#c0c0c0' },
  { label: 'Bronze', hex: '#8c6239' },
  { label: 'Copper', hex: '#b5651d' },
  { label: 'Steel Grey', hex: '#71797e' },
]
const METAL_COLORS = [
  { label: 'Steel Silver', hex: '#c4c8cc' },
  { label: 'Matte Black', hex: '#2a2a2a' },
  { label: 'Gold Finish', hex: '#b9923f' },
]
const ACRYLIC_COLORS = [
  { label: 'Clear', hex: '#eef2f3' },
  { label: 'Frosted White', hex: '#f7f5f0' },
  { label: 'Black', hex: '#161412' },
]

const categories = [
  { slug: 'keychains', name: 'Keychains' },
  { slug: 'nameplates', name: 'Nameplates' },
]

const products = [
  {
    slug: 'classic-name-keychain',
    name: 'Classic Name Keychain',
    description: 'A personalised PLA keychain engraved with your name or custom text — our best-selling everyday gift.',
    priceCents: 29900,
    categorySlug: 'keychains',
    materials: ['Standard PLA', 'Silk Metallic PLA'],
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)', 'Large (7 cm)'],
    colorsByMaterial: { 'Standard PLA': STANDARD_PLA_COLORS, 'Silk Metallic PLA': SILK_METALLIC_PLA_COLORS },
    images: [img('Classic Name Keychain')],
  },
  {
    slug: 'articulated-name-keychain',
    name: 'Articulated Name Keychain',
    description: 'Print-in-place articulated letters that move and jingle — a playful, eye-catching take on the classic name keychain.',
    priceCents: 39900,
    categorySlug: 'keychains',
    materials: ['Standard PLA', 'Silk Metallic PLA'],
    sizes: ['Medium (5.5 cm)', 'Large (7 cm)'],
    colorsByMaterial: { 'Standard PLA': STANDARD_PLA_COLORS, 'Silk Metallic PLA': SILK_METALLIC_PLA_COLORS },
    images: [img('Articulated Name Keychain')],
  },
  {
    slug: 'metal-name-keychain',
    name: 'Metal Name Keychain',
    description: 'A durable stainless steel keychain with laser-engraved personalisation — built to last for years of everyday use.',
    priceCents: 34900,
    categorySlug: 'keychains',
    materials: ['Metal'],
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)'],
    colorsByMaterial: { Metal: METAL_COLORS },
    images: [img('Metal Name Keychain')],
  },
  {
    slug: 'heart-split-couples-keychain',
    name: "Couple's Heart Keychain",
    description: 'A paired heart-split design with each half personalised for two people — a sweet matching gift for couples or best friends.',
    priceCents: 44900,
    categorySlug: 'keychains',
    materials: ['Standard PLA', 'Silk Metallic PLA'],
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)'],
    colorsByMaterial: { 'Standard PLA': STANDARD_PLA_COLORS, 'Silk Metallic PLA': SILK_METALLIC_PLA_COLORS },
    images: [img("Couple's Heart Keychain")],
  },
  {
    slug: 'pet-name-tag-keychain',
    name: 'Pet Name Tag Keychain',
    description: 'A lightweight, rounded keychain tag personalised with your pet’s name — also makes a cute matching collar charm.',
    priceCents: 24900,
    categorySlug: 'keychains',
    materials: ['Standard PLA'],
    sizes: ['Small (4 cm)'],
    colorsByMaterial: { 'Standard PLA': STANDARD_PLA_COLORS },
    images: [img('Pet Name Tag Keychain')],
  },
  {
    slug: 'minimalist-bar-keychain',
    name: 'Minimalist Bar Keychain',
    description: 'A clean, understated stainless steel bar engraved with a name or short message — a subtle everyday-carry gift.',
    priceCents: 32900,
    categorySlug: 'keychains',
    materials: ['Metal'],
    sizes: ['Medium (5.5 cm)'],
    colorsByMaterial: { Metal: METAL_COLORS },
    images: [img('Minimalist Bar Keychain')],
  },
  {
    slug: 'acrylic-desk-nameplate',
    name: 'Acrylic Desk Nameplate',
    description: 'A sleek acrylic nameplate for desks, customised with your text and font — a polished finishing touch for any workspace.',
    priceCents: 49900,
    categorySlug: 'nameplates',
    materials: ['Acrylic'],
    sizes: ['Desk (15 cm)'],
    colorsByMaterial: { Acrylic: ACRYLIC_COLORS },
    images: [img('Acrylic Desk Nameplate')],
  },
  {
    slug: 'acrylic-door-nameplate',
    name: 'Acrylic Door Nameplate',
    description: 'A larger acrylic nameplate sized for doors and entryways, personalised with your name or household name.',
    priceCents: 64900,
    categorySlug: 'nameplates',
    materials: ['Acrylic'],
    sizes: ['Door (20 cm)'],
    colorsByMaterial: { Acrylic: ACRYLIC_COLORS },
    images: [img('Acrylic Door Nameplate')],
  },
  {
    slug: 'premium-metal-nameplate',
    name: 'Premium Metal Nameplate',
    description: 'A substantial laser-engraved stainless steel nameplate for an executive desk or office door.',
    priceCents: 89900,
    categorySlug: 'nameplates',
    materials: ['Metal'],
    sizes: ['Desk (15 cm)', 'Door (20 cm)'],
    colorsByMaterial: { Metal: METAL_COLORS },
    images: [img('Premium Metal Nameplate')],
  },
  {
    slug: 'silk-pla-desk-nameplate',
    name: 'Silk PLA Desk Nameplate',
    description: 'A glossy, metallic-finish PLA desk nameplate in your choice of shimmering colours — a vibrant, budget-friendly alternative to metal.',
    priceCents: 39900,
    categorySlug: 'nameplates',
    materials: ['Silk Metallic PLA'],
    sizes: ['Desk (15 cm)'],
    colorsByMaterial: { 'Silk Metallic PLA': SILK_METALLIC_PLA_COLORS },
    images: [img('Silk PLA Desk Nameplate')],
  },
]

async function main() {
  const categoryIdBySlug = {}

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    })
    categoryIdBySlug[category.slug] = row.id
  }

  for (const product of products) {
    const { categorySlug, ...data } = product
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...data, categoryId: categoryIdBySlug[categorySlug] },
      create: { ...data, categoryId: categoryIdBySlug[categorySlug] },
    })
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
