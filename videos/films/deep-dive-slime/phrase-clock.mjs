import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { lexicalTokens } from '../../lib/captions.mjs';
import { clamp } from './arithmetic.mjs';

const layouts = new WeakMap();

// Delivered frames use provider word times. Untimed storyboards use the same phrase spans.
export function progress(scene, state, id) {
  const measured = state.cues?.[id];
  if (measured) {
    if (measured.phase === 'before') return 0;
    if (measured.phase === 'after') return 1;
    return clamp(measured.progress ?? 0);
  }
  if (!layouts.has(scene)) {
    const cues = validateVisualCues(scene);
    layouts.set(
      scene,
      new Map(
        cues.map((cue) => [
          cue.id,
          {
            ...cue,
            words: lexicalTokens(scene.beats[cue.beat].say).length,
          },
        ]),
      ),
    );
  }
  const cue = layouts.get(scene).get(id);
  if (!cue) throw new Error(`Unknown phrase in ${scene.id}: ${id}`);
  const beat = state.beat ?? 0;
  if (beat !== cue.beat) return Number(beat > cue.beat);
  return clamp(((state.beatP ?? 0) * cue.words - cue.first) / (cue.last + 1 - cue.first));
}
