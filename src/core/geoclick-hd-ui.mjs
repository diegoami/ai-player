export const HD_VIEWPORT={width:1920,height:1080};

export async function hdLayout(page,framing,names){
  await page.addStyleTag({content:`
    body{margin:0!important;background:#f3efe5!important;overflow:hidden!important}
    [data-map-fit-root]{position:absolute!important;left:12px!important;top:12px!important;width:1380px!important;height:1056px!important}
    .fact-card{position:fixed!important;left:1420px!important;right:auto!important;top:245px!important;bottom:auto!important;width:470px!important;max-width:470px!important;padding:22px!important;margin:0!important}
    .fact-body{font-size:22px!important;line-height:1.5!important;max-height:none!important;overflow:visible!important}
    .fact-name{display:block!important;font-size:30px!important;margin-bottom:16px!important}
    .fact-name::after{content:''!important}.fact-city{display:none!important}
    #lesson-series{position:fixed;left:1432px;top:44px;width:450px;font:20px/1.4 system-ui;color:#65563c}
    #lesson-heading{position:fixed;left:1432px;top:90px;width:450px;font:42px/1.2 Georgia;color:#203b30}
    #lesson-status{position:fixed;left:1432px;top:175px;width:450px;font:22px/1.4 system-ui;color:#65563c}
    #lesson-route{position:fixed;left:1432px;top:270px;width:440px;font:25px/1.8 Georgia;color:#203b30;white-space:pre-line}
  `});
  await page.evaluate(({framing,names})=>{
    for(const [id,text] of [['lesson-series',framing.subtitle],['lesson-heading',framing.title],['lesson-status',`${names.length} states · A fresh map`],['lesson-route',names.join('\n')]]){
      const el=document.createElement('div');el.id=id;el.textContent=text;document.body.append(el);
    }
    window.dispatchEvent(new Event('resize'));
  },{framing,names});
  await page.waitForTimeout(1200);
}

export async function hdFit(page,bounds,animate=true){
  await page.evaluate(({bounds,animate})=>window.__lessonMap.fitBounds(bounds,{padding:{top:65,bottom:65,left:65,right:65},duration:animate?1600:0}),{bounds,animate});
  await page.waitForTimeout(animate?1900:250);
}

export async function verifyHdFrame(page,name){
  return page.evaluate(name=>{
    const rect=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}};
    const map=window.__lessonMap,box=rect(map.getCanvas());
    const target=window.__lessonTargets.find(t=>t.name===name||t.names?.en===name);
    const [w,s,e,n]=target.bbox;
    const corners=[[w,s],[w,n],[e,s],[e,n]].map(p=>map.project(p));
    const margins={left:Math.min(...corners.map(p=>p.x)),right:box.width-Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:box.height-Math.max(...corners.map(p=>p.y))};
    if(Math.min(...Object.values(margins))<25)throw Error(`${name} boundary clipped: ${JSON.stringify(margins)}`);
    const card=document.querySelector('[data-testid="fact-card"]');
    const fact=card?rect(card):null;
    for(const selector of ['#lesson-heading','#lesson-status','[data-testid="fact-card"]']){
      const el=document.querySelector(selector);if(!el)continue;const r=rect(el);
      if(r.x<0||r.y<0||r.x+r.width>innerWidth||r.y+r.height>innerHeight)throw Error(`Clipped element: ${selector}`);
      if(r.x<box.x+box.width)throw Error(`Map overlap: ${selector}`);
    }
    const body=card?.querySelector('.fact-body');
    if(body&&body.scrollHeight>body.clientHeight+2)throw Error('Fact text has hidden overflow');
    return {map:box,fact,targetBounds:target.bbox,targetMargins:margins,textFullyVisible:true};
  },name);
}
