const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
// Run only with a confirmed, dedicated empty test account and normal email sign-in.
(async()=>{
 if(!process.env.QA_EMAIL||!process.env.QA_PASSWORD)throw Error('A confirmed disposable QA account is required.');
 const browser=await chromium.launch({headless:false});
 try{
  const p=await browser.newPage({...(process.env.MOBILE_CHROMIUM?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}}),reducedMotion:'reduce'});
  await p.context().addInitScript(installProbe);
  function installProbe(){const native=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!this.muted)window.qaSound=this;return native.call(this)}}
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.BASE_URL||'http://127.0.0.1:4337')+'/#hall');
  await p.getByLabel('Email',{exact:true}).fill(process.env.QA_EMAIL);await p.getByLabel('Password',{exact:true}).fill(process.env.QA_PASSWORD);
  await p.getByRole('button',{name:'Continue with Email'}).click();
  await p.getByRole('button',{name:'Enter the museum',exact:true}).click();
  await p.locator('[data-place=hall][data-ready=true]').waitFor();
  if(process.env.MOBILE_CHROMIUM){await p.touchscreen.tap(195,405)}else{await p.getByText('Accessible gallery navigation',{exact:true}).click();await p.getByRole('button',{name:'Glow',exact:true}).click()}await p.locator('[data-place=glow]').waitFor();await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Create a memory',exact:true}).click();
  await p.getByLabel('Your diary').fill('A quiet walk beside the river.');
  const title='Atelier QA '+Date.now();await p.locator('[name=title]').fill(title);
  await p.locator('[name=date]').fill('2026-06-14');
  const path=require('node:path');
  const files=['07290','07231','07278'].map(id=>path.join(__dirname,'../public/lucerne',id+'.jpg'));
  await p.getByLabel('Photographs',{exact:true}).setInputFiles(files);
  await p.getByLabel('Musical energy').selectOption('quiet');
  // A locally synthesized permitted tone, eight seconds of PCM audio.
  const rate=8000,bytes=rate*8*2,wav=Buffer.alloc(44+bytes);
  wav.write('RIFF');wav.writeUInt32LE(36+bytes,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
  wav.write('data',36);wav.writeUInt32LE(bytes,40);
  for(let i=0;i<bytes/2;i++)wav.writeInt16LE(Math.round(3000*Math.sin(i*2*Math.PI*220/rate)),44+i*2);
  if(process.env.QA_SOUND_URL){
   await p.getByLabel('Sound source').selectOption('audio_url');
   await p.getByLabel('Direct HTTPS audio URL').fill(process.env.QA_SOUND_URL);
  }else if(process.env.QA_SOUND_FILE){
   const video=process.env.QA_SOUND_FILE.endsWith('.mp4');
   await p.getByLabel('Sound source').selectOption(video?'video_upload':'audio_upload');
   await p.getByLabel(video?'Video with sound':'Audio file',{exact:true}).setInputFiles(process.env.QA_SOUND_FILE);
  }else await p.locator('input[accept="audio/*"]').setInputFiles({name:'original.wav',mimeType:'audio/wav',buffer:wav});
  const committed=p.waitForResponse(r=>r.url().includes('/rpc/store_day')&&r.request().method()==='POST');
  await p.getByRole('button',{name:'Save memory',exact:true}).click();assert((await committed).ok());
  await p.getByRole('heading',{name:title,exact:true}).waitFor();
  async function play(page){
   await page.getByRole('button',{name:'Open living memory'}).click();
   const viewer=page.getByRole('dialog',{name:'Living memory'});
   await viewer.waitFor();assert.equal(await viewer.getAttribute('data-layout'),'sequence');
   for(let i=0;i<3;i++){
    if(i)await viewer.getByRole('button',{name:'Next photograph'}).click();
    await viewer.locator('.main-print').evaluate(img=>img.decode());
   }
   await viewer.getByRole('button',{name:'Replay'}).click();
   await page.waitForFunction(()=>window.qaSound&&!window.qaSound.paused&&window.qaSound.currentTime>0);
   const mute=viewer.getByRole('button',{name:'Mute sound'});await mute.click();assert(await page.evaluate(()=>window.qaSound.muted));
   await viewer.getByRole('button',{name:'Unmute sound'}).click();
   await viewer.getByRole('button',{name:'Pause',exact:true}).click();assert(await page.evaluate(()=>window.qaSound.paused));
   await viewer.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>!window.qaSound.paused);
   await viewer.getByRole('button',{name:'Read diary'}).click();
   await viewer.locator('.reading-room').getByText('A quiet walk beside the river.').waitFor();
   await viewer.getByRole('button',{name:'Back to memory'}).click();
   await viewer.getByRole('button',{name:/Return to gallery/}).click();assert(await page.evaluate(()=>window.qaSound.paused&&!window.qaSound.hasAttribute('src')));
  }
  async function openSaved(page){
   await page.getByRole('button',{name:'The collection',exact:true}).click();
   await page.getByRole('button',{name:new RegExp(title)}).click();
   await page.getByText('2026-06-14',{exact:true}).first().waitFor();
   await play(page);
  }
  await play(p);await p.reload();await openSaved(p);
  console.log('PASS authenticated save, three photographs, text, date, audio controls, reload');
  const second=await webkit.launch();
  try{
   const q=await second.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   await q.context().addInitScript(installProbe);await q.goto(process.env.BASE_URL);
   await q.locator('[name=email]').fill(process.env.QA_EMAIL);
   await q.locator('[name=password]').fill(process.env.QA_PASSWORD);
   await q.getByRole('button',{name:'Continue with Email'}).click();
   await q.getByRole('button',{name:'Enter the museum',exact:true}).click();
   await openSaved(q);
   await q.getByRole('button',{name:'The collection',exact:true}).click();
   await q.getByRole('button',{name:'Sign out',exact:true}).click();
   await q.getByRole('heading',{name:'Welcome to the museum'}).waitFor();
   console.log('PASS independent WebKit sign-in, restored media and sign-out');
  }finally{await second.close()}
  await p.getByRole('button',{name:'The collection',exact:true}).click();
  p.once('dialog',d=>d.accept());await p.locator('.collection-list > div').filter({hasText:title}).getByRole('button',{name:'Delete',exact:true}).click();
  await p.locator('.collection-list > div').filter({hasText:title}).waitFor({state:'detached'});await p.getByRole('button',{name:'Return to the main hall'}).click();await p.locator('[data-place=hall]').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: authenticated art edition round trip');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
