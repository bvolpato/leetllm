import { clamp01, format } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawReliabilityBuckets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id),
    done = (id) => cueProgress(id) >= 1;
  api.focus.target('reliability', () => {
    const buckets = [
      {
        title: '[0.0,0.4)',
        scores: [0.23, 0.18],
        gold: [0, 0],
        cue: 'reliability-low',
        rateCue: 'reliability-count',
      },
      {
        title: '[0.4,0.7)',
        scores: [0.42, 0.64],
        gold: [1, 1],
        cue: 'reliability-middle',
        rateCue: 'reliability-middle-rate',
      },
      {
        title: '[0.7,1.0]',
        scores: [0.89, 0.71],
        gold: [1, 0],
        cue: 'reliability-high',
        rateCue: 'reliability-high-rate',
      },
    ];
    buckets.forEach((r, i) => {
      const x = 190 + i * 580,
        mean = r.scores.reduce((a, v) => a + v, 0) / 2,
        rate = r.gold.reduce((a, v) => a + v, 0) / 2;
      drawExpandedClassifierRect(ctx, api, x, 350, 500, 440, themeColors.muted);
      drawExpandedClassifierText(ctx, api, r.title, x + 250, 405, 31, themeColors.cyan, 'center');
      r.scores.forEach((p, j) => {
        drawExpandedClassifierText(
          ctx,
          api,
          format(p) + '  gold ' + r.gold[j],
          x + 250,
          480 + j * 75,
          30,
          r.gold[j] ? themeColors.pink : themeColors.blue,
          'center',
        );
      });
      if (done(r.cue)) {
        drawExpandedClassifierText(
          ctx,
          api,
          'Mean score ' + format(mean),
          x + 250,
          670,
          30,
          themeColors.yellow,
          'center',
        );
      }
      if (done(r.rateCue)) {
        drawExpandedClassifierText(
          ctx,
          api,
          'Observed ' + r.gold.reduce((a, v) => a + v, 0) + '/2 = ' + format(rate),
          x + 250,
          735,
          30,
          themeColors.green,
          'center',
        );
      }
    });
    if (currentBeat === 2 && cueProgress('reliability-formula') > 0)
      drawExpandedClassifierText(
        ctx,
        api,
        'Δlogit = ln[p/(1−p)]  →  Δlogit/T  →  sigmoid',
        960,
        905,
        34,
        themeColors.yellow,
        'center',
      );
    drawExpandedClassifierNote(
      ctx,
      api,
      '2 rows per bin · reused selection values · collect fresh held-out labels',
    );
  });
}
export default {
  id: 'reliability-buckets',
  draw: drawReliabilityBuckets,
  cues: [
    'reliability-low',
    'reliability-middle',
    'reliability-count',
    'reliability-middle-rate',
    'reliability-high-rate',
    'reliability-high',
    'reliability-separate',
    'reliability-formula',
  ],
};
