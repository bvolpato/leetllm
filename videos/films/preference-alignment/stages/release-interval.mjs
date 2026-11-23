import { heard } from '../clock.mjs';
import { drawReleaseRulers } from '../release-rulers.mjs';

export function drawReleaseInterval(ctx, scene, state, api) {
  drawReleaseRulers(ctx, api, {
    cohort: 'Candidate with a +0.31 judge-score gain',
    wins: 184,
    growth: 48,
    countVisible: heard(state, 'release-count', 1),
    intervalVisible: heard(state, 'release-interval', 1),
    growthVisible: heard(state, 'release-growth', 1),
    judged: heard(state, 'release-hold', 2),
    prompt:
      state.beat === 0 ? 'Both rules are required.' : 'Does either measurement clear its rule?',
    note: 'Independent prompts    ·    Blinded order    ·    One planned comparison    ·    No ties',
  });
}

export default {
  id: 'release-interval',
  draw: drawReleaseInterval,
  cues: [
    'release-win-rule',
    'release-length-rule',
    'release-count',
    'release-interval',
    'release-growth',
    'release-hold',
  ],
};
