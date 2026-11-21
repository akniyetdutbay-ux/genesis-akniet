import { useState } from 'react';
import { initializeDemo, resetDemoData } from './memories';

export function VisitorGuide({onChange}:{onChange:()=>Promise<void>}) {
 const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function update(reset:boolean){setBusy(true);setMessage('');try{if(reset)await resetDemoData();else await initializeDemo(true);await onChange();setConfirm(false);setMessage(reset?'Demo samples and marked test memories were removed. Personal memories are unchanged.':'The four sample memories are ready to explore.')}catch{setMessage('Local data could not be updated. Please try again.')}finally{setBusy(false)}}
 return <div className="visitor-guide">
  <p className="dialog-intro">A public demo, with a private collection.</p>
  <p>Your memories are saved only in this browser on this device. They are not uploaded or shared with other visitors. Use the same website address to return; clearing browser data removes them.</p>
  <ol><li>Enter the museum and click a physical door. The small gallery navigation also works with keyboard and touch.</li><li>Open a labelled demo memory to try Play, Pause, Replay and photo controls. Samples use original illustrated landscapes and a short original sound.</li><li>Choose an empty frame or “Create a memory”. Add a diary, photographs and a music link or permitted audio. Save, then reload to check your collection.</li></ol>
  <p>Keep “Mark as test memory” selected for disposable testing. Uncheck it for a personal memory that Reset Demo Data must preserve. Existing personal memories are preserved too.</p>
  <p>Music links open at their source. Audio never starts until you choose Play. Settings include reduced motion, lighter rendering and a lightweight view.</p>
  <div className="demo-actions"><button className="solid-button" disabled={busy} onClick={()=>void update(false)}>Restore sample memories</button><button className="text-button" disabled={busy} onClick={()=>setConfirm(true)}>Reset Demo Data</button></div>
  {confirm&&<div className="reset-confirm"><p>Remove only demo samples and marked test memories in this browser? Personal memories will stay. Samples will not return after reload unless you restore them.</p><button className="solid-button" disabled={busy} onClick={()=>void update(true)}>Remove demo and test memories</button><button className="text-button" disabled={busy} onClick={()=>setConfirm(false)}>Cancel reset</button></div>}
  {message&&<p role="status">{message}</p>}
 </div>;
}
