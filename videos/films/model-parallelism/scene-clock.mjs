import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const storyboardCues = new WeakMap();

export function sceneClock(scene, state) {
  if (state.cues) {
    return {
      progress: (id) => state.cues[id]?.progress ?? 0,
      done: (id) => state.cues[id]?.phase === 'after',
    };
  }
  // A silent storyboard has beat positions. The production clock supplies word timings.
  if (!storyboardCues.has(scene)) {
    const spans = validateVisualCues(scene).map((cue) => {
      const words = lexicalTokens(scene.beats[cue.beat].say).length;
      return [cue.id, { beat: cue.beat, start: cue.first / words, end: (cue.last + 1) / words }];
    });
    storyboardCues.set(scene, new Map(spans));
  }
  const progress = (id) => {
    const cue = storyboardCues.get(scene).get(id);
    const beat = state.beat ?? 0;
    if (beat !== cue.beat) return Number(beat > cue.beat);
    return Math.max(0, Math.min(1, ((state.beatP ?? 0) - cue.start) / (cue.end - cue.start)));
  };
  return { progress, done: (id) => progress(id) === 1 };
}
