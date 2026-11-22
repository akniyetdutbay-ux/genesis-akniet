// Browser check for the editor's DiaryField: nothing changes while typing; tidy happens on
// blur; the form submits the tidied text; "Show original" and "Undo" restore the author's words.
// Usage: node tests/diary-field.cjs   (bundles the real component with esbuild; no server needed)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
const entry = `import {createRoot} from 'react-dom/client';import {DiaryField} from './src/DiaryField';
const form=document.createElement('form');document.body.append(form);form.onsubmit=e=>{e.preventDefault();window.submitted=String(new FormData(form).get('diary'))};
createRoot(form).render(<><DiaryField/><input name="title"/><button>Save memory</button></>);`;
const js = buildSync({ stdin: { contents: entry, resolveDir: path.join(__dirname, '..'), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
(async () => {
    const browser = await chromium.launch(); const errors = [];
    try {
        const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
        await page.setContent('<!doctype html><meta charset="utf-8"><body></body>'); await page.addScriptTag({ content: js });
        const area = page.locator('textarea[name=diary]');
        await area.click(); await page.keyboard.type('это был прекрасный день  мы гуляли ,было тепло');
        assert.equal(await area.inputValue(), 'это был прекрасный день  мы гуляли ,было тепло', 'no rewriting while typing');
        await page.locator('input[name=title]').click();
        assert.equal(await area.inputValue(), 'Это был прекрасный день мы гуляли, было тепло.');
        await page.getByRole('status').getByText(/Tidied/).waitFor();
        await page.getByRole('button', { name: 'Show original' }).click();
        assert.equal(await page.locator('.diary-tidy-original').textContent(), 'это был прекрасный день  мы гуляли ,было тепло');
        await page.getByRole('button', { name: 'Undo' }).click();
        assert.equal(await area.inputValue(), 'это был прекрасный день  мы гуляли ,было тепло', 'undo restores the original');
        await page.getByRole('button', { name: 'Save memory' }).click();
        assert.equal(await page.evaluate(() => window.submitted), 'это был прекрасный день  мы гуляли ,было тепло', 'declined tidy is not re-applied on save');
        console.log('PASS typing untouched, blur tidy, show original, undo, save keeps choice');
        await area.fill('бүгін таңертең қар жауды'); await page.getByRole('button', { name: 'Save memory' }).click();
        assert.equal(await page.evaluate(() => window.submitted), 'Бүгін таңертең қар жауды.', 'Save submits the tidied text');
        console.log('PASS pressing Save tidies first and submits the tidied Kazakh text');
        assert.deepEqual(errors, []);
    } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
