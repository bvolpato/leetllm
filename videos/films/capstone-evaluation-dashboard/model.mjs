import { DASHBOARD_FIXTURES, baseline, drawIds, ids, repaired, unsafe } from './fixtures.mjs';
import {
  candidateRows,
  dashboardDecision,
  dashboardFreshReveal,
  dashboardPairs,
  dashboardRows,
  filterSnapshot,
  gate,
  gradeDashboardOutput,
  histogram,
  pairedDraw,
  percentileBand,
  resamples,
  subsetAvailability,
  sum,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
import { fifthCase } from './stages/fresh-attack.mjs';
import { viewRows } from './view.mjs';
export const track = createCueTrack({
  initial: {
    id: 'first',
    snapshot: 0,
  },
  cues: [
    {
      id: 'second',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
// Edge's measured "repaired output" cue starts 10.0875 seconds into beat 0.
// The beat's position runs from 0.4s through 17.566s, including its hold.
export // Edge's measured "repaired output" cue starts 10.0875 seconds into beat 0.
// The beat's position runs from 0.4s through 17.566s, including its hold.
const repairedOutputAt = 10.0875 / (17.566 - 0.4);
export const gateTrack = createCueTrack({
  initial: {
    id: 'first-hybrid',
    snapshot: 'first-hybrid',
  },
  cues: [
    {
      id: 'repaired-output',
      beat: 0,
      at: repairedOutputAt,
      snapshot: 'repaired',
    },
    {
      id: 'repaired-gate',
      beat: 1,
      at: 0,
      snapshot: 'repaired',
    },
  ],
});
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    candidate = gateTrack.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  return {
    b,
    candidate,
    p,
    q: b ? 1 : p,
    visible: b ? 256 : Math.floor(256 * p),
  };
}
export function validateModel() {
  validateDashboardExpansion();
  assert.equal(filterSnapshot(0, 0).visibleIds.length, 0);
  assert.equal(filterSnapshot(1, 0.9).decision, 'HOLD CANDIDATE');
  assert.equal(filterSnapshot(1, 0.9).failureCount, 1);
  assert.equal(sum(baseline), sum(unsafe));
  assert.equal(gate(unsafe), 'HOLD CANDIDATE');
  assert.equal(gate(repaired), 'EXPAND OFFLINE EVAL');
  const beforeRepair = sampleModel({
    beat: 0,
    beatP: repairedOutputAt - 0.0001,
  });
  const afterRepair = sampleModel({
    beat: 0,
    beatP: repairedOutputAt,
  });
  assert.equal(beforeRepair.candidate, 'first-hybrid');
  assert.equal(gate(candidateRows(beforeRepair.candidate)), 'HOLD CANDIDATE');
  assert.equal(afterRepair.candidate, 'repaired');
  assert.equal(gate(candidateRows(afterRepair.candidate)), 'EXPAND OFFLINE EVAL');
  assert.equal(
    sampleModel({
      beat: 0,
      beatP: 0.99,
    }).candidate,
    'repaired',
  );
  assert.equal(
    sampleModel({
      beat: 1,
      beatP: 0.1,
    }).candidate,
    'repaired',
  );
  for (const grades of [
    [],
    [true],
    [true, true, true],
    [true, true, true, true, true],
    [true, true, true, 1],
    [true, true, true, 'false'],
    null,
  ])
    assert.equal(gate(grades), 'HOLD COMPARISON');
  assert.equal(gate(repaired, null), 'HOLD COMPARISON');
  assert.equal(gate(repaired, ids.slice(0, 3)), 'HOLD COMPARISON');
  assert.equal(gate(repaired, [...ids.slice(0, 3), ids[0]]), 'HOLD COMPARISON');
  assert(resamples(repaired).every((v) => v === 1));
  assert.deepEqual(percentileBand(resamples(baseline)), [0.25, 1]);
  assert.deepEqual(percentileBand(resamples(repaired)), [1, 1]);
  assert.deepEqual(percentileBand(resamples(baseline, repaired)), [0, 0.75]);
  assert.equal(sum(resamples(baseline, repaired)) / 256, 0.25);
  for (let code = 0; code < 256; code++)
    assert.equal(pairedDraw(code).delta, resamples(baseline, repaired)[code]);
  assert.equal(
    histogram(resamples(baseline)).reduce((x, y) => x + y),
    256,
  );
  return true;
}
export function validateDashboardExpansion() {
  const unsafe = dashboardRows(),
    repaired = dashboardRows('hybrid-v2');
  assert.deepEqual(unsafe.at(-1).failures, [
    'status_mismatch',
    'unexpected_citation',
    'answer_mismatch',
  ]);
  assert.equal(dashboardDecision(unsafe), 'HOLD CANDIDATE');
  assert.equal(dashboardDecision(repaired), 'EXPAND OFFLINE EVAL');
  const first = dashboardRows('extractive-v1');
  const arriving = [unsafe[0], unsafe[3], unsafe[2], unsafe[1]];
  assert.deepEqual(
    arriving.map((r, i) => Number(r.passed) - Number(first[i].passed)),
    [0, 0, 0, 0],
  );
  const paired = dashboardPairs(first, arriving);
  assert.deepEqual(
    first.map((r) => paired.find((p) => p.id === r.id).delta),
    [0, 1, 0, -1],
  );
  assert.equal(sum(drawIds.map((i) => first[i].passed)), 2);
  assert.equal(sum(drawIds.map((i) => Number(repaired[i].passed) - Number(first[i].passed))), 2);
  const empty = viewRows('private_note_injection', true);
  assert.equal(empty.visible.length, 0);
  assert.equal(empty.decision, 'HOLD CANDIDATE');
  assert.equal(empty.failed[0].id, 'private_note_injection');
  assert.equal(fifthCase(false).decision, 'HOLD COMPARISON');
  const complete = fifthCase(true);
  assert.equal(complete.decision, 'HOLD CANDIDATE');
  assert.deepEqual(complete.row.failures, ['unexpected_citation']);
  assert.equal(sum(complete.candidate.map((row) => row.passed)), 4);
  for (const changed of [
    repaired.slice(0, -1),
    [...repaired, repaired[0]],
    repaired.map((r, i) =>
      i
        ? r
        : {
            ...r,
            passed: false,
          },
    ),
    repaired.map((r, i) =>
      i
        ? r
        : {
            ...r,
            latency: false,
          },
    ),
  ])
    assert.equal(dashboardDecision(changed), 'HOLD COMPARISON');
  const fabricated = unsafe.map((r) => {
    const f = DASHBOARD_FIXTURES.find((f) => f.id === r.id),
      o = {
        ...r,
        status: f.status,
        citations: [...f.citations],
        answer: f.answer,
      };
    return {
      ...o,
      ...gradeDashboardOutput(o, f),
    };
  });
  assert.equal(dashboardDecision(fabricated), 'EXPAND OFFLINE EVAL');
  assert.deepEqual(
    dashboardPairs(dashboardRows('extractive-v1'), repaired),
    dashboardPairs(dashboardRows('extractive-v1'), [...repaired].reverse()),
  );
  assert.equal(subsetAvailability([true, true, false, false, false], 2).rate, 0.7);
  const cues = Object.fromEntries(
    ['fresh-dashboard-rate', 'fresh-dashboard-predicates', 'fresh-attack-step-2'].map((id) => [
      id,
      {
        phase: 'before',
        progress: 0,
      },
    ]),
  );
  assert.deepEqual(
    dashboardFreshReveal({
      beat: 0,
      beatP: 1,
      cues,
    }),
    {
      rate: false,
      predicates: false,
      hold: false,
    },
  );
}
