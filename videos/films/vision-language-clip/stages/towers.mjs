import { IMAGE_FEATURES, TEXT_FEATURES } from '../fixtures.mjs';
import { TRACKS } from '../observations.mjs';
import { towerEncodingState } from '../construction.mjs';
import { drawMatchCard, drawMatchEquation, drawMatchText, libraryPhoto } from '../defaults.mjs';
export function drawTowers(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS['towers'].sample({
    beat,
    beatP: progress2,
  }).snapshot;
  {
    const encoding = towerEncodingState(state);
    const encodingRoute = (from, to, color, amount, fromOpacity = 1, toOpacity = 1) => {
      if (fromOpacity < 0.1 || toOpacity < 0.1) return;
      teaching.transfer({
        source: {
          shape: from,
          opacity: fromOpacity,
        },
        target: {
          shape: to,
          opacity: toOpacity,
        },
        progress: amount,
        color,
        particle: {
          radius: 8,
          fill: themeColors.yellow,
        },
        gap: 12,
      });
    };
    drawMatchText(
      ctx,
      api,
      'Different inputs · compatible output space',
      960,
      280,
      36,
      themeColors.ink,
      'center',
    );
    api.focus.target('towers-image-path', () => {
      const image = api.focus.target('towers-photo', () => {
        const shape = drawMatchCard(ctx, api, '', 160, 330, 390, 220, themeColors.blue);
        libraryPhoto(ctx, api, 0, 177, 346, 247, 186);
        drawMatchText(ctx, api, '17', 482, 456, 41, themeColors.blue, 'center');
        return shape;
      });
      const imageEncoder = api.focus.target('towers-image-encoder', () =>
        drawMatchCard(
          ctx,
          api,
          'Image encoder',
          690,
          390,
          350,
          100,
          themeColors.cyan,
          32,
          encoding.image.encoder,
        ),
      );
      const imageVector = api.focus.target('towers-image-vector', () =>
        drawMatchCard(
          ctx,
          api,
          'Image A = [0.95, 0.05, 0.00]',
          1240,
          390,
          490,
          100,
          themeColors.green,
          26,
          encoding.image.vector,
        ),
      );
      encodingRoute(
        image,
        imageEncoder,
        themeColors.blue,
        encoding.image.amount,
        1,
        encoding.image.encoder,
      );
      encodingRoute(
        imageEncoder,
        imageVector,
        themeColors.green,
        encoding.image.amount,
        encoding.image.encoder,
        encoding.image.vector,
      );
    });
    api.focus.target('towers-text-path', () => {
      const textInput = api.focus.target('towers-caption', () =>
        drawMatchCard(
          ctx,
          api,
          'Blocked vent on rack door',
          160,
          675,
          480,
          105,
          themeColors.yellow,
          26,
        ),
      );
      const textEncoder = api.focus.target('towers-text-encoder', () =>
        drawMatchCard(
          ctx,
          api,
          'Text encoder',
          760,
          675,
          350,
          105,
          themeColors.cyan,
          32,
          encoding.text.encoder,
        ),
      );
      const textVector = api.focus.target('towers-text-vector', () =>
        drawMatchCard(
          ctx,
          api,
          'Text A = [0.91, 0.08, 0.01]',
          1240,
          675,
          490,
          105,
          themeColors.green,
          26,
          encoding.text.vector,
        ),
      );
      encodingRoute(
        textInput,
        textEncoder,
        themeColors.yellow,
        encoding.text.amount,
        1,
        encoding.text.encoder,
      );
      encodingRoute(
        textEncoder,
        textVector,
        themeColors.green,
        encoding.text.amount,
        encoding.text.encoder,
        encoding.text.vector,
      );
    });
    api.focus.target('towers-pair-b', () =>
      drawMatchCard(
        ctx,
        api,
        'Pair B · tape across the tag',
        180,
        945,
        650,
        55,
        themeColors.blue,
        24,
      ),
    );
    drawMatchCard(
      ctx,
      api,
      'Pair C · clear rack door',
      1090,
      945,
      650,
      55,
      themeColors.pink,
      24,
    );
    drawMatchEquation(
      ctx,
      api,
      String.raw`I_a,T_a\in\mathbb{R}^{d}`,
      960,
      1040,
      42,
      themeColors.yellow,
    );
    for (const [values, y, progress, color] of [
      [IMAGE_FEATURES[0], 560, encoding.image.vector, themeColors.blue],
      [TEXT_FEATURES[0], 840, encoding.text.vector, themeColors.yellow],
    ])
      components.fade(progress, () =>
        values.forEach((v, i) => {
          api.rect(ctx, 1300 + i * 145, y - v * 55, 95, v * 55, color);
          drawMatchText(ctx, api, String(v), 1347 + i * 145, y + 40, 23, color, 'center');
        }),
      );
    drawMatchText(
      ctx,
      api,
      'Supplied coordinates, kept with pair A',
      1485,
      915,
      23,
      themeColors.muted,
      'center',
    );
    drawMatchText(
      ctx,
      api,
      'Separate towers keep each modality’s encoder specialized.',
      660,
      905,
      25,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'towers',
  draw: drawTowers,
  cues: [
    'towers-beat-1-focus-1',
    'towers-text-encoding',
    'towers-common-space',
    'towers-beat-2-focus-1',
    'towers-beat-2-focus-2',
    'towers-beat-3-focus-1',
  ],
};
