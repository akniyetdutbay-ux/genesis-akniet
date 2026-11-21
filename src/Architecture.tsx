import { MemorySurface } from './Exhibits';
import type { Memory } from './memories';
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { stoneTexture, inscriptionTexture, paintingTexture } from './textures';
import { exhibitionPosition, type Room } from './data';
type V3 = [
    number,
    number,
    number
];
const stone = '#e4dccc', brass = '#a58448';
const unitBox = new THREE.BoxGeometry(1, 1, 1);
export const Box = memo(function Box({ p, s, c = stone, metal = 0, rough = .8, texture = false, rotation = 0 }: {
    p: V3;
    s: V3;
    c?: string;
    metal?: number;
    rough?: number;
    texture?: boolean;
    rotation?: number;
}) { return <mesh position={p} scale={s} geometry={unitBox} rotation-y={rotation} castShadow receiveShadow><meshStandardMaterial color={c} roughness={rough} metalness={metal} map={texture ? stoneTexture() : null}/></mesh>; });
function Cylinder({ p, r, h, c = stone, r2, segments = 24 }: {
    p: V3;
    r: number;
    h: number;
    c?: string;
    r2?: number;
    segments?: number;
}) { return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[r2 ?? r, r, h, segments]}/><meshStandardMaterial color={c} roughness={.75} map={stoneTexture()}/></mesh>; }
function OliveTree({ p, scale = 1 }: {
    p: V3;
    scale?: number;
}) { return <group position={p} scale={scale}><Cylinder p={[0, .4, 0]} r={.34} r2={.43} h={.8} c="#a69b80"/><Cylinder p={[0, 1.35, 0]} r={.045} r2={.025} h={1.8} c="#74654a"/>{Array.from({ length: 7 }, (_, b) => <group key={b} position={[0, 1 + b * .12, 0]} rotation={[Math.sin(b) * .3, b * 2.4, (b % 2 ? 1 : -1) * .55]}><Cylinder p={[0, .52, 0]} r={.012} r2={.005} h={1.05} c="#6d6047"/>{Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[(i % 2 ? 1 : -1) * (.06 + i * .008), .22 + i * .07, Math.sin(i + b) * .09]} rotation={[.2, i * .7, (i % 2 ? 1 : -1) * .6]} scale={[.038, .14, .018]}><sphereGeometry args={[1, 7, 5]}/><meshStandardMaterial color={i % 3 ? '#596c43' : '#7e8b60'} roughness={.9}/></mesh>)}</group>)}</group>; }
function Arch({ width = 4.6, spring = 5.5, thickness = .38, depth = .45, p = [0, 0, 0], c = stone }: {
    width?: number;
    spring?: number;
    thickness?: number;
    depth?: number;
    p?: V3;
    c?: string;
}) {
    const geo = useMemo(() => { const r = width / 2, shape = new THREE.Shape(); shape.moveTo(-r - thickness, 0); shape.lineTo(-r - thickness, spring); shape.absarc(0, spring, r + thickness, Math.PI, 0, true); shape.lineTo(r + thickness, 0); shape.lineTo(r, 0); shape.lineTo(r, spring); shape.absarc(0, spring, r, 0, Math.PI, false); shape.lineTo(-r, 0); shape.closePath(); return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 40 }); }, [width, spring, thickness, depth]);
    return <mesh geometry={geo} position={p} castShadow receiveShadow><meshStandardMaterial color={c} map={stoneTexture()} roughness={.85}/></mesh>;
}
function Spandrel() { const geo = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-4, 5.5); s.lineTo(-4, 10.4); s.lineTo(4, 10.4); s.lineTo(4, 5.5); s.lineTo(2.3, 5.5); s.absarc(0, 5.5, 2.3, 0, Math.PI, false); s.lineTo(-4, 5.5); return new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 40 }); }, []); return <mesh geometry={geo} position={[0, 0, 4]} castShadow receiveShadow><meshStandardMaterial color={stone} map={stoneTexture()}/></mesh>; }
const Column = memo(function Column({ x, z, h = 7.8, r = .42 }: {
    x: number;
    z: number;
    h?: number;
    r?: number;
}) { return <group position={[x, 0, z]}><Box p={[0, .15, 0]} s={[r * 3, .3, r * 3]} texture/><Cylinder p={[0, .43, 0]} r={r * 1.25} h={.22}/><Cylinder p={[0, .62, 0]} r={r * 1.1} h={.15}/><Cylinder p={[0, h / 2 + .3, 0]} r={r} r2={r * .85} h={h - 1.1} segments={32}/>{Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <mesh key={i} position={[Math.sin(a) * r * .91, h / 2 + .3, Math.cos(a) * r * .91]}><cylinderGeometry args={[.035, .045, h - 1.3, 5]}/><meshStandardMaterial color="#c2b6a0" roughness={.9}/></mesh>; })}<Cylinder p={[0, h - .3, 0]} r={r * 1.15} h={.18}/><Box p={[0, h - .12, 0]} s={[r * 2.7, .24, r * 2.7]} texture/>{[-1, 1].map(sign => <mesh key={sign} position={[sign * r * .8, h - .35, r * .65]} rotation-x={Math.PI / 2}><torusGeometry args={[.15, .06, 8, 16]}/><meshStandardMaterial color={stone}/></mesh>)}</group>; });
function Gate({ side }: {
    side: number;
}) { return <group position={[side * 2.3, .16, 5.05]} rotation-y={side * -1.08}><group position={[-side * 1.12, 0, 0]}><Box p={[0, 2.65, 0]} s={[2.24, 5.3, .12]} c="#323c35" metal={.5}/>{[-1, 1].map(s => <Box key={s} p={[s * 1.1, 2.65, .1]} s={[.1, 5.5, .12]} c={brass} metal={.75} rough={.28}/>)}{[.12, .65, 2.0, 3.95, 5.3].map(y => <Box key={y} p={[0, y, .12]} s={[2.24, .08, .08]} c={brass} metal={.75}/>)}{Array.from({ length: 7 }, (_, i) => <Box key={i} p={[-.9 + i * .3, 2.85, .12]} s={[.033, 4.75, .045]} c={brass} metal={.75}/>)}{[1.15, 2.8, 4.6].flatMap((y, k) => [-.57, .57].map((x, j) => <group key={`${k}-${j}`} position={[x, y, .18]}><mesh><torusGeometry args={[.32, .026, 6, 24]}/><meshStandardMaterial color="#c2a360" metalness={.8} roughness={.25}/></mesh><mesh rotation-z={Math.PI / 4}><boxGeometry args={[.37, .37, .035]}/><meshStandardMaterial color={brass} metalness={.7}/></mesh><mesh><sphereGeometry args={[.07, 10, 8]}/><meshStandardMaterial color="#d2b976" metalness={.8}/></mesh></group>))}<Box p={[side * .82, 2.6, .25]} s={[.055, .5, .11]} c="#d8b970" metal={.8}/></group></group>; }
export const Exterior = memo(function Exterior() {
    return <group>
 <Box p={[0, -.68, 15]} s={[70, .4, 40]} c="#d1c9b9" texture/>
 {[0, 1, 2, 3].map(i => <Box key={i} p={[0, -.48 + i * .16, 8.5 - i * .6]} s={[20 - i * .5, .2, 5 - i * .8]} c={i % 2 ? '#d9d1c1' : '#c9c1b0'} texture/>)}
 {[-1, 1].map(side => <group key={side}><Box p={[side * 9, 5, 4.5]} s={[10, 10, 1.5]} texture/>{Array.from({ length: 13 }, (_, i) => <Box key={i} p={[side * 9, .4 + i * .73, 5.28]} s={[10, .022, .025]} c="#b8ad97"/>)}{[6.2, 10.5, 13].map(x => <group key={x}><Box p={[side * x, 4.1, 5.4]} s={[1.15, 7.4, .48]} texture/><Box p={[side * x, 7.95, 5.5]} s={[1.65, .35, .8]} texture/></group>)}<Box p={[side * 3.2, 2.75, 4.5]} s={[1.8, 5.5, 1.5]} texture/>{[3.6, 5.05].map(x => <Column key={x} x={side * x} z={6.05}/>)}<Box p={[side * 8.5, .4, 5.5]} s={[9, .8, 1.2]} texture/></group>)}
 <Spandrel />{[0, .2, .45].map((offset, i) => <Arch key={i} width={4.6 + offset * 2} thickness={.14} depth={.23} p={[0, 0, 5.25 + i * .16]} c={i === 1 ? '#cbbfa8' : stone}/>)}
 {Array.from({ length: 17 }, (_, i) => { const a = i * Math.PI / 16; return <mesh key={i} position={[Math.cos(a) * 2.82, 5.5 + Math.sin(a) * 2.82, 5.6]} rotation-z={a - Math.PI / 2} castShadow><boxGeometry args={[.19, .48, .32]}/><meshStandardMaterial color={i % 2 ? '#ded5c3' : '#d0c4ad'} map={stoneTexture()}/></mesh>; })}
 <Box p={[0, 8.5, 5.5]} s={[11.8, .22, 1.05]} texture/><Box p={[0, 9.15, 5]} s={[28, 1.08, 1.3]} texture/>
 <mesh position={[0, 9.13, 5.67]}><planeGeometry args={[7.9, .97]}/><meshBasicMaterial transparent map={inscriptionTexture('M U S E U M   O F   D A Y S')}/></mesh>
 {[9.78, 10.05, 10.25].map((y, i) => <Box key={y} p={[0, y, 5.2]} s={[28 + i * .3, .17, 1.8 + i * .15]} texture/>)}
 {Array.from({ length: 61 }, (_, i) => <Box key={i} p={[-13.8 + i * .46, 9.7, 5.9]} s={[.19, .27, .28]} texture/>)}
 <Box p={[0, 10.65, 4.8]} s={[28, .6, 1.1]} texture/>
 {[-1, 1].map(side => <OliveTree key={side} p={[side * 6.7, .2, 7.8]} scale={1.2}/>)}
 <Gate side={-1}/><Gate side={1}/>
 </group>;
});
function Floor({ c = '#b8af98', length = 34 }: {
    c?: string;
    length?: number;
}) { return <group><Box p={[0, -.15, -length / 2 + 5]} s={[23, .3, length]} c={c} texture/>{[-8, -6, 6, 8].map(x => <Box key={x} p={[x, .012, -length / 2 + 5]} s={[.06, .015, length]} c="#655f52"/>)}{Array.from({ length: Math.ceil(length / 3) }, (_, i) => [...Array(7)].map((_, j) => <mesh key={`${i}-${j}`} position={[-9 + j * 3, .02, 5 - i * 3]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow><planeGeometry args={[.66, .66]}/><meshStandardMaterial color="#706f61" roughness={.55}/></mesh>))}</group>; }
function FrameArt({ p, width = 2, height = 2.5, room = 'glow', seed = 11, frame = brass, onClick, memory, empty = false }: {
    p: V3;
    width?: number;
    height?: number;
    room?: Room['id'];
    seed?: number;
    frame?: string;
    onClick?: () => void;
    memory?: Memory; empty?: boolean;
}) {
    return <group position={p}>
 <Box p={[0, 0, 0]} s={[width + .26, height + .26, .14]} c={frame} metal={.45} rough={.35}/><Box p={[0, 0, .085]} s={[width + .1, height + .1, .04]} c="#e7dfca"/>
 {empty ? <MemorySurface memory={memory} onClick={onClick!}/> : <mesh position={[0, 0, .12]} onClick={onClick} onPointerOver={onClick ? () => { document.body.style.cursor = 'pointer'; } : undefined} onPointerOut={onClick ? () => { document.body.style.cursor = ''; } : undefined}><planeGeometry args={[width, height]}/><meshStandardMaterial map={paintingTexture(room, seed)} roughness={1}/></mesh>}
 <Box p={[width * .32, -height / 2 - .4, .06]} s={[.52, .19, .03]} c="#e6e0d0"/>
 <Box p={[0, height / 2 + .34, .28]} s={[width * .65, .045, .22]} c={brass} metal={.6}/>
 </group>;
}
function Sculpture({ type = 'hall' }: {
    type?: string;
}) { return <group position={[0, 0, -14]}><Cylinder p={[0, .14, 0]} r={1.45} h={.28} c="#aaa494"/><Cylinder p={[0, .85, 0]} r={.73} h={1.45} c="#ddd5c4"/>{type === 'pulse' ? <group position={[0, 2.4, 0]} rotation={[.25, .45, .1]}>{[-.5, 0, .5].map((x, i) => <Box key={i} p={[x, i * .25, 0]} s={[.22, 2.4, .8]} c="#8f8980" metal={.85} rough={.25} rotation={-.3 + i * .3}/>)}</group> : <group position={[0, 2.45, 0]} rotation={[.15, .35, -.2]}><mesh castShadow><torusGeometry args={[1, .17, 18, 80]}/><meshStandardMaterial color={type === 'hush' ? '#a7b2a5' : brass} metalness={.7} roughness={.27}/></mesh><mesh rotation-y={1.05} castShadow><torusGeometry args={[.77, .12, 16, 64]}/><meshStandardMaterial color="#b7a372" metalness={.65} roughness={.3}/></mesh></group>}</group>; }
export const Hall = memo(function Hall() {
    return <group><Floor />
 <Box p={[-11, 5.6, -10]} s={[.6, 11.2, 31]} texture/><Box p={[11, 5.6, -10]} s={[.6, 11.2, 31]} texture/><Box p={[0, 5.6, -25]} s={[22, 11.2, .6]} texture/>
 {[1, -7, -15, -23].map(z => <group key={z}><Arch width={12} spring={4.9} thickness={.45} depth={.55} p={[0, 0, z]} c="#c9bca5"/>{[-1, 1].map(s => <Column key={s} x={s * 6} z={z + .4} h={5.2} r={.35}/>)}</group>)}
 <Box p={[0, 11.2, -10]} s={[22, .25, 31]} c="#c6bca6"/>{[-3, -11, -19].map(z => <group key={z}><Box p={[0, 11.02, z]} s={[5, .15, 4]} c="#e5e2d5"/><mesh position={[0, 10.91, z]} rotation-x={Math.PI / 2}><planeGeometry args={[4.3, 3.3]}/><meshBasicMaterial color="#fff4d6"/></mesh></group>)}
 <FrameArt p={[0, 4.2, -24.62]} width={3.5} height={4.4} room="glow" seed={24}/>
 {[-1, 1].flatMap(s => [-5, -14].map((z, i) => <group key={`${s}-${z}`} position={[s * 9.7, 0, z]} rotation-y={s * -Math.PI / 2}><Arch width={3.8} spring={3.8} thickness={.25} depth={.3}/><Box p={[0, 2.6, -.1]} s={[3.7, 5.2, .1]} c={['#999f8a', '#785052'][i]}/><FrameArt p={[0, 2.7, .07]} width={1.7} height={2.2} room={s === -1 ? 'hush' : 'echo'} seed={42 + i}/></group>))}
 <Sculpture />{[-1, 1].map(s => <group key={s}><Box p={[s * 4.5, .65, -8.3]} s={[2.7, .22, 1]} c="#78634c"/><Box p={[s * 4.5, .32, -8.3]} s={[2.1, .6, .65]} c="#a79b84"/></group>)}
 </group>;
});
export const Gallery = memo(function Gallery({ room, onSelect, selected }: {
    room: Room;
    onSelect: (i: number) => void;
    selected: number | null;
}) {
    const length = 40;
    const anchor=selected??0; const offset=anchor>3?exhibitionPosition(anchor,room.id)[2]+8:0;
    return <group>
 <group position={[0,0,offset]}><Floor c={room.floor} length={length}/><Box p={[-9.7, 6.8, -length / 2 + 4]} s={[.5, 13.6, length]} c={room.wall} texture/><Box p={[9.7, 6.8, -length / 2 + 4]} s={[.5, 13.6, length]} c={room.wall} texture/><Box p={[0, 6.8, -length + 5]} s={[20, 13.6, .5]} c={room.wall} texture/>
 <Box p={[0, 13.6, -length / 2 + 4]} s={[20, .3, length]} c={room.id === 'pulse' ? '#514649' : '#c9c8b8'}/>
 {[0, -8, -16, -24].map(z => <group key={z}><Arch width={17.8} spring={4.6} thickness={.25} p={[0, 0, z]} c={room.id === 'pulse' ? '#a88778' : '#c8c6b5'}/>{room.id !== 'pulse' && <><Column x={-8.9} z={z} h={4.7} r={.27}/><Column x={8.9} z={z} h={4.7} r={.27}/></>}</group>)}
 </group>{room.works.map((art, i) => { if(Math.abs(i-anchor)>3)return null; const p = exhibitionPosition(i, room.id); return <group key={`${room.id}-${art.seed}`} position={[p[0], 0, p[2]]} rotation-y={room.id === 'pulse' ? (i % 2 ? -.38 : .25) : room.id === 'echo' ? (i % 2 ? .12 : -.08) : 0}><Box p={[0, (room.id === 'pulse' ? 7 : room.id === 'echo' ? 6.3 : room.id === 'hush' ? 4.8 : 5.5) / 2, -.2]} s={[room.id === 'hush' ? 3.7 : 4.6, room.id === 'pulse' ? 7 : room.id === 'echo' ? 6.3 : room.id === 'hush' ? 4.8 : 5.5, .3]} c={room.id === 'glow' ? '#b5a086' : room.wall} texture/><Box p={[0, .15, -.14]} s={[4.8, .3, .55]} c={room.id === 'echo' ? '#544b43' : '#b9b4a5'}/><FrameArt p={[0, 2.7, .02]} width={1.95} height={2.45} room={room.id} seed={art.seed} empty memory={art.memory} frame={room.id === 'hush' ? '#aab3a1' : room.id === 'echo' ? '#776b56' : brass} onClick={() => onSelect(i)}/></group>; })}
 <Sculpture type={room.id}/>
 {room.id === 'hush' && <><Box p={[0, .55, -6]} s={[3, .3, 1.2]} c="#bfc5b7"/><Box p={[-1, .22, -6]} s={[.25, .5, .9]} c="#9ba794"/><Box p={[1, .22, -6]} s={[.25, .5, .9]} c="#9ba794"/>{[-1, 1].map(s => <mesh key={s} position={[s * 8.3, 3.8, -6]} rotation-y={s * .25}><planeGeometry args={[2, 6.8]}/><meshStandardMaterial color="#e1e5d9" transparent opacity={.36} side={THREE.DoubleSide}/></mesh>)}</>}
 {room.id === 'echo' && [-1, 1].flatMap(s => Array.from({ length: 15 }, (_, i) => <Cylinder key={`${s}-${i}`} p={[s * (7 + i * .12), 3.6, -12]} r={.13} h={7.2} c={i % 2 ? '#646e7d' : '#7e8794'}/>))}
 {room.id === 'pulse' && [-1, 1].flatMap(s => [0, 1, 2, 3].map(i => <Box key={`${s}-${i}`} p={[s * 8, 3.8, -4 - i * 4]} s={[.15, 7.6, .65]} c="#b49a84" metal={.6} rotation={s * .35}/>))}
 {room.id === 'glow' && [-1, 1].map(s => <OliveTree key={s} p={[s * 7.1, 0, -6]} scale={1.3}/>)}
 </group>;
});
