import { patchProjection } from '../model.mjs';
import {
  chapterCueProgress,
  chapterEquation,
  chapterOutline,
  chapterText,
  constructionFocus,
  formatChapterValue,
  ownerColor,
  valueGrid,
  withOpacity,
} from '../defaults.mjs';
export function drawPatchProjection(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'patch-projection', () => {
    const f = patchProjection(),
      q = currentBeat === 0 ? chapterCueProgress(ctx, api, 'patch-extract') : 1,
      patch =
        currentBeat === 1
          ? Math.min(3, Math.floor(chapterCueProgress(ctx, api, 'patch-reshape') * 4))
          : 0;
    chapterText(
      ctx,
      api,
      'supplied 4 × 4 grayscale fixture',
      480,
      285,
      30,
      themeColors.blue,
      'center',
    );
    const source = valueGrid(ctx, api, f.image, 250, 340, 87, {
      kind: 'image',
      font: 24,
      formatter: (v) => Math.round(v * 16) + '/16',
    });
    for (let i = 0; i < 4; i++) {
      const r = Math.floor(i / 2),
        d = i % 2;
      chapterOutline(ctx, api, 245 + d * 174, 335 + r * 174, 174, 174, ownerColor(ctx, api, i), 3);
    }
    const n = Math.floor(q * 4);
    for (let i = 0; i < 4; i++) {
      const y = 370 + i * 137;
      if (i < n && currentBeat !== 1) {
        chapterText(ctx, api, 'patch ' + i, 790, y + 38, 27, ownerColor(ctx, api, i), 'center');
        valueGrid(ctx, api, [f.patches[i]], 850, y, 90, {
          font: 23,
          formatter: (v) => Math.round(v * 16) + '/16',
        });
      }
    }
    if (currentBeat === 0) {
      chapterText(ctx, api, '4 entries per patch', 1450, 360, 34, themeColors.cyan, 'center');
      chapterEquation(ctx, api, 'P^2C\\to D', 1450, 570, 48, themeColors.cyan);
      chapterText(ctx, api, 'shared linear projection', 1450, 760, 31, themeColors.green, 'center');
    } else if (currentBeat === 1) {
      const q = chapterCueProgress(ctx, api, 'patch-reshape');
      chapterText(
        ctx,
        api,
        'linear weight rows → convolution kernels',
        1200,
        295,
        29,
        themeColors.cyan,
        'center',
      );
      for (let j = 0; j < 3; j++) {
        const t = api.phase(q, (2 - j) / 3, (3 - j) / 3);
        for (let i = 0; i < 4; i++) {
          const split = api.phase(t, 0, 0.3),
            horizontal = api.phase(t, 0.3, 0.65),
            vertical = api.phase(t, 0.65, 1),
            sourceY = 350 + j * 110,
            intermediateY = sourceY + (i > 1 ? 110 * split : 0),
            x = api.lerp(830 + i * 95, 1450 + (i % 2) * 85, horizontal),
            y = api.lerp(intermediateY, 370 + j * 200 + Math.floor(i / 2) * 85, vertical),
            size = api.lerp(88, 78, vertical),
            v = f.weights[j][i];
          api.rect(
            ctx,
            x,
            y,
            size,
            size,
            themeColors.panel,
            v < 0 ? themeColors.pink : themeColors.cyan,
            2,
            4,
          );
          chapterText(
            ctx,
            api,
            formatChapterValue(v),
            x + size / 2,
            y + size / 2 + 10,
            27,
            v < 0 ? themeColors.pink : themeColors.cyan,
            'center',
          );
        }
        if (t === 1)
          chapterText(
            ctx,
            api,
            'bias ' + formatChapterValue(f.bias[j]),
            1720,
            450 + j * 200,
            28,
            themeColors.muted,
            'center',
          );
      }
      if (q === 1) {
        f.tokens.forEach((token, i) =>
          chapterText(
            ctx,
            api,
            'token ' + i + ': ' + token.map((v) => formatChapterValue(v, 5)).join(', '),
            495,
            790 + i * 60,
            25,
            ownerColor(ctx, api, i),
            'center',
          ),
        );
      }
      if (chapterCueProgress(ctx, api, 'patch-weights') === 1)
        chapterText(
          ctx,
          api,
          '3 × 4 weights + 3 biases = 15',
          1210,
          1020,
          30,
          themeColors.green,
          'center',
        );
    } else {
      const mix = chapterCueProgress(ctx, api, 'patch-mix');
      chapterText(
        ctx,
        api,
        'computed patch tokens before mixing',
        1500,
        300,
        28,
        themeColors.cyan,
        'center',
      );
      const positions = [
        [1340, 450],
        [1660, 450],
        [1340, 790],
        [1660, 790],
      ];
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++)
          withOpacity(ctx, api, mix, () => {
            const a = api.anchor(
                {
                  x: positions[i][0] - 105,
                  y: positions[i][1] - 105,
                  width: 210,
                  height: 210,
                },
                {
                  x: positions[j][0] - 105,
                  y: positions[j][1] - 105,
                  width: 210,
                  height: 210,
                },
                12,
              ),
              z = api.anchor(
                {
                  x: positions[j][0] - 105,
                  y: positions[j][1] - 105,
                  width: 210,
                  height: 210,
                },
                {
                  x: positions[i][0] - 105,
                  y: positions[i][1] - 105,
                  width: 210,
                  height: 210,
                },
                12,
              );
            api.line(ctx, a.x, a.y, z.x, z.y, themeColors.muted, 2);
          });
      positions.forEach(([x, y], i) => {
        api.rect(ctx, x - 105, y - 105, 210, 210, themeColors.panel, ownerColor(ctx, api, i), 3, 5);
        chapterText(ctx, api, 'token ' + i, x, y - 65, 27, ownerColor(ctx, api, i), 'center');
        f.tokens[i].forEach((v, j) =>
          chapterText(
            ctx,
            api,
            formatChapterValue(v, 5),
            x,
            y - 18 + j * 45,
            25,
            themeColors.ink,
            'center',
          ),
        );
      });
      chapterText(
        ctx,
        api,
        '+ positional information',
        1470,
        955,
        30,
        themeColors.yellow,
        'center',
      );
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'patch-projection',
  draw: drawPatchProjection,
  cues: [
    'patch-projection-b1',
    'patch-extract',
    'patch-projection-b2',
    'patch-weights',
    'patch-reshape',
    'patch-projection-b3',
    'patch-mix',
  ],
};
