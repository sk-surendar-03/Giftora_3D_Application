# Third-Party Notices

This document lists the open-source software and font assets bundled with or used to build
this project ("Giftora", derived from Open Keychain), together with their licenses, copyright
owners, and any conditions on use. It supplements, and does not replace, the project's own
[LICENSE](LICENSE) and [TRADEMARKS.md](TRADEMARKS.md).

## 1. This project's own license

Open Keychain (`package.json` name: `open-keychain`, repository
`https://github.com/capynq/open-keychain.git`, homepage `https://open-keychain.com/`) is
licensed under the **MIT License**, copyright (c) 2026 capynq. See [LICENSE](LICENSE) for the
full text (also mirrored at `LICENSES/MIT.txt`).

- **Commercial use:** permitted.
- **Required notice:** the copyright notice and permission notice from `LICENSE` must be
  included in copies or substantial portions of the software.
- **Trademark:** the MIT grant does **not** extend to the "Open Keychain" name, logo, or hosted
  domain — see [TRADEMARKS.md](TRADEMARKS.md). A modified or independently hosted build (such as
  Giftora) must use distinct branding and must not imply it is the official Open Keychain
  service.
- No source files in `src/`, `scripts/`, or `tools/` carry copyright headers or SPDX identifiers
  different from this project license — a repository-wide search for `Copyright`,
  `SPDX-License-Identifier`, and `@license` found no matches outside this notice and the font
  license files. The STL/3MF export serializers
  (`src/infrastructure/export/stl-serializer.ts`, `three-mf-serializer.ts`) are original,
  first-party code with no indication of being ported from another project.

## 2. NPM dependencies

All licenses below were read directly from each installed package's own `package.json`
`license` field in `node_modules/` (the authoritative source for the exact installed version),
not assumed from the package's reputation.

### Runtime dependencies

| Package | Version | License | Commercial use |
|---|---|---|---|
| `@floating-ui/react` | ^0.27.20 | MIT | Yes |
| `embla-carousel-react` | ^8.6.0 | MIT | Yes |
| `fflate` | 0.8.3 | MIT | Yes |
| `i18next` | ^26.4.2 | MIT | Yes |
| `i18next-browser-languagedetector` | ^8.2.1 | MIT | Yes |
| `lucide-react` | ^1.53.0 | ISC | Yes |
| `manifold-3d` | 3.5.4 | Apache-2.0 | Yes |
| `opentype.js` | 2.0.0 | MIT | Yes |
| `posthog-js` | ^1.438.3 | Apache-2.0 AND MIT (dual, mixed by file) | Yes |
| `react` | 19.3.0 | MIT | Yes |
| `react-dom` | 19.3.0 | MIT | Yes |
| `react-i18next` | ^17.0.16 | MIT | Yes |
| `react-router` | ^8.4.0 | MIT | Yes |
| `simple-icons` | ^16.35.0 | CC0-1.0 | Yes (see note) |
| `three` | 0.186.1 | MIT | Yes |
| `tsx` | 4.23.15 | MIT | Yes |

**Notes:**
- **MIT / ISC**: require retaining the copyright/permission notice in distributed copies; no
  copyleft, no restriction on commercial use or modification. MIT and ISC texts are both
  included (`LICENSES/MIT.txt`, `LICENSES/ISC.txt`); ISC is functionally equivalent to MIT.
- **Apache-2.0** (`manifold-3d`, and `posthog-js`'s Apache-licensed files): permits commercial
  use, modification, and distribution; requires retaining copyright/attribution notices and a
  copy of the license, and requires stating changes made to Apache-licensed files if
  redistributed in modified form. Includes an express patent grant. No copyleft. Text at
  `LICENSES/Apache-2.0.txt`.
- **`posthog-js`** ships as "(Apache-2.0 AND MIT)" — different files/modules under each license;
  both are permissive and compatible, and both texts are included.
- **`simple-icons`**: the **icon SVGs/data** are released under **CC0-1.0** (public-domain
  dedication — no attribution required, unrestricted commercial use). Brand names/logos
  depicted by the icons may still be trademarks of their respective owners; CC0 covers only the
  icon artwork/package code, not third-party trademark rights in the brands depicted. No
  attribution is legally required for CC0, but if this project only uses a handful of icons from
  this package, confirm at build time that no additional brand-usage guidelines apply to the
  specific marks used.

### Development dependencies (build/test tooling only — not distributed with the app)

| Package | Version | License |
|---|---|---|
| `@commitlint/cli` | 21.2.3 | MIT |
| `@commitlint/config-conventional` | 21.2.3 | MIT |
| `@eslint/js` | 10.0.1 | MIT |
| `@playwright/test` | 1.64.0 | Apache-2.0 |
| `@types/*` (node, react, react-dom, three) | various | MIT (DefinitelyTyped) |
| `@typescript/native` (resolves to `typescript@^7.0.2`) | 7.0.2 | Apache-2.0 |
| `typescript` (aliased to `npm:@typescript/typescript6@6.0.2`) | 6.0.2 | Apache-2.0 |
| `@vitejs/plugin-react` | 6.1.2 | MIT |
| `eslint` | 10.12.0 | MIT |
| `eslint-config-prettier` | 10.1.8 | MIT |
| `eslint-plugin-i18next` | 6.1.5 | ISC |
| `eslint-plugin-no-barrel-files` | 2.2.0 | ISC |
| `eslint-plugin-perfectionist` | 5.12.1 | MIT |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT |
| `eslint-plugin-react-refresh` | 0.5.7 | MIT |
| `husky` | 9.1.7 | MIT |
| `jsdom` | 30.1.2 | MIT |
| `lint-staged` | 17.6.0 | MIT |
| `prettier` | 3.9.9 | MIT |
| `sharp` | 0.35.5 | Apache-2.0 |
| `typescript-eslint` | 8.71.1 | MIT |
| `vite` | 8.3.4 | MIT |
| `vitest` | 5.0.3 | MIT |
| `webmcp-types` | 0.1.10 | MIT |

**Note on the TypeScript aliasing:** the project uses two package-alias entries —
`"@typescript/native": "npm:typescript@^7.0.2"` (the real `typescript` package pinned to its 7.x
native-compiler line, installed under the `@typescript/native` name) and
`"typescript": "npm:@typescript/typescript6@6.0.2"` (the `@typescript/typescript6` package,
a TypeScript 6 compatibility build, installed under the `typescript` name for ESLint-parser
compatibility, per `README.md`/`CONTRIBUTING.md`). Both resolve to Microsoft's TypeScript
compiler and are **Apache-2.0** licensed; no separate/different license applies to either alias.
Dev dependencies are build-time only and are not redistributed as part of the shipped
`dist/` web application, so their licenses impose no distribution obligations on the built app,
but are listed here for completeness and supply-chain transparency.

## 3. Bundled fonts

All 22 fonts bundled in `public/fonts/*.ttf` are distributed under the **SIL Open Font License,
Version 1.1 (OFL-1.1)**, with per-family license/copyright files already present at
`public/fonts/licenses/<family>.txt` (verified: every `.ttf` in `public/fonts/` has a matching
license file; none were found missing or unclear).

| Font family | File | Copyright (from license file) | License |
|---|---|---|---|
| Amatic SC | amatic-sc.ttf | 2015 The Amatic SC Project Authors | OFL-1.1 |
| Bad Script | bad-script.ttf | 2011 The Bad Script Project Authors | OFL-1.1 |
| Baloo 2 | baloo2.ttf | 2019 The Baloo 2 Project Authors | OFL-1.1 |
| Balsamiq Sans | balsamiq-sans.ttf | 2011 The Balsamiq Sans Project Authors | OFL-1.1 |
| Bree Serif | bree-serif.ttf | 2011 TypeTogether, RFN "Bree"/"Bree Serif" | OFL-1.1 |
| Bungee | bungee.ttf | 2023 The Bungee Project Authors | OFL-1.1 |
| Caveat | caveat.ttf | 2014 The Caveat Project Authors | OFL-1.1 |
| Comforter | comforter.ttf | 2015 The Comforter Project Authors | OFL-1.1 |
| Comforter Brush | comforter-brush.ttf | 2015 The Comforter Brush Project Authors | OFL-1.1 |
| Fredoka | fredoka.ttf | 2016 The Fredoka Project Authors | OFL-1.1 |
| Kalam | kalam.ttf | 2014 Indian Type Foundry | OFL-1.1 |
| Lobster | lobster.ttf | 2010 The Lobster Project Authors, RFN "Lobster" | OFL-1.1 |
| Marck Script | marck-script.ttf | 2011 Denis Masharov & Marck Fogel, RFN "Marck Script" | OFL-1.1 |
| Montserrat | montserrat.ttf | 2024 The Montserrat.Git Project Authors | OFL-1.1 |
| Neucha | neucha.ttf | 2008–2010 Jovanny Lemonad | OFL-1.1 |
| Nunito | nunito.ttf | 2014 The Nunito Project Authors | OFL-1.1 |
| Oswald | oswald.ttf | 2016 The Oswald Project Authors | OFL-1.1 |
| Pangolin | pangolin.ttf | 2016 The Pangolin Project Authors | OFL-1.1 |
| Playpen Sans | playpen-sans.ttf | 2023 TypeTogether | OFL-1.1 |
| Quicksand | quicksand.ttf | 2011 The Quicksand Project Authors, RFN "Quicksand" | OFL-1.1 |
| Rubik | rubik.ttf | 2015 The Rubik Project Authors | OFL-1.1 |
| Shantell Sans | shantell-sans.ttf | 2022 The Shantell Sans Project Authors | OFL-1.1 |
| Underdog | underdog.ttf | 2012 Sergey Steblina & Jovanny Lemonad, RFN "Underdog" | OFL-1.1 |

**OFL-1.1 conditions (apply to every font above):**
- **Commercial use:** permitted, including embedding in a commercial product/app and in
  user-generated output (e.g. a 3D-printed keychain whose text uses one of these fonts).
- **May be bundled** with software (as this project does) and used, studied, modified, and
  redistributed, alone or as part of a bundle, with or without modification.
- **Restriction:** the font software itself **may not be sold by itself** (standalone sale of
  the font files is prohibited); it may only be sold as part of a larger software bundle.
- **Reserved Font Names** (several families reserve their name, e.g. "Bree"/"Bree Serif",
  "Lobster", "Marck Script", "Quicksand", "Underdog") may not be used to market a *modified*
  version of that specific font.
- Each font's copyright notice and license text must remain with the font software in all
  copies — already satisfied by the existing `public/fonts/licenses/<family>.txt` files, which
  must **not** be removed or altered.
- No attribution is required in the application UI itself; the per-font license files satisfy
  the "license accompanies the font" requirement.

OFL-1.1 full text: `LICENSES/OFL-1.1.txt` (identical to the text already embedded in each
`public/fonts/licenses/*.txt` file).

## 4. Vendored / adapted source code

No vendored or adapted third-party source code was found in `src/`, `scripts/`, or `tools/`.
A repository-wide search for copyright headers, SPDX identifiers, and `@license` annotations
outside `public/fonts/licenses/` returned no matches. The STL serializer
(`src/infrastructure/export/stl-serializer.ts`) and 3MF serializer
(`src/infrastructure/export/three-mf-serializer.ts`) are original, first-party implementations
written against the public STL and 3MF file-format specifications; they contain no header
comments or code fragments attributing them to another project.

## 5. Summary table

See [`dependency-license-report.md`](dependency-license-report.md) for the full flat
package-by-package table.

## 6. Restricted / copyleft / needs-review items

**None found.** Every runtime dependency, dev dependency, and bundled font resolves to a
permissive license (MIT, ISC, Apache-2.0, CC0-1.0, or OFL-1.1). No GPL, LGPL, AGPL, commercial,
proprietary, "UNLICENSED", or custom/non-standard license terms were found anywhere in
`package.json`, the installed `node_modules` package metadata, or the bundled font set.
