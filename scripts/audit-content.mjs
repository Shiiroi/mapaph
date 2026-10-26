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

// Only pages meant to stand on their own content are held to the threshold.
const AUDITED = /^(tools|docs)\/[^/]+\/index\.html$/;

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
  const words = visibleProse(await readFile(file, "utf8"))
    .split(" ")
    .filter((w) => /[A-Za-z]{2,}/.test(w)).length;
  rows.push({ rel, words, audited: AUDITED.test(rel) });
}

rows.sort((a, b) => a.words - b.words);
const failing = rows.filter((r) => r.audited && r.words < MIN_WORDS);

console.log(
  `\nVisible prose per page (threshold ${MIN_WORDS} words for tools/docs):\n`,
);
for (const r of rows) {
  const flag = r.audited ? (r.words < MIN_WORDS ? "THIN" : "ok  ") : "    ";
  console.log(`${flag}  ${String(r.words).padStart(5)}  ${r.rel}`);
}

if (failing.length) {
  console.error(
    `\n${failing.length} page(s) below ${MIN_WORDS} words of readable prose.`,
  );
  process.exit(1);
}
console.log("\nAll audited pages meet the content-depth threshold.");
