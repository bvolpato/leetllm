import { chapterModel, completed } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterEquation,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawBalancedAssumptions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('balanced-assumptions', state),
    currentBeat = m.b,
    progress2 = m.p;
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65)),
    step = (n) => Math.min(n, Math.floor(progress * (n + 1)));
  drawChapterTarget(ctx, api, 'de-balanced-assumptions-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Uniformly chosen distinct expert pairs · fixed E=4, G=2',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    m.pairs.forEach((v, i) => {
      const x = 180 + i * 270;
      drawChapterBox(ctx, api, 'E' + v.pair.join(' / E'), x, 410, 245, themeColors.blue, 105);
      if (currentBeat || i < step(6))
        drawChapterText(
          ctx,
          api,
          v.destinations + ' destination' + (v.destinations === 1 ? '' : 's'),
          x + 122,
          640,
          27,
          v.destinations === 1 ? themeColors.pink : themeColors.cyan,
          'center',
        );
    });
    if (!currentBeat) {
      drawChapterEquation(
        ctx,
        api,
        String.raw`G\left(1-\frac{\binom{E-E/G}{k}}{\binom Ek}\right)`,
        960,
        835,
        50,
      );
      drawChapterText(
        ctx,
        api,
        'Miss one group using only its outside experts',
        960,
        995,
        29,
        themeColors.muted,
        'center',
      );
    } else
      drawChapterTarget(ctx, api, 'de-balanced-result', () => {
        drawChapterEquation(
          ctx,
          api,
          String.raw`\frac{1+2+2+2+2+1}{6}` +
            (done('de-expected-five-thirds') ? String.raw`=\frac{5}{3}` : ' = ?'),
          960,
          850,
          48,
        );
        drawChapterText(
          ctx,
          api,
          'Skewed or group-limited gates need their own observed histogram',
          960,
          1000,
          29,
          themeColors.muted,
          'center',
        );
      });
  });
}
export default {
  id: 'balanced-assumptions',
  draw: drawBalancedAssumptions,
  cues: [
    'de-balanced-assumptions-b0',
    'de-expected-miss',
    'de-expected-outside',
    'de-expected-ratio',
    'de-expected-final',
    'de-balanced-assumptions-b1',
    'de-expected-five-thirds',
  ],
};
