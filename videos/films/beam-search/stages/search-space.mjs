import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import {
  drawCaption,
  drawLine,
  drawPolicyCard,
  drawPolicyEquation,
  drawPolicyText,
} from '../defaults.mjs';
export function drawSearchSpace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('search-space', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'search-space'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    if (beat === 0) {
      const layers = [1, 3, 9, 27],
        xs = [230, 680, 1130, 1580],
        depth = Math.min(3, Math.floor(progress * 4));
      target(() => {
        layers.forEach((n, layer) => {
          if (layer > depth) return;
          for (let i = 0; i < n; i++) {
            const y = 370 + ((i + 0.5) * 440) / n;
            if (layer) {
              const parentY = 370 + ((Math.floor(i / 3) + 0.5) * 440) / layers[layer - 1];
              drawLine(
                ctx,
                api,
                xs[layer - 1] + 10,
                parentY,
                xs[layer] - 10,
                y,
                themeColors.panel,
                2,
              );
            }
            api.circle(ctx, xs[layer], y, layer < 3 ? 8 : 5, colors[layer]);
          }
          drawPolicyText(
            ctx,
            api,
            `${n} ${layer ? 'prefixes' : 'start'}`,
            xs[layer],
            890,
            28,
            colors[layer],
            'center',
          );
        });
      });
      drawPolicyEquation(ctx, api, '3^3=27', 960, 300, 43, themeColors.yellow, 'center');
      drawCaption(ctx, api, 'Each new position multiplies the number of complete continuations.');
    } else if (beat === 1) {
      const factors = ['p(y₁ | x)', 'p(y₂ | x,y₁)', 'p(y₃ | x,y₁,y₂)'];
      target(() =>
        factors.forEach((s, i) => {
          const x = 200 + i * 560;
          drawPolicyCard(ctx, api, 'search-space', s, x, 445, 440, 100, colors[i], 31);
          if (i < 2) drawPolicyText(ctx, api, '×', x + 500, 510, 41, themeColors.yellow, 'center');
        }),
      );
      drawPolicyEquation(
        ctx,
        api,
        String.raw`P(y_{1:T}\mid x)=\prod_{t=1}^{T}p(y_t\mid x,y_{<t})`,
        960,
        700,
        47,
        themeColors.cyan,
        'center',
      );
      drawCaption(
        ctx,
        api,
        'A sampled path follows conditional rows. A mode search compares whole paths.',
      );
    } else {
      drawPolicyText(
        ctx,
        api,
        'Can these histories share one future?',
        960,
        300,
        35,
        themeColors.ink,
        'center',
      );
      target(() => {
        ['create → deploy', 'revoke → create'].forEach((s, i) => {
          drawPolicyCard(ctx, api, 'search-space', s, 220, 430 + i * 210, 600, 92, colors[i], 32);
          api.arrow(ctx, 850, 476 + i * 210, 1100, 476 + i * 210, colors[i]);
          drawPolicyCard(
            ctx,
            api,
            'search-space',
            `distinct state h${i + 1}`,
            1150,
            430 + i * 210,
            510,
            92,
            colors[i],
            31,
          );
        });
      });
      drawPolicyEquation(
        ctx,
        api,
        String.raw`32000^{100}\approx 3.27\times 10^{450}`,
        960,
        875,
        43,
        themeColors.yellow,
        'center',
      );
      drawCaption(
        ctx,
        api,
        'A general full-history transformer has no declared small Markov-state merge.',
      );
    }
  }
  return;
}
export default {
  id: 'search-space',
  draw: drawSearchSpace,
  cues: ['search-space-build-0', 'search-space-build-1', 'search-space-build-2'],
};
