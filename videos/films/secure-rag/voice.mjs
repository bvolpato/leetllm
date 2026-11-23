import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const storyboardSpans = new WeakMap();

// Storyboard clocks have no audio. Use the same phrase order as the measured cut.
export function voice(scene, state) {
  if (state.cues) return (id) => state.cues[id];
  if (!storyboardSpans.has(scene)) {
    const lengths = scene.beats.map((beat) => lexicalTokens(beat.say).length);
    storyboardSpans.set(
      scene,
      new Map(
        validateVisualCues(scene).map((cue) => [
          cue.id,
          {
            beat: cue.beat,
            start: cue.first / lengths[cue.beat],
            end: (cue.last + 1) / lengths[cue.beat],
          },
        ]),
      ),
    );
  }
  return (id) => {
    const { beat, start, end } = storyboardSpans.get(scene).get(id);
    const index = state.beat ?? 0;
    const position = index < beat ? 0 : index > beat ? 1 : (state.beatP ?? 0);
    const progress = Math.max(0, Math.min(1, (position - start) / (end - start)));
    return { progress, phase: position < start ? 'before' : position < end ? 'during' : 'after' };
  };
}
