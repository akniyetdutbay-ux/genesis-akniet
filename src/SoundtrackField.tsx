import {MusicSearch,type Track} from './MusicSearch';
import {platform,type Soundtrack,type SoundType} from './soundtrack';

interface Props {source?:Soundtrack; file?:Blob; track?:Track; disabled:boolean; onChange:(s?:Soundtrack,file?:Blob,track?:Track)=>void}
const modes:Record<SoundType,string>={audio_upload:'Upload Audio',video_upload:'Upload Video',audio_url:'Direct Audio URL',platform_link:'Music Platform'};
export function SoundtrackField({source,file,track,disabled,onChange}:Props){
 const type=source?.type??'audio_upload';
 const upload=type==='audio_upload'||type==='video_upload';
 return <fieldset className="soundtrack-field" disabled={disabled}><legend>Soundtrack — Звук воспоминания</legend>
 <label>Sound source<select value={type} onChange={e=>onChange({type:e.target.value as SoundType,title:''})}>{Object.entries(modes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 {upload?<><label>{type==='video_upload'?'Video with sound':'Audio file'}<input key={type} type="file" accept={type==='video_upload'?'video/mp4,video/quicktime,video/webm,.mov':'audio/*'} onChange={e=>{
 const selected=e.target.files?.[0];if(!selected)return;
 const aliases:Record<string,string>={'audio/x-wav':'audio/wav','audio/wave':'audio/wav','audio/x-m4a':'audio/mp4','audio/x-flac':'audio/flac','audio/mp3':'audio/mpeg'};
 const extensions:Record<string,string>={mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',mov:'video/quicktime',mp4:'video/mp4',webm:type==='video_upload'?'video/webm':'audio/webm'};
 const mime=aliases[selected.type]||selected.type||extensions[selected.name.split('.').pop()?.toLowerCase()??''];
 onChange({type,title:selected.name},mime&&mime!==selected.type?selected.slice(0,selected.size,mime):selected);e.target.value='';
 }}/></label><small>{file?source?.title:'Choose a recording you have permission to use.'} {type==='video_upload'?'Only its sound accompanies your photographs.':''}</small></>:
 <>{type==='platform_link'&&<MusicSearch selected={track} onSelect={t=>onChange({type,title:t.title,url:t.url,provider:'Apple Music'},undefined,t)}/>}
 <label>{type==='audio_url'?'Direct HTTPS audio URL':'Official song URL'}<input type="url" value={source?.url??''} placeholder="https://…" onChange={e=>onChange({type,url:e.target.value,title:'',provider:platform(e.target.value)?.provider})}/></label>
 <small>{type==='audio_url'?'Plays with your photographs if the host allows streaming.':'YouTube and Spotify open an official player. Apple Music opens the original song.'}</small></>}
 {(file||source?.url)&&<button type="button" onClick={()=>onChange(undefined)}>Remove soundtrack</button>}</fieldset>
}
