// Container track declarations are useful when a browser can play a video but
// does not expose audioTracks or decoded-byte counters to JavaScript.
export async function declaresAudio(file:Blob):Promise<boolean>{
 const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer);
 if(file.type==='video/webm'){
  function integer(pos:number,id:boolean){
   const first=bytes[pos];let mask=128,length=1;
   while(mask&&!(first&mask)){mask>>=1;length++}
   if(!mask||pos+length>bytes.length||length>(id?4:8))return;
   let value=id?first:first&(mask-1),unknown=!id&&value===mask-1;
   for(let i=1;i<length;i++){value=value*256+bytes[pos+i];unknown=unknown&&bytes[pos+i]===255}
   return {value,length,unknown};
  }
  function tracks(start:number,end:number,level:number):boolean{
   const containers=[0x18538067,0x1654ae6b,0xae]; // Segment, Tracks, TrackEntry
   for(let pos=start;pos<end;){
    const id=integer(pos,true);if(!id)return false;
    const size=integer(pos+id.length,false);if(!size)return false;
    const data=pos+id.length+size.length,next=size.unknown?end:data+size.value;
    if(next>end||next<=pos)return false;
    if(level===3&&id.value===0x83&&next-data===1&&bytes[data]===2)return true;
    if(id.value===containers[level]&&tracks(data,next,level+1))return true;
    pos=next;
   }
   return false;
  }
  return tracks(0,bytes.length,0);
 }
 const boxes=['moov','trak','mdia','hdlr'];
 function track(start:number,end:number,depth:number):boolean{
  for(let pos=start;pos+8<=end;){
   let length=view.getUint32(pos),header=8;
   const name=String.fromCharCode(...bytes.subarray(pos+4,pos+8));
   if(length===1){if(pos+16>end)return false;length=Number(view.getBigUint64(pos+8));header=16}
   if(length===0)length=end-pos;
   if(length<header||length>end-pos)return false;
   const data=pos+header,next=pos+length;
   if(name===boxes[depth]){
    if(depth===3){if(data+12<=next&&String.fromCharCode(...bytes.subarray(data+8,data+12))==='soun')return true}
    else if(track(data,next,depth+1))return true;
   }
   pos=next;
  }
  return false;
 }
 return track(0,bytes.length,0);
}

