import {
  prompt,
  words,
  times,
  other,
  metrics,
  history,
  joined,
  path,
  transit,
  steady,
  buffered,
  slowServer,
  flush,
  stream,
} from './model.mjs';
import {
  C,
  lerp,
  cue,
  rect,
  line,
  dot,
  txt,
  mono,
  bracket,
  panel,
  note,
  cursor,
  axis,
  spot,
} from './art.mjs';

export function opening(c, k) {
  const t = Math.round(
    80 +
      35 * cue(k, 0, 'Watch these two cursors', 0.9) +
      197 * cue(k, 0, 'A is still silent', 2.5) +
      8 * cue(k, 1, 'A finally starts', 0.45) +
      108 * cue(k, 1, 'then catches B', 1.35),
  );
  const endpoint = t === 428,
    diagnosis = cue(k, 2, 'For the blank screen');
  const x = (n) => 800 + n * 2.18;
  panel(c, 80, 243, 1760, 547);
  mono(c, 'PROMPT   The birds sing softly', 135, 297, 32, C.dim);
  mono(c, 'SERVER CLOCK    ' + t + ' ms', 1782, 297, 31, C.light, 'right');
  [times, other].forEach((ts, i) => {
    const y = 436 + i * 214,
      col = i ? C.gold : C.mint;
    const count = ts.filter((n) => n <= t).length;
    mono(c, i ? 'B' : 'A', 140, y, 43, col);
    cursor(c, joined(words.slice(0, count)), 218, y, col, 54);
    axis(c, x(0), x(440), y, 0, 440, 20);
    line(c, x(t), y - 33, x(t), y + 35, C.dim, 2);
    for (let j = 0; j < count; j++) {
      dot(c, x(ts[j]), y, 10, col);
      mono(c, words[j], x(ts[j]), y - 44, 28, col, 'center');
    }
    mono(c, '0', x(0), y + 42, 27, C.dim, 'center');
    if (diagnosis)
      bracket(
        c,
        i ? x(ts[1]) : x(0),
        x(i ? ts[2] : ts[0]),
        y + 62,
        (i ? metrics(ts).gaps[1] : ts[0]) + ' ms',
        col,
      );
  });
  if (endpoint) {
    c.setLineDash([7, 7]);
    line(c, x(t), 480, x(t), 590, C.dim, 2);
    c.setLineDash([]);
  }
  note(
    c,
    diagnosis
      ? 'A waited for the first word. B waited between words.'
      : endpoint
        ? 'Both periods left at 428 ms. Where was the wait?'
        : 'Both requests reached the server at 0 ms.',
  );
}

function kvPair(c, x, y, w, h, label, ink = C.teal) {
  rect(c, x, y, w, h, C.paper, ink);
  rect(c, x + 3, y + 3, w / 2 - 4, h * 0.48, C.teal);
  rect(c, x + w / 2, y + 3, w / 2 - 3, h * 0.48, C.blue);
  mono(c, 'K', x + w * 0.25, y + h * 0.25, 24, C.light, 'center');
  mono(c, 'V', x + w * 0.75, y + h * 0.25, 24, C.light, 'center');
  txt(c, label, x + w / 2, y + h * 0.74, 30, C.ink, 'Mono', 'center');
}
export function prefill(c, k) {
  const selected = cue(k, 0, 'Now follow the row'),
    mask = cue(k, 1, 'The first two');
  const paired = cue(k, 1, 'each consumed position', 1.4);
  const emitted = cue(k, 2, 'out comes');
  const x = 380,
    y = 354,
    s = 104;
  mono(c, 'Keys in prompt order', x, y - 98, 28);
  prompt.forEach((w, i) => {
    mono(c, w, x + i * s + s / 2, y - 36, 26, C.ink, 'center');
    mono(c, w, x - 30, y + i * s + s / 2, 32, i === 1 && selected ? C.teal : C.ink, 'right');
    for (let j = 0; j < 4; j++) {
      const active = mask && j <= i;
      rect(
        c,
        x + j * s + 3,
        y + i * s + 3,
        s - 6,
        s - 6,
        active ? (i === 1 ? C.teal : '#b1c9c0') : C.shade,
      );
      if (mask && !active)
        line(c, x + j * s + 31, y + i * s + 70, x + j * s + 69, y + i * s + 32, '#b6baad', 3);
      if (active)
        dot(c, x + (j + 0.5) * s, y + (i + 0.5) * s, i === 1 ? 10 : 7, i === 1 ? C.light : C.teal);
    }
    if (selected && i === 1) rect(c, x - 7, y + i * s - 2, 4 * s + 14, s + 4, null, C.teal, 4);
  });
  mono(c, 'Query position', 100, 790, 27);
  line(c, 912, 275, 912, 783, C.grid, 2);
  mono(c, 'One full-attention layer', 992, 293, 31);
  for (let i = 0; i < 4; i++) {
    const xx = 994 + i * 193;
    rect(c, xx, 394, 165, 130, C.shade, C.grid);
    if (paired > i / 4) kvPair(c, xx, 394, 165, 130, prompt[i]);
  }
  if (emitted) {
    mono(c, 'First output', 996, 617, 30);
    txt(c, 'at', 998, 706, 90, C.rust, 'Serif');
  }
  note(
    c,
    emitted
      ? 'Four consumed prompt positions. One emitted word awaits its turn.'
      : mask
        ? 'Each position can attend to its own prefix.'
        : 'All four input positions are known within this layer.',
  );
}
export function decode(c, k) {
  const consume = [cue(k, 0, 'Feed'), cue(k, 1, 'Consume'), cue(k, 2, 'Consume')];
  const emit = [
    cue(k, 0, 'The model predicts'),
    cue(k, 1, 'The next word is'),
    cue(k, 2, 'The model emits'),
  ];
  const n = consume.reduce((a, b) => a + b, 0),
    o = 1 + emit.reduce((a, b) => a + b, 0);
  const deleted = cue(k, 3, 'clear its saved pairs') && !cue(k, 3, 'Keep the cache instead');
  const rebuilt = cue(k, 3, 'It must rebuild', 2.1);
  const h = history(n, o, deleted ? rebuilt : 1);
  const visiblePairs = h.pairs.length;
  panel(c, 80, 240, 1760, 206);
  mono(c, 'EMITTED', 142, 297, 28, C.dim);
  cursor(c, joined(h.output), 142, 371, C.gold, 60);
  mono(c, 'The birds sing softly', 1770, 350, 34, C.dim, 'right');
  mono(c, 'Saved pairs in one layer', 112, 521, 34);
  if (n === o && !deleted) {
    const slot = 114 + (prompt.length + n - 1) * 214 + 96;
    line(c, slot, 447, slot, 590, C.teal, 4);
    line(c, slot - 10, 577, slot, 590, C.teal, 4);
    line(c, slot + 10, 577, slot, 590, C.teal, 4);
    mono(c, 'consume “' + words[n - 1] + '”', slot - 22, 515, 28, C.teal, 'right');
  }
  for (let i = 0; i < 8; i++) {
    const x = 114 + i * 214;
    rect(c, x, 600, 193, 134, C.shade, C.grid);
    if (i < visiblePairs) kvPair(c, x, 600, 193, 134, h.pairs[i]);
    else if (deleted && i < h.positions.length)
      mono(c, h.positions[i], x + 96, 668, 28, C.muted, 'center');
    else if (i === h.positions.length) mono(c, 'empty', x + 96, 668, 28, C.muted, 'center');
  }
  mono(c, visiblePairs + ' cached   /   ' + h.output.length + ' emitted', 115, 802, 32, C.teal);
  if (deleted)
    note(
      c,
      'Rebuild ' +
        visiblePairs +
        ' / ' +
        h.positions.length +
        ' historical pairs for the next full-history step.',
    );
  else if (cue(k, 3, 'Keep the cache instead'))
    note(c, 'Replay with cache intact   ·   7 historical pairs available   ·   0 rebuilt');
  else if (k.beat.beatIndex >= 2 && o === 4)
    note(c, 'Full history, at least one output     P + O − 1  =  4 + 4 − 1  =  7 positions');
  else note(c, 'A decode step consumes one word before it predicts the next.');
}

const phaseNames = ['Queue', 'Tokenize', 'Prefill', 'Sample'];
const phaseColors = [C.rust, C.blue, C.teal, C.ink];
export function firstClock(c, k) {
  const cut = cue(k, 1, 'Remove the queue', 1.5),
    restore = cue(k, 2, 'Restore the queue', 0.85);
  const compare = k.beat.beatIndex >= 1,
    client = cue(k, 2, 'This client sent');
  const active = path(client ? 70 : Math.round(70 * (1 - cut + restore))),
    base = path(70);
  const x = (n) => 410 + (n + 30) * 3.02;
  function spans(p, y, name) {
    mono(c, name, 99, y, 34, C.ink);
    axis(c, x(-30), x(437), y, -30, 437, 10, C.grid);
    let end = 0;
    p.spans.forEach((v, i) => {
      if (v) rect(c, x(end), y - 15, x(end + v) - x(end), 30, phaseColors[i]);
      end += v;
    });
    line(c, x(end), y - 39, x(end), y + 35, C.ink, 4);
    p.times.forEach((v, i) => {
      dot(c, x(v), y, 8, C.ink);
      mono(c, words[i], x(v), y - 52, 28, C.ink, 'center');
    });
    bracket(c, x(0), x(end), y + 48, 'server TTFT   ' + end + ' ms', C.teal);
  }
  phaseNames.forEach((n, i) => {
    const xx = 106 + i * 448;
    rect(c, xx, 254, 12, 74, phaseColors[i]);
    mono(c, n, xx + 29, 271, 29);
    txt(c, active.spans[i] + ' ms', xx + 28, 319, 42, phaseColors[i], 'Mono');
  });
  spans(base, 465, 'Recorded');
  if (compare) spans(active, 660, restore === 1 ? 'Restored' : 'Replay');
  if (client) {
    bracket(
      c,
      x(-30),
      x(active.first + 30),
      792,
      'send −30 ms      →      visible ' + (active.first + 30) + ' ms',
      C.rust,
    );
  }
  note(
    c,
    client
      ? 'Client TTFT   ' + (active.first + 30) + ' − (−30) = ' + active.client + ' ms'
      : compare
        ? 'Replay queue   ' + active.spans[0] + ' ms     ·     Prefill   ' + active.spans[2] + ' ms'
        : 'Same request, from arrival to first emission',
  );
}

function divider(c, a, b, y, label) {
  const mid = (a + b) / 2,
    hinge = y + 112;
  line(c, a, y, mid, hinge, C.teal, 6);
  line(c, b, y, mid, hinge, C.teal, 6);
  dot(c, mid, hinge, 14, C.teal);
  dot(c, mid, hinge, 5, C.paper);
  if (label) mono(c, label, mid, hinge + 58, 38, C.teal, 'center');
}
export function cadence(c, k) {
  const b = k.beat.beatIndex,
    m = metrics(times);
  if (b === 3) {
    const rateResult = cue(k, 3, 'Averaging those rates'),
      gapResult = cue(k, 3, 'Its reciprocal');
    const samples = [10, 100],
      rates = samples.map((t) => 1000 / t);
    mono(c, 'Two requests, one measured gap in each', 100, 260);
    samples.forEach((g, i) => {
      const y = 374 + i * 171;
      mono(c, 'Request ' + (i + 1), 110, y, 31);
      line(c, 395, y, 395 + g * 6.4, y, C.teal, 10);
      dot(c, 395, y, 13, C.teal);
      dot(c, 395 + g * 6.4, y, 13, C.teal);
      mono(c, g + ' ms', 407 + g * 6.4, y + 48, 29, C.teal, 'center');
      txt(c, rates[i] + ' tokens/s', 1235, y, 50, C.ink, 'Mono');
    });
    if (rateResult)
      txt(
        c,
        'Mean of rates    ' + (rates[0] + rates[1]) / 2 + ' tokens/s',
        111,
        721,
        49,
        C.teal,
        'Serif',
      );
    if (gapResult)
      mono(c, '1 / mean gap    ≈ ' + (1000 / 55).toFixed(1) + ' tokens/s', 111, 798, 38, C.rust);
    note(c, 'Report which operation you averaged across requests.');
    return;
  }
  const full = cue(k, 2, 'Slide the start back', 1.35);
  const xmin = lerp(310, 0, full);
  const left = lerp(260, 180, full),
    right = 260 + 165 * 9.02;
  const x = (t) => left + ((t - xmin) * (right - left)) / (475 - xmin);
  const walk = cue(k, 0, 'Walk a divider', 1.5);
  mono(c, 'Server emissions   /   milliseconds since arrival', 100, 267, 32);
  axis(c, x(xmin), x(475), 496, xmin, 475, full === 1 ? 20 : 5, C.grid);
  times.forEach((v, i) => spot(c, x(v), 496, v, words[i], C.ink, 96, -43));
  if (full === 1) spot(c, x(0), 496, '0', 'arrival', C.muted, 62, 40);
  if (full === 0)
    m.gaps.forEach((gap, i) => {
      if (i === 0 || walk > (i - 1) * 0.5)
        divider(c, x(times[i]), x(times[i + 1]), 496, b >= 1 ? gap + ' ms' : '');
    });
  else
    bracket(
      c,
      x(lerp(times[0], 0, full)),
      x(times[3]),
      660,
      full === 1 ? 'all 4 outputs' : '',
      C.teal,
    );
  let label = 'Count the spaces between emissions.';
  if (b === 1)
    label = 'Time per output token     (' + m.gaps.join(' + ') + ') / 3 = ' + m.mean + ' ms';
  if (b === 2)
    label =
      full === 1
        ? 'Full-request rate     4 / 0.428 s = ' + m.full.toFixed(2) + ' tokens/s'
        : full > 0
          ? 'Move the start of the counting window to server arrival.'
          : 'Decode rate     3 / 0.108 s ≈ ' + m.rate.toFixed(1) + ' tokens/s';
  note(c, label);
}

export function delivery(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) return compareDelivery(c, k);
  const route = cue(k, 0, 'Give each token', 1.6);
  const t =
    b === 0
      ? Math.round(lerp(317, 458, route))
      : Math.round(
          385 +
            7 * cue(k, 1, 'server sends', 0.7) +
            36 * cue(k, 1, 'then the period', 0.85) +
            42 * cue(k, 2, 'One jump', 0),
        );
  const arrivals = b === 0 ? steady : buffered,
    s = stream(t, arrivals);
  const x = (n) => 260 + (n - 310) * 9.02;
  panel(c, 80, 236, 1760, 568);
  mono(c, 'SERVER', 116, 287, 27, C.dim);
  mono(c, 'CLIENT', 116, 571, 27, C.dim);
  axis(c, x(310), x(477), 374, 310, 477, 5);
  axis(c, x(310), x(477), 627, 310, 477, 5);
  // The upper rail is the recorded server trace, including future replay marks.
  times.forEach((v, i) => {
    const col = s.sent > i ? C.mint : C.dim;
    spot(c, x(v), 374, v, words[i], col, 57, 40);
    if (i < s.received) {
      if (b === 0 || i < 2) line(c, x(v), 441, x(arrivals[i]), 543, C.rail, 3);
      else {
        line(c, x(v), 441, x(flush) - 80, 508, C.rail, 3);
        line(c, x(flush) - 80, 508, x(flush), 543, C.gold, 4);
      }
      if (i === 0 || arrivals[i] !== arrivals[i - 1]) {
        const group = i === 2 && b > 0 ? 'too.' : words[i];
        spot(c, x(arrivals[i]), 627, arrivals[i], group, C.gold, 56, 37);
      }
    }
  });
  if (b === 1) {
    const left = 1092,
      y = 475;
    for (let i = 0; i < s.pending.length; i++)
      line(c, x(times[i + 2]), 439, left + 228 + i * 132, y, C.mint, 3);
    rect(c, left, y, 665, 66, C.navy, C.gold, 3);
    mono(c, 'buffer', left + 22, y + 33, 30, C.gold);
    for (let i = 0; i < 2; i++) {
      const cell = left + 208 + i * 135;
      rect(c, cell, y + 8, 119, 50, s.pending[i] ? C.gold : C.navy, C.rail);
      if (s.pending[i]) mono(c, s.pending[i], cell + 59, y + 33, 33, C.navy, 'center');
    }
    mono(c, 'held', left + 532, y + 33, 28, C.dim);
  }
  mono(c, 'READER', 134, 747, 28, C.dim);
  cursor(c, s.text, 310, 748, C.gold, 45);
  mono(
    c,
    b === 0 ? 'Uniform transit   +30 ms' : 'Replay   ' + t + ' ms',
    1780,
    747,
    31,
    C.dim,
    'right',
  );
  if (b === 2) {
    const average = cue(k, 2, 'Dividing by two');
    note(
      c,
      average
        ? 'Delivery gap   ' +
            (flush - buffered[1]) +
            ' ms     ÷     2 delivered tokens   =   ' +
            (flush - buffered[1]) / 2 +
            ' ms/token'
        : 'One receipt at 470 ms carries “too” and the period.',
    );
  } else
    note(
      c,
      b === 0
        ? 'The same offset preserves all three gaps.'
        : 'The reader has ' + s.received + ' tokens. The buffer holds ' + s.pending.length + '.',
    );
}
function compareDelivery(c, k) {
  const next = cue(k, 3, 'This time');
  mono(
    c,
    'Trace the third token, “too,” from the preceding emission to the common receipt.',
    100,
    266,
    29,
  );
  const x = (t) => 440 + (t - 355) * 10.7;
  [times, slowServer].slice(0, next ? 2 : 1).forEach((ts, i) => {
    const y = 430 + i * 260,
      mid = x(ts[2]),
      last = x(flush);
    mono(c, i ? 'Second run' : 'First run', 103, y, 34, C.ink);
    rect(c, x(355), y - 21, mid - x(355), 42, C.teal);
    rect(c, mid, y - 21, last - mid, 42, C.rust);
    mono(c, 355, x(355), y - 64, 31, C.ink, 'center');
    mono(c, ts[2], mid, y - 64, 31, C.teal, 'center');
    mono(c, flush, last, y - 64, 31, C.rust, 'center');
    bracket(c, x(355), mid, y + 47, ts[2] - 355 + ' ms on server', C.teal);
    bracket(c, mid, last, y + 47, flush - ts[2] + ' ms in delivery', C.rust);
  });
  note(
    c,
    next
      ? 'Match the token ID to the worker schedule and the delivery trace.'
      : 'Both clients saw “dawn” at 385 ms and the last pair at 470 ms.',
  );
}
