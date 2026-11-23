import {
  P,
  frame,
  label,
  rect,
  line,
  dot,
  footer,
  mono,
  center,
  ruler,
  nice,
  phase,
} from './art.mjs';
import {
  cache,
  hybrid,
  pages,
  events,
  tokens,
  gaps,
  meanGap,
  trials,
  passingRate,
  slotIntervals,
  inFlightAt,
  slotSampleTime,
} from './examples.mjs';

export function memory(c, k) {
  if (k.beat.beatIndex >= 5) return mixedMemory(c, k);
  if (k.beat.beatIndex >= 3) return pageMap(c, k);
  const grow = phase(k, 1, 'Let each history grow', 3.9);
  const s = cache(4096 + 1024 * Math.round(12 * grow));
  frame(
    c,
    'Memory fit   /   Five live histories',
    'Will the fifth history fit?',
    'Dedicated KV pool   /   8 GiB',
  );
  label(
    c,
    'K and V × 32 full-attention layers × 8 KV heads × 128 values × 2 B',
    104,
    313,
    37,
    P.sub,
  );
  label(c, '128 KiB per retained token', 104, 371, 36, P.ink, { bold: true });
  const x = (g) => 124 + 164 * g,
    wall = x(8);
  label(c, '5 histories   /   ' + nice(s.tokens) + ' tokens each', 121, 472, 43, P.ink, {
    font: 'Serif',
  });
  rect(c, x(0), 580, wall - x(0), 113, P.quiet, 8);
  for (let i = 0; i < 5; i++) {
    const start = x(i * s.each) + 2,
      end = x((i + 1) * s.each) - 2;
    rect(c, start, 597, Math.min(end, wall) - start, 78, P.run, 4);
    rect(c, Math.max(start, wall), 597, end - Math.max(start, wall), 78, P.fail, 4);
    label(c, 'R' + (i + 1), (start + end) / 2, 636, 30, P.white, { font: 'Mono', align: 'center' });
  }
  line(c, wall, 526, wall, 702, P.wait, 4, [6, 5]);
  label(c, '8 GiB wall', wall, 505, 32, P.wait, center);
  ruler(c, x(0), x(10), 714, 0, 10, [0, 2, 4, 6, 8, 10], (t) => t + ' GiB');
  footer(
    c,
    'Each history   ' +
      s.each +
      ' GiB     /     Five histories   ' +
      s.total +
      ' GiB     /     ' +
      (s.total <= 8 ? 'All five fit' : Math.min(5, s.fit) + ' of five fit'),
    s.total <= 8 ? P.run : P.fail,
  );
}
function pageMap(c, k) {
  const resolved = phase(k, 4, 'The sequences need');
  frame(
    c,
    'Memory fit   /   Paged allocation',
    'Where are the unused token positions?',
    '16 slots per page',
  );
  label(c, 'No shared blocks or lookahead', 102, 318, 35, P.sub);
  pages.rows.forEach((r, i) => {
    const y = 399 + 141 * i;
    label(c, r.tokens + ' tokens', 107, y + 40, 40);
    for (let j = 0; j < r.blocks; j++) {
      const x = 410 + j * 259;
      rect(c, x, y, 241, 82, P.quiet, 9, P.metal, 2);
      for (let s = 0; s < 16; s++) {
        const used = 16 * j + s < r.tokens;
        rect(c, x + 9 + s * 14, y + 15, 11, 52, used ? P.run : resolved ? P.gold : P.light, 2);
      }
    }
    if (resolved)
      label(c, '15 free', 410 + (r.blocks - 1) * 259 + 120, y + 105, 28, P.wait, center);
  });
  footer(
    c,
    resolved
      ? pages.blocks +
          ' pages × 16 = ' +
          pages.slots +
          ' slots. ' +
          pages.tokens +
          ' used, ' +
          pages.slack +
          ' unused.'
      : 'Round up the pages for each sequence. Its final page belongs to that sequence.',
  );
}
function mixedMemory(c, k) {
  const fixed = phase(k, 5, 'Each also owns'),
    qualified = phase(k, 6, 'Longer histories');
  const unit = 5.2;
  frame(
    c,
    'Memory fit   /   Hybrid state',
    'Which part grows with history length?',
    '6 requests   /   2,048 positions each',
  );
  label(c, 'K and V × 12 layers × 4 heads × width 64 × 2,048 positions × 2 B', 104, 324, 36, P.sub);
  label(c, 'Each request', 104, 436, 42, P.ink, { font: 'Serif' });
  label(c, 'Growing KV', 105, 530, 36, P.run);
  label(c, 'Fixed state', 105, 641, 36, P.wait);
  for (let i = 0; i < hybrid.requests; i++) {
    const x = 448 + i * 218;
    label(c, 'R' + (i + 1), x + 75, 437, 29, P.sub, { font: 'Mono', align: 'center' });
    rect(c, x, 497, unit * hybrid.per, 63, P.run, 5);
    label(c, hybrid.per + ' MiB', x + (unit * hybrid.per) / 2, 529, 27, P.white, center);
    if (fixed) {
      rect(c, x, 609, unit * hybrid.fixed, 63, P.gold, 5);
      label(c, hybrid.fixed + ' MiB', x + (unit * hybrid.fixed) / 2, 641, 23, P.ink, center);
    }
  }
  if (qualified) {
    const x = 450,
      w = 5.15;
    rect(c, x, 739, w * hybrid.growth, 70, P.run, 5);
    rect(c, x + w * hybrid.growth, 739, w * hybrid.recurrent, 70, P.gold, 5);
    label(c, hybrid.growth + ' MiB KV', x + (w * hybrid.growth) / 2, 773, 34, P.white, center);
    label(
      c,
      hybrid.recurrent + ' MiB fixed',
      x + w * (hybrid.growth + hybrid.recurrent / 2),
      773,
      34,
      P.ink,
      center,
    );
  }
  footer(
    c,
    qualified
      ? hybrid.growth +
          hybrid.recurrent +
          ' MiB payload before weights, allocation slack and runtime overhead.'
      : 'Only the full-attention layers append a new key and value at each position.',
  );
}

export function delivery(c, k) {
  const show = [
    phase(k, 2, 'one token at'),
    phase(k, 2, 'two together at three hundred'),
    phase(k, 2, 'two together at four hundred'),
  ];
  const measured = phase(k, 3, 'Across five delivered');
  const mean = phase(k, 3, 'Bundled delivery hides');
  frame(
    c,
    'Client trace   /   Output events',
    'What can the receiving clock measure?',
    'Request sent at 0 ms',
  );
  const x = (t) => 131 + t * 3.81,
    base = 606;
  ruler(c, x(0), x(420), base, 0, 420, [0, 100, 200, 300, 410], (t) => t + ' ms');
  label(c, 'Response events', 104, 325, 40, P.sub);
  for (let i = 0; i < events.length; i++) {
    if (!show[i]) continue;
    const e = events[i],
      xx = x(e.at);
    line(c, xx, 448, xx, base, P.metal, 3);
    for (let j = 0; j < e.n; j++) rect(c, xx - 29, 509 - j * 62, 58, 52, P.run, 7);
    label(c, e.at + ' ms', xx, 402, 35, P.ink, center);
  }
  if (show[0]) {
    line(c, x(0), 711, x(events[0].at), 711, P.wait, 4);
    dot(c, x(0), 711, 7, P.wait);
    dot(c, x(events[0].at), 711, 7, P.wait);
    label(c, 'Time to first token   250 ms', (x(0) + x(250)) / 2, 756, 30, P.wait, center);
  }
  if (measured) {
    gaps.forEach((g, i) => {
      const a = x(events[i].at),
        b = x(events[i + 1].at);
      line(c, a + 6, 711, b - 6, 711, P.run, 4);
      label(c, g + ' ms', (a + b) / 2, 753, 29, P.run, center);
    });
  }
  footer(
    c,
    mean
      ? 'Mean time per output token   (410 − 250) ÷ (' + tokens + ' − 1) = ' + meanGap + ' ms'
      : measured
        ? 'Two measured gaps between events. Five tokens give four token intervals.'
        : 'Each tile is a token. Tokens in one delivery share a timestamp.',
  );
}

export function benchmark(c, k) {
  const b = phase(k, 4, 'B qualifies');
  const revealed = phase(k, 5, 'A passed');
  const explainB = phase(k, 5, 'At eighty-nine percent');
  frame(
    c,
    'Benchmark   /   Offered load',
    'Which tested rate passed the 90% target?',
    '20 s per trial',
  );
  label(
    c,
    'Same request mix, quality checks, first-token and streaming objectives',
    104,
    319,
    35,
    P.sub,
  );
  const x = 399,
    w = 1050;
  for (let i = 0; i < (b ? 2 : 1); i++) {
    const t = trials[i],
      y = 434 + i * 196;
    label(c, 'Trial ' + ['A', 'B'][i], 103, y + 18, 44, P.ink, { font: 'Serif' });
    label(c, t.qualified + ' qualified / ' + t.offered + ' offered', x, y - 8, 35);
    const scored = (i === 0 && revealed) || (i === 1 && explainB);
    rect(c, x, y + 39, w, 57, scored ? P.blush : P.quiet, 5);
    if (scored) rect(c, x, y + 39, w * t.attainment, 57, P.run, 5);
    line(c, x + w * 0.9, y + 23, x + w * 0.9, y + 110, P.ink, 4);
    if (scored) {
      label(c, 100 * t.attainment + '%', 1498, y + 65, 42, t.attainment >= 0.9 ? P.run : P.fail, {
        font: 'Mono',
      });
      label(
        c,
        t.qualifiedRPS + ' qualified/s   ·   ' + t.offeredRPS + ' offered/s',
        x,
        y + 134,
        29,
        P.sub,
      );
    }
  }
  footer(
    c,
    explainB
      ? 'Highest passing tested rate   ' +
          passingRate +
          ' offered requests/s. Trial B misses the target.'
      : revealed
        ? 'Trial A passes at 8 offered requests/s. Compare B at the same threshold.'
        : 'The line marks 90% of all offered requests. Every reject and timeout stays in the denominator.',
  );
}

export function slotTrace(c, k) {
  const counted = phase(k, 7, 'Both requests were running');
  const holds = [
    phase(k, 7, 'six seconds'),
    phase(k, 7, 'three'),
  ];
  frame(c, 'Warm pool sizing   /   Example worker trace', 'How many slots were busy at 4 seconds?', 'One ready worker');
  label(c, 'Representative requests meeting first-token and streaming deadlines', 105, 316, 36, P.sub);
  const x = (t) => 300 + 179 * t;
  const marker = x(slotSampleTime);
  slotIntervals.forEach((r, i) => {
    const y = 449 + i * 146;
    label(c, r.id, 108, y + 33, 38, P.ink, mono);
    line(c, x(0), y + 32, x(8), y + 32, P.grid, 2, [5, 8]);
    rect(c, x(r.admitted), y, x(r.released) - x(r.admitted), 66, P.run, 6);
    label(c, 'Admit ' + r.admitted + ' s', x(r.admitted), y - 25, 28, P.ink);
    label(c, 'Release ' + r.released + ' s', x(r.released), y - 25, 28, P.ink, { align: 'right' });
    if (holds[i]) label(c, (r.released - r.admitted) + ' s held', x(r.released) - 17, y + 33, 30, P.white, { align: 'right' });
  });
  line(c, marker, 409, marker, 724, P.wait, 5, [7, 7]);
  ruler(c, x(0), x(8), 732, 0, 8, [0, 1, 2, 3, 4, 5, 6, 7, 8], (t) => t + ' s');
  footer(c, counted
    ? 'At 4 s, ' + inFlightAt(slotSampleTime) + ' requests hold slots on this worker.'
    : 'Follow the 4 s line through the intervals from admission to release.');
}
