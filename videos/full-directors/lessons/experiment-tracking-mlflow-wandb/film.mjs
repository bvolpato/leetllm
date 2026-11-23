import { checkExperiments } from './experiment.mjs';
import {
  replay,
  runRecord,
  suite,
  insideHash,
  paired,
  routes,
  auditRows,
  storage,
  conditions,
  saturation,
} from './replay.mjs';
import {
  platforms,
  registry,
  version,
  alias,
  sdk,
  weave,
  tokenCost,
  types,
} from './instruments.mjs';
import { splits, canary, optimizer, selection, finalPractice } from './review.mjs';

const chapters = {
  c01: replay,
  c02: runRecord,
  c03: suite,
  c04: insideHash,
  c05: paired,
  c06: routes,
  c07: auditRows,
  c08: storage,
  c09: conditions,
  c10: saturation,
  c11: platforms,
  c12: registry,
  c13: version,
  c14: alias,
  c15: sdk,
  c16: weave,
  c17: tokenCost,
  c18: types,
  c19: splits,
  c20: canary,
  c21: optimizer,
  c22: selection,
  c23: finalPractice,
};
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  chapters[clock.beat.chapterId](ctx, clock);
  ctx.restore();
}
export default { title: 'Make Every Experiment Explain Its Result', draw, check: checkExperiments };
