import {
  connectionEndpoints,
  drawGraphBox,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
  drawTransmission,
  fadeConstruction,
} from '../defaults.mjs';
export function drawChainRule(ctx, scene, state, api) {
  const { C: themeColors, line, rect } = api;
  const progress2 = api.clamp(state.p ?? 0);
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? progress2);
  const { ink, muted, cyan, blue, yellow, pink, green, red, panel } = themeColors;
  const computationGraph = (reverse) => {
    const nodes = [
      {
        x: 220,
        y: 365,
        w: 150,
        h: 112,
        title: String.raw`w_p`,
        value: '2',
        color: blue,
      },
      {
        x: 440,
        y: 475,
        w: 150,
        h: 112,
        title: String.raw`x_p`,
        value: '2',
        color: blue,
      },
      {
        x: 220,
        y: 660,
        w: 150,
        h: 112,
        title: String.raw`w_q`,
        value: '2',
        color: cyan,
      },
      {
        x: 440,
        y: 770,
        w: 150,
        h: 112,
        title: String.raw`x_q`,
        value: '1',
        color: cyan,
      },
      {
        x: 800,
        y: 420,
        w: 250,
        h: 120,
        title: String.raw`w_p x_p`,
        value: reverse ? '4' : '2 × 2 = 4',
        color: blue,
      },
      {
        x: 800,
        y: 715,
        w: 250,
        h: 120,
        title: String.raw`w_q x_q`,
        value: reverse ? '2' : '2 × 1 = 2',
        color: cyan,
      },
      {
        x: 1160,
        y: 565,
        w: 230,
        h: 120,
        title: String.raw`\hat{y}`,
        value: reverse ? '6' : 'prediction 6',
        color: green,
      },
      {
        x: 1460,
        y: 565,
        w: 200,
        h: 120,
        title: String.raw`e=\hat{y}-y`,
        value: reverse ? '1' : 'error 1',
        color: yellow,
      },
      {
        x: 1730,
        y: 565,
        w: 160,
        h: 120,
        title: String.raw`L=e^2`,
        value: reverse ? '1' : 'loss 1',
        color: pink,
      },
    ];
    const edges = [
      [0, 4, blue],
      [1, 4, blue],
      [2, 5, cyan],
      [3, 5, cyan],
      [4, 6, blue],
      [5, 6, cyan],
      [6, 7, green],
      [7, 8, yellow],
    ].map(([from, to, color]) => connectionEndpoints(ctx, api, nodes[from], nodes[to], color));
    const nominalForward =
      beat === 0
        ? api.phase(beatP, 0.16, 0.9) * 0.18
        : beat === 1
          ? api.phase(beatP, 0.04, 0.9)
          : 1;
    const forwardCues = [
      'graph-node-4-b2-1',
      'graph-queue-cue',
      'graph-node-6-b2-2',
      'graph-error-cue',
      'graph-node-8-b2-3',
    ];
    const forwardProgress =
      !reverse && state.cues ? forwardCues.map((id) => api.focus.progress(id, 0)) : null;
    const forwardStage = forwardProgress
      ? forwardProgress.reduce((sum, q, i) => sum + q * [0.12, 0.12, 0.26, 0.22, 0.22][i], 0)
      : nominalForward;
    const reverseProgress =
      reverse && state.cues
        ? {
            square: api.focus.progress('graph-node-7-b1-2', 0),
            subtract: api.focus.progress('backward-subtraction', 0),
            branches: api.focus.progress('graph-node-6-b2-1', 0),
            prompt: api.focus.progress('graph-node-1-b2-2', 0),
            queue: api.focus.progress('queue-backward', 0),
          }
        : null;
    const nominalReverse =
      beat === 0
        ? api.phase(beatP, 0.1, 0.88) * 0.45
        : beat === 1
          ? beatP < 0.23
            ? api.lerp(0.45, 0.68, api.phase(beatP, 0.01, 0.23))
            : api.lerp(0.68, 1, api.phase(beatP, 0.23, 0.52))
          : 1;
    const reverseStage = reverseProgress
      ? 0.2 * reverseProgress.square +
        0.25 * reverseProgress.subtract +
        0.23 * reverseProgress.branches +
        0.16 * reverseProgress.prompt +
        0.16 * reverseProgress.queue
      : nominalReverse;
    const edgeStages = reverse
      ? [
          [7, 0, 0.2],
          [6, 0.2, 0.45],
          [4, 0.45, 0.68],
          [5, 0.45, 0.68],
          [0, 0.68, 0.96],
          [1, 0.68, 0.96],
          [2, 0.68, 0.96],
          [3, 0.68, 0.96],
        ]
      : [
          [0, 0, 0.24],
          [1, 0, 0.24],
          [2, 0, 0.24],
          [3, 0, 0.24],
          [4, 0.24, 0.5],
          [5, 0.24, 0.5],
          [6, 0.5, 0.72],
          [7, 0.72, 0.94],
        ];
    edges.forEach(([x1, y1, x2, y2]) => line(ctx, x1, y1, x2, y2, '#34415a', 2));
    edgeStages.forEach(([edgeIndex, start, end]) => {
      const amount = reverseProgress
        ? edgeIndex === 7
          ? reverseProgress.square
          : edgeIndex === 6
            ? reverseProgress.subtract
            : edgeIndex >= 4
              ? reverseProgress.branches
              : edgeIndex < 2
                ? reverseProgress.prompt
                : reverseProgress.queue
        : forwardProgress
          ? forwardProgress[
              edgeIndex < 2 ? 0 : edgeIndex < 4 ? 1 : edgeIndex < 6 ? 2 : edgeIndex === 6 ? 3 : 4
            ]
          : api.phase(reverse ? reverseStage : forwardStage, start, end);
      drawTransmission(
        ctx,
        api,
        edges[edgeIndex],
        amount,
        reverse,
        reverse && edgeIndex >= 6 ? pink : undefined,
      );
    });
    const replay =
      reverse && beat === 2
        ? {
            loss: api.focus.progress('replay-loss', api.phase(beatP, 0.01, 0.12)),
            square: api.focus.progress('replay-square', api.phase(beatP, 0.12, 0.3)),
            subtraction: api.focus.progress('replay-subtraction', api.phase(beatP, 0.3, 0.42)),
            feature: api.focus.progress('replay-feature', api.phase(beatP, 0.42, 0.58)),
            result: api.focus.progress('replay-result', api.phase(beatP, 0.58, 0.7)),
          }
        : null;
    if (replay) {
      [
        [7, replay.square],
        [6, replay.subtraction],
        [4, replay.subtraction],
        [0, replay.feature],
      ].forEach(([index, progress]) =>
        drawTransmission(ctx, api, edges[index], progress, true, blue),
      );
    }
    const visibleStages = [0, 0, 0, 0, 0.24, 0.24, 0.5, 0.72, 0.94];
    nodes.forEach((node, i) => {
      const received =
        reverse ||
        i < 4 ||
        (forwardProgress ? forwardProgress[i - 4] >= 1 : forwardStage >= visibleStages[i]);
      api.focus.target('graph-node-' + i, () =>
        drawGraphBox(ctx, api, {
          ...node,
          value: received ? node.value : ' ',
        }),
      );
      if (!reverse && i >= 4 && forwardStage >= visibleStages[i]) {
        const highlight = 1 - api.phase(forwardStage, visibleStages[i], visibleStages[i] + 0.15);
        fadeConstruction(ctx, api, highlight, () =>
          rect(
            ctx,
            node.x - node.w / 2 - 7,
            node.y - node.h / 2 - 7,
            node.w + 14,
            node.h + 14,
            'transparent',
            node.color,
            23,
          ),
        );
      }
      const retained = i >= 4 && (reverse || (beat === 2 && beatP >= (i - 4) * 0.12));
      if (retained) {
        const x = node.x + node.w / 2 - 25,
          y = node.y + node.h / 2 - 17;
        api.path(
          ctx,
          [
            {
              x: x - 7,
              y: y - 4,
            },
            {
              x: x - 2,
              y,
            },
            {
              x: x + 7,
              y: y - 10,
            },
          ],
          {
            color: reverse ? yellow : node.color,
            width: 3,
          },
        );
      }
    });
    const target = {
      x: 1460,
      y: 300,
      w: 170,
      h: 100,
      title: 'y',
      value: '5',
      color: green,
    };
    api.focus.target('graph-target', () => drawGraphBox(ctx, api, target));
    drawShortArrow(ctx, api, ctx, 1460, 350, 1460, 505, green, 3);
    if (reverse) {
      fadeConstruction(ctx, api, api.phase(reverseStage, 0, 0.16), () =>
        drawOriginalEquation(ctx, api, String.raw`1\times2e=2`, 1600, 385, 33, pink, 'center'),
      );
      fadeConstruction(ctx, api, api.phase(reverseStage, 0.2, 0.4), () =>
        drawOriginalEquation(ctx, api, String.raw`\times1`, 1300, 410, 30, yellow, 'center'),
      );
      fadeConstruction(ctx, api, api.phase(reverseStage, 0.45, 0.64), () => {
        drawOriginalEquation(ctx, api, String.raw`2`, 1005, 365, 34, blue, 'center');
        drawOriginalEquation(ctx, api, String.raw`2`, 1005, 780, 34, cyan, 'center');
      });
      const promptReturn = reverseProgress?.prompt ?? api.phase(reverseStage, 0.68, 0.96);
      const queueReturn = reverseProgress?.queue ?? api.phase(reverseStage, 0.68, 0.96);
      fadeConstruction(ctx, api, promptReturn, () => {
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\times x_p=\times2`,
          520,
          320,
          30,
          blue,
          'center',
        );
        const factors =
          replay?.result >= 1
            ? String.raw`1\times2\times1\times2=4`
            : replay?.feature >= 1
              ? String.raw`1\times2\times1\times2`
              : replay?.subtraction >= 1
                ? String.raw`1\times2\times1`
                : replay?.square >= 1
                  ? String.raw`1\times2`
                  : '1';
        api.focus.target('prompt-replay-product', () =>
          drawOriginalEquation(
            ctx,
            api,
            beat === 2
              ? String.raw`\vphantom{x_p}` + factors
              : String.raw`\frac{\partial L}{\partial w_p}=4`,
            510,
            890,
            37,
            blue,
            'center',
          ),
        );
      });
      fadeConstruction(ctx, api, queueReturn, () => {
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\times x_q=\times1`,
          520,
          620,
          30,
          cyan,
          'center',
        );
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\frac{\partial L}{\partial w_q}=2`,
          1395,
          890,
          37,
          cyan,
          'center',
        );
      });
      drawOriginalText(
        ctx,
        api,
        'multiply local sensitivities along each path',
        960,
        945,
        33,
        ink,
        'center',
      );
    } else {
      drawOriginalText(
        ctx,
        api,
        beat === 2
          ? 'keep intermediate values for the backward pass'
          : 'values arrive before the next operation can run',
        960,
        915,
        33,
        muted,
        'center',
      );
    }
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    computationGraph(true);
    return;
  })();
  ctx.restore();
}
export default {
  id: 'chain-rule',
  draw: drawChainRule,
  cues: [
    'graph-node-8-b1-1',
    'graph-node-7-b1-2',
    'backward-subtraction',
    'graph-node-6-b2-1',
    'graph-node-1-b2-2',
    'queue-backward',
    'graph-node-0-b3-1',
    'replay-loss',
    'replay-square',
    'replay-subtraction',
    'replay-feature',
    'replay-result',
  ],
};
