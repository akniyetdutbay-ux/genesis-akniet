import { lazy,Suspense,useEffect,useState } from 'react';
import {client} from './cloud';
const App=lazy(()=>import('./App'));

export function AccountRoot(){
 const [owner,setOwner]=useState<string|null|undefined>(client?undefined:null);
 const [demo,setDemo]=useState(()=>sessionStorage.getItem("museum-demo")==="yes");
 const [recover,setRecover]=useState(false);
 useEffect(()=>{if(!client)return;const {data}=client.auth.onAuthStateChange((event,session)=>{
 if(event==='SIGNED_OUT'||session){sessionStorage.removeItem('museum-demo');setDemo(false)}
 if(event==='SIGNED_IN'&&sessionStorage.getItem('museum-login')==='yes'){
   sessionStorage.removeItem('museum-login');sessionStorage.removeItem('museum-create');history.replaceState(null,'',location.pathname);
 }
 setOwner(session?.user.id??null);
 if(event==='PASSWORD_RECOVERY')setRecover(true);
 });return ()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>{if(owner)void client!.from('profiles').upsert({user_id:owner},{onConflict:'user_id',ignoreDuplicates:true}).then(({error})=>{if(error)console.error('Profile initialization failed',error.code)})},[owner]);
 if(owner===undefined)return <p>Opening your museumâ€¦</p>;
 if(recover||(!owner&&!demo))return <main className="admission"><div className="admission-cover"><img width="52" height="52" src="/favicon.svg" alt=""/><h1>Museum<br/>of Days</h1><p>Every day deserves to be remembered.</p></div><div className="admission-form"><Account recovery={recover} done={()=>setRecover(false)}/>{!recover&&<button className="demo-entry" onClick={()=>{sessionStorage.setItem('museum-demo','yes');setDemo(true)}}>Explore Demo</button>}</div></main>;
 return <Suspense fallback={<p>Opening the museum…</p>}><App key={owner??'guest'} owner={owner}/></Suspense>;
}

export function Account({recovery=false,done}:{recovery?:boolean;done?:()=>void}){
 const [mode,setMode]=useState<'login'|'signup'|'reset'>('login');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 if(!client)return <p>Cloud accounts are unavailable in this build.</p>;
 const auth=client.auth;
 const redirect=location.origin+location.pathname;
 async function submit(form:HTMLFormElement){
 setBusy(true);setMessage('');
 const fields=new FormData(form), email=String(fields.get('email')??'').trim(),password=String(fields.get('password')??'');
 try{
 if(!recovery&&mode!=='reset')sessionStorage.setItem('museum-login','yes');
 const {error}=recovery?await auth.updateUser({password}):mode==='reset'?await auth.resetPasswordForEmail(email,{redirectTo:redirect}):mode==='signup'?await auth.signUp({email,password,options:{emailRedirectTo:redirect}}):await auth.signInWithPassword({email,password});
 if(error)throw error;
 if(recovery)done?.();else setMessage(mode==='login'?'Signed in.':'Check your email to continue.');
 }catch(e){setMessage(e instanceof Error?e.message:'Request failed. Try again.')}finally{setBusy(false)}
 }
 return <section className="account-card"><h2>{recovery?'Choose a new password':mode==='reset'?'Reset your password':mode==='signup'?'Create your museum account':'Welcome to the museum'}</h2>
 {!recovery&&<div className="account-tabs">{(['login','signup'] as const).map((m,i)=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setMessage('')}}>{['Sign In','Sign Up'][i]}</button>)}</div>}
 <form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget)}}>
 {!recovery&&<label>Email<input type="email" required name="email" autoComplete="email"/></label>}
 {(recovery||mode!=='reset')&&<label>Password<input type="password" required name="password" minLength={mode==='signup'||recovery?8:1} autoComplete={mode==='login'&&!recovery?'current-password':'new-password'}/></label>}
 <button className="solid-button" disabled={busy}>{busy?'Please wait…':recovery?'Save password':mode==='reset'?'Send recovery email':'Continue with Email'}</button></form>
 {!recovery&&<><button className="demo-entry" onClick={()=>{setMode('reset');setMessage('')}}>Forgot Password?</button><div className="account-rule">OR</div><button className="google-entry" onClick={async()=>{sessionStorage.setItem('museum-login','yes');try{const {error}=await auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect}});if(error)throw error}catch(e){setMessage(e instanceof Error?e.message:'Google sign-in could not start.')}}}><GoogleMark/>Continue with Google</button></>}
 <p role="status">{message}</p></section>
}
function GoogleMark(){return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.9-3.6-11.5-8.4H5.7v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.5 27.5a12 12 0 0 1 0-7V15H5.7a20 20 0 0 0 0 18z"/><path fill="#EA4335" d="M24 12.1c3 0 5.6 1 7.7 3l5.8-5.7A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.7 15l6.8 5.5c1.6-4.9 6.2-8.4 11.5-8.4z"/></svg>}
