import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { sampleNarrationCues } from '../../lib/narration-cues.mjs';
import { estimatedTimeline } from '../../lib/stage-lesson.mjs';

const storyboards = new WeakMap();

export function sceneClock(scene, state) {
  let clock = state;
  if (!state.cues) {
    if (!storyboards.has(scene)) {
      storyboards.set(scene, estimatedTimeline({ id: scene.id, scenes: [scene] }).scenes[0]);
    }
    const timing = storyboards.get(scene);
    const beat = timing.beats[state.beat ?? 0];
    const time = beat.start + (state.beatP ?? 0) * (beat.until - beat.start);
    clock = { cues: sampleNarrationCues(timing.visualCues, time) };
  }
  const id = (name) => `ic-${scene.id}-${name}`;
  return {
    progress: (name) => operationProgress(clock, id(name)),
    after: (name) => resultAfter(clock, id(name)),
  };
}
