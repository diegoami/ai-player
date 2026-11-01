// Clearly labelled supplemental geography for states absent from GeoClick.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export async function installSupplement(page,lesson) {
 const data=JSON.parse(readFileSync(resolve(lesson.supplement.data),'utf8'));
 const states=lesson.states.filter(s=>s.view==='supplemental');
 await page.evaluate(async({data,states,westernNames,contextLabels,islandContext,mapCredit,mapAttribution})=>{
  const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/maplibre-gl\.mjs\?/.test(n));
  const mod=await import(url);const lib=mod.default??mod;
  const MapClass=mod.Map??lib.Map,Popup=mod.Popup??lib.Popup,Navigation=mod.NavigationControl??lib.NavigationControl;
  const original=window.__lessonMap;
  const parent=original.getContainer().parentElement;
  const container=document.createElement('div');container.id='lesson-supplement-map';
  container.style.cssText='position:absolute;inset:8px;z-index:4;display:none;border-radius:5px;overflow:hidden;';parent.append(container);
  const mode=document.createElement('div');mode.id='lesson-map-mode';mode.textContent='Supplemental geographic view · '+mapCredit;
  mode.style.cssText='display:none;position:fixed;left:24px;top:120px;font:20px system-ui;color:#315c50;';document.body.append(mode);
  const style=document.createElement('style');style.textContent='.lesson-context-label .maplibregl-popup-content{background:none;box-shadow:none;padding:0;font:italic 16px Georgia;color:#526966;text-shadow:0 0 3px white}.lesson-state-label .maplibregl-popup-content{background:rgba(255,255,255,.85);padding:3px 8px;font:bold 24px Georgia;color:#925415}.lesson-state-label .maplibregl-popup-tip,.lesson-context-label .maplibregl-popup-tip{display:none}';document.head.append(style);
  const map=new MapClass({container,center:[-155,55],zoom:2,attributionControl:true,style:{version:8,sources:{geography:{type:'geojson',data,attribution:mapAttribution}},layers:[
   {id:'ocean',type:'background',paint:{'background-color':'#d3e5eb'}},
   {id:'countries',type:'fill',source:'geography',filter:['==',['get','kind'],'country'],paint:{'fill-color':'#e2ddd1'}},
   {id:'country-lines',type:'line',source:'geography',filter:['all',['==',['get','kind'],'country'],['!=',['get','name'],'France']],paint:{'line-color':'#81958d','line-width':1}},
   {id:'states',type:'fill',source:'geography',filter:['==',['get','kind'],'state'],paint:{'fill-color':['case',['in',['get','name'],['literal',westernNames]],'#c8b9cf','#d5d8cf'],'fill-opacity':.75}},
   {id:'state-lines',type:'line',source:'geography',filter:['==',['get','kind'],'state'],paint:{'line-color':'#7c8d85','line-width':.7}},
   {id:'supplement-targets',type:'fill',source:'geography',filter:['all',['==',['get','kind'],'state'],['in',['get','name'],['literal',states.map(s=>s.name)]]],paint:{'fill-color':'#d8bc85','fill-opacity':.9}}
  ]}});
  map.addControl(new Navigation(),'top-right');
  window.__lessonSupplementMap=map;
  window.__lessonSupplementTargets=states.map(s=>({name:s.name,centroid:s.location}));
  window.__lessonUseView=view=>{
   const supplemental=view==='supplemental';window.__lessonActiveView=supplemental?'supplemental':'geoclick';
   original.getContainer().style.visibility=supplemental?'hidden':'visible';container.style.display=supplemental?'block':'none';
   const nav=document.querySelector('.nav-overlay');if(nav)nav.style.visibility=supplemental?'hidden':'';mode.style.display=supplemental?'block':'none';
   window.__lessonActiveMap=supplemental?map:original;window.__lessonActiveMap.resize();
  };
  const selected=new Map();
  let detailLabels=[];
  const label=(text,location,large=false)=>new Popup({closeButton:false,closeOnClick:false,anchor:'center',className:large?'lesson-state-label':'lesson-context-label'}).setLngLat(location).setText(text).addTo(map);
  await new Promise((ok,fail)=>{map.once('load',ok);map.once('error',e=>fail(Error(e.error?.message??'Supplemental map failed')));});
  for(const [text,location] of contextLabels)label(text,location);
  const islandLabels=islandContext.map(([text,location])=>label(text,location));
  const showIslands=()=>islandLabels.forEach(p=>p.getElement().style.display=map.getZoom()>=4?'':'none');map.on('zoom',showIslands);showIslands();
  const showDetails=()=>detailLabels.forEach(({popup,location,target})=>{const a=map.project(location),b=map.project(target);popup.getElement().style.display=Math.hypot(a.x-b.x,a.y-b.y)>110?'':'none';});map.on('move',showDetails);
  map.on('click','supplement-targets',e=>{
   const name=e.features?.[0]?.properties?.name;const state=states.find(s=>s.name===name);if(!state)return;
   document.getElementById('lesson-supplement-fact')?.remove();selected.get(name)?.remove();
   selected.set(name,label(name,state.labelLocation??state.location,true));
   detailLabels.forEach(({popup})=>popup.remove());
   detailLabels=(state.contextLabels??[]).map(([text,location])=>({popup:label(text,location),location,target:state.location}));showDetails();
   const card=document.createElement('div');card.id='lesson-supplement-fact';card.className='fact-card';card.dataset.testid='fact-card';card.dataset.source='Natural Earth supplemental map';
   card.style.cssText='background:rgba(255,255,255,.97);border-radius:12px;box-shadow:0 2px 10px #0002;box-sizing:border-box;color:#2b332e;font-family:system-ui,sans-serif;';
   const body=document.createElement('div');body.className='fact-body';
   const heading=document.createElement('span');heading.className='fact-name';heading.style.cssText='font-weight:700;color:#1f3d2a';heading.textContent=name;body.append(heading);
   for(const text of state.mapFacts){const p=document.createElement('p');p.textContent=text;p.style.margin='12px 0 0';body.append(p);}
   const source=document.createElement('p');source.textContent='Supplemental map · '+mapCredit+'\nFacts: '+state.factCredit;source.style.cssText='font:13px/1.4 system-ui;color:#6b7770;white-space:pre-line;margin-top:16px';body.append(source);
   const close=document.createElement('button');close.setAttribute('aria-label','Close');close.textContent='×';close.style.cssText='position:absolute;right:10px;top:10px;border:0;background:transparent;color:#6b7770;cursor:pointer';close.onclick=()=>card.remove();card.append(body,close);document.body.append(card);
  });
  window.__lessonSupplementReady=true;
 },{data,states,westernNames:lesson.states.map(s=>s.name),mapCredit:lesson.supplement.mapCredit??'Natural Earth',mapAttribution:lesson.supplement.mapAttribution??'Natural Earth · public domain',contextLabels:lesson.supplement.contextLabels??[['Canada',[-120,59]],['Russia',[-188,65]],['North Pacific Ocean',[-153,42]],['Bering Strait',[-169,66]],['Contiguous United States',[-112,40]]],islandContext:lesson.supplement.islandLabels??[['Kauaʻi',[-159.5,22.15]],['Oʻahu',[-157.95,21.55]],['Maui',[-156.3,20.95]],['Island of Hawaiʻi',[-155.5,18.9]]]});
}
