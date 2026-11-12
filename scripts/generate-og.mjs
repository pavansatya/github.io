/**
 * Renders public/og.png (social card) and public/apple-touch-icon.png
 * from inline SVG using sharp, which Astro already depends on.
 *
 * Run: node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const W = 1200;
const H = 630;

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "Menlo, 'DejaVu Sans Mono', monospace";

const gridLines = () => {
  let out = '';
  for (let x = 64; x < W; x += 64) {
    out += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>`;
  }
  for (let y = 64; y < H; y += 64) {
    out += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>`;
  }
  return out;
};

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#07090d"/>
  ${gridLines()}
  <rect x="0" y="0" width="${W}" height="4" fill="#2de2c5"/>

  <!-- medallion marks -->
  <rect x="80" y="104" width="150" height="10" rx="5" fill="#d98e4a"/>
  <rect x="80" y="124" width="110" height="10" rx="5" fill="#bcc5d2"/>
  <rect x="80" y="144" width="70"  height="10" rx="5" fill="#f2c14e"/>

  <text x="80" y="236" font-family="${MONO}" font-size="23" letter-spacing="5" fill="#2de2c5">
    DATA ANALYTICS ENGINEER
  </text>

  <text x="80" y="330" font-family="${SANS}" font-size="78" font-weight="700" fill="#e9edf3" letter-spacing="-2">
    Pavan Venigalla
  </text>

  <text x="80" y="404" font-family="${SANS}" font-size="35" fill="#9aa5b5">
    I build the data platforms health systems run on.
  </text>

  <line x1="80" y1="474" x2="${W - 80}" y2="474" stroke="#1f2733" stroke-width="2"/>

  <text x="80" y="528" font-family="${MONO}" font-size="24" fill="#7b8694">
    Azure Synapse · Databricks · Delta Lake
  </text>
  <text x="${W - 80}" y="528" text-anchor="end" font-family="${MONO}" font-size="24" fill="#7b8694">
    pavanvenigalla.vercel.app
  </text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile('public/og.png');
console.log('wrote public/og.png');

const favicon = await readFile('public/favicon.svg');
await sharp(favicon).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('wrote public/apple-touch-icon.png');
