import { completed, operation, partialSumConstruction } from '../construction.mjs';
import { comparisonRuns, passesGates, qualityGates } from '../fixtures.mjs';
import { text, valueBox, movingValue } from '../defaults.mjs';

function drawKernelCheck(ctx, state, api) {
  const { C } = api;
  const current = partialSumConstruction(state);
  text(
    ctx,
    api,
    'Same inputs · separate FP16 and FP32 accumulator states',
    960,
    270,
    37,
    C.yellow,
    'center',
  );
  current.inputs.forEach((v, i) =>
    valueBox(ctx, api, (v > 0 ? '+' : '−') + Math.abs(v), 590 + i * 370, 360, 280, C.blue, 34),
  );
  const rows = [
    ['Reduced FP16', current.fp16, C.pink],
    ['FP32', current.fp32, C.green],
  ];
  rows.forEach(([name, value, color], i) => {
    const y = 585 + i * 230;
    text(ctx, api, name, 270, y + 50, 33, color);
    valueBox(
      ctx,
      api,
      Number.isFinite(value) ? String(value) : 'Inf',
      1130,
      y,
      500,
      current.step ? color : C.muted,
      43,
    );
    if (current.step < 3) {
      const input = current.inputs[current.step];
      text(
        ctx,
        api,
        `${input > 0 ? '+' : '−'}${Math.abs(input)} incoming`,
        820,
        y + 25,
        29,
        C.yellow,
        'center',
      );
      api.arrow(ctx, 600, y + 80, 1100, y + 80, color, 3);
      movingValue(ctx, api, [600, y + 80], [1100, y + 80], current.incoming, color);
    }
    text(
      ctx,
      api,
      `Committed contributions: ${current.step}/3`,
      1380,
      y + 145,
      26,
      C.muted,
      'center',
    );
  });
  text(
    ctx,
    api,
    current.step === 3
      ? 'Final 40000 fits FP16; the overflowing partial cannot be repaired by cancellation'
      : 'Commit each partial only after its addition completes',
    960,
    1040,
    28,
    C.muted,
    'center',
  );
}

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 4) {
    api.focus.target('kernel-partials', () => drawKernelCheck(ctx, state, api));
    return;
  }
  if (beat === 6 && operation(state, 'state-ownership') > 0) {
    api.focus.target('parameter-bytes', () => {
      text(ctx, api, 'One parameter in run A', 960, 332, 68, C.ink, 'center');
      const parts = [
        ['Weight', C.blue],
        ['Gradient', C.pink],
        ['First moment', C.yellow],
        ['Second moment', C.yellow],
      ];
      const groupWidth = 328;
      const gap = 36;
      const start = (1920 - (4 * groupWidth + 3 * gap)) / 2;
      parts.forEach(([name, color], i) => {
        const x = start + i * (groupWidth + gap);
        text(ctx, api, name, x + groupWidth / 2, 507, 39, color, 'center');
        for (let byte = 0; byte < 4; byte++) {
          api.rect(ctx, x + byte * 82, 546, 78, 94, color);
        }
        text(ctx, api, 'FP32  ·  4 B', x + groupWidth / 2, 702, 34, C.ink, 'center');
      });
      const total = operation(state, 'byte-total');
      if (total > 0) {
        const edge = start + total * (1920 - 2 * start);
        api.line(ctx, start, 749, edge, 749, C.ink, 4);
        api.line(ctx, start, 734, start, 749, C.ink, 4);
        api.line(ctx, edge, 734, edge, 749, C.ink, 4);
      }
      if (completed(state, 'byte-total')) text(ctx, api, '16 bytes', 960, 861, 84, C.ink, 'center');
      if (operation(state, 'which-worker') > 0)
        text(ctx, api, 'Which worker holds those bytes?', 960, 1000, 48, C.yellow, 'center');
    });
    return;
  }
  const revised = beat === 5 ? operation(state, 'policy-retest') : beat > 5 ? 1 : 0;
  const runs = comparisonRuns(0.92 + (qualityGates.policy - 0.92) * revised);
  const originalVerdict = beat === 2 || beat === 3;
  const finalVerdict = beat === 6 && completed(state, 'final-selection');
  const rank = (originalVerdict && (beat > 2 || completed(state, 'quality-speed'))) || finalVerdict;
  const x = (rate) => 365 + ((rate - 0.974) / 0.026) * 840;
  const y = (rate) => 805 - ((rate - 0.9) / 0.06) * 425;
  const pct = (v) => Number((100 * v).toFixed(1)) + '%';
  const shown = (id) => beat > 0 || operation(state, id) > 0;

  text(ctx, api, 'Example runs on the same GPU and held-out set', 120, 262, 36, C.ink);
  text(ctx, api, 'Policy pass rate', 170, 340, 31, C.muted);
  api.rect(
    ctx,
    x(qualityGates.format),
    y(0.96),
    x(1) - x(qualityGates.format),
    y(qualityGates.policy) - y(0.96),
    C.panel,
    undefined,
    0,
  );
  api.line(ctx, x(0.974), y(0.9), x(1), y(0.9), C.muted, 3);
  api.line(ctx, x(0.974), y(0.9), x(0.974), y(0.96), C.muted, 3);
  api.line(ctx, x(qualityGates.format), y(0.9), x(qualityGates.format), y(0.96), C.yellow, 3);
  api.line(ctx, x(0.974), y(qualityGates.policy), x(1), y(qualityGates.policy), C.yellow, 3);
  for (const v of [0.9, 0.93, 0.96]) {
    text(
      ctx,
      api,
      pct(v),
      x(0.974) - 22,
      y(v) + 10,
      31,
      v === qualityGates.policy ? C.yellow : C.muted,
      'right',
    );
  }
  for (const v of [0.98, 0.99, 1]) {
    text(ctx, api, pct(v), x(v), 858, 31, v === qualityGates.format ? C.yellow : C.muted, 'center');
  }
  text(ctx, api, 'Format pass rate', 795, 915, 32, C.muted, 'center');
  text(ctx, api, 'Examples per second', 1510, 420, 31, C.muted, 'center');

  runs.forEach((run, index) => {
    if (!shown(index ? 'place-b' : 'place-a')) return;
    const annotated =
      finalVerdict ||
      (originalVerdict && (beat === 3 || completed(state, index ? 'quality-b' : 'quality-a')));
    const color = annotated ? (passesGates(run) ? C.green : C.pink) : index ? C.cyan : C.blue;
    const section = index ? 'run-b' : 'run-a';
    api.focus.target(section, () => {
      const px = x(run.format),
        py = y(run.policy);
      api.circle(ctx, px, py, 13, color);
      const pair = run.name + '   ' + pct(run.format) + '  /  ' + pct(run.policy);
      text(ctx, api, pair, px + 22, py + (index ? -29 : 54), 32, color);
      const lineY = 540 + index * 175;
      text(ctx, api, run.name, 1360, lineY, 40, color);
      text(ctx, api, run.speed.toLocaleString('en-US'), 1670, lineY, 46, color, 'right');
      if (annotated)
        text(
          ctx,
          api,
          passesGates(run) ? 'PASS BOTH' : 'FAIL POLICY',
          1510,
          lineY + 57,
          27,
          color,
          'center',
        );
    });
  });

  let caption;
  if (rank) {
    const eligible = runs.filter(passesGates).sort((a, b) => b.speed - a.speed);
    caption =
      (eligible.length === 1
        ? 'Only ' + eligible[0].name + ' enters'
        : 'Both qualify. Choose ' + eligible[0].name) +
      '   ·   ' +
      eligible[0].speed.toLocaleString('en-US') +
      ' examples/s';
  } else if (beat === 5 || beat === 6) {
    caption = 'If A reaches the policy minimum, which run would you choose?';
  } else {
    caption = 'Which run meets both minimum pass rates?';
  }
  text(ctx, api, caption, 960, 1003, 40, rank ? C.green : C.ink, 'center');
}

export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'place-a',
    'place-b',
    'quality-a',
    'quality-b',
    'quality-speed',
    'policy-retest',
    'final-selection',
    'state-ownership',
    'byte-total',
    'which-worker',
    'partial-inputs',
    'partial-first',
    'partial-second',
    'partial-final',
  ],
};
