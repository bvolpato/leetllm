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
  stripe,
  beat,
  cue,
  ease,
  clamp,
  mix,
} from './studio.mjs';
import {
  EVENTS,
  approvalRequest,
  approvalSpans,
  last,
  RATE,
  brokenRows,
  estimate,
  alert,
  sum,
  cacheRows,
  validRecord,
  untrustedRequestId,
  exportRecord,
  collector,
  kept,
  sampleRatio,
} from './examples.mjs';

function receiptPaper(g, title, rows, { stamp = '', warning = false } = {}) {
  plate(g, 117, 195, 1366, 460, P.white, 5);
  for (let i = 0; i < 72; i++) dot(g, 128 + 19 * i, 657, 4, '#c9c9b6');
  mono(g, title, 164, 253, 26, P.dim);
  rows.forEach(([name, count, price, amount], j) => {
    const y = 326 + j * 88;
    line(g, 160, y - 46, 1442, y - 46, P.line, 1.2);
    txt(g, name, 166, y + 6, 33);
    mono(g, count, 727, y + 4, 34, P.ink, 'right');
    mono(g, price, 1022, y + 4, 31, P.dim, 'right');
    mono(g, amount, 1435, y + 4, 32, P.ink, 'right');
  });
  if (stamp) mono(g, stamp, 1437, 614, 32, warning ? P.red : P.teal, 'right');
}
export function costing(g, c) {
  const invalid = cue(c, 2, 'Now change the cached count', 0.35) > 0;
  const r = invalid ? brokenRows.at(-1) : last,
    split = cue(c, 1, 'Split the input', 1);
  const result = cue(c, 2, 'Keep the rate-card', 0) > 0;
  heading(g, 'What did #206 cost?', 'internal-fixture-2026-05-27   /   USD per million tokens');
  if (invalid) {
    receiptPaper(
      g,
      'Usage validation',
      [
        ['Total input', r.input, '', 'observed'],
        ['Cached subset', r.cached, '', 'observed'],
        ['Output', r.output, '', 'observed'],
      ],
      { stamp: 'REJECT   cached > total', warning: true },
    );
    readout(g, 120, 707, 'Estimated cost', 'Unavailable', { w: 980, col: P.red });
    return;
  }
  const n = r.input - r.cached;
  const rows = [
    ['Uncached input', split === 1 ? n : '?', '$' + RATE.uncached, split === 1 ? n + ' µUSD' : ''],
    ['Cache read', r.cached, '$0.10', split === 1 ? '8 µUSD' : ''],
    ['Output', r.output, '$' + RATE.output, split === 1 ? '150 µUSD' : ''],
  ];
  receiptPaper(
    g,
    'Category                             tokens        rate / M                 charge',
    rows,
  );
  const width = 1130,
    bx = 163,
    by = 556,
    cachedWidth = (width * r.cached) / r.input;
  rect(g, bx, by, width, 30, '#a7b8b7', 3);
  g.save();
  g.globalAlpha = split;
  rect(g, bx, by, width - cachedWidth, 30, P.blue, 3);
  rect(g, bx + width - cachedWidth, by, cachedWidth, 30, P.teal, 3);
  if (split === 1) {
    mono(g, n + ' uncached', bx, by + 67, 24, P.blue);
    mono(g, r.cached + ' cached', bx + width - cachedWidth, by + 67, 24, P.teal);
  }
  g.restore();
  readout(
    g,
    117,
    707,
    'Input includes cached tokens',
    r.input + ' = ' + (split === 1 ? n + ' + ' + r.cached : '? + ' + r.cached),
    { w: 691 },
  );
  if (result)
    readout(g, 916, 707, 'Estimate', '$' + estimate(r).toFixed(6), { w: 569, col: P.teal });
}
export function usage(g, c) {
  const b = beat(c);
  if (b <= 2) {
    const dup =
      last.cached - Math.round(last.cached * ease(cue(c, 1, 'Take those eighty off', 1.4)));
    const n = last.input - last.cached + dup;
    heading(
      g,
      'Find the double charge',
      'Request #206   /   USD per million   /   internal-fixture-2026-05-27',
    );
    receiptPaper(
      g,
      dup ? 'Worksheet with overlapping input' : 'Disjoint usage',
      [
        ['Charged as uncached', n, '$1', n + ' µUSD'],
        ['Cache reads', last.cached, '$0.10', '8 µUSD'],
        ['Output', last.output, '$5', '150 µUSD'],
      ],
      {
        stamp:
          (dup ? 'WORKSHEET   ' : 'CORRECTED   ') + '$' + (estimate(last) + dup / 1e6).toFixed(6),
        warning: dup > 0,
      },
    );
    readout(g, 118, 706, 'Cached tokens counted twice', String(dup), { w: 550 });
    if (b === 2)
      readout(g, 802, 706, 'Reduction from original estimate', '$0.000080', {
        w: 650,
        col: P.teal,
      });
  } else if (b <= 4) {
    heading(g, 'Normalize provider usage', 'Price each billable category once');
    ledger(
      g,
      ['Usage record', 'Accounting decision'],
      [
        ['Output includes reasoning', 'Price total once, or split disjoint categories'],
        ['Cache reads and writes', 'Use provider-specific categories and rates'],
        ['Boolean, negative or nonfinite', 'Reject the invalid counter or rate'],
        ['Cached 202 / input 201', 'Reject and preserve the observation'],
      ],
      { step: 95, widths: [590, 870] },
    );
  } else {
    const cached = sum(cacheRows.map((r) => r.cached)),
      total = sum(cacheRows.map((r) => r.input));
    heading(
      g,
      'One long cache hit and four short misses',
      'All five requests share one token scale',
    );
    cacheRows.forEach(({ input, cached }, i) => {
      const y = 223 + i * 73;
      mono(g, 'R' + (i + 1), 73, y + 30, 26);
      rect(g, 215, y, input, 38, '#91a9b1', 3);
      rect(g, 215, y, cached, 38, P.teal, 3);
      mono(g, cached + ' / ' + input, 1280, y + 28, 25, P.ink);
    });
    readout(
      g,
      76,
      668,
      'Cached input / all input',
      cached + ' / ' + total + ' = ' + ((100 * cached) / total).toFixed(1) + '%',
      { w: 680 },
    );
    if (cue(c, 5, 'Only one of five', 0.6) > 0)
      readout(
        g,
        854,
        668,
        'Requests with a hit',
        cacheRows.filter((r) => r.cached > 0).length + ' / ' + cacheRows.length,
        { w: 610 },
      );
  }
}
function exportIfRegistered(record) {
  try {
    return exportRecord(record);
  } catch {
    return null;
  }
}
export function privacy(g, c) {
  const b = beat(c),
    badPrompt = cue(c, 2, 'Put private text', 0.25) > 0,
    badEvidence = cue(c, 2, 'An unregistered evidence', 0.25) > 0,
    fixed = cue(c, 2, 'A trusted record', 0.25) > 0;
  const r = { ...validRecord };
  if (badPrompt && !badEvidence) r.prompt = 'private text';
  if (badEvidence && !fixed) r.evidence = 'unregistered';
  const exported = exportIfRegistered(r);
  const send = cue(c, 1, 'selects fields', 1);
  heading(g, 'Before the first export', 'Approved fields    +    registry membership');
  const fields = ['request', 'prompt', 'evidence', 'route', 'input', 'output', 'operator_note'];
  plate(g, 65, 214, 642, 568, P.white);
  mono(g, 'SOURCE RECORD', 92, 270, 24, P.dim);
  fields.forEach((key, i) => {
    const y = 331 + i * 60;
    mono(g, key, 95, y, 25, P.dim);
    mono(g, r[key], 347, y, 25, key === 'operator_note' ? P.red : P.ink, 'left', 330);
  });
  line(g, 730, 486, 847, 486, P.dim, 4);
  dot(g, 790, 486, 20, exported ? P.teal : P.red);
  screen(g, 875, 213, 653, 570, exported ? 'Collector output' : 'Exporter decision');
  if (send > 0 && exported)
    Object.entries(exported)
      .slice(0, Math.ceil(send * 6))
      .forEach(([k, v], i) => {
        mono(g, k, 924, 336 + 63 * i, 26, P.sky);
        mono(g, v, 1160, 336 + 63 * i, 25, P.paper, 'left', 320);
      });
  if (!exported) {
    txt(g, 'Record rejected', 1201, 451, 53, P.pink, 'Serif', 'center');
    mono(
      g,
      'Unregistered ' + (badEvidence ? 'evidence' : 'prompt') + ' ID',
      1201,
      522,
      26,
      P.paper,
      'center',
    );
  }
  if (b === 2 && fixed) mono(g, 'Extra operator_note omitted', 915, 741, 26, P.mint);
}
export function metadata(g, c) {
  const b = beat(c),
    address = untrustedRequestId;
  if (b <= 2) {
    const copier = b === 1;
    const writer = copier ? 'Article copier' : 'Registry-checked exporter';
    const writtenId = copier ? address : exportIfRegistered({ ...validRecord, request: address })?.request;
    heading(g, 'A field name cannot vouch for its value', writer + '   /   request_id');
    strip(g, 86, 287, 636, 117, address, P.white, P.ink, 36);
    line(g, 726, 346, 872, 346, P.dim, 5);
    screen(g, 876, 216, 652, 267, copier ? writer + ' output' : writer);
    if (writtenId) mono(g, writtenId, 1202, 386, 32, P.paper, 'center');
    else txt(g, 'Unapproved ID', 1202, 385, 53, P.pink, 'Serif', 'center');
    readout(g, 88, 640, 'Trusted ID from service registry', '#' + validRecord.request, { w: 640 });
  } else if (b === 3) {
    const scrub = cue(c, 3, 'Remove the email address', 0.6) > 0;
    heading(g, 'One record, three copies', 'What survives a downstream scrub?');
    ['Source buffer', 'Debug log', 'Second exporter'].forEach((s, i) => {
      const x = 65 + i * 500;
      screen(g, x, 285, 470, 316, s);
      mono(
        g,
        i === 0 && scrub ? '[address removed]' : address,
        x + 235,
        451,
        26,
        i === 0 && scrub ? P.mint : P.pink,
        'center',
        408,
      );
      mono(g, 'private context', x + 235, 516, 26, P.paper, 'center');
    });
  } else {
    const expired = cue(c, 5, 'Once that artifact expires', 0.3) > 0;
    heading(
      g,
      'Authorized replay inputs',
      'A retained identifier points to a separately governed artifact',
    );
    strip(g, 75, 353, 493, 112, 'artifact / A17', P.white);
    line(g, 580, 411, 837, 411, P.dim, 4);
    screen(g, 856, 230, 658, 368, 'Restricted store');
    txt(
      g,
      expired ? 'Slot empty' : 'Artifact A17',
      1178,
      435,
      65,
      expired ? P.gold : P.mint,
      'Serif',
      'center',
    );
    mono(
      g,
      expired ? 'Retention expired' : 'Scoped access + expiry',
      1178,
      505,
      26,
      P.paper,
      'center',
    );
    txt(g, 'Sampling uses the same access and retention rules.', 75, 748, 44, P.ink, 'Serif');
  }
}
export function alertWindow(g, c) {
  const b = beat(c);
  if (b >= 5 && cue(c, 5, 'In another window', 0.3) > 0) {
    const empty = cue(c, 5, 'With no observations', 0.4) > 0;
    heading(
      g,
      'Collector coverage',
      empty ? 'No final events received' : 'Separate ingress ledger',
    );
    const n = empty ? 0 : 7;
    for (let i = 0; i < 8; i++) {
      const x = 76 + i * 184;
      strip(g, x, 298, 155, 75, 'R' + (i + 1));
      if (i < n) strip(g, x, 477, 155, 75, 'Final', P.mint);
      else line(g, x, 549, x + 152, 549, P.red, 2);
    }
    readout(g, 78, 665, 'Received / ingress', n + ' / 8', { w: 490 });
    readout(g, 660, 665, 'Finding', empty ? 'Unknown window' : 'One missing event', { w: 730 });
    return;
  }
  const bad = cue(c, 2, 'Change two measurements', 0.5) > 0,
    rows = bad ? brokenRows : EVENTS,
    findings = alert(rows);
  const verdict = !bad || cue(c, 3, 'We can still point', 0) > 0;
  heading(
    g,
    'Three independent channels',
    'Policy   /   deploy assistant   /   six reviewed requests',
  );
  const channels = [
    [
      'Unsafe replies',
      rows.filter((r) => r.unsafe).length + ' confirmed',
      'Page on any',
      findings.some((s) => s.startsWith('PAGE')) ? 'PAGE' : 'Clear',
    ],
    [
      'First-output p95',
      bad ? '#206  missing' : '240 ms',
      'Warn above 500 ms',
      bad ? 'Unknown' : 'Within policy',
    ],
    [
      'Token cost',
      bad ? '#206  cache 202 / 201' : '$' + sum(rows.map(estimate)).toFixed(7),
      'Warn above $0.002',
      bad ? 'Unknown' : 'Within policy',
    ],
  ];
  ledger(
    g,
    ['Channel', 'Evidence', 'Policy', 'Finding'],
    channels.map(([k, e, p, f], j) => [
      k,
      e,
      p,
      [verdict || j === 0 ? f : '?', j === 0 ? P.red : bad ? P.dim : P.teal],
    ]),
    { y: 243, step: 107, widths: [310, 450, 390, 310] },
  );
  mono(
    g,
    b >= 4 ? 'Route #205 to on-call   /   attach runbook' : 'Window linked to requests #201–206',
    78,
    787,
    31,
    P.dim,
  );
}
export function sampling(g, c) {
  const retained = cue(c, 1, 'Suppose we keep', 1.5);
  heading(
    g,
    'Which traces made it to storage?',
    '09:12   /   six independently reviewed requests',
    true,
  );
  mono(g, 'Ingress IDs with joined reviews', 75, 241, 28, P.paper);
  mono(g, 'Trace store', 75, 735, 28, P.paper);
  for (const [j, r] of EVENTS.entries()) {
    const x = 76 + j * 245,
      col = r.unsafe ? P.pink : P.sky;
    strip(g, x, 277, 214, 96, '#' + r.id, col, r.unsafe ? P.red : P.ink);
    if (kept.includes(r) && retained > 0)
      strip(
        g,
        x,
        mix(277, 595, ease(retained)),
        214,
        96,
        '#' + r.id,
        col,
        r.unsafe ? P.red : P.ink,
      );
    else line(g, x, 684, x + 214, 684, '#699096', 2);
  }
  const answer = cue(c, 2, 'Two out of three', 0) > 0;
  if (answer) {
    mono(g, 'Window   2 / 6', 80, 794, 36, P.paper);
    mono(g, 'Retained traces   2 / 3', 820, 794, 36, P.paper);
  }
}
export function tail(g, c) {
  const b = beat(c);
  const end = cue(c, 2, 'At ten seconds', 1.5),
    late = cue(c, 3, 'Follow the review', 2.1);
  const arrived = cue(c, 3, 'Now the receipt arrives', 0) > 0;
  const seconds = arrived ? 60 : 10 * end + 49 * late,
    state = collector(seconds),
    left = 130,
    span = 1320,
    px = (s) => left + (span * s) / 60;
  heading(
    g,
    'When does the collector discard this trace?',
    'One trace    /    one tail decision    /    review travels separately',
    true,
  );
  screen(g, 74, 206, 785, 304, 'Tail collector 01   •   request #' + approvalRequest.id);
  if (state.buffered) {
    const spans = [{ id: 0, name: 'Root' }, ...Object.values(approvalSpans)];
    spans.forEach((span, i) =>
      strip(g, 113 + i * 178, 335, 166, 75, span.id + ' ' + span.name, P.sky, P.ink, 24),
    );
  } else {
    g.save();
    g.setLineDash([10, 8]);
    g.strokeStyle = '#82a19f';
    g.lineWidth = 2;
    g.strokeRect(124, 311, 682, 115);
    g.restore();
    mono(g, 'Trace discarded', 464, 380, 31, P.paper, 'center');
  }
  if (state.receipt) strip(g, 1002, 321, 473, 98, 'Review  #' + approvalRequest.id, P.pink, P.red, 34);
  if (b === 3 && !arrived && late > 0) {
    const tx = mix(1525, 1150, late);
    mono(g, 'In transit', tx, 408, 25, P.sky, 'center');
  }
  if (state.closed) mono(g, 'Closed at 10 s', 89, 555, 25, P.gold);
  axis(g, left, 704, span, 60, [0, 10, 20, 30, 40, 50, 60], P.sky);
  line(g, px(10), 625, px(10), 701, P.gold, 5);
  line(g, left, 668, px(seconds), 668, P.mint, 6);
  dot(g, px(seconds), 668, 13, P.mint);
  mono(g, Math.floor(seconds) + ' s', px(seconds), 632, 29, P.paper, 'center');
  if (b === 4)
    mono(g, 'All spans for #205 → collector 01    •    finite buffer and wait', 82, 815, 27, P.sky);
  else if (b >= 5)
    mono(
      g,
      b === 5
        ? 'Ingress ledger and detected violations survive trace disposal'
        : 'Retain the sampling policy, evaluator and label delay with the count',
      82,
      815,
      27,
      P.sky,
    );
  else mono(g, 'Head decision at start', 82, 815, 27, P.sky);
}
function afterPhrase(c, beatNumber, phrase, captionStart) {
  if (beat(c) !== beatNumber) return beat(c) > beatNumber;
  if (captionStart) c.reveal(phrase, 0, { captionStart });
  return c.elapsed >= c.wordCue(phrase).end;
}

export function weights(g, c) {
  const arrival = cue(c, 1, 'each retained trace', 1.2);
  const showRule = afterPhrase(c, 1, 'one divided by its probability of retention');
  const showSums = cue(c, 2, 'Dividing these two estimated totals', 0);
  const unsafeChance = afterPhrase(c, 3, 'retention probability one');
  const safeChance = afterPhrase(c, 3, 'a one-in-four chance');
  const safeWeight = afterPhrase(c, 4, 'Four requests', 'Four requests');
  const unsafeWeight = afterPhrase(c, 4, 'Each unsafe trace represents one');
  const firstTotal = afterPhrase(c, 4, 'two unsafe over an estimated six requests');
  const compareLedger = afterPhrase(c, 4, 'the complete ledger');
  const departure = cue(c, 5, 'none of the four safe traces', 0.8);
  const secondTotal = afterPhrase(c, 5, 'would give one', 'one, despite the unchanged population');
  const zeroChance = afterPhrase(c, 6, 'cannot be reconstructed from that sample');
  const sample = sampleRatio(kept);
  const estimateForDraw = departure > 0 ? sampleRatio(kept.filter((r) => r.unsafe)) : sample;
  const populationUnsafe = EVENTS.filter((r) => r.unsafe).length;

  heading(
    g,
    'What does one retained trace represent?',
    'Inverse-probability weighting   /   same request window',
  );
  dot(g, 1107, 137, 7, P.red);
  mono(g, 'Unsafe delivery', 1125, 145, 25, P.red);
  dot(g, 1372, 137, 7, P.blue);
  mono(g, 'Other', 1390, 145, 25, P.blue);

  const left = 325;
  const pitch = 201;
  const cardWidth = 177;
  const windowY = 205;
  const sampleY = 376;
  const cardHeight = 82;
  const trackStart = windowY + cardHeight + 12;
  const trackEnd = sampleY - 12;
  const chanceY = 506;
  const weightY = 555;
  const resultY = 624;

  mono(g, 'Full window', 76, 249, 29);
  if (compareLedger) {
    mono(g, `${populationUnsafe} / ${EVENTS.length}`, 76, 288, 34, P.red);
    mono(g, 'unsafe / total', 76, 320, 22, P.dim);
  }
  mono(g, 'Retained traces', 76, 412, 26);
  if (safeChance) mono(g, departure > 0 ? 'Second draw' : 'First draw', 76, 445, 24, P.dim);
  if (unsafeChance || safeChance) mono(g, 'Keep chance', 76, chanceY, 26, P.dim);
  if (safeChance) mono(g, 'Weight', 76, weightY, 26, P.dim);

  for (const [i, request] of EVENTS.entries()) {
    const x = left + pitch * i;
    const center = x + cardWidth / 2;
    const [fill, ink] = request.unsafe ? [P.pink, P.red] : [P.sky, P.blue];
    const retained = sample.weighted.find((r) => r.id === request.id);
    strip(g, x, windowY, cardWidth, cardHeight, '#' + request.id, fill, ink, 35);
    if (!retained || (!request.unsafe && departure === 1)) {
      line(g, x, sampleY + cardHeight, x + cardWidth, sampleY + cardHeight, P.line, 3);
      continue;
    }
    if (arrival < 1) {
      if (arrival > 0) {
        const y = mix(trackStart, trackEnd, ease(arrival));
        line(g, center, trackStart, center, y, P.line, 3);
        dot(g, center, y, 8, ink);
      }
      continue;
    }

    g.save();
    if (!request.unsafe) g.globalAlpha = 1 - ease(departure);
    line(g, center, trackStart, center, trackEnd, P.line, 3);
    strip(g, x, sampleY, cardWidth, cardHeight, '#' + request.id, fill, ink, 35);
    if (request.unsafe ? unsafeChance : safeChance) {
      const probability = retained.probability === 1 ? '1' : `1 / ${retained.weight}`;
      mono(g, probability, center, chanceY, 31, ink, 'center');
    }
    const known = request.unsafe ? unsafeWeight : safeWeight;
    if (known || (!request.unsafe && safeChance)) {
      mono(g, known ? retained.weight : '?', center, weightY, 35, ink, 'center');
    }
    if (known) {
      const blockWidth = 32;
      const blockPitch = 40;
      const start = center - ((retained.weight - 1) * blockPitch + blockWidth) / 2;
      for (let k = 0; k < retained.weight; k++)
        rect(g, start + k * blockPitch, weightY + 18, blockWidth, 30, ink, 4);
    }
    g.restore();
  }

  if (departure > 0 ? secondTotal : firstTotal) {
    const { unsafe, all } = estimateForDraw;
    const percent = (100 * unsafe) / all;
    const rounded = Math.round(percent);
    readout(
      g,
      76,
      resultY,
      'Weighted unsafe / weighted total',
      `${unsafe} / ${all} ${percent === rounded ? '=' : '≈'} ${rounded}%`,
      { w: 840 },
    );
  } else if (showRule) {
    const formula = showSums
      ? 'Unsafe weight sum / total weight sum'
      : 'Weight = 1 / keep chance';
    readout(g, 76, resultY, 'Weighted estimate', departure > 0 ? '?' : formula, { w: 940 });
  }
  if (zeroChance)
    readout(g, 1050, resultY, 'If keep chance is zero', 'No estimate for group', {
      w: 450,
      col: P.red,
    });
}
