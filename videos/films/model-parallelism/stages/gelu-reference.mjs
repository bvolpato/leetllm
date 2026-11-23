import { denseMLP, parallelMLP } from '../arithmetic.mjs';
import { mpReference } from '../model.mjs';
import { parallelMatrix, vector } from '../defaults.mjs';
import { sceneClock } from '../scene-clock.mjs';

const m = mpReference;
const dense = denseMLP(m.input);
const wrongMean = parallelMLP(m.input, 'mean').output;
const doubledBias = parallelMLP(m.input, 'sum', true).output;

export function drawGeluReference(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const expand = state.beat === 0;
  api.focus.target('gelu-work', () => {
    if (state.beat <= 1) {
      api.text(
        ctx,
        expand ? 'Input on both GPUs     x = [1, 2]' : 'Each GPU keeps its own hidden features',
        960,
        258,
        44,
        api.C.ink,
        'center',
      );
      for (const rank of [0, 1]) {
        const x = 220 + rank * 830,
          color = rank ? api.C.cyan : api.C.blue;
        const start = rank * 2;
        api.text(
          ctx,
          `GPU ${rank}   ·   features ${start + 1} and ${start + 2}`,
          x,
          380,
          39,
          color,
        );
        const weights = expand
          ? m.A.map((row) => row.slice(start, start + 2))
          : m.B.slice(start, start + 2);
        api.text(ctx, expand ? 'Columns of A' : 'Rows of B', x, 484, 33, api.C.muted);
        parallelMatrix(ctx, api, weights, x + 270, 430, 94, color);
        const expansion = m.expansion.slice(start, start + 2);
        const hidden = m.hidden.slice(start, start + 2);
        api.text(ctx, 'xA', x, 723, 38, api.C.muted);
        api.text(
          ctx,
          clock.done('expanded') ? vector(expansion) : '[  ·  ,  ·  ]',
          x + 225,
          723,
          49,
          color,
        );
        api.text(ctx, 'GeLU(xA)', x, 830, 38, api.C.muted);
        api.text(
          ctx,
          clock.done('activated') ? '≈ ' + vector(hidden) : '[  ·  ,  ·  ]',
          x + 225,
          830,
          45,
          color,
        );
      }
      if (!expand)
        api.text(
          ctx,
          'GPU 1   ·   Which weight gives output 1 its sign?',
          960,
          973,
          43,
          api.C.yellow,
          'center',
        );
      return;
    }
    const check = state.beat >= 3;
    const rows = check
      ? [
          ['Dense reference', dense, true, api.C.ink],
          ['Sum + one bias', m.output, true, api.C.green],
          ['Mean + one bias', wrongMean, clock.done('test-mean'), api.C.pink],
          ['Sum + two biases', doubledBias, clock.done('test-bias'), api.C.pink],
        ]
      : [
          ['GPU 0 partial', m.partials[0], true, api.C.blue],
          ['GPU 1 partial', m.partials[1], clock.done('signed-partial'), api.C.cyan],
          ['Output bias', m.bias, clock.progress('add-bias') > 0, api.C.yellow],
          ['Sum + one bias', m.output, clock.done('gelu-output'), api.C.green],
        ];
    api.text(ctx, 'Output 1', 1030, 273, 43, api.C.ink, 'center');
    api.text(ctx, 'Output 2', 1510, 273, 43, api.C.ink, 'center');
    rows.forEach(([label, values, visible, color], i) => {
      const y = 404 + i * 145;
      api.text(ctx, label, 205, y, 46, color);
      values.forEach((v, j) =>
        api.text(
          ctx,
          visible ? v.toFixed(4).replace('-', '−') : '?',
          1030 + j * 480,
          y,
          60,
          color,
          'center',
          'mono',
        ),
      );
    });
    api.text(ctx, 'Rounded to four decimal places', 960, 990, 32, api.C.muted, 'center');
  });
}
export default {
  id: 'gelu-reference',
  draw: drawGeluReference,
  cues: [
    'expansion-columns',
    'expanded',
    'activated',
    'projection-rows',
    'signed-partial',
    'add-bias',
    'gelu-output',
    'test-mean',
    'test-bias',
  ],
};
