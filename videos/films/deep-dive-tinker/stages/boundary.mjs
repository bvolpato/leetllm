import { sentence } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawBoundary(ctx, scene, state, api) {
  return api.focus.target('tk-boundary-trace', () => paintBoundary(ctx, scene, state, api));
}
function paintBoundary(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const modelState = sampleModel('boundary', state);
  const progress = modelState.q;
  {
    drawOriginalText(
      ctx,
      api,
      'LOCAL · explicit request values',
      470,
      300,
      29,
      themeColors.cyan,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'HOSTED · retained model state',
      1450,
      300,
      29,
      themeColors.blue,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Supplied supervised shape fixture',
      490,
      350,
      25,
      themeColors.muted,
      'center',
    );
    const local = api.focus.target('boundary-render-prompt', () =>
      teaching.grid({
        x: 150,
        y: 375,
        width: 680,
        height: 390,
        rows: 4,
        columns: 4,
        labels: [
          ['input', 10, 11, 20],
          ['target', 11, 20, 21],
          ['weight', 0, 1, 1],
          ['batch', 'B0', 'B0', 'B0'],
        ],
        fontSize: 28,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.cyan,
      }),
    );
    const remote = api.focus.target('boundary-model-compute', () => {
      const shape = api.rect(ctx, 1180, 375, 540, 390, themeColors.panel, themeColors.blue, 3);
      drawOriginalText(
        ctx,
        api,
        'Base weights stay here',
        1450,
        425,
        29,
        themeColors.blue,
        'center',
      );
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 7; col++)
          api.rect(
            ctx,
            1225 + col * 65,
            470 + row * 50,
            48,
            35,
            themeColors.panel,
            themeColors.muted,
            2,
          );
      return shape;
    });
    api.focus.target('boundary-adapter-optimizer', () =>
      drawOriginalText(
        ctx,
        api,
        'Adapter + optimizer moments',
        1450,
        695,
        27,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('boundary-sample-checkpoint', () =>
      drawOriginalText(
        ctx,
        api,
        'Separate sampler / checkpoint state',
        1450,
        740,
        25,
        themeColors.cyan,
        'center',
      ),
    );
    const q = modelState.stage === 0 ? sentence(state, 'boundary', 0, 0) : 1;
    if (q > 0) {
      const packet = drawOriginalCard(
        ctx,
        api,
        'Datum B0',
        850 + 130 * q,
        560,
        200,
        100,
        themeColors.yellow,
        29,
      );
      for (const [a, z] of [
        [local, packet],
        [packet, remote],
      ]) {
        const gap = z.x - a.x - a.width;
        if (gap > 25)
          api.connect(ctx, a, z, {
            color: themeColors.yellow,
            gap: 10,
          });
      }
    }
    api.focus.target('boundary-grade-completion', () =>
      drawOriginalCard(
        ctx,
        api,
        'Local clamp check\nreturned 3   ·   expected 2   ·   reward 0',
        150,
        800,
        680,
        145,
        themeColors.pink,
        27,
      ),
    );
    if (modelState.stage > 0 && sentence(state, 'boundary', 1, 1) > 0)
      drawOriginalCard(
        ctx,
        api,
        'Compact result / future\nParameter gradients stay hosted',
        1180,
        800,
        540,
        145,
        themeColors.green,
        26,
      );
    drawOriginalText(
      ctx,
      api,
      'Await the future to receive the result or error. Parameter gradients stay on the worker.',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'boundary',
  draw: drawBoundary,
  cues: [
    'boundary-beat-1-focus-1',
    'boundary-beat-1-focus-2',
    'tk-boundary-0-0',
    'tk-boundary-0-1',
    'boundary-beat-2-focus-1',
    'boundary-beat-2-focus-2',
    'tk-boundary-1-0',
    'tk-boundary-1-1',
    'tk-boundary-1-2',
    'boundary-beat-3-focus-1',
    'boundary-beat-3-focus-2',
    'tk-boundary-2-0',
    'tk-boundary-2-1',
    'tk-boundary-2-2',
    'tk-boundary-2-3',
  ],
};
