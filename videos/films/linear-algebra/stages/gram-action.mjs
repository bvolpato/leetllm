import { V } from '../fixtures.mjs';
import { gramConstruction } from '../model.mjs';
import { arrow, caption, equation, line, plane, target, text } from '../defaults.mjs';
export function drawGramAction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const c = gramConstruction(state),
      q = plane(
        ctx,
        api,
        [-1.5, 3.5, -1.5, 3.5],
        190,
        315,
        1540,
        560,
        'feature direction 1',
        'feature direction 2',
      );
    V.forEach((v, i) =>
      target(ctx, api, i ? 'gram-contrast-action' : 'gram-common-action', () => {
        line(ctx, api, q, [0, 0], v, '#8d9cb955', 3);
        arrow(
          ctx,
          api,
          q,
          [0, 0],
          v.map((value) => value * (1 + ([3, 1][i] - 1) * c.directionProgress[i])),
          i ? themeColors.pink : themeColors.cyan,
        );
      }),
    );
    if (c.directionProgress[0] === 1)
      equation(ctx, api, 'Gv_1=3v_1', 450, 270, 45, themeColors.cyan);
    else text(ctx, api, 'Common', 450, 270, 38, themeColors.cyan, 'center');
    if (c.directionProgress[1] === 1)
      equation(ctx, api, 'Gv_2=v_2', 1470, 270, 45, themeColors.pink);
    else text(ctx, api, 'Contrast', 1470, 270, 38, themeColors.pink, 'center');
    target(ctx, api, 'common-strength', () => {
      if (c.normProgress > 0)
        equation(ctx, api, '\\sigma_1=\\sqrt3', 500, 945, 49, themeColors.cyan);
    });
    target(ctx, api, 'contrast-strength', () => {
      if (c.normProgress > 0) equation(ctx, api, '\\sigma_2=1', 1420, 945, 49, themeColors.pink);
    });
    caption(
      ctx,
      api,
      c.normProgress > 0
        ? 'Eigenvalues of the Gram matrix are squared singular strengths'
        : 'Compare each arrow with its original unit length.',
    );
  }
}
export default {
  id: 'gram-action',
  draw: drawGramAction,
  cues: ['gram-eigen-directions', 'common-strength-b3-1'],
};
