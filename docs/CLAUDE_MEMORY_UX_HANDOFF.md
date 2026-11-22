# Claude → Codex handoff: Memory experience, diary, settings and themes

Branch `design/claude-memory-experience` (published at
`https://github.com/amangereevdaukesh-afk/genesis-akniet/tree/design/claude-memory-experience`).
It sits **on top of Codex's music branch** `feat/memory-soundtrack`, so it already contains, and
does not modify, the soundtrack work of PR #4.

## 1. Goal

Make the visit feel like a finished art product:
- no diary paragraph beside the gallery photograph;
- an always-visible artwork pager;
- an atmospheric diary;
- safe automatic diary formatting;
- a real settings page with account, Dark/Light/System themes and advanced controls.

Codex's music engine and Supabase logic are kept intact.

## 2. Base commit

`d8346f3e3070e13e7806af758d14cb96320f5279` is the HEAD of `feat/memory-soundtrack` (PR #4, open) on 2026-11-22. It is `main` @ `9d521cc` plus 7 Codex music commits.

## 3. Codex music SHA at the last check

`d8346f3` — unchanged since the branch was created. Check it again before integrating (§14).

## 4. Changed files

| File | Change |
|---|---|
| `src/App.tsx` | +1/−1 import line each for `GalleryArtworkControls` and `MuseumSettings`; the gallery `gallery-copy`/`art-detail` block (which showed `art.note`, the diary) is replaced by `<GalleryArtworkControls/>`; the settings dialog body is replaced by `<MuseumSettings/>`; `Dialog` gains an optional `wide` prop; unused `ChevronLeft/Right` imports removed; `'Opening memory…'` fixed — it contained an invalid byte that rendered as "�". **No change** to `onSelect`, `stopStory`, soundtrack refs, `prepareOpening`, navigation or auth. |
| `src/MemoryTheatre.tsx` | The inline `reading-room` section is replaced by `<DiaryReadingRoom/>`; two imports added. Playback, autoplay, events and cleanup are untouched. |
| `src/MemoryUI.tsx` | `<label>Your diary<textarea name="diary"…/></label>` → `<DiaryField defaultValue={initial?.diary}/>` (same `name="diary"`, still uncontrolled, still `required`); "Preparing photographs…" fixed (it rendered as "�"). |
| `src/Account.tsx` | Only "Opening the museum…" fixed (it rendered as "�"). |
| `src/main.tsx` | Cyrillic / Cyrillic-ext subsets of Cormorant Garamond; `ui-theme.css`; `theme` initialisation. |
| `index.html` | Inline pre-paint theme script (reads `localStorage['museum-theme']`, default `dark`). |

## 5. New components and modules

| File | Purpose |
|---|---|
| `src/GalleryArtworkControls.tsx` + `gallery-controls.css` | Gallery exhibit bar: wall label, artwork pager (`Previous artwork` / `Next artwork`, ← → keys), context action |
| `src/DiaryReadingRoom.tsx` + `diary.css` | Atmospheric diary (painted SVG plate + typeset text) |
| `src/diaryAtmosphere.ts` | Diary Atmosphere Engine (local, rule based) |
| `src/diaryTextFormatting.ts` | Smart Diary Formatting (`tidyDiary`) |
| `src/DiaryField.tsx` | Editor textarea with tidy-on-finish, "Show original" and "Undo" |
| `src/theme.ts` + `ui-theme.css` | Theme store, `useTheme()`, themed interface tokens |
| `src/MuseumSettings.tsx` + `settings.css` | "Your space" settings |
| `src/theatre-refine.css` | Quieter Living Memory typography (CSS only) |
| `tests/diary-engine.cjs`, `tests/diary-field.cjs`, `tests/theme-settings.cjs` | New checks |

## 6. Key UI decisions

**Gallery**
- The pager is camera focus only: it calls `setSelected`. It never opens a memory and never touches photo navigation inside Living Memory. The two mechanisms keep separate state.
- When nothing is focused, the pager reads "*n* works", and Create a memory / Explore demo memory stay available as quiet links.
- A focused frame shows its kind, title and date, plus one primary action: **Open living memory** or **Add memory**. Both call the existing `onSelect(i)`, so `memory.room`/`slot` mapping is unchanged.

**Diary**
- A painted plate on the left, the typeset diary on the right; stacked on phones.
- The full diary stays only here and in the editor. Living Memory captions are capped at two lines.

**Settings** are grouped as 01 Account, 02 Appearance, 03 Personalisation and 04 Advanced (collapsed).

**Accessible names the tests rely on are preserved:** `Create a memory`, `Explore demo memory`, `Open living memory`, `Next artwork`, `Read diary`, `Back to memory`, `.reading-room`, `Ambient sound`, `Lightweight view`, `Close dialog`, `Settings`.

## 7. Theme system

- Choices: `dark` (default for new visitors), `light`, `system` (`prefers-color-scheme`, followed live).
- The choice is stored in `localStorage['museum-theme']` and applied to `<html data-theme>` by the inline script before React loads, so there is no flash.
- `ui-theme.css` defines `--ui-*` tokens and re-colours: dialogs, settings, editor fields, collection, admission/login, the auth banner, the storage error, and the tidy notice.
- The 3D galleries' lighting, the 3D overlays (masthead/footer over the scene) and the cinematic Living Memory are intentionally **not** themed.

## 8. Diary Atmosphere Engine (`readAtmosphere(diary, date, room, theme, photoColor?)`)

- **Signal priority:** explicit weather → time of day → season → gallery → neutral.
- **Season** comes from the date's month (northern hemisphere). The words can override it: snow implies winter light, and named seasons win over the date.
- **Matching rules:**
  - Word stems for RU/KZ/EN live in `RULES`.
  - A trailing `$` means whole word (`қар$` does not match `қарау`, `жаз$` does not match `жазу`).
  - Negation words (`no/not/без/не/нет/жоқ/емес`) cancel the next signal.
  - Within a category, the first mention wins.
- **Output:** a palette (dark or light; night text always goes dark), a caption such as "Autumn · sunlight · evening · among trees", and provenance ("read from your words" / "season from the date").
- **Rendering:** `DiaryReadingRoom` turns this into an SVG composition:
  - sky light (sun, low sun or moon);
  - a horizon for the place (sea, mountain, city, forest, home);
  - a seasonal motif;
  - weather (rain, snow, mist, wind, storm);
  - the gallery's brushwork (GLOW dabs, HUSH stillness, ECHO arches, PULSE circle/diagonal/arc).
- Animations stop under reduced motion.
- **To extend:** add stems to `RULES`. No other code changes are needed.

## 9. Smart Text Formatting (`tidyDiary(text) → {text, changes}`)

- **What it fixes:** NFC normalisation, extra spaces, punctuation spacing, sentence capitals (Unicode-aware), standalone English "i", empty lines, a closing full stop on prose paragraphs (≥ 4 words).
- **What it protects:** URLs, domains, e-mails, times and decimals.
- **What it never does:** change, add or remove words. "было кайфово" stays "было кайфово".
- **When it runs:** only when writing ends — on blur, or at form submit (capture phase, before the editor reads `FormData`). The tidy notice appears 300 ms later so a click on Save is never displaced (Safari does not focus buttons).
- **Visitor control:** the visitor can Show original or Undo; an undone version is not re-tidied.
- **Improve Writing (grammar/AI):** not implemented. There is no safe, consented AI service connected, and a regex grammar checker would be dishonest. If one is added later:
  - it must be opt-in, with a side-by-side preview and Apply/Cancel;
  - it must run server-side with no client keys;
  - it must send no diary text without explicit consent.

## 10. Shared files touched

`App.tsx`, `MemoryTheatre.tsx`, `MemoryUI.tsx`, `Account.tsx`, `main.tsx`, `index.html`. All of these are small, line-local edits (§4).

Not touched: `MusicSearch.tsx`, `SoundtrackField.tsx`, `soundtrack.ts`, `videoTracks.ts`, `cloud.ts`, `memories.ts`, `styles.css`, `theatre.css`, Supabase migrations and policies, and all Codex tests.

## 11. Possible conflicts with PR #4

- **If PR #4 merges unchanged:** this branch already contains it, so merging it into `main` afterwards brings only Claude's commits.
- **If Codex adds commits to `feat/memory-soundtrack`:** merge them into this branch (`git merge origin/feat/memory-soundtrack`). Likely touch points:
  - `MemoryTheatre.tsx` — keep Codex's version and re-apply the `DiaryReadingRoom` line and the two imports;
  - `MemoryUI.tsx` — keep Codex's form and re-apply the `DiaryField` swap;
  - `App.tsx` — the `onSelect`/soundtrack code is untouched here, so keep Codex's.
- **If PR #4 is squash- or rebase-merged:** recreate a branch from the new `main` and cherry-pick only the Claude commits listed in the PR description.

## 12. Test results (Chromium in a Linux container; see the PR for the latest run)

**New tests:**
- `diary-engine` — 16/16 (formatting RU/KZ/EN; seasons; rain in May; sunny November; snow; KZ false friends; negation; night/city).
- `diary-field` — PASS (no rewrite while typing; tidy on blur; Show original; Undo; Save submits the tidied text).
- `theme-settings` — PASS (Dark before first paint; Light persists across reload; System follows the OS; Advanced controls keep their effects; pager + arrow keys; no diary text in the gallery).

**Visual QA script:** four synthetic diaries — RU autumn sun, KZ winter snow/evening, EN spring rain by the sea, RU summer night in the city:
- desktop and 390 px, dark theme, no horizontal overflow;
- engine classification as expected;
- the light theme was checked on the settings screens only, not on these diaries.

**Codex / earlier tests:** `touch-hall`, `portal-hall`, `memory-theatre` (xvfb) and `soundtrack-sources` part 1 (guest platform links) — see the PR.

**Not run (no environment here):**
- Supabase account flows — sign-out/sign-in, cloud save of tidied text, `art-cloud-roundtrip`, `soundtrack-sources` part 2 (needs `QA_EMAIL`/`QA_PASSWORD`);
- WebKit/iOS Safari (not installed);
- real audio/video file playback on devices.

## 13. Known limitations

- Language selector not added. Full RU/KZ/EN UI localisation was out of scope, and a half-working selector was explicitly not wanted. Diaries are never translated.
- The atmosphere engine is keyword based. Unusual phrasing falls back to the season and gallery, by design.
- Sign out uses `client.auth.signOut()`, as the collection panel already did. It was not run against a live project here.
- `tests/memories.cjs` (an old guest-editor Edge test) clicks "Create a memory" for a *focused* empty frame. That button now says **Add memory**. The test was already non-runnable, because the guest editor requires an account.

## 14. Before merging, check

1. `git fetch` and compare `feat/memory-soundtrack` with `d8346f3`; merge any new Codex commits into this branch first.
2. `npm ci && npm run build`.
3. Run `node tests/diary-engine.cjs`, `node tests/diary-field.cjs`, and `BASE_URL=… node tests/theme-settings.cjs`, together with Codex's suite (including `soundtrack-sources` with QA credentials).
4. With a dedicated test account:
   - create a memory with messy RU text, save, reload and confirm the tidied text;
   - open Read diary and Back;
   - play, pause and close audio/video soundtracks, and confirm no overlapping audio when switching memories;
   - sign out → sign in → confirm the collection is intact.
5. On a real iPhone (Safari) and Android (Chrome), at 360/390/430 px:
   - gallery bar, settings and the theme switch;
   - diary scrolling.

## 15. Recommendations for Codex

- Soundtrack controls in Living Memory still use fixed dark colours. That is intentional, since the theatre is cinematic in both themes. If you restyle them, read `--ui-*` tokens only in dialogs.
- If you add new dialogs, use the `.dialog` class (or `Dialog wide`) and they theme automatically.
- `DiaryField` exposes nothing new to the save path: `FormData.get('diary')` is still the source of truth.
