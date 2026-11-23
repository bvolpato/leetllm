import { cue } from '../case-file.mjs';
import { retrievalCandidates } from '../model.mjs';

const scoreRows = retrievalCandidates();
const frequency = 1_000_000;
const frequencyWeight = 0.2;
const frequencyScore = frequencyWeight * Math.log1p(frequency);

export function drawRetrievalRanking(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 5) {
    const x = 158,
      unit = 480,
      y = 640;
    const grow = cue(api, 'rank-frequency');
    api.focus.target('frequency', () => {
      api.text(ctx, 'One irrelevant record', x, 286, 50, C.ink, 'left', 'serif');
      api.text(ctx, 'Similarity  0', x, 398, 38, C.muted);
      api.text(ctx, 'Recency  0', 590, 398, 38, C.muted);
      api.text(ctx, 'Reads  ' + frequency.toLocaleString('en-US'), 1050, 398, 38, C.yellow);
      api.text(ctx, '0.2 × ln(1 + 1,000,000)', x, 533, 53, C.ink, 'left', 'mono');
      api.rect(ctx, x, y, unit, 70, '#222b35', null, 0);
      if (grow > 0) api.rect(ctx, x, y, unit * frequencyScore * grow, 70, C.pink, null, 0);
      api.line(ctx, x, y + 85, x + unit * 3, y + 85, C.muted, 2);
      for (let tick = 0; tick <= 3; tick++) {
        const tx = x + unit * tick;
        api.line(ctx, tx, y + 85, tx, y + 103, C.muted, 2);
        api.text(ctx, String(tick), tx, y + 150, 35, C.ink, 'center');
      }
      api.text(ctx, 'Maximum with bounded inputs', x + unit, y + 230, 33, C.muted, 'center');
      if (grow >= 1)
        api.text(
          ctx,
          frequencyScore.toFixed(3),
          x + unit * frequencyScore,
          y - 18,
          47,
          C.pink,
          'center',
          'mono',
        );
    });
    return;
  }

  const powers = [cue(api, 'rank-sim'), cue(api, 'rank-age'), cue(api, 'rank-importance')];
  const keys = ['similarity', 'recency', 'importance'];
  const colors = [C.blue, C.cyan, C.pink];
  const x = 599,
    unit = 1000;
  api.focus.target('ranking', () => {
    api.text(ctx, 'Billing / webhook   ·   admitted receipts', 118, 259, 35, C.muted);
    const names = ['Wording × 0.5', 'Age × 0.3', 'Importance × 0.2'];
    names.forEach((name, j) => api.text(ctx, name, 600 + j * 368, 335, 33, colors[j]));
    for (const [i, row] of scoreRows.entries()) {
      const y = 441 + i * 230;
      api.text(ctx, i ? 'Different retry' : 'Event 78291', 118, y + 11, 47, C.ink, 'left', 'serif');
      api.text(ctx, i ? 'Two weeks ago' : 'Yesterday', 118, y + 69, 34, C.muted);
      api.text(
        ctx,
        'Match ' + row.similarity.toFixed(2) + '   •   importance ' + row.importance.toFixed(2),
        x,
        y - 22,
        30,
        C.muted,
      );
      api.rect(ctx, x, y, unit, 64, '#222b35', null, 0);
      let left = x;
      for (const [j, key] of keys.entries()) {
        const length = row.contributions[key] * unit;
        if (powers[j] > 0) api.rect(ctx, left, y, length * powers[j], 64, colors[j], null, 0);
        left += length;
      }
      // Read the rounded contributions under the bar, independent of short segment lengths.
      let sum = 0;
      const parts = [];
      for (const [j, key] of keys.entries()) {
        if (powers[j] >= 1) {
          sum += row.contributions[key];
          parts.push(row.contributions[key].toFixed(3));
        }
      }
      let calculation = parts.join(' + ');
      if (parts.length === 1 && cue(api, 'rank-half-life') > 0) {
        const equation = parts[0] + ' + 0.3 \\times 2^{-' + row.ageHours + '/168}';
        api.math(ctx, equation, x, y + 119, 36, C.ink);
      } else if (parts.length) {
        if (parts.length === 1) calculation = '0.5 × ' + row.similarity.toFixed(2);
        api.text(ctx, calculation, x, y + 119, 33, C.ink, 'left', 'mono');
      }
      if (parts.length && (parts.length < 3 || cue(api, 'rank-total') >= 1))
        api.text(ctx, sum.toFixed(3), 1805, y + 49, 48, C.ink, 'right', 'mono');
    }
    const aged = cue(api, 'rank-age') > 0;
    if (state.beat === 1)
      api.text(
        ctx,
        'One-week half-life. Which bar will lead after age is added?',
        960,
        957,
        37,
        C.yellow,
        'center',
      );
    else if (aged && state.beat <= 2)
      api.text(
        ctx,
        'Two weeks:  1 → ½ → ¼      •      age contribution:  0.3 × ¼ = 0.075',
        960,
        957,
        36,
        C.cyan,
        'center',
      );
    else if (state.beat >= 3)
      api.text(
        ctx,
        'Score ruler  0 to 1     /     rank before rounding',
        960,
        957,
        34,
        C.muted,
        'center',
      );
  });
}

export default {
  id: 'retrieval-ranking',
  draw: drawRetrievalRanking,
  cues: [
    'rank-sim',
    'rank-half-life',
    'rank-age',
    'rank-importance',
    'rank-total',
    'rank-frequency',
  ],
};
