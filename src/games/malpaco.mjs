// Public UI adapter: reads the manual and Countries inspector, then uses normal controls.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const YOU = 'seat1';
const country = (page, id) => page.locator(`g.country[data-id="${id}"]`);
export default {
 name: 'malpaco',
 summary: 'Play Malpaco using its manual and public country inspector',
 url: process.env.MALPACO_URL ?? 'http://localhost:5173/',
 competent: true,
 playerDescription: 'You control Blue (seat1). Blue gaining countries or armies is good for you. Orange, Green, and Purple are your opponents.',
 async setup(ctx) {
  const {page, base} = ctx;
  const manualUrl = new URL('/manual/index.html', base).href;
  await page.goto(manualUrl, {waitUntil:'networkidle'});
  ctx.manual = await page.locator('main').innerText();
  if (!ctx.manual.includes('Attack one exchange')) throw new Error('Player manual did not load');
  writeFileSync(join(ctx.cfg.dir, 'manual.txt'), ctx.manual);
  ctx.manualUrl = manualUrl;
  await sleep(1800);
  await page.goto(base, {waitUntil:'networkidle'});
  await page.click('#start-game');
  await page.waitForFunction(() => Number(document.querySelector('#placement-pool-count')?.textContent) > 0, null, {timeout:60000});
  ctx.state = {graph:{}, islands:{}, recent:[], humanTurns:0};
  // Inspect the public map once; geography stays fixed throughout the match.
  await page.click('#open-countries');
  await page.click('[data-key="filter:false"]');
  const ids = await page.locator('g.country').evaluateAll(es=>es.map(e=>e.dataset.id));
  for (const id of ids) {
   await page.click('[data-key="filter:false"]');
   await page.locator(`[data-key="inspect:${id}"]`).click();
   ctx.state.graph[id] = await page.locator('.country-neighbours button').evaluateAll(es=>es.map(e=>e.dataset.key.replace('inspect:','')));
   ctx.state.islands[id] = await page.locator('.country-facts dd').last().innerText();
   await page.click('[data-key="back"]');
  }
  await page.click('#close-game-drawer');
  await page.click('#map-fit');
  ctx.state.initial = await this.score(ctx);
  writeFileSync(join(ctx.cfg.dir,'map.json'), JSON.stringify({neighbours:ctx.state.graph,islands:ctx.state.islands},null,2));
 },
 async regions(page) {
  return page.locator('g.country').evaluateAll(es=>es.map(e=>{
   const label=e.querySelector('.army-count')??e;const b=label.getBoundingClientRect();
   return {id:e.dataset.id,name:e.querySelector('.name')?.textContent,owner:e.dataset.owner,armies:Number(e.dataset.armies),at:{x:b.x+b.width/2,y:b.y+b.height/2}};
  }));
 },
 async guidance(page) {
  return page.evaluate(()=>({phase:document.querySelector('#turn-phase')?.textContent?.trim()??'', instruction:document.querySelector('#turn-instruction')?.textContent?.trim()??'', pool:Number(document.querySelector('#placement-pool-count')?.textContent??0), current:document.querySelector('#turn-tracker [data-current="true"]')?.dataset.turnPlayer??null}));
 },
 async score(ctx) {
  const regions=await this.regions(ctx.page);const seats={};
  for(const r of regions){const s=seats[r.owner]??={countries:0,armies:0};s.countries++;s.armies+=r.armies;}
  return seats;
 },
 async observe(ctx) {
  const {page,state}=ctx;const g=await this.guidance(page);
  if(await page.locator('.victory-result').isVisible()){ctx.result=await page.locator('.victory-result').innerText();return {done:true};}
  if(g.current!==YOU){await sleep(900);return {waiting:true,actions:[]};}
  const regions=await this.regions(page);const byId=Object.fromEntries(regions.map(r=>[r.id,r]));
  const mine=regions.filter(r=>r.owner===YOU);
  const neighbours=r=>(state.graph[r.id]??[]).map(id=>byId[id]);
  const situation=regions.map(r=>`${r.name}: ${r.owner}, ${r.armies} armies; ${state.islands[r.id]}; neighbours ${neighbours(r).map(n=>`${n.name} (${n.owner},${n.armies})`).join(', ')}`).join('\n');
  const prompt=`You are Blue (seat1), playing competently to win. ${g.phase}. ${g.instruction}\n`+
   `Read manual:\n${ctx.manual}\n\nPublic map:\n${situation}\nRecent results: ${state.recent.slice(-6).join(' | ')}\n`+
   'Concentrate reinforcements to secure small islands and earn their recurring bonuses. Defender wins ties: each exchange wins with probability 15/36 and loses with probability 21/36. Two armies versus one defender wins only 42% overall, and is NOT favourable. Only attacks with at least twice the defending armies plus one are offered. One capture per turn earns a card. Preserve useful stacks and end the turn when further attacks are poor. Use only the offered actions. An attack action fights exchanges until capture or the stated safety stop; a capture is confirmed separately. A captured country does not complete an island unless ALL countries on that island are now yours.';
  if(await page.locator('#confirm-capture-button').isVisible()){
   const input=page.locator('#capture-amount');const min=Number(await input.getAttribute('min')),max=Number(await input.getAttribute('max'));
   return {prompt,actions:[...new Set([max,min,Math.max(min,Math.floor(max/2))])].map(n=>({id:`capture:${n}`,label:`confirm ${n} armies into the captured country`,payload:{amount:n}}))};
  }
  // Required card decisions are exposed as labelled buttons in the open card.
  const cardActions=await page.locator('.card-choice-controls button').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width&&!e.disabled).map(e=>({key:e.dataset.key,id:e.id,label:e.getAttribute('aria-label')||e.textContent.trim()})));
  if(cardActions.length)return {prompt,actions:cardActions.map((b,i)=>({id:`card:${i}`,label:b.label,payload:b}))};
  if(g.pool>0&&/place|reinforc/i.test(`${g.phase} ${g.instruction}`))return {prompt,actions:mine.map(r=>({id:`reinforce:${r.id}`,label:`place all ${g.pool} reinforcements in ${r.name}`,hint:`${r.armies} armies; ${state.islands[r.id]}; enemies: ${neighbours(r).filter(n=>n.owner!==YOU).map(n=>`${n.name} ${n.armies}`).join(', ')||'none'}`,at:r.at,payload:{...r,pool:g.pool}}))};
  if(await page.locator('#end-turn-button').isVisible()){
   const actions=[];
   for(const r of mine.filter(r=>r.armies>=3))for(const target of neighbours(r).filter(n=>n.owner!==YOU && r.armies>=2*n.armies+1))actions.push({id:`attack:${r.id}:${target.id}`,label:`attack ${target.name} from ${r.name}`,hint:`${r.armies} vs ${target.armies}; stop if attacking stack falls below twice the remaining defenders plus one`,at:target.at,payload:{source:r.id,target:target.id}});
   actions.push({id:'end-turn',label:'end turn, retain armies and collect a card if a country was captured'});
   return {prompt,actions};
  }
  throw new Error(`Unrecognised human phase: ${JSON.stringify(g)}`);
 },
 async perform(ctx, action) {
  const {page}=ctx;ctx.state.before=await this.score(ctx);ctx.state.battle='';
  if(action.id.startsWith('reinforce:')){
   for(let n=0;n<action.payload.pool;n++){await country(page,action.payload.id).press('Enter');await sleep(100);}
   const g=await this.guidance(page);if(g.pool!==0)throw new Error(`Reinforcement did not finish: ${g.pool} left`);
  }else if(action.id.startsWith('attack:')){
   const {source,target}=action.payload;
   await country(page,source).press('Shift+Enter');await country(page,target).press('Shift+Enter');
   let exchanges=0;
   while(exchanges<40){
    const rs=await this.regions(page);const a=rs.find(r=>r.id===source),d=rs.find(r=>r.id===target);
    if(d.owner===YOU||a.armies<2||(exchanges>0&&a.armies<2*d.armies+1))break;
    const button=page.locator('#province-action-button');
    if(!(await button.isVisible())||await button.getAttribute('aria-label')!=='Attack')throw new Error('Attack control unavailable for offered route');
    await button.click();await sleep(450);exchanges++;
   }
   ctx.state.battle=`Fought ${exchanges} exchanges. `+(await page.locator('#battle-status').textContent().catch(()=>''));
  }else if(action.id.startsWith('capture:')){
   await page.locator('#capture-amount').fill(String(action.payload.amount));await page.click('#confirm-capture-button');
  }else if(action.id==='end-turn'){
   await page.click('#end-turn-button');ctx.state.humanTurns++;
  }else if(action.id.startsWith('card:')){
   const b=action.payload;
   if(b.id)await page.locator(`[id="${b.id}"]`).click();
   else if(b.key)await page.locator(`.card-choice-controls [data-key="${b.key}"]`).click();
   else await page.locator('.card-choice-controls').getByRole('button',{name:b.label,exact:true}).click();
  }
  await sleep(350);
 },
 async outcome(ctx,action){
  const score=await this.score(ctx);const detail=`${action.label}. ${ctx.state.battle} Blue now has ${score[YOU]?.countries??0} countries and ${score[YOU]?.armies??0} armies.`;
  ctx.state.recent.push(detail);return {detail,before:ctx.state.before,after:score,humanTurns:ctx.state.humanTurns};
 }
};
