import assert from 'node:assert/strict';
import { checkEvidence } from './evidence.mjs';
import {
  opening,
  snapshot,
  clocks,
  history,
  targets,
  calibration,
  freshness,
  synthesis,
} from './journey.mjs';
import { costPlot, threshold, selection, fitting } from './policy.mjs';
import { testPredictions, replay, monitor, serving, servingState } from './release.mjs';
import street from '../../../director-cuts/lessons/capstone-delivery-eta-prediction/film.mjs';

const chapters = [
  opening,
  snapshot,
  clocks,
  history,
  targets,
  calibration,
  freshness,
  costPlot,
  threshold,
  selection,
  fitting,
  testPredictions,
  replay,
  monitor,
  serving,
  synthesis,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  chapters[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
function check() {
  checkEvidence();
  street.check();
  const state = (beatIndex, cues) =>
    servingState({ beat: { beatIndex }, reveal: (p) => Number(cues.includes(p)) });
  assert.deepEqual(state(0, ['changes the registry alias', 'returns version two']), {
    alias: 'v3',
    live: 'v2',
    ready3: false,
    verified: true,
  });
  assert.deepEqual(state(1, ['Wait for readiness', 'Route a request']), {
    alias: 'v3',
    live: 'v3',
    ready3: true,
    verified: false,
  });
  assert.equal(state(2, ['switch traffic back', 'Check the old fingerprint']).live, 'v2');
}
export default { title: 'An Arrival Estimate You Can Explain', draw, check };
