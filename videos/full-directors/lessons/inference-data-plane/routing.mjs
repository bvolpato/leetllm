import {
  C,
  title,
  label,
  mono,
  line,
  box,
  chassis,
  socket,
  cable,
  printer,
  foot,
  bar,
  cue,
  index,
  ledger,
  arrow,
} from './workbench.mjs';
import {
  manifest,
  matches,
  routes,
  trace,
  queuedLink,
  retainedCopy,
  promptGroups,
  rebuiltGroups,
} from './examples.mjs';

export function placement(ctx, c) {
  title(ctx, c, 'ROUTER   /   R4219   ·   48 REQUIRED BLOCKS');
  const i = index(c),
    policyLocal = i === 2 && cue(c, 2, 'required local domain') && !cue(c, 2, 'policy permits');
  const workers = routes(policyLocal),
    verdict = cue(c, 6, 'and wins');
  chassis(ctx, 94, 299, 425, 415, 'Source   /   M17 r5');
  mono(ctx, 'TP2    BF16', 135, 427, 33, C.bright);
  mono(ctx, 'paged-v2', 135, 492, 31, C.soft);
  socket(ctx, 134, 564, 344, 69, 1, C.copper, 12);
  workers.forEach((w, j) => {
    const xx = 790,
      y = 257 + j * 197;
    const checked =
      j === 2
        ? cue(c, 2, 'C is compatible')
        : j === 1
          ? cue(c, 1, 'one-rank partition')
          : cue(c, 1, 'A matches');
    const invalid = checked && !w.eligible;
    const knownReuse =
      j === 2 ? cue(c, 5, 'already has thirty-six') : cue(c, 4, 'no reusable blocks');
    const cached = knownReuse ? w.reuse : 0;
    const showCost =
      j === 0 ? cue(c, 4, 'four point two') : j === 2 ? cue(c, 6, 'two point eight') : 0;
    const strong =
      verdict &&
      w.eligible &&
      w.cost ===
        Math.min(
          ...workers.filter((candidate) => candidate.eligible).map((candidate) => candidate.cost),
        );
    cable(ctx, 520, 494, xx, y + 74, 0, strong ? C.teal : invalid ? C.red : C.well);
    box(
      ctx,
      xx,
      y,
      1009,
      152,
      strong ? '#deeadb' : C.paper,
      strong ? C.teal : invalid ? C.red : C.line,
      10,
      strong ? 5 : 2,
    );
    label(
      ctx,
      w.name + '   /   rack ' + w.rack,
      xx + 25,
      y + 53,
      37,
      invalid ? C.red : C.ink,
      'Serif',
    );
    mono(ctx, 'TP' + w.tp + '   ·   ' + w.free + ' free', xx + 27, y + 112, 27, C.dim);
    if (checked && invalid) {
      mono(
        ctx,
        w.tp !== 2 ? 'Partition mismatch' : 'Outside required domain',
        xx + 365,
        y + 93,
        33,
        C.red,
      );
    } else if ((j === 2 && i >= 5) || (j === 0 && i >= 4)) {
      socket(ctx, xx + 348, y + 24, 331, 50, cached / 48, C.green, 12);
      mono(
        ctx,
        knownReuse ? cached + ' already here' : 'Checking prefix',
        xx + 348,
        y + 119,
        25,
        C.dim,
      );
      if (showCost) mono(ctx, w.cost.toFixed(1) + ' units', xx + 982, y + 93, 38, C.ink, 'right');
      else if (j === 2 && cue(c, 6, 'Twelve blocks'))
        mono(ctx, w.remaining + ' cross', xx + 982, y + 91, 32, C.ink, 'right');
    } else if (checked) label(ctx, 'Compatible', xx + 365, y + 93, 35, C.teal);
  });
  foot(
    ctx,
    verdict
      ? 'C wins on transferred work.   0.8 + 12 ÷ 6 = 2.8 synthetic time units.'
      : i >= 5
        ? 'A: 0.2 setup + 48 ÷ 12.    C: 0.8 setup + missing blocks ÷ 6.'
        : policyLocal
          ? 'Required domain  /  rack one only.'
          : i >= 2
            ? 'Cross-rack placement is permitted here. Price only eligible, authorized prefix matches.'
            : 'Compare each worker with the same model revision, dtype and block format.',
  );
}

export function interpretation(ctx, c) {
  title(
    ctx,
    c,
    index(c) < 3
      ? 'REQ-8K-017   /   DESTINATION LEASE 772'
      : 'TRANSFER ENGINE   /   REGISTERED BUFFERS',
  );
  const i = index(c);
  if (i === 0 || (i === 1 && !cue(c, 1, 'trace logical block'))) {
    const stale = cue(c, 1, 'attempt three') && !cue(c, 1, 'matching manifest');
    const incoming = { ...manifest, attempt: stale ? 3 : 4 },
      ok = matches(incoming, manifest);
    const rows = [
      ['Request', 'request'],
      ['Attempt', 'attempt'],
      ['Sharing scope', 'tenant'],
      ['Model / tokenizer / adapter', 'model'],
      ['Token digest / positions', 'tokens'],
      ['Dtype / layout / block size', 'layout'],
      ['Ranks / logical blocks', 'coverage'],
      ['Reservation', 'lease'],
    ];
    label(ctx, 'Trusted reservation', 724, 278, 39, C.ink, 'Serif');
    label(ctx, 'Received manifest', 1300, 278, 39, C.ink, 'Serif');
    rows.forEach(([key, field], j) => {
      const y = 345 + j * 62,
        mismatch = incoming[field] !== manifest[field];
      if (mismatch) box(ctx, 96, y - 38, 1707, 55, '#f6d8bf', null, 6);
      label(ctx, key, 107, y, 29, C.dim);
      mono(ctx, manifest[field], 731, y, 29, C.ink);
      mono(ctx, incoming[field], 1303, y, 29, mismatch ? C.red : C.ink);
      line(ctx, 99, y + 17, 1802, y + 17, C.line, 1);
    });
    foot(
      ctx,
      ok
        ? 'Authority comes from the reservation recorded at D3.'
        : 'Attempt 3 has no authority over attempt 4’s reservation.',
      ok ? C.ink : C.red,
    );
  } else if (i <= 2) {
    const mapped = cue(c, 1, 'one hundred eighteen');
    for (const [j, name, address] of [
      [0, 'P7   /   source', 904],
      [1, 'D3   /   destination', 118],
    ]) {
      const x = 103 + j * 1040;
      chassis(ctx, x, 295, 665, 411, name);
      for (let n = 0; n < 5; n++) {
        const y = 402 + n * 48,
          hot = n === (j ? 1 : 3);
        box(ctx, x + 46, y, 567, 39, hot && (j === 0 || mapped) ? C.copper : C.inset, C.dim, 3);
        if (hot && (j === 0 || mapped)) mono(ctx, 'physical ' + address, x + 68, y + 29, 24, C.ink);
      }
    }
    arrow(ctx, 783, 508, 1126, 508, C.teal);
    mono(ctx, 'logical 31', 955, 465, 35, C.ink, 'center');
    foot(
      ctx,
      i === 2
        ? 'Decode may also require last-token or hidden state, sampling state and a first-step owner.'
        : 'Logical block 31 keeps its identity across the two local address spaces.',
    );
  } else if (i <= 4) {
    label(ctx, 'Metadata channel', 101, 301, 46, C.ink, 'Serif');
    line(ctx, 470, 362, 1710, 362, C.teal, 6);
    arrow(ctx, 1540, 362, 1715, 362, C.teal);
    box(ctx, 762, 320, 598, 82, C.paper, C.teal, 7);
    mono(ctx, 'Scoped buffer descriptor', 1060, 373, 31, C.teal, 'center');
    for (let j = 0; j < 2; j++) {
      const x = 100 + j * 1000;
      chassis(ctx, x, 451, 709, 267, j ? 'Registered destination' : 'Registered source');
      socket(
        ctx,
        x + 46,
        565,
        614,
        79,
        j ? cue(c, 3, 'bulk keys and values', 1.4) : 1,
        C.copper,
        24,
      );
    }
    cable(ctx, 810, 595, 1098, 595, 38);
    if (i === 4) {
      mono(ctx, 'Application log    op-17    copy complete', 107, 808, 34);
      foot(ctx, 'The operation and outcome are enough for this log entry.');
    } else
      foot(
        ctx,
        'Authorize the descriptor exchange. Enforce tenant boundaries on the registered regions.',
      );
  } else {
    label(ctx, 'Concurrent destination ranges', 111, 301, 47, C.ink, 'Serif');
    const safe = cue(c, 5, 'each live write');
    for (let j = 0; j < 2; j++) {
      const y = 407 + j * 157;
      mono(ctx, 'Write ' + (j + 1), 112, y + 55, 37);
      for (let k = 0; k < 12; k++) {
        const active = j ? k >= (safe ? 6 : 3) && k < (safe ? 12 : 9) : k < 6;
        box(ctx, 462 + k * 103, y, 93, 74, active ? (j ? C.blue : C.copper) : null, C.line, 4);
        mono(ctx, k, 508 + k * 103, y + 50, 28, C.ink, 'center');
      }
    }
    foot(
      ctx,
      safe
        ? 'Disjoint destination ranges keep unordered writes from overlapping.'
        : 'Both writes target cells 3, 4 and 5. Their ordering is unspecified.',
    );
  }
}

export function recovery(ctx, c) {
  title(ctx, c, 'REQUEST OWNER   /   RECOVERY BOUNDARIES');
  const i = index(c);
  if (i < 2) {
    const known = cue(c, 0, 'reports committed'),
      lost = cue(c, 0, 'loses the commit'),
      asked = cue(c, 0, 'Query the authoritative'),
      failed = cue(c, 1, 'decoder then fails'),
      shown = cue(c, 1, 'client has seen'),
      interrupt = cue(c, 1, 'Report an interrupted');
    chassis(ctx, 101, 282, 613, 422, 'Authoritative decoder');
    mono(ctx, 'Operation   op-17', 148, 406, 35, C.soft);
    mono(ctx, 'Commit      ' + (known ? 'recorded' : '?'), 148, 493, 38, C.bright);
    label(
      ctx,
      failed ? 'Decode failed' : known ? 'D3 owns the stream' : 'Awaiting state query',
      148,
      624,
      41,
      known ? C.green : C.bright,
      'Serif',
    );
    box(ctx, 974, 371, 197, 173, C.gray, C.ink, 9);
    label(ctx, 'Router', 1071, 438, 38, C.ink, 'Serif', 500, 'center');
    mono(
      ctx,
      known ? 'resolved' : lost ? 'ACK lost' : 'sent',
      1071,
      495,
      25,
      known ? C.teal : C.rust,
      'center',
    );
    if (asked) {
      arrow(ctx, 961, 409, 730, 409, C.dim);
      mono(ctx, 'query', 840, 384, 24, C.dim, 'center');
    }
    if (known) {
      arrow(ctx, 730, 518, 961, 518, C.teal);
      mono(ctx, 'committed', 842, 493, 24, C.teal, 'center');
    }
    printer(ctx, 1240, 347, 564, shown ? 'Blue' : '', 1, 'Client output');
    if (shown) {
      mono(ctx, 'Resume cursor   ?', 1241, 640, 32, C.dim);
      if (interrupt) label(ctx, 'Stream interrupted', 1240, 719, 41, C.red, 'Serif');
    }
    const groupFailure = cue(c, 1, 'If a decode rank');
    foot(
      ctx,
      groupFailure
        ? 'A failed decode rank requires recovery of its collective group.'
        : shown
          ? 'Visible output requires an agreed cursor and deduplication to resume exactly.'
          : known
            ? 'A recorded commit keeps this request with D3.'
            : 'The missing acknowledgement leaves the outcome unknown.',
    );
  } else if (i === 2) {
    const copy = retainedCopy(!!cue(c, 2, 'expires while transport'), !!cue(c, 2, 'finishes'));
    const released = !copy.held && cue(c, 2, 'reclaim the source buffer');
    chassis(ctx, 107, 277, 762, 450, 'P7   /   completed prefill');
    socket(ctx, 151, 416, 670, 101, released ? 0 : 1, C.copper, 24);
    mono(ctx, released ? 'Buffer returned to pool' : 'Retained prompt KV', 151, 634, 33, C.bright);
    label(ctx, 'Source buffer lifetime', 1120, 360, 49, C.ink, 'Serif');
    ledger(
      ctx,
      1122,
      459,
      657,
      [
        ['Transport', copy.readsStopped ? 'reads stopped' : 'may read'],
        ['Retention', copy.expired ? 'expired' : 'active'],
        ['Memory credit', released ? 'returned' : 'held'],
      ],
      91,
    );
    foot(
      ctx,
      released
        ? 'P7 has released its copy.'
        : copy.expired
          ? copy.readsStopped
            ? 'The final read has finished.'
            : 'The retention period has ended. An outstanding read still holds the buffer.'
          : 'This prefill run produced a complete source for a permitted retry.',
    );
  } else if (i === 3 || i === 4) {
    const fenced = !!cue(c, 4, 'Fence the failed attempt');
    const healthy = cue(c, 4, 'A healthy prefill group');
    const built = rebuiltGroups(
      fenced,
      cue(c, 4, 'As it processes', 3),
      !!cue(c, 4, 'for the retry'),
    );
    chassis(ctx, 106, 265, 742, 392, 'P7   /   failed prefill');
    socket(ctx, 151, 405, 648, 99, 0, C.copper, 24);
    mono(ctx, 'No cache produced', 151, 562, 34, C.bright);
    if (fenced) mono(ctx, 'Old attempt fenced', 151, 614, 29, C.copper);
    if (healthy) {
      chassis(ctx, 1030, 265, 758, 392, 'P9   /   healthy prefill');
      socket(ctx, 1077, 405, 656, 99, built / promptGroups.length, C.blue, 24);
      mono(
        ctx,
        built === promptGroups.length ? 'Fresh KV ready on P9' : 'Recomputing from prompt',
        1077,
        563,
        32,
        C.bright,
      );
    }
    label(ctx, 'Original prompt held by the request owner', 108, 733, 32, C.ink, 'Serif');
    promptGroups.forEach((words, j) => {
      const x = 110 + j * 191;
      box(ctx, x, 759, 181, 61, j < built ? C.blue : C.paper, C.line, 4);
      mono(ctx, words, x + 90, 800, 22, C.ink, 'center');
    });
    if (healthy) arrow(ctx, 900, 785, 1080, 680, C.teal);
    foot(
      ctx,
      built === promptGroups.length
        ? 'The retry can use the cache that P9 built from the preserved prompt.'
        : healthy
          ? 'P9 builds keys and values as it reads the prompt again.'
          : fenced
            ? 'The owner has fenced the failed attempt.'
            : 'What can supply the missing keys and values?',
    );
  } else {
    const labels = ['Arrival A', 'Arrival B', 'Finish', 'Commit', 'Cancel', 'Reclaim'];
    label(ctx, 'Serialized CPU model', 107, 310, 49, C.ink, 'Serif');
    for (let j = 0; j < 6; j++) {
      const x = 113 + j * 286;
      box(ctx, x, 387, 249, 102, j === 3 ? C.copper : C.gray, C.ink, 5);
      mono(ctx, labels[j], x + 124, 454, 32, C.ink, 'center');
    }
    const n = [1, 2, 3, 4, 5, 6].reduce((v, k) => v * k);
    mono(ctx, '6 × 5 × 4 × 3 × 2 × 1', 111, 607, 42, C.dim);
    if (cue(c, 5, 'seven hundred twenty')) mono(ctx, n + ' event orders', 111, 735, 65, C.teal);
    foot(
      ctx,
      i === 6
        ? 'Trusted callbacks in the model require independent evidence from the real backend.'
        : 'Two arrivals and four lifecycle events. Check credit and commit after each transition.',
    );
  }
}

function timeline(ctx, c) {
  const i = index(c),
    alternatives = [
      { name: 'Serial', s: trace(310), show: true },
      { name: 'Overlap', s: trace(240), show: !!cue(c, 1, 'Start the same transfer') },
      {
        name: 'With queue',
        s: trace(240, 25 * cue(c, 3, 'Slide the entire', 1.2)),
        show: !!cue(c, 3, 'Slide the entire'),
      },
    ];
  const scale = 2.48,
    left = 383;
  mono(ctx, 'Admission', left, 245, 25, C.dim, 'center');
  for (let t = 0; t <= 500; t += 100) {
    const x = left + t * scale;
    line(ctx, x, 283, x, 796, C.line, 1);
    mono(ctx, t + ' ms', x, 280, 23, C.dim, 'center');
  }
  alternatives.forEach(({ name, s, show }, j) => {
    if (!show) return;
    const y = 335 + j * 160;
    label(ctx, name, 105, y + 61, 37, C.ink, 'Serif');
    if (s.queue) box(ctx, left, y, scale * s.queue, 101, '#e8c8ae', C.rust, 2);
    const showEnd = j !== 1 || !!cue(c, 2, 'moves to');
    for (const [span, dy, col] of [
      [s.prefill, 0, C.teal],
      [s.transfer, 39, C.rust],
      [s.decode, 77, C.ink],
    ]) {
      if (dy === 77 && !showEnd) continue;
      box(ctx, left + scale * span[0], y + dy, scale * (span[1] - span[0]), 25, col, null, 3);
    }
    const x = left + scale * s.first;
    if (showEnd) line(ctx, x, y - 7, x, y + 111, C.ink, 3);
    const result =
      j === 0 ? cue(c, 0, 'endpoint is') : j === 1 ? cue(c, 2, 'moves to') : cue(c, 3, 'now takes');
    if (result) mono(ctx, s.first.toFixed(1) + ' ms', x + 11, y + 91, 25, C.ink);
  });
  for (const [j, k, col] of [
    [0, 'Prefill', C.teal],
    [1, 'Transfer', C.rust],
    [2, 'Commit + first step', C.ink],
  ]) {
    const x = 398 + j * 328;
    box(ctx, x, 814, 43, 15, col);
    label(ctx, k, x + 58, 834, 25, C.ink);
  }
  foot(
    ctx,
    i === 3
      ? 'Admission to first token includes the 25 ms queue. Active work still covers 375.4 ms.'
      : i === 1
        ? 'The receiver waits for both prefill and its required transfer.'
        : 'All rows use the same clock and the same amount of work.',
  );
}
export function measurement(ctx, c) {
  title(ctx, c, 'REQUEST TRACE   /   SYNTHETIC TIMES');
  const i = index(c);
  if (i < 4) return timeline(ctx, c);
  if (i === 4) {
    const q = 25 * c.reveal('Add a twenty-five-millisecond', 1.2, { captionStart: false });
    const record = queuedLink(q);
    const baseline = queuedLink(0).first;
    const baselineKnown = c.reveal('endpoint is four hundred. Add', 0, { captionStart: false });
    const resultKnown = c.reveal('four hundred twenty-five milliseconds', 0, { captionStart: false });
    label(ctx, 'Queue at the transfer path', 108, 280, 46, C.ink, 'Serif');
    const x = 450,
      scale = 2.58;
    const rows = [
      ['Prefill', record.prefill, C.teal],
      ['Setup', record.setup, C.dim],
      ['Queue', [150, 150 + q], C.copper],
      ['Transfer', record.transfer, C.rust],
      ['First decode', record.decode, C.ink],
    ];
    rows.forEach(([name, [a, b], col], k) => {
      const y = 353 + k * 76;
      label(ctx, name, 114, y + 31, 31);
      if (b > a) box(ctx, x + scale * a, y, scale * (b - a), 36, col, null, 3);
    });
    for (let tick = 0; tick <= 500; tick += 100) {
      const xx = x + tick * scale;
      line(ctx, xx, 735, xx, 751, C.dim, 2);
      mono(ctx, tick + ' ms', xx, 788, 23, C.dim, 'center');
    }
    line(ctx, x, 742, x + 500 * scale, 742, C.dim, 2);
    if (baselineKnown) {
      const marker = x + scale * baseline;
      line(ctx, marker, 694, marker, 733, C.dim, 2);
      mono(ctx, baseline + ' ms without queue', marker - 10, 721, 24, C.dim, 'right');
      if (q > 0 && !resultKnown)
        mono(ctx, '? ms', x + scale * record.first + 14, 688, 29, C.ink);
      if (resultKnown) {
        const end = x + scale * record.first;
        line(ctx, end, 694, end, 733, C.ink, 2);
        line(ctx, marker, 708, end, 708, C.rust, 3);
        mono(ctx, record.first + ' ms', end + 14, 688, 29, C.ink);
        mono(ctx, '+' + (record.first - baseline) + ' ms', end + 14, 721, 24, C.rust);
      }
    }
    line(ctx, 92, 823, 1828, 823);
    label(ctx, 'Setup overlaps prefill. Transfer waits for setup and the first ready blocks.', 94, 873, 32, C.ink, 'Serif', 500);
    return;
  }
  if (i === 5) {
    label(ctx, 'Two requests on one clock', 111, 300, 49, C.ink, 'Serif');
    for (const [j, a, b] of [
      [0, 90, 10],
      [1, 10, 90],
    ]) {
      const y = 417 + j * 150;
      mono(ctx, 'Request ' + (j + 1), 112, y + 50, 35);
      bar(ctx, 505, y, (1080 * a) / 100, 70, 1, C.teal);
      bar(ctx, 505 + (1080 * a) / 100, y, (1080 * b) / 100, 70, 1, C.rust);
      mono(ctx, a, 505 + (1080 * a) / 200, y + 46, 28, C.bright, 'center');
      mono(ctx, b, 505 + (1080 * a) / 100 + (1080 * b) / 200, y + 46, 28, C.bright, 'center');
      mono(ctx, '100 ms', 1633, y + 49, 33);
    }
    box(ctx, 507, 735, 52, 24, C.teal);
    label(ctx, 'Prefill', 579, 759, 28);
    box(ctx, 794, 735, 52, 24, C.rust);
    label(ctx, 'Transfer', 867, 759, 28);
    foot(
      ctx,
      'The longest prefill and longest transfer belong to different requests. Each request took 100 ms.',
    );
  } else if (i === 6) {
    label(ctx, 'One transfer with a retransmission', 110, 296, 48, C.ink, 'Serif');
    const retry = cue(c, 6, 'rise on retries');
    for (let j = 0; j < 2; j++) {
      const y = 400 + j * 167;
      label(ctx, j ? 'Link crossings' : 'Unique payload', 110, y + 53, 37, C.dim);
      const sequence = j && retry ? [1, 2, 2, 3, 4] : [1, 2, 3, 4];
      sequence.forEach((v, k) => {
        box(ctx, 567 + k * 179, y, 152, 91, j && retry && k === 2 ? C.copper : C.gray, C.ink, 4);
        mono(ctx, v, 643 + k * 179, y + 59, 40, C.ink, 'center');
      });
    }
    foot(
      ctx,
      'A repeated segment adds wire traffic. The receiver counts each useful segment once.',
    );
  } else {
    const answers = cue(c, 7, 'two finish'),
      rejected = cue(c, 7, 'eight are rejected');
    label(ctx, 'Offered load', 107, 311, 52, C.ink, 'Serif');
    for (let j = 0; j < 10; j++) {
      const x = 114 + j * 171,
        ok = j < 2 && answers,
        fail = j >= 2 && rejected;
      box(ctx, x, 397, 147, 155, ok ? C.teal : fail ? '#efd6bd' : C.paper, C.line, 6);
      mono(
        ctx,
        ok ? 'met' : fail ? 'reject' : '·',
        x + 73,
        490,
        31,
        ok ? C.bright : C.ink,
        'center',
      );
    }
    if (rejected) mono(ctx, '2 on time  /  10 offered', 111, 708, 62, C.ink);
    foot(
      ctx,
      'Hold workload, output lengths, hardware budget and objectives fixed for the comparison.',
    );
  }
}
