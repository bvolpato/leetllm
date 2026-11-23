import { exactMatch, mix, ramp } from '../arithmetic.mjs';
import { examples } from '../fixtures.mjs';
import { batchFrame } from '../model.mjs';
import { box, code, footer, mark, text } from '../defaults.mjs';
export function drawBatch(ctx, scene, state, api) {
  const modelState = batchFrame(state),
    currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    mark(api, 'loop-code', () =>
      code(
        ctx,
        api,
        [
          'results = []',
          'for row in examples:',
          '    expected = row["expected"].strip().lower()',
          '    prediction = row["prediction"].strip().lower()',
          '    correct = prediction == expected',
          '    results.append(correct)',
        ],
        150,
        335,
        28,
        65,
        modelState.active >= 0 ? (modelState.parts[modelState.active] < 0.55 ? 4 : 5) : -1,
      ),
    );
    mark(api, 'loop-rows', () =>
      examples.forEach((row, i) => {
        const active = modelState.active === i,
          y = 315 + i * 135;
        box(ctx, api, 1240, y, 520, 105, active ? api.C.yellow : api.C.muted);
        text(ctx, api, 'request ' + (101 + i), 1260, y + 39, 29, active ? api.C.yellow : api.C.ink);
        text(
          ctx,
          api,
          row.expected + ' / ' + row.prediction.trim().toLowerCase(),
          1260,
          y + 83,
          26,
          api.C.muted,
        );
      }),
    );
  } else
    mark(api, 'aggregate-code', () =>
      code(
        ctx,
        api,
        [
          'matches = sum(results)',
          'total = len(results)',
          'score = matches / total',
          'print(f"{score:.3f}")',
        ],
        190,
        340,
        40,
        85,
        modelState.fraction !== null ? 2 : modelState.total !== null ? 1 : 0,
      ),
    );
  mark(api, 'result-list', () => {
    text(ctx, api, 'results =', 180, 875, 38, api.C.cyan, 'left', true);
    text(ctx, api, '[', 465, 875, 48, api.C.cyan, 'left', true);
    const closingX =
      modelState.processed === 0 ? 505 : 520 + (modelState.processed - 1) * 395 + 300;
    text(ctx, api, ']', closingX, 875, 48, api.C.cyan, 'left', true);
    modelState.parts.forEach((p, i) => {
      const x = 520 + i * 395,
        value = modelState.results[i];
      text(ctx, api, 'request ' + (101 + i), x + 140, 770, 28, api.C.muted, 'center');
      if (p > 0 && p < 1) {
        const sourceY = 380 + i * 135,
          down = ramp(p, 0, 0.45),
          across = ramp(p, 0.45, 0.8),
          up = ramp(p, 0.8, 1);
        const movingX = mix(1810, x + 140, across),
          movingY = mix(mix(sourceY, 945, down), 871, up);
        const correct = exactMatch(examples[i].expected, examples[i].prediction);
        text(
          ctx,
          api,
          correct ? 'True' : 'False',
          movingX,
          movingY,
          32,
          correct ? api.C.green : api.C.pink,
          'center',
          true,
        );
      }
      if (p === 1) box(ctx, api, x, 805, 280, 100, value === false ? api.C.pink : api.C.green);
      if (value !== null)
        text(
          ctx,
          api,
          value ? 'True' : 'False',
          x + 140,
          871,
          44,
          value ? api.C.green : api.C.pink,
          'center',
          true,
        );
      if (i < modelState.processed - 1)
        text(ctx, api, ',', x + 305, 875, 42, api.C.cyan, 'left', true);
    });
  });
  if (currentBeat === 1)
    mark(api, 'count-receipt', () => {
      text(
        ctx,
        api,
        modelState.matches === null
          ? 'sum = ?'
          : modelState.appended.map(Number).join(' + ') + ' = ' + modelState.matches,
        1300,
        360,
        42,
        api.C.green,
        'center',
        true,
      );
      text(
        ctx,
        api,
        modelState.total === null ? 'len = ?' : 'len = ' + modelState.total,
        1300,
        470,
        42,
        api.C.cyan,
        'center',
        true,
      );
      if (modelState.fraction !== null)
        api.math(
          ctx,
          '\\frac{' +
            modelState.matches +
            '}{' +
            modelState.total +
            '}\\approx' +
            modelState.fraction.toFixed(3),
          1300,
          630,
          65,
          api.C.yellow,
          'center',
        );
    });
  footer(
    ctx,
    api,
    currentBeat === 0
      ? 'The selected row owns the Boolean until append completes.'
      : 'Every Boolean contributes one place to the denominator.',
  );
}
export default {
  id: 'batch',
  draw: drawBatch,
  cues: [
    'append-first',
    'append-second',
    'append-third',
    'sum-results',
    'count-results',
    'divide-counts',
  ],
};
