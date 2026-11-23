import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { box } from './defaults.mjs';

const storyboardCues = new WeakMap();

// The canvas host supplies measured word times for delivery. Use the same phrases on silent storyboards.
export function cueClock(scene, state, api) {
  if (state.cues)
    return (id, travelSeconds = 0) => {
      const progress = api.focus.progress(id);
      if (!travelSeconds) return progress;
      const end = state.cues[id]?.end;
      if (Number.isFinite(end) && Number.isFinite(state.t))
        return api.clamp((state.t - end) / travelSeconds);
      return progress === 1 ? 1 : 0;
    };
  let cues = storyboardCues.get(scene);
  if (!cues) {
    cues = new Map(
      validateVisualCues(scene).map((cue) => {
        const beat = scene.beats[cue.beat];
        const length = lexicalTokens(beat.say).length + 2.5 * (beat.hold ?? 0.45);
        return [cue.id, {
          beat: cue.beat,
          from: cue.first / length,
          to: (cue.last + 1) / length,
          seconds: length / 2.5,
        }];
      }),
    );
    storyboardCues.set(scene, cues);
  }
  return (id, travelSeconds = 0) => {
    const { beat, from, to, seconds } = cues.get(id);
    if (state.beat !== beat) return state.beat > beat ? 1 : 0;
    if (travelSeconds) return api.clamp(((state.beatP - to) * seconds) / travelSeconds);
    return api.clamp((state.beatP - from) / (to - from));
  };
}

export function footprint(ctx, api, x, y, pitch, row, col, height, width, color = api.C.yellow) {
  box(
    ctx,
    api,
    x + col * pitch - 3,
    y + row * pitch - 3,
    width * pitch - 1,
    height * pitch - 1,
    color,
    4,
  );
}
