#!/usr/bin/env node
// Cache-only, native-1080p recorder. The legacy production path is untouched.
import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {readConfig} from '../src/core/config.mjs';
import {narrationSettings,canReuseSpeech,speechCacheKey} from '../src/core/narration.mjs';
import {assemble,writeSrt} from '../src/core/assemble.mjs';
import {attachCamera,statePoint,status} from '../src/core/geoclick-lesson-ui.mjs';
import {HD_VIEWPORT,hdLayout,hdFit,verifyHdFrame} from '../src/core/geoclick-hd-ui.mjs';
import {startLosslessRecording} from '../src/core/lossless-recording.mjs';

const arg=name=>process.argv.find(x=>x.startsWith(`--${name}=`))?.slice(name.length+3);
for(const name of ['lesson','framing','audio-cache','out'])if(!arg(name))throw Error(`Missing --${name}=`);
const cfg=readConfig(),lessonPath=resolve(arg('lesson')),lesson=JSON.parse(readFileSync(lessonPath));
if(lesson.supplement)throw Error('This HD recorder currently supports native maps only');
const framing=JSON.parse(readFileSync(resolve(arg('framing')))),cache=resolve(arg('audio-cache'));
const cached=JSON.parse(readFileSync(join(cache,'trace.json'))),inspect=process.argv.includes('--inspect');
if(!canReuseSpeech(cached,cfg))throw Error('Cache voice/model/language mismatch; synthesis is disabled');
if(existsSync(join(cfg.dir,'trace.json')))throw Error('Output already has a trace; choose a new output path');
if(new Set(lesson.states.map(x=>x.name)).size!==lesson.states.length)throw Error('Duplicate lesson target');
const segments=[...lesson.intro.map(text=>({kind:'intro',text})),...lesson.states.flatMap(s=>[
  ...(s.transition?[{kind:'transition',state:s.name,text:s.transition}]:[]),
  ...s.lines.map((text,i)=>({kind:'state',state:s.name,first:i===0,text}))
]),...lesson.recap.map((text,i)=>({kind:'recap',firstRecap:i===0,text}))];
// Validate the whole cache before creating a browser or copying any clips.
for(const segment of segments){
  const line=cached.lines.find(l=>l.text===segment.text);
  if(!line||!existsSync(join(cache,'clips',line.file)))throw Error(`Missing cached narration: ${segment.text}`);
  segment.source=join(cache,'clips',line.file);
}
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const [i,segment] of segments.entries()){
  segment.file=`lesson-${String(i).padStart(2,'0')}-${speechCacheKey(cfg,segment.text)}.mp3`;
  const dest=join(cfg.dir,'clips',segment.file);copyFileSync(segment.source,dest);
  segment.sha256=sha(dest);if(segment.sha256!==sha(segment.source))throw Error('Clip copy mismatch');
  segment.duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',dest],{encoding:'utf8'}));
  if(!Number.isFinite(segment.duration)||segment.duration<=0)throw Error('Invalid cached audio');
}
const effectiveLesson={...lesson,viewport:HD_VIEWPORT,hdFraming:framing};
writeFileSync(join(cfg.dir,'lesson.json'),JSON.stringify(effectiveLesson,null,2));
writeFileSync(join(cfg.dir,'lesson.md'),readFileSync(join(cache,'lesson.md')));
const trace={game:'geoclick',mode:'Known',lesson:lesson.title,mapId:lesson.mapId??'usa-states',narration:narrationSettings(cfg),capture:'lossless PNG CDP → lossless H.264 intermediate → CRF16 H.264/AAC',viewport:HD_VIEWPORT,lines:[],turns:[],trimStart:0,speechApiCalls:0};
const browser=await chromium.launch(),context=await browser.newContext({viewport:HD_VIEWPORT,deviceScaleFactor:1}),page=await context.newPage();
let capture,at=()=>0;
const wait=ms=>page.waitForTimeout(ms);
try{
  const base=cfg.base||'http://127.0.0.1:5187';
  await page.goto(base);await page.getByRole('link',{name:'About',exact:true}).click();
  await page.getByRole('link',{name:'User manual',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('article')?.innerText.length>1000);
  const manual=await page.locator('article').innerText();
  if(!manual.includes('Known')||!manual.includes('Clear'))throw Error('Unexpected GeoClick manual');
  writeFileSync(join(cfg.dir,'manual.txt'),manual);
  await page.goto(`${base}/map/${trace.mapId}`);await page.locator('.maplibregl-canvas').waitFor();await wait(6500);
  const notice=page.getByTestId('known-empty');
  if(await notice.isVisible())await notice.getByRole('button',{name:'Close this notice'}).click();
  trace.knownNoticeClosed=true;
  await hdLayout(page,framing,lesson.states.map(s=>s.name));await attachCamera(page,trace.mapId);
  // Prime each fact rotation through real visits, then visibly Clear names.
  for(const s of lesson.states){
    if(!framing.views[s.name])throw Error(`No reviewed framing for ${s.name}`);
    await hdFit(page,framing.views[s.name],false);
    const point=await statePoint(page,s.name,s.location);await page.mouse.click(...point);
    const actual=await page.getByTestId('fact-card').locator('.fact-name').innerText();if(actual!==s.name)throw Error(`Restore selected ${actual} instead of ${s.name}`);
    await page.mouse.click(...point);await page.mouse.click(...point);
  }
  await hdFit(page,framing.openingBounds,false);
  if(!inspect){capture=await startLosslessRecording(page,join(cfg.dir,'video'),HD_VIEWPORT);at=capture.at;}
  await wait(inspect?50:650);
  await page.getByTestId('clear-names').click();
  await page.getByRole('button',{name:'Hide the buttons',exact:true}).click();
  await page.getByRole('button',{name:'Show the buttons',exact:true}).waitFor();trace.buttonsHiddenWithEye=true;
  await page.screenshot({path:join(cfg.dir,'cleared.png')});
  let currentView;
  for(const segment of segments){
    if(segment.kind==='transition'){
      const card=page.getByTestId('fact-card');if(await card.count())await card.getByRole('button',{name:'Close',exact:true}).click();
      await status(page,'Moving to the next study area');
    }
    if(segment.first){
      const s=lesson.states.find(s=>s.name===segment.state);
      await page.locator('#lesson-route').evaluate(el=>el.style.display='none');
      if(currentView!==s.name){await hdFit(page,framing.views[s.name],!inspect);currentView=s.name;}
      const point=await statePoint(page,s.name,s.location);await page.mouse.move(...point,{steps:18});await wait(inspect?10:250);await page.mouse.click(...point);
      if(s.rotateExtra){await page.mouse.click(...point);await page.mouse.click(...point);}
      const card=page.getByTestId('fact-card');await card.waitFor();
      const actual=await card.locator('.fact-name').innerText();if(actual!==s.name)throw Error(`Expected ${s.name}, got ${actual}`);
      const facts=await card.innerText();if(s.factContains&&!facts.includes(s.factContains))throw Error(`Expected fact missing for ${s.name}`);
      await status(page,`${trace.turns.length+1} / ${lesson.states.length} · ${s.name}`);
      await page.mouse.move(1400,100,{steps:10});await wait(inspect?50:500);
      const layout=await verifyHdFrame(page,s.name);
      trace.turns.push({state:actual,start:at(),facts,layout});
      await page.screenshot({path:join(cfg.dir,`${s.name.replaceAll(' ','-')}.png`)});
      console.log(`VERIFIED ${actual} · full boundary and fact card inside frame`);
    }
    if(segment.firstRecap){
      await page.getByTestId('fact-card').getByRole('button',{name:'Close',exact:true}).click();
      await hdFit(page,framing.recapBounds,!inspect);
      for(const s of lesson.states)await verifyHdFrame(page,s.name);
      await status(page,'9 states · Northeast complete');
      await page.locator('#lesson-route').evaluate(el=>el.style.display='block');
    }
    const start=at();trace.lines.push({...segment,start,end:start+segment.duration});
    writeFileSync(join(cfg.dir,'progress.json'),JSON.stringify(trace,null,2));
    console.log(`[${segment.kind}] ${segment.text}`);
    if(segment.kind==='transition'){
      await hdFit(page,framing.views[segment.state],!inspect);currentView=segment.state;
    }
    await wait(inspect?30:Math.max(0,(start+segment.duration-at())*1000)+500);
  }
  trace.result={statesVisited:trace.turns.length,completedPilot:true,quizPlayed:false};
  await page.screenshot({path:join(cfg.dir,'recap.png')});await wait(inspect?10:1000);
}finally{
  if(capture){console.log('Encoding lossless capture');const recorded=await capture.finish();trace.video=recorded.video;trace.captureDuration=recorded.duration;trace.frameCount=recorded.frameCount;}
  await browser.close();writeFileSync(join(cfg.dir,'trace.json'),JSON.stringify(trace,null,2));
}
if(!trace.result?.completedPilot)throw Error('Lesson did not complete');
if(inspect){console.log('HD PREFLIGHT PASSED');process.exit(0)}
console.log('Mixing cached narration and exporting 1080p master');
const result=assemble({...cfg,trimStart:0,trimEnd:trace.captureDuration,burnSubtitles:false,videoCrf:16,videoFilename:'play-no-subtitles.mp4'},trace);
const wrap=text=>{const rows=[];let row='';for(const w of text.split(/\s+/)){if(row.length+w.length+1>34){rows.push(row);row=w}else row+=(row?' ':'')+w}if(row)rows.push(row);return rows.join('\n')};
writeSrt(trace.lines.map(l=>({...l,text:wrap(l.text)})),join(cfg.dir,'subtitles.en.srt'));
const srt=readFileSync(join(cfg.dir,'subtitles.en.srt'),'utf8');
writeFileSync(join(cfg.dir,'subtitles.en.vtt'),'WEBVTT\n\n'+srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2').replace(/(--> \d{2}:\d{2}:\d{2}\.\d{3})/g,'$1 line:76% position:87%,center size:24% align:center'));
console.log(`HD LESSON DONE: ${result.out}`);
