import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const spans = new WeakMap();

// Storyboard samples have a beat clock. The delivered film has measured word cues.
export function spoken(scene, state, id) {
  if (state.cues?.[id]) return state.cues[id];
  if (!spans.has(scene)) {
    const cues = validateVisualCues(scene).map((cue) => {
      const count = lexicalTokens(scene.beats[cue.beat].say).length;
      return [cue.id, { beat: cue.beat, start: cue.first / count, end: (cue.last + 1) / count }];
    });
    spans.set(scene, new Map(cues));
  }
  const { beat, start, end } = spans.get(scene).get(id);
  const current = state.beat ?? 0;
  if (current < beat) return { phase: 'before', progress: 0 };
  if (current > beat) return { phase: 'after', progress: 1 };
  const p = state.beatP ?? 0;
  const progress = Math.min(1, Math.max(0, (p - start) / (end - start)));
  return { progress, phase: p < start ? 'before' : p < end ? 'during' : 'after' };
}
