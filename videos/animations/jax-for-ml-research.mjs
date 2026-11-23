import definition from '../films/jax-for-ml-research/index.mjs';
import { estimatedTimeline } from '../lib/stage-lesson.mjs';
import { sampleNarrationCues } from '../lib/narration-cues.mjs';

export * from '../films/jax-for-ml-research/index.mjs';

const storyboards = new WeakMap();
export function draw(ctx, scene, state, api) {
  if (state.cues || state.cueTiming === 'provider-words') {
    return definition.draw(ctx, scene, state, api);
  }
  // Source-only canvas checks supply a beat position without any recorded words.
  if (!storyboards.has(scene)) {
    storyboards.set(scene, estimatedTimeline({ id: definition.id, scenes: [scene] }).scenes[0]);
  }
  const timing = storyboards.get(scene);
  const beat = timing.beats[state.beat];
  const time = beat.start + state.beatP * (beat.until - beat.start);
  const cues = sampleNarrationCues(timing.visualCues, time);
  const focus = { ...api.focus, progress: (id, fallback) => cues[id]?.progress ?? fallback };
  return definition.draw(
    ctx,
    scene,
    { ...state, cues, cueTiming: 'estimated-lexical-words' },
    { ...api, focus },
  );
}
export default Object.freeze({ ...definition, draw });
