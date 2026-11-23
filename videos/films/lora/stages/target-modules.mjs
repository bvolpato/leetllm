import { text, math, rect, fade, node, route } from '../defaults.mjs';
export function drawTargetModules(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const names = ['query', 'key', 'value', 'output'];
    const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.green];
    const bounds = [];
    for (let i = 0; i < 4; i++) {
      const x = 200 + i * 410;
      const adapted = i === 0 || i === 2 || stage(1, 0.08, 0.4) > 0.4;
      const n = api.focus.target('attention-projections', () =>
        node(ctx, api, x, 390, 290, 175, 'W_' + ['Q', 'K', 'V', 'O'][i], names[i], colors[i]),
      );
      bounds.push(n);
      if (adapted) {
        const adapter = rect(
          ctx,
          api,
          x + 40,
          650,
          210,
          90,
          themeColors.panel,
          themeColors.pink,
          12,
        );
        api.container(
          ctx,
          adapter,
          () =>
            api.focus.target('projection-adapters', () =>
              math(ctx, api, 'BA', x + 145, 707, 42, themeColors.pink, 'center'),
            ),
          {
            padding: 10,
          },
        );
        route(ctx, api, adapter, n, themeColors.pink, stage(1));
      }
    }
    text(ctx, api, 'ATTENTION PROJECTIONS', 960, 285, 31, themeColors.muted, 'center');
    fade(ctx, api, stage(1, 0.45, 0.9), () => {
      const box = rect(ctx, api, 570, 835, 780, 105, themeColors.panel, themeColors.pink, 15);
      api.container(
        ctx,
        box,
        () =>
          text(
            ctx,
            api,
            'Feed-forward projections: add their own adapters',
            960,
            902,
            30,
            themeColors.pink,
            'center',
          ),
        {
          padding: 16,
        },
      );
    });
    fade(ctx, api, stage(2), () => undefined);
    void bounds;
  }
  ctx.restore();
}
export default {
  id: 'target-modules',
  draw: drawTargetModules,
  cues: ['target-modules-b1-1', 'target-modules-b2-1', 'target-modules-b3-1'],
};
