import { check, saved, fresh, opt, results, firstMoment, nextGradient } from './examples.mjs';
import { adamLayout, C, text, mono, shell, foot, line, arrow, dot, box, cue, finished } from './drawing.mjs';
import { view, route, flatten, tape } from './storage-scenes.mjs';
import { attend, pad, guards } from './graph-scenes.mjs';
import { partial, pipeline, residency, peak, restore } from './distributed-scenes.mjs';

function update(g, c) {
  const rule = cue(c, 0, 'For the new first moment');
  const savedTerms = cue(c, 1, 'Subtract point zero two five');
  const moments = cue(c, 1, 'The second moment');
  const reference = cue(c, 1, 'A full restore');
  const matches = finished(c, 1, 'lands at the same mark');
  const resetTerms = cue(c, 2, 'Zero minus point');
  const newHistory = cue(c, 2, 'Subtracting a negative step');
  const freshResult = cue(c, 2, 'Equal pre-update losses');
  const scheduler = cue(c, 3, 'Halve just its learning rate');
  const slower = cue(c, 4, 'To verify a restart');
  const verified = finished(c, 4, 'Here the full restore');
  const rows = [
    { name: 'Uninterrupted', initial: saved, calc: moments, done: reference, color: C.teal },
    { name: 'Full restore', initial: saved, calc: moments, done: matches, color: C.teal },
    { name: 'Weights only', initial: fresh, calc: newHistory, done: freshResult, color: C.red },
  ];
  if (scheduler)
    rows.push({ name: 'Half rate', initial: saved, calc: true, done: slower, color: C.blue });
  shell(
    g,
    'Adam replay',
    'Which restore follows the next update?',
    'Saved  w ≈ 0.990000     m = 0.050     v = 0.000250     step = 1',
    adamLayout,
  );
  const axis = (w) => 601 + ((w - 0.986) / 0.015) * 216;
  const xStart = axis(saved.w);
  const xs = [44, 238, 339, 443, 523, 701, 887];
  ['Branch', 'm', 'v', 't', 'Rate', 'Weight', 'Readout'].forEach((label, i) =>
    text(g, label, xs[i], 174, 16, C.gray, { align: i ? 'center' : 'left', weight: 600 }),
  );
  line(g, 40, 193, 923, 193, C.rule);
  rows.forEach(({ name, initial, calc, done, color }, i) => {
    const y = 226 + i * 54;
    const state = calc ? results[i] : initial;
    text(g, name, 44, y, 19, done ? color : C.ink, { weight: 600, width: 165 });
    mono(g, state.m.toFixed(3), xs[1], y, 17, C.ink, { align: 'center' });
    mono(g, state.v.toFixed(6), xs[2], y, 17, C.ink, { align: 'center' });
    mono(g, state.t, xs[3], y, 18, C.ink, { align: 'center' });
    mono(g, (i === 3 ? opt.lr / 2 : opt.lr).toFixed(3), xs[4], y, 17, C.ink, { align: 'center' });
    line(g, 601, y, 817, y, C.rule, 2);
    line(g, xStart, y - 11, xStart, y + 11, C.gray, 1);
    if (done) {
      const x = axis(results[i].w);
      arrow(g, xStart, y, x, y, color, 3);
      dot(g, x, y, 5, color);
    } else dot(g, xStart, y, 5, C.gray);
    mono(g, (done ? results[i].w : saved.w).toFixed(6), xs[6], y, 17, done ? color : C.gray, {
      align: 'center',
    });
    if (verified && i < 2) box(g, 32, y - 17, 4, 34, C.teal, null, 2);
  });
  const axisY = 412;
  line(g, 601, axisY, 817, axisY, C.gray);
  [0.99, 0.995, 1].forEach((w) => {
    line(g, axis(w), axisY, axis(w), axisY + 5, C.gray);
    mono(g, w.toFixed(3), axis(w), axisY + 19, 13, C.gray, { align: 'center' });
  });
  if (!scheduler) {
    for (const [visible, ready, name, initial, y] of [
      [savedTerms, moments, 'Saved', saved, 367],
      [resetTerms, newHistory, 'Reset', fresh, 394],
    ]) {
      if (!visible) continue;
      const { history, incoming, next } = firstMoment(initial.m, nextGradient);
      const historyTerm = history === 0 ? '0' : history.toFixed(3);
      const result = ready ? next.toFixed(3).replace('-', '−') : '?';
      mono(g, name + '  m′ = ' + historyTerm + ' − ' + Math.abs(incoming).toFixed(3) + ' = ' + result,
        45, y, 20, C.ink);
    }
  }
  text(g, 'Next g = ' + String(nextGradient).replace('-', '−') + '     ·     β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸', 45, 428, 17, C.ink);
  foot(
    g,
    verified
      ? 'First updated weight   ' +
          results[1].w.toFixed(6) +
          '   ·   Full restore matches uninterrupted.'
      : slower
        ? 'Same direction, half the rate, half the displacement.'
        : freshResult && !scheduler
          ? 'Resetting the moments reversed the step.'
          : scheduler
            ? 'Predict the weight with the same Adam history and half the rate.'
            : rule
              ? 'First moment     m_next = ' + opt.b1 + ' × m_old + ' + (1 - opt.b1).toFixed(1) + ' × g'
              : 'Compare the first resumed optimizer step.',
    'w′ = w − rate × [m / (1 − β₁ᵗ)] / [√(v / (1 − β₂ᵗ)) + ε]    ·    m, v and t are the updated state in this formula.',
  );
}

const painters = {
  view,
  route,
  flat: flatten,
  tape,
  attention: attend,
  padding: pad,
  guards,
  partial,
  pipeline,
  residency,
  peak,
  restore,
  update,
};
export default {
  title: 'PyTorch from Shared Storage to a Recoverable Training Step',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check,
};
