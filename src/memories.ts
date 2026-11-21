import { readCloud } from './cloud';
import { useEffect, useState } from 'react';
import { type Room, type RoomId } from './data';
export interface Memory {media?:{pictures:string[];audio?:string;audioUrl?:string;expires?:number};track?:import("./MusicSearch").Track;cloud?:boolean;id:string;kind?:'demo'|'test'|'personal';date:string;title:string;diary:string;room:RoomId;slot:number;photos:Blob[];musicUrl:string;audio?:Blob;visual:import('./artDirection').ArtDirection;createdAt:string}
export { interpret } from './artDirection';
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('museum-of-days',2);request.onupgradeneeded=()=>{for(const store of ['memories','meta'])if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store,{keyPath:'id'})};request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result)};request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Close other museum tabs and try again.'))})}
function complete(tx:IDBTransaction,db:IDBDatabase):Promise<void>{return new Promise((resolve,reject)=>{tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>{db.close();reject(tx.error??new Error('Local storage transaction failed.'))}})}
export async function readMemories():Promise<Memory[]>{const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('memories');const req=tx.objectStore('memories').getAll();let result:Memory[]=[];req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onabort=()=>{db.close();reject(tx.error)}})}
export async function saveMemory(memory:Memory){const db=await database();const tx=db.transaction('memories','readwrite');const done=complete(tx,db);tx.objectStore('memories').put(memory);return done}
export async function initializeDemo(force=false){
 const db=await database();
 const initialized=await new Promise<boolean>((resolve,reject)=>{const tx=db.transaction('meta');const req=tx.objectStore('meta').get('demo-initialized');req.onsuccess=()=>resolve(!!req.result);req.onerror=()=>reject(req.error)});db.close();
 if(initialized&&!force)return;
 const {sampleMemories}=await import('./demo');const samples=await sampleMemories();
 const target=await database();const tx=target.transaction(['memories','meta'],'readwrite');const done=complete(tx,target);
 // Recheck inside the write transaction: safe against concurrent first visits and reset.
 const flag=tx.objectStore('meta').get('demo-initialized');flag.onsuccess=()=>{
  if(flag.result&&!force)return;
  const store=tx.objectStore('memories');const existing=store.getAll();existing.onsuccess=()=>{
   const records=existing.result as Memory[];
   for(const sample of samples){if(records.some(m=>m.id===sample.id))continue;while(records.some(m=>m.room===sample.room&&m.slot===sample.slot))sample.slot++;store.put(sample);records.push(sample)}
   tx.objectStore('meta').put({id:'demo-initialized',value:true});
  };
 };return done;
}
export async function resetDemoData(){const db=await database();const tx=db.transaction(['memories','meta'],'readwrite');const done=complete(tx,db);const request=tx.objectStore('memories').openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const memory=cursor.value as Memory;if(memory.kind==='demo'||memory.kind==='test')cursor.delete();cursor.continue()};tx.objectStore('meta').put({id:'demo-initialized',value:true});return done}
export function useMemories(owner:string|null){const [memories,setMemories]=useState<Memory[]>([]);const [error,setError]=useState('');const [loaded,setLoaded]=useState(false);useEffect(()=>{(owner?readCloud(owner):initializeDemo().then(readMemories)).then(setMemories).catch(()=>setError(owner?'Your private collection could not be loaded. Reload to try again.':'Local storage could not be opened. Please allow browser storage, close older museum tabs, then reload.')).finally(()=>setLoaded(true))},[]);return {memories,setMemories,error,loaded}}
export function exhibition(room:Room,memories:Memory[]):Room{const entries=new Map(memories.filter(m=>m.room===room.id).map(m=>[m.slot,m]));let count=3;for(const slot of entries.keys())count=Math.max(count,slot+2);return {...room,works:Array.from({length:count},(_,slot)=>{const memory=entries.get(slot);return {title:memory?.title??'Create a memory',subtitle:memory?.date??'An empty frame, a day to keep',note:memory?.diary??'',seed:slot,memory}})}}
export function useBlobUrl(blob?:Blob){const [url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return}const next=URL.createObjectURL(blob);setUrl(next);return()=>URL.revokeObjectURL(next)},[blob]);return url}
