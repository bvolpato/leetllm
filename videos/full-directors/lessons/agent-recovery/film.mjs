import { cueClock } from './art.mjs';
import { checkExamples } from './examples.mjs';
import { admission, commit, contract, identity, opening, resume, workflow } from './dispatch.mjs';
import { breaker, probePolicy, progress, retryTiming, spend } from './limits.mjs';
import { compensation, fallback, practice } from './effects.mjs';

const chapters = [
  opening,
  admission,
  identity,
  commit,
  retryTiming,
  progress,
  breaker,
  resume,
  contract,
  workflow,
  spend,
  probePolicy,
  fallback,
  compensation,
  practice,
];

export default {
  title: 'Agent Recovery: Preserve Identity, Budget and Evidence',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    chapters[clock.beat.chapterIndex](ctx, cueClock(clock));
    ctx.restore();
  },
  check: checkExamples,
};
