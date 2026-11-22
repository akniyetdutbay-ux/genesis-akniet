// Diary textarea with Smart Diary Formatting (Claude UX). The field stays uncontrolled
// (name="diary"), exactly as the editor's form expects. When writing ends (blur — which also
// happens when the visitor presses Save) the text is tidied once; the visitor sees what changed
// and can compare with or restore the original. Nothing is rewritten while typing.
import { useRef, useState } from 'react';
import { tidyDiary } from './diaryTextFormatting';

export function DiaryField({ defaultValue }: { defaultValue?: string }) {
    const area = useRef<HTMLTextAreaElement>(null);
    const [tidied, setTidied] = useState<{ original: string; changes: string[] } | null>(null);
    const [compare, setCompare] = useState(false);
    const declined = useRef<string | null>(null);
    function tidy() {
        const el = area.current; if (!el) return;
        const value = el.value;
        if (!value.trim() || value === declined.current) return;
        const result = tidyDiary(value);
        if (result.text === value) return;
        el.value = result.text;
        setTidied({ original: tidied && value === tidied.original ? tidied.original : value, changes: result.changes });
        setCompare(false);
    }
    function undo() {
        if (!tidied || !area.current) return;
        area.current.value = tidied.original; declined.current = tidied.original;
        setTidied(null); setCompare(false); area.current.focus();
    }
    return <div className="diary-field">
        <label>Your diary<textarea ref={area} name="diary" defaultValue={defaultValue} required rows={5} placeholder="What would you like to remember?" spellCheck onBlur={tidy} onInput={() => { if (tidied) setTidied(null); }}/></label>
        {tidied && <div className="diary-tidy" role="status">
            <p><span className="diary-tidy-mark" aria-hidden="true">✓</span> Tidied {tidied.changes.join(', ')}. Your words are unchanged.</p>
            <div className="diary-tidy-actions"><button type="button" aria-expanded={compare} onClick={() => setCompare(!compare)}>{compare ? 'Hide original' : 'Show original'}</button><button type="button" onClick={undo}>Undo</button></div>
            {compare && <blockquote className="diary-tidy-original">{tidied.original}</blockquote>}
        </div>}
    </div>;
}
