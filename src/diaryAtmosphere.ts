// Diary Atmosphere Engine (Claude UX).
// Reads a memory's date, words, gallery and photo palette and returns a small, explainable
// artistic brief for the Diary Reading Room. Everything runs locally: no network, no model,
// no data leaves the browser. Priority: explicit weather > time of day > season > gallery.
// The date only suggests a season; the diary text can override it (snow in May wins).
import type { RoomId } from './data';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sun' | 'rain' | 'snow' | 'fog' | 'wind' | 'storm' | 'cloud';
export type DayTime = 'morning' | 'day' | 'evening' | 'night';
export type Place = 'sea' | 'mountain' | 'city' | 'forest' | 'home';
export interface Atmosphere {
    season?: Season; weather?: Weather; time?: DayTime; place?: Place;
    /** Which signals came from the words (true) rather than the date or gallery. */
    fromText: { weather: boolean; time: boolean; season: boolean; place: boolean };
    room: RoomId; dark: boolean; caption: string;
    palette: { ground: string; ground2: string; ink: string; soft: string; accent: string; glow: string };
}

// Word stems per signal in English, Russian and Kazakh. Stems match the start of a word, so
// "дожд" covers дождь/дождливый/дождём, "snow" covers snowy/snowfall, "жаңбыр" its inflections.
// A trailing $ means "whole word only" (қар$ must not match қарау, «to look»).
// Extend a list to teach the engine a new word — nothing else needs to change.
const RULES = {
    weather: {
        storm: ['storm', 'thunder', 'lightning', 'гроз', 'гром', 'молни', 'шторм', 'буря', 'бури', 'найзағай', 'дауыл', 'күн күркіре'],
        snow: ['snow', 'blizzard', 'frost', 'снег', 'снеж', 'метел', 'вьюг', 'мороз', 'қар$', 'қарлы', 'қарда', 'қар жау', 'боран', 'аяз'],
        rain: ['rain', 'drizzle', 'shower', 'downpour', 'дожд', 'ливн', 'ливен', 'морос', 'жаңбыр', 'нөсер'],
        fog: ['fog', 'mist', 'haze', 'туман', 'дымк', 'мгл', 'тұман'],
        wind: ['wind', 'breeze', 'gust', 'ветер', 'ветр', 'ветрен', 'бриз', 'жел$', 'желді', 'самал'],
        cloud: ['cloud', 'overcast', 'grey sky', 'gray sky', 'пасмурн', 'облач', 'туч', 'бұлт'],
        sun: ['sun$', 'sunny', 'sunlight', 'sunshine', 'warm', 'солн', 'солнеч', 'тепл', 'жарк', 'ясн', 'күн шуақ', 'күншуақ', 'шуақ', 'ыстық', 'ашық күн'],
    },
    time: {
        morning: ['morning', 'dawn', 'sunrise', 'breakfast', 'утр', 'рассвет', 'завтрак', 'таң$', 'таңда', 'таңертең', 'таңғы', 'сәске'],
        evening: ['evening', 'sunset', 'dusk', 'twilight', 'вечер', 'закат', 'сумер', 'кеш$', 'кешке', 'кеште', 'кешкі', 'ымырт', 'күн бат'],
        night: ['night', 'midnight', 'stars', 'moon', 'ноч', 'полноч', 'звезд', 'звёзд', 'луна', 'луны', 'түн', 'түнде', 'жұлдыз', 'ай сәулесі'],
        day: ['afternoon', 'noon', 'lunch', 'днём', 'днем', 'полдень', 'обед', 'түсте', 'түскі', 'күндіз'],
    },
    season: {
        spring: ['spring', 'blossom', 'bloom', 'весн', 'цветени', 'цветущ', 'черемух', 'сирен', 'көктем', 'гүл'],
        summer: ['summer', 'лето', 'летом', 'летн', 'жаз$', 'жазда', 'жазғы'],
        autumn: ['autumn', 'fall leaves', 'leaves', 'осен', 'листопад', 'листья', 'күз', 'жапырақ'],
        winter: ['winter', 'christmas', 'new year', 'зим', 'новый год', 'новогод', 'қыс', 'жаңа жыл'],
    },
    place: {
        sea: ['sea', 'ocean', 'beach', 'shore', 'wave', 'lake', 'море', 'моря', 'морем', 'морск', 'океан', 'пляж', 'берег', 'волн', 'озер', 'озёр', 'теңіз', 'көл$', 'көлге', 'көлде', 'жағажай', 'толқын'],
        mountain: ['mountain', 'hill', 'peak', 'гора', 'горы', 'горах', 'гору', 'горн', 'холм', 'вершин', 'тау', 'шың', 'медеу', 'шымбұлақ'],
        forest: ['forest', 'woods', 'park', 'tree', 'лес', 'парк', 'дерев', 'орман', 'саябақ', 'ағаш'],
        city: ['city', 'street', 'cafe', 'café', 'downtown', 'город', 'улиц', 'кафе', 'центр', 'қала', 'көше', 'кафе'],
        home: ['home', 'kitchen', 'room', 'дом', 'кухн', 'комнат', 'үй$', 'үйде', 'үйге', 'үйін', 'үйім', 'ас үй', 'бөлме'],
    },
} as const;

// Words that negate the next signal ("no rain", "не было дождя", "жаңбыр жоқ") are respected.
const NEGATION = /(?:^|\s)(?:no|not|without|не|нет|без|жоқ|емес)\s+\S*$/u;
function find<K extends string>(text: string, table: Record<K, readonly string[]>): K | undefined {
    let best: { key: K; at: number } | undefined;
    for (const key of Object.keys(table) as K[]) {
        for (const stem of table[key]) {
            const whole = stem.endsWith('$'), body = (whole ? stem.slice(0, -1) : stem).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(?:^|[^\\p{L}])(${body})${whole ? '(?![\\p{L}])' : ''}`, 'giu');
            for (const match of text.matchAll(re)) {
                const at = (match.index ?? 0) + match[0].length - match[1].length;
                if (NEGATION.test(text.slice(Math.max(0, at - 24), at))) continue;
                // the first mention wins inside a category: it usually sets the scene
                if (!best || at < best.at) best = { key, at };
            }
        }
    }
    return best?.key;
}
export function seasonOf(date: string): Season | undefined {
    const month = Number(date.slice(5, 7));
    if (!month) return undefined;
    return month <= 2 || month === 12 ? 'winter' : month <= 5 ? 'spring' : month <= 8 ? 'summer' : 'autumn';
}

type Tone = [string, string, string, string, string, string]; // ground, ground2, ink, soft, accent, glow
const LIGHT: Record<Season | 'neutral', Tone> = {
    spring: ['#eef0e2', '#dfe8d3', '#2f3a2c', '#5d6b55', '#7f9a62', '#f6f1c9'],
    summer: ['#f6ead2', '#f0d9ae', '#3a2f20', '#6f5d40', '#c0893a', '#ffe7a8'],
    autumn: ['#efe0cb', '#e2c39c', '#3a2a1e', '#6e5640', '#b06a2f', '#f6cf93'],
    winter: ['#e6eaee', '#d3dbe3', '#26303a', '#56626e', '#6f8aa3', '#f3f6fa'],
    neutral: ['#f1eadc', '#e4dac6', '#2d2b25', '#615b4e', '#a18043', '#f7ecd2'],
};
const DARK: Record<Season | 'neutral', Tone> = {
    spring: ['#1b2119', '#25301f', '#eef0e2', '#b7c2a9', '#a9c48a', '#e9f0b8'],
    summer: ['#221b12', '#33261a', '#f7ecd8', '#cdb994', '#e0a95a', '#ffd88a'],
    autumn: ['#211812', '#33221a', '#f4e6d2', '#cbb497', '#d4884a', '#f1b56f'],
    winter: ['#151a21', '#1f2731', '#e9eef3', '#aeb9c4', '#9ab7d3', '#dfe9f5'],
    neutral: ['#1b1a17', '#26241f', '#f1eadc', '#bdb39f', '#c6a464', '#eed9a8'],
};
// Each gallery nudges the palette towards its own artistic language.
const ROOM_ACCENT: Record<RoomId, { light: string; dark: string }> = {
    glow: { light: '#c08a3e', dark: '#e3b062' }, hush: { light: '#6f8a76', dark: '#a7c0ab' },
    echo: { light: '#5f7891', dark: '#9fb6cf' }, pulse: { light: '#a8443a', dark: '#e0705d' },
};
const LABEL = {
    season: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' },
    weather: { sun: 'sunlight', rain: 'rain', snow: 'snow', fog: 'mist', wind: 'wind', storm: 'storm', cloud: 'overcast sky' },
    time: { morning: 'morning', day: 'afternoon', evening: 'evening', night: 'night' },
    place: { sea: 'by the water', mountain: 'in the mountains', forest: 'among trees', city: 'in the city', home: 'at home' },
};

export function readAtmosphere(diary: string, date: string, room: RoomId, theme: 'dark' | 'light', photoColor?: string): Atmosphere {
    const text = ' ' + diary.toLocaleLowerCase().normalize('NFC') + ' ';
    const weather = find(text, RULES.weather), time = find(text, RULES.time), place = find(text, RULES.place);
    const textSeason = find(text, RULES.season);
    // Explicit snow implies winter light; otherwise the words, then the calendar, set the season.
    const season = weather === 'snow' && !textSeason ? 'winter' : textSeason ?? seasonOf(date);
    const dark = theme === 'dark' || time === 'night';
    const tone = (dark ? DARK : LIGHT)[season ?? 'neutral'];
    const accent = ROOM_ACCENT[room][dark ? 'dark' : 'light'];
    const parts = [season && LABEL.season[season], weather && LABEL.weather[weather], time && LABEL.time[time], place && LABEL.place[place]].filter(Boolean) as string[];
    const caption = parts.length ? parts.join(' · ') : 'A quiet day';
    return {
        season, weather, time, place, room, dark, caption,
        fromText: { weather: !!weather, time: !!time, season: !!textSeason, place: !!place },
        palette: { ground: tone[0], ground2: tone[1], ink: tone[2], soft: tone[3], accent: photoColor && !dark ? mix(accent, photoColor, .35) : accent, glow: tone[5] },
    };
}
/** Simple sRGB mix of two #rrggbb colours. */
export function mix(a: string, b: string, t: number) {
    const p = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
    const x = p(a), y = p(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
