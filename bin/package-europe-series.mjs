import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
const ledgerPath='src/lessons/europe-coverage.json';
const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/europe-six-20261101'),files=[],reports=[];
for(const [i,e] of ledger.episodes.entries()){
 const dir=resolve(e.video,'..'),report=JSON.parse(readFileSync(join(dir,'verification.json'),'utf8'));
 if(report.visualReview!=='passed')throw Error(`Visual review pending: ${e.id}`);
 if(JSON.stringify(e.places)!==JSON.stringify(report.states))throw Error(`Coverage mismatch: ${e.id}`);
 const trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
 if(trace.turns.filter(t=>t.view==='supplemental').length!==e.supplemental.length)throw Error(`Supplemental view mismatch: ${e.id}`);
 e.status='complete';e.covered=e.places;e.durationSeconds=report.durationSeconds;
 for(const name of ['play-no-subtitles.mp4','subtitles.en.srt','subtitles.en.vtt','lesson.md','lesson.json','verification.json']){
  const file=join(dir,name);if(!existsSync(file))throw Error(`Missing ${file}`);files.push(relative(root,file));
 }
 reports.push({episode:i+1,region:e.title,places:e.places,nativeTargets:e.nativeTargets,supplemental:e.supplemental,durationSeconds:e.durationSeconds,video:relative(root,resolve(e.video)),captions:['subtitles.en.srt','subtitles.en.vtt'],audioPeakDb:report.audioPeakDb});
}
const names=reports.flatMap(e=>e.places);
if(names.length!==45||new Set(names).size!==45||reports.flatMap(e=>e.nativeTargets).length!==39||reports.flatMap(e=>e.supplemental).length!==6)throw Error('Invalid final coverage');
ledger.status='complete';ledger.coveredPlaceCount=45;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
writeFileSync(join(root,'series-manifest.json'),JSON.stringify({edition:ledger.edition,scope:ledger.scope,outsideScope:ledger.outsideScope,episodes:reports},null,2)+'\n');
const stamp=s=>{const n=Math.round(s);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
writeFileSync(join(root,'README.md'),'# Europe: six regional geography lessons\n\nEnglish narration by John. Location cues, interesting facts and memory hooks for 39 GeoClick Europe map targets plus six supplemental microstates, exactly once.\n\n'+reports.map(e=>`## ${e.episode}. ${e.region} (${e.places.length} places, ${stamp(e.durationSeconds)})\n\n[Play video](${e.video.replaceAll('\\','/')})\n\n${e.places.join(', ')}.\n\n${e.supplemental.length?'Labelled supplemental views: '+e.supplemental.join(', ')+'.':'All selections use the native GeoClick Europe map.'}\n`).join('\n')+'\n## Scope\n\nThe six omitted native-game microstates use public-domain Natural Earth 1:10m generalized geographic polygons, at their real positions and relative scale. Their source is labelled visibly; they are not represented as native quiz progress. Kosovo is included as a GeoClick target with a short explanation of its disputed status. This is a map-based teaching scope, not a universal definition of Europe. Türkiye, Cyprus and the Caucasus are outside this edition; the last lesson explains this.\n\n## Captions and upload\n\nUse each play-no-subtitles.mp4 as the clean master. English narration is included, with no burned-in captions. Upload the adjacent subtitles.en.vtt (top positioned) or subtitles.en.srt as an optional English track with timing. Preview positioning after YouTube processing.\n\nState/country selections, card layout, media streams, audio levels, optional caption parsing/switching, representative video frames and each supplemental microstate were checked. Decoding and level checks do not constitute a listening review. Sources for the narration are in the lesson transcripts.\n');
const readmePath=join(root,'README.md');
writeFileSync(readmePath,readFileSync(readmePath,'utf8').replace('public-domain Natural Earth 1:10m generalized geographic polygons, at their real positions and relative scale.','Natural Earth 1:10m context and detailed geoBoundaries polygons for Vatican City and Monaco, with IGN-F ADMIN EXPRESS 2022 coastal context for Monaco. All retain their real positions and relative scale. Monaco data: © OpenStreetMap contributors, ODbL 1.0; IGN-F data: Etalab Open License 2.0. The reusable combined geographic database and full license notices are included in this package.'));
files.push('README.md','series-manifest.json');
for(const name of ['europe-microstates.source.json','europe-microstates.geojson','europe-microstates.LICENSE.txt']){
 writeFileSync(join(root,name),readFileSync(join('src/lessons/data',name)));files.push(name);
}
const zip=join(root,'all-six-europe-videos.zip');execFileSync('tar.exe',['-a','-c','-f',zip,'-C',root,...files],{stdio:'inherit'});
console.log(reports.map(e=>`${e.episode}. ${e.region}: ${e.places.length} places, ${stamp(e.durationSeconds)}`).join('\n'));console.log(zip);
