// Theme + settings: Dark by default before first paint, Light persists across reloads, System
// follows prefers-color-scheme live, Advanced controls keep their effects, artwork pager visible.
// Usage: BASE_URL=http://127.0.0.1:4173 node tests/theme-settings.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
(async () => {
    const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] }); const errors = [];
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
        const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
        // Record the theme as early as the DOM exists (before React mounts).
        await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { window.firstTheme = document.documentElement.dataset.theme; }));
        await page.goto(base + '/#glow');
        assert.equal(await page.evaluate(() => window.firstTheme), 'dark', 'new visitors start in Dark before first paint');
        await page.getByRole('button', { name: 'Explore Demo', exact: true }).click();
        await page.locator('[data-place=glow][data-ready=true]').waitFor({ timeout: 30000 });
        assert.ok(await page.getByRole('button', { name: 'Next artwork', exact: true }).isVisible(), 'artwork pager visible on entering a gallery');
        await page.getByRole('button', { name: 'Settings' }).click();
        const dialog = page.getByRole('dialog', { name: 'Your space.' });
        await dialog.getByRole('radio', { name: /Light/ }).click();
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
        await page.reload();
        assert.equal(await page.evaluate(() => window.firstTheme), 'light', 'choice survives a reload without flashing Dark');
        await page.locator('[data-place=glow][data-ready=true]').waitFor({ timeout: 30000 });
        await page.getByRole('button', { name: 'Settings' }).click();
        await dialog.getByRole('radio', { name: /System/ }).click();
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
        console.log('PASS Dark default, Light persisted, System follows the device');
        await dialog.getByText('Advanced settings').click();
        await dialog.getByRole('button', { name: 'Reduced', exact: true }).click();
        assert.equal(await page.locator('.museum').getAttribute('data-motion'), 'reduced');
        await dialog.getByRole('button', { name: 'Light', exact: true }).click();
        assert.equal(await page.locator('.museum').getAttribute('data-quality'), 'low');
        const ambient = dialog.getByRole('switch', { name: 'Ambient sound' });
        assert.equal(await ambient.getAttribute('aria-checked'), 'false');
        assert.ok(await dialog.getByRole('switch', { name: 'Lightweight view' }).isVisible());
        console.log('PASS Advanced controls keep their effects; ambience switch present');
        await dialog.getByRole('button', { name: 'Close dialog' }).click();
        await page.getByRole('button', { name: 'Next artwork', exact: true }).click();
        assert.match(await page.locator('.gb-count').textContent(), /1\s*\/\s*\d/);
        assert.equal(await page.locator('.gallery-bar .art-note, .art-note').count(), 0, 'no diary paragraph beside the artwork');
        await page.keyboard.press('ArrowRight');
        assert.match(await page.locator('.gb-count').textContent(), /2\s*\/\s*\d/);
        console.log('PASS pager + arrow keys walk the frames; no diary text in the gallery view');
        assert.deepEqual(errors, []);
    } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
