import {
  P,
  rect,
  plate,
  line,
  dot,
  txt,
  mono,
  strip,
  screen,
  ledger,
  heading,
  readout,
  axis,
  beat,
  cue,
  ease,
  clamp,
  mix,
} from './studio.mjs';
import {
  approvalRequest, approvalSpans, lookupCalls, workerSpan,
  tokenTimes, chunkReceipts, streamCloseMs, clientDelayMs,
  delayedTokenTimes, longStream, throughput, timings,
} from './examples.mjs';

function scope(g, x, y, w, h) {
  plate(g, x, y, w, h, '#799398', 20);
  rect(g, x + 8, y + 8, w - 16, h - 16, P.deep, 14);
  for (let xx = x + 32; xx < x + w - 20; xx += 43)
    line(g, xx, y + 23, xx, y + h - 21, '#24434b', 1);
  for (let yy = y + 30; yy < y + h - 20; yy += 40)
    line(g, x + 22, yy, x + w - 22, yy, '#24434b', 1);
}
function pulse(g, x, baseline, top, color) {
  line(g, x, baseline, x, top, color, 4);
  dot(g, x, top, 6, color);
}
export function longClock(g, c) {
  heading(
    g,
    'First light on the stream',
    'Request #206    /    dispatch clock in milliseconds',
    true,
  );
  const first = cue(c, 1, 'The first visible token', 1.2),
    tail = cue(c, 2, 'Continue the clock', 2.5);
  const ms = 240 * first + 215 * tail,
    arrivals = longStream.filter((v) => v <= ms + 1e-9);
  const x = (t) => 150 + t * 2.6;
  scope(g, 65, 210, 1470, 362);
  axis(g, 150, 480, 1300, 500, [0, 100, 200, 300, 400, 500], P.sky);
  for (const t of arrivals) pulse(g, x(t), 469, 335, t === 240 ? P.gold : P.mint);
  line(g, x(ms), 264, x(ms), 490, P.white, 2);
  mono(g, Math.round(ms) + ' ms', x(ms), 301, 27, P.paper, 'center');
  readout(
    g,
    68,
    640,
    'Dispatch → first visible',
    arrivals.length ? '240 ms' : 'Awaiting first token',
    { w: 451, dark: true, col: P.paper },
  );
  readout(g, 570, 640, 'Later arrivals', Math.max(0, arrivals.length - 1) + ' tokens', {
    w: 375,
    dark: true,
    col: P.paper,
  });
  if (tail === 1 && cue(c, 2, 'That gives', 0.8) > 0)
    readout(g, 1035, 640, '29 / 0.215 s', throughput(arrivals).toFixed(1) + ' tokens/s', {
      w: 470,
      dark: true,
      col: P.mint,
    });
  if (cue(c, 2, 'Return to the six-request window', 0.4) > 0)
    mono(g, 'Window p95   240 ms      •      Unsafe deliveries / reviewed requests   2 / 6', 70, 824, 29, P.sky);
}
function sevenScope(g, times, count, { first = 0, span = 500, bracket = false } = {}) {
  const x = (t) => 140 + ((t - first) / span) * 1320;
  scope(g, 65, 190, 1470, 400);
  axis(
    g,
    140,
    475,
    1320,
    span,
    [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500].filter((n) => n <= span),
    P.sky,
  );
  mono(g, 'ms from dispatch', 100, 560, 22, P.sky);
  const coincident = times.length > 1 && times.every((t) => t === times[0]);
  times.slice(0, count).forEach((t, i) => {
    if (coincident) {
      const tx = x(t),
        y = 448 - 29 * i;
      if (i === 0) line(g, tx, 471, tx, 274, P.sky, 2);
      dot(g, tx, y, 7, i ? P.mint : P.gold);
      mono(g, 'T' + (i + 1), tx + 25, y + 6, 20, P.paper);
      return;
    }
    const tx = x(t);
    pulse(g, tx, 471, 319, i ? P.mint : P.gold);
    if (i === 0 || t !== times[i - 1])
      mono(g, 'T' + (i + 1), tx, 292, 27, i ? P.mint : P.gold, 'center');
  });
  if (bracket) {
    for (let i = 1; i < times.length; i++) {
      const l = x(times[i - 1]),
        r = x(times[i]);
      line(g, l + 4, 402, r - 4, 402, P.white, 2);
      line(g, l + 4, 391, l + 4, 404, P.white, 2);
      line(g, r - 4, 391, r - 4, 404, P.white, 2);
      mono(g, i, (l + r) / 2, 385, 22, P.paper, 'center');
    }
  }
}
export function streamContract(g, c) {
  const b = beat(c);
  if (b <= 3) {
    const first = cue(c, 1, 'The first token lands', 0.4),
      rest = cue(c, 1, 'Watch the rest arrive', 2.3);
    const n = Number(first > 0) + Math.floor(rest * 6);
    heading(
      g,
      'The space between arrivals',
      'Individual visible tokens    /    one monotonic clock',
      true,
    );
    sevenScope(g, tokenTimes, n, { bracket: b >= 2 });
    readout(g, 72, 675, 'Visible arrivals', String(n), { w: 340, col: P.paper, dark: true });
    if (b >= 2)
      readout(g, 500, 675, 'First → last', '450 − 150 ms', { w: 425, col: P.paper, dark: true });
    if (cue(c, 3, 'That is the rate', 0) > 0)
      readout(g, 1040, 675, '6 gaps / 0.300 s', throughput(tokenTimes) + ' tokens/s', {
        w: 460,
        col: P.mint,
        dark: true,
      });
    return;
  }
  if (b === 4) {
    const same = cue(c, 4, 'Put all seven', 0.3) > 0;
    const times = same ? Array(7).fill(150) : [150];
    heading(
      g,
      'A clock with no later interval',
      same ? '7 arrivals recorded at one timestamp' : 'One visible token',
      true,
    );
    sevenScope(g, times, times.length);
    readout(g, 72, 675, 'Recorded arrivals', times.length + ' at 150 ms', {
      w: 490,
      col: P.paper,
      dark: true,
    });
    readout(g, 710, 675, 'Later-token rate', throughput(times) === null ? 'Undefined' : '', {
      w: 690,
      col: P.gold,
      dark: true,
    });
    return;
  }
  if (b === 5) {
    heading(g, 'Invalid measurements', 'Validate the stream before aggregation', true);
    ledger(
      g,
      ['Input', 'Finding'],
      [
        ['Missing timestamp', 'Incomplete clock'],
        ['Counter = "7"', 'Malformed count'],
        ['First = −1 ms', 'Negative timestamp'],
        ['Last < first', 'Impossible order'],
      ],
      { step: 95, widths: [675, 785] },
    );
    mono(g, 'Independent quality verdict remains available', 76, 785, 31, P.mint);
    return;
  }
  if (b === 6) {
    heading(g, 'What did the client receive?', 'One timestamp per chunk    /    ms from dispatch', true);
    scope(g, 65, 200, 1470, 390);
    const px = (ms) => 140 + (1320 * ms) / 650;
    axis(g, 140, 510, 1320, 650, [0, 100, 200, 300, 400, 500, 600], P.sky);
    const phrases = ['The empty chunk', 'The next chunk', 'The last four'];
    const received = chunkReceipts.filter((_, i) => cue(c, 6, phrases[i], 0));
    for (const [i, { ms, tokens }] of received.entries()) {
      const x = px(ms), ink = tokens.length ? P.mint : P.sky;
      const payload = tokens.length ? tokens.map((id) => 'T' + id).join(' ') : 'No text';
      rect(g, x - 142, 279, 284, 112, '#203d46', 6);
      mono(g, 'Chunk ' + (i + 1), x, 317, 22, ink, 'center');
      mono(g, payload, x, 365, 31, P.paper, 'center');
      pulse(g, x, 506, 394, ink);
    }
    const closed = cue(c, 6, 'The stream closes', 0) > 0;
    if (closed) {
      pulse(g, px(streamCloseMs), 506, 433, P.gold);
      mono(g, 'Close', px(streamCloseMs), 413, 26, P.gold, 'center');
    }
    const visible = received.filter(({ tokens }) => tokens.length);
    readout(g, 72, 673, 'First visible text', visible.length ? visible[0].ms + ' ms' : 'Pending',
      { w: 396, col: P.mint, dark: true });
    readout(g, 550, 673, 'Most recent text', visible.length ? visible.at(-1).ms + ' ms' : 'Pending',
      { w: 396, col: P.mint, dark: true });
    readout(g, 1030, 673, 'Stream closes', closed ? streamCloseMs + ' ms' : 'Open',
      { w: 450, col: P.paper, dark: true });
    return;
  }
  const shift = Math.round(clientDelayMs * ease(cue(c, 7, 'delay the client', 1.6)));
  const clientTimes = delayedTokenTimes(shift);
  heading(
    g,
    'When do individual tokens reach the client?',
    'One token per delivery    /    clocks aligned at dispatch    /    ms',
    true,
  );
  scope(g, 65, 200, 1470, 395);
  const px = (t) => 180 + t * 1.52;
  axis(g, 180, 528, 1216, 800, [0, 150, 300, 450, 600, 750], P.sky);
  for (const [j, label] of ['Server', 'Client'].entries()) {
    const y = 317 + 118 * j;
    mono(g, label, 92, y, 23, P.paper);
    const times = j ? clientTimes : tokenTimes;
    times.forEach((t) => pulse(g, px(t), y + 20, y - 32, j ? P.mint : P.gold));
  }
  readout(g, 72, 673, 'Server T1 → T7', tokenTimes[0] + ' → ' + tokenTimes.at(-1) + ' ms',
    { w: 424, col: P.gold, dark: true });
  readout(g, 564, 673, 'Added delivery delay', shift + ' ms', { w: 390, col: P.paper, dark: true });
  readout(g, 1030, 673, 'Client T1 → T7', clientTimes[0] + ' → ' + clientTimes.at(-1) + ' ms',
    { w: 450, col: P.mint, dark: true });
}
export function percentile(g, c) {
  const b = beat(c),
    order = [...timings].sort((a, b) => a - b);
  const p = ease(cue(c, 1, 'from fastest to slowest', 2));
  const k = Math.ceil(0.95 * order.length);
  const rank = cue(c, 1, 'That last tile', 0) > 0,
    result = cue(c, 1, 'With only eight', 0) > 0;
  heading(g, 'Nearest rank', 'W1    /    same route    /    completed first outputs in ms');
  mono(g, 'Observed order', 70, 233, 24, P.dim);
  mono(g, 'Fastest → slowest', 70, 434, 24, P.dim);
  const placed = Math.floor(p * order.length);
  for (const [i, v] of timings.entries()) {
    const target = order.indexOf(v);
    strip(
      g,
      70 + i * 183,
      257,
      163,
      87,
      String(v),
      target < placed ? '#d4dbcf' : P.white,
      P.ink,
      43,
    );
    const x = 70 + target * 183;
    if (target < placed)
      strip(g, x, 455, 163, 87, String(v), rank && target === k - 1 ? P.gold : P.white, P.ink, 43);
    else line(g, x, 540, x + 163, 540, P.line, 3);
  }
  if (rank) mono(g, 'Rank ' + k, 70 + (k - 1) * 183 + 81, 590, 29, P.red, 'center');
  readout(g, 75, 655, 'Rank for 8 observations', rank ? 'ceil(0.95 × 8) = 8' : 'ceil(0.95 × n)', {
    w: 520,
  });
  if (result) readout(g, 680, 655, 'p95 first output', order[k - 1] + ' ms', { w: 360 });
  if (b === 2) readout(g, 1090, 655, 'Separate population', 'No output / canceled', { w: 420 });
}
export function runtime(g, c) {
  const b = beat(c);
  if (b <= 2) {
    const slowClient = cue(c, 2, 'slow client delivery', 0.5) > 0;
    const n = slowClient ? 0 : Math.floor(5 * cue(c, 1, 'queue pressure', 1));
    heading(
      g,
      'Where is the wait?',
      slowClient
        ? 'Slow client delivery    /    illustrative workload'
        : 'Self-hosted inference    /    illustrative workload',
      true,
    );
    screen(g, 68, 235, 814, 380, 'Waiting requests');
    for (let j = 0; j < n; j++) strip(g, 111 + j * 143, 385, 120, 85, 'R' + (j + 1), P.white);
    if (n === 0) txt(g, 'Queue empty', 466, 465, 42, P.paper, 'Serif', 'center');
    screen(g, 933, 235, 603, 380, 'KV cache slots');
    for (let j = 0; j < 12; j++)
      rect(
        g,
        979 + (j % 4) * 121,
        324 + Math.floor(j / 4) * 73,
        98,
        48,
        j < (slowClient ? 2 : n * 2) ? P.mint : '#35535d',
        5,
      );
    mono(
      g,
      'Arrivals/s    •    active streams    •    latency    •    errors',
      78,
      736,
      30,
      P.paper,
    );
  } else if (b <= 4) {
    heading(
      g,
      'One prompt, then successive tokens',
      'Illustrative dependency diagram    /    measure at the batch size you serve',
      true,
    );
    const n = Math.floor(4 * cue(c, 3, 'Autoregressive decoding', 2));
    txt(g, 'Prefill', 80, 314, 55, P.paper, 'Serif');
    for (let i = 0; i < 4; i++) strip(g, 400 + i * 173, 240, 145, 94, 'P' + (i + 1), P.sky);
    line(g, 398, 377, 1070, 377, P.sky, 4);
    mono(g, 'Multiple prompt positions', 400, 430, 31, P.sky);
    txt(g, 'Decode', 80, 624, 55, P.paper, 'Serif');
    for (let i = 0; i < n; i++) {
      if (i) line(g, 385 + i * 250, 595, 400 + i * 250, 595, P.mint, 5);
      strip(g, 400 + i * 250, 543, 235, 100, 'Token ' + (i + 1), P.mint);
    }
    mono(g, 'Read weights and cached state for each decoding step', 80, 788, 30, P.paper);
  } else {
    heading(
      g,
      'Which clock produced this number?',
      'GenAI conventions    /    revision cc07f722',
      true,
    );
    ledger(
      g,
      ['Clock', 'Start and stop', 'Unit'],
      [
        ['Application', 'Dispatch → first visible token', 'ms'],
        ['Client operation', 'Client operation start → first chunk', 's'],
        ['Server generation', 'Server timer → first generated token', 's'],
      ],
      { step: 98, widths: [345, 925, 190] },
    );
    if (b === 6) txt(g, '240 ms = 0.24 s', 82, 764, 60, P.mint, 'Serif');
  }
}
export function trace(g, c) {
  const b = beat(c);
  const { retrieval, chat, gate } = approvalSpans;
  const t1 = cue(c, 1, 'Retrieval finishes', 0.8),
    t2 = cue(c, 2, 'The chat operation', 1.1),
    t3 = cue(c, 2, 'The gate finishes', 0.7);
  const ms = retrieval.end * t1 + (chat.end - retrieval.end) * t2 + (gate.end - chat.end) * t3;
  heading(g, 'Inside request #' + approvalRequest.id,
    'One trace   /   span 0 owns three sibling operations', true);
  scope(g, 65, 200, 1470, 512);
  const x = (t) => 410 + t * 1.73;
  axis(g, x(0), 628, x(gate.end) - x(0), gate.end, [0, retrieval.end, chat.end, gate.end], P.sky);
  const parts = [
    [retrieval, 0, t1],
    [chat, retrieval.end, t2],
    [gate, chat.end, t3],
  ];
  parts.forEach(([span, start, progress], j) => {
    const y = 295 + j * 117;
    mono(g, span.id + '  ' + span.name, 98, y + 19, 30, P.paper);
    line(g, x(0), y, x(gate.end), y, '#35525a', 2);
    const width = (x(span.end) - x(start)) * progress;
    rect(g, x(start), y - 24, width, 48, j === 0 ? P.sky : P.mint, 5);
    if (progress === 1) txt(g, span.output, 1194, y + 15, 31, P.paper, 'Serif', 'left', 292);
  });
  if (ms > 0) line(g, x(ms), 234, x(ms), 628, P.gold, 2);
  const defect = cue(c, 4, 'Compare its draft', 0) > 0,
    escape = cue(c, 4, 'Compare the draft', 0) > 0;
  mono(g, defect ? 'First defect  →  span ' + chat.id : '', 78, 785, 31, P.gold);
  mono(g, escape ? 'Containment escape  →  span ' + gate.id : '', 812, 785, 31, P.gold);
  if (b === 5) mono(g, 'Replay with the prompt, policy and gate configuration', 79, 841, 23, P.sky);
}
export function wire(g, c) {
  const b = beat(c);
  if (b >= 5) {
    const restored = cue(c, 5, 'span one becomes', 0.4) > 0;
    heading(g, 'Unwind the local span stack', 'An exception leaves the inner operation');
    strip(g, 135, 483, 610, 97, 'span 1   /   caller', P.sky);
    if (!restored) strip(g, 176, 365, 531, 97, 'span 2   /   inner', P.gold);
    readout(g, 880, 360, 'Current local parent', restored ? 'span 1' : 'span 2', { w: 560 });
    if (b === 6)
      txt(g, 'Check context on the queue and spans at the exporter.', 135, 751, 43, P.dim, 'Serif');
    return;
  }
  const lost = b === 2 && cue(c, 2, 'Drop that context', 0.2) > 0;
  const p = cue(c, 1, 'The caller sends', 1.4);
  heading(g, 'Two spans named lookup', 'Trace T    /    IDs abbreviated for display');
  screen(g, 66, 265, 543, 310, 'Caller');
  lookupCalls.forEach((call, i) =>
    mono(g, call.tool + '  •  span ' + call.spanId, 110, 410 + i * 90, 31, i === 0 ? P.paper : P.sky),
  );
  screen(g, 1000, 265, 532, 310, 'Remote worker');
  if (p === 1) {
    mono(g, lost ? 'new trace U' : 'trace T  •  span ' + workerSpan.spanId, 1043, 406, 31, P.paper);
    mono(g, lost ? 'no caller link' : 'parent ' + workerSpan.parentId, 1043, 492, 34, lost ? P.gold : P.mint);
  }
  if (!lost) {
    line(g, 610, 431, 998, 431, P.dim, 4);
    strip(g, mix(610, 715, ease(p)), 391, 222, 80, 'T / ' + workerSpan.parentId, P.gold, P.ink, 32);
  }
  if (b >= 3)
    mono(
      g,
      'traceparent   version  /  16-byte trace ID  /  8-byte parent ID  /  flags',
      79,
      700,
      28,
    );
  if (b === 4)
    txt(
      g,
      'Sampled flag → recording       Service access check → permission',
      80,
      792,
      37,
      P.teal,
      'Serif',
    );
}
export function attributes(g, c) {
  const b = beat(c);
  const { chat } = approvalSpans;
  heading(g, chat.name + ' span ' + chat.id + ' for request #' + approvalRequest.id,
    'Pinned GenAI conventions    /    synthetic provider');
  const model = cue(c, 1, 'Request model', 0.3) > 0;
  ledger(
    g,
    ['Standard operation fields', 'Value'],
    [
      ['gen_ai.operation.name', chat.name.toLowerCase()],
      ['gen_ai.provider.name', 'local-platform'],
      ['gen_ai.request.model', model ? 'model-A' : 'Awaiting model ID'],
    ],
    { w: 726, widths: [413, 313], step: 86, y: 226 },
  );
  if (b >= 2) {
    const pending = b === 4 && cue(c, 4, 'Omit a pending unsafe verdict', 0.3) > 0;
    ledger(
      g,
      [pending ? 'Before review' : 'Product fields', 'Value'],
      [
        ['route / delivered', 'serve / true'],
        ['evidence version', 'policy v17'],
        ['defect / escape', pending ? 'Awaiting review' : 'generation / gate'],
        ['review', pending ? 'Pending · verdict omitted' : 'Unsafe'],
      ],
      { x: 826, w: 704, widths: [339, 365], step: 86, y: 226 },
    );
  }
  const unknown = b === 2 && cue(c, 2, 'An unknown prompt', 0.3) > 0;
  if (b === 2 || b === 3)
    readout(
      g,
      80,
      671,
      'Prompt registry',
      unknown ? 'Unknown ID → reject' : 'deploy-answerer  /  v1.1',
      { w: 1090 },
    );
  if (b === 4)
    txt(
      g,
      'Message content and tool arguments require opt-in capture.',
      82,
      762,
      44,
      P.red,
      'Serif',
    );
  if (b === 5)
    txt(
      g,
      'Metric dimensions   route × version       Exemplar   request #' + approvalRequest.id,
      80,
      762,
      43,
      P.teal,
      'Serif',
    );
}
