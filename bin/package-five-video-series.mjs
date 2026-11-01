import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
const ledgerPath='src/lessons/usa-five-video-coverage.json';
const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/usa-five-20261101');
const files=[],reports=[];
for(const [i,e] of ledger.episodes.entries()){
 const dir=resolve(e.video,'..');
 const report=JSON.parse(readFileSync(join(dir,'verification.json'),'utf8'));
 if(report.visualReview!=='passed')throw Error(`Visual review pending: ${e.id}`);
 if(JSON.stringify(e.states)!==JSON.stringify(report.states))throw Error(`Coverage mismatch: ${e.id}`);
 e.status='complete';e.covered=e.states;e.durationSeconds=report.durationSeconds;
 for(const name of ['play-no-subtitles.mp4','subtitles.en.srt','subtitles.en.vtt','lesson.md','lesson.json','verification.json']){
  const file=join(dir,name);if(!existsSync(file))throw Error(`Missing ${file}`);files.push(relative(root,file));
 }
 reports.push({episode:i+1,region:e.id,states:e.states,durationSeconds:e.durationSeconds,video:relative(root,resolve(e.video)),captions:['subtitles.en.srt','subtitles.en.vtt'],audioPeakDb:report.audioPeakDb});
}
const names=reports.flatMap(e=>e.states);
if(names.length!==48||new Set(names).size!==48||names.some(n=>['Alaska','Hawaii','District of Columbia'].includes(n)))throw Error('Invalid final coverage');
ledger.status='complete';ledger.coveredStateCount=48;
writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
writeFileSync(join(root,'series-manifest.json'),JSON.stringify({edition:ledger.edition,scope:ledger.scope,excluded:ledger.excluded,exclusionReason:ledger.exclusionReason,episodes:reports},null,2)+'\n');
const stamp=s=>{const seconds=Math.round(s);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;};
writeFileSync(join(root,'README.md'),'# US states: five regional lessons\n\nAll 48 contiguous states, exactly once. English narration by John. Each lesson combines location cues, interesting facts and memory hooks in GeoClick Known mode.\n\n'+reports.map(e=>`## ${e.episode}. ${e.region} (${e.states.length} states, ${stamp(e.durationSeconds)})\n\n[Play video](${e.video.replaceAll('\\','/')})\n\n${e.states.join(', ')}.\n`).join('\n')+'\n## Captions and upload\n\nUse each episode’s play-no-subtitles.mp4 as the clean master. English narration is included; captions are not burned in. Upload the adjacent subtitles.en.vtt (positioned at the top) or subtitles.en.srt as an optional English track in YouTube Studio, with timing. Check caption placement after upload processing.\n\nAlaska and Hawaii are deliberately omitted, as briefly explained in episode 5: their distinctive locations already make them easy to remember. Washington, D.C., is not counted as a state.\n\nMedia decoding, audio levels, state selections, outside-map fact cards, caption parsing/switching and representative frames were checked. Audio levels do not constitute a listening review.\n');
files.push('README.md','series-manifest.json');
const zip=join(root,'all-five-videos.zip');
execFileSync('tar.exe',['-a','-c','-f',zip,'-C',root,...files],{stdio:'inherit'});
console.log(reports.map(e=>`${e.episode}. ${e.region}: ${e.states.length} states, ${stamp(e.durationSeconds)}`).join('\n'));console.log(zip);
