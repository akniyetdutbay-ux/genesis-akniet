import type { Memory } from './memories';
export type RoomId = 'glow' | 'hush' | 'echo' | 'pulse';
export type Place = 'entrance' | 'hall' | RoomId;
export interface Artwork {
    memory?: Memory;
    title: string;
    subtitle: string;
    note: string;
    seed: number;
}
export interface Room {
    id: RoomId;
    name: string;
    emotion: string;
    line: string;
    description: string;
    wall: string;
    floor: string;
    accent: string;
    light: string;
    works: Artwork[];
}
export const rooms: Room[] = [
    { id: 'glow', name: 'Glow', emotion: 'The gallery of joy', line: 'For the days that stayed warm.', description: 'Sunlight on a familiar table. Laughter from the next room. The small things that made a day feel full.', wall: '#d4b58b', floor: '#b4a184', accent: '#eac785', light: '#fff1cf', works: [{ title: 'The long way home', subtitle: 'An afternoon without a hurry', note: 'The sun was still warm when we took the longer road. Nothing remarkable happened. That was what made it ours.', seed: 11 }, { title: 'At the same table', subtitle: 'The comfort of being together', note: 'Someone poured another cup. The conversation wandered, and for a while there was nowhere else to be.', seed: 24 }, { title: 'Almost summer', subtitle: 'A little ordinary happiness', note: 'Open windows, bare feet and a breeze that carried the promise of longer days.', seed: 36 }] },
    { id: 'hush', name: 'Hush', emotion: 'The gallery of stillness', line: 'A little room to simply be.', description: 'A quiet morning. The slow movement of light. Here, even the smallest moments have room to breathe.', wall: '#9ba99a', floor: '#b8bbae', accent: '#d4e0ce', light: '#e8f2e6', works: [{ title: 'Before the world woke', subtitle: 'The quiet of an early morning', note: 'There was no reason to rush. We watched the mist lift, and let the morning arrive in its own time.', seed: 41 }, { title: 'A place to pause', subtitle: 'The familiar sound of silence', note: 'The room was still. Beyond the window, the trees moved just enough to remind us that time was passing.', seed: 52 }, { title: 'Nothing to prove', subtitle: 'A day held lightly', note: 'We put our plans aside and listened to the rain. For once, enough felt like enough.', seed: 63 }] },
    { id: 'echo', name: 'Echo', emotion: 'The gallery of memory', line: 'Some days never quite leave us.', description: 'Places we carry. People we remember. A quiet conversation between what was and what remains.', wall: '#697a8a', floor: '#777e82', accent: '#b6c3d2', light: '#d9e7ff', works: [{ title: 'The house we remember', subtitle: 'A place that lives inside us', note: 'In memory, the windows are always lit. We return without a key, finding pieces of ourselves in every room.', seed: 71 }, { title: 'Last light by the sea', subtitle: 'The shape of an absence', note: 'We stayed until the colours faded. I cannot remember what we said, only that we did not want to leave.', seed: 82 }, { title: 'A letter, unfinished', subtitle: 'Words that still belong somewhere', note: 'Some things return as a sound, some as a colour. This one returns as the feeling of a page beneath my hand.', seed: 93 }] },
    { id: 'pulse', name: 'Pulse', emotion: 'The gallery of intensity', line: 'For the moments you felt everything.', description: 'The first brave step. The rush of becoming. Days that asked more of us, and gave something back.', wall: '#773d43', floor: '#4b4848', accent: '#e4b0a1', light: '#ffe3cf', works: [{ title: 'On the other side of fear', subtitle: 'The moment before a beginning', note: 'My hands were shaking. I went anyway. The world did not change all at once, but something in me did.', seed: 101 }, { title: 'Everything in motion', subtitle: 'A day that would not stand still', note: 'One decision became another. By evening, the person who had woken that morning felt wonderfully far away.', seed: 112 }, { title: 'We made it here', subtitle: 'The quiet after the climb', note: 'We stood still at last. The distance behind us was real, and for the first time we could see how far we had come.', seed: 123 }] }
];
export const roomById = (id: Place) => rooms.find(room => room.id === id);
export function exhibitionPosition(index: number, room: RoomId = 'glow'): [
    number,
    number,
    number
] {
    const layouts = { glow: { spread: 3.35, start: 3, step: 7, offset: 3.4 }, hush: { spread: 4.6, start: 7, step: 8, offset: 2.4 }, echo: { spread: 3.8, start: 4.5, step: 9, offset: 6 }, pulse: { spread: 3.4, start: 2.5, step: 8, offset: 5 } };
    const layout = layouts[room];
    return [index % 2 === 0 ? -layout.spread : layout.spread, 2.65, -layout.start - Math.floor(index / 2) * layout.step - (index % 2) * layout.offset];
}
