#!/usr/bin/env node
// A prepared teaching lesson, operated through GeoClick's visible Known UI.
// Unlike play.mjs this is an authored lesson, not a scored model-driven quiz.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { readConfig } from '../src/core/config.mjs';
import { speak, probeDuration } from '../src/core/narrator.mjs';
import { canReuseSpeech, narrationSettings, speechCacheKey } from '../src/core/narration.mjs';
import { assemble } from '../src/core/assemble.mjs';
import { costs } from '../src/core/cost.mjs';
import { lessonLayout, gesture, status, verifyUncovered, attachCamera, statePoint } from '../src/core/geoclick-lesson-ui.mjs';
import {installSupplement} from '../src/core/geoclick-supplement.mjs';

const cfg = readConfig();
const lessonPath = process.argv.find(a=>a.startsWith('--lesson='))?.slice(9) ?? 'src/lessons/usa-episode-01-northeast.json';
const lesson = JSON.parse(readFileSync(resolve(lessonPath), 'utf8'));
const mapId=lesson.mapId??'usa-states';
const unit=lesson.unit??'states';
const coverage=JSON.parse(readFileSync(resolve('src/lessons/usa-coverage.json'),'utf8'));
const previousStates=new Set(mapId==='usa-states'?coverage.episodes.filter(e=>e.status==='complete'&&e.lesson!==lessonPath).flatMap(e=>e.covered??[]):[]);
const repeated=lesson.states.filter(s=>previousStates.has(s.name));
if(repeated.length && !process.argv.includes('--review'))throw Error(`States already covered: ${repeated.map(s=>s.name).join(', ')}; use --review for an explicitly requested new edition or pilot`);
if(new Set(lesson.states.map(s=>s.name)).size!==lesson.states.length)throw Error('Duplicate state within lesson');
const inspect = process.argv.includes('--inspect');
const audioCacheDir=process.argv.find(a=>a.startsWith('--audio-cache='))?.slice(14);
const cachedTrace=audioCacheDir?JSON.parse(readFileSync(join(audioCacheDir,'trace.json'),'utf8')):null;
const cachedLines=canReuseSpeech(cachedTrace,cfg)?cachedTrace.lines:[];
const base = cfg.base || new URL(lesson.url).origin;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const segments = [
  ...lesson.intro.map(text => ({ kind: 'intro', text })),
  ...lesson.states.flatMap(state => [
    ...(state.transition ? [{kind:'transition',text:state.transition,gestures:state.gestures,view:state.view}] : []),
    ...state.lines.map((text, i) => ({ kind: 'state', state: state.name, first: i === 0, lineIndex:i, text }))
  ]),
  ...lesson.recap.map((text,i) => ({ kind: 'recap', firstRecap:i===0, text,gestures:lesson.recapMoves?.[i]??[] }))
];

// Synthesize before recording so network delays don't become empty footage.
for (let i = 0; i < segments.length; i++) {
  const segment = segments[i];
  const textHash=speechCacheKey(cfg,segment.text);
  segment.file = `lesson-${String(i).padStart(2, '0')}-${textHash}.mp3`;
  const path = join(cfg.dir, 'clips', segment.file);
  const cached=cachedLines.find(line=>line.text===segment.text);
  if(!inspect && !existsSync(path) && cached && existsSync(join(audioCacheDir,'clips',cached.file)))copyFileSync(join(audioCacheDir,'clips',cached.file),path);
  segment.duration = inspect ? 0 : existsSync(path) ? probeDuration(path) : await speak(cfg, segment.text, segment.file);
  console.log(`Prepared ${i + 1}/${segments.length}: ${segment.state ?? segment.kind}`);
}
writeFileSync(join(cfg.dir, 'lesson.json'), JSON.stringify(lesson, null, 2));
writeFileSync(join(cfg.dir, 'lesson.md'), `# ${lesson.title}\n\n${lesson.intro.join('\n\n')}\n\n` +
  lesson.states.map(s=>`## ${s.name}\n\n${s.lines.join('\n\n')}\n\n${s.sources.map(url=>`[Reference](${url})`).join(', ')}\n`).join('\n') + `\n## Recap\n\n${lesson.recap.join('\n\n')}\n`);
if(process.argv.includes('--prepare-only')){console.log('Narration prepared; no browser recording started');process.exit(0);}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: lesson.viewport, deviceScaleFactor: 2,
  ...(!inspect?{recordVideo: { dir: join(cfg.dir, 'video'), size: lesson.viewport }}:{})
});
const t0 = Date.now();
const page = await context.newPage();
const at = () => (Date.now() - t0) / 1000;
const trace = { game: 'geoclick', mode: 'Known', mapId, unit, lesson: lesson.title, narration: narrationSettings(cfg), manualUrl: `${base}/manual`, lines: [], turns: [] };
let trimStart;
try {
  await page.goto(base);
  await page.getByRole('link', {name:'About',exact:true}).click();
  await page.waitForURL('**/about');
  await page.waitForTimeout(2000);
  await page.getByRole('link', {name:'User manual',exact:true}).click();
  await page.locator('article h1').waitFor();
  const manual = await page.locator('article').innerText();
  if (!manual.includes('Tap a place to put its name on the map')) throw Error('Manual did not load as expected');
  writeFileSync(join(cfg.dir, 'manual.txt'), manual);
  await page.goto(`${base}/map/${mapId}`);
  await page.locator('.maplibregl-canvas').waitFor();
  await page.getByTestId('known-empty').waitFor();
  await page.getByTestId('known-empty').getByRole('button', {name:'Close this notice'}).click();
  trace.knownNoticeClosed = true;
  await sleep(6000);
  await lessonLayout(page, lesson.title, lesson.area??'United States');
  await attachCamera(page,mapId);
  await gesture(page,{bounds:lesson.initialBounds??[[-125,24],[-66,50]]});
  if(lesson.supplement)await installSupplement(page,lesson);
  // Prepare chosen names through public clicks so Clear is a visible real
  // action. This changes no earned quiz progress and implies no earlier episode.
  for (const previous of lesson.restore ?? []) {
    console.log(`Preparing Clear: ${previous.name}`);
    if(previous.bounds)await gesture(page,{bounds:previous.bounds});
    const point=await statePoint(page,previous.name,previous.location);
    await page.mouse.click(...point);
    const actual=await page.getByTestId('fact-card').locator('.fact-name').innerText();
    if(actual!==previous.name)throw Error(`Restore expected ${previous.name}, found ${actual}`);
    // Two fact visits complete this map's two-extra rotation, leaving its
    // first authored fact ready for the actual lesson after Clear.
    await page.mouse.click(...point);
    await page.mouse.click(...point);
  }
  if(lesson.initialBounds)await gesture(page,{bounds:lesson.initialBounds});
  trimStart = at();
  await sleep(inspect ? 50 : 700);
  await page.getByTestId('clear-names').click();
  if(await page.getByTestId('fact-card').count())throw Error('Clear did not dismiss the old fact card');
  await page.getByRole('button', {name:'Hide the buttons',exact:true}).click();
  await page.getByRole('button', {name:'Show the buttons',exact:true}).waitFor();
  trace.buttonsHiddenWithEye = true;
  trace.clearedNames = lesson.restore.map(s=>s.name);
  await page.screenshot({path:join(cfg.dir,'cleared.png'),scale:'css'});
  await status(page,`A fresh map · ${lesson.states.length} ${unit}`);
  for (const segment of segments) {
    if(segment.kind==='transition') {
      const open=page.getByTestId('fact-card');
      if(await open.count())await open.getByRole('button',{name:'Close',exact:true}).click();
      if(segment.view){
        if(!lesson.supplement)throw Error('A view switch requires supplemental configuration');
        if(!await page.evaluate(()=>!!window.__lessonSupplementReady))await installSupplement(page,lesson);
        await page.evaluate(view=>window.__lessonUseView(view),segment.view);
      }
      await status(page, 'Moving to the next study area');
    }
    if (segment.first) {
      const state = lesson.states.find(s => s.name === segment.state);
      const point=await statePoint(page,state.name,state.location);
      await page.mouse.move(...point, { steps: 16 });
      await sleep(350);
      await page.mouse.click(...point);
      if(state.rotateExtra) {
        await sleep(100);
        await page.mouse.click(...point);
        await sleep(100);
        await page.mouse.click(...point);
      }
      const card = page.getByTestId('fact-card');
      await card.waitFor();
      const actual = await card.locator('.fact-name').innerText();
      if (actual !== state.name) throw Error(`Expected ${state.name}, got ${actual}; viewport or map fit changed`);
      await page.mouse.move(1180, 260, { steps: 10 });
      await sleep(650);
      const facts = await card.innerText();
      if(state.factContains && !facts.includes(state.factContains))throw Error(`Expected fact missing for ${state.name}`);
      const layout=await verifyUncovered(page);
      trace.turns.push({ state: actual, view:state.view??'geoclick', start: at(), facts, sources: state.sources,layout });
      await status(page, `${trace.turns.length} / ${lesson.states.length} · ${actual}`);
      await page.screenshot({ path: join(cfg.dir, `${state.name.replaceAll(' ', '-')}.png`), scale: 'css' });
      console.log(`Revealed ${actual}: ${facts.replaceAll('\n', ' ')}`);
    }
    if(segment.kind==='state'){
      const state=lesson.states.find(s=>s.name===segment.state);
      for(const related of (state.relatedSelections??[]).filter(r=>r.lineIndex===segment.lineIndex)){
        await page.mouse.click(...await statePoint(page,related.name,related.location));
        const card=page.getByTestId('fact-card');await card.waitFor();
        const actual=await card.locator('.fact-name').innerText();
        if(actual!==related.name)throw Error(`Related selection expected ${related.name}, got ${actual}`);
        // A related status explanation may omit an outdated optional app fact.
        // The native target, label and pinned origin/status remain unchanged.
        if(related.hideExtra)await card.locator('.fact-extra').evaluateAll(nodes=>nodes.forEach(n=>n.style.display='none'));
        const layout=await verifyUncovered(page);
        (trace.relatedSelections??=[]).push({parent:state.name,target:actual,lineIndex:segment.lineIndex,start:at(),layout});
        await status(page,`${trace.turns.length} / ${lesson.states.length} · ${state.name} · ${actual} explained`);
        await page.mouse.move(1180,260);
        await page.screenshot({path:join(cfg.dir,`related-${actual.replaceAll(' ','-')}.png`),scale:'css'});
      }
    }
    if (segment.firstRecap) {
      await page.getByTestId('fact-card').getByRole('button', { name: 'Close', exact: true }).click();
      for(const action of lesson.recapGestures ?? [])await gesture(page,action);
      await status(page, `Covered: ${lesson.states.map(s=>s.name).join(' · ')}`);
      await sleep(400);
    }
    const start = at();
    trace.lines.push({ ...segment, start, end: start + segment.duration });
    writeFileSync(join(cfg.dir, 'progress.json'), JSON.stringify(trace, null, 2));
    console.log(`[${segment.kind}] ${segment.text}`);
    for(const action of segment.gestures ?? [])await gesture(page,action);
    await sleep(inspect ? 50 : Math.max(0,(start+segment.duration-at())*1000) + 650);
  }
  const names = await page.locator('.retention-asked').count();
  // Some names are curved SVG text, others use straight popup labels.
  if (trace.turns.length !== lesson.states.length) throw Error(`Only visited ${trace.turns.length} states`);
  trace.result = { statesVisited: trace.turns.length, chosenNameElements: names, completedPilot: true, quizPlayed: false };
  await page.screenshot({ path: join(cfg.dir, 'recap.png'), scale: 'css' });
  await context.storageState({ path: join(cfg.dir, 'browser-state.json') });
  await sleep(1200);
} finally {
  const video = page.video();
  await context.close();
  trace.video = video ? await video.path() : null;
  await browser.close();
  trace.trimStart = trimStart;
  trace.costs = costs;
  writeFileSync(join(cfg.dir, 'trace.json'), JSON.stringify(trace, null, 2));
}
if (!trace.result?.completedPilot) throw Error('Pilot did not complete');
if(inspect) {console.log('Preflight complete: every state and layout verified');process.exit(0);}
// Upper captions leave the bottom fact card unobstructed.
// libass force_style uses legacy SSA alignment 6 for top-centre.
const result = assemble({ ...cfg, trimStart, trimEnd: trace.lines.at(-1).end + 2, burnSubtitles:false, videoFilename:'play-no-subtitles.mp4' }, trace);
copyFileSync(join(cfg.dir,'subtitles.srt'),join(cfg.dir,'subtitles.en.srt'));
console.log(`Lesson complete: ${result.out} (${result.videoLength.toFixed(1)}s), optional English subtitles saved separately`);
