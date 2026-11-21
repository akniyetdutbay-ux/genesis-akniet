import type { Memory } from './memories';
import { interpret } from './memories';
import type { RoomId } from './data';

// Original illustrated landscapes, generated locally; no external image service or visitor data.
async function landscape(room: RoomId, variation: number): Promise<Blob> {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
  const c = canvas.getContext('2d')!;
  const palettes = {glow:['#f5ddab','#d99d66','#8d9970','#4d6755'],hush:['#dce8df','#9ab7b2','#728f86','#486b67'],echo:['#d4d3d6','#8d9aaf','#68768e','#424e68'],pulse:['#e8b9a1','#a95c62','#754555','#3e354b']};
  const p=palettes[room], sky=c.createLinearGradient(0,0,0,800);
  sky.addColorStop(0,p[0]);sky.addColorStop(1,p[1]);c.fillStyle=sky;c.fillRect(0,0,1200,800);
  c.fillStyle='#fff3d8';c.beginPath();c.arc(830-variation*180,205+variation*35,64,0,Math.PI*2);c.fill();
  for(let layer=0;layer<3;layer++){
    c.fillStyle=p[Math.min(3,layer+1)];c.beginPath();c.moveTo(0,800);
    for(let x=0;x<=1200;x+=15)c.lineTo(x,390+layer*115+Math.sin(x/220+layer+variation)*65+Math.cos(x/130+variation)*23);
    c.lineTo(1200,800);c.fill();
  }
  c.strokeStyle=p[0];c.lineWidth=3;c.globalAlpha=.4;
  for(let i=0;i<16;i++){const y=630+i*10;c.beginPath();c.moveTo(220+Math.sin(i)*70,y);c.lineTo(920+Math.cos(i)*70,y);c.stroke()}
  c.globalAlpha=1;
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Sample image generation failed.')),'image/png'));
}

function sampleAudio(): Blob {
  const rate=16000, seconds=6, n=rate*seconds, buffer=new ArrayBuffer(44+n*2), view=new DataView(buffer);
  const text=(offset:number,value:string)=>[...value].forEach((char,i)=>view.setUint8(offset+i,char.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,36+n*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const t=i/rate,envelope=Math.min(1,t,seconds-t);const sample=(Math.sin(t*220*Math.PI*2)+Math.sin(t*330*Math.PI*2))*.09*envelope;view.setInt16(44+i*2,sample*32767,true)}
  return new Blob([buffer],{type:'audio/wav'});
}

export async function sampleMemories():Promise<Memory[]> {
  const stories: Array<[RoomId,string,string]> = [
    ['glow','The long way home','We took the long way home, happy to have nowhere else to be. The last light turned the hills to gold.'],
    ['hush','A morning without hurry','The water barely moved. I put my phone away and listened to the quiet before the day began.'],
    ['echo','A familiar horizon','This view brought back the journey we used to make every autumn. I remembered the silence between our conversations.'],
    ['pulse','Before the first step','My heart was racing. Across the valley, the light was changing. I felt ready to begin something new.'],
  ];
  const audio=sampleAudio();
  return Promise.all(stories.map(async([room,title,diary])=>({id:`museum-demo-v1-${room}`,kind:'demo' as const,room,slot:0,date:'2026-06-14',title,diary,photos:await Promise.all([landscape(room,0),landscape(room,1),landscape(room,2)]),audio,musicUrl:'',visual:interpret(diary,room),createdAt:'2026-06-14T12:00:00.000Z'})));
}
