import { decodeSoftmax } from '../arithmetic.mjs';
import { coreBars, coreBox, coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawTemperatureOdds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-temperature-odds-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-temperature-odds-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'A logit gap becomes a probability ratio'
        : currentBeat === 1
          ? 'Positive-temperature limits and deterministic argmax differ'
          : 'Eligible events define the entropy calculation',
    );
    if (currentBeat === 0) {
      const temps = [1, 0.5, 1.5];
      temps.forEach((T, i) => {
        const x = 190 + i * 560;
        coreBox(ctx, api, 'gap 2 / T ' + T, x, 385, 480, 90, themeColors.blue);
        api.arrow(ctx, x + 240, 495, x + 240, 595, themeColors.cyan, 4);
        coreBox(ctx, api, 'exp(' + (2 / T).toFixed(3) + ')', x, 635, 480, 90, themeColors.cyan);
        coreBox(
          ctx,
          api,
          done('temperature-odds') ? Math.exp(2 / T).toFixed(3) + ' : 1' : 'odds pending',
          x,
          810,
          480,
          90,
          themeColors.yellow,
        );
      });
    } else if (currentBeat === 1) {
      const probs = done('tied-limit') ? [0.5, 0.5, 0] : decodeSoftmax([2, 2, 0], 1 - 0.9 * u);
      coreVector(ctx, api, probs, ['tied max A', 'tied max B', 'lower C'], 240, 425, 1440);
      coreBox(
        ctx,
        api,
        done('tied-limit') ? 'Positive T → 0: 1/2, 1/2, 0' : 'Positive T approaches zero',
        240,
        660,
        1440,
        85,
        themeColors.cyan,
      );
      coreBox(
        ctx,
        api,
        done('high-temperature-limit')
          ? 'T → infinity over 3 eligible IDs: [1/3, 1/3, 1/3]'
          : 'Deterministic argmax: ID A, by its stated tie rule',
        240,
        825,
        1440,
        85,
        themeColors.blue,
      );
    } else {
      const T = 0.3 + 2.7 * u,
        probs = decodeSoftmax([2, 2, 0, -Infinity], T),
        entropy = -probs.reduce((s, v) => s + (v ? v * Math.log2(v) : 0), 0);
      coreBars(ctx, api, probs, ['A', 'B', 'C', 'hard mask'], {
        max: 1,
        y: 400,
        gap: 100,
        colors: [themeColors.cyan, themeColors.cyan, themeColors.cyan, themeColors.muted],
      });
      coreText(
        ctx,
        api,
        'T = ' + T.toFixed(2) + ' · H = ' + entropy.toFixed(3) + ' bits',
        960,
        910,
        36,
        themeColors.yellow,
      );
    }
    coreFoot(
      ctx,
      api,
      'The ratio and entropy describe the next-token law over the fixed eligible set.',
    );
    return;
  });
}
export default {
  id: 'temperature-odds',
  draw: drawTemperatureOdds,
  cues: [
    'dec-temperature-odds-1',
    'dec-temperature-odds',
    'dec-temperature-odds-2',
    'dec-tied-limit',
    'dec-high-temperature-limit',
    'dec-temperature-odds-3',
  ],
};
