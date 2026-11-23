import { SCENES } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawDemand(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('demand', state);
  {
    teaching.flowGraph({
      nodes: [
        {
          id: 'requests',
          label: `${modelState.requestsPerMinute.toLocaleString()} requests / min`,
          x: 170,
          y: 390,
          width: 420,
          height: 108,
          color: themeColors.blue,
          focusTarget: 'demand-node-requests',
        },
        {
          id: 'tokens',
          label: `${modelState.tokensPerMinute.toLocaleString()} tokens / min`,
          x: 750,
          y: 390,
          width: 420,
          height: 108,
          color: themeColors.cyan,
        },
        {
          id: 'rate',
          label: `${modelState.tokensPerSecond.toLocaleString()} tokens / sec`,
          x: 1330,
          y: 390,
          width: 420,
          height: 108,
          color: themeColors.yellow,
        },
      ],
      edges: [
        {
          from: 'requests',
          to: 'tokens',
          progress: modelState.q,
        },
        {
          from: 'tokens',
          to: 'rate',
          progress: modelState.q,
        },
      ],
    });
    math(
      ctx,
      api,
      String.raw`\text{requests/min}\times\text{tokens/request}\div60=\text{tokens/s}`,
      960,
      600,
      37,
      themeColors.ink,
    );
    if (modelState.step)
      api.focus.target(
        'demand-s-tokenspersecond-s-assumedcapacity-demand-assumed-fleet-capacity',
        () =>
          teaching.bars({
            x: 360,
            y: 700,
            width: 1200,
            height: 160,
            values: [modelState.tokensPerSecond, modelState.assumedCapacity],
            labels: ['demand', 'assumed fleet capacity'],
            max: 130_000,
            colors: [themeColors.cyan, themeColors.blue],
            progress: 1,
            showValues: true,
            format: (value) => `${Math.round(value).toLocaleString()} tokens/s`,
            fontSize: 30,
            gap: 60,
          }),
      );
    text(
      ctx,
      api,
      modelState.step
        ? `Headroom ${modelState.headroom.toLocaleString()} tokens/s · ${Math.round(modelState.headroomFraction * 100)}% of assumed capacity`
        : 'Supplied mix · 1,200 input + 450 output tokens per request',
      960,
      950,
      30,
      themeColors.yellow,
      'center',
    );
  }
  const order = SCENES.indexOf('demand');
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
  id: 'demand',
  draw: drawDemand,
  cues: ['demand-beat-1-focus-1', 'demand-beat-1-focus-2', 'demand-beat-2-focus-1'],
};
