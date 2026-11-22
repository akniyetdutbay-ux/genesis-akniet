// "Your space" — museum settings (Claude UX). Account, appearance, personalisation and the
// existing accessibility/performance controls (moved under Advanced, behaviour unchanged).
// Account data comes only from the live Supabase session; nothing is invented.
import { useEffect, useState } from 'react';
import { LogOut, Moon, Sun, Monitor, ChevronDown } from 'lucide-react';
import { client } from './cloud';
import { Account } from './Account';
import { useTheme, type ThemeChoice } from './theme';
import './settings.css';

interface Props {
    owner: string | null; memoryCount: number; onOpenCollection: () => void;
    sound: boolean; onToggleSound: () => void; audioError: string;
    motion: 'system' | 'reduced'; setMotion: (m: 'system' | 'reduced') => void; systemReduced: boolean;
    quality: 'high' | 'low'; setQuality: (q: 'high' | 'low') => void;
    flat: boolean; setFlat: (f: boolean) => void;
}
const THEMES: { id: ThemeChoice; label: string; note: string; Icon: typeof Moon }[] = [
    { id: 'dark', label: 'Dark', note: 'Graphite and bronze', Icon: Moon },
    { id: 'light', label: 'Light', note: 'Museum paper', Icon: Sun },
    { id: 'system', label: 'System', note: 'Follow this device', Icon: Monitor },
];

function AccountSection({ owner, memoryCount, onOpenCollection }: Pick<Props, 'owner' | 'memoryCount' | 'onOpenCollection'>) {
    const [email, setEmail] = useState<string>();
    const [confirmed, setConfirmed] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const [state, setState] = useState<'idle' | 'leaving' | 'failed'>('idle');
    useEffect(() => {
        if (!owner || !client) return;
        let live = true;
        void client.auth.getSession().then(({ data }) => { if (!live) return; setEmail(data.session?.user.email ?? undefined); setConfirmed(!!data.session?.user.email_confirmed_at); });
        return () => { live = false; };
    }, [owner]);
    async function signOut() {
        if (!client || state === 'leaving') return;
        setState('leaving');
        // Ends this browser's session only. Memories, photographs and privacy settings stay in the account.
        const { error } = await client.auth.signOut();
        if (error) setState('failed');
    }
    if (!owner) return <section className="settings-section" aria-labelledby="set-account">
        <header><p className="settings-index">01</p><h3 id="set-account">Account</h3></header>
        <div className="settings-body">
            <div className="account-line"><span className="monogram" aria-hidden="true">·</span><div><strong>Guest visit</strong><p>Demo memories stay in this browser and are not shared. Sign in to keep a private collection across devices.</p></div></div>
            {client ? (signingIn ? <div className="settings-signin"><Account/></div> : <button className="settings-button" onClick={() => setSigningIn(true)}>Sign in or create an account</button>) : <p className="settings-note">Accounts are not available in this build.</p>}
        </div>
    </section>;
    const initial = (email ?? '?').trim().charAt(0).toLocaleUpperCase();
    return <section className="settings-section" aria-labelledby="set-account">
        <header><p className="settings-index">01</p><h3 id="set-account">Account</h3></header>
        <div className="settings-body">
            <div className="account-line"><span className="monogram" aria-hidden="true">{initial}</span><div><strong className="account-email">{email ?? 'Loading your account…'}</strong><p>{confirmed ? 'Signed in · email confirmed' : 'Signed in'} · Private cloud collection</p></div></div>
            <dl className="account-facts"><div><dt>Your memories</dt><dd>{memoryCount}</dd></div><div><dt>Visibility</dt><dd>Private to you</dd></div></dl>
            <div className="settings-actions"><button className="settings-button" onClick={onOpenCollection}>Open your collection</button>
                <button className="settings-button quiet" onClick={() => void signOut()} disabled={state === 'leaving'}><LogOut size={16} strokeWidth={1.5} aria-hidden="true"/>{state === 'leaving' ? 'Signing out…' : 'Sign out'}</button></div>
            {state === 'failed' && <p role="alert">Sign out could not be completed. Check your connection and try again.</p>}
            <p className="settings-note">Signing out keeps every memory, photograph and soundtrack safely in your account.</p>
        </div>
    </section>;
}

export function MuseumSettings(props: Props) {
    const { choice, setChoice } = useTheme();
    const { sound, onToggleSound, audioError, motion, setMotion, systemReduced, quality, setQuality, flat, setFlat } = props;
    return <div className="museum-settings">
        <p className="dialog-intro">Your space in the museum: who you are here, how the rooms look to you, and how the visit behaves on this device.</p>
        <AccountSection owner={props.owner} memoryCount={props.memoryCount} onOpenCollection={props.onOpenCollection}/>
        <section className="settings-section" aria-labelledby="set-look">
            <header><p className="settings-index">02</p><h3 id="set-look">Appearance</h3></header>
            <div className="settings-body">
                <p className="settings-note">Colours of menus, the diary and the collection. The galleries keep their own light.</p>
                <div className="theme-choices" role="radiogroup" aria-label="Interface theme">
                    {THEMES.map(({ id, label, note, Icon }) => <button key={id} role="radio" aria-checked={choice === id} className={`theme-choice theme-${id}`} onClick={() => setChoice(id)}>
                        <span className="theme-swatch" aria-hidden="true"><Icon size={16} strokeWidth={1.5}/></span><span><strong>{label}</strong><small>{note}</small></span></button>)}
                </div>
            </div>
        </section>
        <section className="settings-section" aria-labelledby="set-personal">
            <header><p className="settings-index">03</p><h3 id="set-personal">Personalisation</h3></header>
            <div className="settings-body">
                <div className="setting-row"><div><h4>Museum ambience</h4><p>A quiet, original tonal soundscape in the halls. Your memories' own soundtracks are separate and unaffected.</p></div><button role="switch" aria-checked={sound} aria-label="Ambient sound" className={`toggle ${sound ? 'on' : ''}`} onClick={onToggleSound}><span/></button></div>
                {audioError && <p role="alert">{audioError}</p>}
            </div>
        </section>
        <details className="settings-section settings-advanced">
            <summary><span className="settings-index">04</span><span className="summary-title">Advanced settings</span><small>Motion, rendering and the lightweight view</small><ChevronDown size={18} strokeWidth={1.5} aria-hidden="true"/></summary>
            <div className="settings-body">
                <fieldset className="setting-block"><legend>Motion</legend><p>Reduced motion skips camera journeys.{systemReduced ? ' Your device already asks for reduced motion, so it stays on.' : ' Your system preference is always respected.'}</p><div className="segmented"><button aria-pressed={motion === 'system'} onClick={() => setMotion('system')}>Follow system</button><button aria-pressed={motion === 'reduced'} onClick={() => setMotion('reduced')}>Reduced</button></div></fieldset>
                <fieldset className="setting-block"><legend>Rendering quality</legend><p>Light uses fewer pixels and turns off real-time shadows — kinder to older phones.</p><div className="segmented"><button aria-pressed={quality === 'high'} onClick={() => setQuality('high')}>Detailed</button><button aria-pressed={quality === 'low'} onClick={() => setQuality('low')}>Light</button></div></fieldset>
                <div className="setting-row"><div><h4>Lightweight view</h4><p>A simple architectural fallback without 3D.</p></div><button role="switch" aria-label="Lightweight view" aria-checked={flat} className={`toggle ${flat ? 'on' : ''}`} onClick={() => setFlat(!flat)}><span/></button></div>
                <p className="settings-note">Motion, rendering and lightweight view apply to this visit. Your theme is remembered on this device.</p>
            </div>
        </details>
    </div>;
}
