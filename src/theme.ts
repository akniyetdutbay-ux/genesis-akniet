// Interface theme (Claude UX): Dark (default for new visitors), Light, or System.
// Affects dialogs, settings, editor, collection and the diary — never the 3D galleries' light.
// The same key is read by an inline script in index.html before React loads, so the right
// theme is painted on the first frame (no flash of the wrong theme).
import { useEffect, useSyncExternalStore } from 'react';

export type ThemeChoice = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';
const KEY = 'museum-theme';
const listeners = new Set<() => void>();
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;

function read(): ThemeChoice {
    try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light' || v === 'system') return v; } catch { /* storage blocked */ }
    return 'dark';
}
let choice: ThemeChoice = read();
export const resolveTheme = (c: ThemeChoice): Theme => c === 'system' ? (media?.matches ? 'dark' : 'light') : c;
function apply() {
    const resolved = resolveTheme(choice), root = document.documentElement;
    root.dataset.theme = resolved; root.dataset.themeChoice = choice; root.style.colorScheme = resolved;
}
function emit() { apply(); listeners.forEach(l => l()); }
media?.addEventListener('change', () => { if (choice === 'system') emit(); });
export function setThemeChoice(next: ThemeChoice) {
    choice = next;
    try { localStorage.setItem(KEY, next); } catch { /* preference stays for this visit */ }
    emit();
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
/** Current choice plus the resolved theme; re-renders when either changes. */
export function useTheme() {
    const current = useSyncExternalStore(subscribe, () => choice);
    const resolved = useSyncExternalStore(subscribe, () => resolveTheme(choice));
    useEffect(apply, []);
    return { choice: current, theme: resolved, setChoice: setThemeChoice };
}
