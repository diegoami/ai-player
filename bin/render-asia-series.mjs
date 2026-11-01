import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{spawn}from'node:child_process';
import{resolve,join}from'node:path';
const ledgerPath='src/lessons/asia-coverage.json',ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/asia-seven-20261101');mkdirSync(root,{recursive:true});
const run=(script,args,label)=>new Promise((res,rej)=>{
 console.log(`START ${label}`);const p=spawn(process.execPath,[script,...args],{stdio:['ignore','pipe','pipe']});let log='';
 const capture=data=>{const s=data.toString();log+=s;process.stdout.write(`[${label}] ${s}`);};p.stdout.on('data',capture);p.stderr.on('data',capture);p.on('error',rej);p.on('exit',code=>{writeFileSync(join(root,`${label}.log`),log);code===0?res():rej(Error(`${label} exited ${code}`));});
});
const argsFor=(e,i,inspect=false)=>['--game=geoclick','--base=http://127.0.0.1:5188',`--lesson=${e.lesson}`,`--out=${inspect?join(root,'preflight',`0${i+1}-${e.id}`):resolve(e.video,'../..')}`,'--voice=moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678',...(inspect?['--inspect']:e.audioCache?[`--audio-cache=${e.audioCache}`]:[])];
const checkedContent=l=>JSON.stringify({mapId:l.mapId,supplement:l.supplement,states:l.states.map(({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections})=>({name,location,view,rotateExtra,factContains,lines,gestures,relatedSelections}))});
if(process.argv.includes('--prepare-only')){
 let next=0;await Promise.all([0,1,2].map(async()=>{while(next<ledger.episodes.length){const i=next++,e=ledger.episodes[i];await run('bin/geoclick-lesson.mjs',[...argsFor(e,i),'--prepare-only'],`audio-${e.id}`);}}));process.exit(0);
}
for(const[i,e]of ledger.episodes.entries()){
 const folder=join(root,'preflight',`0${i+1}-${e.id}`,'geoclick'),proof=join(folder,'trace.json'),script=join(folder,'lesson.json');
 if(!existsSync(proof)||!existsSync(script)||!JSON.parse(readFileSync(proof)).result?.completedPilot||checkedContent(JSON.parse(readFileSync(script)))!==checkedContent(JSON.parse(readFileSync(e.lesson))))await run('bin/geoclick-lesson.mjs',argsFor(e,i,true),`preflight-${e.id}`);
 if(!['complete','media-verified-awaiting-visual-review'].includes(e.status))e.status='preflight-passed';writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}
if(process.argv.includes('--inspect')){console.log('ALL SEVEN ASIA PREFLIGHTS PASSED');process.exit(0);}
let next=0;
async function worker(){while(next<ledger.episodes.length){
 const i=next++,e=ledger.episodes[i],dir=resolve(e.video,'..'),proof=join(dir,'trace.json');
 if(!existsSync(e.video)||!existsSync(proof)||!JSON.parse(readFileSync(proof)).result?.completedPilot)await run('bin/geoclick-lesson.mjs',argsFor(e,i),`record-${e.id}`);
 const report=join(dir,'verification.json');if(!existsSync(report))await run('bin/verify-lesson-video.mjs',[`--dir=${dir}`],`verify-${e.id}`);
 e.status='media-verified-awaiting-visual-review';e.durationSeconds=JSON.parse(readFileSync(report)).durationSeconds;writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}}
const workers=Number(process.argv.find(a=>a.startsWith('--workers='))?.slice(10)??3);
if(!Number.isInteger(workers)||workers<1||workers>3)throw Error('Use one to three recording workers');
await Promise.all(Array.from({length:workers},()=>worker()));console.log('ALL SEVEN ASIA EXPORTS MEDIA-VERIFIED; visual review remains');
