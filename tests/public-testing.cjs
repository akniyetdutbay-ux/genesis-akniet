const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.BASE_URL || 'http://127.0.0.1:5173';
const out=path.resolve(process.env.QA_DIR || '../../qa/public-testing');fs.mkdirSync(out,{recursive:true});
const report={base,checks:[],errors:[],missingAssets:[]};
function track(page){page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)report.missingAssets.push(`${r.status()} ${r.url()}`)});}
async function records(page){return page.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('museum-of-days');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});const data=await new Promise((r,j)=>{const q=db.transaction('memories').objectStore('memories').getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});db.close();return data.map(m=>({...m,photos:m.photos.map(p=>({size:p.size,type:p.type})),audio:m.audio?{size:m.audio.size,type:m.audio.type}:null}))})}
async function loaded(page){await page.locator('[data-ready=true]').waitFor();await page.waitForFunction(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('museum-of-days');q.onsuccess=()=>r(q.result)});if(!db.objectStoreNames.contains('meta')){db.close();return false}const flag=await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').get('demo-initialized');q.onsuccess=()=>r(q.result)});db.close();return !!flag});await page.waitForTimeout(1600)}
async function closeViewer(page){await page.getByRole('button',{name:'Close · Return to gallery'}).click();await page.getByRole('button',{name:'Back to the gallery',exact:true}).click();await page.waitForTimeout(1500)}
async function guide(page){await page.getByRole('button',{name:'Public demo · Visitor guide'}).click();await page.getByRole('dialog',{name:'Your first visit.'}).waitFor()}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();track(page);
 const response=await page.goto(base);assert.equal(response.status(),200);assert.equal(new URL(page.url()).origin,new URL(base).origin);await loaded(page);
 for(let attempt=0;attempt<30&&(await records(page)).length<4;attempt++)await page.waitForTimeout(500);
 assert.equal((await records(page)).length,4);console.log('Progress:',report.checks.length+1);report.checks.push('anonymous HTTP 200; four sample memories initialized');
 await page.screenshot({path:path.join(out,'entrance.png')});
 await page.getByRole('button',{name:'Enter the museum',exact:true}).click();await page.waitForTimeout(4400);
 for(const [id,x] of [['glow',190],['hush',540],['echo',900],['pulse',1260]]){
  await page.mouse.click(x,440);await page.locator(`[data-place=${id}]`).waitFor({timeout:15000});await page.waitForTimeout(1800);
  await page.getByRole('button',{name:'Explore demo memory'}).click();await page.getByRole('dialog',{name:'Living memory'}).waitFor();
  await page.locator('.memory-image img').evaluate(img=>img.decode());
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForTimeout(300);
  assert.equal(await page.locator('audio').evaluate(a=>!a.paused),true);
  await page.getByRole('button',{name:'Pause',exact:true}).click();assert.equal(await page.locator('audio').evaluate(a=>a.paused),true);
  await page.getByRole('button',{name:'Next photograph'}).click();assert.match(await page.locator('.memory-image img').getAttribute('alt'),/photograph 2/);
  await page.getByRole('button',{name:'Previous photograph'}).click();
  await page.getByRole('button',{name:'Replay',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();
  if(id==='pulse'){await page.waitForTimeout(4500);assert.match(await page.locator('.memory-image img').getAttribute('alt'),/photograph 2/)}
  await page.waitForTimeout(1100);if(id==='glow')await page.screenshot({path:path.join(out,'demo-playback.png')});
  await closeViewer(page);await page.getByRole('button',{name:'Main hall',exact:true}).click();await page.locator('[data-place=hall]').waitFor();await page.waitForTimeout(2000);
 }
 console.log('Progress:',report.checks.length+1);report.checks.push('all four physical doors; all four sample viewers; decoded images; audio Play/Pause; Next/Previous/Replay; return navigation');
 const fixtures=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=400;const g=c.getContext('2d');g.fillStyle='#397d91';g.fillRect(0,0,600,400);g.fillStyle='#f4d49d';g.fillRect(110,80,300,220);return ['image/png','image/jpeg','image/webp'].map(type=>({type,data:c.toDataURL(type).split(',')[1]}))});
 for(const personal of [false,true]){
  await page.getByText('Accessible gallery navigation',{exact:true}).click();await page.getByRole('button',{name:'Glow',exact:true}).click();await page.locator('[data-place=glow]').waitFor();await page.waitForTimeout(1800);
  await page.getByRole('button',{name:'Create a memory',exact:true}).click();
  await page.getByLabel('Title',{exact:false}).fill(personal?'Keep this personal memory':'Reviewer test memory');
  await page.getByLabel('Your diary').fill('We were happy together beside the water. A day worth keeping.');
  await page.getByLabel('Date',{exact:true}).fill('2026-11-20');
  if(personal)await page.getByRole('checkbox',{name:/Mark as test memory/}).uncheck();
  await page.getByLabel('Photographs',{exact:true}).setInputFiles(fixtures.map((f,i)=>({name:`review-${i}.${['png','jpg','webp'][i]}`,mimeType:f.type,buffer:Buffer.from(f.data,'base64')})));
  await page.getByRole('button',{name:'Remove photo'}).nth(2).click();
  await page.getByLabel('Photographs',{exact:true}).setInputFiles({name:'third.webp',mimeType:'image/webp',buffer:Buffer.from(fixtures[2].data,'base64')});
  await page.getByLabel('Music link').fill('https://example.com/reviewer-music');
  const wav=Buffer.alloc(44+16000*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
  await page.getByLabel('Or upload permitted audio').setInputFiles({name:'permitted-test.wav',mimeType:'audio/wav',buffer:wav});
  await page.getByRole('button',{name:'Save memory',exact:true}).click();await page.getByRole('dialog',{name:'Give this day a place.'}).waitFor({state:'detached'});await page.waitForTimeout(1800);
  await page.mouse.click(720,420);await page.getByRole('dialog',{name:'Living memory'}).waitFor();await page.locator('.memory-image img').evaluate(img=>img.decode());
  assert.equal(await page.getByRole('link',{name:'Open music at source'}).getAttribute('href'),'https://example.com/reviewer-music');
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await closeViewer(page);
  await page.getByRole('button',{name:'Main hall',exact:true}).click();await page.locator('[data-place=hall]').waitFor();await page.waitForTimeout(2000);
 }
 await page.reload();await loaded(page);let data=await records(page);assert.equal(data.length,6);
 for(const title of ['Keep this personal memory','Reviewer test memory']){const m=data.find(m=>m.title===title);assert.equal(m.photos.length,3);assert.ok(m.audio.size>0);assert.equal(m.diary,'We were happy together beside the water. A day worth keeping.');assert.equal(m.musicUrl,'https://example.com/reviewer-music')}
 console.log('Progress:',report.checks.length+1);report.checks.push('real upload/remove/re-add PNG, JPEG, WebP; diary/date/title; music URL; local WAV; saved frame click; six records after refresh; original media persisted');
 const second=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const mobile=await second.newPage();track(mobile);await mobile.goto(base+'/#hall');await loaded(mobile);assert.equal((await records(mobile)).length,4);
 await guide(page);await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Cancel reset'}).click();assert.equal((await records(page)).length,6);
 await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Remove demo and test memories'}).click();await page.getByText('Demo samples and marked test memories were removed. Personal memories are unchanged.',{exact:true}).waitFor();
 data=await records(page);assert.equal(data.length,1);assert.equal(data[0].kind,'personal');assert.equal((await records(mobile)).length,4);
 await page.reload();await loaded(page);assert.equal((await records(page)).length,1);await guide(page);await page.getByRole('button',{name:'Restore sample memories'}).click();await page.getByText('The four sample memories are ready to explore.',{exact:true}).waitFor();assert.equal((await records(page)).length,5);
 console.log('Progress:',report.checks.length+1);report.checks.push('cancel reset; reset deletes only demo/test; personal memory survives reset/reload; other browser unaffected; explicit restore');
 await mobile.getByText('Accessible gallery navigation',{exact:true}).click();await mobile.getByRole('button',{name:'Hush',exact:true}).click();await mobile.locator('[data-place=hush]').waitFor();await mobile.getByRole('button',{name:'Explore demo memory'}).click();await mobile.getByRole('dialog',{name:'Living memory'}).waitFor();await mobile.getByRole('button',{name:'Play',exact:true}).click();assert.equal(await mobile.locator('.memory-image img').evaluate(img=>getComputedStyle(img).animationName),'none');await closeViewer(mobile);
 await mobile.getByRole('button',{name:'Create a memory',exact:true}).click();await mobile.getByLabel('Photographs',{exact:true}).setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});await mobile.getByRole('alert').waitFor();await mobile.getByLabel('Your diary').fill('A quiet mobile visit.');await mobile.getByLabel('Photographs',{exact:true}).setInputFiles({name:'mobile.png',mimeType:'image/png',buffer:Buffer.from(fixtures[0].data,'base64')});await mobile.getByLabel('Music link').fill('https://example.com/mobile');await mobile.screenshot({path:path.join(out,'mobile-editor.png')});await mobile.getByRole('button',{name:'Save memory',exact:true}).click();await mobile.getByRole('dialog',{name:'Give this day a place.'}).waitFor({state:'detached'});await mobile.reload();await loaded(mobile);assert.equal((await records(mobile)).length,5);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:path.join(out,'mobile-gallery.png')});
 console.log('Progress:',report.checks.length+1);report.checks.push('mobile touch navigation; reduced-motion playback; invalid file handling; mobile photo/diary/music save; reload; no horizontal overflow');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missingAssets,[]);report.passed=true;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)});
