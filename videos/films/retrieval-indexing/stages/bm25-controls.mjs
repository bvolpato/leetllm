import {
  drawExtensionBar,
  drawExtensionEquation,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawBm25Controls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('bm25-controls-construction', () => {
    if (currentBeat === 0) {
      drawExtensionText(
        ctx,
        api,
        'Rotation guide  ·  API × 1   ·   key × 3',
        150,
        270,
        33,
        themeColors.cyan,
      );
      if (resultComplete('bm25-tf-formula'))
        drawExtensionEquation(
          ctx,
          api,
          String.raw`\mathrm{contribution}=\mathrm{IDF}\times\frac{f(k_1+1)}{f+k_1L}`,
          960,
          480,
          58,
        );
      if (resultComplete('bm25-length-formula'))
        drawExtensionEquation(
          ctx,
          api,
          String.raw`L=(1-b)+b\frac{|d|}{\mathrm{avgdl}}`,
          960,
          700,
          48,
          themeColors.yellow,
        );
      if (resultComplete('bm25-idf-formula'))
        drawExtensionEquation(
          ctx,
          api,
          String.raw`\mathrm{IDF}=\ln\left(1+\frac{N-df+0.5}{df+0.5}\right)`,
          960,
          900,
          48,
          themeColors.green,
        );
      drawExtensionNote(ctx, api, 'Only matching terms contribute; absent terms stay at zero.');
    } else if (currentBeat === 1) {
      drawExtensionText(
        ctx,
        api,
        'Credential corpus · k₁=1.2 · b=0.75 · |d1|=11 · avgdl=8',
        150,
        270,
        32,
        themeColors.cyan,
      );
      const k1 = 1.2,
        lengthFactor = 1 - 0.75 + (0.75 * 11) / 8;
      const term = (f, L) => (Math.log(2) * f * (k1 + 1)) / (f + k1 * L);
      const a = term(1, lengthFactor),
        p1 = progress('credential-api'),
        k = term(3, lengthFactor),
        p2 = progress('credential-key');
      drawExtensionText(ctx, api, 'd1 · rotation guide', 170, 380, 32, themeColors.green);
      api.rect(ctx, 170, 425, ((850 * a) / 2) * p1, 80, themeColors.cyan, undefined, 0);
      api.rect(
        ctx,
        170 + (850 * a) / 2,
        425,
        ((850 * k) / 2) * p2,
        80,
        themeColors.green,
        undefined,
        0,
      );
      if (resultComplete('credential-api'))
        drawExtensionText(ctx, api, 'api ×1: ' + a.toFixed(3), 170, 560, 29, themeColors.cyan);
      if (resultComplete('credential-key'))
        drawExtensionText(ctx, api, 'key ×3: ' + k.toFixed(3), 590, 560, 29, themeColors.green);
      if (resultComplete('credential-total')) {
        drawExtensionText(ctx, api, 'sum ' + (a + k).toFixed(3), 1200, 480, 36, themeColors.green);
        drawExtensionText(ctx, api, 'd4 · quota page', 170, 680, 31, themeColors.blue);
        drawExtensionBar(ctx, api, 170, 720, 850, 60, 2 * term(1, 1), 2, themeColors.blue);
        drawExtensionText(ctx, api, (2 * term(1, 1)).toFixed(3), 1200, 765, 36, themeColors.blue);
      }
      if (resultComplete('frequency-weights')) {
        drawExtensionText(
          ctx,
          api,
          'Average length · IDF = 1 · frequency → term weight',
          960,
          861,
          28,
          themeColors.muted,
          'center',
        );
        [1, 2, 4, 20].forEach((f, i) =>
          drawExtensionText(
            ctx,
            api,
            f + ' → ' + ((f * 2.2) / (f + 1.2)).toFixed(3),
            260 + i * 400,
            932,
            30,
            themeColors.yellow,
            'center',
          ),
        );
      }
      if (cueVisible('frequency-limit'))
        drawExtensionText(
          ctx,
          api,
          'Limit   k₁ + 1 = 2.2',
          960,
          1010,
          36,
          themeColors.yellow,
          'center',
        );
    } else {
      const plot = api.teaching.axes({
        x: 190,
        y: 390,
        width: 850,
        height: 440,
        xDomain: [0, 20],
        yDomain: [0, 2.5],
        xTicks: [0, 1, 4, 10, 20],
        yTicks: [0, 1, 2.2],
        xLabel: 'term frequency f',
        yLabel: 'reference term weight',
        fontSize: 24,
      });
      const k = cueVisible('k1-zero') ? 1.2 * (1 - progress('k1-zero')) : 1.2;
      api.teaching.curve({
        plot,
        points: Array.from(
          {
            length: 101,
          },
          (_, i) => ({
            x: i / 5,
            y: i ? ((i / 5) * (k + 1)) / (i / 5 + k) : 0,
          }),
        ),
        color: themeColors.cyan,
        width: 4,
      });
      drawExtensionText(ctx, api, 'k₁ = ' + k.toFixed(2), 1180, 430, 34, themeColors.cyan);
      if (resultComplete('k1-zero'))
        drawExtensionText(ctx, api, 'present f>0 → 1', 1180, 515, 30, themeColors.green);
      if (resultComplete('length-knobs')) {
        drawExtensionText(ctx, api, 'b=0 → L=1', 1180, 650, 31, themeColors.yellow);
        drawExtensionText(ctx, api, 'b=1 → L=|d|/avgdl', 1180, 720, 31, themeColors.yellow);
      }
      if (cueVisible('lucene-scale')) {
        drawExtensionText(ctx, api, 'Pinned Lucene 10.5.1', 190, 920, 31, themeColors.blue);
        drawExtensionText(
          ctx,
          api,
          'drops the shared (k₁+1) scale; encoded length norms',
          190,
          975,
          28,
          themeColors.muted,
        );
      }
      drawExtensionNote(
        ctx,
        api,
        'The reference scale and an engine score are different reproducibility contracts.',
      );
    }
  });
  return true;
}
export default {
  id: 'bm25-controls',
  draw: drawBm25Controls,
  cues: [
    'bm25-tf-formula',
    'bm25-length-formula',
    'bm25-idf-formula',
    'credential-api',
    'credential-key',
    'credential-total',
    'frequency-weights',
    'frequency-limit',
    'k1-zero',
    'length-knobs',
    'lucene-scale',
  ],
};
