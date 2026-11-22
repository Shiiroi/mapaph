/**
 * @file rail-station-pages.ts
 * @description Precomputed static route data, SEO slugs, and cross-line interchange
 * mappings for all 51 MRT-3, LRT-1, and LRT-2 station schedule pages.
 */

import {
  ALL_STATIONS,
  RAIL_LINES,
  SCHEDULE_SPECS,
  STATIONS_DATA,
  buildLineTimetable,
  type ComputedStationSchedule,
  type LineKey,
  type LineScheduleSpec,
  type RailLineMeta,
  type RawStation,
  type StationItem,
} from "./rail-lines";

export const LINE_SLUGS: Record<LineKey, string> = {
  mrt3: "mrt-3",
  lrt1: "lrt-1",
  lrt2: "lrt-2",
};

/** Converts a station display name into a clean lowercase ASCII URL segment. */
export function slugifyStationName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[().]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Builds the canonical route slug for a station on a given rail line. */
export function getStationSlug(lineKey: LineKey, station: RawStation): string {
  return `${LINE_SLUGS[lineKey]}-${slugifyStationName(station.name)}`;
}

export interface CrossLinePartnerInfo {
  partnerLineKey: LineKey;
  partnerStationId: string;
  walkMin: number;
}

export const CROSS_LINE_PARTNERS: Record<string, CrossLinePartnerInfo> = {
  lrt1_doroteo_jose: {
    partnerLineKey: "lrt2",
    partnerStationId: "lrt2_recto",
    walkMin: 5,
  },
  lrt2_recto: {
    partnerLineKey: "lrt1",
    partnerStationId: "lrt1_doroteo_jose",
    walkMin: 5,
  },
  lrt1_edsa: {
    partnerLineKey: "mrt3",
    partnerStationId: "mrt3_taft",
    walkMin: 5,
  },
  mrt3_taft: {
    partnerLineKey: "lrt1",
    partnerStationId: "lrt1_edsa",
    walkMin: 5,
  },
  mrt3_cubao: {
    partnerLineKey: "lrt2",
    partnerStationId: "lrt2_cubao",
    walkMin: 6,
  },
  lrt2_cubao: {
    partnerLineKey: "mrt3",
    partnerStationId: "mrt3_cubao",
    walkMin: 6,
  },
};

export interface StationPageData {
  slug: string;
  lineKey: LineKey;
  station: StationItem;
  index: number;
  total: number;
  row: ComputedStationSchedule;
  lineMeta: RailLineMeta;
  spec: LineScheduleSpec;
  timetable: ComputedStationSchedule[];
}

export const TIMETABLES_BY_LINE: Record<LineKey, ComputedStationSchedule[]> = {
  lrt1: buildLineTimetable("lrt1"),
  mrt3: buildLineTimetable("mrt3"),
  lrt2: buildLineTimetable("lrt2"),
};

const lineMetaById = new Map<LineKey, RailLineMeta>(
  RAIL_LINES.map((meta) => [meta.id, meta]),
);

const seenSlugs = new Set<string>();

export const STATION_PAGES: StationPageData[] = ALL_STATIONS.map((station) => {
  const lineKey = station.lineKey;
  const lineMeta = lineMetaById.get(lineKey);
  if (!lineMeta) {
    throw new Error(`Missing RAIL_LINES metadata for line "${lineKey}"`);
  }

  const timetable = TIMETABLES_BY_LINE[lineKey];
  const row = timetable[station.indexInLine];
  if (!row || row.station.id !== station.id) {
    throw new Error(
      `Timetable row mismatch for station "${station.id}" at index ${station.indexInLine}`,
    );
  }

  const slug = getStationSlug(lineKey, station);
  if (seenSlugs.has(slug)) {
    throw new Error(`Duplicate station slug generated: "${slug}"`);
  }
  seenSlugs.add(slug);

  return {
    slug,
    lineKey,
    station,
    index: station.indexInLine,
    total: STATIONS_DATA[lineKey].length,
    row,
    lineMeta,
    spec: SCHEDULE_SPECS[lineKey],
    timetable,
  };
});

export const STATION_PAGE_BY_ID: Record<string, StationPageData> =
  Object.fromEntries(STATION_PAGES.map((entry) => [entry.station.id, entry]));

/** Returns the canonical `/tools/train-arrival-ph/<slug>` path for a station. */
export function getStationPagePath(
  lineKey: LineKey,
  stationId: string,
): string {
  const entry = STATION_PAGE_BY_ID[stationId];
  if (!entry || entry.lineKey !== lineKey) {
    throw new Error(
      `Unknown rail station page lookup: line="${lineKey}", stationId="${stationId}"`,
    );
  }
  return `/tools/train-arrival-ph/${entry.slug}`;
}
