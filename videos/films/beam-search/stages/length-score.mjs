import { TRACKS } from '../arithmetic.mjs';
import { drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawLengthScore(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const track = TRACKS['length-score'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const shown = snapshot.candidates.slice(0, 3);
    const labels = shown.map((candidate) => `Mia ${candidate.text}`);
    const jointValues = shown.map((candidate) => candidate.probability);
    const meanValues = shown.map((candidate) => candidate.meanProbability);
    drawText(
      ctx,
      api,
      snapshot.mode === 'joint'
        ? 'Raw joint probability rewards the strongest full path'
        : snapshot.mode === 'mean-log'
          ? 'Mean log score has the same order as this geometric mean'
          : 'The same paths change order under the length rule',
      960,
      285,
      33,
      themeColors.ink,
      'center',
    );
    if (snapshot.mode === 'joint') {
      withFocus(ctx, api, 'length-score-object-joint-probability-38', () =>
        drawText(ctx, api, 'Joint probability', 960, 360, 31, themeColors.cyan, 'center'),
      );
      withFocus(ctx, api, 'length-score-object-distribution-length-score-39', () =>
        withFocus(ctx, api, 'length-scored-paths', () =>
          teaching.bars({
            x: 260,
            y: 400,
            width: 1400,
            height: 360,
            values: jointValues,
            labels,
            colors: shown.map((candidate) =>
              candidate.text === snapshot.winner ? themeColors.green : themeColors.blue,
            ),
            max: 0.22,
            progress: 1,
            showValues: true,
            format: (value) => value.toFixed(3),
            fontSize: 25,
            gap: 78,
          }),
        ),
      );
      drawText(
        ctx,
        api,
        `Joint winner · Mia ${snapshot.winner}`,
        960,
        830,
        32,
        themeColors.green,
        'center',
      );
      drawEquation(
        ctx,
        api,
        String.raw`P(Y\mid x)=\prod_{j=1}^{|Y|}p(y_j\mid y_{<j},x)`,
        960,
        930,
        39,
        themeColors.cyan,
        'center',
      );
    } else if (snapshot.mode === 'mean-log') {
      drawText(ctx, api, 'Per-token geometric mean', 960, 360, 31, themeColors.yellow, 'center');
      withFocus(ctx, api, 'length-scored-paths', () =>
        teaching.bars({
          x: 260,
          y: 400,
          width: 1400,
          height: 360,
          values: meanValues,
          labels,
          colors: shown.map((candidate) =>
            candidate.text === snapshot.winner ? themeColors.green : themeColors.blue,
          ),
          max: 0.7,
          progress: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 25,
          gap: 78,
        }),
      );
      drawText(
        ctx,
        api,
        `Mean-log winner · Mia ${snapshot.winner}`,
        960,
        830,
        32,
        themeColors.green,
        'center',
      );
      drawEquation(
        ctx,
        api,
        String.raw`\exp(S_{\mathrm{mean}}(Y))=P(Y\mid x)^{1/|Y|}`,
        960,
        930,
        42,
        themeColors.yellow,
        'center',
      );
    } else {
      drawText(ctx, api, 'Joint probability', 500, 360, 29, themeColors.cyan, 'center');
      drawText(ctx, api, 'Per-token geometric mean', 1395, 360, 29, themeColors.yellow, 'center');
      withFocus(ctx, api, 'length-scored-paths', () =>
        teaching.bars({
          x: 110,
          y: 395,
          width: 790,
          height: 340,
          values: jointValues,
          labels,
          colors: shown.map((candidate) =>
            candidate.text === snapshot.raw ? themeColors.green : themeColors.blue,
          ),
          max: 0.22,
          progress: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 21,
          gap: 68,
        }),
      );
      withFocus(ctx, api, 'length-scored-paths', () =>
        teaching.bars({
          x: 1020,
          y: 395,
          width: 790,
          height: 340,
          values: meanValues,
          labels,
          colors: shown.map((candidate) =>
            candidate.text === snapshot.normalized ? themeColors.green : themeColors.yellow,
          ),
          max: 0.7,
          progress: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 21,
          gap: 68,
        }),
      );
      drawText(ctx, api, `Raw · Mia ${snapshot.raw}`, 500, 805, 28, themeColors.green, 'center');
      drawText(
        ctx,
        api,
        `Mean-log · Mia ${snapshot.normalized}`,
        1395,
        805,
        28,
        themeColors.green,
        'center',
      );
      drawEquation(
        ctx,
        api,
        String.raw`S_{\mathrm{mean}}(Y)=\frac{\log P(Y\mid x)}{|Y|}`,
        960,
        910,
        39,
        themeColors.cyan,
        'center',
      );
    }
  }
}
export default {
  id: 'length-score',
  draw: drawLengthScore,
  cues: [
    'length-score-beat-1-focus-1',
    'length-score-beat-1-focus-2',
    'length-score-beat-2-focus-1',
    'length-score-beat-3-focus-1',
  ],
};
