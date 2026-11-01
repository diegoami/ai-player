import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=JSON.parse(readFileSync('rendered/europe-natural-earth-10m.geojson','utf8'));
const vatican=JSON.parse(readFileSync('rendered/vatican-boundary.geojson','utf8'));
const vaticanMetadata=JSON.parse(readFileSync('rendered/vatican-boundary-metadata.json','utf8'));
const monaco=JSON.parse(readFileSync('rendered/monaco-boundary.geojson','utf8'));
const monacoMetadata=JSON.parse(readFileSync('rendered/monaco-boundary-metadata.json','utf8'));
const france=JSON.parse(readFileSync('rendered/france-boundary.geojson','utf8'));
const frenchRegions=JSON.parse(readFileSync('rendered/france-regions-boundary.geojson','utf8'));
const riviera=frenchRegions.features.find(f=>/Provence/i.test(f.properties.shapeName??''));
if(!riviera)throw Error('French Riviera regional geometry missing');
// Clip only the IGN coastal context needed beside Monaco. Coordinates retain
// their original geographic positions; the rectangle is not a country border.
const clipRing=(ring,box=[6.9,43.4,7.8,44.1])=>{
 let points=ring.slice(0,-1);
 for(const [axis,bound,greater] of [[0,box[0],true],[0,box[2],false],[1,box[1],true],[1,box[3],false]]){
  const inside=p=>greater?p[axis]>=bound:p[axis]<=bound;
  const next=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
   if(ai)next.push(a);
   if(ai!==bi){const t=(bound-a[axis])/(b[axis]-a[axis]);next.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  points=next;
 }
 return points.length>=3?[...points,points[0]]:null;
};
const targets=['Monaco','Liechtenstein','Andorra','San Marino','Vatican City','Malta'];
const context=['France','Spain','Portugal','Italy','Switzerland','Austria','Germany','Slovenia','Croatia','United Kingdom'];
const round=c=>typeof c[0]==='number'?c.map(n=>Number(n.toFixed(6))):c.map(round);
const features=raw.features.flatMap(f=>{
 const name=f.properties.ADMIN==='Vatican'?'Vatican City':f.properties.ADMIN;
 if(!targets.includes(name)&&!context.includes(name))return [];
 const geometry=name==='Vatican City'?vatican.features[0].geometry:name==='Monaco'?monaco.features[0].geometry:name==='France'?france.features[0].geometry:f.geometry;
 return [{type:'Feature',properties:{name,kind:targets.includes(name)?'state':'country'},geometry:{type:geometry.type,coordinates:round(geometry.coordinates)}}];
});
const coastPolygons=(riviera.geometry.type==='Polygon'?[riviera.geometry.coordinates]:riviera.geometry.coordinates).flatMap(p=>{const outer=clipRing(p[0]);return outer?[[outer,...p.slice(1).map(r=>clipRing(r)).filter(Boolean)]]:[];});
features.push({type:'Feature',properties:{name:'France',kind:'country',detail:true},geometry:{type:'MultiPolygon',coordinates:round(coastPolygons)}});
// Keep the Pyrenean context consistent with the Natural Earth Andorra/Spain
// boundaries. Mixing the coarse French ADM0 edge with them leaves false water.
const neFrance=raw.features.find(f=>f.properties.ADMIN==='France').geometry;
const pyrenees=(neFrance.type==='Polygon'?[neFrance.coordinates]:neFrance.coordinates).flatMap(p=>{const outer=clipRing(p[0],[1,42.2,2,42.9]);return outer?[[outer,...p.slice(1).map(r=>clipRing(r,[1,42.2,2,42.9])).filter(Boolean)]]:[];});
features.push({type:'Feature',properties:{name:'France',kind:'country',detail:true},geometry:{type:'MultiPolygon',coordinates:round(pyrenees)}});
if(targets.some(n=>!features.some(f=>f.properties.name===n)))throw Error('Missing microstate geometry');
const text=JSON.stringify({type:'FeatureCollection',features});
writeFileSync('src/lessons/data/europe-microstates.geojson',text);
writeFileSync('src/lessons/data/europe-microstates.source.json',JSON.stringify({publisher:'Natural Earth; geoBoundaries/Wikimedia Commons (Vatican and France); geoBoundaries/OpenStreetMap (Monaco)',scale:'Natural Earth 1:10m context; detailed Vatican, Monaco and French context polygons',license:'Natural Earth and Vatican layers: public domain; French layer: CC0. Monaco: © OpenStreetMap contributors, ODbL 1.0. Combined reusable database offered under ODbL 1.0.',licenseUrl:'https://opendatacommons.org/licenses/odbl/1-0/',osmAttribution:'https://www.openstreetmap.org/copyright',retrieved:'2026-11-01',source:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',vatican:vaticanMetadata,monaco:monacoMetadata,france:{boundaryID:'FRA-ADM0-40433807',publisher:'geoBoundaries / Wikimedia Commons',license:'CC0 1.0',source:'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/FRA/ADM0/geoBoundaries-FRA-ADM0.geojson'},sha256:createHash('sha256').update(text).digest('hex'),processing:'Six microstates plus neighbouring context; coordinates rounded to six decimals. Vatican, Monaco and French context replaced by detailed geoBoundaries polygons. No relocation or artificial rescaling. Geographic map data, not street or survey maps.'},null,2)+'\n');
writeFileSync('src/lessons/data/europe-microstates.LICENSE.txt','Europe supplemental map database\n\nMonaco geometry: © OpenStreetMap contributors, obtained through geoBoundaries MCO-ADM0-9783051. Open Database License (ODbL) 1.0: https://opendatacommons.org/licenses/odbl/1-0/\nAttribution: https://www.openstreetmap.org/copyright\n\nNatural Earth layers and the geoBoundaries/Wikimedia Commons Vatican geometry are public domain. The combined reusable database is made available under ODbL 1.0. Source metadata and unmodified geographic positions are preserved in the adjacent .source.json and .geojson files.\n');
console.log(`${features.length} features, ${text.length} bytes`);
const sourcePath='src/lessons/data/europe-microstates.source.json';
const provenance=JSON.parse(readFileSync(sourcePath,'utf8'));
provenance.franceCoast={boundaryID:'FRA-ADM1-19338628',publisher:'IGN-F via geoBoundaries',yearRepresented:2022,license:'Etalab Open License 2.0',licenseUrl:'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',source:'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/FRA/ADM1/geoBoundaries-FRA-ADM1.geojson',processing:'Provence-Alpes-Cote d’Azur clipped to [6.9,43.4,7.8,44.1] for detailed coastal context beside Monaco; clipping edges and internal regional boundaries are not drawn as country borders.'};
provenance.license+=' French Riviera context: IGN-F 2022, Etalab Open License 2.0.';
provenance.processing+=' Natural Earth French context clipped to [1,42.2,2,42.9] restores a consistent land join with the Andorra and Spain layers; clipping edges are not drawn.';
writeFileSync(sourcePath,JSON.stringify(provenance,null,2)+'\n');
const noticePath='src/lessons/data/europe-microstates.LICENSE.txt';
writeFileSync(noticePath,readFileSync(noticePath,'utf8')+'\nDetailed French Riviera context: IGN-F ADMIN EXPRESS 2022 via geoBoundaries FRA-ADM1-19338628. Etalab Open License 2.0: https://www.etalab.gouv.fr/licence-ouverte-open-licence/ . Clipped to the Monaco vicinity; original geographic positions preserved.\n');
