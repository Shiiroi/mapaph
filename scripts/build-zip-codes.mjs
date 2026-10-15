/**
 * @file build-zip-codes.mjs
 * @description Ingests, normalizes, and builds the Philippine ZIP / Postal Code dataset.
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(
  __dirname,
  "../src/data/philippine-zip-codes.json",
);

const REGION_NAMES = {
  NCR: "National Capital Region (NCR)",
  CAR: "Cordillera Administrative Region (CAR)",
  I: "Region I (Ilocos Region)",
  II: "Region II (Cagayan Valley)",
  III: "Region III (Central Luzon)",
  "IV-A": "Region IV-A (CALABARZON)",
  MIMAROPA: "MIMAROPA Region",
  V: "Region V (Bicol Region)",
  VI: "Region VI (Western Visayas)",
  NIR: "Negros Island Region (NIR)",
  VII: "Region VII (Central Visayas)",
  VIII: "Region VIII (Eastern Visayas)",
  IX: "Region IX (Zamboanga Peninsula)",
  X: "Region X (Northern Mindanao)",
  XI: "Region XI (Davao Region)",
  XII: "Region XII (SOCCSKSARGEN)",
  XIII: "Region XIII (Caraga)",
  BARMM: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
};

const SOURCE_URL =
  "https://raw.githubusercontent.com/blckclov3r/use-postal-ph/main/src/logic/placeDataArray.ts";

https
  .get(SOURCE_URL, (res) => {
    let text = "";
    res.on("data", (chunk) => (text += chunk));
    res.on("end", () => {
      const startIdx = text.indexOf("const data: PlaceProps[] = [");
      const endIdx = text.lastIndexOf("];");
      if (startIdx === -1 || endIdx === -1) {
        console.error("Failed to locate data array in source.");
        process.exit(1);
      }

      const arrayText = text.substring(
        startIdx + "const data: PlaceProps[] = ".length,
        endIdx + 1,
      );
      const rawItems = new Function("return " + arrayText)();

      const cleaned = rawItems.map((item, idx) => {
        const codeStr = String(item.post_code).padStart(4, "0");
        const regKey = item.region.trim();
        const regionFull = REGION_NAMES[regKey] || regKey;

        return {
          id: idx + 1,
          zip: codeStr,
          name: item.municipality.trim(),
          location: item.location.trim(),
          region: regKey,
          regionFull,
        };
      });

      // Sort by ZIP code ascending, then name
      cleaned.sort(
        (a, b) => a.zip.localeCompare(b.zip) || a.name.localeCompare(b.name),
      );

      const payload = {
        meta: {
          total: cleaned.length,
          generatedAt: new Date().toISOString(),
          authority: "Philippine Postal Corporation (PHLPost)",
          source: "Official PHLPost 4-Digit Postal Directory",
        },
        entries: cleaned,
      };

      fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");
      console.log(
        `Successfully compiled ${cleaned.length} postal codes to ${outputPath}`,
      );
    });
  })
  .on("error", (err) => {
    console.error("Network error fetching postal codes:", err);
    process.exit(1);
  });
