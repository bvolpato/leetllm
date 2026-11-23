import { beatCue } from '../arithmetic.mjs';
import { vqGradientSnapshot } from '../model.mjs';
import { line, point, text } from '../defaults.mjs';

const rulers = [890, 1430];
const pixelsPerUnit = 720;
const fmt = (value) => Number(value.toFixed(3)).toString().replace('-', '−');

function receipt(ctx, api, axis, y, values) {
  const x = rulers[axis],
    { C } = api;
  line(ctx, api, x - 151, y, x + 151, y, C.muted, 2);
  line(ctx, api, x, y - 10, x, y + 10, C.muted, 3);
  let total = 0;
  for (const [amount, color] of values) {
    const begin = x + total * pixelsPerUnit;
    total += amount;
    const end = x + total * pixelsPerUnit;
    line(ctx, api, begin, y, end, y, color, 9);
    point(ctx, api, end, y, color, 7);
  }
  text(
    ctx,
    api,
    values.length ? fmt(total) : '?',
    x + 190,
    y + 12,
    32,
    values.at(-1)?.[1] ?? C.muted,
  );
}

export function drawVqGradients(ctx, scene, state, api) {
  const { C } = api,
    f = vqGradientSnapshot();
  const operands = [
    beatCue(state, 0, 'lookup-operands', 0.26, 0.45) > 0,
    beatCue(state, 3, 'second-operands', 0.08, 0.36) > 0,
  ];
  const available = (beat, id, start, end) => beatCue(state, beat, id, start, end) === 1;
  const recon = [available(1, 'value-recon', 0.48, 0.64), available(4, 'second-recon', 0.05, 0.27)];
  const commit = [
    available(2, 'commitment', 0.27, 0.47),
    available(4, 'second-commit', 0.29, 0.46),
  ];
  const entry = [available(2, 'entry-loss', 0.55, 0.8), available(4, 'second-entry', 0.65, 0.84)];
  const sum = [commit[0], available(4, 'encoder-sum', 0.47, 0.63)];
  const labels = [
    ['Reconstruction → encoder', 'entry − target', 553, C.green],
    ['Commitment → encoder', '2 × 0.25 × (proposal − entry)', 659, C.yellow],
    ['Total to encoder', 'reconstruction + commitment', 765, C.ink],
    ['Codebook → selected entry', '2 × (entry − proposal)', 914, C.pink],
  ];
  ['First coordinate', 'Second coordinate'].forEach((name, j) =>
    text(ctx, api, name, rulers[j], 239, 37, C.ink, 'center'),
  );
  [
    ['Encoder proposal', f.encoder],
    ['Selected entry', f.entry],
    ['Reconstruction target', f.target],
  ].forEach(([name, pair], i) => {
    const y = 309 + i * 61;
    text(ctx, api, name, 160, y, 34, C.ink);
    pair.forEach((v, j) => {
      text(
        ctx,
        api,
        operands[j] ? fmt(v) : '·',
        rulers[j],
        y,
        37,
        operands[j] ? C.cyan : C.muted,
        'center',
      );
    });
  });
  line(ctx, api, 150, 476, 1770, 476, C.muted, 2);
  const reconRoute = beatCue(state, 1, 'route-recon', 0, 0.13) > 0;
  labels.forEach(([name, formula, y, color], row) => {
    const inUse = [reconRoute, state.beat >= 2, state.beat >= 2, state.beat >= 2][row];
    if (!inUse) return;
    text(ctx, api, name, 160, y - 5, 35, color);
    text(ctx, api, formula, 160, y + 36, 26, C.muted);
    for (let j = 0; j < 2; j++) {
      if (!operands[j]) continue;
      const r = [f.reconstructionGradient[j], C.green],
        c = [f.commitmentGradient[j], C.yellow];
      const contributions = [
        recon[j] ? [r] : [],
        commit[j] ? [c] : [],
        sum[j] ? [r, c] : [],
        entry[j] ? [[f.codebookGradient[j], C.pink]] : [],
      ];
      receipt(ctx, api, j, y, contributions[row]);
    }
  });
}

export default {
  id: 'vq-gradients',
  draw: drawVqGradients,
  cues: [
    'lookup-operands',
    'route-recon',
    'value-recon',
    'commitment',
    'entry-loss',
    'second-operands',
    'second-recon',
    'second-commit',
    'encoder-sum',
    'second-entry',
  ],
};
