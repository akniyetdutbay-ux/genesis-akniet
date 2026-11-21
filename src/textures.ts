import * as THREE from 'three';
import type { RoomId } from './data';
const cache = new Map<string, THREE.CanvasTexture>();
function random(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function texture(key: string, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512) {
    if (cache.has(key))
        return cache.get(key)!;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    paint(ctx, w, h);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache.set(key, t);
    return t;
}
export function stoneTexture() { return texture('stone', (ctx, w, h) => { const r = random(47); ctx.fillStyle = '#d3c9b8'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 46000; i++) {
    const c = r() > 0.5 ? 255 : 75;
    ctx.fillStyle = `rgba(${c},${c},${c},${r() * .07})`;
    ctx.fillRect(r() * w, r() * h, r() * 3 + 0.2, r() * 2 + .2);
} for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = 'rgba(90,79,60,.025)';
    ctx.beginPath();
    ctx.moveTo(0, r() * h);
    ctx.bezierCurveTo(150, r() * h, 300, r() * h, w, r() * h);
    ctx.stroke();
} }); }
export function skyTexture() { return texture('sky', (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#72a6cb'); g.addColorStop(.6, '#bdd6df'); g.addColorStop(1, '#eceddf'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); const r = random(7); for (let c = 0; c < 18; c++) {
    const x = r() * w, y = 60 + r() * h * .55;
    for (let i = 0; i < 15; i++) {
        const xx = x + (r() - .5) * 150, yy = y + (r() - .5) * 25, rad = 18 + r() * 38;
        const a = ctx.createRadialGradient(xx, yy, 0, xx, yy, rad);
        a.addColorStop(0, 'rgba(255,255,252,.2)');
        a.addColorStop(1, 'rgba(255,255,252,0)');
        ctx.fillStyle = a;
        ctx.fillRect(xx - rad, yy - rad, rad * 2, rad * 2);
    }
} }, 1024, 512); }
export function inscriptionTexture(text: string) { return texture(`label-${text}`, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#584a35'; ctx.font = '500 42px "Cormorant Garamond", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2); }, 1024, 128); }
const paintPalettes: Record<RoomId, string[]> = { glow: ['#ddd0a2', '#f0ddad', '#d5ad68', '#b78746', '#6d794b', '#b1a175'], hush: ['#cfdbd1', '#b9cfc4', '#94aca2', '#688a84', '#506f67', '#9baea1'], echo: ['#c2c8d0', '#9daebd', '#768da1', '#495b74', '#37495c', '#a39b96'], pulse: ['#dac0a0', '#c38d77', '#a65743', '#78413c', '#3f4249', '#c89255'] };
export function paintingTexture(room: RoomId, seed: number) {
    return texture(`art-${room}-${seed}`, (ctx, w, h) => {
        const r = random(seed);
        const p = paintPalettes[room];
        ctx.fillStyle = p[0];
        ctx.fillRect(0, 0, w, h);
        const horizon = h * (.4 + r() * .12);
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, p[1]);
        sky.addColorStop(1, p[0]);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, horizon);
        for (let layer = 0; layer < 7; layer++) {
            const y = horizon + layer * h * .075;
            ctx.fillStyle = p[(layer % 4) + 2];
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w + 10; x += 8) {
                ctx.lineTo(x, y + Math.sin(x * .009 + seed + layer) * 24 + Math.sin(x * .026 + layer) * 12);
            }
            ctx.lineTo(w, h);
            ctx.fill();
        }
        // Original painterly marks, seeded and generated locally; no stock photography.
        for (let i = 0; i < 12500; i++) {
            const x = r() * w, y = r() * h, idx = y < horizon ? Math.floor(r() * 2) : 2 + Math.floor(r() * 4);
            ctx.globalAlpha = .04 + r() * .18;
            ctx.fillStyle = p[idx];
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((r() - .5) * .8);
            ctx.fillRect(0, 0, 2 + r() * 24, 1 + r() * 5);
            ctx.restore();
        }
        ctx.globalAlpha = .6;
        ctx.fillStyle = p[0];
        ctx.beginPath();
        ctx.ellipse(w * .65, h * .25, 24, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (room === 'glow' || room === 'echo') {
            for (let i = 0; i < 4; i++) {
                const x = w * (.14 + i * .19), y = h * (.56 + r() * .17);
                ctx.fillStyle = p[4];
                ctx.fillRect(x, y, 3, 45);
                for (let j = 0; j < 26; j++) {
                    ctx.globalAlpha = .4 + r() * .4;
                    ctx.beginPath();
                    ctx.ellipse(x + (r() - .5) * 28, y - 10 + r() * 25, 4 + r() * 9, 5 + r() * 12, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        if (room === 'hush') {
            const water = ctx.createLinearGradient(0, h * .55, 0, h);
            water.addColorStop(0, '#a7beb3');
            water.addColorStop(1, '#708e83');
            ctx.globalAlpha = .8;
            ctx.fillStyle = water;
            ctx.fillRect(0, h * .56, w, h * .44);
            for (let i = 0; i < 600; i++) {
                ctx.globalAlpha = .08 + r() * .18;
                ctx.fillStyle = i % 3 ? p[0] : p[3];
                ctx.fillRect(r() * w, h * .56 + r() * h * .44, 8 + r() * 110, .7 + r() * 2);
            }
            ctx.globalAlpha = 1;
        }
        if (room === 'echo') {
            for (let i = 0; i < 7; i++) {
                const x = 70 + i * 90, y = h * .64 + Math.sin(i * .7) * 22, ww = 50 + r() * 35, hh = 45 + r() * 75;
                ctx.globalAlpha = .65;
                ctx.fillStyle = p[4];
                ctx.fillRect(x, y - hh, ww, hh);
                ctx.beginPath();
                ctx.moveTo(x - 7, y - hh);
                ctx.lineTo(x + ww / 2, y - hh - 25);
                ctx.lineTo(x + ww + 7, y - hh);
                ctx.fill();
                ctx.fillStyle = '#d1c6a4';
                ctx.globalAlpha = .45;
                ctx.fillRect(x + ww * .25, y - hh * .65, 9, 13);
                ctx.fillRect(x + ww * .65, y - hh * .65, 9, 13);
            }
            ctx.globalAlpha = 1;
        }
        if (room === 'pulse') {
            ctx.fillStyle = p[4];
            ctx.globalAlpha = .8;
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(w * .22, h * .35);
            ctx.lineTo(w * .48, h * .87);
            ctx.lineTo(w * .72, h * .24);
            ctx.lineTo(w, h * .7);
            ctx.lineTo(w, h);
            ctx.fill();
            for (let i = 0; i < 1800; i++) {
                const x = r() * w, y = r() * h;
                ctx.globalAlpha = .06 + r() * .16;
                ctx.strokeStyle = p[Math.floor(r() * 6)];
                ctx.lineWidth = 1 + r() * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 20 + r() * 35, y - 40 - r() * 65);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = .06;
        for (let i = 0; i < 17000; i++) {
            ctx.fillStyle = r() > .5 ? '#fff' : '#000';
            ctx.fillRect(r() * w, r() * h, .7, 1 + r() * 2);
        }
        ctx.globalAlpha = 1;
    }, 768, 960);
}
