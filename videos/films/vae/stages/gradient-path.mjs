import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { arrow, chapterEquation, chapterText, line, note, point } from '../defaults.mjs';
export function drawGradientPath(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-gradient-path-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-gradient-path-' + id);
  {
    if (currentBeat === 1) {
      for (let j = 0; j < 2; j++) {
        const offset = j * 860,
          xs = [220 + offset, 500 + offset, 780 + offset],
          color = j ? themeColors.cyan : themeColors.pink;
        chapterText(
          ctx,
          api,
          j ? 'rsample(): path attached' : 'sample(): draw detached',
          500 + offset,
          305,
          35,
          color,
          'center',
        );
        xs.forEach((xx, i) => {
          point(
            ctx,
            api,
            xx,
            500,
            i === 0 ? themeColors.cyan : i === 1 ? themeColors.yellow : themeColors.green,
            15,
          );
          chapterText(
            ctx,
            api,
            ['encoder μ, ℓ', 'draw z', 'decoder w'][i],
            xx,
            580,
            28,
            themeColors.ink,
            'center',
          );
          if (i < 2) arrow(ctx, api, xx + 25, 500, xs[i + 1] - 25, 500, themeColors.muted);
        });
        arrow(ctx, api, xs[2] - 25, 680, xs[1] + 25, 680, themeColors.green);
        chapterText(
          ctx,
          api,
          'decoder weights still train',
          500 + offset,
          835,
          28,
          themeColors.green,
          'center',
        );
        if (j) {
          const a = clamped(q * 2);
          if (a > 0)
            arrow(
              ctx,
              api,
              xs[1] - 25,
              680,
              xs[1] - 25 - (xs[1] - xs[0] - 50) * a,
              680,
              themeColors.cyan,
            );
          chapterText(
            ctx,
            api,
            'reconstruction reaches encoder',
            500 + offset,
            765,
            29,
            themeColors.cyan,
            'center',
          );
        } else {
          line(ctx, api, xs[1], 640, xs[1], 720, themeColors.pink, 6);
          chapterText(
            ctx,
            api,
            'encoder reconstruction blocked',
            500 + offset,
            765,
            29,
            themeColors.pink,
            'center',
          );
        }
        arrow(ctx, api, xs[0], 375, xs[0], 465, themeColors.yellow);
        chapterText(ctx, api, 'analytic KL', xs[0], 350, 27, themeColors.yellow, 'center');
      }
      note(
        ctx,
        api,
        'Use rsample to preserve the reparameterized route; the independent analytic KL can update either encoder.',
      );
    } else if (currentBeat < 2) {
      const detached = currentBeat === 1;
      chapterText(
        ctx,
        api,
        detached ? 'sample: detached draw' : 'rsample: attached draw',
        960,
        300,
        36,
        detached ? themeColors.pink : themeColors.cyan,
        'center',
      );
      const xs = [250, 670, 1110, 1560],
        ys = [580, 580, 580, 580],
        labels = ['encoder (μ, ℓ)', 'z = μ + σ ε', 'decoder weights', 'reconstruction'];
      xs.forEach((x, i) => {
        point(
          ctx,
          api,
          x,
          ys[i],
          i === 0 ? themeColors.cyan : i === 1 ? themeColors.yellow : themeColors.green,
          17,
        );
        chapterText(ctx, api, labels[i], x, ys[i] - 85, 30, themeColors.ink, 'center');
        if (i < 3) arrow(ctx, api, x + 30, ys[i], xs[i + 1] - 30, ys[i], themeColors.muted);
      });
      if (q > 0.12) {
        arrow(ctx, api, 1535, 735, 1140, 735, themeColors.green);
        chapterText(ctx, api, 'decoder gradient', 1335, 800, 29, themeColors.green, 'center');
        if (!detached) {
          arrow(ctx, api, 1080, 735, 700, 735, themeColors.cyan);
          arrow(ctx, api, 640, 735, 280, 735, themeColors.cyan);
          chapterText(
            ctx,
            api,
            '∂z/∂μ = 1 · ∂z/∂ℓ = ½σε',
            560,
            865,
            31,
            themeColors.cyan,
            'center',
          );
        } else {
          line(ctx, api, 735, 690, 735, 775, themeColors.pink, 6);
          chapterText(
            ctx,
            api,
            'reconstruction stops here',
            600,
            825,
            29,
            themeColors.pink,
            'center',
          );
          line(ctx, api, 100, 400, 100, 580, themeColors.yellow, 4);
          arrow(ctx, api, 100, 580, 220, 580, themeColors.yellow);
          chapterText(
            ctx,
            api,
            'analytic KL still updates encoder',
            650,
            395,
            30,
            themeColors.yellow,
            'center',
          );
        }
      }
      note(
        ctx,
        api,
        'Independent noise ε stays fixed while derivatives flow through the selected parameter path.',
      );
    } else {
      chapterText(
        ctx,
        api,
        'supplied detached z = 0.8 · weight = 1.5 · target = 0.2',
        960,
        310,
        34,
        themeColors.ink,
        'center',
      );
      chapterEquation(ctx, api, 'y=wz', 420, 510, 54, themeColors.cyan, 'center');
      arrow(ctx, api, 630, 500, 820, 500, themeColors.cyan);
      chapterEquation(
        ctx,
        api,
        ready('decoder') ? 'y=1.2' : 'y=?',
        1100,
        510,
        54,
        themeColors.green,
        'center',
      );
      chapterEquation(ctx, api, '\\partial_w L=(y-t)z', 780, 710, 52, themeColors.ink, 'center');
      chapterEquation(
        ctx,
        api,
        ready('decoder') ? '=(1.2-0.2)\\,0.8=0.8' : '=?',
        1370,
        710,
        44,
        themeColors.yellow,
        'center',
      );
      note(ctx, api, 'A detached input can still train the decoder weight that multiplies it.');
    }
  }
}
export default {
  id: 'gradient-path',
  draw: drawGradientPath,
  cues: [
    'vae-gradient-path-0-build',
    'vae-gradient-path-1-build',
    'vae-gradient-path-2-build',
    'vae-gradient-path-decoder',
  ],
};
