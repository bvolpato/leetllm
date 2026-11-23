import {
  C,
  mix,
  reveal,
  rect,
  label,
  mono,
  serif,
  line,
  dot,
  plate,
  substrate,
  head,
  foot,
  document,
  die,
  wire,
  pad,
} from './drawing.mjs';
import {
  deliveries,
  readers,
  sources,
  permitted,
  retrieve,
  stream,
  bundledEvents,
  separateEvents,
  gapSamples,
  gap,
  tpot,
  offered,
  gate,
  trial,
  goodputPerMinute,
  weightsGB,
} from './examples.mjs';

function replica(c, k) {
  const b = k.beat.beatIndex;
  const move = reveal(k, 0, 'Both arrive', 0.85);
  const align = reveal(k, 1, 'Align the two sets', 1.2);
  const citations = b >= 2;
  const traceA = reveal(k, 2, 'Alice received', 0.8);
  const traceB = reveal(k, 2, 'Bob received', 0.9);
  const contained = reveal(k, 3, 'Pause Bob');
  head(
    c,
    k,
    'Shared execution',
    citations ? 'Who can read each citation?' : 'What can these requests share?',
  );
  const rows = [
    { reader: 'Alice', title: 'Design review', y: 388, color: C.A },
    { reader: 'Bob', title: 'Incident summary', y: 640, color: C.B },
  ];
  substrate(c, 723, 277, 478, 505);
  for (const [i, r] of rows.entries()) {
    const sent = reveal(k, 0, i ? 'Bob sends' : 'Alice sends', 0.85);
    const progress = 0.58 * sent + 0.42 * move;
    const x = mix(65, 116, progress);
    wire(c, x + 446, r.y + 41, 732, r.y + 41, r.color, progress);
    document(c, x, r.y - 65, 446, 174, r.title, readers[r.reader] + '  /  ' + r.reader, r.color);
    const y = mix(r.y + 4, 499, align);
    wire(c, 739, r.y + 41, 837, y + 30, C.gold, 0.75 + align * 0.25);
    if (i === 0 || align < 1) die(c, 836, y - 30, 253, 110);
    if (citations) {
      const { doc, reader } = deliveries[i];
      const t = i ? traceB : traceA;
      wire(c, 1200, r.y + 41, 1342, r.y + 41, i && contained ? C.red : r.color, t);
      if (t > 0) {
        c.save();
        c.globalAlpha = t;
        document(
          c,
          1336,
          r.y - 65,
          454,
          174,
          doc.name,
          'Source  ' + doc.tenant + '  /  ' + doc.reader,
          C[doc.tenant],
        );
        c.restore();
      }
      if (contained && !permitted(reader, doc)) {
        line(
          c,
          [
            [1284, r.y + 12],
            [1284, r.y + 67],
          ],
          C.red,
          13,
        );
        line(
          c,
          [
            [1296, r.y + 12],
            [1296, r.y + 67],
          ],
          C.red,
          7,
        );
      }
    }
  }
  mono(c, 'MODEL REPLICA', 962, 333, 29, C.cream, 'center');
  if (align === 1) mono(c, 'One frozen copy', 963, 672, 29, C.cream, 'center');
  if (!citations) {
    if (b === 1 && reveal(k, 1, 'one hundred forty-four')) {
      serif(c, weightsGB + ' GB', 1324, 478, 79);
      label(c, '72B weights × 2 bytes', 1329, 542, 36, C.muted);
      if (reveal(k, 1, 'A hundred copies')) {
        serif(c, '14.4 TB', 1324, 663, 70);
        label(c, '100 weight copies', 1329, 714, 33, C.muted);
      }
    } else {
      label(c, 'Same model revision', 1326, 492, 43, C.ink);
      label(c, 'Same trained values', 1326, 551, 35, C.muted);
    }
  }
  if (contained && reveal(k, 3, 'Bob may receive')) {
    const d = retrieve('Bob')[0];
    label(c, 'Eligible source   ·   ' + d.name + '   /   B', 1300, 802, 31, C.B);
  }
  const investigate = contained && reveal(k, 3, 'Compare queue age');
  foot(
    c,
    investigate
      ? 'Inspect queue age, free pages, preemptions and adapter misses.'
      : contained
        ? 'Delivery paused on Bob’s affected route'
        : citations
          ? 'Compare each recipient with the permitted reader.'
          : 'Two request histories enter the same replica.',
    investigate
      ? 'Placement needs 5 pages. A worker with 4 free pages must wait or reroute.'
      : contained
        ? 'Scoped audit record   ·   Bob / B   ·   Private postmortem   ·   Carol / A'
        : citations
          ? 'The source labels name the authorized workspace and reader.'
          : 'Each colored connection carries its own request identity.',
  );
}

function clockTrace(c, k) {
  head(c, k, 'Streaming latency', 'Which interval can the gateway measure?');
  const first = reveal(k, 4, 'first usable token', 0.35),
    bundle = reveal(k, 4, 'Four more', 0.35),
    end = reveal(k, 4, 'Completion comes', 0.35);
  const gapVisible = reveal(k, 5, 'one gap of one hundred twenty'),
    mean = reveal(k, 5, 'That gives thirty');
  substrate(c, 85, 300, 1750, 456);
  const x = (t) => 220 + t * 5.9,
    y = 570;
  line(
    c,
    [
      [x(0), y],
      [x(250), y],
    ],
    C.steel,
    4,
  );
  for (let t = 0; t <= 240; t += 20) {
    line(
      c,
      [
        [x(t), y],
        [x(t), y + 13],
      ],
      C.steel,
      3,
    );
  }
  const event = (t, n, name, p, color, dy = 0) => {
    if (p <= 0) return;
    c.save();
    c.globalAlpha = p;
    line(
      c,
      [
        [x(t), y],
        [x(t), 440 + dy],
      ],
      color,
      4,
    );
    dot(c, x(t), y, 10, color);
    mono(c, t + ' ms', x(t), y + 57, 30, C.cream, 'center');
    label(c, name, x(t), 403 + dy, 32, C.cream, { align: 'center' });
    for (let i = 0; i < n; i++) rect(c, x(t) - n * 11 + i * 22, 419 + dy, 18, 29, color);
    c.restore();
  };
  event(0, 0, 'Arrival', 1, C.steel, 55);
  event(stream.first, bundledEvents[0], 'First output', first, C.gold);
  event(stream.bundle, bundledEvents[1], 'One event', bundle, C.bLight);
  event(stream.end, 0, 'Finish', end, C.steel, 93);
  if (gapVisible) {
    line(
      c,
      [
        [x(stream.first), 658],
        [x(stream.first), 679],
        [x(stream.bundle), 679],
        [x(stream.bundle), 658],
      ],
      C.bLight,
      3,
    );
    mono(c, 'Observed gap   ' + gap + ' ms', x(160), 723, 30, C.bLight, 'center');
  }
  foot(
    c,
    mean
      ? 'Mean time per output token   (240 − 100) / (5 − 1) = ' + tpot + ' ms'
      : bundle
        ? 'Four tokens in a bundle have one observed arrival time.'
        : 'Observe the gateway clock from arrival through completion.',
    mean
      ? 'Completion includes 20 ms after the final output event. This mean requires at least two output tokens.'
      : 'The gateway clock starts at external arrival.',
  );
}

function eventGroups(c, x, title, events, showCount) {
  label(c, title, x, 971, 30, C.muted);
  let left = x + 224;
  for (const tokens of events) {
    const width = 17 * tokens + 14;
    rect(c, left, 933, width, 46, C.board);
    for (let j = 0; j < tokens; j++) rect(c, left + 8 + j * 17, 943, 13, 26, C.bLight);
    left += width + 13;
  }
  if (showCount) {
    const n = gapSamples(events);
    mono(c, n + (n === 1 ? ' gap sample' : ' gap samples'), left + 10, 971, 30, C.ink);
  }
}

function goodput(c, k) {
  const verdict = reveal(k, 7, 'Three qualify');
  const percent = reveal(k, 7, 'sixty percent');
  const rate = reveal(k, 7, 'three qualifying completions per minute');
  const pooled = reveal(k, 7, 'A pooled gap percentile');
  head(c, k, 'Gateway measurements   /   one-minute test', pooled
    ? 'What counts as one gap sample?'
    : 'How many of the five streams qualify?');
  const xs = [100, 607, 1015, 1432, 1675];
  ['Arrival', 'First output', 'Largest gap', 'Finished', 'Gate'].forEach((t, i) =>
    label(c, t, xs[i], 301, 33, C.muted),
  );
  offered.forEach((r, i) => {
    const y = 339 + 87 * i;
    plate(c, 91, y, 1738, 69, verdict ? (gate(r) ? C.board : '#68473e') : C.board, 3);
    [
      r.id,
      r.first + ' ms',
      r.gap + ' ms',
      r.complete ? 'Yes' : 'No',
      verdict ? (gate(r) ? 'Pass' : 'Fail') : '?',
    ].forEach((v, j) => mono(c, v, xs[j] + 7, y + 46, 32, j === 4 ? C.gold : C.cream));
  });
  const fraction = trial.qualifying + ' of ' + offered.length + ' arrivals pass';
  const summary = fraction + ' (' + trial.successPercent + '%)     ·     Goodput   ' +
    goodputPerMinute + ' qualifying completions/min';
  if (pooled) {
    label(c, summary, 101, 807, 30, C.ink);
    foot(c, 'One sample per gap between consecutive gateway output events.');
    if (reveal(k, 7, 'five tokens on our gateway trace'))
      eventGroups(c, 92, 'Gateway trace', bundledEvents, reveal(k, 7, 'giving one sample'));
    if (reveal(k, 7, 'five separate events'))
      eventGroups(c, 946, 'Same 5 tokens', separateEvents, reveal(k, 7, 'four samples'));
    return;
  }
  foot(
    c,
    rate ? summary : percent ? fraction + ' (' + trial.successPercent + '%).'
      : verdict ? fraction + '.' : 'Finish the stream. First output ≤ 800 ms. Every event gap ≤ 120 ms.',
    verdict
      ? 'The late start and the partial stream remain in the offered-load denominator.'
      : 'Measure each stream under the same offered load.',
  );
}
export function opening(c, k) {
  if (k.beat.beatIndex < 4) return replica(c, k);
  if (k.beat.beatIndex < 6) return clockTrace(c, k);
  goodput(c, k);
}

export function identity(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    const filter = reveal(k, 4, 'Only the design guide', 0.85);
    head(c, k, 'Evidence selection', 'Which passage can leave retrieval for Alice?');
    substrate(c, 80, 273, 1182, 515);
    mono(c, 'TRUSTED RETRIEVAL   /   TOP 1', 135, 342, 28, C.cream);
    for (const [i, d] of sources.entries()) {
      const y = 378 + i * 129,
        allowed = permitted('Alice', d);
      plate(
        c,
        131,
        y,
        1070,
        102,
        filter && !allowed ? '#46534c' : allowed && filter ? C.green : '#35584f',
        3,
      );
      mono(c, d.score.toFixed(2), 163, y + 65, 36, C.gold);
      label(c, d.name, 323, y + 65, 39, C.cream);
      mono(c, d.tenant + ' / ' + d.reader, 897, y + 65, 30, C.cream);
      if (filter && !allowed)
        line(
          c,
          [
            [143, y + 16],
            [143, y + 86],
          ],
          C.aLight,
          7,
        );
    }
    if (filter) wire(c, 1259, 684, 1372, 535, C.A, filter);
    if (filter > 0) {
      c.save();
      c.globalAlpha = filter;
      document(c, 1375, 439, 405, 184, retrieve('Alice')[0].name, 'Context for Alice', C.A);
      c.restore();
    } else {
      serif(c, 'Alice / A', 1385, 508, 51);
      label(c, 'One passage', 1387, 564, 34, C.muted);
    }
    foot(
      c,
      filter ? 'Rank within the permitted set.' : 'Read both the workspace and the reader grant.',
      filter
          ? 'Alice’s design guide is eligible at 0.80. The other two passages stay inside retrieval.'
        : 'All three scores are visible here inside the trusted retrieval service.',
    );
    return;
  }
  const selectedB = reveal(k, 1, 'Change just the workspace');
  const deny = reveal(k, 2, 'Deny the selection');
  const allow = !selectedB && reveal(k, 0, 'Her current grant opens');
  const workspace = selectedB ? 'B' : 'A',
    opColor = selectedB ? C.B : C.A;
  head(c, k, 'Gateway authorization', 'Can this selector open a workspace?');
  document(c, 110, 363, 458, 225, 'Alice’s credential', 'Current grant   A', C.A);
  label(c, 'Requested workspace', 112, 684, 31, C.muted);
  mono(c, workspace, 477, 692, 55, opColor);
  substrate(c, 762, 304, 387, 430);
  mono(c, 'GATEWAY', 957, 389, 31, C.cream, 'center');
  wire(c, 567, 478, 762, 478, opColor, 1);
  for (let j = 0; j < 7; j++) {
    const top = allow ? 409 : 451;
    rect(c, 802 + j * 45, top, 29, allow ? 53 : 96, allow ? C.aLight : deny ? C.aLight : C.steel);
  }
  mono(c, allow ? 'authorized' : deny ? 'denied' : 'check grant', 957, 649, 32, C.cream, 'center');
  wire(c, 1149, 478, 1351, 478, opColor, allow ? 1 : 0);
  if (allow) document(c, 1340, 365, 449, 215, 'Worker envelope', 'A   /   Alice', C.A);
  else {
    plate(c, 1340, 365, 449, 215, '#cdd3c1', 4);
    label(c, deny ? 'No dispatch' : 'Worker lookup', 1373, 453, 40, C.ink);
    label(c, selectedB ? 'B adapter is resident' : 'Waiting for grant', 1373, 521, 30, C.muted);
  }
  foot(
    c,
    allow
      ? 'Resolve identity before protected operations.'
      : deny
        ? 'No B context was issued.'
        : 'Compare the authenticated principal’s grant with the selected workspace.',
    deny
      ? 'Workers also check service identity, audience, expiry and permission for each operation.'
      : 'A resident adapter still requires an authorized request.',
  );
}
