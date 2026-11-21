const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const context=await browser.newContext();const page=await context.newPage();const base=process.env.BASE_URL || 'http://127.0.0.1:4174';
 await page.route(base+'/',route=>route.fulfill({contentType:'text/html',body:'<html><title>Isolated migration fixture</title></html>'}));await page.goto(base+'/');
 await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('museum-of-days',1);q.onupgradeneeded=()=>q.result.createObjectStore('memories',{keyPath:'id'});q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});await new Promise((resolve,reject)=>{const tx=db.transaction('memories','readwrite');tx.objectStore('memories').put({id:'legacy-personal',room:'glow',slot:0,title:'Before the demo',date:'2026-11-19',diary:'My original personal memory.',photos:[],musicUrl:'',visual:{color:'#aaa',seconds:6,motion:'drift',texture:'clean'},createdAt:'2026-11-19T00:00:00Z'});tx.oncomplete=resolve;tx.onabort=reject});db.close()});
 await page.unroute(base+'/');const other=await context.newPage();await Promise.all([page.goto(base+'/?lite#hall'),other.goto(base+'/?lite#hall')]);
 for(const p of [page,other]){await p.getByRole('button',{name:'The collection',exact:true}).click();await p.locator('.collection-list button').nth(4).waitFor();assert.equal(await p.locator('.collection-list button').count(),5)}
 await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Public demo · Visitor guide'}).click();await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Remove demo and test memories'}).click();await page.getByText('Demo samples and marked test memories were removed. Personal memories are unchanged.',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'The collection',exact:true}).click();await page.getByRole('button',{name:/Before the demo/}).waitFor();assert.equal(await page.locator('.collection-list button').count(),1);
 console.log('PASS v1 migration, concurrent initialization, legacy personal data preserved by reset');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
