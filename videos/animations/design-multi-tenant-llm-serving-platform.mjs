import definition from '../films/design-multi-tenant-llm-serving-platform/index.mjs';
import { sampleNarrationCues } from '../lib/narration-cues.mjs';
import { estimatedTimeline } from '../lib/stage-lesson.mjs';

export * from '../films/design-multi-tenant-llm-serving-platform/index.mjs';

const storyboards = new WeakMap();
export function draw(ctx, scene, state, api) {
  if (state.cues || state.cueTiming === 'provider-words' || !scene.beats) {
    return definition.draw(ctx, scene, state, api);
  }
  // An isolated still has no recorded speech. Locate its phrases on the source clock.
  if (!storyboards.has(scene)) {
    storyboards.set(scene, estimatedTimeline({ id: definition.id, scenes: [scene] }).scenes[0]);
  }
  const timeline = storyboards.get(scene);
  const beat = timeline.beats[state.beat ?? 0];
  const time = beat.start + (state.beatP ?? 0) * (beat.until - beat.start);
  return definition.draw(
    ctx,
    scene,
    { ...state, cues: sampleNarrationCues(timeline.visualCues, time) },
    api,
  );
}
export default Object.freeze({ ...definition, draw });
