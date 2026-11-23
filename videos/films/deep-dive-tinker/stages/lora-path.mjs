import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawLoraPath(ctx, scene, state, api) {
  return api.focus.target('tk-lora-path-trace', () => paintLoraPath(ctx, scene, state, api));
}
function paintLoraPath(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('lora-path', state);
  const progress = modelState.q;
  {
    const base = api.focus.target('lora-path-frozen-base-matrix-w', () =>
      drawOriginalCard(ctx, api, 'Frozen base matrix W', 170, 550, 450, 160, themeColors.blue, 38),
    );
    const { A, B } = api.focus.target('lora-path-trainable-factors', () => {
      const A = api.focus.target('lora-path-a-rank-s-rank', () =>
        drawOriginalCard(
          ctx,
          api,
          'A · rank ' + modelState.rank,
          700,
          320,
          260,
          120,
          themeColors.cyan,
          38,
        ),
      );
      const B = api.focus.target('lora-path-b-rank-s-rank', () =>
        drawOriginalCard(
          ctx,
          api,
          'B · rank ' + modelState.rank,
          1000,
          320,
          260,
          120,
          themeColors.yellow,
          38,
        ),
      );
      return {
        A,
        B,
      };
    });
    const output = api.focus.target('lora-path-adapted-projection-w', () =>
      drawOriginalCard(
        ctx,
        api,
        'Adapted projection W′',
        1280,
        550,
        470,
        160,
        themeColors.green,
        36,
      ),
    );
    api.connect(ctx, base, output, {
      color: themeColors.blue,
      gap: 14,
    });
    const rA = api.connect(ctx, A, B, {
      color: themeColors.cyan,
      gap: 12,
    });
    const rB = api.connect(ctx, B, output, {
      color: themeColors.yellow,
      gap: 12,
    });
    [rA, rB].forEach((route) =>
      api.circle(
        ctx,
        route.from.x + (route.to.x - route.from.x) * progress,
        route.from.y + (route.to.y - route.from.y) * progress,
        8,
        themeColors.yellow,
      ),
    );
    drawOriginalEquation(ctx, api, "W'=W+\\gamma BA", 960, 825, 52);
    drawOriginalText(
      ctx,
      api,
      'Optimizer state updates A and B · the base still executes each forward pass',
      960,
      955,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'lora-path',
  draw: drawLoraPath,
  cues: [
    'lora-path-beat-1-focus-1',
    'lora-path-beat-1-focus-2',
    'tk-lora-path-0-0',
    'tk-lora-path-0-1',
    'tk-lora-path-0-2',
    'lora-path-beat-2-focus-1',
    'lora-path-beat-2-focus-2',
    'tk-lora-path-1-0',
    'tk-lora-path-1-1',
    'tk-lora-path-1-2',
    'lora-path-beat-3-focus-1',
    'lora-path-beat-3-focus-2',
    'tk-lora-path-2-0',
    'tk-lora-path-2-1',
    'tk-lora-path-2-2',
  ],
};
