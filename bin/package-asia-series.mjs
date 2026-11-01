import{readFileSync,writeFileSync,existsSync}from'node:fs';
import{resolve,join,relative}from'node:path';
import{execFileSync}from'node:child_process';
const ledgerPath='src/lessons/asia-coverage.json',ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/asia-seven-20261101'),files=[],reports=[];
const stamp=s=>{const n=Math.round(s);return`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
for(const[i,e]of ledger.episodes.entries()){
 const dir=resolve(e.video,'..'),r=JSON.parse(readFileSync(join(dir,'verification.json'),'utf8')),trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
 if(r.visualReview!=='passed')throw Error(`Visual review pending: ${e.id}`);
 if(JSON.stringify(r.states)!==JSON.stringify(e.places))throw Error(`Coverage mismatch: ${e.id}`);
 if(JSON.stringify((trace.relatedSelections??[]).map(t=>t.target))!==JSON.stringify(e.relatedTargets))throw Error(`Related selection mismatch: ${e.id}`);
 if(trace.turns.filter(t=>t.view==='supplemental').length!==e.supplemental.length)throw Error(`Supplement mismatch: ${e.id}`);
 for(const name of['play-no-subtitles.mp4','subtitles.en.srt','subtitles.en.vtt','lesson.md','lesson.json','verification.json']){const path=join(dir,name);if(!existsSync(path))throw Error(`Missing ${path}`);files.push(relative(root,path));}
 e.status='complete';e.covered=e.places;e.durationSeconds=r.durationSeconds;
 reports.push({episode:i+1,region:e.title,places:e.places,relatedTargets:e.relatedTargets,supplemental:e.supplemental,durationSeconds:r.durationSeconds,video:relative(root,resolve(e.video)).replaceAll('\\','/'),audioPeakDb:r.audioPeakDb});
}
const names=reports.flatMap(e=>e.places),native=ledger.episodes.flatMap(e=>[...e.nativeTargets,...e.relatedTargets]);
if(names.length!==49||new Set(names).size!==49||native.length!==47||new Set(native).size!==47||reports.flatMap(e=>e.supplemental).length!==3)throw Error('Invalid final coverage');
ledger.status='complete';ledger.coveredPlaceCount=49;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
writeFileSync(join(root,'series-manifest.json'),JSON.stringify({edition:ledger.edition,scope:ledger.scope,russia:ledger.russia,episodes:reports},null,2)+'\n');
writeFileSync(join(root,'README.md'),'# Asia: seven regional geography lessons\n\nEnglish narration by John, with location cues, interesting facts and memory hooks. Forty-nine teaching stops appear exactly once.\n\n'+reports.map(e=>`## ${e.episode}. ${e.region} (${e.places.length} stops, ${stamp(e.durationSeconds)})\n\n[Play video](${e.video})\n\n${e.places.join(', ')}.\n\n${e.supplemental.length?'Labelled supplemental maps: '+e.supplemental.join(', ')+'.':'Native GeoClick map selections.'}${e.relatedTargets.length?' Northern Cyprus is demonstrated within the Cyprus stop and is not counted as a second country.':''}\n`).join('\n')+'\n## Scope\n\nAll 47 native GeoClick Asia targets are demonstrated: 46 as main stops and Northern Cyprus as a related selection within Cyprus. Bahrain, Maldives and Singapore use labelled Natural Earth supplemental geographic views, giving 49 teaching stops. These generalized land polygons retain real geographic positions and relative scale; they may omit tiny islands, reefs, reclamation and causeways. Russia was a full stop in the Europe series; this edition briefly orients Asian Russia without repeating that lesson.\n\nCyprus, Palestine and Taiwan include brief contextual notes. Map targets do not settle political status, sovereignty, disputed boundaries or current territorial control. Türkiye is labelled Turkey by GeoClick.\n\n## Captions and upload\n\nEach play-no-subtitles.mp4 is a clean master with John’s English narration and no burned-in narration captions. The adjacent subtitles.en.srt and subtitles.en.vtt are optional English tracks; WebVTT requests top positioning. Preview caption positioning after YouTube processing. Lesson transcripts include the fact sources.\n\nAll map selections and sidebar layout checks passed. Audio decoded without clipping; caption parsing and switching off passed. Representative video frames, supplemental views and caption previews were visually inspected. Technical decoding and level checks do not constitute a listening review.\n');
files.push('README.md','series-manifest.json');
for(const name of['asia-small-countries.geojson','asia-small-countries.source.json','asia-small-countries.LICENSE.txt']){writeFileSync(join(root,name),readFileSync(join('src/lessons/data',name)));files.push(name);}
const zip=join(root,'all-seven-asia-videos.zip');execFileSync('tar.exe',['-a','-c','-f',zip,'-C',root,...files],{stdio:'inherit'});
console.log(reports.map(e=>`${e.episode}. ${e.region}: ${e.places.length} stops, ${stamp(e.durationSeconds)}`).join('\n'));console.log(zip);
