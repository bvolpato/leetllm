import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { lexicalTokens } from '../../lib/captions.mjs';
import { ttClamp } from './arithmetic.mjs';
import { ttCue } from './construction.mjs';

const scripts = new WeakMap();

// Input-only storyboards follow the same phrase order as the recorded narration.
export function sceneClock(scene, state) {
  if (state.cues) return (id) => ttCue(state, id);
  if (!scripts.has(scene)) {
    const lengths = scene.beats.map((beat) => lexicalTokens(beat.say).length);
    scripts.set(
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
  const script = scripts.get(scene);
  return (id) => {
    const cue = script.get(id);
    if (!cue) throw new Error(`Unknown cue ${scene.id}/${id}`);
    const beat = state.beat ?? 0;
    const time = ttClamp((state.beatP ?? 0) / 0.9);
    const p =
      beat < cue.beat
        ? 0
        : beat > cue.beat
          ? 1
          : ttClamp((time - cue.start) / (cue.end - cue.start));
    return { started: p > 0, done: p === 1, p };
  };
}
