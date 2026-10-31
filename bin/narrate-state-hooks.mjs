#!/usr/bin/env node
// Match named educational commentary to verified human placements.
// Short replay holds give fast placements enough time for their memory hook.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {speak,probeDuration} from '../src/core/narrator.mjs';
import {assemble} from '../src/core/assemble.mjs';
const plan=JSON.parse(readFileSync('src/lessons/human-state-hooks.json','utf8'));
const eventsFile=existsSync(plan.eventsFile)?plan.eventsFile:'src/lessons/data/human-placement-events.json';
const events=JSON.parse(readFileSync(eventsFile,'utf8'));
const dir=resolve('rendered/human-state-hooks-20261030');mkdirSync(join(dir,'clips'),{recursive:true});
const cfg={dir,lang:'en',voiceProvider:'minimax',voice:'English_expressive_narrator'};
if(events.length!==49||new Set(events.map(e=>e.state)).size!==49||events.some(e=>!plan.hooks[e.state]))throw Error('Need exactly 49 verified target hooks');
if(Math.abs(probeDuration(plan.sourceVideo)-plan.sourceDuration)>.1)throw Error('Source changed');
const cues=[{state:null,sourceStart:1,holdAt:6.5,text:plan.opening},
 ...events.map(e=>({...e,sourceStart:e.pickupTime,holdAt:e.state==='Utah'?271.8:e.resolvedTime+.4,text:plan.hooks[e.state]})),
 {state:null,sourceStart:273,holdAt:273.4,text:plan.closing}];
const holds=[];
const lessonFiles=['usa-episode-01-northeast.json','usa-episode-02-south.json','usa-episode-03-midwest.json','usa-episode-04-west.json'];
const lessonIndex=new Map();
for(const file of lessonFiles){for(const state of JSON.parse(readFileSync(join('src/lessons',file),'utf8')).states)lessonIndex.set(state.name,{file,lines:state.lines});}
for(let i=0;i<cues.length;i++){
 const cue=cues[i],hash=createHash('sha256').update(cue.text).digest('hex').slice(0,10);
 cue.file=`hook-${String(i).padStart(2,'0')}-${hash}.mp3`;const path=join(dir,'clips',cue.file);
 cue.duration=existsSync(path)?probeDuration(path):await speak(cfg,cue.text,cue.file);
 const available=(cues[i+1]?.sourceStart??plan.sourceDuration)-cue.sourceStart;
 cue.holdAt=Math.min(cue.holdAt,(cues[i+1]?.sourceStart??plan.sourceDuration)-.5);
 const extra=Math.max(0,cue.duration+.6-available)+(i===cues.length-1?3:0);
 cue.holdSeconds=extra?Math.ceil(extra*30)/30:0;
 if(cue.holdSeconds)holds.push({at:Math.round(cue.holdAt*30)/30,duration:cue.holdSeconds,state:cue.state??'Result'});
 console.log(`${i+1}/${cues.length} ${cue.state??'Context'}: ${cue.duration.toFixed(2)}s, hold ${cue.holdSeconds.toFixed(2)}s`);
}
const shifted=t=>t+holds.filter(h=>h.at<=t).reduce((sum,h)=>sum+h.duration,0);
const trace={game:'geoclick-human-state-hooks',mode:'educational replay with declared memory-hook holds',video:resolve(plan.sourceVideo),trimStart:0,lines:[],turns:[],holds,result:{correctFirstTry:49,targets:49,mistakes:0},sourceDuration:plan.sourceDuration};
for(const cue of cues){
 const start=shifted(cue.sourceStart),end=start+cue.duration;
 trace.lines.push({start,end,text:cue.text,file:cue.file,kind:cue.state?'state-hook':'context',state:cue.state,sourceStart:cue.sourceStart});
 if(cue.state){const lesson=lessonIndex.get(cue.state==='District of Columbia'?'Washington':cue.state);trace.turns.push({state:cue.state,start,sourcePickup:cue.pickupTime,sourceResolved:cue.resolvedTime,holdSeconds:cue.holdSeconds,text:cue.text,sourceLesson:lesson?.file,priorLessonLines:lesson?.lines});}
}
for(let i=0;i<trace.lines.length-1;i++)if(trace.lines[i].end>trace.lines[i+1].start-.3)throw Error('Commentary overlaps next placement');
const total=plan.sourceDuration+holds.reduce((sum,h)=>sum+h.duration,0);
trace.duration=total;
const expression=holds.length?`PTS+(${holds.map(h=>`gte(T,${h.at.toFixed(6)})*${h.duration.toFixed(6)}`).join('+')})/TB`:'PTS';
const filter=`${plan.videoFilter},setpts='${expression}',fps=30`;
writeFileSync(join(dir,'trace.json'),JSON.stringify(trace,null,2));
writeFileSync(join(dir,'placement-timeline.json'),JSON.stringify(events,null,2));
writeFileSync(join(dir,'commentary.md'),'# State-by-state memory-hook replay\n\n'+trace.lines.map(l=>`**${l.start.toFixed(2)}s${l.state?' · '+l.state:''}** ${l.text}`).join('\n\n')+'\n');
if(process.argv.includes('--prepare-only')){console.log(`Prepared ${trace.lines.length} cues; ${total.toFixed(2)}s replay`);process.exit(0);}
const result=assemble({...cfg,burnSubtitles:false,videoFilename:'play-no-subtitles.mp4',tailSeconds:0,videoFilter:filter,videoDuration:total},trace);
copyFileSync(join(dir,'subtitles.srt'),join(dir,'subtitles.en.srt'));
console.log(result);
