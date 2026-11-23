import { lexicalTokens } from '../../lib/captions.mjs';
import { operationProgress } from '../../lib/lesson-definition.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const storyboardTimes = new WeakMap();

export function cueClock(scene, state) {
  if (state.cues) return (id) => operationProgress(state, id);

  // An untimed storyboard uses the phrase's position in its own beat.
  if (!storyboardTimes.has(scene)) {
    const spans = new Map();
    for (const cue of validateVisualCues(scene)) {
      const wordCount = lexicalTokens(scene.beats[cue.beat].say).length;
      spans.set(cue.id, {
        beat: cue.beat,
        start: cue.first / wordCount,
        end: (cue.last + 1) / wordCount,
      });
    }
    storyboardTimes.set(scene, spans);
  }
  return (id) => {
    const { beat, start, end } = storyboardTimes.get(scene).get(id);
    const current = state.beat ?? 0;
    if (current !== beat) return Number(current > beat);
    return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
  };
}
