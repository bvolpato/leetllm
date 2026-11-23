import { tailOmission } from '../arithmetic.mjs';
import { TAIL_DRAWS } from '../fixtures.mjs';
import { centeredText, clauseComplete, clauseProgress } from '../defaults.mjs';
const rareMass = 0.05;
const commonMass = 1 - rareMass;
const fittedRareMass =
  TAIL_DRAWS.filter((draw) => draw.uniform >= commonMass).length / TAIL_DRAWS.length;

function compareRounds(ctx, api, progress) {
  const { C } = api;
  const x = 215,
    width = 1490,
    draw = 0.99;
  for (const [label, rare, y] of [
    ['Original model', rareMass, 418],
    ['Fit to the eight new searches', fittedRareMass, 735],
  ]) {
    api.text(ctx, label, x, y - 52, 45, C.ink);
    api.text(
      ctx,
      Math.round(rare * 100) + '% retries',
      x + width - 160,
      y - 52,
      42,
      C.pink,
      'right',
    );
    api.rect(ctx, x, y, width * (1 - rare), 76, C.blue, undefined, 0);
    if (rare > 0) api.rect(ctx, x + width * (1 - rare), y, width * rare, 76, C.pink, undefined, 0);
  }
  const markerX = x + draw * width;
  const markerY = api.lerp(456, 773, progress);
  api.line(ctx, markerX, 456, markerX, markerY, C.yellow, 4);
  api.circle(ctx, markerX, markerY, 13, C.yellow, C.bg, 4);
  api.text(ctx, 'Draw   ' + draw, x + width, 940, 42, C.yellow, 'right', 'mono');
}

export function drawRecursiveTail(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('recursive-tail-mechanism', () => {
    const probability = tailOmission(rareMass, TAIL_DRAWS.length),
      sampling = {
        categories: [
          {
            id: 'common',
            label: 'Ordinary search',
            mass: commonMass,
            color: themeColors.blue,
          },
          {
            id: 'rare',
            label: 'Retry',
            mass: rareMass,
            color: themeColors.pink,
          },
        ],
        draws: TAIL_DRAWS,
        normalization: 'probabilities',
        x: 180,
        y: 280,
        width: 1560,
        height: 670,
        fontSize: 27,
        color: themeColors.ink,
        trackColor: themeColors.panel,
      };
    if (currentBeat === 0) {
      api.teaching.categoricalSampling({
        ...sampling,
        visibleDraws: 0,
      });
      centeredText(
        ctx,
        api,
        'Eight independent draws. What is the chance of missing every retry?',
        960,
        930,
        34,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      api.teaching.categoricalSampling({
        ...sampling,
        visibleDraws: 0,
      });
      if (clauseComplete(ctx, api, 'omission-answer'))
        api.math(
          ctx,
          String.raw`P(0\ \mathrm{retries})=0.95^8\approx ` + probability.toFixed(4),
          960,
          250,
          40,
          themeColors.yellow,
          'center',
        );
    } else if (currentBeat === 2) {
      const progress = clauseProgress(ctx, api, 'sample-eight'),
        visible = Math.min(8, Math.floor(progress * 8)),
        motion = visible === 8 ? 0 : progress * 8 - visible;
      api.teaching.categoricalSampling({
        ...sampling,
        visibleDraws: visible,
        drawProgress: motion,
        showEmpirical: false,
      });
      centeredText(ctx, api, 'One batch of eight searches', 960, 250, 31, themeColors.cyan);
    } else if (currentBeat === 3) {
      api.teaching.categoricalSampling({
        ...sampling,
        visibleDraws: 8,
        showEmpirical: clauseComplete(ctx, api, 'empirical-zero'),
      });
      if (clauseComplete(ctx, api, 'replacement-zero'))
        centeredText(
          ctx,
          api,
          'Fit the next model to this batch   ·   P(retry) = ' + fittedRareMass,
          960,
          975,
          31,
          themeColors.pink,
        );
    } else {
      compareRounds(ctx, api, clauseProgress(ctx, api, 'tail-limit'));
    }
  });
}
export default {
  id: 'recursive-tail',
  draw: drawRecursiveTail,
  cues: [
    'tail-predict',
    'tail-premise',
    'miss-rule',
    'omission-answer',
    'sample-eight',
    'empirical-zero',
    'replacement-zero',
    'tail-limit',
    'tail-toy-limit',
  ],
};
