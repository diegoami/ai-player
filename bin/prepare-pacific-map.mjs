import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const states=JSON.parse(readFileSync('rendered/natural-earth-admin1-50m.geojson','utf8'));
const countries=JSON.parse(readFileSync('rendered/natural-earth-countries-50m.geojson','utf8'));
const wrap=coordinates=>typeof coordinates[0]==='number'?[coordinates[0]>0?coordinates[0]-360:coordinates[0],...coordinates.slice(1)]:coordinates.map(wrap);
const features=[];
for(const f of countries.features){
 const name=f.properties.ADMIN??f.properties.admin;
 if(['United States of America','Canada','Russia','Mexico'].includes(name))features.push({type:'Feature',properties:{name,kind:'country'},geometry:{...f.geometry,coordinates:wrap(f.geometry.coordinates)}});
}
for(const f of states.features){
 if(f.properties.admin==='United States of America')features.push({type:'Feature',properties:{name:f.properties.name,kind:'state',code:f.properties.iso_3166_2},geometry:{...f.geometry,coordinates:wrap(f.geometry.coordinates)}});
}
for(const name of ['Alaska','Hawaii'])if(!features.find(f=>f.properties.kind==='state'&&f.properties.name===name))throw Error(`Missing ${name}`);
const text=JSON.stringify({type:'FeatureCollection',features});
writeFileSync('src/lessons/data/pacific-context.geojson',text);
writeFileSync('src/lessons/data/pacific-context.source.json',JSON.stringify({publisher:'Natural Earth',scale:'1:50m',license:'Public domain',retrieved:'2026-10-30',sources:['https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson','https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'],sha256:createHash('sha256').update(text).digest('hex'),processing:'USA states plus USA/Canada/Russia/Mexico country context; positive longitudes wrapped by -360 for a continuous Pacific view. No relocation or rescaling of states.'},null,2));
console.log(`${features.length} features, ${text.length} bytes`);
