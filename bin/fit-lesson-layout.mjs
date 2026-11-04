// The layout fitting pass, run before every recording. It opens the lesson's
// map in a real browser, applies each candidate layout, fits the lesson's own
// opening view, and measures how much of the map box the land actually fills
// in each. The winner is written into the lesson as its `layout` field, so the
// recording uses it deterministically; the report keeps the numbers and the
// screenshots for review.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { lessonLayout, attachCamera, LAYOUT_BOXES } from '../src/core/geoclick-lesson-ui.mjs';

const lessonPath = process.argv.find(a => a.startsWith('--lesson='))?.slice(9);
if (!lessonPath) throw Error('Use --lesson=<file> [--base=<url>]');
const base = process.argv.find(a => a.startsWith('--base='))?.slice(7) ?? 'http://localhost:5187';
const lesson = JSON.parse(readFileSync(resolve(lessonPath), 'utf8'));
const candidates = Object.keys(LAYOUT_BOXES);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: lesson.viewport ?? { width: 1600, height: 900 } });
const page = await context.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(`${base}/map/${lesson.mapId}`);
await page.locator('.maplibregl-canvas').waitFor();
await page.getByTestId('known-empty').waitFor();
await page.getByTestId('known-empty').getByRole('button', { name: 'Close this notice' }).click();
await sleep(6000);
await attachCamera(page, lesson.mapId);

const outDir = resolve('rendered/layout-fit', lessonPath.replaceAll('/', '_').replace(/\.json$/, ''));
mkdirSync(outDir, { recursive: true });

const scores = [];
for (const candidate of candidates) {
  await lessonLayout(page, lesson.title, lesson.area ?? '', candidate);
  await page.evaluate(bounds => window.__lessonMap.fitBounds(bounds, { padding: 55, duration: 0 }), lesson.initialBounds);
  await sleep(2600);
  const shot = join(outDir, `${candidate}.png`);
  await page.screenshot({ path: shot, scale: 'css' });
  scores.push({ layout: candidate, screenshot: shot });
  // Drop the injected nodes so the next candidate starts clean.
  await page.evaluate(() => { document.getElementById('lesson-heading')?.remove(); document.getElementById('lesson-status')?.remove(); });
}
await browser.close();

// Score the screenshots: land share of the map box, using the same water and
// background classifiers as the frame evaluation. Both candidates carry the
// same UI chrome, so the comparison is between the box shapes.
const rowsPath = join(outDir, 'scores.json');
writeFileSync(rowsPath, JSON.stringify(scores), 'utf8');
const script = join(outDir, 'score.py');
writeFileSync(script, `
import json, sys
from PIL import Image
results = {}
for row in json.load(open(sys.argv[1], encoding='utf-8')):
    image = Image.open(row['screenshot']).convert('RGB')
    box = (12, 12, 1172, 888) if row['layout'] == 'tall' else (12, 250, 1172, 888)
    region = image.crop(box)
    pixels = list(region.getdata())
    def ocean(p): r, g, b = p; return b > r + 12 and b > 130
    def beige(p): r, g, b = p; return abs(r-243) < 12 and abs(g-239) < 12 and abs(b-229) < 12
    land = sum(1 for p in pixels if not ocean(p) and not beige(p))
    results[row['layout']] = round(land / len(pixels), 4)
print(json.dumps(results))
`, { encoding: 'utf-8' });
const results = JSON.parse(execFileSync('python', [script, rowsPath], { encoding: 'utf8' }).trim());
for (const row of scores) row.landShare = results[row.layout];
const winner = scores.reduce((a, b) => (b.landShare > a.landShare ? b : a));

lesson.layout = winner.layout;
writeFileSync(resolve(lessonPath), JSON.stringify(lesson, null, 2) + '\n');
writeFileSync(join(outDir, 'fit-report.json'), JSON.stringify({
  lesson: lessonPath, scores, winner: winner.layout, decided_at: new Date().toISOString()
}, null, 2) + '\n');
console.log(scores.map(s => `${s.layout}: land ${Math.round(s.landShare * 100)}%`).join(' | '));
console.log(`winner: ${winner.layout} -> ${lessonPath}`);
