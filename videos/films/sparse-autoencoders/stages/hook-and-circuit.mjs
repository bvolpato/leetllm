import { L, box, cue, foot, head, textLabel } from '../defaults.mjs';
export function drawHookAndCircuit(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('hook-and-circuit-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'One width does not establish hook compatibility');
      [
        ['residual state', 'accumulated shared state', themeColors.blue],
        ['MLP output', 'nonlinear branch update', themeColors.pink],
        ['attention output', 'routed context before merge', themeColors.cyan],
      ].forEach(([name, meaning, col], i) => {
        const y = 390 + i * 190;
        box(ctx, api, name, 150, y, 620, col);
        textLabel(ctx, api, meaning, 1050, y + 63, 31, col);
        L(ctx, api, 800, y + 50, 1010, y + 50, themeColors.muted);
      });
      foot(
        ctx,
        api,
        'Match checkpoint, layer, token, normalization, projection, centering, rescaling and dtype',
      );
    } else if (currentBeat === 1) {
      head(ctx, api, 'Authored linear readout · held-out causal checks still required');
      const removed = seen('circuit-remove'),
        weights = [0.9, 0.8, 0.7],
        values = [removed ? 0 : 1.2, 0.1, 0],
        terms = values.map((v, i) => v * weights[i]);
      for (let i = 0; i < 3; i++) {
        const x = 180 + i * 550;
        box(
          ctx,
          api,
          'feature ' + (i + 1) + ' = ' + values[i],
          x,
          400,
          450,
          i ? themeColors.cyan : themeColors.blue,
        );
        textLabel(ctx, api, 'weight ' + weights[i], x + 225, 570, 31, themeColors.yellow, 'center');
        L(ctx, api, x + 225, 620, 960, 760, themeColors.muted, 3);
      }
      if (seen('circuit-score'))
        box(
          ctx,
          api,
          'score ' + terms.reduce((a, b) => a + b, 0).toFixed(2),
          660,
          800,
          600,
          themeColors.green,
        );
      foot(
        ctx,
        api,
        'Formatting control has zero contribution by construction; real null effects may reflect compensation',
      );
    } else if (currentBeat === 2) {
      head(ctx, api, 'Cross-layer transcoder: earlier features write later MLP outputs');
      for (let i = 0; i < 3; i++) {
        const x = 180 + i * 550;
        box(ctx, api, 'feature at layer ' + i, x, 390, 420, themeColors.blue);
        box(ctx, api, 'MLP output ' + i, x, 750, 420, themeColors.pink);
        L(ctx, api, x + 210, 510, x + 210, 720, themeColors.blue, 4);
        if (seen('clt-writes'))
          for (let j = i + 1; j < 3; j++)
            L(ctx, api, x + 210, 520, 390 + j * 550, 720, themeColors.cyan, 3);
      }
      textLabel(
        ctx,
        api,
        'Attention remains active alongside the transcoder replacement',
        960,
        935,
        28,
        themeColors.yellow,
        'center',
      );
      foot(ctx, api, 'Each MLP output combines writers from that layer and earlier layers');
    } else {
      head(ctx, api, 'Local replacement model · same prompt baseline by construction');
      box(ctx, api, 'original attention / normalization', 180, 360, 1560, themeColors.blue);
      box(ctx, api, 'features + embeddings + constant errors', 180, 555, 1560, themeColors.cyan);
      box(
        ctx,
        api,
        seen('replacement-direct')
          ? 'direct paths; intervening MLP outputs STOPPED'
          : 'selected output logits',
        180,
        770,
        1560,
        themeColors.pink,
      );
      L(ctx, api, 960, 470, 960, 530, themeColors.muted);
      L(ctx, api, 960, 665, 960, 745, themeColors.muted);
      foot(
        ctx,
        api,
        'Fixed attention does not explain Q/K formation; compare edited responses in the original model',
      );
    }
  });
}
export default {
  id: 'hook-and-circuit',
  draw: drawHookAndCircuit,
  cues: [
    'hook-and-circuit-b0',
    'hook-and-circuit-b1',
    'circuit-score',
    'circuit-remove',
    'hook-and-circuit-b2',
    'clt-writes',
    'hook-and-circuit-b3',
    'replacement-frozen',
    'replacement-direct',
  ],
};
