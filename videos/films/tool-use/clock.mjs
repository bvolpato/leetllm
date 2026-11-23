import { sampleNarrationCues } from '../../lib/narration-cues.mjs';
import { estimatedTimeline } from '../../lib/stage-lesson.mjs';

const storyboards = new WeakMap();

function storyboardCues(scene, state) {
  let timing = storyboards.get(scene);
  if (!timing) {
    timing = estimatedTimeline({ id: 'tool-use', scenes: [scene] }).scenes[0];
    storyboards.set(scene, timing);
  }
  const beat = timing.beats[state.beat ?? 0];
  const time = beat.start + (state.beatP ?? 0) * (beat.until - beat.start);
  return sampleNarrationCues(timing.visualCues, time);
}

export function filmClock(scene, state) {
  const cues = state.cues ?? storyboardCues(scene, state);
  return {
    started: (id) => ['during', 'after'].includes(cues[id]?.phase),
    after: (id) => cues[id]?.phase === 'after',
    progress: (id) => cues[id]?.progress ?? 0,
  };
}
