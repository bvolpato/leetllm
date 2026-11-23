import {
  C,
  head,
  plate,
  rect,
  text,
  line,
  bracket,
  diamond,
  dot,
  dash,
  measure,
  ticks,
  pct,
  ease,
  mix,
} from './drawing.mjs';
import { select, band, errors, finalRun } from './model.mjs';

export function transfer(c, t) {
  const qChange = t.b >= 4 && t.on(4, 'change just the eighth');
  const higherTarget = t.b === 3 && t.on(3, 'We now need');
  const target = higherTarget ? 0.9 : 0.8,
    center = t.b === 2 ? 44 : 40;
  const inputs = errors.map((v, i) => (i === 7 && qChange ? 9 : v));
  const s = select(inputs, target),
    m = band(center, s.q, null),
    response = !qChange || t.on(5, 'The same slot');
  head(
    c,
    'SERVICE DEADLINE  /  CONTROLLED REPLAYS',
    [
      'Does the whole band fit before the deadline?',
      'Move the center',
      higherTarget ? 'Raise the coverage target' : 'Restore the original forecast',
      'Change the eighth error',
      'Read the same slot again',
      'Record the decision with its context',
    ][t.b - 1],
  );
  if (t.b === 6) {
    plate(c, 58, 139, 839, 303);
    text(c, 'Selected request', 83, 174, 23, C.text, 'left', 'Serif');
    text(c, 'Example audit record', 874, 174, 16, C.dim, 'right');
    line(c, 80, 199, 874, 199, C.edge);
    const fields = [
      ['Rule', 'absolute error'],
      ['Target', pct(target)],
      ['Prediction', center + ' ms'],
      ['Interval', '[' + m.lo + ', ' + m.hi + '] ms'],
      ['Width', m.width + ' ms'],
      ['Caller deadline', '50 ms'],
    ];
    fields.forEach(([name, v], i) => {
      const x = 84 + (i % 3) * 272,
        y = 232 + Math.floor(i / 3) * 92;
      text(c, name, x, y, 17, C.dim);
      text(c, v, x, y + 37, 23, C.gold, 'left', 'Mono');
    });
    text(
      c,
      'Attach versions, group and observed latency to measure failures among selected requests.',
      84,
      409,
      17,
      C.dim,
    );
    return;
  }
  text(c, 'target ' + pct(target), 54, 156, 17, C.dim, 'left', 'Mono');
  inputs.forEach((v, i) => {
    const x = 324 + i * 67;
    rect(c, x - 24, 135, 48, 41, response && i === s.index ? C.gold : C.panel, 4);
    text(c, v, x, 156, 20, response && i === s.index ? C.dark : C.dim, 'center', 'Mono');
  });
  measure(c, m, { min: 22, max: 60, y: 282, showBand: response });
  text(
    c,
    response
      ? 'rank ' + s.rank + '     radius ' + s.q + ' ms     width ' + m.width + ' ms'
      : 'Does the selected position change?',
    48,
    203,
    20,
    C.gold,
    'left',
    'Mono',
  );
}
function outcomeLog(c, r, { showCoverage, showLateness, previous }) {
  const x = 637;
  plate(c, x, 202, 280, 234);
  text(
    c,
    previous && !showCoverage ? 'Previous run' : 'Request log',
    x + 23,
    234,
    25,
    C.text,
    'left',
    'Serif',
  );
  line(c, x + 19, 257, 893, 257, C.edge);
  text(c, 'Within interval', x + 22, 284, 16, C.dim);
  const result = showCoverage ? r : previous;
  if (previous && showCoverage) {
    text(c, (previous.hit ? 'Covered' : 'Outside') + '  →', x + 22, 319, 21, C.dim, 'left', 'Serif');
  }
  text(
    c,
    result ? (result.hit ? 'Covered' : 'Outside') : '?',
    x + (previous && showCoverage ? 133 : 22),
    319,
    26,
    result ? (result.hit ? C.teal : C.red) : C.dim,
    'left',
    'Serif',
  );
  text(c, 'Caller', x + 22, 361, 16, C.dim);
  text(
    c,
    showLateness ? r.late + ' ms late' : '?',
    x + 22,
    398,
    26,
    showLateness ? C.red : C.dim,
    'left',
    'Serif',
  );
}
export function final(c, t) {
  const changed = t.after(6, 'Change just the error in slot eighteen from seven to eight');
  const arrival = t.after(5, 'It arrives at sixty')
    ? 60
    : t.after(3, 'The response arrives at fifty-nine')
      ? 59
      : null;
  const r = finalRun(changed, arrival);
  const previous = changed ? finalRun(false, arrival) : null;
  const rankKnown =
    t.after(2, 'Ninety percent of twenty gives rank eighteen') &&
    (!changed || t.after(7, 'We still take rank eighteen'));
  const windowKnown = t.after(2, 'the interval runs from forty-five to fifty-nine');
  const widened = t.after(7, 'Eight on either side of fifty-two gives forty-four through sixty');
  const widening = widened ? ease(t.amount(7, 'The width is now', 0.75)) : 0;
  const shown = previous ?? r;
  const widthKnown = changed
    ? t.after(7, 'The width is now sixteen') && widening === 1
    : t.after(2, 'Its width is fourteen milliseconds');
  const outsideKnown = t.after(5, 'This one is outside by one millisecond and five milliseconds late');
  const showCoverage = changed
    ? t.after(7, 'The same arrival is covered') && widening === 1
    : arrival === 60
      ? outsideKnown
      : t.after(4, 'The endpoint counts, so mark it covered');
  const showLateness = arrival === 60 ? outsideKnown : t.after(4, 'Mark it four milliseconds late');
  head(
    c,
    'REQUEST LOG  /  FRESH CALIBRATION',
    t.b === 1
      ? 'Choose the slot before the response arrives'
      : changed
        ? 'One calibration error grew by a millisecond'
        : 'One arrival, two comparisons',
  );
  text(c, '19 errors  ·  90% target', 48, 143, 18, C.dim);
  text(c, 'slots 1–17', 332, 129, 14, C.dim, 'center');
  text(c, '≤ 6 ms', 332, 159, 21, C.text, 'center', 'Mono');
  text(c, 'slot 18', 510, 129, 14, C.dim, 'center');
  if (rankKnown || changed) rect(c, 461, 142, 98, 32, rankKnown ? C.gold : C.panel, 4);
  text(c, r.ordered[17] + ' ms', 510, 159, 21, rankKnown ? C.dark : C.text, 'center', 'Mono');
  text(c, 'slot 19', 681, 129, 14, C.dim, 'center');
  text(c, r.ordered[18] + ' ms', 681, 159, 21, C.text, 'center', 'Mono');
  const xx = (v) => 71 + (v - 40) * 23.4,
    y = 298,
    dy = 385;
  const lo = mix(shown.lo, r.lo, widening),
    hi = mix(shown.hi, r.hi, widening);
  line(c, xx(40), y, xx(63), y, C.edge, 2);
  line(c, xx(40), dy, xx(63), dy, C.edge, 2);
  if (windowKnown) {
    if (previous && widening > 0) {
      bracket(c, xx(previous.lo), xx(previous.hi), y - 17, C.dim, 2);
      text(c, 'Previous interval', xx(r.center), y - 40, 15, C.dim, 'center');
    }
    bracket(c, xx(lo), xx(hi), y, C.gold, 10);
    if (widening === 0 || widening === 1) {
      for (const v of [lo, hi]) text(c, v, xx(v), y + 24, 20, C.gold, 'center', 'Mono');
    }
    if (changed && widening === 0) {
      text(c, 'Previous interval', xx(r.center), y + 24, 15, C.dim, 'center');
    }
  }
  diamond(c, xx(r.center), y, 8, C.blue);
  text(c, 'forecast ' + r.center, xx(r.center), y - 65, 17, C.blue, 'center');
  line(c, xx(40), dy, xx(r.deadline), dy, C.blue, 5);
  line(c, xx(r.deadline), dy - 13, xx(r.deadline), dy + 12, C.red, 3);
  text(c, 'deadline ' + r.deadline, xx(r.deadline), dy + 33, 17, C.red, 'center');
  if (arrival != null) {
    const x = xx(arrival);
    if (windowKnown && (arrival === lo || arrival === hi)) {
      dash(c, x, y - 53, x, y + 8, C.text, 1.5);
      dash(c, x, y + 40, x, dy, C.text, 1.5);
    } else {
      dash(c, x, y - 53, x, dy, C.text, 1.5);
    }
    dot(c, x, y, 6, C.text);
    if (showLateness && r.late > 0) line(c, xx(r.deadline) + 2, dy, x, dy, C.red, 4);
    diamond(c, x, dy, 7, C.text);
    text(c, 'arrival ' + arrival, x, y - 73, 18, C.text, 'center', 'Mono');
  }
  outcomeLog(c, r, { showCoverage: showCoverage && windowKnown, showLateness, previous });
  if (widthKnown)
    text(
      c,
      'rank ' + r.rank + '    q = ' + r.q + ' ms    width ' + r.width + ' ms',
      49,
      207,
      19,
      C.gold,
      'left',
      'Mono',
    );
}
