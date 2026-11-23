import { sum } from '../arithmetic.mjs';
import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterFoot,
  drawSkyChapterL,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawRewardNormalization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('reward-normalization', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-reward-normalization-mechanism', () => {
    const standard = currentBeat && done('standardize'),
      equal = currentBeat && done('equal-centered');
    drawSkyChapterTitle(
      ctx,
      api,
      equal
        ? 'Equal rewards collapse the centered term'
        : currentBeat
          ? 'Add a distinct standard-deviation divisor'
          : 'Keep all four reward identities while subtracting one mean',
    );
    const reward = equal ? [1, 1, 1, 1] : [1, 0, 1, 0],
      mean = sum(reward) / 4,
      sigma = Math.sqrt(sum(reward.map((v) => (v - mean) ** 2)) / 4),
      centered = !currentBeat ? R('centered-halves') : 1;
    drawSkyChapterL(ctx, api, 240, 690, 1700, 690, themeColors.muted, 3);
    reward.forEach((v, i) => {
      const x = 410 + i * 380,
        now = standard && !equal ? (v - mean) / sigma : v - mean * centered,
        y = 690 - now * 180;
      drawSkyChapterText(ctx, api, 'R' + i + ' = ' + v, x, 365, 31, themeColors.blue, 'center');
      drawSkyChapterL(
        ctx,
        api,
        x,
        690,
        x,
        y,
        now > 0 ? themeColors.green : now < 0 ? themeColors.pink : themeColors.muted,
        10,
      );
      api.circle(ctx, x, y, 13, themeColors.cyan);
      drawSkyChapterText(
        ctx,
        api,
        now.toFixed(2),
        x,
        y + (now < 0 ? 55 : -30),
        32,
        now > 0 ? themeColors.green : now < 0 ? themeColors.pink : themeColors.muted,
        'center',
      );
    });
    drawSkyChapterText(
      ctx,
      api,
      'mean ' +
        mean.toFixed(2) +
        (standard
          ? ' · population σ ' + sigma.toFixed(2)
          : ' · no standardization in the article toy'),
      960,
      970,
      34,
      themeColors.yellow,
      'center',
    );
    drawSkyChapterFoot(
      ctx,
      api,
      equal
        ? 'Centered term is zero; division by σ=0 is undefined; other terms can remain'
        : standard
          ? 'Standardized comparison is a separate recipe from mean centering'
          : 'Binary reward comparison is separate from the earlier shaped turn return',
    );
  });
}
export default {
  id: 'reward-normalization',
  draw: drawRewardNormalization,
  cues: [
    'sky-reward-normalization-b0',
    'sky-centered-halves',
    'sky-reward-normalization-b1',
    'sky-standardize',
    'sky-equal-centered',
  ],
};
