import{readFileSync,writeFileSync,existsSync}from'node:fs';
import{resolve,join,relative}from'node:path';
import{execFileSync}from'node:child_process';
const ledgerPath='src/lessons/africa-coverage.json',ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/africa-eight-20261102'),files=[],reports=[];
const stamp=s=>{const n=Math.round(s);return`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
for(const[i,e]of ledger.episodes.entries()){
 const dir=resolve(e.video,'..'),r=JSON.parse(readFileSync(join(dir,'verification.json'),'utf8')),trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
 if(r.visualReview!=='passed')throw Error(`Visual review pending: ${e.id}`);
 if(JSON.stringify(r.states)!==JSON.stringify(e.places))throw Error(`Coverage mismatch: ${e.id}`);
 if(JSON.stringify((trace.relatedSelections??[]).map(t=>t.target))!==JSON.stringify(e.relatedTargets))throw Error(`Related selection mismatch: ${e.id}`);
 if(trace.turns.filter(t=>t.view==='supplemental').length!==e.supplemental.length)throw Error(`Supplement mismatch: ${e.id}`);
 for(const name of['play-no-subtitles.mp4','subtitles.en.srt','subtitles.en.vtt','lesson.md','lesson.json','verification.json']){const path=join(dir,name);if(!existsSync(path))throw Error(`Missing ${path}`);files.push(relative(root,path));}
 reports.push({episode:i+1,region:e.title,places:e.places,countries:e.countries,relatedTargets:e.relatedTargets,supplemental:e.supplemental,durationSeconds:r.durationSeconds,video:relative(root,resolve(e.video)).replaceAll('\\','/'),audioPeakDb:r.audioPeakDb});
}
const names=reports.flatMap(e=>e.places),native=ledger.episodes.flatMap(e=>[...e.nativeTargets,...e.relatedTargets]),countries=reports.flatMap(e=>e.countries);
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/africa-countries/map.json','utf8'));
if(names.length!==55||new Set(names).size!==55||countries.length!==54||new Set(countries).size!==54||native.length!==52||new Set(native).size!==52||catalog.targets.some(t=>!native.includes(t.name))||reports.flatMap(e=>e.supplemental).length!==4)throw Error('Invalid final coverage');
// Commit completion only after every episode has passed all gates.
for(const[i,e]of ledger.episodes.entries()){e.status='complete';e.covered=e.places;e.durationSeconds=reports[i].durationSeconds;}
ledger.status='complete';ledger.coveredPlaceCount=55;ledger.coveredCountryCount=54;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
writeFileSync(join(root,'series-manifest.json'),JSON.stringify({edition:ledger.edition,scope:ledger.scope,episodes:reports},null,2)+'\n');
writeFileSync(join(root,'README.md'),'# Africa: eight regional geography lessons\n\nEnglish narration by John, with location cues, interesting facts and memory hooks. Fifty-four countries occur exactly once, plus Western Sahara as a separate disputed-territory stop. Somaliland is a related selection within Somalia.\n\n'+reports.map(e=>`## ${e.episode}. ${e.region} (${e.places.length} stops, ${stamp(e.durationSeconds)})\n\n[Play video](${e.video})\n\n${e.places.join(', ')}.\n\n${e.supplemental.length?'Labelled supplemental maps: '+e.supplemental.join(', ')+'.':'Native GeoClick selections.'}\n`).join('\n')+'\n## Scope and delivery\n\nAll 52 native Africa targets are demonstrated, including Western Sahara and the related Somaliland selection. São Tomé and Príncipe, Comoros, Mauritius and Seychelles use labelled Natural Earth land polygons at actual geographic positions and relative scale. These generalized views may omit tiny islands and reefs. Episode groups are teaching routes, not an official regional classification. Disputed boundaries and map targets do not settle political status or control.\n\nClean 1600×900 H.264/AAC masters have no burned-in narration captions. Adjacent English SRT and top-positioned WebVTT are optional tracks. Transcripts contain fact sources. UI checks, audio decoding/levels, caption loading/toggling and representative visual reviews passed. Technical checks do not constitute a listening review. No YouTube uploads are implied by this package.\n');
files.push('README.md','series-manifest.json');
for(const name of['africa-islands.geojson','africa-islands.source.json','africa-islands.LICENSE.txt']){writeFileSync(join(root,name),readFileSync(join('src/lessons/data',name)));files.push(name);}
const zip=join(root,'all-eight-africa-videos.zip');execFileSync('tar.exe',['-a','-c','-f',zip,'-C',root,...files],{stdio:'inherit'});
console.log(reports.map(e=>`${e.episode}. ${e.region}: ${e.places.length} stops, ${stamp(e.durationSeconds)}`).join('\n'));console.log(zip);
