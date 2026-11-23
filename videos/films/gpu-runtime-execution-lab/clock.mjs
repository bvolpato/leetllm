import { clamp } from './arithmetic.mjs';

// Word timings drive the delivered film. Untimed storyboards use the same phrase within its beat.
export function cueClock(scene, state) {
  return (id) => {
    const cue = state.cues?.[id];
    if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
    const beats = scene.beats ?? [];
    const index = beats.findIndex((beat) => beat.visual_cues?.some((item) => item.id === id));
    if (index < 0) return clamp(state.beatP ?? 0);
    if (state.beat !== index) return state.beat > index ? 1 : 0;
    const { say, visual_cues } = beats[index];
    const phrase = visual_cues.find((item) => item.id === id).phrase;
    const start = say.indexOf(phrase);
    return clamp(((state.beatP ?? 0) * say.length - start) / phrase.length);
  };
}
