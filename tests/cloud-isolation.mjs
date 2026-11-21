import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
const db=()=>createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const users=JSON.parse(process.env.MUSEUM_QA);
const [a,b]=await Promise.all(users.map(async ([,email,password])=>{const c=db();const r=await c.auth.signInWithPassword({email,password});assert.ifError(r.error);return c}));
const mid=crypto.randomUUID(), path=[users[0][0],mid,'fixture'].join('/');
const bucket=c=>c.storage.from('memory-media');
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1sAAAAASUVORK5CYII=','base64');
try {
assert.ifError((await bucket(a).upload(path,bytes,{contentType:'image/png'})).error);
const day={id:mid,date:'2026-11-21',room:'glow',diary:'QA fixture',title:'Testing',slot:0,visibility:'private',visual:{seconds:5}};
assert.ifError((await a.rpc('store_day',{day,pictures:[{path,type:'image/png',size:bytes.length}],music:{url:'https://example.com/music'}})).error);
const fresh=db(); assert.ifError((await fresh.auth.signInWithPassword({email:users[0][1],password:users[0][2]})).error);
assert.equal((await fresh.from('memories').select('title,memory_photos(storage_path),memory_music(external_url)').eq('id',mid).single()).data.memory_photos[0].storage_path,path);
assert.deepEqual(Buffer.from(await (await bucket(fresh).download(path)).data.arrayBuffer()),bytes);
for(const op of [b.from('memories').select('id'),b.from('memories').update({title:'other'}).select(),b.from('memories').delete().select()]){
const r=await op.eq('id',mid);assert.ifError(r.error);assert.equal(r.data.length,0);}
assert.ok((await bucket(b).download(path)).error);
assert.ok((await bucket(b).upload(path+'-other',bytes,{contentType:'image/png'})).error);
assert.ok((await db().from('memories').select()).error);
console.log('PASS: independent email logins, fresh-session metadata and photo bytes, private row read/update/delete isolation, storage read/upload isolation, anonymous denial.');
}finally{await bucket(a).remove([path]);await a.from('memories').delete().eq('id',mid)}
