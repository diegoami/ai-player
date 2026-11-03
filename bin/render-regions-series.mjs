import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{spawn}from'node:child_process';
import{resolve,join}from'node:path';

const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const config=JSON.parse(readFileSync('src/lessons/regions-series.json','utf8'));
const country=config.countries.find(c=>c.id===(args.country??config.countries[0].id));
if(!country)throw Error(`Unknown country ${args.country}`);
const ledgerPath=`src/lessons/${country.id}-coverage.json`,ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve(country.root);mkdirSync(root,{recursive:true});
const base='http://localhost:5187';
const run=(script,argv,label)=>new Promise((res,rej)=>{
 console.log(`START ${label}`);const p=spawn(process.execPath,[script,...argv],{stdio:['ignore','pipe','pipe']});let log='';
 const capture=data=>{const s=data.toString();log+=s;process.stdout.write(`[${label}] ${s}`);};p.stdout.on('data',capture);p.stderr.on('data',capture);p.on('error',rej);p.on('exit',code=>{writeFileSync(join(root,`${label}.log`),log);code===0?res():rej(Error(`${label} exited ${code}`));});
});
const argsFor=(e,inspect=false)=>['--game=geoclick',`--base=${base}`,`--lesson=${e.lesson}`,`--out=${inspect?join(root,'preflight'):resolve(e.video,'../..')}`,'--voice=moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678',...(inspect?['--inspect']:[])];
const checkedContent=l=>JSON.stringify({mapId:l.mapId,supplement:l.supplement,states:l.states.map(({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections})=>({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections}))});
const episode=ledger.episodes[0];
if(process.argv.includes('--prepare-only')){await run('bin/geoclick-lesson.mjs',[...argsFor(episode),'--prepare-only'],`audio-${episode.id}`);process.exit(0);}
{
 const folder=join(root,'preflight','geoclick'),proof=join(folder,'trace.json'),script=join(folder,'lesson.json');
 if(!existsSync(proof)||!existsSync(script)||!JSON.parse(readFileSync(proof)).result?.completedPilot||checkedContent(JSON.parse(readFileSync(script)))!==checkedContent(JSON.parse(readFileSync(episode.lesson))))await run('bin/geoclick-lesson.mjs',argsFor(episode,true),`preflight-${episode.id}`);
 if(!['complete','media-verified-awaiting-visual-review'].includes(episode.status))episode.status='preflight-passed';writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}
if(process.argv.includes('--inspect')){console.log(`PREFLIGHT PASSED: ${country.title}`);process.exit(0);}
{
 const dir=resolve(episode.video,'..'),proof=join(dir,'trace.json');
 if(existsSync(episode.video)&&existsSync(proof)&&JSON.parse(readFileSync(proof)).result?.completedPilot&&checkedContent(JSON.parse(readFileSync(join(dir,'lesson.json'))))!==checkedContent(JSON.parse(readFileSync(episode.lesson))))throw Error(`Approved recording inputs changed: choose a new export path for ${episode.id}`);
 if(!existsSync(episode.video)||!existsSync(proof)||!JSON.parse(readFileSync(proof)).result?.completedPilot)await run('bin/geoclick-lesson.mjs',argsFor(episode),`record-${episode.id}`);
 const report=join(dir,'verification.json');if(!existsSync(report))await run('bin/verify-lesson-video.mjs',[`--dir=${dir}`],`verify-${episode.id}`);
 if(episode.status!=='complete')episode.status='media-verified-awaiting-visual-review';episode.durationSeconds=JSON.parse(readFileSync(report)).durationSeconds;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}
console.log(`${country.title.toUpperCase()} EXPORT MEDIA-VERIFIED; visual review remains`);
