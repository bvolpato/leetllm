import {
  expectedYield,
  verificationBudget,
  weightWorksheet,
} from '../../../films/speculative-decoding/arithmetic.mjs';
import { C, arrow, bracket, cue, fmt, line, note, page, pct, rect, slug, text } from './press.mjs';

export function weights(g, c) {
  const multi = cue(c, 2, 'Now feed six'),
    m = multi ? 6 : 1,
    data = weightWorksheet(m);
  page(g, 'DENSE BF16  /  weight-only model', 'How many columns can use one read?');
  const x = 165,
    y = 309;
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++)
      rect(g, x + 53 * j, y + 53 * i, 48, 48, (i + j) % 3 === 0 ? '#859a92' : '#adbbad');
  text(g, '30B active weights', x, 714, 45, C.ink, 'Serif');
  arrow(g, 503, 479, 745, 479, C.ink);
  text(g, Math.round(data.bytes / 1e9) + ' GB', 621, 433, 44, C.ink, 'Mono', 'center');
  for (let col = 0; col < m; col++) {
    slug(g, 814 + col * 102, 344, 69, 250, col === 0 ? C.green : C.violet);
    for (let j = 1; j < 6; j++)
      line(g, 814 + col * 102, 344 + j * 42, 882 + col * 102, 344 + j * 42, C.paper, 3);
  }
  bracket(g, 814, 883 + 102 * (m - 1), 630, m + ' input position' + (m === 1 ? '' : 's'));
  const time = cue(c, 1, 'at least seventeen');
  if (time) {
    text(g, 'Memory floor', 1500, 376, 35, C.quiet);
    text(g, fmt(data.memoryMs, 2) + ' ms', 1500, 444, 50, C.keep, 'Mono');
    if (cue(c, 1, 'six hundredths')) {
      text(g, 'Compute floor', 1500, 548, 35, C.quiet);
      text(g, fmt(data.computeMs, 3) + ' ms', 1500, 615, 46, C.ink, 'Mono');
    }
  }
  if (time)
    text(
      g,
      'Assume 3.35 TB/s, 989.5 TFLOP/s dense and one weight read per pass.',
      163,
      801,
      34,
      C.quiet,
    );
  note(
    g,
    'Weight-only intensity    ' +
      fmt(data.flops / 1e9, 0) +
      ' GFLOPs / ' +
      fmt(data.bytes / 1e9, 0) +
      ' GB  =  ' +
      data.intensity +
      ' FLOP/byte',
  );
}
export function counts(a, b) {
  const first = 100 * a,
    both = first * b;
  return { first, both, yield: (100 + first + both) / 100 };
}
export function cost(k, v) {
  const yieldPerRound = expectedYield(0.8, k),
    draft = 0.1 * k,
    total = draft + v;
  return { k, v, draft, total, yieldPerRound, speed: yieldPerRound / total };
}
function roundCounts(g, c) {
  const more = cue(c, 1, 'Reverse the two');
  page(g, 'REACHED POSITIONS  /  100 rounds, depth 2', 'How many rounds keep both?');
  const xs = [450, 948, 1450];
  ['First kept', 'Both kept', 'Emitted / round'].forEach((s, i) => text(g, s, xs[i], 327, 38, C.quiet));
  for (const [i, [a, b]] of [
    [0.9, 0.1],
    [0.1, 0.9],
  ].entries()) {
    if (i && !more) continue;
    const y = 430 + 206 * i,
      r = counts(a, b);
    text(g, pct(a) + ' → ' + pct(b), 102, y + 47, 41, C.ink, 'Serif');
    const showFirst = i || cue(c, 0, 'Ninety accept');
    const showBoth = i || cue(c, 1, 'Nine rounds');
    if (showFirst) {
      rect(g, xs[0], y, 330, 52, C.bed);
      rect(g, xs[0], y, 330 * a, 52, C.keep);
      text(g, r.first + ' of 100', xs[0], y + 109, 39);
      rect(g, xs[1], y, 330 * a, 52, C.bed);
      if (showBoth) rect(g, xs[1], y, 330 * a * b, 52, C.keep);
      text(g, (showBoth ? r.both : '?') + ' of ' + r.first, xs[1], y + 109, 39);
    }
    if (i || cue(c, 1, 'That gives a hundred'))
      text(g, fmt(r.yield), xs[2], y + 60, 71, C.keep, 'Serif');
  }
  note(g, 'Before stopping     yield = (first kept + both kept + 100) / 100');
}
export function yieldScene(g, c) {
  if (c.beat.beatIndex < 2) return roundCounts(g, c);
  const show = cue(c, 2, 'Expect about'),
    base = cue(c, 2, 'At one tenth');
  const increased = cue(c, 3, 'raise verification time');
  const longer = cue(c, 3, 'At depth ten');
  const k = longer ? 10 : 5,
    current = cost(k, longer ? 1.5 : increased ? 1.25 : 1);
  page(
    g,
    'TIMING MODEL  /  80% at each reached position, before stopping',
    'How much output does the work buy?',
  );
  const x = 123,
    y = 610,
    pitch = 93;
  for (let i = 0; i <= k; i++) {
    const val = 0.8 ** i,
      h = 231 * val;
    rect(g, x + pitch * i, y - h, pitch * 0.74, h, i ? C.keep : C.gold);
    text(g, i, x + pitch * i + pitch * 0.37, y + 46, 32, C.quiet, 'Mono', 'center');
  }
  text(g, 'Prefix survival', x, 321, 40, C.quiet);
  text(g, 'Accepted prefix length ≥ i', x, 730, 44, C.ink, 'Serif');
  if (show) {
    text(g, 'Expected tokens / round', 1233, 338, 36, C.quiet);
    text(g, fmt(current.yieldPerRound), 1228, 441, 85, C.keep, 'Serif');
  }
  if (base) {
    text(g, 'Draft   ' + fmt(current.draft) + '     Verify   ' + fmt(current.v), 1233, 540, 38);
    const scale = 185;
    rect(g, 1233, 583, current.draft * scale, 49, C.violet);
    rect(g, 1233 + current.draft * scale, 583, current.v * scale, 49, C.green);
    text(g, 'Round time    ' + fmt(current.total) + ' steps', 1233, 715, 39, C.ink);
  }
  note(
    g,
    base
      ? 'Modeled speedup    ' +
          fmt(current.yieldPerRound) +
          ' tokens / ' +
          fmt(current.total) +
          ' ordinary steps  ≈  ' +
          fmt(current.speed) +
          '×'
      : 'Before stopping    E[N] = 1 + α + α² + … + α^K',
  );
}
export const streams = 12,
  capacity = 40;
export function budgetState(k) {
  return verificationBudget(streams, k, capacity);
}
export function budgeting(g, c) {
  if (c.beat.beatIndex === 2) {
    const k = 2,
      result = cost(k, k + 1),
      show = cue(c, 2, 'two point four four');
    page(g, 'COMPUTE-LIMITED EXAMPLE  /  before stopping', 'What if each position costs a full step?');
    text(g, 'Verification', 120, 404, 49, C.ink, 'Serif');
    for (let i = 0; i < k + 1; i++) {
      slug(g, 500 + i * 382, 325, 350, 113, i ? C.violet : C.green);
      text(g, i ? 'draft ' + i : 'pending', 675 + i * 382, 399, 48, C.ink, 'Serif', 'center');
    }
    text(g, 'One step per position', 510, 546, 45, C.quiet);
    if (cue(c, 2, 'pay three steps'))
      text(
        g,
        fmt(result.v) +
          ' verify   +   ' +
          fmt(result.draft) +
          ' draft   =   ' +
          fmt(result.total) +
          ' steps',
        512,
        657,
        47,
      );
    if (show)
      text(
        g,
        fmt(result.yieldPerRound) +
          ' tokens / ' +
          fmt(result.total) +
          ' steps    ≈    ' +
          fmt(result.speed) +
          '×',
        512,
        784,
        55,
        C.repair,
        'Serif',
      );
    note(g, 'Depth 2   •   conditional acceptance 80%   •   draft cost 0.10 step per proposal');
    return;
  }
  const cut = cue(c, 1, 'Shorten each draft'),
    k = cut ? 2 : 3,
    d = budgetState(k);
  const verdict = cut || cue(c, 1, 'They need forty eight');
  page(g, 'SCHEDULER  /  12 streams, 40 input slots', 'What draft depth fits all twelve streams?');
  if (!verdict) {
    text(g, 'Inputs for one stream', 145, 358, 46, C.ink, 'Serif');
    for (let pos = 0; pos <= k; pos++) {
      const x = 145 + 320 * pos;
      slug(g, x, 408, 284, 102, pos ? C.violet : C.green);
      text(g, pos ? 'draft ' + pos : 'pending', x + 142, 477, 53, C.ink, 'Serif', 'center');
    }
    bracket(g, 145, 145 + 320 * k + 284, 543, 'Repeat for each of the 12 streams');
    text(g, 'Step capacity', 145, 728, 42, C.quiet);
    text(g, capacity + ' positions', 480, 730, 58, C.ink, 'Serif');
    note(g, 'First count the positions requested at depth 3.');
    return;
  }
  const left = 365,
    top = 330,
    dx = 113,
    dy = 73;
  for (let i = 0; i < d.inputs; i++) {
    const s = Math.floor(i / (k + 1));
    const x = left + (i % 12) * dx,
      y = top + Math.floor(i / 12) * dy;
    const pending = i % (k + 1) === 0,
      over = i >= capacity;
    rect(g, x, y, 104, 58, over ? '#edd2c5' : pending ? C.green : C.violet, over ? C.red : C.paper);
    text(g, 's' + (s + 1), x + 51, y + 38, 29, pending ? C.keep : C.draft, 'Mono', 'center');
  }
  for (let i = d.inputs; i < capacity; i++) {
    rect(g, left + (i % 12) * dx, top + Math.floor(i / 12) * dy, 104, 58, C.white, C.rule);
  }
  const edgeX = left + (capacity % 12) * dx - 4;
  const edgeY = top + Math.floor(capacity / 12) * dy;
  line(g, edgeX, edgeY - 5, edgeX, edgeY + 69, C.red, 5);
  text(g, '40-slot limit', edgeX, edgeY + 125, 36, C.red, 'Sans', 'center');
  text(g, 'Pending', 116, 379, 36, C.keep);
  text(g, 'Proposal', 116, 450, 36, C.draft);
  text(g, 'Depth K = ' + k, 115, 755, 47, C.ink, 'Serif');
  text(
    g,
    '12 × (1 + ' + k + ') = ' + d.inputs + ' positions',
    688,
    755,
    47,
    C.ink,
    'Mono',
  );
  note(
    g,
    d.fits
      ? 'Four slots remain. One more proposal per stream needs twelve.'
      : 'Eight input positions exceed this step’s capacity.',
  );
}
export const arrivals = [300, 301, 302, 500];
export const gaps = arrivals.slice(1).map((v, i) => v - arrivals[i]);
const trialSeconds = 20;
const requiredFraction = 0.95;
export const trials = [
  [180, 174],
  [220, 204],
].map(([offered, qualified]) => ({
  offered,
  qualified,
  attainment: qualified / offered,
  load: offered / trialSeconds,
  throughput: qualified / trialSeconds,
  passes: qualified / offered >= requiredFraction,
}));
export function service(g, c) {
  if (c.beat.beatIndex === 0) {
    page(g, 'CLIENT CLOCK  /  matched service trials', 'How long was the last pause?');
    const left = 332,
      w = 1280,
      xs = arrivals.map((t) => left + (w * (t - 300)) / 200);
    line(g, left, 573, left + w, 573, C.ink, 4);
    const n = cue(c, 0, 'Tokens arrive') ? 4 : 0;
    if (!n) {
      text(g, 'Same prompt', left, 482, 46, C.ink, 'Serif');
      text(g, 'Ordinary decoding', left + 562, 376, 48, C.ink, 'Serif');
      text(g, 'Draft + verify', left + 562, 522, 48, C.keep, 'Serif');
      arrow(g, left + 312, 460, left + 520, 365, C.quiet);
      arrow(g, left + 312, 460, left + 520, 498, C.keep);
    }
    for (let i = 0; i < n; i++) {
      const x = xs[i],
        labelX = [269, 525, 778, x][i];
      line(g, x, 556, labelX, 433, C.quiet, 2);
      rect(g, x - 3, 558, 6, 33, C.keep);
      text(g, arrivals[i] + ' ms', labelX, 397, 37, C.ink, 'Mono', 'center');
    }
    const last = cue(c, 0, 'one hundred ninety eight milliseconds');
    if (last) bracket(g, xs[2], xs[3], 659, gaps[2] + ' ms', C.repair);
    note(
      g,
      cue(c, 0, 'average gap')
        ? 'Mean gap   ' +
            fmt(gaps.reduce((a, b) => a + b) / gaps.length, 1) +
            ' ms     •     time from request to first token   300 ms'
        : 'Hold target, prompts, sampling, hardware and offered load fixed in each pair.',
    );
    return;
  }
  page(g, 'OFFERED LOAD  /  ' + trialSeconds + '-second trials', 'Which is the highest passing load tested?');
  const solved = cue(c, 2, 'A passes');
  const x = 454,
    w = 1170;
  trials.forEach((r, i) => {
    const y = 372 + 205 * i;
    text(g, 'Trial ' + (i ? 'B' : 'A'), 111, y + 61, 61, C.ink, 'Serif');
    rect(g, x, y, w, 64, C.bed);
    if (solved) rect(g, x, y, w * r.attainment, 64, r.passes ? C.keep : '#c28170');
    line(g, x + requiredFraction * w, y - 17, x + requiredFraction * w, y + 78, C.ink, 4);
    text(g, r.qualified + ' qualified / ' + r.offered + ' offered', x, y + 126, 39);
    if (solved) {
      text(g, r.load + ' offered/s     ' + fmt(r.throughput, 1) + ' qualified/s', 1100, y + 126, 38);
      text(
        g,
        pct(r.attainment, 1) + (r.passes ? '   pass' : '   below'),
        x,
        y - 15,
        40,
        r.passes ? C.keep : C.red,
      );
    }
  });
  text(g, pct(requiredFraction) + ' required', x + w * requiredFraction, 317, 35, C.ink, 'Mono', 'center');
  note(
    g,
    solved
      ? 'Trial A    ' +
          trials[0].load +
          ' offered/s     •     ' +
          fmt(trials[0].throughput, 1) +
          ' qualified/s'
      : 'Use all offered requests in the denominator, including failures and cancellations.',
  );
}
