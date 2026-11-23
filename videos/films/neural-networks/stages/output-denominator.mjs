import { binaryMeanGradients } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import { arrow, equation, focusTarget, head, pill, text } from '../defaults.mjs';

const labels = ['Timeout', 'Cache hit', 'Retry'];
const targets = [
  [1, 0, 1],
  [0, 1, 0],
];
const gradients = binaryMeanGradients(
  targets.map((row) => row.map(() => 0)),
  targets,
);
const boxes = targets.flat().length;

function requestGrid(ctx, api, f) {
  const { C } = api;
  const columns =
    1 + Number(f.shown('output-denominator-beat-0', 0)) + Number(f.shown('retry-label', 0));
  const counted = Math.floor(boxes * f.progress('output-denominator-beat-1', 2));
  const mean = f.completed('bce-six-products', 2);
  const heading = [
    'Observed answers',
    'Starting prediction for each box = ½',
    mean ? 'Logit gradients after averaging' : 'One residual for each loss term',
  ][Math.min(f.beat, 2)];
  head(ctx, api, heading);

  for (const [j, label] of labels.slice(0, columns).entries())
    text(ctx, api, label, 600 + j * 420, 375, 43, C.ink, 'center');

  for (const [i, row] of targets.entries()) {
    const y = 495 + i * 168;
    text(ctx, api, 'Request ' + (i + 1), 365, y + 14, 38, C.ink, 'right');
    for (const [j, target] of row.slice(0, columns).entries()) {
      const x = 600 + 420 * j;
      const k = i * labels.length + j;
      const col = k < counted ? C.yellow : C.muted;
      api.rect(ctx, x - 170, y - 57, 340, 114, C.panel, col, 4);
      text(
        ctx,
        api,
        target ? 'Yes (1)' : 'No (0)',
        x - 78,
        y + 15,
        39,
        target ? C.cyan : C.ink,
        'center',
      );
      const worked =
        i === 0 &&
        ((j === 0 && f.completed('first-residual', 1)) ||
          (j === 1 && f.completed('next-residual', 1)));
      if (mean || worked || k < counted) {
        const sign = gradients[i][j] < 0 ? '−' : '+';
        text(
          ctx,
          api,
          sign + (mean ? '1/12' : '½'),
          x + 80,
          y + 15,
          43,
          mean ? C.yellow : C.ink,
          'center',
        );
      }
    }
  }

  if (f.beat === 1) text(ctx, api, 'Residual = prediction − target', 960, 890, 41, C.ink, 'center');
  if (f.beat >= 2) {
    const countDone = f.completed('output-denominator-beat-1', 2);
    if (countDone)
      text(
        ctx,
        api,
        '2 requests × 3 labels = ' + boxes + ' loss terms',
        960,
        825,
        41,
        C.yellow,
        'center',
      );
    if (f.completed('nn-bce-wrong-denominator', 2))
      equation(
        ctx,
        api,
        String.raw`\text{Divide by 2: }\;\pm 1/4 = 3(\pm 1/12)`,
        960,
        960,
        41,
        C.pink,
      );
  }
}

export function drawOutputDenominator(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  focusTarget(ctx, api, 'output-denominator-mechanism', () => {
    if (!f.shown('timeout-box', 3)) {
      requestGrid(ctx, api, f);
      return;
    }
    head(ctx, api, 'Request 1 timed out');
    equation(ctx, api, String.raw`y=1,\quad p=0.5,\quad w_+=3`, 960, 405, 49, C.ink);
    pill(ctx, api, 'p − 1 = −0.5', 525, 610, 520, C.cyan, 44);
    arrow(ctx, api, 830, 610, 1070, 610, C.muted);
    pill(
      ctx,
      api,
      f.completed('bce-positive-weight', 3) ? '3 × (−0.5) = −1.5' : 'Weighted derivative ?',
      1410,
      610,
      610,
      C.yellow,
      40,
    );
    text(ctx, api, 'Before averaging', 1410, 726, 33, C.muted, 'center');
    equation(
      ctx,
      api,
      String.raw`y=0:\quad\frac{\partial\ell}{\partial z}=p`,
      960,
      883,
      43,
      C.blue,
    );
  });
}
export default {
  id: 'output-denominator',
  draw: drawOutputDenominator,
  cues: [
    'output-denominator-beat-0',
    'retry-label',
    'first-residual',
    'next-residual',
    'output-denominator-beat-1',
    'bce-six-products',
    'nn-bce-wrong-denominator',
    'output-denominator-beat-2',
    'timeout-box',
    'bce-positive-weight',
  ],
};
