import { boostCue } from '../construction.mjs';
import { copiedApril, drawBoundaryReplay, tiedJobs } from '../boundary-replay.mjs';
import { APRIL_SCORED_ROWS, COSTS, MAY_EVIDENCE } from '../fixtures.mjs';
import { APRIL_BOUNDARIES, selectedApril } from '../model.mjs';
import { cellText, chapterText, dot, line } from '../defaults.mjs';

const sortedJobs = [...APRIL_SCORED_ROWS].sort((a, b) => a.score - b.score);

function allBoundaries(ctx, api, endpoints) {
  const { C } = api;
  const x = (score) => 250 + score * 1400;
  cellText(
    ctx,
    api,
    sortedJobs.length + ' April jobs     ·     alert when score ≥ cutoff',
    960,
    280,
    C.ink,
    36,
  );
  const multiplicity = new Map();
  sortedJobs.forEach((job) => {
    const level = multiplicity.get(job.score) ?? 0;
    multiplicity.set(job.score, level + 1);
    dot(ctx, api, x(job.score), 630 - level * 38, job.label ? C.pink : C.blue, 9);
  });
  line(ctx, api, x(0), 690, x(1), 690, C.muted, 2);
  APRIL_BOUNDARIES.filter((t) => t <= 1).forEach((t) =>
    line(ctx, api, x(t), 680, x(t), 705, C.muted, 2),
  );
  for (const score of [0, 0.25, 0.5, 0.75, 1]) cellText(ctx, api, score, x(score), 760, C.ink, 29);
  cellText(ctx, api, 'Model score', 960, 826, C.muted, 30);
  if (endpoints) {
    chapterText(ctx, api, '0 includes every job', 140, 954, 32, C.cyan);
    chapterText(ctx, api, 'Above 1 includes no jobs', 1770, 954, 32, C.cyan, 'right');
  }
}
function mayCounts(ctx, api, savings) {
  const { C } = api;
  const [selected, all] = MAY_EVIDENCE;
  const groups = [
    [selected.tp, 'caught misses', C.pink],
    [selected.fp, 'false alerts', C.blue],
    [selected.tn, 'quiet, on time', C.muted],
  ];
  cellText(ctx, api, 'May  /  frozen model and stored cutoff', 960, 285, C.ink, 38);
  let count = 0;
  for (const [i, [n, label, color]] of groups.entries()) {
    for (let j = 0; j < n; j++, count++)
      api.rect(ctx, 245 + (count % 20) * 56, 380 + Math.floor(count / 20) * 58, 38, 38, color);
    chapterText(ctx, api, n + '  ' + label, 1415, 445 + 124 * i, 34, color);
  }
  cellText(
    ctx,
    api,
    selected.tp + selected.fp + ' alerts / ' + count + ' jobs',
    960,
    865,
    C.ink,
    39,
  );
  if (savings)
    cellText(
      ctx,
      api,
      selected.cost +
        ' vs ' +
        all.cost +
        ' units  ·  saves ' +
        (all.fp - selected.fp) +
        ' false alerts',
      960,
      970,
      C.yellow,
      34,
    );
}
export function drawThresholdBoundary(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const cue = (id, b) => boostCue(state, id, b);
  api.focus.target('threshold-boundary-model', () => {
    if (beat === 2) {
      mayCounts(ctx, api, cue('gbt-may-savings', 2) === 1);
      return;
    }
    if (!beat && cue('boundary-zoom', 0) === 0) {
      allBoundaries(ctx, api, cue('boundary-endpoints', 0) === 1);
      return;
    }
    const outcomes = cue('boundary-outcomes', 0) === 1;
    const copy = cue('boundary-copy', 1);
    const restore = cue('boundary-restore', 1);
    drawBoundaryReplay(ctx, api, {
      progress: copy * (1 - restore),
      showPolicy: true,
      showActions: false,
      outcomes,
      awaitingOutcomes: true,
      charges: beat === 1,
    });
    const difference = copiedApril.priorityMisses * COSTS.priorityMiss;
    const saved = (selectedApril.fp - copiedApril.fp) * COSTS.falseAlarm;
    let summary = 'One false alarm costs 8 units. A missed priority deadline costs 150.';
    if (beat === 1 && copy > 0 && restore === 0) {
      summary =
        cue('boundary-price', 1) === 1
          ? 'April cost    ' +
            selectedApril.cost +
            ' − ' +
            saved +
            ' + ' +
            difference +
            ' = ' +
            copiedApril.cost
          : 'Of the ' + tiedJobs.length + ' changed actions, which one carries the miss cost?';
    } else if (cue('boundary-counts', 1) === 1) {
      summary =
        'April cost    ' +
        selectedApril.fp +
        ' false alarms × ' +
        COSTS.falseAlarm +
        ' = ' +
        selectedApril.cost;
    }
    api.focus.target('boundary-summary', () =>
      cellText(ctx, api, summary, 960, 989, api.C.ink, 34),
    );
  });
}
export default {
  id: 'threshold-boundary',
  draw: drawThresholdBoundary,
  cues: [
    'threshold-boundary-step-1',
    'boundary-endpoints',
    'boundary-zoom',
    'boundary-outcomes',
    'boundary-counts',
    'boundary-copy',
    'boundary-price',
    'boundary-restore',
    'threshold-boundary-step-3',
    'gbt-may-savings',
  ],
};
