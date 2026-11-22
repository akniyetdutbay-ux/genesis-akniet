// Unit checks for Smart Diary Formatting and the Diary Atmosphere Engine (no browser needed).
// Usage: node tests/diary-engine.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
function load(file) {
    const out = buildSync({ entryPoints: [path.join(__dirname, '..', 'src', file)], bundle: true, write: false, format: 'cjs', platform: 'node' });
    const m = { exports: {} }; new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports); return m.exports;
}
const { tidyDiary } = load('diaryTextFormatting.ts');
const { readAtmosphere } = load('diaryAtmosphere.ts');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };

ok('Russian entry gets capitals and a full stop, words untouched', () => {
    const r = tidyDiary('это был прекрасный день мы гуляли с девушкой все было кайфово тепло и солнечно');
    assert.equal(r.text, 'Это был прекрасный день мы гуляли с девушкой все было кайфово тепло и солнечно.');
    assert.match(r.text, /кайфово/);
});
ok('spacing and sentence capitals across sentences', () => {
    assert.equal(tidyDiary('  мы  пришли домой .потом пили чай ,было уютно!а завтра снова  ').text, 'Мы пришли домой. Потом пили чай, было уютно! А завтра снова.');
});
ok('Kazakh letters and capitals', () => {
    assert.equal(tidyDiary('бүгін таңертең қар жауды. әжем шай қайнатты').text, 'Бүгін таңертең қар жауды. Әжем шай қайнатты.');
});
ok('English standalone i', () => {
    assert.equal(tidyDiary("today i walked to the sea and i'm happy").text, "Today I walked to the sea and I'm happy.");
});
ok('paragraphs kept, extra empty lines removed', () => {
    assert.equal(tidyDiary('first part of the day was slow\n\n\n\nthen we went out to the city').text, 'First part of the day was slow.\n\nThen we went out to the city.');
});
ok('urls, emails, times and decimals are protected', () => {
    const r = tidyDiary('встреча в 18:30 тут https://example.com/a.b?x=1 и почта a.b@mail.kz , рост 1.75');
    assert.match(r.text, /18:30/); assert.match(r.text, /https:\/\/example\.com\/a\.b\?x=1/); assert.match(r.text, /a\.b@mail\.kz,/); assert.match(r.text, /1\.75/);
});
ok('already tidy text reports no changes', () => {
    const r = tidyDiary('A calm day. Nothing to fix.'); assert.deepEqual(r.changes, []); assert.equal(r.text, 'A calm day. Nothing to fix.');
});
ok('short fragments are not forced into sentences', () => { assert.equal(tidyDiary('море').text, 'Море'); });

const atm = (t, d, room = 'glow', theme = 'light') => readAtmosphere(t, d, room, theme);
ok('season comes from the date when the words are silent', () => {
    assert.equal(atm('Мы просто гуляли', '2026-04-10').season, 'spring');
    assert.equal(atm('A walk', '2026-07-10').season, 'summer');
    assert.equal(atm('A walk', '2026-10-10').season, 'autumn');
    assert.equal(atm('A walk', '2026-01-10').season, 'winter');
});
ok('explicit rain in May wins over the calendar', () => { const a = atm('5 мая шёл сильный дождь', '2026-05-05'); assert.equal(a.weather, 'rain'); assert.equal(a.season, 'spring'); });
ok('a sunny November day is not turned into rain', () => { const a = atm('солнечный ноябрьский день', '2026-11-22'); assert.equal(a.weather, 'sun'); assert.equal(a.season, 'autumn'); });
ok('snow implies winter light even in spring dates', () => { assert.equal(atm('Неожиданно пошёл снег', '2026-04-02').season, 'winter'); });
ok('Kazakh weather, time and place', () => {
    const a = atm('Кешке көлде жаңбыр жауды', '2026-08-01'); assert.equal(a.weather, 'rain'); assert.equal(a.time, 'evening'); assert.equal(a.place, 'sea');
    assert.equal(atm('Біз қарау үшін бардық', '2026-08-01').weather, undefined, 'қарау is not snow');
    assert.equal(atm('Бүгін жазу жаздым', '2026-01-01').season, 'winter', 'жазу is not summer');
});
ok('negation is respected', () => { assert.notEqual(atm('There was no rain, just wind', '2026-06-01').weather, 'rain'); });
ok('night text darkens the room; city is not mountains', () => {
    const a = atm('Ночью мы гуляли по городу', '2026-06-01'); assert.equal(a.time, 'night'); assert.equal(a.dark, true); assert.equal(a.place, 'city');
});
ok('neutral text stays neutral, gallery still colours the accent', () => {
    const a = atm('', '', 'pulse'); assert.equal(a.weather, undefined); assert.equal(a.caption, 'A quiet day'); assert.ok(a.palette.accent);
});
console.log(n + ' checks passed');
