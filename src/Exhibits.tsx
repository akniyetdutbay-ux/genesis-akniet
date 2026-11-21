import { useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { download } from './cloud';
import { AtelierModel } from './AtelierModel';
import { Box } from './Architecture';
import { rooms, type RoomId } from './data';
import { useBlobUrl, type Memory } from './memories';
import { inscriptionTexture } from './textures';
export const doorX:Record<RoomId,number>={glow:-7.5,hush:-2.5,echo:2.5,pulse:7.5};
export function Doorways({target,onDoor,reduced}:{target:RoomId|null;onDoor:(id:RoomId)=>void;reduced:boolean}){return <group>{rooms.map(room=><PhysicalDoor key={room.id} id={room.id} color={room.wall} open={target===room.id} onDoor={onDoor} reduced={reduced}/>)}</group>}
const lacquer:Record<RoomId,[string,string]>={
 glow:['#c39349','#9c601d'],hush:['#839984','#466950'],
 echo:['#798e9f','#405772'],pulse:['#874854','#632738']
};
function DoorPanel({id,hover,reduced}:{id:RoomId;hover:boolean;reduced:boolean}){
 const material=useRef<THREE.MeshStandardMaterial>(null);
 const {invalidate}=useThree();
 useEffect(()=>{
   const color=new THREE.Color(lacquer[id][hover?1:0]);
   const tween=gsap.to(material.current!.color,{r:color.r,g:color.g,b:color.b,duration:reduced?0:.25,onUpdate:invalidate});
   return ()=>{tween.kill()};
 },[id,hover,reduced,invalidate]);
 return <mesh position={[1.8,2.9,0]} castShadow receiveShadow><boxGeometry args={[3.6,5.8,.16]}/><meshStandardMaterial ref={material} color={lacquer[id][0]} roughness={.52}/></mesh>;
}
function PhysicalDoor({id,color,open,onDoor,reduced}:{id:RoomId;color:string;open:boolean;onDoor:(id:RoomId)=>void;reduced:boolean}){const leaf=useRef<THREE.Group>(null);const [hover,setHover]=useState(false);const {invalidate}=useThree();useEffect(()=>{const tween=gsap.to(leaf.current!.rotation,{y:open?-1.45:0,duration:reduced?0:1.2,onUpdate:invalidate});return()=>{tween.kill()}},[open,reduced,invalidate]);return <group position={[doorX[id],0,-12]} onPointerOver={()=>{setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor=''}} onClick={e=>{e.stopPropagation();onDoor(id)}}>
 <AtelierModel name="threshold-surround"/><Box p={[0,3,-7]} s={[3.8,6,.15]} c={color}/><Box p={[0,.035,-3.3]} s={[3.8,.07,7]} c="#968675"/><Box p={[-2,3,-3]} s={[.3,6,7]} c="#c7bca5"/><Box p={[2,3,-3]} s={[.3,6,7]} c="#c7bca5"/><Box p={[0,6,-3]} s={[4.3,.4,7]} c="#c7bca5"/>
 <group ref={leaf} position={[-1.8,0,.1]}><DoorPanel id={id} hover={hover} reduced={reduced}/>{[.35,2.9,5.45].map(y=><Box key={y} p={[1.8,y,.12]} s={[3.3,.06,.08]} c="#bca470" metal={.65}/>)}{[.3,3.3].map(x=><Box key={x} p={[x,2.9,.12]} s={[.06,5.2,.08]} c="#bca470" metal={.65}/>)}{id==='glow'&&[-1,0,1].map(n=><Box key={n} p={[1.8+n*.6,4.1,.13]} s={[.045,1.8,.08]} c="#cbb273" metal={.7}/>)}{id==='hush'&&<mesh position={[1.8,4.3,.16]}><torusGeometry args={[1,.045,8,40,Math.PI]}/><meshStandardMaterial color="#d6dcc7"/></mesh>}{id==='echo'&&[1.5,4.2].map(y=><mesh key={y} position={[1.8,y,.17]}><torusGeometry args={[.65,.045,8,32]}/><meshStandardMaterial color="#9a9b91" metalness={.6}/></mesh>)}{id==='pulse'&&[-1,0,1].map(n=><group key={n} position={[1.8,3.5+n*.65,.16]} rotation-z={-.35}><Box p={[0,0,0]} s={[2.5,.08,.08]} c="#c4a08a" metal={.6}/></group>)}<Box p={[3.12,2.7,.22]} s={[.06,.55,.1]} c="#d4b778" metal={.8}/></group>
 <mesh position={[0,6.65,.2]}><planeGeometry args={[3.5,.5]}/><meshBasicMaterial map={inscriptionTexture(id.toUpperCase())} transparent/></mesh>{hover&&<mesh position={[0,1,.25]}><planeGeometry args={[2.8,.4]}/><meshBasicMaterial transparent map={inscriptionTexture('Step inside')}/></mesh>}
 </group>}
export function DoorJourney({target,reduced,onArrival}:{target:RoomId|null;reduced:boolean;onArrival:()=>void}){const {camera,invalidate}=useThree();useEffect(()=>{if(!target)return;const aim=camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(14).add(camera.position);const update=()=>{camera.lookAt(aim);invalidate()};const tl=gsap.timeline({onUpdate:update,onComplete:onArrival});tl.to(aim,{x:doorX[target],y:2.7,z:-14,duration:reduced?0:1.8,ease:'power2.inOut'},0);tl.to(camera.position,{x:doorX[target],y:2.7,z:-6,duration:reduced?0:1.8,ease:'power2.inOut'}).to(camera.position,{z:-13.1,duration:reduced?0:1.4,ease:'power2.inOut'});return()=>{tl.kill()}},[target,reduced,camera,invalidate,onArrival]);return null}
export function MemorySurface({memory,onClick}:{memory?:Memory;onClick:()=>void}){const [preview,setPreview]=useState<{path:string;blob:Blob}>();
 const path=memory?.visual.previewPath??memory?.media?.pictures[0];
 useEffect(()=>{let active=true;if(path&&!memory?.photos[0])download(path).then(blob=>{if(active)setPreview({path,blob})}).catch(()=>{});return()=>{active=false}},[path,memory?.photos]);
 const url=useBlobUrl(memory?.photos[0]??(path&&preview?.path===path?preview.blob:undefined));const [map,setMap]=useState<THREE.Texture|null>(null);const [hover,setHover]=useState(false);const {invalidate}=useThree();const label=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=180;const x=c.getContext('2d')!;x.fillStyle='#eee7d6';x.fillRect(0,0,768,180);x.fillStyle='#3c4039';x.font='32px Georgia';x.textAlign='center';x.fillText(memory?.title??'Create a memory',384,72,710);x.font='23px sans-serif';x.fillText(memory?.date??'A day is waiting here',384,124);return new THREE.CanvasTexture(c)},[memory]);
 useEffect(()=>()=>label.dispose(),[label]);useEffect(()=>{let alive=true;let texture:THREE.Texture|undefined;setMap(null);if(url)new THREE.TextureLoader().load(url,t=>{texture=t;if(!alive){t.dispose();return}t.colorSpace=THREE.SRGBColorSpace;const aspect=t.image.width/t.image.height,frame=1.95/2.45;if(aspect>frame){t.repeat.x=frame/aspect;t.offset.x=(1-t.repeat.x)/2}else{t.repeat.y=aspect/frame;t.offset.y=(1-t.repeat.y)/2}setMap(t);invalidate()});return()=>{alive=false;texture?.dispose()}},[url,invalidate]);
 return <group><mesh position={[0,0,.13]} onClick={e=>{e.stopPropagation();onClick()}} onPointerOver={()=>{setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor=''}}><planeGeometry args={[1.95,2.45]}/>{map ? <meshBasicMaterial key={map.uuid} map={map} toneMapped={false}/> : <meshStandardMaterial color={hover?'#ddd0ad':'#c7bfac'} roughness={.9}/>}</mesh>{!memory&&<group position={[0,0,.16]}><Box p={[0,0,0]} s={[.4,.025,.02]} c="#6c705f"/><Box p={[0,0,0]} s={[.025,.4,.02]} c="#6c705f"/></group>}<mesh position={[0,-1.64,.15]}><planeGeometry args={[1.8,.42]}/><meshBasicMaterial map={label}/></mesh></group>
}
