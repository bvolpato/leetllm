import { C, num, vec, lerp } from './bench.mjs';
import { rotationPolicy, policyRequest, policyEvaluation } from '../../../films/lora/model.mjs';

export function scoreStrip(request, toZero, pastZero) {
  const toBoundary = -request.base;
  const length = toBoundary * toZero + (request.correction - toBoundary) * pastZero;
  return { length, endpoint: request.base + length };
}

function scoreRule(d, request, strip, { pin, result, route }) {
  const { box, line, circle, label, mono, txt } = d;
  const X = (n) => 590 + 221 * n;
  const y = 415;
  label('Routine review   ·   score < 0', X(-1), 326, C.blue, 'center');
  label('Rotation owner   ·   score ≥ 0', X(1), 326, C.red, 'center');
  box(X(-2), y - 12, X(0) - X(-2), 24, C.sky);
  box(X(0), y - 12, X(2) - X(0), 24, C.peach);
  line(X(-2), y + 12, X(2), y + 12, C.ink, 2);
  for (let n = -2; n <= 2; n += 0.5) {
    const integer = Number.isInteger(n);
    line(X(n), y + 12, X(n), y + (integer ? 28 : 22), C.muted, 2);
    if (integer) mono(num(n), X(n), y + 55, 23, C.ink, 'center');
  }
  line(X(0), y - 48, X(0), y + 12, C.red, 3);
  if (!pin) return;
  if (strip.length > 0) {
    box(X(request.base), y - 12, X(strip.endpoint) - X(request.base), 24, C.brass);
    for (let step = 0.5; step < strip.length; step += 0.5)
      line(X(request.base + step), y - 10, X(request.base + step), y - 1, C.light, 2);
    line(X(strip.endpoint), y - 16, X(strip.endpoint), y + 13, C.ink, 3);
  }
  circle(X(request.base), y, 10, C.blue, C.light, 2);
  label('Frozen  ' + num(request.base), X(request.base), y - 42, C.blue, 'center');
  if (result)
    mono('+' + num(strip.endpoint), X(strip.endpoint), y - 43, 31, C.ink, 'center');
  if (route)
    txt('Send this ticket to the rotation owner', 590, 554, 32, C.red, 'center');
}

export function opening(d) {
  const { b, at, seen, head, label, line, box, mono, key, txt, fade, path } = d;
  if (b <= 2) {
    const f = policyRequest();
    head('Can the adapter move this score across zero?');
    // The separate swatch has the same units as the routing scale.
    const start = 146, width = 221 * f.correction;
    fade(at(1, 'The adapter'), () => {
      label('Adapter contribution', start, 161, C.brass);
      box(start, 194, width, 24, C.brass, null, 2);
      for (let step = 0.5; step < f.correction; step += 0.5)
        line(start + 221 * step, 195, start + 221 * step, 205, C.light, 2);
      mono('+' + num(f.correction), start + width + 22, 206, 32, C.ink);
    });
    const strip = scoreStrip(f, at(2, 'Lay out the gold strip', 1.35), at(2, 'last half unit', 1));
    scoreRule(d, f, strip, {
      pin: true, result: seen(2, 'Send the ticket'), route: seen(2, 'The blue pin marks'),
    });
    return;
  }
  const { routine, overdue, minimumDays } = rotationPolicy;
  head('Which key needs the rotation owner?');
  const X = (n) => 100 + 9.65 * n,
    limit = X(minimumDays);
  box(69, 253, 1055, 65, '#d7b980', C.brass, 8);
  for (let n = 0; n <= 100; n++) {
    line(X(n), 253, X(n), 253 + (n % 10 === 0 ? 24 : n % 5 === 0 ? 16 : 8), C.ink, 1.5);
    if (n % 10 === 0) mono(n, X(n), 299, 15, C.ink, 'center');
  }
  label('Days since rotation', 77, 350);
  const policy = at(3, 'current policy');
  fade(policy, () => {
    line(limit, 166, limit, 279, C.red, 3);
    label('90-day rule', limit - 12, 157, C.red, 'right');
  });
  const drop = at(4, 'Send ticket four', 1.25);
  const rackY = 460;
  line(65, rackY, 547, rackY, C.blue, 5);
  line(661, rackY, 1130, rackY, C.red, 5);
  label('Routine review', 70, 426, C.blue);
  label('Rotation owner', 665, 426, C.red);
  for (const [item, tint] of [
    [routine, C.teal],
    [overdue, C.brass],
  ]) {
    const x = X(item.days),
      old = item === overdue;
    const start = at(3, old ? 'Ticket four' : 'Ticket seven', 0.8);
    const y = lerp(172, 199, start);
    line(x, y + 22, x, 252, C.muted, 1.8);
    key(x, y, item.id, item.days, tint, 0.72);
    {
      const xx = old ? lerp(405, 860, drop) : 196;
      path(
        [
          [xx, rackY + 3],
          [xx, rackY + 16],
          [xx - 8, rackY + 22],
        ],
        C.ink,
        3,
      );
      box(xx - 58, rackY + 20, 118, 54, C.light, tint, 7);
      mono(item.id, xx, rackY + 48, 27, tint, 'center');
    }
  }

  if (b === 5 && seen(5, 'Keep the base revision'))
    txt('Hold out 20 policy and 20 routine cases. Require 19 correct in each.', 72, 610, 25, C.ink);
}
function cases(d, ev, index, y, show, mark) {
  const { label, mono, box, line, circle, txt } = d;
  const r = ev.rows[index],
    col = index ? C.teal : C.blue;
  label(index ? 'Routine reviews' : 'Policy tickets', 66, y + 19, col);
  r.cases.forEach((item, j) => {
    const x = 253 + j * 35,
      active = item.id === mark;
    box(
      x,
      y,
      28,
      45,
      show ? (item.correct ? C.mint : C.peach) : C.light,
      active ? C.ink : C.grid,
      3,
    );
    mono(item.id.slice(1), x + 14, y + 12, 12, C.ink, 'center');
    if (show) {
      if (item.correct) {
        line(x + 7, y + 29, x + 12, y + 34, C.teal, 2);
        line(x + 12, y + 34, x + 21, y + 23, C.teal, 2);
      } else {
        line(x + 9, y + 24, x + 19, y + 34, C.red, 2.5);
        line(x + 19, y + 24, x + 9, y + 34, C.red, 2.5);
      }
    }
    if (active) circle(x + 14, y + 56, 4, C.ink);
  });
  mono(
    show ? r.correct + ' / 20' : '? / 20',
    992,
    y + 22,
    26,
    show && r.rate < ev.minimum ? C.red : col,
  );
}
export function release(d) {
  const { b, at, seen, head, label, mono, txt, key, slab } = d;
  if (b <= 4) {
    const f = policyRequest();
    head('What do A and B contribute to the score?');
    mono('x = ' + vec(f.x), 70, 169, 34);
    mono('W₀ = ' + vec(f.W[0]), 70, 240, 26, C.blue);
    mono('A = ' + vec(f.A[0]), 435, 166, 25, C.red);
    mono('B = ' + num(f.B[0][0]) + '     scale = ' + num(f.scale), 435, 217, 25, C.red);
    const z = seen(3, 'B halves that'),
      bz = seen(3, 'Scaling by two'),
      corr = b > 3 || (b === 3 && d.clock.elapsed >= d.clock.speechDuration);
    mono(
      'Ax  ' +
        (z ? num(f.z) : '?') +
        '     B(Ax)  ' +
        (bz ? num(f.unscaled) : '?') +
        '     sB(Ax)  ' +
        (corr ? '+' + num(f.correction) : '?'),
      435,
      274,
      23,
      C.red,
    );
    const strip = scoreStrip(f, at(4, 'Start at minus one', 1.2), at(4, 'cross zero', 0.8));
    scoreRule(d, f, strip, { pin: true, result: seen(4, 'Send this ticket'), route: seen(4, 'rotation owner') });
    return;
  }
  const fix =
    b === 8 && seen(8, 'Policy ticket twenty moves')
      ? 'P20'
      : b >= 9 && seen(9, 'Ticket seven returns')
        ? 'R07'
        : undefined;
  const ev = policyEvaluation(fix),
    mark = fix || (b === 6 ? 'R07' : null);
  head(b === 7 ? 'Which single repair passes both sets?' : 'Each set needs at least 19 correct');
  label(
    fix === 'P20' ? 'Candidate A' : fix === 'R07' ? 'Candidate B' : 'Original answers',
    67,
    175,
  );
  cases(d, ev, 0, 216, seen(5, 'nineteen correct'), mark);
  cases(d, ev, 1, 321, seen(5, 'eighteen correct'), mark);
  if (b === 6) {
    key(116, 481, 'R07', 12, C.teal, 0.79);
    txt('R07 went to the owner. Its expected queue is routine review.', 283, 476, 25, C.red);
  }
  if (b === 7) {
    slab(148, 447, 385, 92, 'A would repair P20', 'Policy miss → correct', C.blue);
    slab(656, 447, 385, 92, 'B would repair R07', 'Routine miss → correct', C.teal);
  }
  if (b >= 8 && fix) {
    const totalKnown = b === 8 ? seen(8, 'but routine reviews') : seen(9, 'Only B passes');
    const verdictKnown = b === 8 ? seen(8, 'Hold A') : b > 9 || d.clock.elapsed >= d.clock.speechDuration;
    if (totalKnown) mono(ev.pooled + ' / 40 overall', 160, 489, 29);
    if (verdictKnown)
      txt(ev.deploy ? 'Both sets pass' : 'Routine set below 19', 654, 489, 31, ev.deploy ? C.teal : C.red);
  }
  if (b >= 9) label('A recorded 20 policy + 18 routine. Hold A.', 108, 427, C.muted);
  if (b === 10) {
    label('Release with exact base + ticket format', 80, 576, C.teal);
    label('Resume with optimizer + schedule + data position', 605, 576);
  }
}
