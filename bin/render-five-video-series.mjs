import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve,join} from 'node:path';
const ledgerPath='src/lessons/usa-five-video-coverage.json';
const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const root=resolve('rendered/usa-five-20261101');mkdirSync(root,{recursive:true});
const run=(script,args,label)=>new Promise((res,rej)=>{
 console.log(`START ${label}`);const p=spawn(process.execPath,[script,...args],{stdio:['ignore','pipe','pipe']});
 let log='';const capture=data=>{const s=data.toString();log+=s;process.stdout.write(`[${label}] ${s}`);};p.stdout.on('data',capture);p.stderr.on('data',capture);
 p.on('error',rej);p.on('exit',code=>{writeFileSync(join(root,`${label}.log`),log);code===0?res():rej(Error(`${label} exited ${code}`));});
});
const argsFor=(e,i,inspect=false)=>['--game=geoclick','--base=http://127.0.0.1:5188',`--lesson=${e.lesson}`,`--out=${inspect?join(root,'preflight',`0${i+1}-${e.id}`):join(root,`0${i+1}-${e.id}`)}`,'--review','--voice=moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678',...(inspect?['--inspect']:['--audio-cache=rendered/john-northeast-pilot-20261101/geoclick'])];
for(const [i,e] of ledger.episodes.entries()){
 const proof=join(root,'preflight',`0${i+1}-${e.id}`,'geoclick','trace.json');
 if(!existsSync(proof)||!JSON.parse(readFileSync(proof)).result?.completedPilot)await run('bin/geoclick-lesson.mjs',argsFor(e,i,true),`preflight-${e.id}`);
 e.status='preflight-passed';writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}
let next=0;
async function worker(){
 while(next<ledger.episodes.length){
  const i=next++,e=ledger.episodes[i],dir=resolve(e.video,'..');
  if(!existsSync(e.video))await run('bin/geoclick-lesson.mjs',argsFor(e,i),`record-${e.id}`);
  await run('bin/verify-lesson-video.mjs',[`--dir=${dir}`],`verify-${e.id}`);
  e.status='media-verified-awaiting-visual-review';e.durationSeconds=JSON.parse(readFileSync(join(dir,'verification.json'))).durationSeconds;
  writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
 }
}
await Promise.all([worker(),worker()]);
console.log('ALL FIVE VIDEOS EXPORTED AND MEDIA-VERIFIED; visual contact sheets await inspection.');
