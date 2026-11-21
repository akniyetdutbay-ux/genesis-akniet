# Museum of Days

An interactive frontend museum built with React, TypeScript, React Three Fiber and GSAP.

## Run the included production build

On Windows, open `START-MUSEUM.cmd`, then visit http://127.0.0.1:4173. The included `dist/` build needs only Node.js, without dependency installation. Keep the command window open while visiting.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci --legacy-peer-deps
npm run dev
```

Open the localhost URL printed by Vite. For a production build, run `npm run build`, then `npm run preview`.

## Experience

- A real 3D frontal stone entrance with open brass gates and a continuous camera journey into the main hall.
- Four emotional galleries with distinct partitions, sculpture, materials and lighting.
- Clickable empty frames, multi-photo memory editor, IndexedDB persistence and a living memory viewer.
- Physical animated gallery doors, guided camera paths, functional settings and native modal dialogs.
- Deep links such as `/#glow`, browser history, keyboard and touch controls.
- Demand rendering, lazy scene loading, capped pixel ratio and a lightweight fallback (`/?lite`).

## Boundaries

This is a frontend prototype. No accounts or backend. Memories, uploaded image/audio Blobs and deterministic visual parameters are saved in IndexedDB on the current browser origin. Clearing site data removes them. Preferences remain per-visit.

The architecture is original procedural geometry. The two photographs mentioned in the supplied directive were not attached, so this build does not claim fidelity to those unseen images. The 3D scene is an architectural study, not a photogrammetry or photoreal asset reconstruction. A lighter CSS architectural fallback is identified in the interface.

## Code map

- `src/Architecture.tsx`: shared architectural elements, exterior, hall and galleries.
- `src/MuseumScene.tsx`: lighting, demand renderer, GSAP camera.
- `src/data.ts`: room content and extensible exhibition positions.
- `src/textures.ts`: original seeded stone, sky and painting textures.
- `src/App.tsx`: navigation, modal focus, preferences and DOM controls.
- `src/audio.ts`: original opt-in synthesized ambience.

## Assets and references

All architectural geometry and painting textures were generated in code for this project. Fonts: Cormorant Garamond and DM Sans (bundled via Fontsource; SIL Open Font License). Icons: Lucide (ISC).


Technical references used: https://r3f.docs.pmnd.rs/api/canvas and https://gsap.com/resources/React/.

## Refinement tests
`tests/memories.cjs` covers the real door/frame click, three uploaded photographs, five saved memories, playback and persistence. `tests/gallery-scale.cjs` covers all doors, 120 stored entries, far exhibits and the mobile editor. They use isolated test browser contexts.

## Refinement code
- `src/memories.ts`: IndexedDB, deterministic interpretation and growing exhibitions.
- `src/MemoryUI.tsx`: upload editor and living memory player.
- `src/Exhibits.tsx`: interactive doors and photograph-based framed exhibits.

## Public testing release
Open https://museum-of-days-seven.vercel.app/ for the public museum. See PUBLIC-TESTING.md for visitor instructions, local-storage behaviour and reset scope. The visitor guide is available from every screen. Four labelled demo memories are created once per browser; empty frames remain available. Personal memories are preserved by Reset Demo Data.
