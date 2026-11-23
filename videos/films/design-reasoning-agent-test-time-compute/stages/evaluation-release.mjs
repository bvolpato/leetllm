import { beatCue, sentence } from '../construction.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
} from '../defaults.mjs';

function scoreHistory(ctx, state, api) {
  const { C } = api;
  const series = [
    {
      name: 'Proxy',
      values: [0.5, 0.65, 0.8],
      color: C.blue,
      cue: 'ra-evaluation-release-1-0',
      at: 0.12,
    },
    {
      name: 'Independent',
      values: [0.7, 0.76, 0.6],
      color: C.yellow,
      cue: 'eval-independent',
      at: 0.28,
    },
  ];
  const x = [475, 935, 1395];
  const y = (score) => 760 - 1150 * (score - 0.5);
  for (const [i, pos] of x.entries()) {
    api.text(ctx, 'Step ' + (i + 1), pos, 870, 36, C.muted, 'center');
  }
  for (const { name, values, color, cue, at } of series) {
    const last = beatCue(state, cue, 1, at);
    const [first, second, third] = values;
    api.text(ctx, name, x[0] - 50, y(first) + 14, 39, color, 'right');
    api.line(ctx, x[0], y(first), x[1], y(second), color, 7);
    if (last.p > 0) {
      const endX = x[1] + (x[2] - x[1]) * last.p;
      const endY = y(second + (third - second) * last.p);
      api.line(ctx, x[1], y(second), endX, endY, color, 7);
      api.circle(ctx, endX, endY, 11, color);
    }
    for (let i = 0; i < (last.done ? 3 : 2); i++) {
      const labelY = y(values[i]) + (i === 1 && name === 'Proxy' ? 56 : -27);
      api.circle(ctx, x[i], y(values[i]), 11, color);
      api.text(ctx, values[i].toFixed(2), x[i], labelY, 37, color, 'center');
    }
  }
}

export function drawEvaluationRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (beat, n) => sentence(state, 'evaluation-release', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat === 0
        ? 'What did the two systems spend on the whole workload?'
        : currentBeat === 1
          ? 'Two scores for the same outputs   /   worked example'
          : 'Compare the controllers on held-out incidents',
    );
    if (currentBeat === 0) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Snell et al.', 'Comparison on math prompts'],
          ['Smaller system', 'Trained to revise and verify'],
          ['Larger model', '14× as many parameters'],
          ['Matched compute', 'Estimated training + inference FLOPs'],
        ],
        200,
        370,
        1520,
        380,
        themeColors.blue,
        31,
      );
      if (done(0, 3))
        drawConstructionBox(
          ctx,
          api,
          'Prompt difficulty and total workload can change the preferred model',
          200,
          830,
          1520,
          100,
          themeColors.yellow,
          31,
        );
    } else if (currentBeat === 1) {
      scoreHistory(ctx, state, api);
      if (done(1, 2))
        drawConstructionBox(
          ctx,
          api,
          'Checkout: measure correct advice and the cost of every call',
          200,
          885,
          1520,
          95,
          themeColors.yellow,
          29,
        );
    } else {
      const partitions = [
        ['incident I1', 'development'],
        ['paraphrase I1', 'development'],
        ['incident I2', 'held out'],
      ];
      drawConstructionGrid(
        ctx,
        api,
        [['frozen incident family', 'split'], ...partitions],
        180,
        350,
        750,
        380,
        themeColors.cyan,
        30,
      );
      drawConstructionGrid(
        ctx,
        api,
        [
          ['separate metric', 'release evidence'],
          ['eligible correctness', 'pending'],
          ['unsafe / abstain', 'pending'],
          ['generator + verifier cost', 'pending'],
          ['final latency', 'pending'],
        ],
        1040,
        350,
        720,
        480,
        themeColors.blue,
        28,
      );
      drawConstructionFoot(ctx, api, 'Keep each incident and its paraphrases in the same split.');
    }
  }
}
export default {
  id: 'evaluation-release',
  draw: drawEvaluationRelease,
  cues: [
    'ra-evaluation-release-0-0',
    'ra-evaluation-release-0-1',
    'ra-evaluation-release-0-2',
    'ra-evaluation-release-0-3',
    'ra-evaluation-release-1-0',
    'eval-independent',
    'ra-evaluation-release-1-1',
    'ra-evaluation-release-1-2',
    'ra-evaluation-release-2-0',
    'ra-evaluation-release-2-1',
    'ra-evaluation-release-2-2',
  ],
};
