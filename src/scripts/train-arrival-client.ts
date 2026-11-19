/**
 * @file train-arrival-client.ts
 * @description Client-side interactive controller for Train Arrival PH:
 * Manila clock schedule wait estimation, Next-3-Trains cadence, Origin-to-Destination
 * trip & transfer cutoff checker, and synchronized OpenStreetMap / 2D SVG / Station List views.
 */

import {
  RAIL_LINES,
  STATIONS_DATA,
  LINE_COLORS,
  SCHEDULE_SPECS,
  formatMinutesTo12H,
  buildLineTimetable,
  getHeadwayPeriod,
  computeDirectionScheduleDeck,
  computeTripAndTransferPlan,
  type LineKey,
  type ComputedStationSchedule,
  type DirectionScheduleDeck,
  type TripAndTransferPlan,
} from "../data/rail-lines";

interface LeafletStub {
  map: (id: string, opts: Record<string, unknown>) => any;
  tileLayer: (url: string, opts: Record<string, unknown>) => any;
  layerGroup: () => any;
  polyline: (pts: number[][], opts: Record<string, unknown>) => any;
  circleMarker: (
    latlng: [number, number],
    opts: Record<string, unknown>,
  ) => any;
  divIcon: (opts: Record<string, unknown>) => any;
  marker: (latlng: [number, number], opts: Record<string, unknown>) => any;
  latLngBounds: (pts: [number, number][]) => any;
}

declare const L: LeafletStub | undefined;

interface ManilaClock {
  nowMs: number;
  totalMin: number;
  exactMin: number;
  isWeekendAuto: boolean;
  weekdayLabel: string;
  formatted: string;
}

interface SimTrainMarker {
  id: string;
  lineKey: LineKey;
  dirKey: "fwd" | "rev";
  dirShort: string;
  dirName: string;
  fromName: string;
  toName: string;
  lat: number;
  lon: number;
  bearingDeg: number;
  svgX: number;
  svgY: number;
  svgAngleDeg: number;
}

interface DiagramPoint {
  id: string | null;
  x: number;
  y: number;
  corner: boolean;
}

const GPS_MAX_RADIUS_METERS = 650;

const TIMETABLES: Record<LineKey, ComputedStationSchedule[]> = {
  mrt3: buildLineTimetable("mrt3"),
  lrt1: buildLineTimetable("lrt1"),
  lrt2: buildLineTimetable("lrt2"),
};

// Shared road/viaduct curve waypoints for smooth geographic alignment
const GEO_WAYPOINTS: Record<string, [number, number][]> = {
  "lrt1_fpj>lrt1_balintawak": [[14.6572, 121.013]],
  "lrt1_balintawak>lrt1_monumento": [[14.6565, 120.9945]],
  "lrt1_central>lrt1_un_ave": [
    [14.5895, 120.981],
    [14.586, 120.9825],
  ],
  "mrt3_north>mrt3_q_ave": [[14.6478, 121.0352]],
  "mrt3_q_ave>mrt3_kamuning": [[14.6385, 121.0412]],
  "mrt3_kamuning>mrt3_cubao": [[14.627, 121.0475]],
  "mrt3_cubao>mrt3_santolan": [[14.6135, 121.0535]],
  "mrt3_santolan>mrt3_ortigas": [
    [14.5995, 121.058],
    [14.5935, 121.058],
  ],
  "mrt3_guadalupe>mrt3_buendia": [
    [14.5622, 121.042],
    [14.5582, 121.0382],
  ],
  "mrt3_magallanes>mrt3_taft": [
    [14.5405, 121.0145],
    [14.5385, 121.006],
  ],
  "lrt2_katipunan>lrt2_santolan": [
    [14.6335, 121.0775],
    [14.6285, 121.082],
  ],
};

// Schematic 2D network topology (viewBox 0 0 1260 1280)
const DIAGRAM_LINES: Record<LineKey, [string | null, number, number][]> = {
  lrt1: [
    ["lrt1_fpj", 460, 108],
    ["lrt1_balintawak", 347, 108],
    [null, 220, 108],
    ["lrt1_monumento", 220, 128],
    ["lrt1_5th_ave", 220, 200],
    ["lrt1_r_papa", 220, 260],
    ["lrt1_abad_santos", 220, 300],
    ["lrt1_blumentritt", 220, 358],
    ["lrt1_tayuman", 220, 398],
    ["lrt1_bambang", 220, 438],
    ["lrt1_doroteo_jose", 220, 480],
    ["lrt1_carriedo", 220, 524],
    ["lrt1_central", 220, 571],
    ["lrt1_un_ave", 232, 643],
    ["lrt1_pedro_gil", 255, 688],
    ["lrt1_quirino", 279, 733],
    ["lrt1_vito_cruz", 303, 779],
    ["lrt1_gil_puyat", 320, 847],
    ["lrt1_libertad", 332, 891],
    ["lrt1_edsa", 345, 954],
    ["lrt1_baclaran", 332, 992],
    ["lrt1_redemptorist", 326, 1037],
    ["lrt1_mia_road", 320, 1082],
    ["lrt1_asia_world", 314, 1127],
    ["lrt1_ninoy_aquino", 308, 1172],
    ["lrt1_dr_santos", 302, 1217],
  ],
  mrt3: [
    ["mrt3_north", 548, 127],
    ["mrt3_q_ave", 604, 213],
    ["mrt3_kamuning", 636, 263],
    ["mrt3_cubao", 689, 374],
    ["mrt3_santolan", 727, 456],
    [null, 752, 515],
    ["mrt3_ortigas", 732, 603],
    ["mrt3_shaw", 710, 647],
    ["mrt3_boni", 679, 705],
    ["mrt3_guadalupe", 654, 751],
    [null, 640, 790],
    ["mrt3_buendia", 575, 845],
    ["mrt3_ayala", 533, 882],
    ["mrt3_magallanes", 475, 933],
    [null, 440, 952],
    ["mrt3_taft", 357, 964],
  ],
  lrt2: [
    ["lrt2_recto", 227, 496],
    ["lrt2_legarda", 285, 516],
    ["lrt2_pureza", 373, 506],
    [null, 447, 497],
    ["lrt2_v_mapa", 457, 487],
    [null, 495, 451],
    ["lrt2_j_ruiz", 519, 438],
    ["lrt2_gilmore", 573, 414],
    ["lrt2_betty_go", 633, 387],
    ["lrt2_cubao", 703, 355],
    ["lrt2_anonas", 789, 317],
    ["lrt2_katipunan", 843, 293],
    [null, 870, 280],
    ["lrt2_santolan", 934, 356],
    ["lrt2_marikina", 985, 420],
    ["lrt2_antipolo", 1035, 490],
  ],
};

const DIAGRAM_LINKS: [string, string][] = [
  ["lrt1_doroteo_jose", "lrt2_recto"],
  ["lrt2_cubao", "mrt3_cubao"],
  ["lrt1_edsa", "mrt3_taft"],
];

const diagramPts: Record<LineKey, DiagramPoint[]> = {
  mrt3: [],
  lrt1: [],
  lrt2: [],
};
const diagramPos: Record<string, DiagramPoint> = {};
const diagramIndexByStation: Record<LineKey, Record<string, number>> = {
  mrt3: {},
  lrt1: {},
  lrt2: {},
};

(["lrt1", "mrt3", "lrt2"] as LineKey[]).forEach((k) => {
  diagramPts[k] = DIAGRAM_LINES[k].map(([id, x, y], idx) => {
    const pt: DiagramPoint = { id, x, y, corner: !id };
    if (id) {
      diagramPos[id] = pt;
      diagramIndexByStation[k][id] = idx;
    }
    return pt;
  });
});

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function getManilaClock(): ManilaClock {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const numFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = numFmt.formatToParts(now);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  const wd = (map.weekday || "").toLowerCase();
  const hour = Number(map.hour || 0) % 24;
  const minute = Number(map.minute || 0);
  const second = Number(map.second || 0);
  const isWeekendAuto = wd.startsWith("sat") || wd.startsWith("sun");
  const totalMin = hour * 60 + minute;
  return {
    nowMs: now.getTime(),
    totalMin,
    exactMin: totalMin + second / 60,
    isWeekendAuto,
    weekdayLabel: map.weekday || "Today",
    formatted: fmt.format(now),
  };
}

function formatWaitLabel(waitMin: number): string {
  if (waitMin <= 0) return "Due now";
  if (waitMin < 60) return "~" + waitMin + " min";
  const hrs = Math.floor(waitMin / 60);
  const rem = waitMin % 60;
  return rem === 0 ? "~" + hrs + "h" : "~" + hrs + "h " + rem + "m";
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGeoVerticesSlice(
  lineKey: LineKey,
  startIdx?: number,
  endIdx?: number,
): [number, number][] {
  const sts = STATIONS_DATA[lineKey];
  const from =
    startIdx !== undefined
      ? Math.max(0, Math.min(sts.length - 1, startIdx))
      : 0;
  const to =
    endIdx !== undefined
      ? Math.max(0, Math.min(sts.length - 1, endIdx))
      : sts.length - 1;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const verts: [number, number][] = [];

  for (let i = lo; i <= hi; i++) {
    verts.push([sts[i].lat, sts[i].lon]);
    if (i < hi) {
      const wp = GEO_WAYPOINTS[sts[i].id + ">" + sts[i + 1].id];
      if (wp && wp.length) {
        wp.forEach((p) => verts.push(p));
      }
    }
  }
  return verts;
}

function interpolatePolyPoints(
  pts: [number, number][],
  tNorm: number,
  isGeo: boolean,
  reverseTangent: boolean,
): { pos: [number, number]; angleDeg: number } {
  if (!pts.length) return { pos: [0, 0], angleDeg: 0 };
  if (pts.length === 1) {
    return { pos: pts[0], angleDeg: reverseTangent ? 180 : 0 };
  }

  const t = Math.max(0, Math.min(1, tNorm));
  const lens: number[] = [];
  let total = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = isGeo
      ? (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180)
      : b[0] - a[0];
    const dy = isGeo ? b[0] - a[0] : b[1] - a[1];
    const len = Math.hypot(dx, dy) || 0.00001;
    lens.push(len);
    total += len;
  }

  let targetDist = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (targetDist <= lens[i] || i === lens.length - 1) {
      const frac =
        lens[i] > 0 ? Math.max(0, Math.min(1, targetDist / lens[i])) : 0;
      const a = pts[i];
      const b = pts[i + 1];
      const p0 = a[0] + (b[0] - a[0]) * frac;
      const p1 = a[1] + (b[1] - a[1]) * frac;

      let dx = isGeo
        ? (b[1] - a[1]) * Math.cos((p0 * Math.PI) / 180)
        : b[0] - a[0];
      let dy = isGeo ? b[0] - a[0] : -(b[1] - a[1]);

      if (reverseTangent) {
        dx = -dx;
        dy = -dy;
      }
      const angleDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
      return { pos: [p0, p1], angleDeg };
    }
    targetDist -= lens[i];
  }
  return { pos: pts[0], angleDeg: 0 };
}

function getTrackPositionAtFloatIndex(
  lineKey: LineKey,
  stationFloatIdx: number,
  isReverse: boolean,
) {
  const sts = STATIONS_DATA[lineKey];
  const clamped = Math.max(0, Math.min(sts.length - 1, stationFloatIdx));
  const segIdx =
    clamped >= sts.length - 1
      ? Math.max(0, sts.length - 2)
      : Math.floor(clamped);
  const segT = clamped >= sts.length - 1 ? 1 : clamped - segIdx;
  const stA = sts[segIdx];
  const stB = sts[Math.min(sts.length - 1, segIdx + 1)];

  const geoPts: [number, number][] = [[stA.lat, stA.lon]];
  const wp = GEO_WAYPOINTS[stA.id + ">" + stB.id];
  if (wp && wp.length) wp.forEach((p) => geoPts.push(p));
  geoPts.push([stB.lat, stB.lon]);
  const geoRes = interpolatePolyPoints(geoPts, segT, true, isReverse);

  const dLine = diagramPts[lineKey];
  const iA = diagramIndexByStation[lineKey][stA.id] ?? 0;
  const iB = diagramIndexByStation[lineKey][stB.id] ?? dLine.length - 1;
  const lo = Math.min(iA, iB);
  const hi = Math.max(iA, iB);
  const svgPts: [number, number][] = dLine
    .slice(lo, hi + 1)
    .map((p) => [p.x, p.y]);
  const svgRes = interpolatePolyPoints(svgPts, segT, false, isReverse);

  return {
    lat: geoRes.pos[0],
    lon: geoRes.pos[1],
    bearingDeg: geoRes.angleDeg,
    svgX: svgRes.pos[0],
    svgY: svgRes.pos[1],
    svgAngleDeg: svgRes.angleDeg,
  };
}

function offsetToStationFloatIndex(
  lineKey: LineKey,
  elapsedMin: number,
  dirKey: "fwd" | "rev",
): number {
  const table = TIMETABLES[lineKey];
  const maxIdx = table.length - 1;

  if (dirKey === "fwd") {
    if (elapsedMin <= 0) return 0;
    for (let i = 0; i < maxIdx; i++) {
      const oA = table[i].offsetForwardMin;
      const oB = table[i + 1].offsetForwardMin;
      if (elapsedMin <= oB) {
        const t = oB > oA ? (elapsedMin - oA) / (oB - oA) : 0;
        return i + Math.max(0, Math.min(1, t));
      }
    }
    return maxIdx;
  }

  if (elapsedMin <= 0) return maxIdx;
  for (let i = maxIdx - 1; i >= 0; i--) {
    const oStart = table[i + 1].offsetReverseMin;
    const oEnd = table[i].offsetReverseMin;
    if (elapsedMin <= oEnd) {
      const t = oEnd > oStart ? (elapsedMin - oStart) / (oEnd - oStart) : 0;
      return i + 1 - Math.max(0, Math.min(1, t));
    }
  }
  return 0;
}

function computeLineSimulatedTrains(
  lineKey: LineKey,
  clock: ManilaClock,
  isWeekend: boolean,
): {
  estTrains: SimTrainMarker[];
  estByIndex: Record<number, { fwd: boolean; rev: boolean }>;
} {
  const spec = SCHEDULE_SPECS[lineKey];
  const table = TIMETABLES[lineKey];
  const maxIdx = table.length - 1;
  const dirCodeFwd = spec.forward.shortDir === "Eastbound" ? "EB" : "SB";
  const dirCodeRev = spec.reverse.shortDir === "Westbound" ? "WB" : "NB";
  const hw = getHeadwayPeriod(lineKey, clock.totalMin, isWeekend);
  const avgHeadway = hw.avgMin;

  const fwdFirst = isWeekend
    ? spec.forward.weekendFirstMin
    : spec.forward.weekdayFirstMin;
  const fwdLast = isWeekend
    ? spec.forward.weekendLastMin
    : spec.forward.weekdayLastMin;
  const revFirst = isWeekend
    ? spec.reverse.weekendFirstMin
    : spec.reverse.weekdayFirstMin;
  const revLast = isWeekend
    ? spec.reverse.weekendLastMin
    : spec.reverse.weekdayLastMin;

  const totalFwdTrip = table[maxIdx].offsetForwardMin;
  const totalRevTrip = table[0].offsetReverseMin;

  const estTrains: SimTrainMarker[] = [];
  const estByIndex: Record<number, { fwd: boolean; rev: boolean }> = {};

  for (let d = fwdFirst; d <= fwdLast + 0.001; d += avgHeadway) {
    const elapsed = clock.exactMin - d;
    if (elapsed >= 0 && elapsed <= totalFwdTrip) {
      const floatIdx = offsetToStationFloatIndex(lineKey, elapsed, "fwd");
      const geom = getTrackPositionAtFloatIndex(lineKey, floatIdx, false);
      const iFrom = Math.min(maxIdx - 1, Math.floor(floatIdx));
      const iTo = Math.min(maxIdx, iFrom + 1);
      const nearIdx = Math.round(floatIdx);
      if (!estByIndex[nearIdx])
        estByIndex[nearIdx] = { fwd: false, rev: false };
      estByIndex[nearIdx].fwd = true;
      estTrains.push({
        id: "est_" + lineKey + "_fwd_" + d.toFixed(2),
        lineKey,
        dirKey: "fwd",
        dirShort: dirCodeFwd,
        dirName: spec.forward.shortDir,
        fromName: table[iFrom].station.name,
        toName: table[iTo].station.name,
        lat: geom.lat,
        lon: geom.lon,
        bearingDeg: geom.bearingDeg,
        svgX: geom.svgX,
        svgY: geom.svgY,
        svgAngleDeg: geom.svgAngleDeg,
      });
    }
  }

  for (let d = revFirst; d <= revLast + 0.001; d += avgHeadway) {
    const elapsed = clock.exactMin - d;
    if (elapsed >= 0 && elapsed <= totalRevTrip) {
      const floatIdx = offsetToStationFloatIndex(lineKey, elapsed, "rev");
      const geom = getTrackPositionAtFloatIndex(lineKey, floatIdx, true);
      const iFrom = Math.min(maxIdx, Math.ceil(floatIdx));
      const iTo = Math.max(0, iFrom - 1);
      const nearIdx = Math.round(floatIdx);
      if (!estByIndex[nearIdx])
        estByIndex[nearIdx] = { fwd: false, rev: false };
      estByIndex[nearIdx].rev = true;
      estTrains.push({
        id: "est_" + lineKey + "_rev_" + d.toFixed(2),
        lineKey,
        dirKey: "rev",
        dirShort: dirCodeRev,
        dirName: spec.reverse.shortDir,
        fromName: table[iFrom].station.name,
        toName: table[iTo].station.name,
        lat: geom.lat,
        lon: geom.lon,
        bearingDeg: geom.bearingDeg,
        svgX: geom.svgX,
        svgY: geom.svgY,
        svgAngleDeg: geom.svgAngleDeg,
      });
    }
  }

  return { estTrains, estByIndex };
}

function getDefaultDestForOrigin(lineKey: LineKey, originId: string): string {
  const sts = STATIONS_DATA[lineKey];
  const preferredByLine: Record<LineKey, string> = {
    mrt3: "mrt3_ayala",
    lrt1: "lrt1_doroteo_jose",
    lrt2: "lrt2_cubao",
  };
  const preferred = preferredByLine[lineKey];
  if (preferred && originId !== preferred) return preferred;
  return originId === sts[sts.length - 1].id
    ? sts[0].id
    : sts[sts.length - 1].id;
}

function findStationIndex(lineKey: LineKey, stationId: string): number {
  const list = STATIONS_DATA[lineKey];
  const idx = list.findIndex((s) => s.id === stationId);
  return idx >= 0 ? idx : 0;
}

function svgEl(
  tag: string,
  attrs: Record<string, string | number>,
): SVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((k) => {
    el.setAttribute(k, String(attrs[k]));
  });
  return el;
}

function towardsPt(
  from: DiagramPoint,
  to: DiagramPoint,
  dist: number,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(dist, len / 2) / len;
  return { x: from.x + dx * k, y: from.y + dy * k };
}

function roundedSvgPath(pts: DiagramPoint[], radius = 26): string {
  let d = "M" + pts[0].x + "," + pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p.corner && i < pts.length - 1) {
      const t1 = towardsPt(p, pts[i - 1], radius);
      const t2 = towardsPt(p, pts[i + 1], radius);
      d +=
        " L" +
        t1.x +
        "," +
        t1.y +
        " Q" +
        p.x +
        "," +
        p.y +
        " " +
        t2.x +
        "," +
        t2.y;
    } else {
      d += " L" + p.x + "," + p.y;
    }
  }
  return d;
}

function shortDiagramName(st: { id: string; name: string }): string {
  if (st.id === "lrt1_asia_world") return "Asia World / PITX";
  return st.name.replace(/\s*\(.*\)/, "");
}

function getDiagramLabelPos(
  lineKey: LineKey,
  stId: string,
  x: number,
  y: number,
  idx: number,
): { lx: number; ly: number; anchor: string } {
  if (lineKey === "lrt1") {
    if (stId === "lrt1_fpj" || stId === "lrt1_balintawak") {
      return { lx: x, ly: y - 16, anchor: "middle" };
    }
    return { lx: x - 14, ly: y + 4, anchor: "end" };
  }
  if (lineKey === "mrt3") {
    if (stId === "mrt3_taft") return { lx: x, ly: y + 22, anchor: "middle" };
    return { lx: x + 14, ly: y + 4, anchor: "start" };
  }
  if (
    stId === "lrt2_santolan" ||
    stId === "lrt2_marikina" ||
    stId === "lrt2_antipolo"
  ) {
    return { lx: x + 14, ly: y + 4, anchor: "start" };
  }
  if (stId === "lrt2_recto") return { lx: x + 12, ly: y + 18, anchor: "start" };
  if (stId === "lrt2_cubao") return { lx: x, ly: y - 15, anchor: "middle" };
  const isAbove = idx % 2 === 0;
  return { lx: x, ly: isAbove ? y - 14 : y + 21, anchor: "middle" };
}

export function initTrainArrivalTracker(): void {
  const stationSelect = getEl<HTMLSelectElement>("stationSelect");
  const destStationSelect = getEl<HTMLSelectElement>("destStationSelect");
  const swapStationsBtn = getEl<HTMLButtonElement>("swapStationsBtn");
  const stationFilterInput = getEl<HTMLInputElement>("stationFilterInput");
  const stationSpineScroll = getEl<HTMLElement>("stationSpineScroll");
  const corridorHeading = getEl<HTMLElement>("corridorHeading");
  const lineOperatorMeta = getEl<HTMLElement>("lineOperatorMeta");
  const stationMetaNote = getEl<HTMLElement>("stationMetaNote");
  const manilaClockEl = getEl<HTMLElement>("manilaClock");
  const manilaDayTagEl = getEl<HTMLElement>("manilaDayTag");
  const activeCadenceChip = getEl<HTMLElement>("activeCadenceChip");
  const gpsLocateBtn = getEl<HTMLButtonElement>("gpsLocateBtn");
  const gpsStatusBanner = getEl<HTMLElement>("gpsStatusBanner");
  const serviceAlertBanner = getEl<HTMLElement>("serviceAlertBanner");
  const scheduleModeBanner = getEl<HTMLElement>("scheduleModeBanner");
  const scheduleModePill = getEl<HTMLElement>("scheduleModePill");
  const scheduleModeText = getEl<HTMLElement>("scheduleModeText");
  const scheduleModeActionBtn = getEl<HTMLButtonElement>(
    "scheduleModeActionBtn",
  );
  const mapViewPanel = getEl<HTMLElement>("mapViewPanel");
  const diagramViewPanel = getEl<HTMLElement>("diagramViewPanel");
  const listViewPanel = getEl<HTMLElement>("listViewPanel");
  const mapScopeControls = getEl<HTMLElement>("mapScopeControls");
  const listFilterControl = getEl<HTMLElement>("listFilterControl");
  const resetMapViewBtn = getEl<HTMLButtonElement>("resetMapViewBtn");
  const mapTrainCountBadge = getEl<HTMLElement>("mapTrainCountBadge");
  const mapFallbackBanner = getEl<HTMLElement>("mapFallbackBanner");
  const railDiagramSvg = document.getElementById(
    "railDiagramSvg",
  ) as SVGSVGElement | null;

  if (
    !stationSelect ||
    !destStationSelect ||
    !manilaClockEl ||
    !stationSpineScroll
  ) {
    return;
  }

  let currentLine: LineKey = "mrt3";
  let currentStationId: string = STATIONS_DATA.mrt3[0].id;
  let destStationId: string = getDefaultDestForOrigin("mrt3", currentStationId);
  let pickTarget: "origin" | "dest" = "origin";
  let dayMode: "auto" | "weekday" | "weekend" = "auto";
  let viewMode: "map" | "diagram" | "list" = "map";
  let mapScope: "focus" | "all" = "focus";
  let stationFilterQuery = "";
  let lastRenderedMinute = -1;

  // Leaflet instance state
  let leafletMap: any = null;
  let trackLayerGroup: any = null;
  let stationLayerGroup: any = null;
  let trainLayerGroup: any = null;
  let leafletUnavailable = false;
  let lastFitScopeSignature = "";

  function hideGpsBanner(): void {
    if (!gpsStatusBanner) return;
    gpsStatusBanner.classList.add("hidden");
    gpsStatusBanner.innerHTML = "";
  }

  function showGpsBanner(
    tone: "green" | "rust" | "neutral",
    message: string,
    actionBtn?: { label: string; onClick: () => void },
  ): void {
    if (!gpsStatusBanner) return;
    gpsStatusBanner.classList.remove("hidden");
    const toneClass =
      tone === "green"
        ? "border-mapa-green/40 text-mapa-green"
        : tone === "rust"
          ? "border-mapa-rust/40 text-mapa-rust"
          : "border-mapa-contour text-mapa-ink";
    gpsStatusBanner.className =
      "rounded-xl border bg-mapa-canvas px-3.5 py-2 text-xs leading-snug flex items-center justify-between gap-2.5 flex-wrap " +
      toneClass;
    gpsStatusBanner.innerHTML = "";

    const msgSpan = document.createElement("span");
    msgSpan.className = "flex-1 min-w-[200px]";
    msgSpan.textContent = message;
    gpsStatusBanner.appendChild(msgSpan);

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "flex items-center gap-2 shrink-0";

    if (actionBtn) {
      const act = document.createElement("button");
      act.type = "button";
      act.className =
        "px-2.5 py-1 rounded-lg bg-mapa-green text-white text-[11px] font-semibold hover:bg-mapa-green/90 transition-colors cursor-pointer";
      act.textContent = actionBtn.label;
      act.addEventListener("click", actionBtn.onClick);
      actionsWrap.appendChild(act);
    }

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className =
      "px-2 py-0.5 rounded-md border border-mapa-contour text-[11px] font-semibold text-mapa-muted hover:text-mapa-ink transition-colors cursor-pointer";
    dismissBtn.setAttribute("aria-label", "Dismiss location message");
    dismissBtn.textContent = "Dismiss";
    dismissBtn.addEventListener("click", hideGpsBanner);
    actionsWrap.appendChild(dismissBtn);

    gpsStatusBanner.appendChild(actionsWrap);
  }

  function getEffectiveIsWeekend(clock: ManilaClock): boolean {
    if (dayMode === "weekend") return true;
    if (dayMode === "weekday") return false;
    return clock.isWeekendAuto;
  }

  function updateUrlParams(): void {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("line", currentLine);
      url.searchParams.set("station", currentStationId);
      url.searchParams.set("dest", destStationId);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignore history restriction in embedded frames
    }
  }

  function populateStationDropdowns(
    preferredOrigin?: string | null,
    preferredDest?: string | null,
  ): void {
    const list = STATIONS_DATA[currentLine];
    stationSelect!.innerHTML = "";
    destStationSelect!.innerHTML = "";

    list.forEach((st, idx) => {
      const label = idx + 1 + ". " + st.name + " (" + st.city + ")";
      const optOrig = document.createElement("option");
      optOrig.value = st.id;
      optOrig.textContent = label;
      stationSelect!.appendChild(optOrig);

      const optDest = document.createElement("option");
      optDest.value = st.id;
      optDest.textContent = st.isTransfer ? label + " · Transfer" : label;
      destStationSelect!.appendChild(optDest);
    });

    let matchedOrig = list.find((s) => s.id === preferredOrigin) || list[0];
    if (!preferredOrigin && preferredDest && matchedOrig.id === preferredDest) {
      matchedOrig = list[list.length - 1] || list[0];
    }
    currentStationId = matchedOrig.id;
    stationSelect!.value = currentStationId;

    const fallbackDest = getDefaultDestForOrigin(currentLine, currentStationId);
    const matchedDest =
      list.find((s) => s.id === preferredDest) ||
      list.find((s) => s.id === fallbackDest) ||
      list[list.length - 1];
    destStationId = matchedDest.id;
    destStationSelect!.value = destStationId;
  }

  function updatePickTargetUI(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".pick-target-btn")
      .forEach((btn) => {
        const target = btn.getAttribute("data-pick-target") as
          "origin" | "dest" | null;
        const active = target === pickTarget;
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        if (active) {
          btn.className =
            "pick-target-btn px-2 py-1 rounded-md text-[11px] font-bold text-white cursor-pointer transition-colors inline-flex items-center gap-1 " +
            (target === "dest" ? "bg-mapa-rust" : "bg-mapa-ink");
        } else {
          btn.className =
            "pick-target-btn px-2 py-1 rounded-md text-[11px] font-semibold text-mapa-ink/75 hover:text-mapa-ink cursor-pointer transition-colors inline-flex items-center gap-1";
        }
      });
  }

  function selectStationFromVisualizer(
    lineKey: LineKey,
    stationId: string,
    overrideTarget?: "origin" | "dest",
  ): void {
    const target = overrideTarget ?? pickTarget;
    hideGpsBanner();

    if (lineKey !== currentLine) {
      if (target === "dest") {
        switchLine(lineKey, null, stationId);
      } else {
        switchLine(lineKey, stationId, null);
      }
      return;
    }

    if (target === "origin") {
      if (stationId === destStationId) {
        destStationId = currentStationId;
      }
      currentStationId = stationId;
    } else {
      if (stationId === currentStationId) {
        currentStationId = destStationId;
      }
      destStationId = stationId;
    }

    stationSelect!.value = currentStationId;
    destStationSelect!.value = destStationId;
    updateUrlParams();
    renderAll();
  }

  function updateLineTabsUI(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".line-tab-btn")
      .forEach((btn) => {
        const tabLine = btn.getAttribute("data-line-tab") as LineKey | null;
        if (!tabLine) return;
        const isActive = tabLine === currentLine;
        const lineHex = LINE_COLORS[tabLine] || "#3D5A45";
        const meta = RAIL_LINES.find((l) => l.id === tabLine);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");

        btn.className = isActive
          ? "line-tab-btn text-left rounded-xl px-4 py-3 transition-colors cursor-pointer flex items-center justify-between gap-3 bg-mapa-canvas border-2 border-mapa-ink shadow-xs"
          : "line-tab-btn text-left rounded-xl px-4 py-3 transition-colors cursor-pointer flex items-center justify-between gap-3 bg-mapa-canvas-dark border border-mapa-contour hover:border-mapa-ink/45";

        const pill = btn.querySelector<HTMLElement>("[data-line-pill]");
        if (pill && meta) {
          pill.innerHTML = "";
          if (isActive) {
            pill.className =
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-bold shrink-0 text-white";
            pill.style.backgroundColor = lineHex;
          } else {
            pill.className =
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-bold shrink-0 border border-mapa-contour bg-mapa-canvas text-mapa-ink";
            pill.style.backgroundColor = "";
            const dot = document.createElement("span");
            dot.className = "w-2 h-2 rounded-full shrink-0";
            dot.style.backgroundColor = lineHex;
            pill.appendChild(dot);
          }
          const labelSpan = document.createElement("span");
          labelSpan.textContent = meta.shortName;
          pill.appendChild(labelSpan);
        }

        const stateTag = btn.querySelector<HTMLElement>(
          "[data-line-state-tag]",
        );
        if (stateTag) {
          const stopsLabel = stateTag.getAttribute("data-line-stops") || "";
          if (isActive) {
            stateTag.className =
              "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap bg-mapa-ink text-white";
            stateTag.textContent = "Active";
          } else {
            stateTag.className =
              "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap bg-mapa-canvas text-mapa-muted border border-mapa-contour/80";
            stateTag.textContent = stopsLabel;
          }
        }
      });
  }

  function updateViewModeUI(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".view-mode-btn")
      .forEach((btn) => {
        const m = btn.getAttribute("data-view-mode");
        const active = m === viewMode;
        btn.setAttribute("aria-selected", active ? "true" : "false");
        btn.className = active
          ? "view-mode-btn h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap bg-mapa-green text-white"
          : "view-mode-btn h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap text-mapa-ink/75 hover:text-mapa-ink";
      });

    mapViewPanel?.classList.toggle("hidden", viewMode !== "map");
    diagramViewPanel?.classList.toggle("hidden", viewMode !== "diagram");
    listViewPanel?.classList.toggle("hidden", viewMode !== "list");

    mapScopeControls?.classList.toggle("hidden", viewMode === "list");
    listFilterControl?.classList.toggle("hidden", viewMode !== "list");

    if (viewMode === "map") {
      ensureLeafletMap();
      if (leafletMap) {
        setTimeout(() => {
          leafletMap.invalidateSize();
        }, 40);
      }
    }
  }

  function updateMapScopeUI(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".map-scope-btn")
      .forEach((btn) => {
        const sc = btn.getAttribute("data-map-scope");
        const active = sc === mapScope;
        btn.className = active
          ? "map-scope-btn px-2.5 py-1 rounded-md text-[11px] font-bold bg-mapa-ink text-white cursor-pointer transition-colors"
          : "map-scope-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-mapa-ink/75 hover:text-mapa-ink cursor-pointer transition-colors";
      });
  }

  function updateScheduleModeBanner(
    clock: ManilaClock,
    isWeekend: boolean,
    estCount: number,
  ): void {
    if (!scheduleModeBanner || !scheduleModePill || !scheduleModeText) return;
    const hw = getHeadwayPeriod(currentLine, clock.totalMin, isWeekend);
    const meta = RAIL_LINES.find((l) => l.id === currentLine) || RAIL_LINES[0];

    if (activeCadenceChip) {
      activeCadenceChip.textContent =
        hw.label + " · " + hw.rangeMin[0] + "-" + hw.rangeMin[1] + " min";
    }

    const fwdDeck = computeDirectionScheduleDeck(
      currentLine,
      currentStationId,
      "fwd",
      clock.exactMin,
      isWeekend,
      TIMETABLES[currentLine],
    );
    const revDeck = computeDirectionScheduleDeck(
      currentLine,
      currentStationId,
      "rev",
      clock.exactMin,
      isWeekend,
      TIMETABLES[currentLine],
    );
    const bothClosed =
      fwdDeck.status === "closed" && revDeck.status === "closed";
    const cutoffSoon =
      fwdDeck.status === "cutoff_window" || revDeck.status === "cutoff_window";

    if (bothClosed) {
      scheduleModeBanner.className =
        "rounded-2xl border border-mapa-rust/40 bg-mapa-canvas text-mapa-ink px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs";
      scheduleModePill.className =
        "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider bg-mapa-rust text-white";
      scheduleModePill.textContent = "OUTSIDE OPERATING HOURS";
      scheduleModeText.textContent =
        meta.shortName +
        " is currently closed. Check first morning train times below or use the 24/7 EDSA Carousel busway.";
    } else if (cutoffSoon) {
      scheduleModeBanner.className =
        "rounded-2xl border border-mapa-rust bg-mapa-canvas text-mapa-ink px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs";
      scheduleModePill.className =
        "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider bg-mapa-rust text-white";
      scheduleModePill.textContent = "GATE CUTOFF WINDOW";
      scheduleModeText.textContent =
        "Final " +
        meta.shortName +
        " trips are dispatching now. Verify your destination transfer cutoff below before entering the concourse.";
    } else {
      scheduleModeBanner.className =
        "rounded-2xl border border-mapa-contour bg-mapa-canvas text-mapa-ink px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs";
      scheduleModePill.className =
        "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider bg-mapa-ink text-white";
      scheduleModePill.textContent =
        hw.shortLabel.toUpperCase() +
        " · " +
        hw.rangeMin[0] +
        "-" +
        hw.rangeMin[1] +
        "M";
      scheduleModeText.textContent =
        meta.shortName +
        " headway cadence is " +
        hw.rangeMin[0] +
        "-" +
        hw.rangeMin[1] +
        " mins (" +
        estCount +
        " simulated trains in transit). Estimates come from official dispatch timetables, not live operator GPS.";
    }
  }

  function renderDirectionCard(
    prefix: "fwd" | "rev",
    deck: DirectionScheduleDeck,
  ): void {
    const dirPill = getEl<HTMLElement>(prefix + "DirPill");
    const lineDot = getEl<HTMLElement>(prefix + "LineDot");
    const sourceBadge = getEl<HTMLElement>(prefix + "SourceBadge");
    const destLabel = getEl<HTMLElement>(prefix + "DestLabel");
    const statusChip = getEl<HTMLElement>(prefix + "StatusChip");
    const countdown = getEl<HTMLElement>(prefix + "Countdown");
    const exactTime = getEl<HTMLElement>(prefix + "ExactTime");
    const nextSlots = getEl<HTMLElement>(prefix + "NextSlots");
    const liveDetail = getEl<HTMLElement>(prefix + "LiveDetail");
    const firstEl = getEl<HTMLElement>(prefix + "FirstTime");
    const lastEl = getEl<HTMLElement>(prefix + "LastTime");
    const cutoffEl = getEl<HTMLElement>(prefix + "CutoffTime");

    if (
      !dirPill ||
      !lineDot ||
      !sourceBadge ||
      !destLabel ||
      !statusChip ||
      !countdown ||
      !exactTime ||
      !nextSlots ||
      !liveDetail ||
      !firstEl ||
      !lastEl ||
      !cutoffEl
    ) {
      return;
    }

    const lineHex = LINE_COLORS[currentLine] || "#3D5A45";
    lineDot.style.backgroundColor = lineHex;

    dirPill.textContent = deck.dirSpec.shortDir;
    destLabel.textContent = "Towards " + deck.dirSpec.destinationTerminal;

    statusChip.textContent = deck.statusLabel;
    statusChip.className =
      "shrink-0 text-[11px] font-semibold whitespace-nowrap";
    if (deck.status === "open") {
      statusChip.classList.add("text-mapa-green");
    } else if (
      deck.status === "opening_soon" ||
      deck.status === "cutoff_window"
    ) {
      statusChip.classList.add("text-mapa-rust");
    } else {
      statusChip.classList.add("text-mapa-muted");
    }

    firstEl.textContent = formatMinutesTo12H(deck.firstMin);
    lastEl.textContent = formatMinutesTo12H(deck.lastMin);
    cutoffEl.textContent = formatMinutesTo12H(deck.cutoffMin);

    sourceBadge.textContent =
      deck.headway.shortLabel.toUpperCase() +
      " · " +
      deck.headway.rangeMin[0] +
      "-" +
      deck.headway.rangeMin[1] +
      "M";

    const firstSlot = deck.upcomingTrains[0] || null;
    if (!firstSlot) {
      countdown.textContent = "Closed";
      exactTime.textContent = "Next: " + formatMinutesTo12H(deck.firstMin);
    } else {
      countdown.textContent = formatWaitLabel(firstSlot.waitMin);
      exactTime.textContent =
        (firstSlot.isLastTrain ? "Last: " : "Est. ") + firstSlot.formattedTime;
    }

    // Render Upcoming 3 Trains cadence strip cleanly
    nextSlots.innerHTML = "";
    const labels = ["1st", "2nd", "3rd"];
    for (let i = 0; i < 3; i++) {
      const slot = deck.upcomingTrains[i];
      const cell = document.createElement("div");
      cell.className =
        "rounded-lg border px-1 py-1.5 text-center " +
        (slot
          ? i === 0
            ? "border-mapa-ink/35 bg-mapa-canvas-dark"
            : "border-mapa-contour bg-mapa-canvas-dark/60"
          : "border-mapa-contour/50 bg-mapa-canvas-dark/30 opacity-60");

      const top = document.createElement("div");
      top.className =
        "text-[9px] font-bold uppercase tracking-wider " +
        (slot && slot.isLastTrain ? "text-mapa-rust" : "text-mapa-muted");
      top.textContent = slot && slot.isLastTrain ? "Last" : labels[i];

      const mid = document.createElement("div");
      mid.className =
        "font-mono text-[10px] font-bold text-mapa-ink mt-0.5 whitespace-nowrap";
      mid.textContent = slot ? slot.formattedTime : "--:--";

      const sub = document.createElement("div");
      sub.className = "font-mono text-[9px] text-mapa-muted";
      sub.textContent = slot
        ? slot.waitMin === 0
          ? "due now"
          : "+" + slot.waitMin + "m"
        : "closed";

      cell.appendChild(top);
      cell.appendChild(mid);
      cell.appendChild(sub);
      nextSlots.appendChild(cell);
    }

    liveDetail.textContent = deck.summaryNote;
  }

  function renderTripPlannerCard(plan: TripAndTransferPlan): void {
    const tripOriginLabel = getEl<HTMLElement>("tripOriginLabel");
    const tripDestLabel = getEl<HTMLElement>("tripDestLabel");
    const tripDirectionBadge = getEl<HTMLElement>("tripDirectionBadge");
    const tripStopsDist = getEl<HTMLElement>("tripStopsDist");
    const tripWaitMin = getEl<HTMLElement>("tripWaitMin");
    const tripRideMin = getEl<HTMLElement>("tripRideMin");
    const tripArrivalClock = getEl<HTMLElement>("tripArrivalClock");
    const tripOriginCutoffBox = getEl<HTMLElement>("tripOriginCutoffBox");
    const tripOriginCutoffVerdict = getEl<HTMLElement>(
      "tripOriginCutoffVerdict",
    );
    const tripInterchangeBox = getEl<HTMLElement>("tripInterchangeBox");

    if (
      !tripOriginLabel ||
      !tripDirectionBadge ||
      !tripStopsDist ||
      !tripWaitMin ||
      !tripRideMin ||
      !tripArrivalClock ||
      !tripOriginCutoffBox ||
      !tripOriginCutoffVerdict ||
      !tripInterchangeBox
    ) {
      return;
    }

    tripOriginLabel.textContent = plan.originStation.name;
    if (tripDestLabel) tripDestLabel.textContent = plan.destStation.name;

    if (plan.isSameStation) {
      tripDirectionBadge.textContent = "Select Different Stop";
      tripStopsDist.textContent = "0 stops · 0.0 km";
      tripWaitMin.textContent = "--";
      tripRideMin.textContent = "0 min";
      tripArrivalClock.textContent = "--:--";
      tripOriginCutoffBox.className =
        "rounded-xl border border-mapa-contour bg-mapa-canvas px-3 py-2.5 text-xs text-mapa-muted";
      tripOriginCutoffVerdict.textContent =
        "Choose a destination station or interchange preset above to compute ride duration and last-train cutoff.";
    } else {
      tripDirectionBadge.textContent = plan.dirLabel;
      tripStopsDist.textContent =
        plan.stopsCount +
        (plan.stopsCount === 1 ? " stop · " : " stops · ") +
        plan.distanceKm.toFixed(1) +
        " km";

      tripWaitMin.textContent =
        plan.nextWaitMin !== null
          ? formatWaitLabel(plan.nextWaitMin)
          : "Closed";
      tripRideMin.textContent = "~" + plan.inTrainMin + " min";
      tripArrivalClock.textContent =
        plan.arrivalMin !== null
          ? formatMinutesTo12H(plan.arrivalMin)
          : "Ended";

      if (plan.originStatus === "closed") {
        tripOriginCutoffBox.className =
          "rounded-xl border border-mapa-rust/45 bg-mapa-canvas px-3 py-2.5 text-xs text-mapa-rust font-medium";
      } else if (plan.originStatus === "tight") {
        tripOriginCutoffBox.className =
          "rounded-xl border border-mapa-rust bg-mapa-canvas px-3 py-2.5 text-xs text-mapa-rust font-semibold";
      } else {
        tripOriginCutoffBox.className =
          "rounded-xl border border-mapa-green/40 bg-mapa-canvas px-3 py-2.5 text-xs text-mapa-ink";
      }
      tripOriginCutoffVerdict.textContent =
        plan.originStation.name +
        " -> " +
        plan.destStation.name +
        ": " +
        plan.originStatusLabel +
        ". Last arrival at destination: " +
        formatMinutesTo12H(plan.destLastTrainMin) +
        ".";
    }

    // Interchange Connecting Cutoff Box
    if (plan.interchange) {
      const ix = plan.interchange;
      tripInterchangeBox.classList.remove("hidden");
      tripInterchangeBox.innerHTML = "";

      const borderTone =
        ix.verdict === "safe"
          ? "border-mapa-green bg-mapa-canvas"
          : ix.verdict === "tight"
            ? "border-mapa-rust bg-mapa-canvas"
            : "border-mapa-rust/50 bg-mapa-canvas";
      tripInterchangeBox.className =
        "rounded-xl border-2 p-3 space-y-1.5 text-xs " + borderTone;

      const topRow = document.createElement("div");
      topRow.className = "flex items-center justify-between gap-2 flex-wrap";

      const title = document.createElement("span");
      title.className = "font-bold text-mapa-ink";
      title.textContent = ix.hubLabel;

      const badge = document.createElement("span");
      badge.className =
        "px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase " +
        (ix.verdict === "safe"
          ? "bg-mapa-green text-white"
          : "bg-mapa-rust text-white");
      badge.textContent = ix.verdictLabel;

      topRow.appendChild(title);
      topRow.appendChild(badge);

      const desc = document.createElement("p");
      desc.className = "text-[11px] text-mapa-ink/80 leading-snug";
      desc.textContent = ix.detailText;

      const cutoffs = document.createElement("div");
      cutoffs.className =
        "pt-1.5 border-t border-mapa-contour/70 grid grid-cols-2 gap-2 font-mono text-[10px] text-mapa-ink/85";
      cutoffs.innerHTML =
        "<div>" +
        ix.connectingLineName +
        " " +
        ix.connectingFwdDirLabel +
        " Cutoff: <strong>" +
        formatMinutesTo12H(ix.connectingFwdCutoffMin) +
        "</strong></div>" +
        "<div>" +
        ix.connectingLineName +
        " " +
        ix.connectingRevDirLabel +
        " Cutoff: <strong>" +
        formatMinutesTo12H(ix.connectingRevCutoffMin) +
        "</strong></div>";

      tripInterchangeBox.appendChild(topRow);
      tripInterchangeBox.appendChild(desc);
      tripInterchangeBox.appendChild(cutoffs);
    } else {
      tripInterchangeBox.className =
        "rounded-xl border border-mapa-contour/70 bg-mapa-canvas px-3 py-2 text-[11px] text-mapa-muted";
      tripInterchangeBox.textContent =
        "Tip: Select a transfer hub (Cubao, Doroteo Jose, Recto, Taft Ave, or EDSA) or tap a preset above to verify connecting line last-train gate cutoffs.";
    }
  }

  function ensureLeafletMap(): void {
    if (leafletMap || leafletUnavailable) return;
    if (typeof L === "undefined") {
      leafletUnavailable = true;
      mapFallbackBanner?.classList.remove("hidden");
      return;
    }

    const container = document.getElementById("live-rail-map");
    if (!container) return;

    leafletMap = L.map("live-rail-map", {
      center: [14.5995, 121.02],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(leafletMap);

    trackLayerGroup = L.layerGroup().addTo(leafletMap);
    stationLayerGroup = L.layerGroup().addTo(leafletMap);
    trainLayerGroup = L.layerGroup().addTo(leafletMap);
  }

  function fitActiveLeafletBounds(): void {
    if (!leafletMap || typeof L === "undefined") return;
    const pts: [number, number][] = [];
    const scopeKeys: LineKey[] =
      mapScope === "all" ? ["mrt3", "lrt1", "lrt2"] : [currentLine];
    scopeKeys.forEach((lk) => {
      STATIONS_DATA[lk].forEach((st) => pts.push([st.lat, st.lon]));
    });
    if (pts.length) {
      leafletMap.fitBounds(L.latLngBounds(pts), {
        paddingTopLeft: [34, 34],
        paddingBottomRight: [34, 46],
        maxZoom: mapScope === "all" ? 12 : 14,
      });
    }
  }

  function renderLeafletTracksAndStations(): void {
    ensureLeafletMap();
    if (
      !leafletMap ||
      !trackLayerGroup ||
      !stationLayerGroup ||
      typeof L === "undefined"
    ) {
      return;
    }

    trackLayerGroup.clearLayers();
    stationLayerGroup.clearLayers();

    const scopeKeys: LineKey[] =
      mapScope === "all" ? ["mrt3", "lrt1", "lrt2"] : [currentLine];
    const drawOrder = scopeKeys
      .slice()
      .sort((a, b) => (a === currentLine ? 1 : b === currentLine ? -1 : 0));

    const origIdx = findStationIndex(currentLine, currentStationId);
    const destIdx = findStationIndex(currentLine, destStationId);

    drawOrder.forEach((lk) => {
      const isActiveLine = lk === currentLine;
      const color = LINE_COLORS[lk] || "#3d5a45";
      const verts = getGeoVerticesSlice(lk);
      L.polyline(verts, {
        color,
        weight: isActiveLine ? 4.5 : 3.5,
        opacity: isActiveLine ? 0.38 : 0.35,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(trackLayerGroup);

      // Highlight planned Origin -> Destination corridor segment cleanly
      if (isActiveLine && origIdx !== destIdx) {
        const routeVerts = getGeoVerticesSlice(lk, origIdx, destIdx);
        L.polyline(routeVerts, {
          color,
          weight: 7,
          opacity: 0.96,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(trackLayerGroup);
      }
    });

    drawOrder.forEach((lk) => {
      const isActiveLine = lk === currentLine;
      const color = LINE_COLORS[lk] || "#3d5a45";
      STATIONS_DATA[lk].forEach((st) => {
        const isOrigin = lk === currentLine && st.id === currentStationId;
        const isDest = lk === currentLine && st.id === destStationId;

        if (isDest && !isOrigin) {
          L.circleMarker([st.lat, st.lon], {
            radius: 10,
            color: "#9e391a",
            weight: 2.5,
            fillColor: "#f7f3e9",
            fillOpacity: 1,
            interactive: false,
          }).addTo(stationLayerGroup);
        }

        const marker = L.circleMarker([st.lat, st.lon], {
          radius: isOrigin
            ? 8.5
            : isDest
              ? 6
              : st.isTransfer
                ? 5.5
                : isActiveLine
                  ? 4.5
                  : 3.5,
          color: isOrigin ? "#211d16" : isDest ? "#9e391a" : color,
          weight: isOrigin ? 3 : 2,
          fillColor: isOrigin ? color : isDest ? "#9e391a" : "#f7f3e9",
          fillOpacity: 1,
        });

        const roleNote = isOrigin
          ? " · Origin"
          : isDest
            ? " · Destination"
            : "";
        const clickHint =
          pickTarget === "dest"
            ? '<br/><span style="color:#9e391a;font-size:11px;">Click: set Destination</span>'
            : '<br/><span style="color:#5c5343;font-size:11px;">Click: set Origin (right-click: Dest.)</span>';
        marker.bindTooltip(
          "<strong>" +
            st.name +
            "</strong> (" +
            lk.toUpperCase() +
            ")" +
            roleNote +
            clickHint,
          { direction: "top", offset: [0, -6] },
        );

        marker.on("click", () => {
          selectStationFromVisualizer(lk, st.id);
        });

        marker.on("contextmenu", (e: any) => {
          if (
            e &&
            e.originalEvent &&
            typeof e.originalEvent.preventDefault === "function"
          ) {
            e.originalEvent.preventDefault();
          }
          selectStationFromVisualizer(lk, st.id, "dest");
        });

        marker.addTo(stationLayerGroup);
      });
    });

    const fitSig = currentLine + "|" + mapScope;
    if (fitSig !== lastFitScopeSignature) {
      lastFitScopeSignature = fitSig;
      fitActiveLeafletBounds();
    }
  }

  function buildEstIconHtml(train: SimTrainMarker): string {
    const lineHex = LINE_COLORS[train.lineKey] || "#3d5a45";
    const angle = Math.round(train.bearingDeg);
    return (
      '<div class="rail-train-pill rail-train-est" style="border-color:' +
      lineHex +
      ';">' +
      '<svg width="9" height="9" viewBox="0 0 12 12" style="transform:rotate(' +
      angle +
      'deg);display:block;flex-shrink:0;" aria-hidden="true"><path d="M6 1L11 11L6 8.5L1 11Z" fill="' +
      lineHex +
      '"/></svg>' +
      "<span>EST·" +
      train.dirShort +
      "</span></div>"
    );
  }

  function renderLeafletTrains(estTrains: SimTrainMarker[]): void {
    ensureLeafletMap();
    if (!leafletMap || !trainLayerGroup || typeof L === "undefined") return;
    trainLayerGroup.clearLayers();

    estTrains.forEach((t) => {
      const icon = L.divIcon({
        className: "rail-est-icon",
        html: buildEstIconHtml(t),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([t.lat, t.lon], {
        icon,
        zIndexOffset: t.lineKey === currentLine ? 250 : 120,
      });
      const lineMeta =
        RAIL_LINES.find((l) => l.id === t.lineKey) || RAIL_LINES[0];
      marker.bindPopup(
        '<div style="font-size:12px;line-height:1.35;">' +
          "<strong>" +
          lineMeta.shortName +
          " " +
          t.dirName +
          " (Schedule Estimate)</strong><br/>" +
          "Between " +
          t.fromName +
          " and " +
          t.toName +
          ".<br/>" +
          '<span style="color:#5c5343;">Simulated from official dispatch cadence, not live operator GPS.</span>' +
          "</div>",
      );
      marker.addTo(trainLayerGroup);
    });
  }

  function renderDiagramView(estTrains: SimTrainMarker[]): void {
    if (!railDiagramSvg) return;
    railDiagramSvg.innerHTML = "";

    const scopeKeys: LineKey[] =
      mapScope === "all" ? ["mrt3", "lrt1", "lrt2"] : [currentLine];
    if (mapScope === "all") {
      railDiagramSvg.setAttribute("viewBox", "0 0 1260 1280");
    } else {
      const pts = diagramPts[currentLine];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      pts.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      const padL = currentLine === "lrt1" ? 190 : 120;
      const padR = currentLine === "lrt1" ? 120 : 210;
      const vbX = Math.max(0, Math.round(minX - padL));
      const vbY = Math.max(0, Math.round(minY - 70));
      const vbW = Math.max(420, Math.round(maxX - minX + padL + padR));
      const vbH = Math.max(420, Math.round(maxY - minY + 150));
      railDiagramSvg.setAttribute(
        "viewBox",
        vbX + " " + vbY + " " + vbW + " " + vbH,
      );
    }

    const gLines = svgEl("g", { id: "dg-lines" });
    scopeKeys.forEach((lk) => {
      const isActive = lk === currentLine;
      gLines.appendChild(
        svgEl("path", {
          d: roundedSvgPath(diagramPts[lk], 26),
          fill: "none",
          stroke: LINE_COLORS[lk] || "#3d5a45",
          "stroke-width": isActive ? 10 : 7,
          "stroke-opacity": isActive ? 0.35 : 0.35,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
      );

      if (isActive && currentStationId !== destStationId) {
        const iOrig = diagramIndexByStation[lk][currentStationId];
        const iDest = diagramIndexByStation[lk][destStationId];
        if (iOrig !== undefined && iDest !== undefined) {
          const lo = Math.min(iOrig, iDest);
          const hi = Math.max(iOrig, iDest);
          const segPts = diagramPts[lk].slice(lo, hi + 1);
          if (segPts.length >= 2) {
            gLines.appendChild(
              svgEl("path", {
                d: roundedSvgPath(segPts, 26),
                fill: "none",
                stroke: LINE_COLORS[lk] || "#3d5a45",
                "stroke-width": 12,
                "stroke-opacity": 0.95,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
              }),
            );
          }
        }
      }
    });
    railDiagramSvg.appendChild(gLines);

    if (mapScope === "all") {
      const gLinks = svgEl("g", { id: "dg-links" });
      DIAGRAM_LINKS.forEach(([a, b]) => {
        const pa = diagramPos[a];
        const pb = diagramPos[b];
        if (pa && pb) {
          gLinks.appendChild(
            svgEl("line", {
              x1: pa.x,
              y1: pa.y,
              x2: pb.x,
              y2: pb.y,
              stroke: "#211d16",
              "stroke-width": 4,
              "stroke-dasharray": "6 5",
              "stroke-linecap": "round",
            }),
          );
        }
      });
      railDiagramSvg.appendChild(gLinks);
    }

    const gStations = svgEl("g", { id: "dg-stations" });
    const gLabels = svgEl("g", {
      id: "dg-labels",
      "font-family": "ui-sans-serif, system-ui, -apple-system, sans-serif",
      "font-size": mapScope === "all" ? "14" : "16",
      "font-weight": "700",
      fill: "#211d16",
      "paint-order": "stroke fill",
      stroke: "#F7F3E9",
      "stroke-width": "5px",
      "stroke-linejoin": "round",
      "pointer-events": "none",
    });

    scopeKeys.forEach((lk) => {
      const lineHex = LINE_COLORS[lk] || "#3d5a45";
      STATIONS_DATA[lk].forEach((st, idx) => {
        const pos = diagramPos[st.id];
        if (!pos) return;
        const isOrigin = lk === currentLine && st.id === currentStationId;
        const isDest = lk === currentLine && st.id === destStationId;

        if (isDest && !isOrigin) {
          gStations.appendChild(
            svgEl("circle", {
              cx: pos.x,
              cy: pos.y,
              r: 14,
              fill: "#f7f3e9",
              stroke: "#9e391a",
              "stroke-width": 3,
            }),
          );
        }

        const c = svgEl("circle", {
          cx: pos.x,
          cy: pos.y,
          r: isOrigin ? 11 : isDest ? 8 : st.isTransfer ? 8 : 6.5,
          fill: isOrigin ? lineHex : isDest ? "#9e391a" : "#f7f3e9",
          stroke: isOrigin ? "#211d16" : isDest ? "#9e391a" : lineHex,
          "stroke-width": isOrigin ? 4 : 3,
          style: "cursor:pointer;",
        });

        c.addEventListener("click", () => {
          selectStationFromVisualizer(lk, st.id);
        });

        c.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          selectStationFromVisualizer(lk, st.id, "dest");
        });

        gStations.appendChild(c);

        const lbl = getDiagramLabelPos(lk, st.id, pos.x, pos.y, idx);
        const txt = svgEl("text", {
          x: lbl.lx,
          y: lbl.ly,
          "text-anchor": lbl.anchor,
          fill: isOrigin || isDest ? "#211d16" : "#3a3428",
        });
        txt.textContent = shortDiagramName(st);
        gLabels.appendChild(txt);
      });
    });

    railDiagramSvg.appendChild(gStations);
    railDiagramSvg.appendChild(gLabels);

    const gTrains = svgEl("g", { id: "dg-trains" });
    estTrains.forEach((t) => {
      const g = svgEl("g", {
        transform:
          "translate(" + t.svgX.toFixed(1) + "," + t.svgY.toFixed(1) + ")",
      });
      const halo = svgEl("circle", {
        r: 12,
        fill: "#f7f3e9",
        stroke: LINE_COLORS[t.lineKey] || "#3d5a45",
        "stroke-width": 2.5,
        "stroke-dasharray": "4 3",
      });
      const tri = svgEl("path", {
        d: "M0,-7 L6,5 L0,2.5 L-6,5 Z",
        fill: LINE_COLORS[t.lineKey] || "#3d5a45",
        transform: "rotate(" + Math.round(t.svgAngleDeg) + ")",
      });
      g.appendChild(halo);
      g.appendChild(tri);
      gTrains.appendChild(g);
    });
    railDiagramSvg.appendChild(gTrains);
  }

  function renderStationSpine(
    isWeekend: boolean,
    estByIndex: Record<number, { fwd: boolean; rev: boolean }>,
  ): void {
    const table = TIMETABLES[currentLine];
    const lineHex = LINE_COLORS[currentLine] || "#3D5A45";
    const spec = SCHEDULE_SPECS[currentLine];
    const meta = RAIL_LINES.find((l) => l.id === currentLine) || RAIL_LINES[0];

    const q = stationFilterQuery.trim().toLowerCase();
    const visibleRows = table.filter((row) => {
      if (!q) return true;
      return (
        row.station.name.toLowerCase().includes(q) ||
        row.station.city.toLowerCase().includes(q) ||
        (row.station.transferLabel &&
          row.station.transferLabel.toLowerCase().includes(q))
      );
    });

    const prevScrollTop = stationSpineScroll!.scrollTop;
    stationSpineScroll!.innerHTML = "";

    if (!visibleRows.length) {
      const empty = document.createElement("div");
      empty.className =
        "p-4 text-xs text-mapa-muted bg-mapa-canvas border border-mapa-contour rounded-xl";
      empty.textContent =
        "No stations on " +
        meta.shortName +
        ' match "' +
        stationFilterQuery +
        '".';
      stationSpineScroll!.appendChild(empty);
      return;
    }

    const dirCodeFwd = spec.forward.shortDir === "Eastbound" ? "EB" : "SB";
    const dirCodeRev = spec.reverse.shortDir === "Westbound" ? "WB" : "NB";

    visibleRows.forEach((row, visibleIdx) => {
      const st = row.station;
      const isOrigin = st.id === currentStationId;
      const isDest = st.id === destStationId;
      const isFirstVisible = visibleIdx === 0;
      const isLastVisible = visibleIdx === visibleRows.length - 1;
      const firstTime = isWeekend ? row.weekendFirstFwd : row.weekdayFirstFwd;
      const lastTime = isWeekend ? row.weekendLastFwd : row.weekdayLastFwd;
      const estTrain = estByIndex[row.index];

      const btn = document.createElement("div");
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.className =
        "relative w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl transition-colors cursor-pointer group " +
        (isOrigin
          ? "bg-mapa-canvas border-2 border-mapa-ink shadow-2xs"
          : isDest
            ? "bg-mapa-canvas border-2 border-mapa-rust shadow-2xs"
            : "bg-mapa-canvas-dark border border-transparent hover:border-mapa-contour hover:bg-mapa-canvas");

      if (!isFirstVisible) {
        const segTop = document.createElement("span");
        segTop.className =
          "absolute left-[-16px] top-[-10px] bottom-1/2 w-1.5 z-0 pointer-events-none";
        segTop.style.backgroundColor = lineHex;
        segTop.style.opacity = "0.35";
        btn.appendChild(segTop);
      }
      if (!isLastVisible) {
        const segBot = document.createElement("span");
        segBot.className =
          "absolute left-[-16px] top-1/2 bottom-[-10px] w-1.5 z-0 pointer-events-none";
        segBot.style.backgroundColor = lineHex;
        segBot.style.opacity = "0.35";
        btn.appendChild(segBot);
      }

      const node = document.createElement("span");
      node.className =
        "absolute left-[-23px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 pointer-events-none";
      node.style.borderColor = isDest && !isOrigin ? "#9e391a" : lineHex;
      node.style.backgroundColor = isOrigin
        ? lineHex
        : isDest
          ? "#9e391a"
          : "#f7f3e9";
      if (!isOrigin && !isDest && st.isTransfer) {
        const inner = document.createElement("span");
        inner.className = "w-1.5 h-1.5 rounded-full";
        inner.style.backgroundColor = lineHex;
        node.appendChild(inner);
      }
      btn.appendChild(node);

      const left = document.createElement("div");
      left.className = "min-w-0 flex-1";

      const titleRow = document.createElement("div");
      titleRow.className = "flex items-center gap-2 flex-wrap";
      const nameEl = document.createElement("span");
      nameEl.className =
        "font-serif font-bold text-sm text-mapa-ink group-hover:text-mapa-green transition-colors";
      nameEl.textContent = st.name;
      titleRow.appendChild(nameEl);

      if (isOrigin) {
        const origTag = document.createElement("span");
        origTag.className =
          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-mapa-ink text-white";
        origTag.textContent = "Origin";
        titleRow.appendChild(origTag);
      }
      if (isDest) {
        const destTag = document.createElement("span");
        destTag.className =
          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-mapa-rust text-white";
        destTag.textContent = "Dest.";
        titleRow.appendChild(destTag);
      }

      const metaRow = document.createElement("div");
      metaRow.className = "text-[11px] text-mapa-muted mt-0.5";
      metaRow.textContent =
        st.city +
        " · km " +
        st.km.toFixed(1) +
        " · First " +
        formatMinutesTo12H(firstTime) +
        " / Last " +
        formatMinutesTo12H(lastTime);

      left.appendChild(titleRow);
      left.appendChild(metaRow);

      if (st.isTransfer && st.transferLabel) {
        const xfer = document.createElement("div");
        xfer.className = "mt-1";
        const xferTag = document.createElement("span");
        xferTag.className =
          "inline-block px-1.5 py-0.5 rounded border border-mapa-contour bg-mapa-canvas text-[10px] font-medium text-mapa-ink/80";
        xferTag.textContent = st.transferLabel;
        xfer.appendChild(xferTag);
        left.appendChild(xfer);
      }

      const right = document.createElement("div");
      right.className = "shrink-0 flex flex-col items-end gap-1.5";
      if (estTrain && (estTrain.fwd || estTrain.rev)) {
        const estTag = document.createElement("span");
        estTag.className =
          "px-1.5 py-0.5 rounded border border-dashed border-mapa-contour bg-mapa-canvas font-mono text-[10px] font-semibold text-mapa-ink/75";
        const parts: string[] = [];
        if (estTrain.fwd) parts.push("EST " + dirCodeFwd);
        if (estTrain.rev) parts.push("EST " + dirCodeRev);
        estTag.textContent = parts.join(" | ");
        right.appendChild(estTag);
      }

      const pickActions = document.createElement("div");
      pickActions.className = "flex items-center gap-1";

      const fromBtn = document.createElement("button");
      fromBtn.type = "button";
      fromBtn.className =
        "px-2 py-0.5 rounded border text-[10px] font-bold transition-colors cursor-pointer " +
        (isOrigin
          ? "bg-mapa-ink text-white border-mapa-ink"
          : "bg-mapa-canvas border-mapa-contour text-mapa-ink/80 hover:border-mapa-ink hover:text-mapa-ink");
      fromBtn.textContent = "From";
      fromBtn.title = "Set " + st.name + " as Origin";
      fromBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectStationFromVisualizer(currentLine, st.id, "origin");
      });

      const toBtn = document.createElement("button");
      toBtn.type = "button";
      toBtn.className =
        "px-2 py-0.5 rounded border text-[10px] font-bold transition-colors cursor-pointer " +
        (isDest
          ? "bg-mapa-rust text-white border-mapa-rust"
          : "bg-mapa-canvas border-mapa-contour text-mapa-rust hover:border-mapa-rust");
      toBtn.textContent = "To";
      toBtn.title = "Set " + st.name + " as Destination";
      toBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectStationFromVisualizer(currentLine, st.id, "dest");
      });

      pickActions.appendChild(fromBtn);
      pickActions.appendChild(toBtn);
      right.appendChild(pickActions);

      btn.appendChild(left);
      btn.appendChild(right);
      btn.addEventListener("click", () => {
        selectStationFromVisualizer(currentLine, st.id);
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectStationFromVisualizer(currentLine, st.id);
        }
      });

      stationSpineScroll!.appendChild(btn);
    });

    stationSpineScroll!.scrollTop = prevScrollTop;
  }

  function computeScopedTrains(clock: ManilaClock, isWeekend: boolean) {
    const scopeKeys: LineKey[] =
      mapScope === "all" ? ["mrt3", "lrt1", "lrt2"] : [currentLine];
    let scopedEst: SimTrainMarker[] = [];
    let activeLineEstByIndex: Record<number, { fwd: boolean; rev: boolean }> =
      {};

    (["mrt3", "lrt1", "lrt2"] as LineKey[]).forEach((lk) => {
      const snap = computeLineSimulatedTrains(lk, clock, isWeekend);
      if (lk === currentLine) {
        activeLineEstByIndex = snap.estByIndex;
      }
      if (scopeKeys.includes(lk)) {
        scopedEst = scopedEst.concat(snap.estTrains);
      }
    });

    return { scopedEst, activeLineEstByIndex };
  }

  function refreshVisualizersOnly(): void {
    const clock = getManilaClock();
    const isWeekend = getEffectiveIsWeekend(clock);
    const { scopedEst } = computeScopedTrains(clock, isWeekend);

    if (mapTrainCountBadge) {
      mapTrainCountBadge.textContent = scopedEst.length + " EST TRAINS";
    }
    updateScheduleModeBanner(clock, isWeekend, scopedEst.length);

    if (viewMode === "map") {
      renderLeafletTrains(scopedEst);
    } else if (viewMode === "diagram") {
      renderDiagramView(scopedEst);
    }
  }

  function renderAll(): void {
    const clock = getManilaClock();
    lastRenderedMinute = clock.totalMin;
    const isWeekend = getEffectiveIsWeekend(clock);
    const lineMeta =
      RAIL_LINES.find((l) => l.id === currentLine) || RAIL_LINES[0];
    const origSt =
      STATIONS_DATA[currentLine].find((s) => s.id === currentStationId) ||
      STATIONS_DATA[currentLine][0];

    updateLineTabsUI();
    updatePickTargetUI();
    updateViewModeUI();
    updateMapScopeUI();

    manilaClockEl!.textContent = clock.formatted;
    if (manilaDayTagEl) {
      manilaDayTagEl.textContent =
        clock.weekdayLabel + " · " + (isWeekend ? "Weekend" : "Weekday");
    }

    if (corridorHeading) {
      corridorHeading.textContent =
        viewMode === "list"
          ? lineMeta.name + " Station List"
          : mapScope === "all"
            ? "Metro Manila 3-Line Corridor"
            : lineMeta.name +
              (viewMode === "diagram" ? " Schematic Network" : " Corridor Map");
    }

    if (lineOperatorMeta) {
      const targetWord = pickTarget === "dest" ? "Destination" : "Origin";
      lineOperatorMeta.textContent =
        lineMeta.operator +
        " · " +
        lineMeta.stationsCount +
        " stations · Tap any stop to set " +
        targetWord;
    }

    if (stationMetaNote) {
      stationMetaNote.textContent =
        origSt.name + " (" + origSt.city + ") · km " + origSt.km.toFixed(1);
    }

    const { scopedEst, activeLineEstByIndex } = computeScopedTrains(
      clock,
      isWeekend,
    );

    if (mapTrainCountBadge) {
      mapTrainCountBadge.textContent = scopedEst.length + " EST TRAINS";
    }
    updateScheduleModeBanner(clock, isWeekend, scopedEst.length);

    const fwdDeck = computeDirectionScheduleDeck(
      currentLine,
      currentStationId,
      "fwd",
      clock.exactMin,
      isWeekend,
      TIMETABLES[currentLine],
    );
    const revDeck = computeDirectionScheduleDeck(
      currentLine,
      currentStationId,
      "rev",
      clock.exactMin,
      isWeekend,
      TIMETABLES[currentLine],
    );

    renderDirectionCard("fwd", fwdDeck);
    renderDirectionCard("rev", revDeck);

    const tripPlan = computeTripAndTransferPlan(
      currentLine,
      currentStationId,
      destStationId,
      clock.exactMin,
      isWeekend,
    );
    renderTripPlannerCard(tripPlan);

    renderLeafletTracksAndStations();
    renderLeafletTrains(scopedEst);
    renderDiagramView(scopedEst);
    renderStationSpine(isWeekend, activeLineEstByIndex);

    if (serviceAlertBanner) {
      const bothClosed =
        fwdDeck.status === "closed" && revDeck.status === "closed";
      const cutoffSoon =
        fwdDeck.status === "cutoff_window" ||
        revDeck.status === "cutoff_window";
      if (bothClosed) {
        serviceAlertBanner.classList.remove("hidden");
        serviceAlertBanner.className =
          "rounded-xl border border-mapa-rust/35 bg-mapa-canvas text-mapa-rust px-3.5 py-2.5 text-xs font-medium";
        serviceAlertBanner.textContent =
          lineMeta.shortName +
          " passenger service at " +
          origSt.name +
          " is currently closed. Overnight riders along EDSA can use the 24/7 EDSA Carousel.";
      } else if (cutoffSoon) {
        serviceAlertBanner.classList.remove("hidden");
        serviceAlertBanner.className =
          "rounded-xl border border-mapa-rust/35 bg-mapa-canvas text-mapa-rust px-3.5 py-2.5 text-xs font-medium";
        serviceAlertBanner.textContent =
          "Closing notice: final train gate cutoff is active or approaching within minutes.";
      } else {
        serviceAlertBanner.classList.add("hidden");
      }
    }
  }

  function switchLine(
    newLine: LineKey,
    preferredOrigin?: string | null,
    preferredDest?: string | null,
  ): void {
    if (!STATIONS_DATA[newLine]) return;
    currentLine = newLine;
    stationFilterQuery = "";
    if (stationFilterInput) stationFilterInput.value = "";
    populateStationDropdowns(preferredOrigin, preferredDest);
    updateUrlParams();
    renderAll();
  }

  async function handleGpsLocate(): Promise<void> {
    if (!gpsLocateBtn || !gpsStatusBanner) return;

    if (!navigator.geolocation) {
      showGpsBanner(
        "rust",
        "Geolocation is not supported in this browser. Pick your station from the dropdown or map below.",
      );
      return;
    }

    if (!window.isSecureContext) {
      showGpsBanner(
        "rust",
        "Browser location requires a secure HTTPS connection. Pick your station manually below.",
      );
      return;
    }

    if (
      navigator.permissions &&
      typeof navigator.permissions.query === "function"
    ) {
      try {
        const perm = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        if (perm.state === "denied") {
          showGpsBanner(
            "rust",
            "Location access is blocked for this site. Open your browser's site settings (lock or settings icon in the address bar), allow Location, and try again, or pick your station directly below.",
          );
          return;
        }
      } catch {
        // Ignore Permissions API restriction and continue with getCurrentPosition
      }
    }

    gpsLocateBtn.disabled = true;
    const origSpan = gpsLocateBtn.querySelector("span");
    if (origSpan) origSpan.textContent = "Locating...";

    const onSuccess = (pos: GeolocationPosition) => {
      gpsLocateBtn.disabled = false;
      if (origSpan) origSpan.textContent = "Use My GPS";

      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      interface GpsStationMatch {
        lineKey: LineKey;
        stationId: string;
        stationName: string;
        distMeters: number;
      }
      let best: GpsStationMatch | null = null;

      for (const lk of ["mrt3", "lrt1", "lrt2"] as LineKey[]) {
        for (const st of STATIONS_DATA[lk]) {
          const d = haversineMeters(userLat, userLon, st.lat, st.lon);
          if (!best || d < best.distMeters) {
            best = {
              lineKey: lk,
              stationId: st.id,
              stationName: st.name,
              distMeters: Math.round(d),
            };
          }
        }
      }

      if (best && best.distMeters <= GPS_MAX_RADIUS_METERS) {
        showGpsBanner(
          "green",
          "Snapped locally to " +
            best.stationName +
            " (" +
            best.lineKey.toUpperCase() +
            ", ~" +
            best.distMeters +
            "m away). Coordinates never leave your browser.",
        );
        switchLine(best.lineKey, best.stationId, null);
      } else if (best) {
        const chosen = best;
        showGpsBanner(
          "neutral",
          "Nearest rail station is " +
            chosen.stationName +
            " (~" +
            (chosen.distMeters / 1000).toFixed(1) +
            " km away, outside 650m station radius).",
          {
            label: "Use " + chosen.stationName,
            onClick: () => {
              selectStationFromVisualizer(
                chosen.lineKey,
                chosen.stationId,
                "origin",
              );
            },
          },
        );
        renderAll();
      }
    };

    const onFinalError = (geoErr: GeolocationPositionError) => {
      gpsLocateBtn.disabled = false;
      if (origSpan) origSpan.textContent = "Use My GPS";

      let msg =
        "Your device could not get a location fix right now. Pick your station from the dropdown, map, or quick hubs below.";
      if (geoErr && geoErr.code === 1) {
        msg =
          "Location access is blocked for this site. Open your browser's site settings (lock or settings icon in the address bar), allow Location, and try again, or pick your station directly below.";
      } else if (geoErr && geoErr.code === 3) {
        msg =
          "Location lookup timed out. Check your signal and retry, or select your station manually.";
      }
      showGpsBanner("rust", msg);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (geoErr) => {
        if (geoErr && (geoErr.code === 2 || geoErr.code === 3)) {
          navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          });
          return;
        }
        onFinalError(geoErr);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }

  // Event listeners
  document
    .querySelectorAll<HTMLButtonElement>(".line-tab-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        hideGpsBanner();
        const line = btn.getAttribute("data-line-tab") as LineKey | null;
        if (line) switchLine(line);
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".pick-target-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-pick-target") as
          "origin" | "dest" | null;
        if (target) {
          pickTarget = target;
          updatePickTargetUI();
          renderAll();
        }
      });
    });

  stationSelect.addEventListener("change", () => {
    hideGpsBanner();
    currentStationId = stationSelect.value;
    updateUrlParams();
    renderAll();
  });

  destStationSelect.addEventListener("change", () => {
    hideGpsBanner();
    destStationId = destStationSelect.value;
    updateUrlParams();
    renderAll();
  });

  if (swapStationsBtn) {
    swapStationsBtn.addEventListener("click", () => {
      hideGpsBanner();
      const prevOrig = currentStationId;
      currentStationId = destStationId;
      destStationId = prevOrig;
      stationSelect.value = currentStationId;
      destStationSelect.value = destStationId;
      updateUrlParams();
      renderAll();
    });
  }

  document
    .querySelectorAll<HTMLButtonElement>(".transfer-preset-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        hideGpsBanner();
        const line = btn.getAttribute("data-preset-line") as LineKey | null;
        const orig = btn.getAttribute("data-preset-origin");
        const dest = btn.getAttribute("data-preset-dest");
        if (line && dest) {
          const targetOrig =
            line === currentLine && !orig ? currentStationId : orig;
          switchLine(line, targetOrig, dest);
        }
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".view-mode-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const m = btn.getAttribute("data-view-mode") as
          "map" | "diagram" | "list" | null;
        if (m) {
          viewMode = m;
          renderAll();
        }
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".map-scope-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const sc = btn.getAttribute("data-map-scope") as "focus" | "all" | null;
        if (sc) {
          mapScope = sc;
          renderAll();
        }
      });
    });

  if (resetMapViewBtn) {
    resetMapViewBtn.addEventListener("click", () => {
      fitActiveLeafletBounds();
    });
  }

  if (scheduleModeActionBtn) {
    scheduleModeActionBtn.addEventListener("click", () => {
      const card = document.getElementById("tripPlannerCard");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (stationFilterInput) {
    stationFilterInput.addEventListener("input", () => {
      stationFilterQuery = stationFilterInput.value || "";
      const clock = getManilaClock();
      const isWeekend = getEffectiveIsWeekend(clock);
      const { activeLineEstByIndex } = computeScopedTrains(clock, isWeekend);
      renderStationSpine(isWeekend, activeLineEstByIndex);
    });
  }

  document
    .querySelectorAll<HTMLButtonElement>(".day-mode-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-day-btn") as
          "auto" | "weekday" | "weekend" | null;
        dayMode = mode || "auto";
        document
          .querySelectorAll<HTMLButtonElement>(".day-mode-btn")
          .forEach((b) => {
            b.className =
              b.getAttribute("data-day-btn") === dayMode
                ? "day-mode-btn h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap bg-mapa-green text-white"
                : "day-mode-btn h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap text-mapa-ink/75 hover:text-mapa-ink";
          });
        renderAll();
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".quick-hub-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const hubLine = btn.getAttribute("data-hub-line") as LineKey | null;
        const hubStation = btn.getAttribute("data-hub-station");
        if (hubLine && hubStation) {
          selectStationFromVisualizer(hubLine, hubStation);
        }
      });
    });

  gpsLocateBtn?.addEventListener("click", handleGpsLocate);

  // Initial URL hydration
  try {
    const params = new URLSearchParams(window.location.search);
    const qLine = params.get("line") as LineKey | null;
    const qStation = params.get("station");
    const qDest = params.get("dest");
    if (qLine && STATIONS_DATA[qLine]) currentLine = qLine;
    populateStationDropdowns(qStation, qDest);
  } catch {
    populateStationDropdowns(null, null);
  }

  renderAll();

  setInterval(() => {
    if (document.hidden) return;
    const clock = getManilaClock();
    manilaClockEl.textContent = clock.formatted;
    if (lastRenderedMinute !== clock.totalMin) {
      lastRenderedMinute = clock.totalMin;
      renderAll();
    }
  }, 1000);

  setInterval(() => {
    if (!document.hidden) refreshVisualizersOnly();
  }, 5000);
}

initTrainArrivalTracker();
