import { ids } from './fixtures.mjs';
import { createCueTrack } from 'vizmatic';
import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const tracks = track(ids);

const storyboardSpans = new WeakMap();

export function spoken(scene, state, id) {
  if (state.cues) {
    if (!state.cues[id]) throw new Error(`Missing cue ${scene.id}/${id}`);
    return state.cues[id];
  }
  // A silent storyboard uses word positions until measured narration is available.
  if (!storyboardSpans.has(scene)) {
    const spans = validateVisualCues(scene).map(({ id, beat, first, last }) => {
      const words = lexicalTokens(scene.beats[beat].say).length;
      return [id, { beat, start: first / words, end: (last + 1) / words }];
    });
    storyboardSpans.set(scene, new Map(spans));
  }
  const { beat, start, end } = storyboardSpans.get(scene).get(id);
  const position = (state.beat ?? 0) === beat ? (state.beatP ?? 0) : (state.beat ?? 0) - beat;
  const progress = Math.min(1, Math.max(0, (position - start) / (end - start)));
  return { progress, phase: position < start ? 'before' : position < end ? 'during' : 'after' };
}
