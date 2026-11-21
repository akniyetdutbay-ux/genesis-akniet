import { useEffect,useState } from 'react';
import {client} from './cloud';
import App from './App';

export function AccountRoot(){
 const [owner,setOwner]=useState<string|null|undefined>(client?undefined:null);
 const [recover,setRecover]=useState(false);
 useEffect(()=>{if(!client)return;const {data}=client.auth.onAuthStateChange((event,session)=>{
 setOwner(session?.user.id??null);
 if(event==='PASSWORD_RECOVERY')setRecover(true);
 });return ()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>{if(owner)void client!.from('profiles').upsert({user_id:owner},{onConflict:'user_id',ignoreDuplicates:true}).then(({error})=>{if(error)console.error('Profile initialization failed',error.code)})},[owner]);
 if(owner===undefined)return <p>Opening your museum…</p>;
 if(recover)return <Account recovery done={()=>setRecover(false)}/>;
 return <App key={owner??'guest'} owner={owner}/>;
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
 const {error}=recovery?await auth.updateUser({password}):mode==='reset'?await auth.resetPasswordForEmail(email,{redirectTo:redirect}):mode==='signup'?await auth.signUp({email,password,options:{emailRedirectTo:redirect}}):await auth.signInWithPassword({email,password});
 if(error)throw error;
 if(recovery)done?.();else setMessage(mode==='login'?'Signed in.':'Check your email to continue.');
 }catch(e){setMessage(e instanceof Error?e.message:'Request failed. Try again.')}finally{setBusy(false)}
 }
 return <section className="memory-editor"><h3>{recovery?'Choose a new password':'Your museum account'}</h3>{!recovery&&<><button onClick={async()=>{const {error}=await auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect}});if(error)setMessage(error.message)}}>Continue with Google</button><div>{(['login','signup','reset'] as const).map((m,i)=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setMessage('')}}>{['Sign in','Register','Forgot password'][i]}</button>)}</div></>}<form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget)}}>{!recovery&&<label>Email<input type="email" required name="email" autoComplete="email"/></label>}{(recovery||mode!=='reset')&&<label>Password<input type="password" required name="password" minLength={mode==='signup'||recovery?8:1} autoComplete={mode==='login'&&!recovery?'current-password':'new-password'}/></label>}<button disabled={busy}>{busy?'Please wait…':recovery?'Save password':mode==='reset'?'Send recovery email':mode==='signup'?'Create account':'Sign in with email'}</button></form><p role="status">{message}</p></section>
}
