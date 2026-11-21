let context: AudioContext | null = null;
let volume: GainNode | null = null;
export async function setAmbience(enabled: boolean) {
    if (!enabled) {
        if (context && volume) {
            volume.gain.setTargetAtTime(0, context.currentTime, .3);
            await context.suspend();
        }
        return;
    }
    if (!context) {
        context = new AudioContext();
        volume = context.createGain();
        volume.gain.value = 0;
        volume.connect(context.destination);
        // A quiet original, synthesized room tone, activated only by the visitor.
        for (const frequency of [130.81, 196, 261.63]) {
            const tone = context.createOscillator();
            const gain = context.createGain();
            tone.type = 'sine';
            tone.frequency.value = frequency;
            gain.gain.value = .035;
            tone.connect(gain);
            gain.connect(volume);
            tone.start();
        }
    }
    await context.resume();
    volume!.gain.setTargetAtTime(.32, context.currentTime, .8);
}
