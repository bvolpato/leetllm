import { TRACKS } from '../arithmetic.mjs';
import { drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawProbabilities(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['probabilities'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    if (snapshot.stage === 'opening') {
      withFocus(ctx, api, 'probabilities-object-next-token-probabilities-prefix-mia-7', () =>
        drawText(
          ctx,
          api,
          'Next-token probabilities · prefix: Mia',
          960,
          285,
          36,
          themeColors.ink,
          'center',
        ),
      );
      withFocus(ctx, api, 'probabilities-object-distribution-probabilities-8', () =>
        withFocus(ctx, api, 'probabilities-active-bars', () =>
          teaching.bars({
            x: 245,
            y: 385,
            width: 1430,
            height: 370,
            values: snapshot.choices.map(([, probability]) => probability),
            labels: snapshot.choices.map(([word]) => word),
            colors: [themeColors.cyan, themeColors.blue, themeColors.pink],
            max: 1,
            showValues: true,
            format: (value) => value.toFixed(3),
            fontSize: 31,
            progress: reveal(),
          }),
        ),
      );
      withFocus(
        ctx,
        api,
        'probabilities-equation-string-raw-sum-i-p-i-snapshot-total-tofixed-2-9',
        () =>
          drawEquation(
            ctx,
            api,
            String.raw`\sum_i p_i=${snapshot.total.toFixed(2)}`,
            960,
            890,
            47,
            themeColors.green,
            'center',
          ),
      );
    } else if (snapshot.stage === 'path-product') {
      drawText(
        ctx,
        api,
        'Conditional probability belongs to its prefix',
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      for (const [index, edge] of [snapshot.first, snapshot.second].entries()) {
        const x = index === 0 ? 205 : 1015;
        drawText(
          ctx,
          api,
          `Prefix · “${edge.prefix}”`,
          x + 350,
          365,
          30,
          index === 0 ? themeColors.cyan : themeColors.yellow,
          'center',
        );
        withFocus(ctx, api, 'probabilities-active-bars', () =>
          teaching.bars({
            x,
            y: 420,
            width: 700,
            height: 285,
            values: [edge.probability],
            labels: [edge.token],
            colors: [index === 0 ? themeColors.cyan : themeColors.yellow],
            max: 1,
            showValues: true,
            format: (value) => value.toFixed(3),
            fontSize: 30,
            progress: reveal(),
          }),
        );
      }
      withFocus(
        ctx,
        api,
        'probabilities-equation-string-raw-p-text-opened-the-p-text-opened-mid-tex-13',
        () =>
          drawEquation(
            ctx,
            api,
            String.raw`P(\text{opened the})=p(\text{opened}\mid\text{Mia})p(\text{the}\mid\text{Mia opened})`,
            960,
            830,
            34,
            themeColors.ink,
            'center',
          ),
      );
      drawText(
        ctx,
        api,
        `Path probability ${snapshot.pathProbability.toFixed(3)}`,
        960,
        920,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      drawText(
        ctx,
        api,
        `Next-token choices · prefix: “${snapshot.prefix}”`,
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      withFocus(ctx, api, 'probabilities-active-bars', () =>
        teaching.bars({
          x: 245,
          y: 385,
          width: 1430,
          height: 370,
          values: snapshot.choices.map(([, probability]) => probability),
          labels: snapshot.choices.map(([token]) =>
            token === 'EOS' ? 'EOS · finish' : `${token} · continue`,
          ),
          colors: [themeColors.green, themeColors.blue],
          max: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 31,
          progress: reveal(),
        }),
      );
      withFocus(
        ctx,
        api,
        'probabilities-equation-string-raw-p-mathrm-eos-mid-text-mia-opened-the-do-17',
        () =>
          drawEquation(
            ctx,
            api,
            String.raw`p(\mathrm{EOS}\mid\text{Mia opened the door})=0.85`,
            960,
            850,
            38,
            themeColors.green,
            'center',
          ),
      );
      drawText(
        ctx,
        api,
        'A period stays in the written text; EOS ends generation.',
        960,
        930,
        30,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'probabilities',
  draw: drawProbabilities,
  cues: [
    'probabilities-beat-1-focus-1',
    'probabilities-beat-1-focus-2',
    'probabilities-beat-2-focus-1',
    'probabilities-beat-2-focus-2',
    'probabilities-beat-3-focus-1',
    'probabilities-beat-3-focus-2',
  ],
};
