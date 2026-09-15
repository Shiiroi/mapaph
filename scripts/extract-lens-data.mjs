/**
 * @file extract-lens-data.mjs
 * @description Extracts regions, provinces, and municities metadata from the local Lens repo
 * into a lightweight, client-side searchable directory for mapaPH tools.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source files in the adjacent local lens repository
const LENS_GEO_DIR = path.resolve(
  __dirname,
  "../../../mapa/mapa/frontend/data-sets/geo",
);
const REGIONS_FILE = path.join(LENS_GEO_DIR, "regions.json");
const PROVINCES_FILE = path.join(LENS_GEO_DIR, "provinces.json");
const MUNICITIES_FILE = path.join(LENS_GEO_DIR, "municities/meta.json");

const OUTPUT_FILE = path.resolve(__dirname, "../src/data/psgc-directory.json");

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function round(num, decimals = 2) {
  if (num == null || isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(Number(num) * factor) / factor;
}

function run() {
  if (!fs.existsSync(LENS_GEO_DIR)) {
    console.error(`Error: Lens geo directory not found at ${LENS_GEO_DIR}`);
    process.exit(1);
  }

  console.log("Reading Lens geo datasets...");
  const rawRegions = JSON.parse(fs.readFileSync(REGIONS_FILE, "utf8"));
  const rawProvinces = JSON.parse(fs.readFileSync(PROVINCES_FILE, "utf8"));
  const rawMunicities = JSON.parse(fs.readFileSync(MUNICITIES_FILE, "utf8"));

  // Region lookup map
  const regionMap = new Map();
  const regions = rawRegions.map((r) => {
    const slug = slugify(r.name);
    const item = {
      psgc: String(r.psgc),
      code9: String(r.correspondence || r.psgc?.slice(0, 9)),
      name: r.name,
      slug,
      level: "Region",
      pop: r.pop_2024 ?? null,
      area: round(r.area_km2),
      density: round(r.density_2024),
      lens_url: `https://lens.mapaph.com/region/${slug}`,
    };
    regionMap.set(String(r.psgc), item);
    return item;
  });

  // Province lookup map
  const provinceMap = new Map();
  const provinces = rawProvinces.map((p) => {
    const slug = slugify(p.name);
    const reg = regionMap.get(String(p.region_psgc));
    const item = {
      psgc: String(p.psgc),
      code9: String(p.correspondence || p.psgc?.slice(0, 9)),
      name: p.name,
      slug,
      level: "Province",
      region_psgc: String(p.region_psgc || ""),
      region_name: reg ? reg.name : "",
      pop: p.pop_2024 ?? null,
      area: round(p.area_km2),
      density: round(p.density_2024),
      lens_url: `https://lens.mapaph.com/province/${slug}`,
    };
    provinceMap.set(String(p.psgc), item);
    return item;
  });

  // Municities
  const municities = rawMunicities.map((m) => {
    const slug = slugify(m.name);
    const prov = provinceMap.get(String(m.province_psgc));
    const reg = regionMap.get(String(m.region_psgc));

    const isCity = m.geo_lvl === "City" || m.city_lvl != null;
    const level = isCity ? "City" : "Municipality";

    return {
      psgc: String(m.psgc),
      code9: String(m.correspondence || m.psgc?.slice(0, 9)),
      name: m.name,
      slug,
      level,
      city_class: m.city_lvl ?? null, // HUC, ICC, CC
      province_psgc: String(m.province_psgc || ""),
      province_name: prov ? prov.name : "",
      region_psgc: String(m.region_psgc || ""),
      region_name: reg ? reg.name : "",
      pop: m.pop_2024 ?? null,
      area: round(m.area_km2),
      density: round(m.density_2024),
      lens_url: `https://lens.mapaph.com/municipality/${slug}`,
    };
  });

  // Count child entities
  for (const prov of provinces) {
    const children = municities.filter((m) => m.province_psgc === prov.psgc);
    prov.cities_count = children.filter((m) => m.level === "City").length;
    prov.muns_count = children.filter((m) => m.level === "Municipality").length;
  }

  for (const reg of regions) {
    const provs = provinces.filter((p) => p.region_psgc === reg.psgc);
    const muns = municities.filter((m) => m.region_psgc === reg.psgc);
    reg.provinces_count = provs.length;
    reg.cities_count = muns.filter((m) => m.level === "City").length;
    reg.muns_count = muns.filter((m) => m.level === "Municipality").length;
  }

  const dataset = {
    generatedAt: new Date().toISOString(),
    counts: {
      regions: regions.length,
      provinces: provinces.length,
      municities: municities.length,
      cities: municities.filter((m) => m.level === "City").length,
      municipalities: municities.filter((m) => m.level === "Municipality")
        .length,
    },
    regions,
    provinces,
    municities,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset));

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`Successfully generated ${OUTPUT_FILE}`);
  console.log(
    `Regions: ${regions.length}, Provinces: ${provinces.length}, Municities: ${municities.length}`,
  );
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

run();
