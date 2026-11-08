#!/usr/bin/env node
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
const arg=name=>process.argv.find(x=>x.startsWith(`--${name}=`))?.slice(name.length+3);
const id=arg('id'),out=resolve(arg('out')??'rendered/youtube-quality'),sample=Number(arg('time')??10);
const noSeek=process.argv.includes('--no-seek');
if(!/^[\w-]{11}$/.test(id??''))throw Error('Use --id=<video ID> --out=<evidence folder> [--time=<seconds>]');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.goto(`https://www.youtube.com/watch?v=${id}`,{waitUntil:'domcontentloaded'});
 const reject=page.locator('ytd-consent-bump-v2-lightbox button').filter({hasText:/Alle ablehnen|Reject all/});
 try{await reject.first().waitFor({state:'visible',timeout:15000});await reject.first().click()}catch(error){if(await page.locator('ytd-consent-bump-v2-lightbox').isVisible())throw error}
 await page.locator('video').waitFor();await page.locator('video').evaluate(v=>{v.muted=true;void v.play()});await page.waitForTimeout(3500);
 await page.locator('.ytp-settings-button').click();await page.locator('.ytp-menuitem').filter({hasText:/Qualität|Quality/}).click();
 const options=await page.locator('.ytp-settings-menu').innerText();
 writeFileSync(join(out,'youtube-quality-options.txt'),options);await page.screenshot({path:join(out,'youtube-quality-menu.png')});
 console.log(options);
 const hd=page.locator('.ytp-menuitem').filter({hasText:/1080p/});if(!await hd.count())throw Error('1080p is not available yet');
 await hd.first().click();
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v?.videoHeight===1080&&v.readyState>=3},null,{timeout:45000});
 await page.waitForTimeout(2000);
 if(!noSeek)await page.evaluate(time=>{const player=document.querySelector('#movie_player');player.seekTo(time,true);player.playVideo()},sample);
 try{await page.waitForFunction(time=>{const v=document.querySelector('video');return v.videoHeight===1080&&v.currentTime>=time-.5&&v.readyState>=3},sample,{timeout:Math.max(45000,noSeek?(sample+15)*1000:45000)})}
 catch(error){console.log(await page.locator('video').evaluate(v=>({time:v.currentTime,width:v.videoWidth,height:v.videoHeight,ready:v.readyState,paused:v.paused})));await page.screenshot({path:join(out,'youtube-playback-error.png')});throw error}
 await page.waitForTimeout(2000);
 const details=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,currentTime:v.currentTime,readyState:v.readyState,paused:v.paused,quality:document.querySelector('#movie_player')?.getPlaybackQuality?.(),available:document.querySelector('#movie_player')?.getAvailableQualityLevels?.()}));
 const png=await page.locator('video').evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL('image/png').split(',')[1]});
 writeFileSync(join(out,'youtube-decoded-1080p.png'),Buffer.from(png,'base64'));
 await page.locator('.ytp-fullscreen-button').click();await page.mouse.move(5,5);await page.waitForTimeout(3300);await page.screenshot({path:join(out,'youtube-playback-1080p.png')});
 const report={checkedAt:new Date().toISOString(),id,url:page.url(),options,seekUsed:!noSeek,...details};writeFileSync(join(out,'youtube-playback.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(details));
}finally{await browser.close()}
