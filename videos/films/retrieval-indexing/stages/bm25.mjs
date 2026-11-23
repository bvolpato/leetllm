import { TERMS } from '../analysis.mjs';
import { bm25, idf, termFrequencyScore } from '../scoring.mjs';
import { TRACKS } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawVisualFocus,
} from '../defaults.mjs';
export function drawBm25(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const revealProgress = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const snapshot = TRACKS['bm25'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  drawOriginalText(ctx, api, 'Same query · make + soup', 150, 225, 25, themeColors.cyan);
  {
    drawOriginalText(
      ctx,
      api,
      `BM25 · ${snapshot.docId} · term ${snapshot.term}`,
      960,
      282,
      36,
      themeColors.ink,
      'center',
    );
    const statCards = [
      ['document frequency', snapshot.df, 120, themeColors.blue],
      [
        'term count in d1',
        snapshot.counts[snapshot.term === 'total' ? TERMS[1] : snapshot.term],
        540,
        themeColors.cyan,
      ],
      ['document length', snapshot.length, 960, themeColors.yellow],
      ['corpus average', snapshot.averageLength.toFixed(1), 1380, themeColors.green],
    ];
    drawVisualFocus(ctx, api, 'bm25-simulation-24', () =>
      statCards.forEach(([label, value, x, color]) => {
        drawOriginalCard(ctx, api, 'bm25', `${label}: ${value}`, x, 390, 360, 90, color, 1, 26);
      }),
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\mathrm{IDF}(t)=\ln\!\left(1+\frac{N-\mathrm{df}+0.5}{\mathrm{df}+0.5}\right)`,
      960,
      535,
      30,
      themeColors.cyan,
    );
    drawVisualFocus(
      ctx,
      api,
      'bm25-equation-string-raw-mathrm-term-mathrm-idf-frac-f-1-2-1-f-1-27',
      () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\mathrm{term}=\mathrm{IDF}\,\frac{f(1.2+1)}{f+1.2\left(0.25+0.75\,\ell/\bar\ell\right)}`,
          960,
          605,
          30,
          themeColors.yellow,
        ),
    );
    const values = [snapshot.contributions[TERMS[0]], snapshot.contributions[TERMS[1]]];
    const visibleValues =
      snapshot.term === TERMS[0] ? [values[0]] : snapshot.term === TERMS[1] ? [values[1]] : values;
    const visibleLabels =
      snapshot.term === TERMS[0]
        ? [`${TERMS[0]} · ${values[0].toFixed(3)}`]
        : snapshot.term === TERMS[1]
          ? [`${TERMS[1]} · ${values[1].toFixed(3)}`]
          : [`${TERMS[0]} · ${values[0].toFixed(3)}`, `${TERMS[1]} · ${values[1].toFixed(3)}`];
    const saturation =
      beat > 2 ||
      (beat === 2 &&
        state.cues?.['bm25-saturation']?.phase &&
        state.cues['bm25-saturation'].phase !== 'before');
    if (beat === 1) {
      const show = (id, fallback, paint) =>
        api.focus ? api.focus.reveal(id, paint) : fallback ? paint() : undefined;
      show('bm25-numeric-idf', progress > 0.2, () =>
        drawVisualFocus(ctx, api, 'bm25-numeric-idf', () =>
          drawOriginalEquation(
            ctx,
            api,
            '\\ln(1+\\frac{4-2+0.5}{2+0.5})=' + idf('soup').toFixed(3),
            960,
            720,
            46,
            themeColors.cyan,
          ),
        ),
      );
      show('bm25-length-factor', progress > 0.7, () =>
        drawVisualFocus(ctx, api, 'bm25-length-factor', () =>
          drawOriginalEquation(
            ctx,
            api,
            '0.25+0.75\\frac{11}{8.25}=' + snapshot.lengthFactor.toFixed(2),
            960,
            855,
            46,
            themeColors.yellow,
          ),
        ),
      );
    } else if (saturation) {
      const plot = teaching.axes({
        x: 250,
        y: 695,
        width: 900,
        height: 235,
        xDomain: [0, 6],
        yDomain: [0, 1.6],
        xTicks: [0, 1, 2, 3, 4, 5, 6],
        yTicks: [0, 0.8, 1.6],
        xLabel: 'soup occurrences · fixed length 10',
        yLabel: 'term score',
        fontSize: 23,
      });
      drawVisualFocus(ctx, api, 'bm25-tf-saturation', () => {
        teaching.curve({
          plot,
          points: Array.from(
            {
              length: 121,
            },
            (_, i) => ({
              x: i / 20,
              y: termFrequencyScore(i / 20),
            }),
          ),
          color: themeColors.cyan,
          width: 5,
          progress: 1,
        });
        const q = plot.point(2, termFrequencyScore(2));
        api.circle(ctx, q.x, q.y, 10, themeColors.yellow);
        drawOriginalCard(
          ctx,
          api,
          'bm25',
          'd4 · soup ×2 · ' + termFrequencyScore(2).toFixed(3),
          1280,
          730,
          520,
          80,
          themeColors.yellow,
          1,
          28,
        );
        drawOriginalCard(
          ctx,
          api,
          'bm25',
          'd1 · soup ×1 · ' + bm25('d1').contributions.soup.toFixed(3),
          1280,
          830,
          520,
          80,
          themeColors.cyan,
          1,
          28,
        );
        drawOriginalEquation(
          ctx,
          api,
          'S(2)/S(1)=' + (termFrequencyScore(2) / termFrequencyScore(1)).toFixed(2) + '<2',
          1500,
          990,
          33,
          themeColors.ink,
        );
      });
    } else {
      drawVisualFocus(ctx, api, 'bm25-term-contributions', () => {
        ctx.save();
        try {
          ctx.globalAlpha *= beat === 2 ? 1 : revealProgress(0.08, 0.9);
          return teaching.bars({
            x: 370,
            y: 670,
            width: 1220,
            height: 185,
            values: visibleValues,
            labels: visibleLabels,
            colors:
              visibleValues.length === 1
                ? [themeColors.cyan]
                : [themeColors.cyan, themeColors.yellow],
            max: 1.2,
            progress: 1,
            showValues: true,
            format: (value) => value.toFixed(3),
            fontSize: 28,
            gap: visibleValues.length === 1 ? 160 : 120,
          });
        } finally {
          ctx.restore();
        }
      });
      const shownTotal = visibleValues.reduce((sum, value) => sum + value, 0);
      drawOriginalText(
        ctx,
        api,
        (snapshot.term === 'total' ? 'd1 total score' : 'current term contribution') +
          ' ' +
          shownTotal.toFixed(3),
        960,
        945,
        30,
        themeColors.green,
        'center',
      );
    }
  }
}
export default {
  id: 'bm25',
  draw: drawBm25,
  cues: [
    'bm25-beat-1-focus-1',
    'bm25-beat-1-focus-2',
    'bm25-beat-2-focus-1',
    'bm25-numeric-idf',
    'bm25-length-factor',
    'bm25-beat-3-focus-1',
    'bm25-saturation',
  ],
};
