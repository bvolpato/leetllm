import { splitConstruction } from '../arithmetic.mjs';
import { boostCue } from '../construction.mjs';
import { binX, drawBins } from '../bin-strip.mjs';
import { cellText, chapterText, formatNumber, heading, line } from '../defaults.mjs';

const model = splitConstruction();
const short = (value) => formatNumber(value, 3);
const squaredTerm = (g, h) => '(' + short(g) + ')² / ' + short(h + model.lambda);

function childHistogram(ctx, api, progress) {
  const { C } = api;
  heading(ctx, api, 'Each bin holds a pair  (G, H)');
  const names = ['Parent', 'Left child', 'Right child'];
  const count = Math.min(4, Math.floor(progress * 4));
  ['Feature bin', ...names].forEach((name, j) =>
    chapterText(ctx, api, name, 140, 390 + j * 140, 33, C.muted),
  );
  for (const [i, row] of model.rows.entries()) {
    const x = binX(i);
    cellText(ctx, api, row.bin, x, 390, C.ink, 37);
    const left = i < model.best.cut ? [row.g, row.h] : [0, 0];
    const parent = [row.g, row.h];
    const right = parent.map((n, j) => n - left[j]);
    [parent, left, right].forEach((pair, j) => {
      if (j === 2 && i >= count) return;
      cellText(
        ctx,
        api,
        '(' + pair.join(', ') + ')',
        x,
        530 + 140 * j,
        j === 2 ? C.yellow : C.ink,
        34,
      );
    });
  }
  line(ctx, api, 145, 735, 1700, 735, C.muted, 2);
  cellText(ctx, api, 'Right child = parent − left child, in each bin', 960, 967, C.ink, 36);
}

export function drawHistogramScan(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const cue = (id, index) => boostCue(state, id, index);
  api.focus.target('histogram-scan-model', () => {
    if (beat === 3) {
      childHistogram(ctx, api, cue('histogram-subtract', 3));
      return;
    }
    heading(
      ctx,
      api,
      'Starting probability  0.50      ·      λ = 1      ·      extra leaf cost  γ = 0',
    );
    const moveOne = cue('histogram-cut-one', 1);
    const moveTwo = cue('histogram-cut-two', 2);
    const moveThree = cue('histogram-cut-three', 2);
    const winner = cue('gbt-histogram-winner', 2) === 1;
    const cut = winner ? model.best.cut : moveOne + moveTwo + moveThree;
    drawBins(ctx, api, model, {
      showStats: cue('histogram-deposit', 0) > 0,
      cut: beat ? cut : null,
    });
    if (!beat) {
      cellText(ctx, api, 'g = p − label', 610, 730, C.cyan, 42);
      cellText(ctx, api, 'h = p × (1 − p)', 1280, 730, C.cyan, 42);
      if (cue('hist-parent-sum', 0) === 1)
        cellText(
          ctx,
          api,
          'Parent totals     G = ' + model.G + '      H = ' + model.H,
          960,
          900,
          C.ink,
          45,
        );
      return;
    }
    const leftRows = model.rows.filter((_, i) => binX(i) < binX(cut - 0.5));
    const gl = leftRows.reduce((sum, row) => sum + row.g, 0);
    const hl = leftRows.reduce((sum, row) => sum + row.h, 0);
    const gr = model.G - gl;
    const hr = model.H - hl;
    cellText(ctx, api, 'Left    G = ' + gl + '    H = ' + hl, 565, 682, C.ink, 36);
    cellText(ctx, api, 'Right    G = ' + gr + '    H = ' + hr, 1330, 682, C.ink, 36);
    cellText(
      ctx,
      api,
      'Gain = ½ × [ ' + squaredTerm(gl, hl) + '  +  ' + squaredTerm(gr, hr) + '  −  0 ]',
      960,
      769,
      C.ink,
      36,
    );
    const gainCues = [
      ['histogram-gain-one', 1],
      ['histogram-gain-two', 2],
      ['histogram-gain-three', 2],
    ];
    model.cuts.forEach((candidate, i) => {
      const shown = cue(...gainCues[i]) === 1;
      const x = 420 + i * 540;
      const color = winner && candidate === model.best ? C.yellow : C.cyan;
      cellText(
        ctx,
        api,
        'Cut ' +
          candidate.cut +
          (shown ? '   gain ' + formatNumber(candidate.gain, 6) : '   ·   ?'),
        x,
        875,
        color,
        30,
      );
      const weightsCue = ['gbt-histogram-one-weights', 'gbt-histogram-two-weights'][i];
      if (weightsCue && cue(weightsCue, i + 1) === 1)
        cellText(
          ctx,
          api,
          'leaf weights ' +
            formatNumber(candidate.leftWeight, 4) +
            ', ' +
            formatNumber(candidate.rightWeight, 4),
          x,
          942,
          C.cyan,
          27,
        );
    });
    if (winner)
      cellText(
        ctx,
        api,
        'The center cut separates the misses from the on-time jobs.',
        960,
        1021,
        C.yellow,
        28,
      );
  });
}
export default {
  id: 'histogram-scan',
  draw: drawHistogramScan,
  cues: [
    'histogram-scan-step-1',
    'histogram-deposit',
    'hist-parent-sum',
    'histogram-cut-one',
    'histogram-gain-one',
    'gbt-histogram-one-weights',
    'histogram-cut-two',
    'histogram-gain-two',
    'gbt-histogram-two-weights',
    'histogram-cut-three',
    'histogram-gain-three',
    'gbt-histogram-winner',
    'histogram-scan-step-4',
    'histogram-subtract',
  ],
};
