// Compile the app's real globals.css into a static stylesheet for the
// design-sync bundle. The cadam-web repo is a Next.js app (no dist), so the
// converter has no compiled CSS to scrape — this regenerates it from source.
//
// Why from globals.css and not a hand-authored token file: globals.css holds
// the :root var chain that @theme inline references, all @keyframes, and the
// custom utility classes (.cta-gold, .text-gold-gradient, .glass, …). A
// utilities-only rebuild would silently drop those.
//
// Scope: only the synced component dirs are scanned (@source), so the output
// carries just the utilities those components use plus the always-emitted
// theme/keyframes/custom CSS. Re-run this before package-build.mjs.
//
// Usage: node .design-sync/build-css.mjs
//   out → .ds-sync/compiled.css  (cfg.cssEntry points here; gitignored scratch)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import postcss from '../node_modules/postcss/lib/postcss.js';
import tailwind from '../node_modules/@tailwindcss/postcss/dist/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const globalsPath = join(repo, 'src/app/globals.css');

// Scan the WHOLE app src/ (relative to src/app), not just the synced components.
// Rendered designs on claude.ai/design get only this static stylesheet — there is
// no Tailwind compiler at design time — so the agent can only use utilities that
// already exist here. Scanning the whole app yields Rentailor's real, full utility
// vocabulary (brand tokens, custom effect classes, spacing/layout) so the agent's
// own layout glue stays on-brand. This is the app's actual compiled CSS.
const SCOPED = ['..']; // src/

let css = readFileSync(globalsPath, 'utf8');
// Replace auto content-detection with explicit, scoped @source globs so the
// output only carries utilities for the synced components.
const sources = SCOPED.map((d) => `@source "${d}";`).join('\n');
css = css.replace(
  /@import\s+["']tailwindcss["'];/,
  `@import "tailwindcss" source(none);\n${sources}`,
);

const result = await postcss([tailwind()]).process(css, {
  from: globalsPath, // anchors @source resolution to src/app/
  to: undefined,
});

const outDir = join(repo, '.ds-sync');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'compiled.css');
writeFileSync(outPath, result.css);
console.error(`[build-css] wrote ${outPath} (${(result.css.length / 1024).toFixed(1)} KB)`);
