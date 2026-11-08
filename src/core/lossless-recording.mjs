import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

// CDP sends lossless frames when the surface changes. Preserve their real
// presentation times, including long still holds, before making a CFR master.
export async function startLosslessRecording(page, directory, viewport) {
  const dir=resolve(directory),frames=[];
  if(existsSync(join(dir,'capture.json')))throw Error('Capture already exists; use a new output folder');
  mkdirSync(join(dir,'frames'),{recursive:true});
  const client=await page.context().newCDPSession(page);
  const epoch=Date.now()/1000;
  client.on('Page.screencastFrame',event=>{
    const file=`frames/frame-${String(frames.length).padStart(6,'0')}.png`;
    writeFileSync(join(dir,file),Buffer.from(event.data,'base64'));
    frames.push({file,time:Math.max(0,event.metadata.timestamp-epoch)});
    void client.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  await client.send('Page.startScreencast',{format:'png',maxWidth:viewport.width,maxHeight:viewport.height,everyNthFrame:1});
  return {
    at:()=>Date.now()/1000-epoch,
    async finish(){
      const duration=Date.now()/1000-epoch;
      await client.send('Page.stopScreencast');
      if(!frames.length)throw Error('No captured frames');
      frames[0].time=0;
      const concat=['ffconcat version 1.0'];
      frames.forEach((frame,i)=>concat.push(`file '${frame.file}'`,`duration ${Math.max(.001,(frames[i+1]?.time??duration)-frame.time).toFixed(6)}`));
      concat.push(`file '${frames.at(-1).file}'`);
      writeFileSync(join(dir,'frames.ffconcat'),concat.join('\n')+'\n');
      writeFileSync(join(dir,'capture.json'),JSON.stringify({duration,viewport,codec:'lossless PNG',frames},null,2));
      const video=join(dir,'capture-lossless.mp4');
      // Lossless intermediate avoids a lossy encode before final audio muxing.
      execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-safe','0','-f','concat','-i',join(dir,'frames.ffconcat'),'-c:v','libx264','-preset','fast','-crf','0','-pix_fmt','yuv444p','-r','30','-fps_mode','cfr','-t',duration.toFixed(3),video],{stdio:['ignore','ignore','pipe']});
      return {video,duration,frameCount:frames.length};
    }
  };
}
