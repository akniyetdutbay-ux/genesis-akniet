// Real browser interaction/visual checks. Uses the locally installed Edge browser.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
async function main(){
 const out=path.resolve(process.env.MUSEUM_QA_DIR || '../../qa');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 await page.locator('[data-ready=true]').waitFor({timeout:60000});await page.waitForTimeout(1800);
 await page.screenshot({path:path.join(out,'entrance-desktop.png')});
 assert.equal(await page.locator('canvas').count(),1,'3D canvas mounted');
 await page.getByRole('button',{name:'Enter the museum',exact:true}).click();await page.getByRole('button',{name:'Explore the museum',exact:true}).waitFor();
 await page.waitForTimeout(4200);await page.screenshot({path:path.join(out,'hall-desktop.png')});
 await page.getByRole('button',{name:'Explore the museum',exact:true}).click();await page.screenshot({path:path.join(out,'directory-desktop.png')});
 for(const [id,label] of [['glow','Glow'],['hush','Hush'],['echo','Echo'],['pulse','Pulse']]){
  if(id==='glow')await page.getByRole('button',{name:'Glow joy',exact:true}).click();else await page.getByRole('navigation',{name:'Emotional galleries'}).getByRole('button',{name:label,exact:true}).click();
  await page.locator(`[data-place=${id}]`).waitFor();await page.waitForTimeout(1800);await page.screenshot({path:path.join(out,`${id}-desktop.png`)});
  await page.getByRole('button',{name:'View the first artwork'}).click();await page.waitForTimeout(1600);await page.getByText('Example memory',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Next artwork'}).click();await page.waitForTimeout(1500);await page.getByRole('button',{name:'Previous artwork'}).click();await page.waitForTimeout(1500);
  if(id==='glow')await page.screenshot({path:path.join(out,'artwork-desktop.png')});
  await page.getByRole('button',{name:'Back to the gallery',exact:true}).click();await page.waitForTimeout(1500);
 }
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'Reduced',exact:true}).click();assert.equal(await page.locator('.museum').getAttribute('data-motion'),'reduced');
 await page.getByRole('button',{name:'Light',exact:true}).click();assert.equal(await page.locator('.museum').getAttribute('data-quality'),'low');
 await page.getByRole('switch',{name:'Ambient sound'}).click();assert.equal(await page.getByRole('switch',{name:'Ambient sound'}).getAttribute('aria-checked'),'true');
 await page.getByRole('switch',{name:'Ambient sound'}).click();assert.equal(await page.getByRole('switch',{name:'Ambient sound'}).getAttribute('aria-checked'),'false');
 await page.screenshot({path:path.join(out,'settings-desktop.png')});await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Settings','dialog restores focus');
 await page.getByRole('button',{name:'The collection',exact:true}).click();await page.getByText(/There are no saved memories yet/).waitFor();await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Main hall',exact:true}).click();await page.locator('[data-place=hall]').waitFor();
 await page.goBack();await page.locator('[data-place=pulse]').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});await mobile.locator('[data-ready=true]').waitFor();await mobile.waitForTimeout(1000);
 await mobile.screenshot({path:path.join(out,'entrance-mobile.png')});assert.equal(await mobile.locator('.museum').getAttribute('data-motion'),'reduced');
 await mobile.getByRole('button',{name:'Enter the museum',exact:true}).click();await mobile.getByRole('button',{name:'Explore the museum',exact:true}).click();await mobile.screenshot({path:path.join(out,'directory-mobile.png')});
 await mobile.getByRole('button',{name:'Hush stillness',exact:true}).click();await mobile.locator('[data-place=hush]').waitFor();await mobile.waitForTimeout(500);await mobile.screenshot({path:path.join(out,'hush-mobile.png')});
 await mobile.getByRole('button',{name:'View the first artwork'}).click();await mobile.waitForTimeout(500);await mobile.screenshot({path:path.join(out,'artwork-mobile.png')});
 await mobile.getByRole('button',{name:'Settings',exact:true}).click();await mobile.screenshot({path:path.join(out,'settings-mobile.png')});await mobile.getByRole('button',{name:'Close dialog'}).click();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.goto('http://127.0.0.1:5173/?lite#echo',{waitUntil:'networkidle'});await mobile.locator('[data-place=echo][data-ready=true]').waitFor();assert.equal(await mobile.locator('canvas').count(),0);await mobile.getByRole('button',{name:'Main hall',exact:true}).click();await mobile.locator('[data-place=hall]').waitFor();
 const summary={passed:true,consoleErrors:errors,checks:['WebGL entrance','cinematic entry','main hall','all four galleries','all artwork pagers','settings motion','settings quality','opt-in audio','dialog Escape and focus return','honest collection','browser back','mobile touch','system reduced motion','no horizontal overflow','deep-link lightweight fallback'],screenshots:fs.readdirSync(out).filter(x=>x.endsWith('.png'))};
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(summary,null,2));assert.deepEqual(errors,[],'No browser errors');await browser.close();console.log(JSON.stringify(summary,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});

