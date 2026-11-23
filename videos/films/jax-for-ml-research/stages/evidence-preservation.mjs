import { exampleGradients } from '../arithmetic.mjs';
import { regression } from '../fixtures.mjs';
import { drawArrow, drawBox, drawMatrix, drawText, mark } from '../defaults.mjs';
export function drawEvidencePreservation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    U = cueProgress('jx-evidence-preservation-b' + currentBeat);
  const paint = () => {
    const stages = ['eager', 'grad', 'vmap', 'jit'],
      active = currentBeat > 0 ? 3 : Math.min(3, Math.floor(U * 4)),
      gs = exampleGradients();
    drawText(
      ctx,
      api,
      'Run the same inputs through each transformation',
      960,
      270,
      32,
      themeColors.yellow,
    );
    for (let i = 0; i < 4; i++) {
      const x = 220 + i * 440;
      drawBox(
        ctx,
        api,
        stages[i],
        x,
        380,
        340,
        95,
        i === active ? themeColors.yellow : themeColors.blue,
      );
      if (i < 3) drawArrow(ctx, api, x + 355, 427, x + 425, 427, themeColors.muted);
      if (i === 0)
        drawMatrix(ctx, api, [3.75], x, 575, {
          cw: 340,
          ch: 100,
          color: themeColors.cyan,
          label: 'scalar mean loss',
          known: i <= active,
        });
      else if (i === 1)
        drawMatrix(ctx, api, regression([0, 0, 0]).gradient, x, 575, {
          cw: 110,
          ch: 80,
          color: themeColors.cyan,
          label: '[weight 0, weight 1, bias]',
          known: i <= active,
        });
      else
        drawMatrix(ctx, api, gs, x, 575, {
          cw: 110,
          ch: 50,
          color: themeColors.cyan,
          label: i === 2 ? 'per-row gradient [4,3]' : 'same per-row values [4,3]',
          known: i <= active,
        });
    }
    if (currentBeat === 0)
      drawText(
        ctx,
        api,
        'The first failing transformation names a contract to inspect',
        960,
        900,
        33,
        themeColors.yellow,
      );
    else if (currentBeat === 1) {
      drawBox(
        ctx,
        api,
        'checkpoint / data order / precision / key schedule',
        200,
        805,
        1500,
        90,
        themeColors.pink,
      );
      drawText(
        ctx,
        api,
        'Change one loss or sampler while retaining those artifacts',
        960,
        950,
        31,
        themeColors.green,
      );
    } else {
      drawBox(
        ctx,
        api,
        'reference inputs + outputs + gradients',
        200,
        805,
        1500,
        90,
        themeColors.green,
      );
      drawText(
        ctx,
        api,
        'Run the original and the port on the same held-out examples.',
        960,
        950,
        29,
        themeColors.yellow,
      );
    }
  };
  mark(ctx, api, 'jx-evidence-preservation-mechanism', paint);
}
export default {
  id: 'evidence-preservation',
  draw: drawEvidencePreservation,
  cues: [
    'jx-evidence-preservation-b0',
    'jx-evidence-preservation-b1',
    'jx-evidence-preservation-b2',
  ],
};
