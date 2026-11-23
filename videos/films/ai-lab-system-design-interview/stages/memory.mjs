import { SCENES } from '../fixtures.mjs';
import { memoryTrace, sampleModel } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawMemory(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('memory', state);
  {
    const v = memoryTrace(state.beat ?? 0, state.beatP ?? 0, state.cues),
      color = modelState.step ? themeColors.green : themeColors.pink;
    api.focus.target('memory-loaded-bf16-weights', () =>
      card(ctx, api, 'Loaded BF16 weights', 170, 335, 640, themeColors.blue, 95, 35),
    );
    api.focus.target('memory-fixed-weight-cost', () =>
      math(ctx, api, '8\\cdot10^9\\cdot2/10^9=16\\ \\mathrm{GB}', 490, 545, 37, themeColors.blue),
    );
    text(
      ctx,
      api,
      'Fixed across the same request/cache comparison',
      490,
      630,
      26,
      themeColors.muted,
      'center',
    );
    api.focus.target('memory-head-slices', () => {
      text(
        ctx,
        api,
        (modelState.step ? 'MHA → GQA · ' : 'Count MHA · ') + v.heads + ' KV-head slices',
        1370,
        300,
        31,
        color,
        'center',
      );
      for (let head = 0; head < 32; head++) {
        const x = 970 + (head % 8) * 100,
          y = 350 + Math.floor(head / 8) * 75;
        card(ctx, api, String(head), x, y, 85, head < v.heads ? color : themeColors.muted, 55, 24);
      }
    });
    api.focus.target('memory-cache-shape', () => {
      text(
        ctx,
        api,
        'Each slice keeps B16 × S2048 ×32 layers ×128 width ×2 bytes ×K/V',
        1370,
        690,
        24,
        themeColors.muted,
        'center',
      );
      math(
        ctx,
        api,
        'M_{KV}=2\\cdot16\\cdot2048\\cdot32\\cdot' +
          v.heads +
          '\\cdot128\\cdot2/10^9=' +
          v.kvGb.toFixed(2) +
          '\\ \\mathrm{GB}',
        960,
        775,
        36,
        themeColors.yellow,
      );
    });
    [
      ['Weights', v.weightsGb, themeColors.blue],
      ['KV cache', v.kvGb, color],
    ].forEach(([name, value, tone], i) =>
      api.focus.target(i ? 'memory-cache-bytes' : 'memory-weight-bytes', () => {
        const y = 825 + i * 105;
        text(ctx, api, name, 170, y + 43, 30, tone);
        api.rect(ctx, 480, y, 1100, 65, themeColors.panel, themeColors.muted, 4);
        if (i && modelState.step)
          api.rect(
            ctx,
            480,
            y,
            (1100 * v.fullKvGb) / 20,
            65,
            themeColors.panel,
            themeColors.pink,
            4,
          );
        teaching.changeCue(
          {
            x: 465,
            y: y - 10,
            width: 1330,
            height: 80,
            from: i ? v.fullKvGb : 16,
            to: value,
            progress: 1,
            emphasis: i ? 0.4 : 0,
            color: tone,
          },
          () => {
            api.rect(ctx, 480, y, (1100 * value) / 20, 65, tone, undefined, 4);
            text(ctx, api, value.toFixed(1) + ' GB', 1765, y + 45, 34, tone, 'right');
          },
        );
      }),
    );
  }
  const order = SCENES.indexOf('memory');
  const overview = [
    ['Gateway · request ID', themeColors.blue],
    [
      order >= 4 ? 'Queue · 250 ms' : 'Admission',
      order >= 4 ? themeColors.yellow : themeColors.muted,
    ],
    [
      order >= 5 ? 'ACL · filter first' : 'Data eligibility',
      order >= 5 ? themeColors.green : themeColors.muted,
    ],
    [
      order >= 2 ? 'Worker · KV budget' : 'Model worker',
      order >= 2 ? themeColors.cyan : themeColors.muted,
    ],
    [
      order >= 1 ? 'Receipt · decision owner' : 'Decision receipt',
      order >= 1 ? themeColors.blue : themeColors.muted,
    ],
  ];
  const nodes = overview.map(([label, color], i) =>
    card(ctx, api, label, 115 + i * 345, 1005, 310, color, 54, 23),
  );
  for (let i = 0; i < 4; i++)
    teaching.transfer({
      source: {
        shape: nodes[i],
        opacity: 1,
      },
      target: {
        shape: nodes[i + 1],
        opacity: 1,
      },
      progress: 1,
      color: themeColors.muted,
    });
}
export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'memory-fixed-weights',
    'memory-grow-cache',
    'memory-mha-comparison',
    'memory-quarter-heads',
  ],
};
