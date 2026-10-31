// Recording-only layout. The app's real fact card sits beside its real map.
// No GeoClick source files or earned progress are changed.
export async function lessonLayout(page, title) {
  await page.addStyleTag({ content: `
    body { margin:0!important; background:#f3efe5!important; overflow:hidden!important; }
    [data-map-fit-root] { position:absolute!important; left:12px!important; top:250px!important; width:1160px!important; height:638px!important; }
    .nav-overlay { position:fixed!important; left:22px!important; top:96px!important; }
    .fact-card { position:fixed!important; left:1192px!important; top:280px!important; right:auto!important; bottom:auto!important; width:390px!important; max-width:390px!important; padding:18px!important; }
    .fact-body { font-size:19px!important; line-height:1.5!important; }
    .fact-extra { margin-top:16px!important; }
    .fact-city { display:none!important; }
    .fact-name { display:block; font-size:26px!important; margin-bottom:12px!important; }
    .fact-name::after { content:''!important; }
    #lesson-heading {position:fixed;left:1200px;top:115px;width:370px;font:26px/1.25 Georgia;color:#203b30;}
    #lesson-status {position:fixed;left:1200px;top:215px;width:370px;font:17px/1.4 system-ui;color:#65563c;}
  ` });
  await page.evaluate(title => {
    const heading=document.createElement('div');heading.id='lesson-heading';heading.textContent=title;document.body.append(heading);
    const status=document.createElement('div');status.id='lesson-status';status.textContent='Known mode · United States';document.body.append(status);
    window.dispatchEvent(new Event('resize'));
  }, title);
  await page.waitForTimeout(1800);
}

export async function status(page, text) {
  await page.locator('#lesson-status').evaluate((el,text)=>el.textContent=text,text);
}

// Use MapLibre's public camera/projection methods for reproducible framing.
// Capture the existing map on a real zoom event, then restore the prototype.
export async function attachCamera(page) {
  await page.evaluate(async()=>{
    const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/maplibre-gl\.mjs\?/.test(n));
    if(!url)throw Error('MapLibre module not found');
    const mod=await import(url);const MapClass=mod.Map ?? mod.default?.Map;
    window.__lessonMapClass=MapClass;
    window.__lessonOriginalFire=MapClass.prototype.fire;
    MapClass.prototype.fire=function(...args){if(this.getCanvas)window.__lessonMap=this;return window.__lessonOriginalFire.apply(this,args);};
    window.__lessonTargets=(await(await fetch('/maps/usa-states/map.json')).json()).targets;
  });
  try {
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    await page.waitForTimeout(800);
    await page.evaluate(()=>{if(!window.__lessonMap)throw Error('Could not attach public map camera');});
  } finally {
    await page.evaluate(()=>{window.__lessonMapClass.prototype.fire=window.__lessonOriginalFire;});
  }
}

export async function statePoint(page,name,location) {
  return page.evaluate(({name,location})=>{
    const t=[...window.__lessonTargets,...(window.__lessonSupplementTargets??[])].find(t=>t.name===name);if(!t)throw Error(`Unknown state ${name}`);
    const map=window.__lessonActiveMap??window.__lessonMap;
    const p=map.project(location ?? t.centroid);const r=map.getCanvas().getBoundingClientRect();
    return [p.x+r.left,p.y+r.top];
  },{name,location});
}

export async function gesture(page, action) {
  if(action.view)await page.evaluate(view=>window.__lessonUseView(view),action.view);
  if(action.bounds) {
    await page.evaluate(bounds=>(window.__lessonActiveMap??window.__lessonMap).fitBounds(bounds,{padding:55,duration:1400}),action.bounds);
  }
  if(action.drag){
    await page.mouse.move(...action.drag[0]);await page.mouse.down();
    await page.mouse.move(...action.drag[1],{steps:35});await page.mouse.up();
  }
  if(action.wheel){await page.mouse.move(...action.wheel.point);await page.mouse.wheel(0,action.wheel.delta);}
  await page.waitForTimeout(1800);
}

export async function verifyUncovered(page) {
  return page.evaluate(()=>{
    const map=(window.__lessonActiveMap??window.__lessonMap).getCanvas().getBoundingClientRect();
    const fact=document.querySelector('[data-testid="fact-card"]')?.getBoundingClientRect();
    if(fact && !(fact.left>=map.right || fact.right<=map.left || fact.bottom<=map.top || fact.top>=map.bottom))throw Error('Fact card overlaps map');
    return {map:{x:map.x,y:map.y,width:map.width,height:map.height},fact:fact?{x:fact.x,y:fact.y,width:fact.width,height:fact.height}:null};
  });
}
