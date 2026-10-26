/**
 * @file audit-content.mjs
 * @description Post-build content-depth audit. Counts the prose a reader actually sees on each
 * built page (inside <main>, excluding scripts, styles, nav, footer, form controls and dropdown
 * options) and fails when a tool or docs page falls below MIN_WORDS.
 *
 * Why: AdSense rejected the site for "low value content". Interactive widgets carry almost no
 * readable text, so a page can look substantial while giving reviewers very little to read.
 * This check stops a thin page from shipping unnoticed.
 *
 * Usage: pnpm build && node scripts/audit-content.mjs [--min=800]
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const minArg = process.argv.find((a) => a.startsWith("--min="));
const MIN_WORDS = minArg ? Number(minArg.split("=")[1]) : 800;
const SUPPORT_MIN_WORDS = 600;

// Hold all tools/docs (including directory hubs), home, about, and privacy to MIN_WORDS,
// and support/legal pages (terms, contact) to SUPPORT_MIN_WORDS.
const PRIMARY_AUDITED =
  /^(index\.html|(tools|docs)(\/[^/]+)?\/index\.html|(about|privacy)\/index\.html)$/;
const SUPPORT_AUDITED = /^(terms|contact)\/index\.html$/;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

function visibleProse(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  return main
    .replace(
      /<(script|style|noscript|svg|select|nav|footer|button|template)[\s\S]*?<\/\1>/gi,
      " ",
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const rows = [];
for await (const file of walk(DIST)) {
  const rel = relative(DIST, file);
  const rawHtml = await readFile(file, "utf8");
  const prose = visibleProse(rawHtml);
  const words = prose.split(" ").filter((w) => /[A-Za-z]{2,}/.test(w)).length;
  const emdashes = (prose.match(/—/g) || []).length;
  const threshold = PRIMARY_AUDITED.test(rel)
    ? MIN_WORDS
    : SUPPORT_AUDITED.test(rel)
      ? SUPPORT_MIN_WORDS
      : 0;
  rows.push({
    rel,
    words,
    emdashes,
    audited: threshold > 0,
    threshold,
  });
}

rows.sort((a, b) => a.words - b.words);
const failing = rows.filter((r) => r.audited && r.words < r.threshold);
const emdashFailing = rows.filter((r) => r.emdashes > 0);

console.log(
  `\nVisible prose per page (threshold ${MIN_WORDS} words primary, ${SUPPORT_MIN_WORDS} words support):\n`,
);
for (const r of rows) {
  const flag = r.audited
    ? r.words < r.threshold
      ? "THIN"
      : "ok  "
    : "    ";
  console.log(
    `${flag}  ${String(r.words).padStart(5)}  ${r.rel}${r.emdashes ? ` (${r.emdashes} emdash)` : ""}`,
  );
}

if (failing.length || emdashFailing.length) {
  if (failing.length) {
    console.error(
      `\n${failing.length} page(s) below their required readable prose threshold.`,
    );
  }
  if (emdashFailing.length) {
    console.error(
      `\n${emdashFailing.length} page(s) contain prohibited emdash characters (—).`,
    );
  }
  process.exit(1);
}
console.log("\nAll 22 audited pages meet content-depth and anti-slop thresholds.");
