// Recording-only layout. The app's real fact card sits beside its real map.
// No GeoClick source files or earned progress are changed.
// Two layout variants exist; the lesson's `layout` field picks one and the
// fitting pass (bin/fit-lesson-layout.mjs) chooses it per map:
//   classic - the original US-pilot proportions, map 1160x638 low left.
//   tall    - the map rises to the top edge and grows to 1160x876, which
//             suits tall and maritime shapes that a wide box wastes.
// The card column is identical in both, so the card never covers the map
// and every layout assertion keeps working unchanged.
export const LAYOUT_BOXES = {
  classic: { left: 12, top: 250, width: 1160, height: 638 },
  tall: { left: 12, top: 12, width: 1160, height: 876 }
};

export async function lessonLayout(page, title, area = 'United States', layout = 'classic') {
  const box = LAYOUT_BOXES[layout] ?? LAYOUT_BOXES.classic;
  const headingTop = layout === 'tall' ? 20 : 115;
  await page.addStyleTag({ content: `
    body { margin:0!important; background:#f3efe5!important; overflow:hidden!important; }
    [data-map-fit-root] { position:absolute!important; left:${box.left}px!important; top:${box.top}px!important; width:${box.width}px!important; height:${box.height}px!important; }
    .nav-overlay { position:fixed!important; left:22px!important; top:96px!important; }
    .fact-card { position:fixed!important; left:1192px!important; right:auto!important; bottom:auto!important; width:390px!important; max-width:390px!important; padding:18px!important; }
    .fact-body { font-size:19px!important; line-height:1.5!important; }
    .fact-extra { margin-top:16px!important; }
    .fact-city { display:none!important; }
    .fact-name { display:block; font-size:26px!important; margin-bottom:12px!important; }
    .fact-name::after { content:''!important; }
    #lesson-heading {position:fixed;left:1200px;top:${headingTop}px;width:370px;font:26px/1.25 Georgia;color:#203b30;}
    #lesson-status {position:fixed;left:1200px;width:370px;font:17px/1.4 system-ui;color:#65563c;}
  ` });
  await page.evaluate(({title,area}) => {
    const heading=document.createElement('div');heading.id='lesson-heading';heading.textContent=title;document.body.append(heading);
    const status=document.createElement('div');status.id='lesson-status';status.textContent=`Known mode · ${area}`;document.body.append(status);
    window.dispatchEvent(new Event('resize'));
  }, {title,area});
  // Flow the right column: status sits under the title whatever its wrapped
  // height, and the card under the status, so a long title can never collide
  // with either. The column is clear of the map horizontally, so no check
  // changes.
  const placed = await page.evaluate(({headingTop}) => {
    const heading = document.getElementById('lesson-heading');
    const status = document.getElementById('lesson-status');
    const headingHeight = heading.getBoundingClientRect().height;
    const statusTop = headingTop + headingHeight + 12;
    status.style.top = `${statusTop}px`;
    const statusHeight = status.getBoundingClientRect().height;
    return { statusTop, cardTop: statusTop + statusHeight + 16 };
  }, {headingTop});
  await page.addStyleTag({ content: `
    .fact-card { top:${placed.cardTop}px!important; }
  ` });
  await page.waitForTimeout(1800);
}

export async function status(page, text) {
  await page.locator('#lesson-status').evaluate((el,text)=>el.textContent=text,text);
}

// Use MapLibre's public camera/projection methods for reproducible framing.
// Capture the existing map on a real zoom event, then restore the prototype.
export async function attachCamera(page, mapId = 'usa-states') {
  await page.evaluate(async(mapId)=>{
    const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/maplibre-gl\.mjs\?/.test(n));
    if(!url)throw Error('MapLibre module not found');
    const mod=await import(url);const MapClass=mod.Map ?? mod.default?.Map;
    window.__lessonMapClass=MapClass;
    window.__lessonOriginalFire=MapClass.prototype.fire;
    MapClass.prototype.fire=function(...args){if(this.getCanvas)window.__lessonMap=this;return window.__lessonOriginalFire.apply(this,args);};
    window.__lessonTargets=(await(await fetch(`/maps/${mapId}/map.json`)).json()).targets;
  },mapId);
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
    // A map target may carry local names with an English display name, which is
    // what the fact card shows; accept either form.
    const t=[...window.__lessonTargets,...(window.__lessonSupplementTargets??[])].find(t=>t.name===name||t.names?.en===name);if(!t)throw Error(`Unknown state ${name}`);
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
  // The camera animation runs for 1400 ms. A click projected at one instant
  // lands elsewhere if the camera is still moving, so wait well past it.
  await page.waitForTimeout(2600);
}

export async function verifyUncovered(page) {
  return page.evaluate(()=>{
    const map=(window.__lessonActiveMap??window.__lessonMap).getCanvas().getBoundingClientRect();
    const fact=document.querySelector('[data-testid="fact-card"]')?.getBoundingClientRect();
    if(fact && !(fact.left>=map.right || fact.right<=map.left || fact.bottom<=map.top || fact.top>=map.bottom))throw Error('Fact card overlaps map');
    return {map:{x:map.x,y:map.y,width:map.width,height:map.height},fact:fact?{x:fact.x,y:fact.y,width:fact.width,height:fact.height}:null};
  });
}
