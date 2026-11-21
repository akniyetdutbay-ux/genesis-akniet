/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { Memory } from './memories';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const client = url && key ? createClient(url,key) : null;
const media = () => client!.storage.from('memory-media');

export async function saveCloud(memory:Memory, owner:string, replacing=false) {
  const previous=replacing?await pathsFor(memory.id):[];
  const uploaded:string[]=[];
  async function upload(file:Blob) {
    if(file.size>25*1024*1024) throw Error('Each file must be under 25 MB.');
    const path=[owner,memory.id,crypto.randomUUID()].join('/');
    const {error}=await media().upload(path,file,{contentType:file.type});
    if(error) throw error;
    uploaded.push(path);
    return path;
  }
  let submitted=false;
  try {
    const pictures=[];
    for(const photo of memory.photos) pictures.push({path:await upload(photo),type:photo.type,size:photo.size});
    const path=memory.audio ? await upload(memory.audio) : null;
    const {id,date,title,diary,room,slot,visual}=memory;
    submitted=true;
    const {error}=await client!.rpc('store_day',{day:{id,date,title,diary,room,slot,visual,visibility:'private'},pictures,music:{url:memory.musicUrl,path,title:memory.track?.title,artist:memory.track?.artist,track_id:memory.track?.id}});
    if(error){if(error.code) submitted=false; throw error;}
    if(previous.length){const cleanup=await media().remove(previous);if(cleanup.error)console.warn('Private file cleanup pending');}
  } catch(error) {
    if(!submitted && uploaded.length) await media().remove(uploaded);
    throw error;
  }
}
async function download(path:string) {
  const {data,error}=await media().download(path);
  if(error) throw error;
  return data;
}
export async function readCloud(owner:string):Promise<Memory[]> {
  const {data,error}=await client!.from('memories').select('*,memory_photos(storage_path,display_order),memory_music(external_url,storage_path,track_title,artist,provider_track_id)').eq('user_id',owner);
  if(error) throw error;
  return Promise.all(data.map(async row=>{
    const pictures=row.memory_photos as {storage_path:string;display_order:number}[];
    return {id:row.id,kind:'personal',date:row.memory_date,title:row.title,diary:row.diary_text,room:row.emotional_room,slot:row.slot,visual:row.visual_settings,createdAt:row.created_at,photos:await Promise.all(pictures.sort((a,b)=>a.display_order-b.display_order).map(p=>download(p.storage_path))),track:row.memory_music?.provider_track_id?{id:row.memory_music.provider_track_id,title:row.memory_music.track_title,artist:row.memory_music.artist,url:row.memory_music.external_url}:undefined,musicUrl:row.memory_music?.external_url??'',audio:row.memory_music?.storage_path?await download(row.memory_music.storage_path):undefined,cloud:true};
  }));
}

async function pathsFor(id:string) {
  const {data,error}=await client!.from('memories').select('memory_photos(storage_path),memory_music(storage_path)').eq('id',id).single();
  if(error) throw error;
  const music=data.memory_music as unknown as {storage_path?:string}|null;
  return [...data.memory_photos.map(p=>p.storage_path as string),...(music?.storage_path?[music.storage_path]:[])];
}
export async function removeCloud(memory:Memory){
  const paths=await pathsFor(memory.id);
  const result=await client!.from('memories').delete().eq('id',memory.id).select('id').single();
  if(result.error)throw result.error;
  if(paths.length){const cleanup=await media().remove(paths);if(cleanup.error)throw Error('Record deleted. Private file cleanup failed.');}
}
