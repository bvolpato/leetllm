import { targetRows } from '../fixtures.mjs';
import { encode } from '../arithmetic.mjs';
import { featureFrame } from '../model.mjs';

const held = [1, 3, 5, 7];
const target = 7;
const weight = 5;

export function drawCrossfitConstruction(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const flipped = f.completed('feature-target-flip', 2);
  const rows = targetRows.map((row, i) => (i === target && flipped ? { ...row, missed: 0 } : row));
  const split = f.progress('fold-split', 1);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);

  api.focus.target('fold-jobs', () => {
    t('Deadline outcomes', 130, 244, 34, C.ink, 'left');
    t('1 = missed     0 = on time', 1760, 244, 30, C.muted, 'right');
    rows.forEach((row, i) => {
      const moved = held.includes(i) ? split : 0;
      const x = 141 + i * 207,
        y = 291 + 80 * moved;
      const color = i === target ? C.yellow : moved > 0 ? C.muted : C.cyan;
      api.rect(ctx, x, y, 188, 128, C.panel, color, i === target ? 4 : 2);
      t('T' + (i + 1) + '  /  ' + row.pool.split('-')[0].toUpperCase(), x + 94, y + 40, 28, color);
      t(String(row.missed), x + 94, y + 102, 52, color);
    });
    if (split === 1) t('Lower row held out together', 1754, 553, 27, C.muted, 'right');
  });

  function drawEstimate(id, caption, excluded, y, ready, color) {
    const fitting = rows.filter((_, i) => !excluded.includes(i));
    const pool = fitting.filter((row) => row.pool === rows[target].pool);
    const misses = pool.reduce((sum, row) => sum + row.missed, 0);
    const totalMisses = fitting.reduce((sum, row) => sum + row.missed, 0);
    const answer = encode(rows, excluded, target, weight);
    api.focus.target(id, () => {
      api.line(ctx, 138, y - 66, 1780, y - 66, C.muted, 1);
      t(caption, 144, y + 9, 38, color, 'left');
      t(misses + ' of ' + pool.length, 565, y + 10, 42, color);
      t(totalMisses + ' of ' + fitting.length, 845, y + 10, 42, color);
      const formula =
        '\\frac{' +
        misses +
        '+5(' +
        totalMisses +
        '/' +
        fitting.length +
        ')}{' +
        pool.length +
        '+5}';
      const result = !ready
        ? '=\\,?'
        : (id === 'fold-full' && !flipped ? '=11/16' : '') +
          (flipped && id === 'fold-full' ? '\\approx ' : '=') +
          Number(answer.toFixed(4));
      api.math(ctx, formula + result, 1390, y + 4, 41, color, 'center');
    });
  }
  t('L4 misses / jobs', 565, 621, 29, C.muted);
  t('All misses / jobs', 845, 621, 29, C.muted);
  t('Smoothed estimate for T8', 1390, 621, 29, C.muted);
  drawEstimate(
    'fold-full',
    'All eight',
    [],
    712,
    flipped ? f.completed('fold-recompute', 2) : f.completed('feature-target-full', 0),
    C.yellow,
  );
  if (f.b >= 1)
    drawEstimate(
      'fold-fit',
      'Fitting four',
      held,
      837,
      f.completed('feature-target-held', 1),
      C.cyan,
    );
  const note =
    f.b === 0
      ? 'Smoothing weight = 5 jobs'
      : f.b === 1
        ? 'If T8 changes from 1 to 0, which estimate moves?'
        : f.b === 2
          ? 'T8 originally had 0.6875 from all eight and 0.75 from the fitting four.'
          : f.started('fold-weight', 3)
            ? 'With no L4 jobs and weight 0, the denominator is 0.'
            : 'Positive smoothing weight gives an unseen pool the fitting prior.';
  t(note, 960, 975, 35, f.b === 1 ? C.yellow : C.ink);
}

export default {
  id: 'crossfit-construction',
  draw: drawCrossfitConstruction,
  cues: [
    'feature-target-prior',
    'feature-target-full',
    'fold-split',
    'feature-fitting-prior',
    'feature-target-held',
    'feature-target-flip',
    'fold-recompute',
    'fold-weight',
  ],
};
