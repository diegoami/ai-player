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
const argsFor=(e,i,inspect=false)=>['--game=geoclick',`--base=${base}`,`--lesson=${e.lesson}`,`--out=${inspect?join(root,'preflight',`${String(i+1).padStart(2,'0')}-${e.id}`):resolve(e.video,'../..')}`,'--voice=moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678',...(inspect?['--inspect']:[])];
const checkedContent=l=>JSON.stringify({mapId:l.mapId,supplement:l.supplement,states:l.states.map(({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections})=>({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections}))});
const episodes=ledger.episodes;
if(process.argv.includes('--prepare-only')){
 let next=0;await Promise.all([0,1].map(async()=>{while(next<episodes.length){const i=next++,e=episodes[i];await run('bin/geoclick-lesson.mjs',[...argsFor(e,i),'--prepare-only'],`audio-${e.id}`);}}));process.exit(0);
}
const workers=Number(process.argv.find(a=>a.startsWith('--workers='))?.slice(10)??2);
if(!Number.isInteger(workers)||workers<1||workers>3)throw Error('Use one to three recording workers');
let preflightNext=0;
await Promise.all(Array.from({length:workers},async()=>{while(preflightNext<episodes.length){
 const i=preflightNext++,e=episodes[i];
 const folder=join(root,'preflight',`${String(i+1).padStart(2,'0')}-${e.id}`,'geoclick'),proof=join(folder,'trace.json'),script=join(folder,'lesson.json');
 if(!existsSync(proof)||!existsSync(script)||!JSON.parse(readFileSync(proof)).result?.completedPilot||checkedContent(JSON.parse(readFileSync(script)))!==checkedContent(JSON.parse(readFileSync(e.lesson))))await run('bin/geoclick-lesson.mjs',argsFor(e,i,true),`preflight-${e.id}`);
 if(!['complete','media-verified-awaiting-visual-review'].includes(e.status))e.status='preflight-passed';writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}}));
if(process.argv.includes('--inspect')){console.log(`PREFLIGHTS PASSED: ${country.title}`);process.exit(0);}
let next=0;
async function worker(){while(next<episodes.length){
 const i=next++,e=episodes[i],dir=resolve(e.video,'..'),proof=join(dir,'trace.json');
 if(existsSync(e.video)&&existsSync(proof)&&JSON.parse(readFileSync(proof)).result?.completedPilot&&checkedContent(JSON.parse(readFileSync(join(dir,'lesson.json'))))!==checkedContent(JSON.parse(readFileSync(e.lesson))))throw Error(`Approved recording inputs changed: choose a new export path for ${e.id}`);
 if(!existsSync(e.video)||!existsSync(proof)||!JSON.parse(readFileSync(proof)).result?.completedPilot)await run('bin/geoclick-lesson.mjs',argsFor(e,i),`record-${e.id}`);
 const report=join(dir,'verification.json');if(!existsSync(report))await run('bin/verify-lesson-video.mjs',[`--dir=${dir}`],`verify-${e.id}`);
 if(e.status!=='complete')e.status='media-verified-awaiting-visual-review';e.durationSeconds=JSON.parse(readFileSync(report)).durationSeconds;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}}
await Promise.all(Array.from({length:workers},()=>worker()));console.log(`${country.title.toUpperCase()} EXPORTS MEDIA-VERIFIED; visual review remains`);
