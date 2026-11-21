# Public user testing

Canonical visitor URL: https://museum-of-days-seven.vercel.app/

## What to try
1. Enter the museum and click a physical GLOW, HUSH, ECHO or PULSE door. Keyboard/touch visitors and browser agents can use Accessible gallery navigation.
2. Choose Explore demo memory. Try Play, Pause, Replay, Previous/Next and Close. Demo samples contain original illustrated landscapes and a short original sound, labelled in the player.
3. Choose Create a memory or an empty frame. Add diary text, date, photos (JPEG/PNG/WebP), music URL or permitted local audio, and save.
4. Open the framed memory, then refresh. The same browser should still contain it.
5. Open Public demo · Visitor guide to reset disposable data or restore sample memories.

## Local storage and reset
Memories are stored only in IndexedDB in the current browser for this exact website origin. Nothing is uploaded or shared between visitors. Use the canonical URL consistently: localhost and other Vercel aliases have separate browser storage. Clearing site data removes the collection; there is no sync or backup service.

New memories are marked as test data by default. Uncheck Mark as test memory to keep a personal memory. Reset Demo Data asks for confirmation, deletes only records marked demo or test from this app's database, and preserves personal/legacy memories. Reset does not delete databases belonging to other websites, affect other visitors, or silently restore samples on reload. Restore sample memories adds the four samples explicitly.

## Release
Vercel team: akniyetdutbay-4496
Project: museum-of-days / prj_auL8BTM8lRKvLoENG54A7C2eg6Iy
Deployment: dpl_6ZFJUtASba7wABawaqwfDqEo9Bru
Source SHA-256: 0ad3dac9434eb5bb98413d5eb6c509c6f63b08c1be907862e515e0db6e45d2fa
Production build: TypeScript and Vite passed locally; Vercel deployment reached READY.
Project settings checked: password, SSO and trusted-IP protection are disabled.

## Reproduce verification
Use Microsoft Edge and an installed Playwright package. Set PLAYWRIGHT_MODULE if using a bundled package; set BASE_URL to the site to test. Run `node tests/public-testing.cjs`. QA_DIR sets the report/screenshot directory. Tests use isolated contexts with no credentials, cookies or protection-bypass headers.

`node tests/storage-upgrade.cjs` verifies migration from the existing version-1 IndexedDB database, concurrent first visits and preservation of legacy personal memories after reset. It passed against the local production build.

The desktop/mobile production-build suite passed with no console errors or missing assets. Live-site results are recorded in the accompanying public-live/results.json after verification.

## Limits
Mobile checks emulate a 390 × 844 touch viewport in Edge; desktop uses 1440 × 900. This does not certify physical iOS/Safari devices or frame rate on ordinary hardware. Music URLs open externally and are not downloaded. No backend or cross-user sharing is connected. The procedural 3D environment and existing visual design are retained.

## Confirmed live-site results — 20 November 2026
The complete acceptance suite passed at https://museum-of-days-seven.vercel.app/ in fresh, unauthenticated desktop and mobile Edge contexts. No credentials, cookies or bypass tokens were supplied.

- All four physical doors and sample viewers; working image decoding, audio Play/Pause, Replay, Previous/Next and return navigation. Automatic photo advancement was also checked in PULSE.
- Upload/remove/re-add of PNG, JPEG and WebP; diary, date, title, music URL and local WAV input; click saved framed artwork and play it.
- Both new memories and their image/audio data survived reload; six records were present (four demo, one test, one personal).
- Cancel reset preserved all records. Confirm reset removed demo/test data only; the personal memory survived reset and reload. A second isolated browser retained its own samples. Explicit restore added the four samples back.
- Mobile touch navigation, sample playback with reduced motion, invalid-upload handling, photo/diary/music creation, persistence and no horizontal overflow at 390 × 844.
- Browser console errors: 0. Missing assets / HTTP error responses observed during the flows: 0.
- Separate unauthenticated HTTP requests returned 200 without redirects for both the canonical URL and the immutable deployment URL.

During preparation, tests exposed transient empty image src warnings and a mobile footer intercepting gallery taps. Both were fixed and the production/live suites rerun. The first live run checked records before observing the expected samples; a fresh-browser inspection confirmed initialization, and the rerun explicitly waited for sample records before continuing. Final result: passed.

Evidence: verification/public-live/results.json, anonymous-http.json and screenshots. Local production evidence: verification/public-production/results.json. The existing Three.js bundle still produces Vite's chunk-size warning; no device FPS guarantee is made.
