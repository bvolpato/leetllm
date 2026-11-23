import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

export const cueProgress = (elapsed, start, end) =>
  Math.max(0, Math.min(1, (elapsed - start) / (end - start)));

const storyboardCues = new WeakMap();

export function spokenCue(scene, state, id) {
  if (state.cues?.[id]) return state.cues[id];
  // The silent Canvas check has a beat clock. Place its cuts on the same words as the voice.
  if (!storyboardCues.has(scene)) {
    const spans = validateVisualCues(scene).map((cue) => {
      const beat = scene.beats[cue.beat];
      const length = lexicalTokens(beat.say).length + 2.5 * (beat.hold ?? 0.45);
      return [cue.id, { beat: cue.beat, start: cue.first / length, end: (cue.last + 1) / length }];
    });
    storyboardCues.set(scene, new Map(spans));
  }
  const span = storyboardCues.get(scene).get(id);
  const position = (state.beat ?? 0) - span.beat + (state.beatP ?? 0);
  return {
    phase: position < span.start ? 'before' : position < span.end ? 'during' : 'after',
    progress: cueProgress(position, span.start, span.end),
  };
}
