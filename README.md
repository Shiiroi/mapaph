# mapaPH Hub

[![Version](https://img.shields.io/badge/version-2.1.0-1a4d2e.svg)](https://github.com/Shiiroi/mapaph/releases/tag/v2.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-1a4d2e.svg)](https://github.com/Shiiroi/mapaph/blob/main/LICENSE)
[![Website](https://img.shields.io/badge/website-mapaph.com-1a4d2e.svg)](https://www.mapaph.com)

mapaPH is an open-source civic cartography platform for the Philippines. This repository contains the source code for [mapaph.com](https://www.mapaph.com). The Astro build generates **121 statically pre-rendered pages**: 10 interactive tool suites, 98 dedicated province and Metro Manila city ZIP code directories (`/tools/zip-codes/[slug]`), 6 technical GIS guides, and core hub pages.

## Built-in Tools & Utilities

All built-in utilities run client-side with full server-side HTML pre-rendering:

| Tool                              | Route                                                                      | Description                                                                                                                   |
| :-------------------------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **PSGC Lookup & Decoder**         | [`/tools/psgc-lookup`](https://www.mapaph.com/tools/psgc-lookup)           | Search 1,742 geographic divisions and decode 9-digit and 10-digit PSGC codes.                                                 |
| **PRS92 / WGS84 Converter**       | [`/tools/coordinates`](https://www.mapaph.com/tools/coordinates)           | Convert coordinates between WGS84 GPS and Philippine Reference System 1992.                                                   |
| **ZIP Code Lookup & Directories** | [`/tools/zip-codes`](https://www.mapaph.com/tools/zip-codes)               | Search 2,139 PHLPost codes or browse 98 static province and Metro Manila city directories (`/tools/zip-codes/[slug]`).        |
| **Commute Fare Estimator**        | [`/tools/fare-calculator`](https://www.mapaph.com/tools/fare-calculator)   | Calculate official LTFRB fares for jeepneys, buses, and trains with 20% student, senior, and PWD discounts.                   |
| **Walkability Analyzer**          | [`/tools/walkability`](https://www.mapaph.com/tools/walkability)           | Measure 5, 10, and 15-minute walking radii and pedestrian catchment areas.                                                    |
| **Rail Transit Map & Fare Guide** | [`/tools/rail-transit`](https://www.mapaph.com/tools/rail-transit)         | View station fare matrices for LRT-1, LRT-2, and MRT-3 with transfer guides.                                                  |
| **Train Arrival PH**              | [`/tools/train-arrival-ph`](https://www.mapaph.com/tools/train-arrival-ph) | View next-3-trains wait windows, headway cadence, corridor simulation maps, and transfer cutoffs for MRT-3, LRT-1, and LRT-2. |
| **Expressway Toll Calculator**    | [`/tools/toll-calculator`](https://www.mapaph.com/tools/toll-calculator)   | Calculate toll rates for NLEX, SLEX, Skyway, SCTEX, TPLEX, CALAX, and CCLEX.                                                  |
| **EDSA Carousel Busway Guide**    | [`/tools/edsa-carousel`](https://www.mapaph.com/tools/edsa-carousel)       | Plan station-to-station trips and calculate fares along the EDSA Carousel busway.                                             |
| **Kilometer Post Locator**        | [`/tools/kilometer-posts`](https://www.mapaph.com/tools/kilometer-posts)   | Locate highway milestones along national highways from regional KM 0 benchmarks.                                              |
| **All Tools Directory**           | [`/tools`](https://www.mapaph.com/tools)                                   | Browse the complete catalog of civic mapping utilities.                                                                       |

## External Ecosystem Tools

| Tool     | Status          | Repository                                      | Live URL                                   |
| :------- | :-------------- | :---------------------------------------------- | :----------------------------------------- |
| **Lens** | Active (v1.1.0) | [Shiiroi/mapa](https://github.com/Shiiroi/mapa) | [lens.mapaph.com](https://lens.mapaph.com) |

## Documentation Guides

The hub hosts six technical guides for developers and GIS analysts:

- [PSGC Reference Guide](https://www.mapaph.com/docs/psgc): Code structure and administrative hierarchy.
- [PRS92 vs WGS84 Guide](https://www.mapaph.com/docs/prs92-wgs84-guide): Datum shifts, PTM zones, and formulas.
- [GeoJSON Guide](https://www.mapaph.com/docs/geojson-guide): RFC 7946 standards and coordinate order.
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

## Project Structure

- `src/pages/tools/`: Built-in mapping and commuter utilities, plus `zip-codes/[slug].astro` generating 98 static province and NCR city pages.
- `src/pages/docs/` and `src/components/docs/`: Six technical GIS and civic data guides.
- `src/data/`: Normalized static datasets (`philippine-zip-codes.json`, `psgc-directory.json`, `zip-locations.ts`, `rail-lines.ts`, and `changelog-fallback.json`).
- `src/scripts/`: Client-side interactive modules, including `train-arrival-client.ts`.
- `scripts/`: Build, data-sync, and content-audit scripts (`audit-content.mjs`, `build-zip-codes.mjs`, `sync-psgc.mjs`, and `extract-lens-data.mjs`).
- `supabase/migrations/`: Phase 2 live crowdsourced telemetry SQL schema (`20261115_create_rail_sightings.sql`).

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

### Environment Setup (Optional / Phase 2 Live Telemetry Staging)

The file `supabase/migrations/20261115_create_rail_sightings.sql` stages the Phase 2 live crowdsourced companion tracker. Copy `.env.example` to `.env` before configuring environment variables:

```bash
cp .env.example .env
```

- `PUBLIC_SUPABASE_URL` (or `VITE_SUPABASE_URL`): Supabase project API URL.
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`): Public anon or publishable key only (never use `service_role`).
- `VITE_GEO_CDN_URL`: Optional Cloudflare R2 CDN override for build-time PSGC sync scripts.

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

Audit readable prose word counts and ban emdashes across all 121 pages:

```bash
pnpm run audit:content
```

### Data Sync & Audit Scripts

Run these scripts to refresh datasets or verify content quality:

- `pnpm run data:sync`: Syncs the PSA PSGC administrative directory into `src/data/psgc-directory.json`.
- `pnpm run data:lens`: Extracts Lens choropleth dataset summaries.
- `node scripts/build-zip-codes.mjs`: Rebuilds `src/data/philippine-zip-codes.json` from PHLPost source data.
- `pnpm run audit:content`: Verifies minimum visible word counts and zero emdash characters across built pages.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Follow these rules for code contributions:

1. Create a feature branch from `main`. Do not push directly to `main`.
2. Format all commits using [Conventional Commits](https://www.conventionalcommits.org) specifications.
3. Verify that `pnpm check`, `pnpm format:check`, `pnpm build`, and `pnpm run audit:content` pass cleanly.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## License

Source code is available under the [MIT License](./LICENSE). Primary statistical and transit datasets remain in the public domain under Section 176 of Republic Act No. 8293.
