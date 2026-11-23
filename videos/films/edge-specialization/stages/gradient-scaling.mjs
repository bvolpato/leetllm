import { edgeGradients } from '../arithmetic.mjs';
import { cueProgress, fieldDrawing } from '../field-drawing.mjs';

export function drawGradientScaling(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const { C, text, line, dot, target } = p;
  const b = state.beat ?? 0;
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const g = edgeGradients(3);
  const first = 3.2;
  const rate = 0.1;
  const next = first - rate * g.scaled[0];
  if (b < 2) {
    const centered = cue('center-logits', 1, 0.44, 0.58);
    const moved = cue('grad-step', 1, 0.12, 0.3) === 1;
    target('grad-shares', () => {
      if (centered === 0) {
        const x = (v) => 240 + 1420 * v;
        text('First token   /   probability at T = 3', 165, 293, 36, C.ink);
        line(x(0), 500, x(1), 500, C.muted, 3);
        for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
          line(x(tick), 505, x(tick), 522, C.muted);
          text(tick, x(tick), 568, 29, C.muted, 'center');
        }
        const student = x(g.ps[0]),
          teacher = x(g.pt[0]);
        dot(teacher, 500, 13, C.blue);
        dot(student, 500, 13, C.green);
        text('student  ' + g.ps[0].toFixed(3), student - 20, 446, 39, C.green, 'right');
        text('teacher  ' + g.pt[0].toFixed(3), teacher + 20, 446, 39, C.blue);
        const gap = cue('prob-gap', 0, 0.18, 0.4);
        if (gap > 0) {
          line(teacher, 481, teacher + (student - teacher) * gap, 481, C.yellow, 5);
          dot(teacher + (student - teacher) * gap, 481, 6, C.yellow);
        }
      } else {
        text('Center each logit within its own vector', 165, 292, 38, C.ink);
        const teacher = [4, 2, 1],
          student = [3.2, 2.4, 1.1];
        [teacher, student].forEach((v, i) => {
          const mean = v.reduce((s, x) => s + x, 0) / v.length;
          const y = 403 + i * 97;
          text(i === 0 ? 'Teacher' : 'Student', 167, y, 38, i === 0 ? C.blue : C.green);
          text('[' + v.join(',  ') + ']', 480, y, 38);
          text('first logit  −  mean', 950, y, 31, C.muted);
          if (centered === 1)
            text((v[0] - mean).toFixed(3), 1650, y, 45, i === 0 ? C.blue : C.green, 'right');
        });
      }
    });
    target('grad-calc', () => {
      if (centered > 0) {
        text('Centered gap    −0.700', 170, 680, 51, C.yellow);
        text('3 possible tokens', 170, 780, 36, C.muted);
        if (cue('grad-limit', 1, 0.81, 0.95) === 1)
          text('Limit    −0.700 / 3  ≈  −0.233333', 170, 925, 48, C.ink);
        return;
      }
      const raw = cue('grad-unscaled', 0, 0.39, 0.54) === 1;
      const scaled = cue('grad-scaled', 0, 0.64, 0.77) === 1;
      text('Unscaled derivative', 170, 696, 36, C.muted);
      text('(student − teacher) / 3' + (raw ? '   ≈   ' + g.g[0].toFixed(5) : ''), 605, 696, 43);
      if (scaled) {
        text('Scaled by T²', 170, 791, 36, C.muted);
        text('9 × derivative   ≈   ' + g.scaled[0].toFixed(5), 605, 791, 43, C.yellow);
        text(
          moved
            ? '3.200  −  0.1 × (' + g.scaled[0].toFixed(5) + ')   ≈   ' + next.toFixed(3)
            : 'New logit    3.200  −  0.1 × (' + g.scaled[0].toFixed(5) + ')   =   ?',
          960,
          948,
          47,
          moved ? C.green : C.ink,
          'center',
        );
      }
    });
    return;
  }

  const x = (v) => 1510 + v * 3600;
  const showScaled = cue('grad-compensation', 2, 0.55, 0.66);
  const limit = edgeGradients(100).limit[0];
  target('grad-shares', () => {
    text('First logit   /   same starting weights', 168, 280, 36);
    text('Unscaled derivative', 168, 368, 31, C.blue);
    text('T²-scaled derivative', 590, 368, 31, C.green);
    [1, 3, 100].forEach((tau, i) => {
      const row = edgeGradients(tau),
        y = 507 + 151 * i;
      text('T = ' + tau, 168, y + 12, 41);
      line(x(-0.3), y, x(0), y, C.muted, 2);
      dot(x(row.g[0]), y - 8, 11, C.blue);
      text(row.g[0].toFixed(6), x(row.g[0]), y - 35, 30, C.blue, 'center');
      if (showScaled > 0) {
        const pos = x(row.g[0] + (row.scaled[0] - row.g[0]) * showScaled);
        dot(pos, y + 10, 11, C.green);
        if (showScaled === 1) text(row.scaled[0].toFixed(6), pos, y + 61, 30, C.green, 'center');
      }
    });
    text('0', x(0), 908, 29, C.muted, 'center');
  });
  target('grad-calc', () => {
    for (const y of [507, 658, 809]) line(x(limit), y - 18, x(limit), y + 19, C.yellow, 2);
    text('High-temperature limit  ' + limit.toFixed(6), 960, 982, 38, C.yellow, 'center');
  });
}
export default {
  id: 'gradient-scaling',
  draw: drawGradientScaling,
  cues: [
    'prob-gap',
    'grad-unscaled',
    'grad-scaled',
    'grad-step',
    'center-logits',
    'grad-limit',
    'compare-temperatures',
    'grad-compensation',
  ],
};
