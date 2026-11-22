import type { Memory } from './memories';

export type SoundType = 'audio_upload' | 'video_upload' | 'audio_url' | 'platform_link';
export interface Soundtrack {type:SoundType; title:string; url?:string; provider?:string; duration?:number}
export const audioTypes=['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm','audio/aac','audio/flac'];
export const videoTypes=['video/mp4','video/quicktime','video/webm'];
export function https(raw:string){
 try {const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u:undefined}catch{return undefined}
}
export function platform(raw:string){
 const u=https(raw);if(!u)return;
 const h=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
 if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(h)){
  const id=h==='youtu.be'?parts[0]:u.searchParams.get('v')??(['shorts','embed','live'].includes(parts[0])?parts[1]:'');
  return {provider:'YouTube',embed:id&&/^[\w-]{11}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id:undefined};
 }
 if(h==='open.spotify.com'){
  if(parts[0]?.startsWith('intl-'))parts.shift();
  return {provider:'Spotify',embed:['track','album','playlist','episode','show'].includes(parts[0])&&/^[a-zA-Z0-9]{22}$/.test(parts[1]??'')?'https://open.spotify.com/embed/'+parts[0]+'/'+parts[1]:undefined};
 }
 if(h==='music.apple.com')return {provider:'Apple Music',embed:undefined};
}
export function sourceOf(m:Memory):Soundtrack|undefined{
 if(m.soundtrack)return m.soundtrack;
 if(m.audio||m.media?.audio)return {type:'audio_upload',title:'Attached audio'};
 if(https(m.musicUrl))return {type:'platform_link',title:m.track?.title||'Open song',provider:platform(m.musicUrl)?.provider,url:m.musicUrl};
}
export function mediaElement(video:boolean){
 if(!video)return new Audio();
 const el=document.createElement('video');el.playsInline=true;el.disablePictureInPicture=true;return el;
}
type TrackInfo=HTMLMediaElement & {audioTracks?:{length:number};webkitAudioDecodedByteCount?:number;mozHasAudio?:boolean};
export async function inspectSound(source:Soundtrack, file?:Blob):Promise<number|undefined>{
 if(source.type==='platform_link'){if(!platform(source.url??''))throw Error('Use a YouTube, Spotify or Apple Music link.');return}
 const video=source.type==='video_upload';
 if(file && (file.size>25*1024*1024||!(video?videoTypes:audioTypes).includes(file.type)))throw Error('Choose a supported file up to 25 MB.');
 if(!file && (source.type!=='audio_url'||!https(source.url??'')||platform(source.url!)))throw Error('Enter a direct HTTPS audio URL, or select Music Platform for a song page.');
 const url=file?URL.createObjectURL(file):source.url!;
 const node=mediaElement(video) as TrackInfo;
 try{
  if(!file){
   let mime='';try{const response=await fetch(url,{method:'HEAD',credentials:'omit',signal:AbortSignal.timeout(4000)});if(response.ok)mime=response.headers.get('content-type')?.split(';')[0]??''}catch{/* Hosts may allow streaming without CORS. */}
   if(!(mime.startsWith('audio/')||((!mime||mime==='application/octet-stream')&&/\.(mp3|aac|m4a|wav|flac|oga|ogg|opus|weba)$/i.test(https(url)!.pathname))))throw Error('This link must serve an audio file. Check its address and sharing settings.');
  }
  node.muted=true;node.preload='auto';
  return await new Promise<number|undefined>((resolve,reject)=>{
   let poll=0;
   const finish=(error?:string)=>{clearTimeout(timer);clearInterval(poll);node.onplaying=null;node.onerror=null;error?reject(Error(error)):resolve(Number.isFinite(node.duration)?node.duration:undefined)};
   const timer=window.setTimeout(()=>finish(video?'No playable audio track was detected in this video.':'Audio could not load. Check access and browser support.'),12000);
   node.onerror=()=>finish('This browser could not decode the media or access its URL.');
   node.onplaying=()=>{clearInterval(poll);const check=()=>{if(!video||node.audioTracks?.length||node.mozHasAudio||(node.webkitAudioDecodedByteCount??0)>0)finish()};poll=window.setInterval(check,80);check()};
   node.src=url;void node.play().catch(()=>finish('This browser could not play the selected media.'));
  });
 }finally{node.pause();node.removeAttribute('src');node.load();if(file)URL.revokeObjectURL(url)}
}

