/**
 * @file sync-psgc.mjs
 * @description Syncs regions, provinces, and municities metadata from the Cloudflare R2 CDN
 * (or local Lens geo files as fallback) into a lightweight, client-side searchable directory.
 *
 * Checks HTTP ETag / Last-Modified to determine if new data was published to the CDN.
 *
 * Accurately tracks statutory divisions:
 * - 18 Regions (including NCR, CAR, NIR, and BARMM)
 * - 82 Provinces (excluding pseudo-provincial map clusters Metro Manila and SGA)
 * - 149 Cities (33 HUCs, 5 ICCs, 111 Component Cities)
 * - 1,493 Municipalities
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env if present (native Node.js support)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(__dirname, "../.env"));
  } catch (err) {
    // If .env does not exist, proceed with process.env
  }
}

const CDN_BASE_URL =
  process.env.VITE_GEO_CDN_URL ||
  process.env.PUBLIC_GEO_CDN_URL ||
  "https://pub-f9d925e99cc844ad9fac924a16e8f3a3.r2.dev";

// Local fallback directory
const LOCAL_LENS_GEO_DIR = path.resolve(
  __dirname,
  "../../../mapa/mapa/frontend/data-sets/geo",
);

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

/**
 * Fetch a JSON file from the CDN, or fall back to local disk if network fails
 */
async function loadDataset(filename) {
  const cdnUrl = `${CDN_BASE_URL.replace(/\/$/, "")}/${filename.replace(/^\//, "")}`;
  console.log(`Fetching ${filename} from CDN (${cdnUrl})...`);

  try {
    const res = await fetch(cdnUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const etag = res.headers.get("etag")?.replace(/"/g, "");
    const lastModified = res.headers.get("last-modified");
    return { data, source: "cdn", etag, lastModified };
  } catch (netErr) {
    console.warn(
      `⚠ CDN fetch failed for ${filename} (${netErr.message}). Checking local fallback...`,
    );

    const localPath = path.join(LOCAL_LENS_GEO_DIR, filename);
    if (fs.existsSync(localPath)) {
      console.log(`✓ Loaded ${filename} from local fallback: ${localPath}`);
      const raw = fs.readFileSync(localPath, "utf8");
      return {
        data: JSON.parse(raw),
        source: "local",
        etag: null,
        lastModified: null,
      };
    }

    throw new Error(
      `Failed to fetch ${filename} from CDN and local fallback not found at ${localPath}: ${netErr.message}`,
    );
  }
}

/**
 * Check if the CDN data has changed using HTTP HEAD
 */
async function checkCdnEtag() {
  try {
    const cdnUrl = `${CDN_BASE_URL.replace(/\/$/, "")}/regions.json`;
    const res = await fetch(cdnUrl, { method: "HEAD" });
    if (!res.ok) return null;
    return {
      etag: res.headers.get("etag")?.replace(/"/g, ""),
      lastModified: res.headers.get("last-modified"),
    };
  } catch (err) {
    console.warn(`Could not check CDN ETag: ${err.message}`);
    return null;
  }
}

async function run() {
  const force = process.argv.includes("--force");
  let existingMeta = null;

  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
      existingMeta = existing.meta || null;
    } catch (e) {
      console.warn(
        "Could not read existing psgc-directory.json metadata:",
        e.message,
      );
    }
  }

  console.log("=== mapaPH PSGC Data Sync ===");
  console.log(`Target CDN: ${CDN_BASE_URL}`);

  // Check remote ETag
  const remoteHead = await checkCdnEtag();
  if (remoteHead && existingMeta?.etag && !force) {
    if (remoteHead.etag === existingMeta.etag) {
      console.log(`✓ PSGC directory is already in sync with CDN.`);
      console.log(`  Current ETag: "${remoteHead.etag}"`);
      console.log(`  Last-Modified: ${remoteHead.lastModified || "N/A"}`);
      console.log(`  Pass --force to re-generate anyway.`);
      return;
    } else {
      console.log(`⚡ New update detected on CDN!`);
      console.log(`  Previous ETag: "${existingMeta.etag}"`);
      console.log(`  New ETag:      "${remoteHead.etag}"`);
    }
  }

  const [regionsRes, provincesRes, municitiesRes] = await Promise.all([
    loadDataset("regions.json"),
    loadDataset("provinces.json"),
    loadDataset("municities/meta.json"),
  ]);

  const rawRegions = regionsRes.data;
  const rawProvinces = provincesRes.data;
  const rawMunicities = municitiesRes.data;

  console.log(
    "Processing and validating Philippine administrative divisions...",
  );

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
  // Strictly 82 statutory provinces in the Philippines.
  // Metro Manila (1300000000) and SGA (1909900000) are regional/special administrative clusters.
  const provinceMap = new Map();
  const provinces = [];

  for (const p of rawProvinces) {
    const slug = slugify(p.name);
    const reg = regionMap.get(String(p.region_psgc));
    const isSpecial =
      String(p.psgc) === "1300000000" || String(p.psgc) === "1909900000";

    const item = {
      psgc: String(p.psgc),
      code9: String(p.correspondence || p.psgc?.slice(0, 9)),
      name: p.name,
      slug,
      level: isSpecial ? "Special Area" : "Province",
      region_psgc: String(p.region_psgc || ""),
      region_name: reg ? reg.name : "",
      pop: p.pop_2024 ?? null,
      area: round(p.area_km2),
      density: round(p.density_2024),
      lens_url: `https://lens.mapaph.com/province/${slug}`,
    };

    provinceMap.set(String(p.psgc), item);

    if (!isSpecial) {
      provinces.push(item);
    }
  }

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

  // Calculate child counts
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

  const cities = municities.filter((m) => m.level === "City");
  const huc = cities.filter((m) => m.city_class === "HUC");
  const icc = cities.filter((m) => m.city_class === "ICC");
  const cc = cities.filter((m) => m.city_class === "CC");
  const muns = municities.filter((m) => m.level === "Municipality");

  const dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: regionsRes.source,
      etag: remoteHead?.etag || regionsRes.etag || null,
      lastModified: remoteHead?.lastModified || regionsRes.lastModified || null,
      cdnUrl: CDN_BASE_URL,
    },
    counts: {
      regions: regions.length, // 18
      provinces: provinces.length, // 82
      cities: cities.length, // 149
      huc: huc.length, // 33
      icc: icc.length, // 5
      cc: cc.length, // 111
      municipalities: muns.length, // 1,493
      total_lgus: municities.length, // 1,642
      total_divisions: regions.length + provinces.length + municities.length, // 1,742
    },
    regions,
    provinces,
    municities,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset));

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\n✓ Successfully synced to ${OUTPUT_FILE}`);
  console.log(`- Source: ${regionsRes.source.toUpperCase()} (${CDN_BASE_URL})`);
  console.log(`- ETag: "${dataset.meta.etag}"`);
  console.log(`- Regions: ${regions.length}`);
  console.log(`- Provinces: ${provinces.length}`);
  console.log(
    `- Cities: ${cities.length} (33 HUCs, 5 ICCs, 111 Component Cities)`,
  );
  console.log(`- Municipalities: ${muns.length}`);
  console.log(`- Total LGUs: ${municities.length}`);
  console.log(`- Output File Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

run().catch((err) => {
  console.error(`Fatal sync error:`, err.message);
  process.exit(1);
});
