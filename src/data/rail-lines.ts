/**
 * @file rail-lines.ts
 * @description Shared Metro Manila rail master dataset (LRT-1, LRT-2, MRT-3)
 * powering station maps, fare matrices, and schedule/headway estimators.
 */

export type LineKey = "lrt1" | "mrt3" | "lrt2";

export interface RailLineMeta {
  id: LineKey;
  name: string;
  shortName: string;
  operator: string;
  color: string;
  bgLight: string;
  terminals: string;
  trains: string;
  stationsCount: number;
  operatingHours: string;
  officialUrl: string;
  advisoryLabel: string;
  advisoryUrl: string;
}

export interface RawStation {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  km: number;
  isTransfer: boolean;
  lineName: string;
  transferLabel?: string;
  transferTo?: string;
}

export interface StationItem extends RawStation {
  lineKey: LineKey;
  indexInLine: number;
}

export interface DirectionSchedule {
  label: string;
  shortDir: string;
  destinationTerminal: string;
  originTerminal: string;
  weekdayFirstMin: number;
  weekdayLastMin: number;
  weekendFirstMin: number;
  weekendLastMin: number;
}

export interface LineScheduleSpec {
  lineKey: LineKey;
  totalKm: number;
  minPerKm: number;
  dwellMinPerStop: number;
  gateOpenMin: number;
  gateCutoffBeforeLastMin: number;
  peakMorningStartMin: number;
  peakMorningEndMin: number;
  peakEveningStartMin: number;
  peakEveningEndMin: number;
  peakHeadwayMin: [number, number];
  offPeakHeadwayMin: [number, number];
  weekendHeadwayMin: [number, number];
  lateNightHeadwayMin: [number, number];
  forward: DirectionSchedule;
  reverse: DirectionSchedule;
  scheduleNote: string;
}

export const RAIL_LINES: RailLineMeta[] = [
  {
    id: "lrt1",
    name: "LRT Line 1",
    shortName: "LRT-1",
    operator: "LRTC / Light Rail Manila Corporation (LRMC)",
    color: "#3D5A45",
    bgLight: "bg-mapa-green/10 text-mapa-green border-mapa-green/30",
    terminals: "Fernando Poe Jr. (North) <-> Dr. Santos (South)",
    trains: "Light Rail Vehicles (1G, 2G, 3G, 4G CAF)",
    stationsCount: 25,
    operatingHours: "4:30 AM - 10:45 PM (Weekdays)",
    officialUrl: "https://lrmc.ph",
    advisoryLabel: "LRMC Official Announcements",
    advisoryUrl: "https://lrmc.ph/announcements/",
  },
  {
    id: "mrt3",
    name: "MRT Line 3",
    shortName: "MRT-3",
    operator: "Department of Transportation (DOTr MRT-3)",
    color: "#1B2A4A",
    bgLight: "bg-mapa-navy/10 text-mapa-navy border-mapa-navy/30",
    terminals: "North Avenue <-> Taft Avenue",
    trains: "CKD Tatra RT8D5M / Dalian 8MLB",
    stationsCount: 13,
    operatingHours: "4:36 AM - 11:09 PM (Weekdays Extended)",
    officialUrl: "https://dotrmrt3.gov.ph",
    advisoryLabel: "DOTr MRT-3 Service Portal",
    advisoryUrl: "https://dotrmrt3.gov.ph/",
  },
  {
    id: "lrt2",
    name: "LRT Line 2",
    shortName: "LRT-2",
    operator: "Light Rail Transit Authority (LRTA)",
    color: "#9E391A",
    bgLight: "bg-mapa-rust/10 text-mapa-rust border-mapa-rust/30",
    terminals: "Recto (Manila) <-> Antipolo (Rizal)",
    trains: "Rotem Heavy Rail EMUs",
    stationsCount: 13,
    operatingHours: "5:00 AM - 9:30 PM",
    officialUrl: "https://www.lrta.gov.ph",
    advisoryLabel: "LRTA Official Portal",
    advisoryUrl: "https://www.lrta.gov.ph/",
  },
];

export const STATIONS_DATA: Record<LineKey, RawStation[]> = {
  lrt1: [
    {
      id: "lrt1_fpj",
      name: "Fernando Poe Jr. (Roosevelt)",
      city: "Quezon City",
      lat: 14.6576,
      lon: 121.0211,
      km: 0.0,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_balintawak",
      name: "Balintawak",
      city: "Quezon City",
      lat: 14.6574,
      lon: 121.0042,
      km: 1.8,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_monumento",
      name: "Monumento",
      city: "Caloocan",
      lat: 14.6543,
      lon: 120.9839,
      km: 4.1,
      isTransfer: true,
      transferLabel: "EDSA Carousel Stop",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_5th_ave",
      name: "5th Avenue",
      city: "Caloocan",
      lat: 14.6444,
      lon: 120.9836,
      km: 5.2,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_r_papa",
      name: "R. Papa",
      city: "Manila",
      lat: 14.6361,
      lon: 120.9831,
      km: 6.2,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_abad_santos",
      name: "Abad Santos",
      city: "Manila",
      lat: 14.6306,
      lon: 120.9814,
      km: 6.9,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_blumentritt",
      name: "Blumentritt",
      city: "Manila",
      lat: 14.6226,
      lon: 120.9831,
      km: 7.8,
      isTransfer: true,
      transferLabel: "PNR Blumentritt Link",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_tayuman",
      name: "Tayuman",
      city: "Manila",
      lat: 14.6167,
      lon: 120.9831,
      km: 8.5,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_bambang",
      name: "Bambang",
      city: "Manila",
      lat: 14.6083,
      lon: 120.9822,
      km: 9.1,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_doroteo_jose",
      name: "Doroteo Jose",
      city: "Manila",
      lat: 14.6053,
      lon: 120.9819,
      km: 9.8,
      isTransfer: true,
      transferTo: "lrt2_recto",
      transferLabel: "Walkway to LRT-2 Recto",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_carriedo",
      name: "Carriedo",
      city: "Manila",
      lat: 14.5997,
      lon: 120.9814,
      km: 10.5,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_central",
      name: "Central Terminal",
      city: "Manila",
      lat: 14.5928,
      lon: 120.9817,
      km: 11.2,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_un_ave",
      name: "United Nations",
      city: "Manila",
      lat: 14.5828,
      lon: 120.9844,
      km: 12.4,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_pedro_gil",
      name: "Pedro Gil",
      city: "Manila",
      lat: 14.5767,
      lon: 120.9875,
      km: 13.2,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_quirino",
      name: "Quirino",
      city: "Manila",
      lat: 14.5703,
      lon: 120.9917,
      km: 14.0,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_vito_cruz",
      name: "Vito Cruz",
      city: "Manila",
      lat: 14.5636,
      lon: 120.9947,
      km: 14.8,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_gil_puyat",
      name: "Gil Puyat (Buendia)",
      city: "Pasay",
      lat: 14.5542,
      lon: 120.9972,
      km: 15.8,
      isTransfer: true,
      transferLabel: "Batangas/Laguna Bus Hub",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_libertad",
      name: "Libertad",
      city: "Pasay",
      lat: 14.5478,
      lon: 120.9986,
      km: 16.6,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_edsa",
      name: "EDSA",
      city: "Pasay",
      lat: 14.5389,
      lon: 121.0006,
      km: 17.6,
      isTransfer: true,
      transferTo: "mrt3_taft",
      transferLabel: "Walkway to MRT-3 Taft & Busway",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_baclaran",
      name: "Baclaran",
      city: "Pasay",
      lat: 14.5342,
      lon: 120.9983,
      km: 18.2,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_redemptorist",
      name: "Redemptorist (Aseana)",
      city: "Parañaque",
      lat: 14.529,
      lon: 120.995,
      km: 19.3,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_mia_road",
      name: "MIA Road",
      city: "Parañaque",
      lat: 14.52,
      lon: 120.992,
      km: 20.6,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_asia_world",
      name: "Asia World (PITX)",
      city: "Parañaque",
      lat: 14.512,
      lon: 120.991,
      km: 21.8,
      isTransfer: true,
      transferLabel: "Direct link to PITX Busway",
      lineName: "LRT-1",
    },
    {
      id: "lrt1_ninoy_aquino",
      name: "Ninoy Aquino",
      city: "Parañaque",
      lat: 14.503,
      lon: 120.9925,
      km: 23.1,
      isTransfer: false,
      lineName: "LRT-1",
    },
    {
      id: "lrt1_dr_santos",
      name: "Dr. Santos (Sucat)",
      city: "Parañaque",
      lat: 14.492,
      lon: 120.995,
      km: 24.5,
      isTransfer: false,
      lineName: "LRT-1",
    },
  ],
  mrt3: [
    {
      id: "mrt3_north",
      name: "North Avenue",
      city: "Quezon City",
      lat: 14.6531,
      lon: 121.0322,
      km: 0.0,
      isTransfer: true,
      transferLabel: "EDSA Busway & TriNoma Hub",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_q_ave",
      name: "Quezon Avenue",
      city: "Quezon City",
      lat: 14.6425,
      lon: 121.0383,
      km: 1.2,
      isTransfer: true,
      transferLabel: "EDSA Busway Q-Ave",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_kamuning",
      name: "GMA-Kamuning",
      city: "Quezon City",
      lat: 14.6353,
      lon: 121.0433,
      km: 2.2,
      isTransfer: false,
      lineName: "MRT-3",
    },
    {
      id: "mrt3_cubao",
      name: "Araneta Center-Cubao",
      city: "Quezon City",
      lat: 14.6194,
      lon: 121.0519,
      km: 4.1,
      isTransfer: true,
      transferTo: "lrt2_cubao",
      transferLabel: "Transfer to LRT-2 via Farmers/Gateway",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_santolan",
      name: "Santolan-Annapolis",
      city: "Quezon City",
      lat: 14.6078,
      lon: 121.0564,
      km: 5.6,
      isTransfer: true,
      transferLabel: "EDSA Busway Santolan",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_ortigas",
      name: "Ortigas",
      city: "Mandaluyong",
      lat: 14.5878,
      lon: 121.0567,
      km: 7.9,
      isTransfer: true,
      transferLabel: "EDSA Busway & Megamall Concourse",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_shaw",
      name: "Shaw Boulevard",
      city: "Mandaluyong",
      lat: 14.5811,
      lon: 121.0536,
      km: 8.7,
      isTransfer: false,
      lineName: "MRT-3",
    },
    {
      id: "mrt3_boni",
      name: "Boni",
      city: "Mandaluyong",
      lat: 14.5739,
      lon: 121.0481,
      km: 9.7,
      isTransfer: false,
      lineName: "MRT-3",
    },
    {
      id: "mrt3_guadalupe",
      name: "Guadalupe",
      city: "Makati",
      lat: 14.5672,
      lon: 121.0456,
      km: 10.5,
      isTransfer: true,
      transferLabel: "Pasig Ferry & EDSA Busway",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_buendia",
      name: "Buendia",
      city: "Makati",
      lat: 14.5542,
      lon: 121.0347,
      km: 12.5,
      isTransfer: true,
      transferLabel: "EDSA Busway & BGC Bus Hub",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_ayala",
      name: "Ayala",
      city: "Makati",
      lat: 14.5492,
      lon: 121.0281,
      km: 13.4,
      isTransfer: true,
      transferLabel: "One Ayala Hub & EDSA Busway",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_magallanes",
      name: "Magallanes",
      city: "Makati",
      lat: 14.5422,
      lon: 121.0194,
      km: 14.6,
      isTransfer: true,
      transferLabel: "PNR EDSA Station Link",
      lineName: "MRT-3",
    },
    {
      id: "mrt3_taft",
      name: "Taft Avenue",
      city: "Pasay",
      lat: 14.5375,
      lon: 121.0006,
      km: 16.9,
      isTransfer: true,
      transferTo: "lrt1_edsa",
      transferLabel: "Walkway to LRT-1 EDSA & Busway",
      lineName: "MRT-3",
    },
  ],
  lrt2: [
    {
      id: "lrt2_recto",
      name: "Recto",
      city: "Manila",
      lat: 14.6036,
      lon: 120.9844,
      km: 0.0,
      isTransfer: true,
      transferTo: "lrt1_doroteo_jose",
      transferLabel: "Walkway to LRT-1 Doroteo Jose",
      lineName: "LRT-2",
    },
    {
      id: "lrt2_legarda",
      name: "Legarda",
      city: "Manila",
      lat: 14.5997,
      lon: 120.9925,
      km: 1.1,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_pureza",
      name: "Pureza",
      city: "Manila",
      lat: 14.6014,
      lon: 121.005,
      km: 2.5,
      isTransfer: true,
      transferLabel: "PUP Manila Ferry / Jeep Link",
      lineName: "LRT-2",
    },
    {
      id: "lrt2_v_mapa",
      name: "V. Mapa",
      city: "Manila",
      lat: 14.6042,
      lon: 121.0172,
      km: 3.8,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_j_ruiz",
      name: "J. Ruiz",
      city: "San Juan",
      lat: 14.6106,
      lon: 121.0261,
      km: 5.0,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_gilmore",
      name: "Gilmore",
      city: "Quezon City",
      lat: 14.6136,
      lon: 121.0342,
      km: 6.0,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_betty_go",
      name: "Betty Go-Belmonte",
      city: "Quezon City",
      lat: 14.6186,
      lon: 121.0428,
      km: 7.1,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_cubao",
      name: "Araneta Center-Cubao",
      city: "Quezon City",
      lat: 14.6225,
      lon: 121.0531,
      km: 8.3,
      isTransfer: true,
      transferTo: "mrt3_cubao",
      transferLabel: "Transfer to MRT-3 via Gateway/Farmers",
      lineName: "LRT-2",
    },
    {
      id: "lrt2_anonas",
      name: "Anonas",
      city: "Quezon City",
      lat: 14.6278,
      lon: 121.0647,
      km: 9.7,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_katipunan",
      name: "Katipunan",
      city: "Quezon City",
      lat: 14.6308,
      lon: 121.0728,
      km: 10.7,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_santolan",
      name: "Santolan",
      city: "Pasig",
      lat: 14.6222,
      lon: 121.0856,
      km: 12.7,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_marikina",
      name: "Marikina-Pasig",
      city: "Marikina",
      lat: 14.6208,
      lon: 121.1,
      km: 14.5,
      isTransfer: false,
      lineName: "LRT-2",
    },
    {
      id: "lrt2_antipolo",
      name: "Antipolo",
      city: "Antipolo, Rizal",
      lat: 14.6247,
      lon: 121.1214,
      km: 16.8,
      isTransfer: false,
      lineName: "LRT-2",
    },
  ],
};

export const LINE_COLORS: Record<LineKey, string> = {
  lrt1: "#00843D",
  mrt3: "#0055A5",
  lrt2: "#6F2C91",
};

export const ALL_STATIONS: StationItem[] = [];
(Object.keys(STATIONS_DATA) as LineKey[]).forEach((lineKey) => {
  STATIONS_DATA[lineKey].forEach((st, idx) => {
    ALL_STATIONS.push({
      ...st,
      lineKey,
      indexInLine: idx,
    });
  });
});

export const TRANSFER_HUBS = [
  {
    name: "EDSA - Taft Interchange",
    lines: ["LRT-1", "MRT-3", "EDSA Busway"],
    walkTime: "3-5 mins",
    walkDistance: "200 meters",
    description:
      "Connected via covered elevated pedestrian bridge between LRT-1 EDSA station and MRT-3 Taft Avenue mezzanine level.",
  },
  {
    name: "Doroteo Jose - Recto Walkway",
    lines: ["LRT-1", "LRT-2"],
    walkTime: "4-6 mins",
    walkDistance: "240 meters",
    description:
      "Direct elevated, weather-proof footbridge spanning Rizal Avenue and Recto Avenue connecting LRT-1 Doroteo Jose and LRT-2 Recto station concourse.",
  },
  {
    name: "Araneta Center-Cubao Hub",
    lines: ["MRT-3", "LRT-2"],
    walkTime: "5-7 mins",
    walkDistance: "350 meters",
    description:
      "Connected through Farmers Plaza and Gateway Mall indoor air-conditioned walkways between MRT-3 Cubao and LRT-2 Cubao station.",
  },
  {
    name: "North Avenue Grand Central Area",
    lines: ["MRT-3", "LRT-1 (Planned Unified)", "EDSA Busway"],
    walkTime: "3-6 mins",
    walkDistance: "250 meters",
    description:
      "North terminal hub connecting MRT-3 North Avenue concourse to TriNoma, SM North EDSA, and the EDSA Carousel Busway terminal.",
  },
];

// Official operating hours and dispatch cadence specs (Minutes since midnight Manila Time UTC+8)
export const SCHEDULE_SPECS: Record<LineKey, LineScheduleSpec> = {
  mrt3: {
    lineKey: "mrt3",
    totalKm: 16.9,
    minPerKm: 1.54,
    dwellMinPerStop: 0.5,
    gateOpenMin: 4 * 60 + 25,
    gateCutoffBeforeLastMin: 5,
    peakMorningStartMin: 6 * 60,
    peakMorningEndMin: 9 * 60,
    peakEveningStartMin: 17 * 60,
    peakEveningEndMin: 20 * 60,
    peakHeadwayMin: [3.5, 4.5],
    offPeakHeadwayMin: [5, 6],
    weekendHeadwayMin: [6, 8],
    lateNightHeadwayMin: [7, 10],
    forward: {
      label: "Southbound (to Taft Ave)",
      shortDir: "Southbound",
      originTerminal: "North Avenue",
      destinationTerminal: "Taft Avenue",
      weekdayFirstMin: 4 * 60 + 36,
      weekdayLastMin: 22 * 60 + 30,
      weekendFirstMin: 4 * 60 + 38,
      weekendLastMin: 21 * 60 + 30,
    },
    reverse: {
      label: "Northbound (to North Ave)",
      shortDir: "Northbound",
      originTerminal: "Taft Avenue",
      destinationTerminal: "North Avenue",
      weekdayFirstMin: 5 * 60 + 18,
      weekdayLastMin: 23 * 60 + 9,
      weekendFirstMin: 5 * 60 + 18,
      weekendLastMin: 22 * 60 + 9,
    },
    scheduleNote:
      "Reflects the extended DOTr MRT-3 weekday schedule (effective March 24, 2025: 10:30 PM North Ave / 11:09 PM Taft last trips). Weekends/Holidays maintain 9:30 PM / 10:09 PM terminal dispatches.",
  },
  lrt1: {
    lineKey: "lrt1",
    totalKm: 24.5,
    minPerKm: 1.85,
    dwellMinPerStop: 0.6,
    gateOpenMin: 4 * 60 + 20,
    gateCutoffBeforeLastMin: 5,
    peakMorningStartMin: 6 * 60,
    peakMorningEndMin: 9 * 60,
    peakEveningStartMin: 17 * 60,
    peakEveningEndMin: 20 * 60,
    peakHeadwayMin: [3.5, 4.5],
    offPeakHeadwayMin: [5, 6.5],
    weekendHeadwayMin: [6, 8],
    lateNightHeadwayMin: [7, 10],
    forward: {
      label: "Southbound (to Dr. Santos / Baclaran)",
      shortDir: "Southbound",
      originTerminal: "Fernando Poe Jr.",
      destinationTerminal: "Dr. Santos (Sucat)",
      weekdayFirstMin: 4 * 60 + 30,
      weekdayLastMin: 22 * 60 + 45,
      weekendFirstMin: 5 * 60,
      weekendLastMin: 21 * 60 + 45,
    },
    reverse: {
      label: "Northbound (to FPJ / Monumento)",
      shortDir: "Northbound",
      originTerminal: "Dr. Santos (Sucat)",
      destinationTerminal: "Fernando Poe Jr.",
      weekdayFirstMin: 4 * 60 + 30,
      weekdayLastMin: 22 * 60 + 30,
      weekendFirstMin: 5 * 60,
      weekendLastMin: 21 * 60 + 30,
    },
    scheduleNote:
      "Covers the 25-station Cavite Extension Phase 1 alignment. Full end-to-end trip between FPJ and Dr. Santos takes approximately 60 minutes.",
  },
  lrt2: {
    lineKey: "lrt2",
    totalKm: 16.8,
    minPerKm: 1.65,
    dwellMinPerStop: 0.6,
    gateOpenMin: 4 * 60 + 50,
    gateCutoffBeforeLastMin: 5,
    peakMorningStartMin: 6 * 60,
    peakMorningEndMin: 9 * 60,
    peakEveningStartMin: 17 * 60,
    peakEveningEndMin: 20 * 60,
    peakHeadwayMin: [4, 5],
    offPeakHeadwayMin: [6, 7.5],
    weekendHeadwayMin: [6, 9],
    lateNightHeadwayMin: [8, 10],
    forward: {
      label: "Eastbound (to Antipolo)",
      shortDir: "Eastbound",
      originTerminal: "Recto",
      destinationTerminal: "Antipolo",
      weekdayFirstMin: 5 * 60,
      weekdayLastMin: 21 * 60 + 30,
      weekendFirstMin: 5 * 60,
      weekendLastMin: 21 * 60,
    },
    reverse: {
      label: "Westbound (to Recto)",
      shortDir: "Westbound",
      originTerminal: "Antipolo",
      destinationTerminal: "Recto",
      weekdayFirstMin: 5 * 60,
      weekdayLastMin: 21 * 60,
      weekendFirstMin: 5 * 60,
      weekendLastMin: 21 * 60,
    },
    scheduleNote:
      "LRT-2 closes earlier than MRT-3 and LRT-1 (last trip from Antipolo at 9:00 PM; Recto at 9:30 PM on weekdays, 9:00 PM on weekends).",
  },
};

export function formatMinutesTo12H(totalMinutes: number): string {
  const wrapped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

export interface ComputedStationSchedule {
  station: RawStation;
  index: number;
  offsetForwardMin: number;
  offsetReverseMin: number;
  weekdayFirstFwd: number;
  weekdayLastFwd: number;
  weekdayFirstRev: number;
  weekdayLastRev: number;
  weekendFirstFwd: number;
  weekendLastFwd: number;
  weekendFirstRev: number;
  weekendLastRev: number;
}

/**
 * Computes estimated first and last train passing times for every station on a line
 * based on terminal dispatch schedules, station distance (km), and dwell offsets.
 */
export function buildLineTimetable(
  lineKey: LineKey,
): ComputedStationSchedule[] {
  const stations = STATIONS_DATA[lineKey];
  const spec = SCHEDULE_SPECS[lineKey];
  const maxIdx = stations.length - 1;

  return stations.map((st, idx) => {
    const offsetFwd = Math.round(
      st.km * spec.minPerKm + idx * spec.dwellMinPerStop,
    );
    const distRev = Math.max(0, spec.totalKm - st.km);
    const hopsRev = maxIdx - idx;
    const offsetRev = Math.round(
      distRev * spec.minPerKm + hopsRev * spec.dwellMinPerStop,
    );

    return {
      station: st,
      index: idx,
      offsetForwardMin: offsetFwd,
      offsetReverseMin: offsetRev,
      weekdayFirstFwd: spec.forward.weekdayFirstMin + offsetFwd,
      weekdayLastFwd: spec.forward.weekdayLastMin + offsetFwd,
      weekdayFirstRev: spec.reverse.weekdayFirstMin + offsetRev,
      weekdayLastRev: spec.reverse.weekdayLastMin + offsetRev,
      weekendFirstFwd: spec.forward.weekendFirstMin + offsetFwd,
      weekendLastFwd: spec.forward.weekendLastMin + offsetFwd,
      weekendFirstRev: spec.reverse.weekendFirstMin + offsetRev,
      weekendLastRev: spec.reverse.weekendLastMin + offsetRev,
    };
  });
}
