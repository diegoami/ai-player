#!/usr/bin/env node
// Find a reliable click point for every target of a native GeoClick map.
// The map is opened in a real browser and candidate points are projected
// through MapLibre and clicked, so a point is only accepted when the app
// actually selects that country. Nothing is recorded and no quiz is played.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
if (!args.map) throw Error('Use --map=<mapId> [--base=<url>] [--out=<file>]');
const base = args.base ?? 'http://localhost:5187';
const out = args.out ?? resolve(`rendered/map-points/${args.map}.json`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(`${base}/map/${args.map}`);
await page.locator('.maplibregl-canvas').waitFor();
await sleep(4000);
// The running app serves its own map catalogue; nothing outside this
// repository is read or executed.
const catalog = await page.evaluate(async mapId => (await (await fetch(`/maps/${mapId}/map.json`)).json()), args.map);
await page.evaluate(async () => {
  const url = performance.getEntriesByType('resource').map(e => e.name).find(n => /maplibre-gl\.mjs\?/.test(n));
  const mod = await import(url);
  const MapClass = mod.Map ?? mod.default?.Map;
  window.__lessonOriginalFire = MapClass.prototype.fire;
  MapClass.prototype.fire = function (...a) { if (this.getCanvas) window.__lessonMap = this; return window.__lessonOriginalFire.apply(this, a); };
});
await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
await sleep(800);

const project = (lon, lat) => page.evaluate(([lon, lat]) => {
  const map = window.__lessonMap;
  const p = map.project([lon, lat]);
  const r = map.getCanvas().getBoundingClientRect();
  return [p.x + r.left, p.y + r.top];
}, [lon, lat]);

const fit = bounds => page.evaluate(b => window.__lessonMap.fitBounds(b, { padding: 40, duration: 0 }), bounds);
const cardName = async () => {
  const card = page.getByTestId('fact-card');
  if (!await card.count()) return null;
  return (await card.locator('.fact-name').innerText()).trim();
};

const found = {};
for (const target of catalog.targets) {
  const [w, s, e, n] = target.bbox;
  const candidates = [];
  const [cx, cy] = target.centroid;
  candidates.push([cx, cy]);
  // A capital map holds points, not areas: its bbox has no size to fit, so the
  // camera frames the marker itself and nearby offsets are tried instead.
  const isPoint = e - w < 0.001 && n - s < 0.001;
  if (isPoint) {
    for (const d of [0.05, 0.1, 0.2, 0.3, 0.45]) {
      candidates.push([cx - d, cy], [cx + d, cy], [cx, cy - d], [cx, cy + d], [cx - d, cy - d], [cx + d, cy + d]);
    }
  } else {
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      for (let j = 1; j <= steps; j++) {
        candidates.push([w + ((e - w) * i) / (steps + 1), s + ((n - s) * j) / (steps + 1)]);
      }
    }
  }
  await fit(isPoint ? [[cx - 0.9, cy - 0.9], [cx + 0.9, cy + 0.9]] : [[w, s], [e, n]]);
  await sleep(700);
  // The card shows the English display name where the map carries one, so a
  // target is accepted under either form and the name seen is recorded.
  const accepted = [target.name, target.names?.en].filter(Boolean);
  let hit = null, seen = null;
  for (const [lon, lat] of candidates) {
    const [x, y] = await project(lon, lat);
    const box = await page.locator('.maplibregl-canvas').boundingBox();
    if (!box || x < box.x + 4 || x > box.x + box.width - 4 || y < box.y + 4 || y > box.y + box.height - 4) continue;
    await page.mouse.click(x, y);
    await sleep(220);
    const name = await cardName();
    if (accepted.includes(name)) { hit = [Number(lon.toFixed(4)), Number(lat.toFixed(4))]; seen = name; break; }
  }
  found[target.name] = hit ? {point: hit, cardName: seen} : null;
  console.log(`${target.name}: ${hit ? `${JSON.stringify(hit)} card="${seen}"` : 'NOT FOUND'}`);
}
await browser.close();
mkdirSync(resolve('rendered/map-points'), { recursive: true });
writeFileSync(out, JSON.stringify({ map: args.map, points: found }, null, 2) + '\n');
console.log(out);
