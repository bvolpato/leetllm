import { heard, progress } from '../clock.mjs';
import { drawReleaseRulers } from '../release-rulers.mjs';

export function drawFreshRelease(ctx, scene, state, api) {
  const change = progress(state, 'fresh-counter', 2);
  const measuredAgain = heard(state, 'fresh-measured', 3);
  const alternate = state.beat >= 2 && !measuredAgain;
  drawReleaseRulers(ctx, api, {
    cohort: alternate
      ? 'Same 400 judgments    ·    What if the replies were shorter?'
      : 'New candidate    ·    Same two release rules',
    wins: 222,
    growth: alternate ? 20 - change : 20,
    countVisible: heard(state, 'fresh-count', 0),
    intervalVisible: heard(state, 'fresh-interval', 0),
    growthVisible: heard(state, 'fresh-growth', 0),
    judged: alternate ? heard(state, 'fresh-pass', 3) : heard(state, 'fresh-hold', 1),
    prompt: alternate ? 'Would both rules pass?' : 'Which rule, if either, blocks release?',
    note: heard(state, 'fresh-next-pair', 3)
      ? 'Next vote     “Under P-7, I’ll open a ticket.”     /     “Migrations qualify for an exception.”'
      : measuredAgain
        ? 'Measured growth    +20 tokens'
        : alternate
          ? 'Measured candidate    ·    +20 tokens    ·    Held'
          : 'One planned comparison    ·    Independent blinded prompts    ·    No ties',
  });
}

export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'fresh-count',
    'fresh-interval',
    'fresh-growth',
    'fresh-hold',
    'fresh-counter',
    'fresh-pass',
    'fresh-measured',
    'fresh-next-pair',
  ],
};
