/**
 * @file zip-locations.ts
 * @description Normalizes Philippine ZIP code entries into 98 canonical geographic directories
 * (81 provinces and 17 Metro Manila NCR cities/municipality) enriched with PSA 2024 census
 * demographics and 10-digit PSGC identifiers.
 */

import zipData from "./philippine-zip-codes.json";
import psgcData from "./psgc-directory.json";

export interface RawZipEntry {
  id: number;
  zip: string;
  name: string;
  location: string;
  region: string;
  regionFull: string;
}

export interface PsgcRecord {
  psgc: string;
  code9: string;
  name: string;
  slug: string;
  level: string;
  regionName: string;
  pop: number;
  area: number;
  density: number;
  lensUrl: string;
  citiesCount: number;
  munsCount: number;
  splitNote?: string;
}

export interface ConstituentLgu {
  psgc: string;
  code9: string;
  name: string;
  slug: string;
  level: string;
  cityClass: string | null;
  pop: number;
  area: number;
  density: number;
  lensUrl: string;
  zipCodes: string[];
}

export interface EnrichedZipEntry extends RawZipEntry {
  classification: string;
  matchedLgu: {
    psgc: string;
    name: string;
    level: string;
    cityClass: string | null;
    pop: number;
    lensUrl: string;
  } | null;
}

export interface ZipLocationPeer {
  slug: string;
  displayName: string;
  shortName: string;
  minZip: string;
  maxZip: string;
  entryCount: number;
  psgc: string;
  pop: number;
  area: number;
  density: number;
}

export interface ZipLocation {
  slug: string;
  displayName: string;
  shortName: string;
  isNcr: boolean;
  region: string;
  regionFull: string;
  entries: EnrichedZipEntry[];
  minZip: string;
  maxZip: string;
  uniqueZipCount: number;
  primaryEntry: EnrichedZipEntry;
  firstDigit: string;
  prefixDigits: string[];
  islandZone: {
    zone: string;
    label: string;
  };
  psgcRecord: PsgcRecord;
  constituentLgus: ConstituentLgu[];
  regionalPeers: ZipLocationPeer[];
}

export interface RegionZipGroup {
  region: string;
  regionFull: string;
  locations: ZipLocation[];
}

export const ISLAND_ZONE_DESCRIPTIONS: Record<
  string,
  { zone: string; label: string }
> = {
  "0": {
    zone: "Special Entities & Institutions",
    label: "Government Agencies / Embassies",
  },
  "1": {
    zone: "NCR & Central/Northern Luzon",
    label: "Metro Manila, Rizal, Bulacan",
  },
  "2": {
    zone: "Northern Luzon & Cordilleras",
    label: "Ilocos, CAR, Cagayan Valley, Bataan",
  },
  "3": {
    zone: "Central Luzon Corridor",
    label: "Pampanga, Tarlac, Zambales, Nueva Ecija",
  },
  "4": {
    zone: "Southern Tagalog (CALABARZON)",
    label: "Cavite, Laguna, Batangas, Quezon",
  },
  "5": {
    zone: "Bicol Peninsula & Island Provinces",
    label: "Albay, Camarines Sur, Sorsogon",
  },
  "6": {
    zone: "Western Visayas & Panay/Negros",
    label: "Iloilo, Negros Occidental, Capiz",
  },
  "7": {
    zone: "Central & Eastern Visayas / Zamboanga",
    label: "Cebu, Bohol, Leyte, Zamboanga",
  },
  "8": {
    zone: "Northern & Eastern Mindanao",
    label: "Davao Region, Caraga, Bukidnon",
  },
  "9": {
    zone: "Southern/Central Mindanao & BARMM",
    label: "South Cotabato, GenSan, Maguindanao",
  },
};

export const REGION_ORDER: readonly string[] = [
  "NCR",
  "CAR",
  "I",
  "II",
  "III",
  "IV-A",
  "MIMAROPA",
  "V",
  "VI",
  "NIR",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "BARMM",
];

const EXCLUDED_LOCATIONS = new Set(["Companies/Institutions"]);

const LOCATION_DISPLAY_OVERRIDES: Record<
  string,
  { displayName: string; shortName: string; slug: string }
> = {
  "Caloocan City (North)": {
    displayName: "Caloocan City",
    shortName: "Caloocan",
    slug: "caloocan-city",
  },
  "Caloocan City (South)": {
    displayName: "Caloocan City",
    shortName: "Caloocan",
    slug: "caloocan-city",
  },
  "Caloocan area (North)": {
    displayName: "Caloocan City",
    shortName: "Caloocan",
    slug: "caloocan-city",
  },
  "Quezon Province": {
    displayName: "Quezon Province",
    shortName: "Quezon",
    slug: "quezon",
  },
  "Rizal Province": {
    displayName: "Rizal Province",
    shortName: "Rizal",
    slug: "rizal",
  },
  "Mountain Province": {
    displayName: "Mountain Province",
    shortName: "Mountain Province",
    slug: "mountain-province",
  },
  "Davao de Oro (Compostela Valley)": {
    displayName: "Davao de Oro (Compostela Valley)",
    shortName: "Davao de Oro",
    slug: "davao-de-oro",
  },
  "North Cotabato": {
    displayName: "North Cotabato (Cotabato)",
    shortName: "North Cotabato",
    slug: "north-cotabato",
  },
};

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\bprovince\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeRawLocation(rawLocation: string): string {
  const override = LOCATION_DISPLAY_OVERRIDES[rawLocation];
  if (override) return override.displayName;
  return rawLocation;
}

export function getLocationSlug(rawLocation: string): string | null {
  if (EXCLUDED_LOCATIONS.has(rawLocation)) return null;
  const override = LOCATION_DISPLAY_OVERRIDES[rawLocation];
  if (override) return override.slug;
  return toSlug(rawLocation);
}

function getDisplayMeta(rawLocation: string): {
  displayName: string;
  shortName: string;
  slug: string;
} {
  const override = LOCATION_DISPLAY_OVERRIDES[rawLocation];
  if (override) return override;
  return {
    displayName: rawLocation,
    shortName: rawLocation
      .replace(/\s+City$/i, "")
      .replace(/\s+Province$/i, ""),
    slug: toSlug(rawLocation),
  };
}

function normalizeGeoName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bsta\.\s*/g, "santa ")
    .replace(/\bsto\.\s*/g, "santo ")
    .replace(/\bgen\.\s*/g, "general ")
    .replace(/\bcity of\b/g, " ")
    .replace(/\bmunicipality of\b/g, " ")
    .replace(/\b(city|cpo|po|poblacion|capitol|area)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractNameVariants(rawName: string): string[] {
  const variants = new Set<string>();
  const withoutParens = rawName.replace(/\([^)]*\)/g, " ");
  const base = normalizeGeoName(withoutParens);
  if (base) variants.add(base);

  const parenMatches = rawName.matchAll(/\(([^)]+)\)/g);
  for (const m of parenMatches) {
    const inner = m[1];
    if (!inner) continue;
    if (/^(inc\.|incl\.|north|south|east|west)/i.test(inner.trim())) continue;
    const normInner = normalizeGeoName(inner);
    if (normInner && normInner.length >= 4) {
      variants.add(normInner);
    }
  }

  // Also index common slash-separated or dash-separated aliases (e.g. "Ozamis" vs "Ozamiz")
  if (base === "ozamis") variants.add("ozamiz");
  if (base === "gma" || base === "g m a")
    variants.add("general mariano alvarez");
  if (base === "dasmarinas") variants.add("dasmarinas");
  if (base === "muñoz" || base === "munoz") variants.add("science of munoz");

  return Array.from(variants);
}

function classifyZipEntry(
  entry: RawZipEntry,
  isNcr: boolean,
  matchedLgu: ConstituentLgu | null,
): string {
  const upperName = entry.name.toUpperCase();
  if (
    upperName.includes("CPO") ||
    upperName.includes("CAPITOL") ||
    entry.zip.endsWith("00")
  ) {
    return "Central Post Office / Capital Hub";
  }
  if (
    upperName.includes("COLLEGE") ||
    upperName.includes("CAMP") ||
    upperName.includes("AIRPORT") ||
    upperName.includes("ECONOMIC ZONE") ||
    upperName.includes("UNIVERSITY")
  ) {
    return "Special Postal / Institutional Zone";
  }
  if (isNcr) {
    return "Urban Postal Delivery District";
  }
  if (matchedLgu) {
    return matchedLgu.level === "City"
      ? "Component / Independent City Post Office"
      : "Municipal Post Office";
  }
  return "Sub-District / Barangay Postal Zone";
}

interface RawPsgcProvince {
  psgc: string;
  code9: string;
  name: string;
  slug: string;
  level: string;
  region_psgc: string;
  region_name: string;
  pop: number;
  area: number;
  density: number;
  lens_url: string;
  cities_count: number;
  muns_count: number;
}

interface RawPsgcMunicity {
  psgc: string;
  code9: string;
  name: string;
  slug: string;
  level: string;
  city_class: string | null;
  province_psgc: string | null;
  province_name: string | null;
  region_psgc: string;
  region_name: string;
  pop: number;
  area: number;
  density: number;
  lens_url: string;
}

const psgcProvinces = psgcData.provinces as RawPsgcProvince[];
const psgcMunicities = psgcData.municities as RawPsgcMunicity[];

function buildPsgcDataForLocation(
  slug: string,
  shortName: string,
  isNcr: boolean,
  regionFull: string,
): { psgcRecord: PsgcRecord; rawLgus: RawPsgcMunicity[] } {
  if (slug === "maguindanao") {
    const norte = psgcProvinces.find((p) => p.slug === "maguindanao-del-norte");
    const sur = psgcProvinces.find((p) => p.slug === "maguindanao-del-sur");
    const provs = [norte, sur].filter((x): x is RawPsgcProvince => Boolean(x));
    const totalPop = provs.reduce((acc, p) => acc + p.pop, 0);
    const totalArea =
      Math.round(provs.reduce((acc, p) => acc + p.area, 0) * 100) / 100;
    const density =
      totalArea > 0 ? Math.round((totalPop / totalArea) * 100) / 100 : 0;
    const provPsgcs = new Set(provs.map((p) => p.psgc));
    const lgus = psgcMunicities.filter(
      (m) =>
        (m.province_psgc && provPsgcs.has(m.province_psgc)) ||
        m.slug === "cotabato-city",
    );

    return {
      psgcRecord: {
        psgc: provs.map((p) => p.psgc).join(" / "),
        code9: provs.map((p) => p.code9).join(" / "),
        name: "Maguindanao del Norte & Maguindanao del Sur",
        slug: "maguindanao",
        level: "Province (Partitioned under RA 11550)",
        regionName: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
        pop: totalPop,
        area: totalArea,
        density,
        lensUrl: norte?.lens_url ?? "https://lens.mapaph.com",
        citiesCount: provs.reduce((acc, p) => acc + p.cities_count, 0),
        munsCount: provs.reduce((acc, p) => acc + p.muns_count, 0),
        splitNote:
          "Republic Act No. 11550 partitioned the former province of Maguindanao into Maguindanao del Norte (PSGC 1908700000) and Maguindanao del Sur (PSGC 1908800000) in BARMM, while PHLPost still groups the 96xx postal series under Maguindanao.",
      },
      rawLgus: lgus,
    };
  }

  if (isNcr) {
    const cleanShort = toSlug(shortName);
    const matchedCity = psgcMunicities.find(
      (m) =>
        m.region_psgc === "1300000000" &&
        (m.slug === slug ||
          m.slug === cleanShort ||
          m.slug === `city-of-${cleanShort}` ||
          m.slug.replace(/^city-of-/, "") === cleanShort),
    );
    if (!matchedCity) {
      throw new Error(
        `Unable to match NCR location "${shortName}" (slug "${slug}") in psgc-directory.json`,
      );
    }
    return {
      psgcRecord: {
        psgc: matchedCity.psgc,
        code9: matchedCity.code9,
        name: matchedCity.name,
        slug: matchedCity.slug,
        level: matchedCity.city_class
          ? `${matchedCity.level} (${matchedCity.city_class})`
          : matchedCity.level,
        regionName: matchedCity.region_name,
        pop: matchedCity.pop,
        area: matchedCity.area,
        density: matchedCity.density,
        lensUrl: matchedCity.lens_url,
        citiesCount: matchedCity.level === "City" ? 1 : 0,
        munsCount: matchedCity.level === "Municipality" ? 1 : 0,
      },
      rawLgus: [matchedCity],
    };
  }

  const lookupSlug = slug === "north-cotabato" ? "cotabato" : slug;
  const matchedProv = psgcProvinces.find(
    (p) =>
      p.slug === lookupSlug || p.name.toLowerCase() === shortName.toLowerCase(),
  );
  if (!matchedProv) {
    throw new Error(
      `Unable to match province "${shortName}" (slug "${slug}") in psgc-directory.json`,
    );
  }

  const lgus = psgcMunicities.filter(
    (m) => m.province_psgc === matchedProv.psgc,
  );
  return {
    psgcRecord: {
      psgc: matchedProv.psgc,
      code9: matchedProv.code9,
      name: matchedProv.name,
      slug: matchedProv.slug,
      level: matchedProv.level,
      regionName: matchedProv.region_name || regionFull,
      pop: matchedProv.pop,
      area: matchedProv.area,
      density: matchedProv.density,
      lensUrl: matchedProv.lens_url,
      citiesCount: matchedProv.cities_count,
      munsCount: matchedProv.muns_count,
    },
    rawLgus: lgus,
  };
}

function buildAllLocations(): ZipLocation[] {
  const grouped = new Map<
    string,
    {
      slug: string;
      displayName: string;
      shortName: string;
      isNcr: boolean;
      region: string;
      regionFull: string;
      rawEntries: RawZipEntry[];
    }
  >();

  for (const raw of zipData.entries as RawZipEntry[]) {
    const slug = getLocationSlug(raw.location);
    if (!slug) continue;

    const meta = getDisplayMeta(raw.location);
    let bucket = grouped.get(slug);
    if (!bucket) {
      bucket = {
        slug,
        displayName: meta.displayName,
        shortName: meta.shortName,
        isNcr: raw.region === "NCR",
        region: raw.region,
        regionFull: raw.regionFull,
        rawEntries: [],
      };
      grouped.set(slug, bucket);
    }
    bucket.rawEntries.push(raw);
  }

  const initialLocations: ZipLocation[] = [];

  for (const group of grouped.values()) {
    const sortedRaw = [...group.rawEntries].sort(
      (a, b) => a.zip.localeCompare(b.zip) || a.name.localeCompare(b.name),
    );

    const { psgcRecord, rawLgus } = buildPsgcDataForLocation(
      group.slug,
      group.shortName,
      group.isNcr,
      group.regionFull,
    );

    const constituentLgus: ConstituentLgu[] = rawLgus
      .map((lgu) => ({
        psgc: lgu.psgc,
        code9: lgu.code9,
        name: lgu.name,
        slug: lgu.slug,
        level: lgu.level,
        cityClass: lgu.city_class,
        pop: lgu.pop,
        area: lgu.area,
        density: lgu.density,
        lensUrl: lgu.lens_url,
        zipCodes: [] as string[],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Pre-index normalized names for constituent LGUs
    const lguByNorm = new Map<string, ConstituentLgu>();
    for (const lgu of constituentLgus) {
      const norm = normalizeGeoName(lgu.name);
      if (norm) lguByNorm.set(norm, lgu);
      const noParens = normalizeGeoName(lgu.name.replace(/\([^)]*\)/g, " "));
      if (noParens) lguByNorm.set(noParens, lgu);
    }

    const enrichedEntries: EnrichedZipEntry[] = sortedRaw.map((entry) => {
      let matchedLgu: ConstituentLgu | null = null;
      if (!group.isNcr) {
        for (const variant of extractNameVariants(entry.name)) {
          const hit = lguByNorm.get(variant);
          if (hit) {
            matchedLgu = hit;
            break;
          }
        }
      } else if (constituentLgus.length === 1) {
        matchedLgu = constituentLgus[0];
      }

      if (matchedLgu && !matchedLgu.zipCodes.includes(entry.zip)) {
        matchedLgu.zipCodes.push(entry.zip);
      }

      return {
        ...entry,
        classification: classifyZipEntry(entry, group.isNcr, matchedLgu),
        matchedLgu: matchedLgu
          ? {
              psgc: matchedLgu.psgc,
              name: matchedLgu.name,
              level: matchedLgu.level,
              cityClass: matchedLgu.cityClass,
              pop: matchedLgu.pop,
              lensUrl: matchedLgu.lensUrl,
            }
          : null,
      };
    });

    const uniqueZips = Array.from(
      new Set(enrichedEntries.map((e) => e.zip)),
    ).sort();
    const minZip = uniqueZips[0] ?? "0000";
    const maxZip = uniqueZips[uniqueZips.length - 1] ?? "0000";
    const primaryEntry =
      enrichedEntries.find(
        (e) => e.name.toUpperCase().includes("CPO") || e.zip === minZip,
      ) ?? enrichedEntries[0];

    const firstDigit = minZip.charAt(0);
    const prefixDigits = Array.from(
      new Set(uniqueZips.map((z) => z.slice(0, 2))),
    ).sort();
    const islandZone = ISLAND_ZONE_DESCRIPTIONS[firstDigit] ?? {
      zone: "Philippine Postal Zone",
      label: "Domestic PHLPost Network",
    };

    initialLocations.push({
      slug: group.slug,
      displayName: group.displayName,
      shortName: group.shortName,
      isNcr: group.isNcr,
      region: group.region,
      regionFull: group.regionFull,
      entries: enrichedEntries,
      minZip,
      maxZip,
      uniqueZipCount: uniqueZips.length,
      primaryEntry,
      firstDigit,
      prefixDigits,
      islandZone,
      psgcRecord,
      constituentLgus,
      regionalPeers: [],
    });
  }

  // Sort locations by REGION_ORDER then displayName
  initialLocations.sort((a, b) => {
    const idxA = REGION_ORDER.indexOf(a.region);
    const idxB = REGION_ORDER.indexOf(b.region);
    if (idxA !== idxB) return idxA - idxB;
    return a.displayName.localeCompare(b.displayName);
  });

  // Populate regionalPeers on every location
  for (const loc of initialLocations) {
    loc.regionalPeers = initialLocations
      .filter((other) => other.region === loc.region && other.slug !== loc.slug)
      .map((peer) => ({
        slug: peer.slug,
        displayName: peer.displayName,
        shortName: peer.shortName,
        minZip: peer.minZip,
        maxZip: peer.maxZip,
        entryCount: peer.entries.length,
        psgc: peer.psgcRecord.psgc,
        pop: peer.psgcRecord.pop,
        area: peer.psgcRecord.area,
        density: peer.psgcRecord.density,
      }));
  }

  return initialLocations;
}

export const ZIP_LOCATIONS: ZipLocation[] = buildAllLocations();

export const ZIP_LOCATION_BY_SLUG: Record<string, ZipLocation> =
  Object.fromEntries(ZIP_LOCATIONS.map((loc) => [loc.slug, loc]));

export const ZIP_LOCATIONS_BY_REGION: RegionZipGroup[] = REGION_ORDER.map(
  (region) => {
    const locations = ZIP_LOCATIONS.filter((loc) => loc.region === region);
    return {
      region,
      regionFull: locations[0]?.regionFull ?? region,
      locations,
    };
  },
).filter((g) => g.locations.length > 0);
