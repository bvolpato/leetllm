import { point } from '../geometry.mjs';
import { cueMotion } from '../construction.mjs';
import { text, math, rect, fade, node, route } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const tasks = ['code review', 'policy assistant', 'science tutor'];
    const add = cueMotion(state, 'intro-b2-1', 1, 0.04, 0.24);
    const select = cueMotion(state, 'intro-select', 2, 0.02, 0.14);
    const send = cueMotion(state, 'intro-send', 2, 0.18, 0.46);
    const combine = cueMotion(state, 'intro-b3-1', 2, 0.48, 0.72);
    const input = node(ctx, api, 150, 540, 230, 150, 'x', 'ticket P04', themeColors.cyan);
    const base = api.focus.target('frozen-base', () =>
      node(ctx, api, 570, 320, 650, 300, 'W_0', 'shared pretrained weights', themeColors.blue),
    );
    const output = api.focus.target('new-response', () =>
      node(ctx, api, 1460, 540, 280, 150, 'h', 'layer output', themeColors.green),
    );
    route(ctx, api, input, base, themeColors.blue, stage(0));
    route(ctx, api, base, output, themeColors.blue, stage(0));
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 3; j++)
        rect(ctx, api, 620 + i * 61, 470 + j * 17, 45, 10, '#79aaff55', undefined, 2);
    fade(ctx, api, add, () => {
      for (let i = 0; i < 3; i++) {
        const x = 555 + i * 240,
          y = 760;
        const active = select > 0.05 ? i === 1 : true;
        const b = rect(
          ctx,
          api,
          x,
          y,
          220,
          115,
          themeColors.panel,
          active ? themeColors.yellow : themeColors.muted,
          15,
        );
        api.container(
          ctx,
          b,
          () => {
            api.focus.target('adapter-factors', () =>
              math(
                ctx,
                api,
                'B_' + (i + 1) + 'A_' + (i + 1),
                x + 110,
                y + 47,
                35,
                active ? themeColors.yellow : themeColors.muted,
                'center',
              ),
            );
            text(
              ctx,
              api,
              tasks[i],
              x + 110,
              y + 91,
              25,
              active ? themeColors.ink : themeColors.muted,
              'center',
            );
          },
          {
            padding: 8,
          },
        );
      }
    });
    if (select > 0.02) {
      const path = [
        point(392, 615),
        point(440, 615),
        point(440, 710),
        point(905, 710),
        point(905, 748),
      ];
      api.trace(ctx, path, send, themeColors.yellow, 4);
      const path2 = [
        point(905, 887),
        point(905, 915),
        point(1370, 915),
        point(1370, 650),
        point(1448, 650),
      ];
      api.trace(ctx, path2, combine, themeColors.yellow, 4);
    }
  }
  ctx.restore();
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b2-1', 'intro-select', 'intro-send', 'intro-b3-1'],
};
