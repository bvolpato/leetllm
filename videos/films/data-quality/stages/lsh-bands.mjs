import { bandCandidates, idealCandidateProbability } from '../model.mjs';
import { drawConstructionNote, drawConstructionP, drawConstructionText } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
const left = [1, 4, 2, 8];
const adjacent = [1, 4, 3, 7];
const scattered = [1, 9, 2, 7];

function drawPositions(ctx, api) {
  const { C, text, line, rect, focus } = api;
  const p = focus.progress;
  const second = p('band-scatter') > 0;
  const right = second ? scattered : adjacent;
  const trial = bandCandidates(left, right, 2);
  const showMatches = p('band-count') > 0;
  const judged = second ? p('band-scatter-result') > 0 : p('band-first-result') > 0;
  const xs = [455, 740, 1125, 1410];
  text(
    ctx,
    second ? 'Document B has a different signature' : 'One signature per document',
    150,
    292,
    36,
    C.ink,
  );
  ['Band 1', 'Band 2'].forEach((label, i) => {
    const x = xs[i * 2] - 78;
    const width = 441;
    const col = judged ? (trial.bands[i] ? C.green : C.muted) : C.blue;
    rect(ctx, x, 367, width, 362, C.panel, col, 6);
    text(ctx, label, x + width / 2, 430, 35, col, 'center');
    if (judged)
      text(ctx, trial.bands[i] ? 'complete' : 'incomplete', x + width / 2, 703, 30, col, 'center');
  });
  [left, right].forEach((values, i) => {
    const y = 523 + i * 117;
    text(ctx, i ? 'Document B' : 'Document A', 145, y, 32, i ? C.cyan : C.blue);
    values.forEach((v, j) => {
      text(ctx, String(v), xs[j], y, 56, C.ink, 'center', 'mono');
      if (i && showMatches) {
        const match = trial.matched[j];
        text(ctx, match ? '=' : '≠', xs[j], y - 70, 30, match ? C.yellow : C.muted, 'center');
      }
    });
  });
  if (showMatches)
    text(
      ctx,
      trial.matched.filter(Boolean).length + ' / 4 positions match',
      665,
      852,
      42,
      C.ink,
      'center',
    );
  if (judged || second) {
    line(ctx, 970, 791, 970, 933, C.muted, 2);
    text(
      ctx,
      judged
        ? trial.candidate
          ? 'Queue this pair for review'
          : 'No complete band'
        : 'Queue this pair?',
      1385,
      852,
      43,
      judged && trial.candidate ? C.green : C.yellow,
      'center',
    );
  }
}

function drawOdds(ctx, api) {
  const { C, text, rect, focus } = api;
  const p = focus.progress;
  const first = p('odds-first') > 0;
  const second = p('odds-second') > 0;
  const total = p('band-probability') > 0;
  const outcomes = ['× ×', '= ×', '× =', '= ='];
  text(ctx, 'Band 1', 646, 281, 32, C.blue, 'center');
  text(ctx, 'Band 2', 212, 349, 32, C.cyan, 'center');
  for (let i = 0; i < 4; i++) {
    text(ctx, outcomes[i], 418 + 150 * i, 356, 31, C.blue, 'center', 'mono');
    text(ctx, outcomes[i], 252, 470 + 130 * i, 31, C.cyan, 'center', 'mono');
    for (let j = 0; j < 4; j++) {
      const hit = (first && j === 3) || (second && i === 3);
      rect(
        ctx,
        350 + j * 150,
        397 + i * 130,
        136,
        115,
        hit ? C.green : C.panel,
        hit ? C.green : C.muted,
        5,
      );
    }
  }
  text(ctx, 'True similarity   s = ½', 1060, 348, 44, C.ink);
  text(ctx, 'Independent rows and bands', 1060, 412, 32, C.muted);
  if (first) text(ctx, 'One complete band   ½ × ½ = ¼', 1060, 538, 37, C.ink);
  if (second) text(ctx, 'Both miss   ¾ × ¾ = 9/16', 1060, 636, 37, C.ink);
  if (total) {
    text(ctx, '7 / 16  =  0.4375', 1060, 772, 57, C.green);
    text(ctx, 'P(candidate) = 1 − (1 − sʳ)ᵇ', 1060, 868, 36, C.ink);
  }
  text(
    ctx,
    'Each square is one equally likely outcome for four rows.',
    960,
    994,
    34,
    C.muted,
    'center',
  );
}

export function drawLshBands(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  api.focus.target('lsh-bands-construction', () => {
    if (currentBeat < 2 && !api.focus.progress('odds-grid')) {
      drawPositions(ctx, api);
    } else if (currentBeat === 1) {
      drawOdds(ctx, api);
    } else {
      const v = drawConstructionP(ctx, api, 'lsh-bands-voice-3');
      drawConstructionText(
        ctx,
        api,
        'Four positions at true similarity 0.5',
        160,
        300,
        34,
        themeColors.cyan,
      );
      [
        [4, 1],
        [2, 2],
        [1, 4],
      ].forEach(([bands, rows], i) => {
        const value = idealCandidateProbability(0.5, bands, rows);
        const yy = 440 + i * 155;
        drawConstructionText(ctx, api, `${bands} × ${rows}`, 180, yy, 32, themeColors.muted);
        ctx.save();
        try {
          ctx.globalAlpha *= Math.min(1, v * 3);
          api.rect(
            ctx,
            350,
            yy - 30,
            600 * value,
            58,
            [themeColors.cyan, themeColors.blue, themeColors.pink][i],
            undefined,
            0,
          );
        } finally {
          ctx.restore();
        }
        drawConstructionText(
          ctx,
          api,
          value.toFixed(4),
          350 + 600 * value + 20,
          yy + 10,
          29,
          [themeColors.cyan, themeColors.blue, themeColors.pink][i],
        );
      });
      drawConstructionText(
        ctx,
        api,
        'FineWeb 2024   ·   14 bands of 8',
        1100,
        300,
        34,
        themeColors.cyan,
      );
      const plot = api.teaching.axes({
        x: 1100,
        y: 410,
        width: 540,
        height: 320,
        xDomain: [0, 1],
        yDomain: [0, 1],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 1],
        xLabel: 'Jaccard s',
        yLabel: 'candidate probability',
        fontSize: 25,
      });
      const fp = drawConstructionP(ctx, api, 'band-fineweb');
      if (fp > 0)
        api.teaching.curve({
          plot,
          points: sampleFunction((s) => idealCandidateProbability(s, 14, 8), 0, 1, 100),
          color: themeColors.green,
          width: 4,
          progress: fp,
        });
      if (fp === 1) {
        const at = plot.point(0.75, idealCandidateProbability(0.75, 14, 8));
        api.circle(ctx, at.x, at.y, 9, themeColors.yellow);
        drawConstructionText(
          ctx,
          api,
          'At s = 0.75   ·   77.2% found',
          1380,
          875,
          30,
          themeColors.green,
          'center',
        );
        drawConstructionText(ctx, api, '22.8% missed', 1380, 930, 30, themeColors.pink, 'center');
      }
      drawConstructionNote(
        ctx,
        api,
        'Each candidate adds a comparison. Large buckets can still generate many pairs.',
      );
    }
  });
}
export default {
  id: 'lsh-bands',
  draw: drawLshBands,
  cues: [
    'band-count',
    'band-first-result',
    'band-scatter',
    'band-scatter-result',
    'odds-grid',
    'odds-first',
    'odds-second',
    'band-probability',
    'lsh-bands-b3',
    'lsh-bands-voice-3',
    'band-fineweb',
  ],
};
