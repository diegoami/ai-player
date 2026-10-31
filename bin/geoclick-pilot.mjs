#!/usr/bin/env node
// A prepared teaching lesson, operated through GeoClick's visible Known UI.
// Unlike play.mjs this is an authored lesson, not a scored model-driven quiz.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { readConfig } from '../src/core/config.mjs';
import { speak, probeDuration } from '../src/core/narrator.mjs';
import { assemble } from '../src/core/assemble.mjs';
import { costs } from '../src/core/cost.mjs';

const cfg = readConfig();
const lesson = JSON.parse(readFileSync(resolve('src/lessons/usa-states-pilot.json'), 'utf8'));
const base = cfg.base || new URL(lesson.url).origin;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const segments = [
  ...lesson.intro.map(text => ({ kind: 'intro', text })),
  ...lesson.states.flatMap(state => state.lines.map((text, i) => ({ kind: 'state', state: state.name, first: i === 0, text }))),
  ...lesson.recap.map(text => ({ kind: 'recap', text }))
];

// Synthesize before recording so network delays don't become empty footage.
for (let i = 0; i < segments.length; i++) {
  const segment = segments[i];
  segment.file = `lesson-${String(i).padStart(2, '0')}.mp3`;
  const path = join(cfg.dir, 'clips', segment.file);
  segment.duration = existsSync(path) ? probeDuration(path) : await speak(cfg, segment.text, segment.file);
  console.log(`Prepared ${i + 1}/${segments.length}: ${segment.state ?? segment.kind}`);
}
writeFileSync(join(cfg.dir, 'lesson.json'), JSON.stringify(lesson, null, 2));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: lesson.viewport, deviceScaleFactor: 2,
  recordVideo: { dir: join(cfg.dir, 'video'), size: lesson.viewport }
});
const t0 = Date.now();
const page = await context.newPage();
const at = () => (Date.now() - t0) / 1000;
const trace = { game: 'geoclick', mode: 'Known', lesson: lesson.title, manualUrl: `${base}/manual`, lines: [], turns: [] };
let trimStart;
try {
  await page.goto(`${base}/manual`);
  await page.locator('article h1').waitFor();
  const manual = await page.locator('article').innerText();
  if (!manual.includes('Tap a place to put its name on the map')) throw Error('Manual did not load as expected');
  writeFileSync(join(cfg.dir, 'manual.txt'), manual);
  await page.goto(`${base}/map/usa-states`);
  await page.locator('.maplibregl-canvas').waitFor();
  await page.getByTestId('known-empty').waitFor();
  await sleep(6000);
  trimStart = at();
  for (const segment of segments) {
    if (segment.first) {
      const state = lesson.states.find(s => s.name === segment.state);
      await page.mouse.move(...state.point, { steps: 16 });
      await sleep(350);
      await page.mouse.click(...state.point);
      const card = page.getByTestId('fact-card');
      await card.waitFor();
      const actual = await card.locator('.fact-name').innerText();
      if (actual !== state.name) throw Error(`Expected ${state.name}, got ${actual}; viewport or map fit changed`);
      await page.mouse.move(1160, 580, { steps: 10 });
      await sleep(650);
      const facts = await card.innerText();
      trace.turns.push({ state: actual, start: at(), facts, sources: state.sources });
      await page.screenshot({ path: join(cfg.dir, `${state.name.replaceAll(' ', '-')}.png`), scale: 'css' });
      console.log(`Revealed ${actual}: ${facts.replaceAll('\n', ' ')}`);
    }
    if (segment.kind === 'recap' && trace.lines.at(-1)?.kind !== 'recap') {
      await page.getByTestId('fact-card').getByRole('button', { name: 'Close', exact: true }).click();
      await sleep(400);
    }
    const start = at();
    trace.lines.push({ ...segment, start, end: start + segment.duration });
    writeFileSync(join(cfg.dir, 'progress.json'), JSON.stringify(trace, null, 2));
    console.log(`[${segment.kind}] ${segment.text}`);
    await sleep(segment.duration * 1000 + 650);
  }
  const names = await page.locator('.retention-asked').count();
  // Some names are curved SVG text, others use straight popup labels.
  if (trace.turns.length !== 8) throw Error(`Only visited ${trace.turns.length} states`);
  trace.result = { statesVisited: trace.turns.length, chosenNameElements: names, completedPilot: true, quizPlayed: false };
  await page.screenshot({ path: join(cfg.dir, 'recap.png'), scale: 'css' });
  await context.storageState({ path: join(cfg.dir, 'browser-state.json') });
  await sleep(1200);
} finally {
  const video = page.video();
  await context.close();
  trace.video = await video.path();
  await browser.close();
  trace.trimStart = trimStart;
  trace.costs = costs;
  writeFileSync(join(cfg.dir, 'trace.json'), JSON.stringify(trace, null, 2));
}
if (!trace.result?.completedPilot) throw Error('Pilot did not complete');
// Upper captions leave the bottom fact card unobstructed.
// libass force_style uses legacy SSA alignment 6 for top-centre.
const result = assemble({ ...cfg, trimStart, trimEnd: trace.lines.at(-1).end + 2, subtitleAlignment: 6, subtitleMarginV: 31 }, trace);
console.log(`Pilot complete: ${result.out} (${result.videoLength.toFixed(1)}s)`);
