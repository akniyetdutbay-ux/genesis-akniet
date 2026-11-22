const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch();
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await p.goto(process.env.BASE_URL+'/#glow');
 await p.getByRole('button',{name:'Explore Demo',exact:true}).click();
 const open=p.getByRole('button',{name:'Explore demo memory'});
 await open.waitFor();
 for(const [provider,url,embed] of [
 ['YouTube','https://youtu.be/M7lc1UVf-VE','https://www.youtube-nocookie.com/embed/M7lc1UVf-VE'],
 ['Spotify','https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC','https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC'],
 ['Apple Music','https://music.apple.com/us/album/example/1234',null]]){
 // Seed an isolated guest fixture; Apple deliberately uses the old link-only record shape.
 await p.evaluate(async({provider,url})=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('museum-of-days');req.onerror=()=>reject(req.error);req.onsuccess=()=>{
 const db=req.result,tx=db.transaction('memories','readwrite'),store=tx.objectStore('memories'),q=store.get('museum-demo-v1-glow');
 q.onsuccess=()=>{const m=q.result;delete m.audio;m.musicUrl=url;if(provider==='Apple Music')delete m.soundtrack;else m.soundtrack={type:'platform_link',url,provider,title:'Test'};store.put(m)};
 tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};}),{provider,url});
 await p.reload();await open.click();
 const viewer=p.getByRole('dialog',{name:'Living memory'});assert.equal(await viewer.getByRole('link',{name:'Open song'}).getAttribute('href'),url);
 if(embed){await viewer.getByRole('button',{name:'Open '+provider+' player'}).click();const frame=viewer.locator('iframe');assert.equal(await frame.getAttribute('src'),embed);assert(await frame.isVisible());await viewer.getByRole('button',{name:'Close player'}).click();assert.equal(await frame.count(),0)}
 assert.equal(await viewer.getByRole('button',{name:'Mute sound'}).count(),0);
 await viewer.getByRole('button',{name:/Return to gallery/}).click();console.log('PASS '+provider+' official destination');
 }
 await p.close();
 const q=await browser.newPage({reducedMotion:'reduce'});await q.goto(process.env.BASE_URL+'/#glow');
 await q.locator('[name=email]').fill(process.env.QA_EMAIL);await q.locator('[name=password]').fill(process.env.QA_PASSWORD);await q.getByRole('button',{name:'Continue with Email'}).click();await q.getByRole('button',{name:'Enter the museum',exact:true}).click();if(await q.locator('[data-place=hall]').count()){await q.getByText('Accessible gallery navigation',{exact:true}).click();await q.getByRole('button',{name:'Glow',exact:true}).click()}
 await q.getByRole('button',{name:'Create a memory',exact:true}).click();await q.getByLabel('Your diary').fill('Sound validation');await q.getByLabel('Photographs',{exact:true}).setInputFiles(path.join(__dirname,'../public/lucerne/07290.jpg'));
 const save=q.getByRole('button',{name:'Save memory'});await q.getByLabel('Sound source').selectOption('video_upload');
 for(const file of [{name:'broken.mp4',mimeType:'video/mp4',buffer:Buffer.from('invalid video')},process.env.QA_SILENT_VIDEO]){
 await q.getByLabel('Video with sound').setInputFiles(file);await save.click();await q.getByRole('alert').filter({hasText:/could not|No playable/}).waitFor();console.log('PASS rejected '+(typeof file==='string'?'silent video':'invalid video'))}
 await q.getByLabel('Sound source').selectOption('audio_url');for(const url of ['https://open.spotify.com/track/test',process.env.BASE_URL+'/missing.mp3']){
 await q.getByLabel('Direct HTTPS audio URL').fill(url);await save.click();await q.getByRole('alert').waitFor();console.log('PASS rejected invalid direct URL')}
 }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});

