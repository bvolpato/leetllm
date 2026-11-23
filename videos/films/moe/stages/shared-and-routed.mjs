import { link, node, packet, path, text } from '../defaults.mjs';
import { drawConcept } from '../../../lib/concepts.mjs';
export function drawSharedAndRouted(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const fade = api.components.fade;
  {
    const open = api.focus.progress('open-expert-pool', stage(1, 0.08, 0.8)),
      expanded = state.cues ? (open > 0 ? 1 : 0) : api.phase(open, 0.45, 0.9),
      combine = state.cues
        ? api.focus.progress('combine-experts', 0) > 0
          ? 1
          : 0
        : stage(2, 0.06, 0.75);
    const input = {
      x: 130,
      y: 505,
      width: 135,
      height: 105,
    };
    const attention = {
      x: 375,
      y: 440,
      width: 270,
      height: 235,
    };
    const gate = {
      x: 765,
      y: 480,
      width: 175,
      height: 150,
    };
    const output = {
      x: 1640,
      y: 505,
      width: 150,
      height: 105,
    };
    const experts = Array.from(
      {
        length: 4,
      },
      (_, i) => ({
        x: 1120,
        y: 270 + i * 165,
        width: 300,
        height: 105,
      }),
    );
    const dense = {
      x: 1070,
      y: 425,
      width: 400,
      height: 265,
    };
    link(ctx, api, input, attention, themeColors.cyan, 4);
    if (open < 0.4)
      fade(1 - api.phase(open, 0, 0.4), () =>
        link(ctx, api, attention, dense, themeColors.blue, 4),
      );
    fade(expanded, () => {
      link(ctx, api, attention, gate, themeColors.cyan, 4);
      for (const [i, expert] of experts.entries()) {
        link(
          ctx,
          api,
          gate,
          expert,
          i === 0 || i === 2 ? colors[i] : '#8d9cb944',
          i === 0 || i === 2 ? 4 : 2,
        );
        fade(combine * (i === 0 || i === 2 ? 1 : 0), () =>
          link(ctx, api, expert, output, colors[i], 4),
        );
      }
    });
    const residual = [
      {
        x: 700,
        y: 557,
      },
      {
        x: 700,
        y: 875,
      },
      {
        x: 1715,
        y: 875,
      },
      {
        x: 1715,
        y: 618,
      },
    ];
    fade(combine, () => path(ctx, api, residual, themeColors.muted, 3));
    packet(
      ctx,
      api,
      [
        {
          x: 272,
          y: 557,
        },
        {
          x: 367,
          y: 557,
        },
      ],
      stage(0, 0.2, 0.7),
      themeColors.cyan,
      14,
    );
    fade(expanded, () => {
      for (const i of [0, 2]) {
        const a = api.anchor(gate, experts[i], 8),
          b = api.anchor(experts[i], gate, 8);
        packet(ctx, api, [a, b], stage(1, 0.35, 0.88), themeColors.cyan, 13);
      }
    });
    api.focus.target('shared-and-routed-input', () =>
      node(ctx, api, input, 'token', themeColors.cyan, 30),
    );
    api.focus.target('shared-and-routed-attention', () =>
      node(ctx, api, attention, 'shared\nattention', themeColors.blue, 38),
    );
    if (open < 1)
      fade(1 - api.phase(open, 0, 0.4), () =>
        api.focus.target('shared-and-routed-dense', () =>
          node(ctx, api, dense, 'one dense FFN', themeColors.blue, 36),
        ),
      );
    fade(expanded, () => {
      api.focus.target('shared-and-routed-gate', () =>
        node(ctx, api, gate, '', themeColors.cyan, 31),
      );
      api.container(
        ctx,
        gate,
        () => {
          drawConcept(ctx, api, 'router', 820.5, 492, 64, {
            label: 'router',
            labelSize: 28,
            labelGap: 8,
            labelColor: themeColors.cyan,
          });
        },
        {
          padding: 10,
        },
      );
      experts.forEach((expert, i) => {
        api.focus.target('shared-and-routed-expert', () =>
          node(ctx, api, expert, '', colors[i], 35),
        );
        api.container(
          ctx,
          expert,
          () => {
            drawConcept(ctx, api, 'expert', expert.x + 12, expert.y + 18, 54, {
              label: `expert ${i + 1}`,
              labelPosition: 'right',
              labelSize: 28,
              labelGap: 12,
              labelColor: colors[i],
            });
          },
          {
            padding: 12,
          },
        );
      });
    });
    fade(combine, () =>
      api.focus.target('shared-and-routed-output', () =>
        node(ctx, api, output, 'sum', themeColors.cyan, 34),
      ),
    );
    api.focus.target('shared-and-routed-mix-information-across-positions', () =>
      text(ctx, api, 'mix information across positions', 430, 765, 26, themeColors.blue, 'center'),
    );
    api.focus.target('shared-and-routed-transform-each-position', () =>
      text(ctx, api, 'transform each position', 1260, 920, 30, themeColors.muted, 'center'),
    );
    fade(combine, () =>
      api.focus.target('shared-and-routed-residual-path', () =>
        text(ctx, api, 'residual path', 420, 850, 29, themeColors.muted),
      ),
    );
  }
}
export default {
  id: 'shared-and-routed',
  draw: drawSharedAndRouted,
  cues: [
    'hidden-token',
    'shared-attention',
    'dense-ffn',
    'open-expert-pool',
    'router-choice',
    'combine-experts',
    'residual-connection',
  ],
};
