# mapaPH Hub

[![Version](https://img.shields.io/badge/version-2.1.0-1a4d2e.svg)](https://github.com/Shiiroi/mapaph/releases/tag/v2.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-1a4d2e.svg)](https://github.com/Shiiroi/mapaph/blob/main/LICENSE)
[![Website](https://img.shields.io/badge/website-mapaph.com-1a4d2e.svg)](https://www.mapaph.com)

mapaPH is an open-source civic cartography platform for the Philippines. This repository contains the source code for the central hub website at [mapaph.com](https://www.mapaph.com), including 10 built-in interactive tools, technical reference guides, and API documentation.

## Built-in Tools & Utilities

All 10 built-in utilities run client-side with complete server-side HTML pre-rendering:

| Tool                              | Route                                                                    | Description                                                                       |
| :-------------------------------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **PSGC Lookup & Decoder**         | [`/tools/psgc-lookup`](https://www.mapaph.com/tools/psgc-lookup)         | Search 1,742 geographic divisions and decode 9-digit PSGC codes.                  |
| **PRS92 / WGS84 Converter**       | [`/tools/coordinates`](https://www.mapaph.com/tools/coordinates)         | Convert coordinates between WGS84 GPS and Philippine Reference System 1992.       |
| **ZIP Code Lookup**               | [`/tools/zip-codes`](https://www.mapaph.com/tools/zip-codes)             | Search 2,139 Philippine postal delivery codes across all provinces and cities.    |
| **Commute Fare Estimator**        | [`/tools/fare-calculator`](https://www.mapaph.com/tools/fare-calculator) | Calculate official LTFRB fares for jeepneys, buses, UV Express, and taxis.        |
| **Walkability Analyzer**          | [`/tools/walkability`](https://www.mapaph.com/tools/walkability)         | Measure 15-minute walking radii and pedestrian catchment areas.                   |
| **Rail Transit Map & Fare Guide** | [`/tools/rail-transit`](https://www.mapaph.com/tools/rail-transit)       | View station fare matrices for LRT-1, LRT-2, MRT-3, and MRT-7.                    |
| **Expressway Toll Calculator**    | [`/tools/toll-calculator`](https://www.mapaph.com/tools/toll-calculator) | Calculate toll rates for NLEX, SLEX, SCTEX, TPLEX, CALAX, and Skyway.             |
| **EDSA Carousel Busway Guide**    | [`/tools/edsa-carousel`](https://www.mapaph.com/tools/edsa-carousel)     | Plan station-to-station journeys and calculate fares along the EDSA bus corridor. |
| **Kilometer Post Locator**        | [`/tools/kilometer-posts`](https://www.mapaph.com/tools/kilometer-posts) | Locate highway milestones along national highways from regional KM 0 benchmarks.  |
| **All Tools Directory**           | [`/tools`](https://www.mapaph.com/tools)                                 | Complete directory and searchable catalog for all civic mapping tools.            |

## External Ecosystem Tools

| Tool     | Status          | Repository                                      | Live URL                                   |
| :------- | :-------------- | :---------------------------------------------- | :----------------------------------------- |
| **Lens** | Active (v1.1.0) | [Shiiroi/mapa](https://github.com/Shiiroi/mapa) | [lens.mapaph.com](https://lens.mapaph.com) |

## Documentation Guides

The hub hosts technical guides for developers and GIS analysts:

- [PSGC Reference Guide](https://www.mapaph.com/docs/psgc): Code structure and administrative hierarchy.
- [PRS92 vs WGS84 Guide](https://www.mapaph.com/docs/prs92-wgs84-guide): Datum shifts, PTM zones, and formulas.
- [GeoJSON Guide](https://www.mapaph.com/docs/geojson-guide): RFC 7946 standards and coordinates order.
- [Free Philippine GIS Sources](https://www.mapaph.com/docs/philippine-gis-sources): Open spatial data catalogs.
- [Open Civic Data Sources](https://www.mapaph.com/docs/data-sources): PSA, COA, COMELEC, and LTFRB datasets.
- [Lens Visualizer Manual](https://www.mapaph.com/docs/lens): TopoJSON compression and choropleth metrics.

## Tech Stack

- **Framework**: [Astro 7](https://astro.build) (Static Site Generation)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Language**: TypeScript
- **Search Engine Optimization**: Server-side pre-rendering, automated XML sitemaps, JSON-LD schema graphs
- **Deployment**: Vercel Edge Network
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 22.12.0 or higher
- pnpm 9 or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Shiiroi/mapaph.git
cd mapaph
pnpm install
```

### Development Server

Start the local development server:

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build and Verification

Generate the production bundle:

```bash
pnpm build
```

Run TypeScript and Astro diagnostic checks:

```bash
pnpm check
```

Run Prettier formatting checks:

```bash
pnpm format:check
```

Audit page prose word counts and anti-slop rules:

```bash
pnpm run audit:content
```

## Contributing

We welcome contributions. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Follow these rules for code contributions:

1. Create a feature branch from `main`. Do not push directly to `main`.
2. Format all commits using [Conventional Commits](https://www.conventionalcommits.org) specifications.
3. Ensure `pnpm check`, `pnpm format:check`, and `pnpm run audit:content` pass cleanly.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## License

Source code is available under the [MIT License](./LICENSE). Primary statistical and transit datasets remain in the public domain under Section 176 of Republic Act No. 8293.
