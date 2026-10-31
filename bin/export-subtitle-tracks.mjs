#!/usr/bin/env node
// Write optional translations using the exact timing of the English captions.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {writeSrt} from '../src/core/assemble.mjs';
const folder=process.argv.find(a=>a.startsWith('--dir='))?.slice(6);
if(!folder)throw Error('Usage: node bin/export-subtitle-tracks.mjs --dir=<lesson-output>');
const dir=resolve(folder);
const translationPath=process.argv.find(a=>a.startsWith('--translations='))?.slice(15)??'src/lessons/usa-episode-01-northeast.subtitles.json';
const translations=JSON.parse(readFileSync(resolve(translationPath),'utf8'));
const trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
const source=trace.lines.map(line=>line.text);
const hash=createHash('sha256').update(JSON.stringify(source)).digest('hex');
if(hash!==translations.sourceSha256)throw Error('Narration changed: review translations before export');
const timed=trace.lines.map(line=>({...line,start:line.start-(trace.trimStart??0),end:line.end-(trace.trimStart??0)}));
writeSrt(timed,join(dir,'subtitles.srt'));
writeSrt(timed,join(dir,'subtitles.en.srt'));
const cues=readFileSync(join(dir,'subtitles.en.srt'),'utf8').trim().split(/\r?\n\r?\n/).map(block=>block.split(/\r?\n/));
if(cues.length!==source.length)throw Error('English subtitle count does not match narration');
const tracks={en:{label:'English',lines:source},...translations.languages};
const wrap=text=>{
 const lines=[];let line='';
 for(const word of text.split(/\s+/)){
  if(line && line.length+word.length+1>90){lines.push(line);line=word;}
  else line+=(line?' ':'')+word;
 }
 if(line)lines.push(line);return lines.join('\n');
};
for(const [language,track] of Object.entries(tracks)){
 if(track.lines.length!==cues.length || track.lines.some(text=>typeof text!=='string'||!text.trim()))throw Error(`Invalid ${language} translation count or text`);
 const output=cues.map((cue,i)=>`${cue[0]}\n${cue[1]}\n${wrap(track.lines[i])}\n`).join('\n');
 writeFileSync(join(dir,`subtitles.${language}.srt`),output,'utf8');
 const vtt='WEBVTT\n\n'+cues.map((cue,i)=>`${cue[0]}\n${cue[1].replaceAll(',','.')} line:2% position:50%,center size:96% align:center\n${wrap(track.lines[i])}\n`).join('\n');
 writeFileSync(join(dir,`subtitles.${language}.vtt`),vtt,'utf8');
 console.log(`${track.label}: ${cues.length} optional cues; timing identical to English`);
}
writeFileSync(join(dir,'subtitle-tracks.json'),JSON.stringify({sourceSha256:hash,cueCount:cues.length,languages:Object.keys(tracks),formats:['srt','vtt'],vttPosition:'top band: line 2%',burnedIn:false},null,2));
