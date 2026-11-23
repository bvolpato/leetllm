import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import { incidentNote, incidentText } from '../defaults.mjs';
export function drawParameterGeometry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('parameter-geometry', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('parameter-geometry-operation', () => {
    if (currentBeat === 0) {
      const counts = [1, 3, 4],
        names = ['RNN', 'GRU', 'LSTM'];
      counts.forEach((count, j) => {
        const x = 350 + j * 610;
        incidentText(ctx, api, names[j], x, 310, 36, colors[j], 'center');
        for (let k = 0; k < count; k++) {
          const y = 390 + k * 120;
          for (let row = 0; row < 2; row++)
            for (let col = 0; col < 5; col++)
              api.rect(ctx, x - 110 + col * 37, y + row * 38, 29, 29, colors[j], undefined, 3);
          api.rect(ctx, x + 100, y, 22, 70, themeColors.yellow, undefined, 2);
          incidentText(ctx, api, '12', x + 160, y + 45, 27, themeColors.muted, 'center');
        }
        const ready = started('parameter-one-bias', progress > 0.5);
        if (ready)
          incidentText(ctx, api, count + ' × 12 = ' + count * 12, x, 936, 38, colors[j], 'center');
      });
      incidentNote(
        ctx,
        api,
        'Each block: H(I + H) + H = 2(3 + 2) + 2. Blocks compare equal width, not measured latency.',
      );
    } else if (currentBeat === 1) {
      const specs = [
        {
          label: 'Wᵢₕ: 6 × 3',
          rows: 6,
          columns: 3,
          x: 220,
          color: themeColors.blue,
        },
        {
          label: 'Wₕₕ: 6 × 2',
          rows: 6,
          columns: 2,
          x: 740,
          color: themeColors.pink,
        },
        {
          label: 'two biases: 6 + 6',
          rows: 6,
          columns: 2,
          x: 1260,
          color: themeColors.yellow,
        },
      ];
      specs.forEach((spec, index) => {
        incidentText(ctx, api, spec.label, spec.x + 140, 310, 30, spec.color, 'center');
        const visible = started('parameter-pytorch', progress > 0.1) ? spec.rows : 0;
        for (let row = 0; row < visible; row++)
          for (let column = 0; column < spec.columns; column++)
            api.rect(ctx, spec.x + column * 70, 385 + row * 65, 55, 50, spec.color, undefined, 4);
        incidentText(
          ctx,
          api,
          [18, 12, 12][index] + ' values',
          spec.x + 140,
          845,
          32,
          spec.color,
          'center',
        );
      });
      if (started('parameter-total', progress > 0.5))
        incidentText(
          ctx,
          api,
          '18 + 12 + 12 = 42 parameters',
          960,
          951,
          42,
          themeColors.green,
          'center',
        );
    } else {
      const tensors = [
        {
          label: 'input',
          shape: [4, 5, 3],
          axes: ['batch', 'time', 'input'],
          x: 170,
          color: themeColors.blue,
        },
        {
          label: 'output',
          shape: [4, 5, 2],
          axes: ['batch', 'time', 'hidden'],
          x: 780,
          color: themeColors.green,
        },
        {
          label: 'final h',
          shape: [1, 4, 2],
          axes: ['layers × directions', 'batch', 'hidden'],
          x: 1390,
          color: themeColors.yellow,
        },
      ];
      tensors.forEach((tensor, i) => {
        incidentText(ctx, api, tensor.label, tensor.x + 180, 350, 35, tensor.color, 'center');
        const ready =
          i === 0 ||
          started(i === 1 ? 'parameter-output' : 'parameter-final', progress > 0.3 + i * 0.2);
        tensor.shape.forEach((size, j) => {
          const y = 445 + j * 140;
          incidentText(
            ctx,
            api,
            tensor.axes[j],
            tensor.x + 180,
            y - 30,
            25,
            themeColors.muted,
            'center',
          );
          if (ready) {
            for (let k = 0; k < size; k++)
              api.rect(ctx, tensor.x + 50 + k * 43, y, 34, 40, tensor.color, undefined, 3);
            incidentText(ctx, api, size, tensor.x + 335, y + 30, 31, tensor.color, 'center');
          }
        });
      });
      incidentNote(
        ctx,
        api,
        'Batch-first changes sequence input/output axes. It does not change the final-state axes.',
      );
    }
  });
}
export default {
  id: 'parameter-geometry',
  draw: drawParameterGeometry,
  cues: [
    'parameter-geometry-0',
    'parameter-one-bias',
    'parameter-geometry-1',
    'parameter-pytorch',
    'parameter-total',
    'parameter-geometry-2',
    'parameter-output',
    'parameter-final',
  ],
};
