#!/usr/bin/env node
// Add observed, timed third-person commentary to a supplied silent recording.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {speak,probeDuration} from '../src/core/narrator.mjs';
import {defaultVoice,narrationSettings,speechCacheKey} from '../src/core/narration.mjs';
import {assemble} from '../src/core/assemble.mjs';
import {costs} from '../src/core/cost.mjs';
const scriptPath=process.argv.find(a=>a.startsWith('--script='))?.slice(9)??'src/lessons/human-geoclick-commentary.json';
const script=JSON.parse(readFileSync(resolve(scriptPath),'utf8'));
const dir=resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)??'rendered/human-player-20261030');
mkdirSync(join(dir,'clips'),{recursive:true});
const cfg={dir,lang:'en',voiceProvider:'minimax',voice:process.argv.find(a=>a.startsWith('--voice='))?.slice(8)??defaultVoice('minimax','en')};
const trace={game:'geoclick-human-demonstration',mode:'observed recording',narration:narrationSettings(cfg),video:resolve(script.sourceVideo),title:script.title,trimStart:0,turns:[],lines:[],result:script.observedResult};
if(Math.abs(probeDuration(trace.video)-script.sourceDuration)>0.1)throw Error('Source duration changed');
for(let i=0;i<script.cues.length;i++){
 const cue=script.cues[i];const hash=speechCacheKey(cfg,cue.text);
 const file=`comment-${String(i).padStart(2,'0')}-${hash}.mp3`,path=join(dir,'clips',file);
 const duration=existsSync(path)?probeDuration(path):await speak(cfg,cue.text,file);
 if(cue.start+duration>cue.windowEnd)throw Error(`Cue ${i+1} needs ${duration.toFixed(2)}s; window only ${(cue.windowEnd-cue.start).toFixed(2)}s. Shorten the wording.`);
 trace.lines.push({start:cue.start,end:cue.start+duration,text:cue.text,file,kind:'commentary'});
 console.log(`Prepared ${i+1}/${script.cues.length}: ${cue.start}s–${(cue.start+duration).toFixed(2)}s`);
}
trace.costs=costs;
writeFileSync(join(dir,'commentary-script.json'),JSON.stringify(script,null,2));
writeFileSync(join(dir,'trace.json'),JSON.stringify(trace,null,2));
writeFileSync(join(dir,'commentary.md'),`# ${script.title}\n\n`+trace.lines.map(l=>`**${l.start.toFixed(1)}s** ${l.text}`).join('\n\n')+'\n');
const result=assemble({...cfg,burnSubtitles:false,videoFilename:'play-no-subtitles.mp4',tailSeconds:0,videoFilter:script.presentation.videoFilter},trace);
copyFileSync(join(dir,'subtitles.srt'),join(dir,'subtitles.en.srt'));
console.log(result);
