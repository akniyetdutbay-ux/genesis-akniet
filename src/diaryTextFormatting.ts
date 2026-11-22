// Smart Diary Formatting (Claude UX): safe, local, meaning-preserving tidy-up of diary text.
// It fixes form only — spacing, sentence capitals, paragraph breaks and a closing full stop —
// and never rewrites words, so "было кайфово" stays "было кайфово". It is not a grammar
// checker and does not claim to be one. Runs only when editing ends (blur) or on demand,
// never per keystroke, so caret position, selection and IME composition are untouched.

export interface Tidy { text: string; changes: string[] }

const PROTECT = /\b(?:https?:\/\/|www\.)\S+|\b[\p{L}\d-]+\.(?:kz|ru|com|org|net|io|app|me|ua|uz|kg|ai|dev)\b|[\w.+-]+@[\w-]+\.[\w.-]+|\b\d{1,2}[.:]\d{2}\b|\b\d+[.,]\d+\b/giu;
const UPPER_FIRST = /^(\s*[«"'“„(\[—–-]*\s*)(\p{Ll})/u;

function capitalise(s: string) { return s.replace(UPPER_FIRST, (_, lead: string, c: string) => lead + c.toLocaleUpperCase()); }

/** Tidies one paragraph. Placeholders keep URLs, e-mails, times and decimals intact. */
function tidyParagraph(raw: string, english: boolean, changes: Set<string>, final: boolean) {
    const kept: string[] = [];
    let p = raw.replace(PROTECT, m => { kept.push(m); return `\u0000${kept.length - 1}\u0000`; });
    const before = p;
    p = p.replace(/[ \t ]+/g, ' ').trim();
    if (p !== before.trim()) changes.add('extra spaces');
    let q = p.replace(/\s+([,.;:!?…%)\]»”])/gu, '$1');                // no space before punctuation
    q = q.replace(/([([«„“])\s+/gu, '$1');                              // no space after opening brackets/quotes
    q = q.replace(/([,;:])(?=[\p{L}])/gu, '$1 ');                        // space after , ; :
    q = q.replace(/(\p{L}{2}[.!?…])(?=\p{L})/gu, '$1 ');                // space before the next sentence ("дома.потом")
    q = q.replace(/([!?])\1{2,}/gu, '$1$1$1').replace(/\.{4,}/g, '...'); // keep emphasis, trim runs
    if (q !== p) changes.add('spacing around punctuation');
    // Capitals at the start of the paragraph and after sentence-ending punctuation.
    let r = capitalise(q).replace(/([.!?…]\s+[«"“„(]*)(\p{Ll})/gu, (_, lead: string, c: string) => lead + c.toLocaleUpperCase());
    if (english) r = r.replace(/(^|[^\p{L}'’])i(?=$|[^\p{L}'’]|['’](?:m|ll|ve|d)\b)/gu, '$1I');
    if (r !== q) changes.add('capital letters');
    // A closing full stop for prose paragraphs (four words or more) that end on a letter or digit.
    if (final && /[\p{L}\p{N}]$/u.test(r) && r.split(/\s+/).length >= 4 && !/\u0000\d+\u0000$/.test(r)) { r += '.'; changes.add('closing full stop'); }
    return r.replace(/\u0000(\d+)\u0000/g, (_, i: string) => kept[Number(i)]);
}

/** Normalises a whole diary entry. Returns the text and a human list of what changed. */
export function tidyDiary(input: string): Tidy {
    const changes = new Set<string>();
    const text = input.normalize('NFC').replace(/\r\n?/g, '\n');
    const latin = (text.match(/[a-z]/gi) ?? []).length, cyrillic = (text.match(/\p{Script=Cyrillic}/gu) ?? []).length;
    const paragraphs = text.split(/\n[ \t]*\n+/).map(block => block.split('\n').map(line => line.trim()).filter(Boolean).join('\n')).filter(Boolean);
    if (/\n[ \t]*\n[ \t]*\n/.test(text)) changes.add('empty lines');
    const out = paragraphs.map(block => block.split('\n').map((line, i, all) => tidyParagraph(line, latin > cyrillic, changes, i === all.length - 1)).join('\n')).join('\n\n');
    return { text: out, changes: out === input ? [] : [...changes] };
}
