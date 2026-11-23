import { mix } from '../arithmetic.mjs';
import { developmentBootstrap, macroTaskInterval, macroTaskScores } from '../fixtures.mjs';
import { completedHypothesisResult, cueProgress, resultOrOperation } from '../model.mjs';
import { card, mark, text } from '../defaults.mjs';
import { drawLiftRange, drawLiftRuler, liftVerdict } from '../lift-ruler.mjs';

function benchmarkClaim(ctx, state, api) {
  const C = api.C;
  const report = resultOrOperation(state, 'report-matched', 0);
  if (!report) {
    for (const [row, model, k, score] of [
      [0, 'A', 1, '58%'],
      [1, 'B', 5, '64%'],
    ]) {
      const y = 415 + row * 225;
      const color = row ? C.cyan : C.blue;
      text(ctx, api, `Model ${model}`, 209, y + 51, 40, color);
      for (let i = 0; i < k; i++)
        card(ctx, api, String(i + 1), 540 + i * 139, y, 106, 78, color, 32);
      text(ctx, api, `pass@${k}   ${score}`, 1600, y + 51, 43, color, 'right');
    }
    text(ctx, api, 'Candidate attempts per task', 550, 331, 32, C.muted);
    text(ctx, api, 'Which two scores can you subtract?', 960, 930, 44, C.yellow, 'center');
    return;
  }
  const macro = macroTaskScores.reduce((a, b) => a + b, 0) / macroTaskScores.length;
  const rows = [
    [
      'A and B   ·   40 paired tasks',
      'One attempt each',
      '+7.5 points',
      developmentBootstrap.interval.map((v) => 100 * v).join(' to +') + ' points',
    ],
    [
      'B only   ·   4 tasks',
      'Five of ten candidates',
      macro.toFixed(3),
      macroTaskInterval.map((v) => v.toFixed(3)).join(' to '),
    ],
  ];
  for (const [i, [name, unit, point, interval]] of rows.entries()) {
    const x = 222 + 854 * i;
    const color = i === 0 ? C.blue : C.cyan;
    text(ctx, api, name, x, 364, 38, color);
    text(ctx, api, unit, x, 449, 33, C.ink);
    api.line(ctx, x, 513, x + 610, 513, color, 3);
    text(ctx, api, i === 0 ? 'Paired lift' : 'Macro pass@5', x, 600, 34, color);
    text(ctx, api, point, x, 704, 64, C.ink);
    text(ctx, api, interval, x, 804, 38, color);
  }
  text(ctx, api, 'Approximate 95% task-bootstrap intervals', 960, 966, 33, C.muted, 'center');
}

function timeoutRow(ctx, state, api) {
  const C = api.C;
  text(ctx, api, 'Matched run   ·   Same prompt and hidden tests', 230, 324, 37, C.ink);
  text(
    ctx,
    api,
    'One attempt per model   ·   Fixed timeout   ·   Timeout counts as failure',
    230,
    397,
    32,
    C.muted,
  );
  for (const [i, label] of ['Task', 'Current  A', 'Challenger  B', 'B minus A'].entries())
    text(ctx, api, label, 358 + i * 404, 553, 33, C.muted, 'center');
  const timedOut = resultOrOperation(state, 'hyp-report-missing', 1);
  const applied = completedHypothesisResult(state, 'report-timeout-score', 1);
  const cells = ['new retry task', 'pass', timedOut ? 'timeout' : 'running', applied ? '−1' : '?'];
  for (const [i, value] of cells.entries())
    card(ctx, api, value, 188 + i * 404, 627, 340, 110, i === 2 && timedOut ? C.pink : C.blue, 40);
  if (applied)
    text(ctx, api, 'One paired task stays in the denominator.', 960, 916, 44, C.ink, 'center');
}

const cases = [
  { cue: 'report-contract-2', range: [0.01, 0.14] },
  { cue: 'hyp-report-equality', range: [0.02, 0.14] },
  { cue: 'hyp-report-regression', range: [-0.08, -0.01] },
  { cue: 'hyp-report-zero', range: developmentBootstrap.interval },
];

export function drawReportContract(ctx, scene, state, api) {
  mark(api, 'report-contract-construction', () => {
    if (!state.beat) return benchmarkClaim(ctx, state, api);
    if (state.beat === 1) return timeoutRow(ctx, state, api);
    const index = cases.findLastIndex((c) => resultOrOperation(state, c.cue, 2));
    const example = cases[Math.max(0, index)];
    const p = cueProgress(state, example.cue, 2);
    const range =
      index === 1 ? [mix(cases[0].range[0], example.range[0], p), example.range[1]] : example.range;
    drawLiftRuler(ctx, api);
    drawLiftRange(ctx, api, {
      name: 'Example interval',
      y: 482,
      interval: range,
      color: api.C.blue,
      progress: index === 1 ? 1 : p,
      highlightLower: true,
    });
    if (completedHypothesisResult(state, example.cue, 2))
      text(ctx, api, liftVerdict(example.range), 960, 680, 43, api.C.ink, 'center');
  });
}

export default {
  id: 'report-contract',
  draw: drawReportContract,
  cues: [
    'report-contract-0',
    'report-matched',
    'report-contract-1',
    'hyp-report-missing',
    'report-timeout-score',
    ...cases.map((example) => example.cue),
  ],
};
