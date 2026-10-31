import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const outputDir=process.argv.find(a=>a.startsWith('--dir='))?.slice(6);
if(!outputDir)throw Error('Usage: node bin/check-subtitle-playback.mjs --dir=<lesson-output> [--state=<state>]');
const dir=resolve(outputDir);
const trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
const video=readFileSync(join(dir,'play-no-subtitles.mp4'));
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 await page.route('http://lesson-preview.local/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/video.mp4'){
   const range=route.request().headers().range?.match(/bytes=(\d+)-(\d*)/);
   const start=range?Number(range[1]):0,end=range?.[2]?Math.min(Number(range[2]),video.length-1):video.length-1;
   await route.fulfill({status:range?206:200,contentType:'video/mp4',headers:{'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${video.length}`}:{})},body:video.subarray(start,end+1)});
  }else if(path.endsWith('.vtt'))await route.fulfill({contentType:'text/vtt; charset=utf-8',body:readFileSync(join(dir,path.slice(1)))});
  else await route.fulfill({contentType:'text/html',body:`<!doctype html><style>body{margin:0}video{width:1600px;height:900px}video::cue{font-size:28px}</style><video id="video" preload="auto" src="/video.mp4">${['en','de','it'].map(l=>`<track kind="subtitles" srclang="${l}" label="${l}" src="/subtitles.${l}.vtt">`).join('')}</video>`});
 });
 await page.goto('http://lesson-preview.local/');
 const report=[];
 for(const language of ['en','de','it']){
  const track=page.locator(`track[srclang="${language}"]`);
  await track.evaluate(el=>el.track.mode='hidden');
  await page.waitForFunction(lang=>{const t=document.querySelector(`track[srclang="${lang}"]`);return t.readyState===2;},language);
  const result=await track.evaluate(el=>({language:el.srclang,cues:el.track.cues.length,topPosition:el.track.cues[0].line,snapToLines:el.track.cues[0].snapToLines}));
  if(result.cues!==trace.lines.length || result.topPosition!==2 || result.snapToLines!==false)throw Error(`Invalid track: ${JSON.stringify(result)}`);
  report.push(result);
 }
 await page.evaluate(()=>{for(const t of document.querySelectorAll('track'))t.track.mode='disabled';document.querySelector('track[srclang="de"]').track.mode='showing';});
 const state=process.argv.find(a=>a.startsWith('--state='))?.slice(8)??trace.turns[0]?.state;
 const previewTime=process.argv.find(a=>a.startsWith('--time='))?.slice(7);
 const time=previewTime!==undefined?Number(previewTime):trace.turns.find(t=>t.state===state).start-trace.trimStart+4;
 await page.evaluate(async time=>{const v=document.querySelector('video');if(v.readyState<1)await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));v.currentTime=time;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));},time);
 await page.waitForTimeout(600);
 await page.screenshot({path:join(dir,'optional-subtitles-de-preview.png')});
 await page.evaluate(()=>{for(const t of document.querySelectorAll('track'))t.track.mode='disabled';});
 await page.waitForTimeout(200);
 await page.screenshot({path:join(dir,'optional-subtitles-off-preview.png')});
 writeFileSync(join(dir,'subtitle-playback-check.json'),JSON.stringify({tracks:report,toggleOffVerified:true,previewTime:time},null,2));
 console.log(report);
}finally{await browser.close();}
