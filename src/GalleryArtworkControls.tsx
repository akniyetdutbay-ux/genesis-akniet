// Gallery exhibit bar (Claude UX): a museum wall label, an always-visible artwork pager and
// one context action. The pager only moves between frames in the room (camera focus); it never
// opens a memory and is independent from photo navigation inside Living Memory.
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Room } from './data';
import './gallery-controls.css';

type Work = Room['works'][number];
interface Props {
    room: Room; art?: Work; selected: number | null; busy: boolean; loaded: boolean; storageError: string;
    firstEmpty: number; sampleIndex: number;
    onFocus: (index: number | null) => void; onOpen: (index: number) => void;
}
function kindOf(work: Work) {
    const m = work.memory;
    if (!m) return 'Empty frame';
    return m.kind === 'demo' ? 'Demo sample' : m.kind === 'test' ? 'Test memory · local' : m.cloud ? 'Private cloud memory' : 'Personal memory · local';
}
export function formatMuseumDate(value: string, locale = 'en-GB') {
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function GalleryArtworkControls({ room, art, selected, busy, loaded, storageError, firstEmpty, sampleIndex, onFocus, onOpen }: Props) {
    const total = room.works.length;
    const step = (delta: number) => {
        if (selected === null) onFocus(delta > 0 ? 0 : total - 1);
        else onFocus(Math.min(total - 1, Math.max(0, selected + delta)));
    };
    // Arrow keys walk the exhibition when no dialog or text field has focus.
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (busy || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.metaKey || e.ctrlKey) return;
            const t = e.target as HTMLElement | null;
            if (t?.closest('input,textarea,select,[contenteditable=true],dialog') || document.querySelector('dialog[open]')) return;
            e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1);
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    });
    const memory = art?.memory;
    return <section className={`gallery-bar gallery-${room.id} ${art ? 'is-focused' : ''}`} aria-label={`${room.name} exhibits`}>
        <div className="gb-label">
            {art ? <>
                <span className="gb-kicker">{kindOf(art)} <i aria-hidden="true"/> {room.name}</span>
                <h1>{memory ? memory.title : 'A place for your next memory'}</h1>
                <p className="gb-date">{memory ? formatMuseumDate(memory.date) : 'An empty frame, a day to keep'}</p>
            </> : <>
                <h1>{room.name}</h1>
                <span className="gb-kicker">{room.emotion}</span>
                <p className="gb-line">{room.line}</p>
            </>}
        </div>
        <nav className="gb-pager" aria-label="Artworks in this gallery">
            <button aria-label="Previous artwork" disabled={busy || selected === 0} onClick={() => step(-1)}><ChevronLeft size={20} strokeWidth={1.4}/></button>
            <span className="gb-count" aria-live="polite">{selected === null ? <><b>{total}</b> works</> : <><b>{selected + 1}</b> / {total}</>}</span>
            <button aria-label="Next artwork" disabled={busy || selected === total - 1} onClick={() => step(1)}><ChevronRight size={20} strokeWidth={1.4}/></button>
        </nav>
        <div className="gb-actions">
            {art ? <>
                <button className="gb-primary" disabled={busy || !loaded || (!memory && !!storageError)} onClick={() => onOpen(selected!)}>{memory ? 'Open living memory' : 'Add memory'}</button>
                <button className="gb-quiet" disabled={busy} onClick={() => onFocus(null)}>View the whole room</button>
            </> : <>
                {sampleIndex >= 0 && <button className="gb-quiet" disabled={busy || !loaded} onClick={() => onOpen(sampleIndex)}>Explore demo memory</button>}
                <button className="gb-quiet" disabled={busy || !loaded || !!storageError || firstEmpty < 0} onClick={() => onOpen(firstEmpty)}>Create a memory</button>
            </>}
        </div>
    </section>;
}
