import { drawArrow, drawBox, drawMatrix, drawText, footer, mark } from '../defaults.mjs';
export function drawTracerBranch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-tracer-branch-b' + currentBeat);
  const paint = () => {
    drawText(
      ctx,
      api,
      'Same scalar absolute-value intent · runtime input data',
      960,
      270,
      34,
      themeColors.yellow,
    );
    drawMatrix(ctx, api, [-2, 3], 200, 405, {
      cw: 200,
      ch: 100,
      label: 'two actual test values',
    });
    drawBox(
      ctx,
      api,
      currentBeat === 0 ? 'Python if value > 0' : 'lax.cond(value > 0)',
      900,
      390,
      700,
      110,
      currentBeat === 0 ? themeColors.pink : themeColors.cyan,
    );
    drawArrow(ctx, api, 640, 455, 860, 455, themeColors.muted);
    if (currentBeat === 0) {
      if (resultComplete('tracer-error'))
        drawBox(ctx, api, 'TracerBoolConversionError', 690, 690, 1020, 120, themeColors.pink, 35);
      drawText(
        ctx,
        api,
        'Known abstract shape does not supply a concrete Python bool',
        960,
        925,
        31,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawBox(ctx, api, 'positive: value', 200, 650, 600, 100, themeColors.blue);
      drawBox(ctx, api, 'nonpositive: −value', 1100, 650, 600, 100, themeColors.cyan);
      if (resultComplete('tracer-fixed')) {
        drawMatrix(ctx, api, [2, 3], 730, 850, {
          cw: 230,
          ch: 90,
          color: themeColors.green,
          label: 'computed absolute values',
        });
      }
      drawText(
        ctx,
        api,
        'Both branches trace; execution selects under the compiler contract',
        960,
        315,
        28,
        themeColors.muted,
      );
    } else {
      drawMatrix(ctx, api, ['relu', 'gelu'], 200, 650, {
        cw: 300,
        ch: 100,
        color: themeColors.yellow,
        label: 'bounded static modes',
      });
      drawMatrix(ctx, api, ['True', 'False'], 1100, 650, {
        cw: 300,
        ch: 100,
        color: themeColors.blue,
        label: 'per-example masks remain data',
      });
      drawText(
        ctx,
        api,
        'Return metrics; perform host I/O outside the compiled boundary',
        960,
        930,
        32,
        themeColors.green,
      );
    }
    footer(
      ctx,
      api,
      'Elementwise where, scalar cond and true static configuration express different control contracts',
    );
  };
  mark(ctx, api, 'jx-tracer-branch-mechanism', paint);
}
export default {
  id: 'tracer-branch',
  draw: drawTracerBranch,
  cues: [
    'jx-tracer-branch-b0',
    'tracer-error',
    'jx-tracer-branch-b1',
    'tracer-fixed',
    'jx-tracer-branch-b2',
  ],
};
