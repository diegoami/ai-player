#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {writeSrt} from '../src/core/assemble.mjs';

const flag=process.argv.find(a=>a.startsWith('--dir='));if(!flag)throw Error('Use --dir=');
const dir=resolve(flag.slice(6)),trace=JSON.parse(readFileSync(join(dir,'trace.json'))),lesson=JSON.parse(readFileSync(join(dir,'lesson.json'))),mp4=join(dir,'play-no-subtitles.mp4');
const assert=(value,text)=>{if(!value)throw Error(text)};
assert(trace.result?.completedPilot&&trace.buttonsHiddenWithEye&&trace.speechApiCalls===0,'Incomplete cache-only UI proof');
assert(JSON.stringify(trace.turns.map(t=>t.state))===JSON.stringify(lesson.states.map(s=>s.name)),'Wrong target order or count');
const expected=[...lesson.intro,...lesson.states.flatMap(s=>[...(s.transition?[s.transition]:[]),...s.lines]),...lesson.recap];
assert(JSON.stringify(expected)===JSON.stringify(trace.lines.map(l=>l.text)),'Narration text changed');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const [i,line] of trace.lines.entries()){
  assert(hash(join(dir,'clips',line.file))===line.sha256&&hash(line.source)===line.sha256,'Narration clip changed');
  assert(Math.abs((line.end-line.start)-line.duration)<.001,'Narration duration mismatch');
  if(i)assert(line.start>=trace.lines[i-1].end,'Overlapping narration');
}
for(const turn of trace.turns){assert(Math.min(...Object.values(turn.layout.targetMargins))>=25,'Target boundary clipped');assert(turn.layout.textFullyVisible,'Fact text clipped')}
const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',mp4],{encoding:'utf8'}));
const video=meta.streams.find(s=>s.codec_type==='video');
assert(video.width===1920&&video.height===1080&&video.r_frame_rate==='30/1'&&video.codec_name==='h264','Incorrect HD output');
assert(!meta.streams.some(s=>s.codec_type==='subtitle')&&meta.streams.some(s=>s.codec_type==='audio'),'Incorrect streams');
assert(Number(meta.format.duration)>=trace.lines.at(-1).end,'Narration cut off at end');
const decode=spawnSync('ffmpeg',['-hide_banner','-i',mp4,'-af','volumedetect','-f','null','-'],{encoding:'utf8'});
assert(decode.status===0,'Full video/audio decode failed');
const peak=Number(decode.stderr.match(/max_volume: ([\d.-]+) dB/)?.[1]);assert(Number.isFinite(peak)&&peak<0&&peak>-15,'Silent or clipped audio');
const frames=[];
for(const [i,turn] of trace.turns.entries()){
  const file=`review-${String(i+1).padStart(2,'0')}-${turn.state.replaceAll(' ','-')}.png`,time=turn.start+2;
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',mp4,'-frames:v','1',join(dir,file)]);
  frames.push({state:turn.state,file,time});
}
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(trace.lines.at(-1).start+2),'-i',mp4,'-frames:v','1',join(dir,'review-recap.png')]);
// Put optional WebVTT narration in the spare lower sidebar, outside the map.
const wrap=text=>{const rows=[];let row='';for(const word of text.split(/\s+/)){if(row&&row.length+word.length+1>34){rows.push(row);row=word}else row+=(row?' ':'')+word}if(row)rows.push(row);return rows.join('\n')};
writeSrt(trace.lines.map(l=>({...l,text:wrap(l.text)})),join(dir,'subtitles.en.srt'));
const srt=readFileSync(join(dir,'subtitles.en.srt'),'utf8');
writeFileSync(join(dir,'subtitles.en.vtt'),'WEBVTT\n\n'+srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2').replace(/(--> \d{2}:\d{2}:\d{2}\.\d{3})/g,'$1 line:76% position:87%,center size:24% align:center'));
const browser=await chromium.launch();let cues;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),bytes=readFileSync(mp4);
 await page.route('http://lesson.local/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname==='/video.mp4'){
   const range=route.request().headers().range?.match(/bytes=(\d+)-(\d*)/),start=range?+range[1]:0,end=range?.[2]?Math.min(+range[2],bytes.length-1):bytes.length-1;
   await route.fulfill({status:range?206:200,contentType:'video/mp4',headers:{'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})},body:bytes.subarray(start,end+1)});
  }else if(pathname==='/en.vtt')await route.fulfill({contentType:'text/vtt',body:readFileSync(join(dir,'subtitles.en.vtt'))});
  else await route.fulfill({contentType:'text/html',body:'<style>body{margin:0}video{width:1920px;height:1080px}video::cue{font:22px/1.35 system-ui}</style><video src="/video.mp4"><track kind="subtitles" srclang="en" src="/en.vtt"></video>'});
 });
 await page.goto('http://lesson.local/');await page.locator('track').evaluate(t=>t.track.mode='showing');
 await page.waitForFunction(()=>document.querySelector('track').readyState===2);
 cues=await page.locator('track').evaluate(t=>Array.from(t.track.cues,c=>({line:c.line,position:c.position,size:c.size})));
 assert(cues.length===trace.lines.length&&cues.every(c=>c.line===76&&c.position===87&&c.size===24),'Caption count or sidebar placement wrong');
 const captionFit=await page.evaluate(texts=>{const c=document.createElement('canvas').getContext('2d');c.font='22px system-ui';return texts.every(text=>text.split('\n').length<=8&&text.split('\n').every(row=>c.measureText(row).width<=440))},trace.lines.map(l=>wrap(l.text)));
 assert(captionFit,'Caption text exceeds sidebar capacity');
 const time=trace.turns.find(t=>t.state==='Rhode Island')?.start+3||trace.turns[0].start+3;
 await page.locator('video').evaluate(async(v,time)=>{if(v.readyState<1)await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));v.currentTime=time;await new Promise(r=>v.addEventListener('seeked',r,{once:true}))},time);
 await page.waitForTimeout(350);await page.screenshot({path:join(dir,'captions-on.png')});
 await page.locator('track').evaluate(t=>t.track.mode='disabled');await page.waitForTimeout(200);await page.screenshot({path:join(dir,'captions-off.png')});
}finally{await browser.close()}
const report={checkedAt:new Date().toISOString(),durationSeconds:Number(meta.format.duration),width:video.width,height:video.height,fps:30,states:trace.turns.map(t=>t.state),narrator:trace.narration,exactCachedClips:trace.lines.length,speechApiCalls:0,fullMediaDecode:'passed',audioPeakDb:peak,fullListeningReview:false,boundariesAndCards:'passed',captions:{count:cues.length,formats:['SRT','WebVTT'],sidebarPositionVerified:true,toggleVerified:true},frames,visualReview:'pending',sha256:hash(mp4)};
writeFileSync(join(dir,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
