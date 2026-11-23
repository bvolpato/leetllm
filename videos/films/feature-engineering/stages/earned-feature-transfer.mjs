import { freshFeatureEvents, featureNames, featureWeights } from '../fixtures.mjs';
import { clock } from '../arithmetic.mjs';
import { featureFrame, featureTransfer } from '../model.mjs';
import { drawHeartbeatLedger } from '../heartbeat-ledger.mjs';

const cutoff = 600;
const reference = featureTransfer(7, cutoff);
const capture = featureTransfer(0, cutoff);
const arrival = freshFeatureEvents[1].available;
const nextDecision = featureTransfer(7, arrival);
const threshold = 0.25;

export function drawEarnedFeatureTransfer(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  if (f.b < 2) {
    const chosen = f.completed('feature-fresh-heartbeat', 1);
    const selected = f.started('fresh-pick', 1) || chosen;
    const next = f.started('feature-fresh-history', 1);
    api.focus.target('fresh-history', () => {
      drawHeartbeatLedger(ctx, api, {
        records: freshFeatureEvents,
        cutoff,
        domain: [540, 620],
        ticks: [540, 560, 580, 600, 620],
        selected: selected ? reference.event : null,
        compared: selected,
        now: next ? arrival : undefined,
      });
      if (f.completed('fresh-next-decision', 1)) {
        const age = arrival - nextDecision.event.event;
        t(
          'New decision at ' +
            clock(arrival) +
            ' uses ' +
            clock(nextDecision.event.event) +
            '   /   ' +
            age +
            ' min old',
          960,
          1000,
          36,
          C.blue,
        );
      }
    });
    api.focus.target('fresh-vector', () => {
      if (!chosen) {
        t(
          selected ? '10:00 − 09:10 = ? h' : 'Which ping sets the age in the 10:00 row?',
          960,
          830,
          48,
          C.yellow,
        );
        return;
      }
      t(
        '10:00 replay   /   ' + clock(reference.event.event) + ' ping   /   50 min = 5/6 h',
        960,
        753,
        38,
        C.green,
      );
      const cues = [
        'fresh-pool',
        'fresh-pool',
        'fresh-pool',
        'fresh-queued',
        'feature-fresh-heartbeat',
        'fresh-backlog',
        'feature-fresh-vector',
        'feature-fresh-vector',
      ];
      reference.vector.forEach((value, i) => {
        const x = 249 + 202 * i;
        const filled = f.completed(cues[i], 1) || f.completed('feature-fresh-vector', 1);
        t(featureNames[i], x, 841, 29, C.muted);
        t(
          filled ? (Number.isInteger(value) ? String(value) : value.toFixed(3)) : '·',
          x,
          913,
          45,
          i === 4 ? C.green : C.ink,
        );
      });
    });
    return;
  }

  // The two successive beats share a score ruler through the question, pause and repair.
  const completed = (id, beat) =>
    state.cues?.[id] ? state.cues[id].phase === 'after' : f.completed(id, beat);
  const staleReady = completed('feature-fresh-stale', 2);
  const refReady = completed('feature-fresh-correct', 2);
  const verdict = completed('feature-fresh-threshold', 3);
  const repaired = completed('feature-fresh-repair', 3);
  const movement = f.progress('feature-fresh-repair', 3);
  const ruleVisible = f.started('fresh-rule', 2) || verdict;
  const x = (value) => 675 + value * 3500;
  const queuePart = capture.vector[3] * featureWeights[3];
  const base = queuePart + capture.vector[4] * featureWeights[4];
  const block = (a, z, y, color) =>
    api.rect(ctx, x(a), y - 11, x(z) - x(a), 22, color, undefined, 0);

  api.focus.target('fresh-scores', () => {
    t('10:00 UTC     /     same heartbeat, same layout, same weights', 139, 244, 34, C.ink, 'left');
    t('20 min × 0.01', 597, 344, 35, C.blue);
    t('5/6 h × 0.02', 989, 344, 35, C.cyan);
    t('Backlog × 0.01', 1450, 344, 35, C.green);
    const lanes = [
      { label: 'Captured request', y: 496, job: capture, ready: staleReady },
      { label: 'Eligible source: backlog 7', y: 643, job: reference, ready: refReady },
    ];
    if (verdict)
      lanes.push({
        label: 'Reconstruction: backlog ' + (repaired ? 7 : 0),
        y: 790,
        job: repaired ? reference : capture,
        ready: staleReady,
      });
    if (ruleVisible) {
      const xx = x(threshold);
      for (const [a, z] of [
        [423, 468],
        [523, 615],
        [672, 763],
        [816, 845],
      ])
        api.line(ctx, xx, a, xx, z, C.yellow, 4);
      t('Alert ≥ 0.25', xx, 413, 32, C.yellow);
    }
    for (const [i, lane] of lanes.entries()) {
      const { label, y, job, ready } = lane;
      t(label, 135, y + 12, 33, C.ink, 'left');
      api.line(ctx, x(0), y, x(0.31), y, C.panel, 5);
      if (!ready) continue;
      block(0, queuePart, y, C.blue);
      block(queuePart, base, y, C.cyan);
      if (job.vector[5] > 0) block(base, job.score, y, C.green);
      const color = verdict ? (job.score >= threshold ? C.green : C.pink) : C.cyan;
      api.circle(ctx, x(job.score), y, i === (verdict ? 2 : 0) ? 19 : 13, color);
      if (i === 0)
        t('captured backlog 0: ' + job.score.toFixed(6), 135, y + 57, 27, C.muted, 'left');
      else if (i === 1) t('source score ' + job.score.toFixed(6), 135, y + 57, 27, C.muted, 'left');
    }
    if (verdict && movement > 0 && movement < 1) {
      const y = api.lerp(lanes[1].y, lanes[2].y, movement);
      block(base, reference.score, y, C.green);
    }
    if (verdict) {
      t(
        'The threshold 0.25 separates the capture from the eligible source.',
        960,
        929,
        37,
        C.yellow,
      );
      if (repaired)
        t('Replayed score ' + reference.score.toFixed(6) + '   /   alert', 960, 1001, 38, C.green);
    } else if (ruleVisible) t('Which row would raise an alert?', 960, 943, 45, C.yellow);
    else t('Linear worksheet score', 960, 942, 33, C.muted);
  });
}

export default {
  id: 'earned-feature-transfer',
  draw: drawEarnedFeatureTransfer,
  cues: [
    'fresh-receipts',
    'fresh-pick',
    'feature-fresh-heartbeat',
    'fresh-pool',
    'fresh-queued',
    'fresh-backlog',
    'feature-fresh-vector',
    'feature-fresh-history',
    'fresh-next-decision',
    'feature-fresh-stale',
    'feature-fresh-correct',
    'fresh-rule',
    'feature-fresh-threshold',
    'feature-fresh-repair',
  ],
};
