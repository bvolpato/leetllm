import { spokenCue } from '../construction.mjs';
import { box, drawText } from '../defaults.mjs';
import { probabilities } from '../fixtures.mjs';
import { introSnapshot } from '../model.mjs';

const candidates = [
  [
    ['on', probabilities[0]],
    ['under', 0.3],
    ['near', 0.15],
    ['other', 0.05],
  ],
  [
    ['the', probabilities[1]],
    ['a', 0.45],
    ['some', 0.3],
    ['other', 0.15],
  ],
  [
    ['mat', probabilities[2]],
    ['rug', 0.1],
    ['floor', 0.05],
    ['other', 0.05],
  ],
];
const left = 160;
const stripWidth = 1600;

function drawWords(ctx, api, model) {
  const { C } = api;
  drawText(ctx, api, 'Held-out text', left, 285, 32, C.muted);
  model.prefix.forEach((word, i) =>
    box(ctx, api, word, left + i * 226, 325, 206, 106, C.muted, 47),
  );
  const x = left + model.prefix.length * 226;
  if (model.observed === null) {
    api.rect(ctx, x, 325, 206, 106, '#29313e', C.muted, 4);
    for (let i = 0; i < 5; i++)
      api.line(ctx, x + 44 + 23 * i, 403, x + 70 + 23 * i, 352, C.muted, 4);
  } else {
    box(ctx, api, model.observed, x, 325, 206, 106, C.yellow, 47);
  }
}

function drawDistribution(ctx, api, model, unrolled = stripWidth) {
  const { C } = api;
  drawText(ctx, api, 'Model’s next-word probabilities', left, 514, 36, C.ink);
  api.rect(ctx, left, 639, stripWidth, 96, C.panel, C.muted, 2);
  let x = left;
  candidates[model.active].forEach(([word, share]) => {
    const width = stripWidth * share;
    const selected = model.observed === word;
    const choice = model.active === 0 && model.observed === null;
    const candidateColor = choice && (word === 'on' ? C.blue : word === 'under' ? C.cyan : null);
    if (x > left) api.line(ctx, x - 1.5, 640, x - 1.5, 734, C.muted, 2);
    const visible = Math.min(width - 3, left + unrolled - x);
    if (visible > 0)
      api.rect(
        ctx,
        x,
        639,
        visible,
        96,
        selected ? C.yellow : candidateColor || '#31455a',
        undefined,
        2,
      );
    const ink = selected ? C.yellow : C.ink;
    const size = width < 100 ? 28 : 36;
    drawText(ctx, api, word, x + width / 2, 575, size, ink, 'center');
    drawText(ctx, api, Math.round(share * 100) + '%', x + width / 2, 620, size, ink, 'center');
    x += width;
  });
  if (unrolled < stripWidth) {
    const edge = left + unrolled;
    const roll = 38 * Math.sqrt(1 - unrolled / stripWidth);
    api.rect(ctx, edge - roll, 639, roll, 96, C.muted, undefined, roll / 4);
    api.rect(ctx, edge - 0.7 * roll, 639, roll / 4, 96, C.ink, undefined, roll / 8);
  }
}

export function drawCoveredWord(ctx, scene, state, api) {
  const model = introSnapshot(0, 0);
  const first = spokenCue(scene, state, 'deal-half').progress;
  const second = spokenCue(scene, state, 'deal-under').progress;
  const asking = spokenCue(scene, state, 'ask-word').phase !== 'before';
  api.focus.target('covered-prefix', () => drawWords(ctx, api, model));
  api.focus.target('wager-strip', () => {
    const remaining = 1 - api.clamp(state.t / 1.2);
    drawDistribution(ctx, api, model, stripWidth * (1 - 0.84 * remaining ** 2));
    const half = stripWidth * candidates[0][0][1];
    if (first > 0 && second === 0 && !asking)
      api.line(ctx, left, 755, left + half * first, 755, api.C.cyan, 6);
    if (second > 0 && !asking)
      api.line(
        ctx,
        left + half,
        755,
        left + half + stripWidth * candidates[0][1][1] * second,
        755,
        api.C.cyan,
        6,
      );
  });
}

export const coveredWord = {
  id: 'covered-word',
  draw: drawCoveredWord,
  cues: ['read-prefix', 'deal-half', 'deal-under', 'ask-word'],
};

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const model = introSnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues);
  const trace = spokenCue(scene, state, 'intro-follow-share').progress;
  const readLosses = spokenCue(scene, state, 'intro-beat-3-focus-1').progress;
  api.focus.target('intro-token-positions', () => {
    drawWords(ctx, api, model);
    drawDistribution(ctx, api, model);
    if (model.count === 0) {
      drawText(ctx, api, 'Await the observed word', 960, 895, 43, C.muted, 'center');
      return;
    }
    const center = left + (stripWidth * probabilities[model.active]) / 2;
    const receipt = 410 + 545 * model.active;
    if (model.observed && trace > 0) {
      api.trace(
        ctx,
        [
          { x: center, y: 740 },
          { x: center, y: 769 },
          { x: receipt, y: 769 },
          { x: receipt, y: 812 },
        ],
        trace,
        C.yellow,
        4,
      );
    }
    model.targets.forEach((target, i) => {
      const x = 410 + i * 545;
      const showLoss = i === 0 ? trace >= 1 : readLosses * 2 >= i;
      box(
        ctx,
        api,
        showLoss
          ? '−ln(' + target.probability.toFixed(2) + ') ≈ ' + target.loss.toFixed(3) + ' nats'
          : target.token + '   ' + Math.round(target.probability * 100) + '%',
        x - 248,
        820,
        496,
        84,
        [C.blue, C.pink, C.green][i],
        34,
      );
      drawText(
        ctx,
        api,
        'P(' +
          target.token +
          ' | ' +
          target.prefix.join(' ') +
          ') = ' +
          target.probability.toFixed(2),
        x,
        956,
        25,
        C.muted,
        'center',
      );
    });
    drawText(ctx, api, 'Scored targets: ' + model.count, 960, 1030, 29, C.muted, 'center');
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-beat-1-focus-1',
    'intro-observed-on',
    'intro-follow-share',
    'intro-beat-2-focus-1',
    'intro-beat-2-focus-2',
    'intro-observed-the',
    'intro-observed-mat',
    'intro-beat-3-focus-1',
  ],
};
