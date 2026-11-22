// Atmospheric Diary Reading Room (Claude UX). Replaces the plain white reading page inside
// Living Memory. A painted "plate" interprets the day (season, weather, time, place, gallery)
// beside a typeset diary. Pure SVG + CSS: no images downloaded, no 3D, no network.
// Soundtrack playback stays entirely in MemoryTheatre (Codex); this view only names the song.
import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, Music2 } from 'lucide-react';
import type { Memory } from './memories';
import { readAtmosphere, type Atmosphere } from './diaryAtmosphere';
import { useTheme } from './theme';
import './diary.css';

const MOVEMENT = { glow: 'Impressionism', hush: 'Tonalism', echo: 'Romanticism', pulse: 'Abstraction' } as const;
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

/** The painted plate: a small composition assembled from the atmosphere's signals. */
function Plate({ a, seed }: { a: Atmosphere; seed: number }) {
    const r = rng(seed), p = a.palette, layers: ReactNode[] = [];
    const night = a.time === 'night', evening = a.time === 'evening', morning = a.time === 'morning';
    const overcast = a.weather === 'rain' || a.weather === 'snow' || a.weather === 'fog' || a.weather === 'cloud' || a.weather === 'storm';
    // Sky light: sun, low evening sun, or moon and stars.
    if (night) {
        layers.push(<g key="moon" className="plate-sky"><circle cx="292" cy="118" r="34" fill={p.glow} opacity=".9"/><circle cx="306" cy="108" r="30" fill="url(#ground)"/>
            {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={20 + r() * 360} cy={20 + r() * 230} r={.6 + r() * 1.4} fill={p.glow} opacity={.35 + r() * .5}/>)}</g>);
    } else {
        const y = evening ? 300 : morning ? 220 : 130, x = evening ? 110 : morning ? 300 : 260;
        layers.push(<g key="sun" className="plate-sky" opacity={overcast ? .35 : 1}><circle cx={x} cy={y} r="120" fill="url(#halo)"/><circle cx={x} cy={y} r={evening ? 44 : 34} fill={p.glow} opacity=".95"/></g>);
    }
    // Place: the horizon the day happened in.
    if (a.place === 'sea') layers.push(<g key="sea" className="plate-place">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${380 + i * 22} q 50 -${6 + i} 100 0 t 100 0 t 100 0 t 100 0`} fill="none" stroke={p.accent} strokeWidth={1 + i * .15} opacity={.22 + i * .05}/>)}</g>);
    else if (a.place === 'mountain') layers.push(<g key="mtn" className="plate-place"><path d="M0 420 L70 330 L120 380 L190 270 L260 360 L310 310 L400 400 V600 H0Z" fill={p.soft} opacity=".28"/><path d="M0 470 L90 380 L170 450 L250 370 L330 440 L400 410 V600 H0Z" fill={p.accent} opacity=".22"/></g>);
    else if (a.place === 'city') layers.push(<g key="city" className="plate-place">{Array.from({ length: 12 }, (_, i) => { const h = 50 + r() * 140, w = 22 + r() * 18; return <rect key={i} x={i * 34 - 6} y={470 - h} width={w} height={h + 130} fill={i % 3 ? p.soft : p.accent} opacity={.16 + r() * .14}/>; })}</g>);
    else if (a.place === 'forest') layers.push(<g key="forest" className="plate-place">{Array.from({ length: 14 }, (_, i) => { const x = i * 30 + r() * 12, h = 90 + r() * 110; return <path key={i} d={`M${x} 480 L${x + 16} ${480 - h} L${x + 32} 480Z`} fill={i % 2 ? p.accent : p.soft} opacity={.18 + r() * .12}/>; })}</g>);
    else if (a.place === 'home') layers.push(<g key="home" className="plate-place" fill="none" stroke={p.soft} opacity=".38"><rect x="120" y="150" width="160" height="210"/><path d="M200 150 V360 M120 255 H280"/></g>);
    else layers.push(<path key="horizon" className="plate-place" d="M0 440 C 120 420 260 452 400 430 V600 H0Z" fill={p.accent} opacity=".14"/>);
    // Season: a quiet motif in the foreground.
    if (a.season === 'spring') layers.push(<g key="spring" className="plate-season" stroke={p.accent} fill="none" opacity=".55">{[60, 300].map(x => <g key={x}><path d={`M${x} 600 C ${x + 10} 540 ${x - 14} 500 ${x + 6} 450`}/>{[0, 1, 2, 3].map(k => <ellipse key={k} cx={x + (k % 2 ? 14 : -10)} cy={560 - k * 28} rx="10" ry="4.5" transform={`rotate(${k % 2 ? -30 : 30} ${x} ${560 - k * 28})`} fill={p.accent} opacity=".5"/>)}</g>)}</g>);
    if (a.season === 'summer') layers.push(<g key="summer" className="plate-season" stroke={p.accent} opacity=".45">{Array.from({ length: 40 }, (_, i) => { const x = r() * 400; return <path key={i} d={`M${x} 600 q ${r() * 8 - 4} -${30 + r() * 40} ${r() * 16 - 8} -${50 + r() * 40}`} fill="none"/>; })}</g>);
    if (a.season === 'autumn') layers.push(<g key="autumn" className="plate-season plate-drift">{Array.from({ length: 14 }, (_, i) => <path key={i} d="M0 -9 C 7 -5 7 5 0 9 C -7 5 -7 -5 0 -9Z" fill={i % 3 ? p.accent : p.glow} opacity={.35 + r() * .35} transform={`translate(${r() * 400} ${200 + r() * 380}) rotate(${r() * 180}) scale(${.8 + r() * .9})`}/>)}</g>);
    if (a.season === 'winter') layers.push(<g key="winter" className="plate-season" stroke={p.soft} fill="none" opacity=".45"><path d="M330 600 C 320 520 340 470 320 400 M325 470 L290 430 M322 420 L350 380 M331 520 L370 490"/></g>);
    // Weather over everything.
    if (a.weather === 'rain' || a.weather === 'storm') layers.push(<rect key="rain" className="plate-weather plate-rain" width="400" height="600" fill="url(#rain)"/>);
    if (a.weather === 'snow') layers.push(<rect key="snow" className="plate-weather plate-snow" width="400" height="600" fill="url(#snow)"/>);
    if (a.weather === 'fog' || a.weather === 'cloud') layers.push(<g key="fog" className="plate-weather plate-fog">{[180, 300, 420].map((y, i) => <ellipse key={y} cx={120 + i * 90} cy={y} rx="260" ry="40" fill={p.ground2} opacity=".55"/>)}</g>);
    if (a.weather === 'wind') layers.push(<g key="wind" className="plate-weather" stroke={p.soft} fill="none" opacity=".4">{[200, 260, 330].map(y => <path key={y} d={`M-10 ${y} C 90 ${y - 30} 160 ${y + 30} 260 ${y} S 380 ${y - 20} 420 ${y}`}/>)}</g>);
    if (a.weather === 'storm') layers.push(<path key="bolt" className="plate-weather" d="M250 60 L220 170 L250 170 L215 290" fill="none" stroke={p.glow} strokeWidth="2" opacity=".6"/>);
    // Gallery language: the brushwork of each room.
    if (a.room === 'glow') layers.push(<g key="dabs" className="plate-room">{Array.from({ length: 70 }, (_, i) => <ellipse key={i} cx={r() * 400} cy={r() * 600} rx={2 + r() * 5} ry={1 + r() * 2} transform={`rotate(${r() * 60 - 30})`} fill={[p.glow, p.accent, p.ground2][i % 3]} opacity={.18 + r() * .25}/>)}</g>);
    if (a.room === 'hush') layers.push(<rect key="still" className="plate-room" x="0" y="300" width="400" height="300" fill={p.ground} opacity=".35"/>);
    if (a.room === 'echo') layers.push(<g key="arch" className="plate-room" fill="none" stroke={p.soft} opacity=".3">{[0, 1, 2].map(i => <path key={i} d={`M${120 + i * 22} 600 V ${300 + i * 26} a ${80 - i * 22} ${80 - i * 22} 0 0 1 ${160 - i * 44} 0 V600`}/>)}</g>);
    if (a.room === 'pulse') layers.push(<g key="kandinsky" className="plate-room"><circle cx="120" cy="200" r="64" fill={p.accent} opacity=".55"/><circle cx="250" cy="330" r="90" fill="none" stroke={p.ink} strokeWidth="2" opacity=".35"/><path d="M40 520 L360 120" stroke={p.glow} strokeWidth="3" opacity=".55"/><path d="M260 520 a 90 90 0 0 1 120 -110" stroke={p.accent} strokeWidth="3" fill="none" opacity=".6"/></g>);
    return <svg className="plate" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.ground2}/><stop offset="1" stopColor={p.ground}/></linearGradient>
            <radialGradient id="halo"><stop offset="0" stopColor={p.glow} stopOpacity=".7"/><stop offset="1" stopColor={p.glow} stopOpacity="0"/></radialGradient>
            <pattern id="rain" width="24" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(14)"><path d="M12 0 V18" stroke={p.soft} strokeWidth="1" opacity=".55"/><path d="M2 26 V38" stroke={p.soft} strokeWidth=".8" opacity=".35"/></pattern>
            <pattern id="snow" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="9" cy="12" r="1.8" fill={p.glow}/><circle cx="31" cy="30" r="1.2" fill={p.glow} opacity=".8"/><circle cx="38" cy="6" r=".9" fill={p.glow} opacity=".7"/></pattern>
            <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .35 0"/></filter>
        </defs>
        <rect width="400" height="600" fill="url(#ground)"/>
        {layers}
        <rect width="400" height="600" filter="url(#grain)" opacity=".5"/>
    </svg>;
}

export function DiaryReadingRoom({ memory, prints, dateText, onBack, onPhoto }: { memory: Memory; prints: string[]; dateText: string; onBack: () => void; onPhoto: (index: number) => void }) {
    const { theme } = useTheme();
    const a = useMemo(() => readAtmosphere(memory.diary, memory.date, memory.room, theme, memory.visual.studies?.[0]?.color), [memory.diary, memory.date, memory.room, memory.visual.studies, theme]);
    const paragraphs = memory.diary.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const song = memory.track ? `${memory.track.title} · ${memory.track.artist}` : memory.soundtrack?.title;
    const style = { '--d-ground': a.palette.ground, '--d-ground2': a.palette.ground2, '--d-ink': a.palette.ink, '--d-soft': a.palette.soft, '--d-accent': a.palette.accent, '--d-glow': a.palette.glow } as CSSProperties;
    const source = [a.fromText.weather || a.fromText.time || a.fromText.place || a.fromText.season ? 'read from your words' : '', !a.fromText.season && a.season ? 'season from the date' : ''].filter(Boolean).join(' · ');
    return <section className={`reading-room diary-room diary-${memory.room} ${a.dark ? 'is-dark' : 'is-light'}`} style={style} aria-label="Diary" data-season={a.season ?? 'none'} data-weather={a.weather ?? 'none'} data-time={a.time ?? 'none'}>
        <div className="diary-plate"><Plate a={a} seed={hash(memory.id)}/>
            <p className="diary-plate-caption"><span>{a.caption}</span>{source && <small>{source}</small>}</p></div>
        <article className="diary-page">
            <button className="diary-back" onClick={onBack}><ArrowLeft size={16} strokeWidth={1.5}/>Back to memory</button>
            <p className="diary-kicker">Diary <i aria-hidden="true"/> {memory.room} · {MOVEMENT[memory.room]}</p>
            <time dateTime={memory.date}>{dateText}</time>
            <h2>{memory.title}</h2>
            <div className="diary-text">{paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className="diary-empty">No words were kept for this day — only its pictures.</p>}</div>
            {song && <p className="diary-song"><Music2 size={15} strokeWidth={1.5} aria-hidden="true"/><span>{song}</span></p>}
            {prints.length > 0 && <nav className="diary-prints" aria-label="Photographs of this day">{prints.slice(0, 8).map((url, i) => <button key={i} onClick={() => onPhoto(i)} aria-label={`Return to photograph ${i + 1}`}><img src={url} alt="" loading="lazy"/></button>)}</nav>}
        </article>
    </section>;
}
