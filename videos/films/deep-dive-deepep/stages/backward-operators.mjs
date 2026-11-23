import { chapterModel, completed } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterEquation,
  drawChapterGrid,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawBackwardOperators(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('backward-operators', state),
    currentBeat = m.b,
    progress2 = m.p;
  const vector = (label, values, x, y, color = themeColors.blue) => {
    drawChapterText(ctx, api, label, x + 310, y - 25, 29, color, 'center');
    drawChapterGrid(ctx, api, [values.map(fmt)], x, y, 620, 105, color, 33);
  };
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65)),
    step = (n) => Math.min(n, Math.floor(progress * (n + 1)));
  const fmt = (v) =>
      typeof v !== 'number' ? String(v) : Number.isInteger(v) ? String(v) : v.toFixed(2),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  drawChapterTarget(ctx, api, 'de-backward-operators-mechanism', () => {
    if (!currentBeat) {
      drawChapterText(
        ctx,
        api,
        'Fixed-route dispatch D · one source can occupy several rows',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      const labels = m.D.slice(0, step(8));
      drawChapterGrid(
        ctx,
        api,
        labels.length ? labels : [['…', '…', '…', '…']],
        280,
        350,
        690,
        570,
        themeColors.blue,
        30,
      );
      ['a', 'b', 'c', 'd'].forEach((v, i) =>
        drawChapterText(ctx, api, v, 365 + i * 172, 325, 29, themeColors.cyan, 'center'),
      );
      drawChapterArrow(ctx, api, 1030, 600, 1280, 600);
      drawChapterText(ctx, api, 'Transpose', 1450, 500, 37, themeColors.yellow, 'center');
      drawChapterText(
        ctx,
        api,
        'returned slot contributions',
        1450,
        620,
        28,
        themeColors.muted,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'sum into source a / b / c / d',
        1450,
        720,
        29,
        themeColors.cyan,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'Expert derivatives and gate multiplication remain separate',
        960,
        1000,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      drawChapterText(
        ctx,
        api,
        'Token a · raw outputs E0 / E3',
        460,
        405,
        29,
        themeColors.blue,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          [1, 0],
          [4, 0],
        ],
        150,
        430,
        620,
        150,
        themeColors.blue,
        33,
      );
      vector('Gates × expert gain', [0.7, 1.2], 1130, 430, themeColors.pink);
      drawChapterEquation(
        ctx,
        api,
        String.raw`g_{\rm combined}=0.7\times1+0.3\times4=1.9`,
        960,
        665,
        43,
      );
      drawChapterTarget(ctx, api, 'de-backward-input-result', () =>
        drawChapterText(
          ctx,
          api,
          'Upstream [2, 1] → input gradient ' +
            (done('de-backward-input') ? vec(m.inputGradient) : '[?, ?]'),
          960,
          815,
          34,
          done('de-backward-input') ? themeColors.green : themeColors.muted,
          'center',
        ),
      );
      drawChapterTarget(ctx, api, 'de-backward-gate-result', () =>
        drawChapterText(
          ctx,
          api,
          'Raw-output dot upstream → gate gradients ' +
            (done('de-backward-gates') ? vec(m.gateGradient) : '[?, ?]'),
          960,
          950,
          32,
          done('de-backward-gates') ? themeColors.cyan : themeColors.muted,
          'center',
        ),
      );
    }
  });
}
export default {
  id: 'backward-operators',
  draw: drawBackwardOperators,
  cues: [
    'de-backward-operators-b0',
    'de-backward-operators-b1',
    'de-backward-input',
    'de-backward-gates',
  ],
};
