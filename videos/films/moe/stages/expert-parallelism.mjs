import { center } from '../arithmetic.mjs';
import { REMOTE_ASSIGNMENTS } from '../fixtures.mjs';
import { circle, math, node, packet, path, rect, subtitle, text } from '../defaults.mjs';
import { drawConcept } from '../../../lib/concepts.mjs';
export function drawExpertParallelism(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const tokens = [
    themeColors.cyan,
    themeColors.pink,
    themeColors.yellow,
    themeColors.blue,
    themeColors.green,
    themeColors.red,
    '#c4a9ff',
    '#b2c8f3',
  ];
  const fade = api.components.fade;
  {
    const dispatch = api.focus.progress('remote-state', stage(1, 0.08, 0.43)),
      back = api.focus.progress('cross-device', stage(1, 0.5, 0.9)),
      count = state.cues
        ? state.cues['payload-total']?.phase === 'after'
          ? 1
          : 0
        : stage(2, 0.08, 0.85),
      tp = state.cues ? (api.focus.progress('tensor-shards', 0) > 0 ? 1 : 0) : stage(3, 0.08, 0.85);
    const owners = [0, 0, 1, 1];
    const gpu0 = {
      x: 130,
      y: 285,
      width: 680,
      height: 560,
      radius: 20,
    };
    const gpu1 = {
      x: 1110,
      y: 285,
      width: 680,
      height: 560,
      radius: 20,
    };
    const expertNodes = [
      {
        x: 220,
        y: 420,
        width: 230,
        height: 100,
      },
      {
        x: 510,
        y: 420,
        width: 230,
        height: 100,
      },
      {
        x: 1200,
        y: 420,
        width: 230,
        height: 100,
      },
      {
        x: 1490,
        y: 420,
        width: 230,
        height: 100,
      },
    ];
    const packetRoutes = REMOTE_ASSIGNMENTS.map((assignment, i) => {
      const sourceX = [300, 460, 1300, 1460, 620][i];
      const source = {
          x: sourceX,
          y: 745,
        },
        destination = center(expertNodes[assignment.expert]);
      const remote = assignment.source !== owners[assignment.expert];
      const y = 585 + (i % 3) * 45;
      const points = remote
        ? [
            source,
            {
              x: source.x,
              y,
            },
            {
              x: destination.x,
              y,
            },
            {
              x: destination.x,
              y: 540,
            },
          ]
        : [
            source,
            {
              x: destination.x,
              y: 650,
            },
            {
              x: destination.x,
              y: 540,
            },
          ];
      if (remote)
        api.focus.target('expert-parallelism-readout-2', () =>
          api.focus.target('remote-expert-routes', () =>
            path(ctx, api, points, themeColors.muted, 3),
          ),
        );
      else path(ctx, api, points, '#8d9cb930', 2);
      if (remote) {
        api.focus.target('remote-expert-routes', () =>
          packet(ctx, api, points, dispatch, tokens[i], 13),
        );
        api.focus.target('remote-expert-routes', () =>
          packet(ctx, api, [...points].reverse(), back, tokens[i], 13),
        );
      }
      return {
        source,
        remote,
        points,
      };
    });
    Object.assign(
      gpu0,
      rect(ctx, api, 130, 285, 680, 560, themeColors.panel, themeColors.blue, 20),
    );
    Object.assign(
      gpu1,
      rect(ctx, api, 1110, 285, 680, 560, themeColors.panel, themeColors.pink, 20),
    );
    [gpu0, gpu1].forEach((bounds, device) =>
      api.container(
        ctx,
        bounds,
        () =>
          drawConcept(ctx, api, 'gpu', bounds.x + 200, 315, 64, {
            label: `GPU ${device}`,
            labelPosition: 'right',
            labelSize: 34,
            labelGap: 16,
            labelColor: device ? themeColors.pink : themeColors.blue,
          }),
        {
          padding: 24,
        },
      ),
    );
    packetRoutes.forEach(({ points, remote }, i) => {
      for (const clip of [gpu0, gpu1])
        api.path(ctx, points, {
          color: remote ? '#8d9cb95c' : '#8d9cb930',
          width: remote ? 3 : 2,
          clip,
        });
      if (!remote) {
        packet(ctx, api, points, dispatch, tokens[i], 13);
        packet(ctx, api, [...points].reverse(), back, tokens[i], 13);
      }
    });
    for (const [device, bounds] of [gpu0, gpu1].entries())
      api.container(
        ctx,
        bounds,
        () => {
          expertNodes.forEach((expert, i) => {
            if (owners[i] === device)
              api.focus.target('expert-parallelism-expert', () =>
                node(ctx, api, expert, `E${i + 1}`, colors[i], 38),
              );
          });
          packetRoutes.forEach(({ source }, i) => {
            if (REMOTE_ASSIGNMENTS[i].source !== device) return;
            circle(ctx, api, source.x, source.y, 22, tokens[i], themeColors.bg, 2);
            api.focus.target('expert-parallelism-readout', () =>
              text(ctx, api, `t${i}`, source.x, 805, 28, tokens[i], 'center', 'mono'),
            );
          });
        },
        {
          padding: 24,
          id: `gpu-${device}`,
        },
      );
    fade(count * (1 - api.phase(tp, 0, 0.4)), () => {
      api.focus.target('expert-parallelism-readout-2', () =>
        math(
          ctx,
          api,
          String.raw`2\times3\times4096\times2=49{,}152\;\mathrm{bytes}`,
          960,
          920,
          44,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('expert-parallelism-48-ki-b-dispatch-combine-payload', () =>
        text(
          ctx,
          api,
          '48 KiB dispatch + combine payload',
          960,
          990,
          33,
          themeColors.cyan,
          'center',
        ),
      );
    });
    fade(api.phase(tp, 0.55, 0.95), () => {
      api.focus.target('expert-parallelism-ep-assign-expert-ownership', () =>
        text(ctx, api, 'EP: assign expert ownership', 480, 930, 31, themeColors.blue, 'center'),
      );
      api.focus.target('expert-parallelism-tp-shard-each-expert-matrix', () =>
        text(ctx, api, 'TP: shard each expert matrix', 1450, 930, 31, themeColors.pink, 'center'),
      );
      subtitle(ctx, api, 'Weights stay resident. Token states and expert results move.');
    });
  }
}
export default {
  id: 'expert-parallelism',
  draw: drawExpertParallelism,
  cues: [
    'expert-owners',
    'remote-state',
    'cross-device',
    'fixed-weights',
    'both-directions',
    'payload-total',
    'tensor-shards',
    'parallel-layout',
  ],
};
