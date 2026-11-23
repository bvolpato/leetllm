import { math, rect, subtitle, text } from '../defaults.mjs';
export function drawRoutingRules(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const fade = api.components.fade;
  {
    const topOne = state.cues
        ? api.focus.progress('switch-route', 0) > 0
          ? 1
          : 0
        : stage(1, 0.08, 0.85),
      variants = stage(2, 0.08, 0.75);
    const left = rect(ctx, api, 125, 285, 780, 530, themeColors.panel, themeColors.blue, 20);
    const right = rect(ctx, api, 1015, 285, 780, 530, themeColors.panel, themeColors.yellow, 20);
    api.container(
      ctx,
      left,
      () => {
        api.focus.target('routing-rules-mixtral-style-top-2', () =>
          text(ctx, api, 'MIXTRAL-STYLE TOP-2', 515, 350, 32, themeColors.blue, 'center'),
        );
        for (let i = 0; i < 8; i += 1) {
          const x = 185 + (i % 4) * 170,
            y = 405 + Math.floor(i / 4) * 125;
          rect(
            ctx,
            api,
            x,
            y,
            125,
            80,
            i === 0 ? themeColors.blue : i === 2 ? themeColors.yellow : themeColors.bg,
            i === 0 ? themeColors.blue : i === 2 ? themeColors.yellow : themeColors.muted,
            8,
          );
          api.focus.target('routing-rules-readout', () =>
            text(
              ctx,
              api,
              `E${i + 1}`,
              x + 62.5,
              y + 52,
              32,
              i === 0 || i === 2 ? themeColors.bg : themeColors.muted,
              'center',
            ),
          );
        }
        api.focus.target('routing-rules-readout-2', () =>
          math(
            ctx,
            api,
            String.raw`\tilde p_1+\tilde p_3=1`,
            515,
            715,
            45,
            themeColors.ink,
            'center',
          ),
        );
        api.focus.target('routing-rules-2-of-8-expert-ffns', () =>
          text(ctx, api, '2 of 8 expert FFNs', 515, 775, 29, themeColors.muted, 'center'),
        );
      },
      {
        padding: 25,
      },
    );
    api.container(
      ctx,
      right,
      () => {
        api.focus.target('routing-rules-switch-top-1', () =>
          text(ctx, api, 'SWITCH TOP-1', 1405, 350, 32, themeColors.yellow, 'center'),
        );
        fade(topOne, () => {
          const probe = api.lerp(
            0.52,
            0.64,
            api.focus.progress('gate-learning', stage(1, 0.35, 0.95)),
          );
          api.focus.target('switch-gate', () =>
            rect(ctx, api, 1090, 420, 600, 65, themeColors.bg, themeColors.muted, 8),
          );
          api.focus.target('switch-gate', () =>
            rect(ctx, api, 1090, 420, 600 * probe, 65, themeColors.yellow, undefined, 8),
          );
          api.focus.target('routing-rules-readout-3', () =>
            text(
              ctx,
              api,
              `gate ${probe.toFixed(2)}`,
              1405,
              555,
              38,
              themeColors.yellow,
              'center',
              'mono',
            ),
          );
          api.focus.target('routing-rules-readout-4', () =>
            math(
              ctx,
              api,
              String.raw`y=p_{i^*}E_{i^*}(x)`,
              1405,
              665,
              48,
              themeColors.ink,
              'center',
            ),
          );
          api.focus.target('routing-rules-selected-original-softmax-gate', () =>
            text(
              ctx,
              api,
              'selected original softmax gate',
              1405,
              765,
              29,
              themeColors.muted,
              'center',
            ),
          );
        });
      },
      {
        padding: 25,
      },
    );
    fade(variants, () =>
      subtitle(
        ctx,
        api,
        'Shared experts, affinity scores, and balancing rules vary by architecture.',
      ),
    );
  }
}
export default {
  id: 'routing-rules',
  draw: drawRoutingRules,
  cues: [
    'mixtral-route',
    'trained-routing',
    'switch-route',
    'gate-learning',
    'retain-gate',
    'architectural-variants',
    'selected-count',
  ],
};
