import{readFileSync,writeFileSync,existsSync}from'node:fs';
import{resolve,join,relative}from'node:path';
import{execFileSync}from'node:child_process';

const ledgerPath='src/lessons/north-america-capitals-coverage.json',ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/north-america-capitals-20261102'),files=[],reports=[];
const stamp=s=>{const n=Math.round(s);return`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
for(const[i,e]of ledger.episodes.entries()){
 const dir=resolve(e.video,'..'),r=JSON.parse(readFileSync(join(dir,'verification.json'),'utf8')),trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
 if(r.visualReview!=='passed')throw Error(`Visual review pending: ${e.id}`);
 if(JSON.stringify(r.states)!==JSON.stringify(e.places))throw Error(`Coverage mismatch: ${e.id}`);
 if(JSON.stringify((trace.relatedSelections??[]).map(t=>t.target))!==JSON.stringify(e.relatedTargets))throw Error(`Related selection mismatch: ${e.id}`);
 if(trace.turns.filter(t=>t.view==='supplemental').length!==e.supplemental.length)throw Error(`Supplement mismatch: ${e.id}`);
 for(const name of['play-no-subtitles.mp4','subtitles.en.srt','subtitles.en.vtt','lesson.md','lesson.json','verification.json']){const path=join(dir,name);if(!existsSync(path))throw Error(`Missing ${path}`);files.push(relative(root,path));}
 reports.push({episode:i+1,region:e.title,places:e.places,countries:e.countries,relatedTargets:e.relatedTargets,supplemental:e.supplemental,durationSeconds:r.durationSeconds,video:relative(root,resolve(e.video)).replaceAll('\\','/'),audioPeakDb:r.audioPeakDb,captions:r.optionalCaptions.cues});
}
const names=reports.flatMap(e=>e.places),native=ledger.episodes.flatMap(e=>[...e.nativeTargets,...e.relatedTargets]),countries=reports.flatMap(e=>e.countries);
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/north-america-capitals/map.json','utf8'));
const covered=t=>native.includes(t.name)||(t.names?.en&&native.includes(t.names.en));
if(names.length!==23||new Set(names).size!==23||countries.length!==23||new Set(countries).size!==23||native.length!==23||new Set(native).size!==23||catalog.targets.some(t=>!covered(t)))throw Error('Invalid final coverage');
// Commit completion only after every episode has passed all gates.
for(const[i,e]of ledger.episodes.entries()){e.status='complete';e.covered=e.places;e.durationSeconds=reports[i].durationSeconds;}
ledger.status='complete';ledger.coveredPlaceCount=23;ledger.coveredCountryCount=23;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
writeFileSync(join(root,'series-manifest.json'),JSON.stringify({edition:ledger.edition,scope:ledger.scope,episodes:reports},null,2)+'\n');
writeFileSync(join(root,'README.md'),'# The capitals of North America: five regional geography lessons\n\nEnglish narration by John, with location cues, interesting facts and memory hooks. All 23 capital targets of GeoClick\'s native North America capitals map occur exactly once: the capitals of Canada, the United States, Mexico, Central America and the Caribbean that the map names. The fact card shows the English display name, so Mexico City is taught as Mexico City.\n\n'+reports.map(e=>`## ${e.episode}. ${e.region} (${e.places.length} stops, ${stamp(e.durationSeconds)})\n\n[Play video](${e.video})\n\n${e.places.join(', ')}.\n\nNative GeoClick selections; no supplemental maps were needed.\n`).join('\n')+'\n## Scope and delivery\n\nEvery one of the 23 native North America capital targets is demonstrated by a real map click, with the city name on the card. Episode groups are teaching routes, not an official classification.\n\nClean 1600×900 H.264/AAC masters have no burned-in narration captions. Adjacent English SRT and top-positioned WebVTT are optional tracks. Transcripts contain fact sources. UI checks, audio decoding/levels, caption loading/toggling and representative visual reviews passed. Technical checks do not constitute a listening review. No YouTube uploads are implied by this package.\n');
files.push('README.md','series-manifest.json');
const zip=join(root,'all-five-north-america-capitals-videos.zip');
// tar reads a drive letter as a remote host unless the paths are local-style.
execFileSync('tar.exe',['--force-local','-a','-c','-f',zip.replaceAll('\\','/'),'-C',root.replaceAll('\\','/'),...files.map(f=>f.replaceAll('\\','/'))],{stdio:'inherit'});
console.log(reports.map(e=>`${e.episode}. ${e.region}: ${e.places.length} stops, ${stamp(e.durationSeconds)}`).join('\n'));console.log(zip);
