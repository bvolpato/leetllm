import {
  C,
  label,
  mid,
  mono,
  box,
  line,
  dot,
  crescent,
  tag,
  note,
  rows,
  cells,
  step,
  on,
  panel,
  trace,
  buffer,
} from './paint.mjs';
import {
  requests,
  category,
  ids,
  pin,
  schedulerReview,
  payload,
  transferMs,
  trials,
  prefixReuse,
  handoff,
} from './examples.mjs';
import { drawPoolReplay } from './pools.mjs';
const mib = 2 ** 20;
const total = payload / mib;
function transfer(c, k) {
  if (!on(k, 2, 'Follow R forty-two’s handoff')) {
    const split = k.beat.beatIndex > 0, wait = on(k, 1, 'When that prefill finishes');
    drawPoolReplay(c, split, wait);
    note(c, on(k, 2, 'Replay the same arrivals')
      ? 'Measure R0’s token gap and R42’s handoff on the same workload.'
      : wait ? 'R42’s prefill is complete. Its decode worker still needs the KV.'
      : split ? 'R0 starts at 0 ms. R42 still needs the full prefill chunk.'
      : 'The shared worker starts R0’s decode when the long chunk finishes.');
    return;
  }
  const allocated = on(k, 3, 'Reserve destination'),
    progress = step(k, 3, 'follow the transfer', 1.8);
  // Leave the last section in transit until its separate arrival cue.
  const bytes = on(k, 4, 'The last bytes arrive') ? total : Math.floor(total * 0.75 * progress);
  const ready = on(k, 4, 'The reader gets a ready event'),
    canDecode = handoff(total, bytes, 8, ready ? 8 : null).canDecode,
    read = canDecode && on(k, 4, 'Decode can start');
  panel(c, 40, 148, 291, 270, 'Prefill worker', C.blue);
  crescent(c, 74, 217, 13);
  label(c, 'R42 prompt', 102, 227, 29, C.blue, { face: 'Serif' });
  label(c, 'K + V   ·   32 layers', 62, 276, 20, C.soft);
  label(c, '8 heads   ·   4,096 positions', 62, 315, 18, C.soft);
  tag(c, total + ' MiB', 62, 349, 178, C.sky);
  panel(c, 369, 148, 551, 270, 'Decode worker');
  label(c, allocated ? 'Capacity reserved: 512 MiB' : 'Awaiting reservation', 390, 221, 21, C.soft);
  if (allocated) buffer(c, 391, 243, 507, 65, bytes, total, 4);
  label(c, bytes + ' MiB received', 392, 352, 24);
  tag(c, read ? 'decode active' : canDecode ? 'ready' : 'waiting', 677, 324, 194, read ? C.mint : C.pale);
  if (bytes === total) label(c, ready ? 'Ready event for R42’s current transfer' : 'Awaiting current ready event',
    392, 396, 19, ready ? C.sea : C.soft);
  note(
    c,
    on(k, 3, 'transfer-time lower bound')
      ? 'Unsharded full attention  /  achieved 25 GB/s  /  payload-only bound ' +
          transferMs.toFixed(2) +
          ' ms'
      : 'Unsharded full attention  /  128 scalars per head at each position  /  2 bytes per scalar',
  );
}
function payloadBuild(c, k) {
  const b = k.beat.beatIndex;
  const dims = on(k, 1, 'Stack thirty-two layers')
    ? 3
    : on(k, 1, 'Take eight')
      ? 2
      : on(k, 0, 'Add a matching value tensor')
        ? 1
        : 0;
  const speechDone = (beat) => b > beat || (b === beat && k.elapsed >= k.speechDuration);
  const massShown = [
    on(k, 0, 'That is just'),
    speechDone(0),
    on(k, 1, 'Each layer has'),
    speechDone(1),
  ][dims];
  const n = [1, 2, 16, 512][dims];
  if (b < 3) {
    label(c, 'Full attention  /  4,096 positions × 128 scalars × 2 bytes', 40, 161, 20, C.soft);
    const count = [1, 2, 16, 32][dims],
      w = dims < 2 ? 128 : 64,
      h = dims < 2 ? 100 : 32;
    for (let i = 0; i < count; i++) {
      const x = 42 + (i % 8) * (w + 6),
        y = 197 + Math.floor(i / 8) * (h + 6);
      box(c, x, y, w, h, i % 2 && dims < 3 ? C.mint : C.sky, C.line, 2);
      mid(c, dims === 3 ? String(i + 1) : i % 2 ? 'V' : 'K', x + w / 2, y + h / 2 + 6, 17);
    }
    label(
      c,
      dims === 3
        ? '32 layers'
        : dims === 2
          ? '8 key/value pairs'
          : dims === 1
            ? 'One KV head'
            : 'One key tensor',
      40,
      409,
      22,
      C.soft,
    );
    label(c, massShown ? n + ' MiB' : '? MiB', 663, 295, 51, C.blue, { face: 'Serif' });
    label(c, dims === 3 ? 'complete payload' : 'so far', 665, 332, 20, C.soft);
    note(
      c,
      dims === 3
        ? '2 × 32 × 8 × 128 × 4,096 × 2 bytes  /  unsharded, uncompressed, no reuse'
        : 'Assumes unsharded, uncompressed tensors with no prefix reuse.',
    );
  } else {
    label(c, 'Payload time at an achieved 25 decimal GB/s', 40, 163, 23);
    const left = 75,
      right = 873,
      x = (t) => left + ((right - left) * t) / 25;
    line(c, left, 292, right, 292, C.line, 3);
    const w = x(transferMs) - left;
    const measured = on(k, 3, 'twenty-one point four seven');
    if (measured) box(c, left, 239, w, 49, C.sky, null, 4);
    line(c, x(10), 205, x(10), 335, C.red, 3, [5, 4]);
    mid(c, '10 ms allowance', x(10), 369, 20, C.red);
    if (measured) mid(c, transferMs.toFixed(2) + ' ms', x(transferMs), 222, 24, C.blue);
    mono(c, '536,870,912 bytes ÷ 25,000,000,000 bytes/s', 40, 409, 23, C.ink, 875);
    note(
      c,
      b >= 4
        ? 'Payload alone exceeds the allowance. Setup, queueing and synchronization add time.'
        : 'One unsharded, uncompressed payload. Compare only its byte time with the allowance.',
    );
  }
}
function reservation(c, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    const n = Math.round(10 * step(k, 0, 'ten pending prefills', 1.0));
    label(c, 'Destination KV pool  /  one outline per 512 MiB reservation', 40, 165, 20, C.soft);
    for (let i = 0; i < 10; i++) {
      const x = 40 + (i % 5) * 177,
        y = 194 + Math.floor(i / 5) * 80;
      box(c, x, y, 163, 64, i < n ? C.sky : C.paper, C.line);
      mid(c, i < n ? 'R' + i : 'free', x + 81, y + 39, 23);
    }
    label(c, (n * total) / 1024 + ' GiB reserved', 40, 398, 27, C.blue);
    label(c, '0 MiB received', 397, 398, 25, C.soft);
    label(c, '0 decoding', 727, 398, 25, C.soft);
  } else {
    const deferred = on(k, 1, 'prefill-complete alternative');
    const left = 259,
      unit = 14.9;
    const slab = (start, len, y, t, col) => {
      box(c, left + start * unit, y, len * unit, 39, col);
      mid(c, t, left + (start + len / 2) * unit, y + 26, 16);
    };
    label(c, 'Early reservation', 40, 198, 21);
    slab(0, 20, 158, 'prefill', C.sky);
    slab(10, 20, 207, 'chunked transfer', C.mint);
    if (deferred) {
      label(c, 'After prefill', 40, 331, 21);
      slab(0, 20, 285, 'prefill', C.sky);
      slab(20, 20, 334, 'reserve + transfer', C.mint);
    }
    label(c, 'Illustrative order of events', 40, 407, 18, C.soft);
  }
  note(
    c,
    b
      ? 'Deferral keeps source KV longer and exposes transfer after the final prefill.'
      : 'Reserved space, arrived bytes and active requests measure different things.',
  );
}
function interruption(c, k) {
  const fill = step(k, 2, 'Watch the final section fill', 1.35);
  const received = 384 + Math.round(128 * fill);
  const old = on(k, 2, 'attempt seven'),
    current = on(k, 3, 'for eight arrives'),
    changed = on(k, 4, 'layout to L one');
  const layout = changed ? 'L1' : 'L2';
  const s = handoff(total, received, 8, current ? 8 : old ? 7 : null, layout);
  const verdict =
    on(k, 5, 'The reader waits') ||
    (!changed && on(k, 3, 'Its reader can start')) ||
    (!changed && !current && on(k, 1, 'The reader waits here'));
  crescent(c, 53, 150, 11);
  label(c, 'R42  /  receiver requires attempt 8 and layout L2', 79, 158, 21, C.blue);
  buffer(c, 40, 181, 880, 65, received, total, 4);
  label(c, received + ' / ' + total + ' MiB received', 40, 286, 25);
  label(c, 'Received layout  ' + layout, 619, 286, 22, changed ? C.red : C.soft);
  rows(
    c,
    [
      ['Attempt 7', old ? 'late ready event' : 'previous transfer'],
      ['Attempt 8', current ? 'current ready event' : 'awaiting ready event'],
    ],
    40,
    310,
    534,
    { height: 48 },
  );
  panel(c, 612, 305, 308, 117, 'Decode reader');
  label(
    c,
    verdict ? (s.canDecode ? 'Read KV' : 'Hold') : 'May it read?',
    633,
    392,
    31,
    verdict && s.canDecode ? C.sea : C.ink,
    { face: 'Serif' },
  );
  note(
    c,
    changed
      ? 'Same byte count and current event. Received L1, required L2.'
      : current
        ? 'Ready(8)  /  model, layout, dtype and positions match.'
        : old
          ? 'Ready(7) belongs to the earlier transfer.'
          : fill === 0
            ? on(k, 1, 'One hundred twenty-eight mebibytes are missing')
              ? '128 MiB still missing.'
              : 'Four equal sections. Three have arrived.'
            : 'The reservation size stays fixed as the last bytes arrive.',
  );
}
function cpu(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    const bKey = on(k, 0, 'requested key to B'),
      show = bKey ? on(k, 0, 'The article also') : on(k, 0, 'Change only');
    label(c, 'Stored A  /  CPU lookup with match_len', 40, 169, 22, C.soft);
    cells(
      c,
      ids,
      40,
      191,
      880,
      64,
      ids.map((_, i) => (i < 4 ? C.sky : C.paper)),
    );
    rows(
      c,
      [
        ['Stored adapter', 'A'],
        ['Requested adapter', bKey ? 'B' : 'A'],
        [
          'Whole-page match',
          show ? prefixReuse(ids, ids, 'A', bKey ? 'B' : 'A', 4).reusable + ' tokens' : '?',
        ],
      ],
      40,
      275,
      880,
      { height: 46 },
    );
  } else {
    panel(c, 40, 152, 880, 266, 'Model-backed replay  /  worker trace to collect');
    rows(
      c,
      [
        ['Fixed', 'worker, model, adapter, tokenizer'],
        ['Change', 'repeat prompt, then edit first ID'],
        ['Lookup', b > 1 ? 'matched positions' : 'which counter?'],
        ['Forward', b > 1 ? 'fresh prefill positions' : 'which counter?'],
      ],
      61,
      210,
      836,
      { height: 47 },
    );
  }
  note(
    c,
    b
      ? 'The worker trace can establish which prompt inputs actually ran.'
      : 'A CPU helper checks token and page arithmetic.',
  );
}
function benchmark(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    for (const [i, name] of ['Baseline', 'Candidate'].entries()) {
      const x = 40 + i * 450;
      panel(c, x, 148, 428, 272, name, i ? C.plum : C.blue);
      rows(
        c,
        [
          ['Replay', ''],
          ['Schema', 'same required schema'],
          ['Hardware', 'same model / device'],
          ['Cache', 'same warm-up'],
          ['Speculation', b ? (i ? 'enabled' : 'disabled') : 'record setting'],
        ],
        x + 21,
        206,
        387,
        { height: 38, labels: 0.34 },
      );
      crescent(c, x + 164, 225, 9);
      mono(c, requests[0].id, x + 182, 232, 21, C.blue);
      mono(c, '+', x + 234, 232, 18, C.soft);
      mono(c, requests[1].id, x + 258, 232, 21, C.red);
    }
  } else {
    panel(c, 40, 151, 880, 265, 'Fixed replay  /  locate the wait');
    rows(
      c,
      [
        ['Nsight Systems', 'queue → launch → transfer'],
        ['Nsight Compute', 'kernel occupancy and memory traffic'],
        ['Client', 'TTFT, ITL, median, p99, errors'],
      ],
      62,
      211,
      833,
      { height: 58, labels: 0.32 },
    );
  }
  note(
    c,
    b === 0
      ? 'Bind the software revisions, workload lengths, arrival pattern and scoring to both runs.'
      : 'Change one supported mode. Preserve request content and the service quality check.',
  );
}
function goodput(c, k) {
  const showA = on(k, 2, 'Goodput is'),
    showB = on(k, 3, 'one hundred five qualify'),
    scoreB = on(k, 4, 'At ten offered'),
    scoredA = k.beat.beatIndex > 2 || (k.beat.beatIndex === 2 && k.elapsed >= k.speechDuration);
  for (const [i, t] of trials.entries()) {
    const x = 40 + 450 * i,
      show = i ? showB : showA,
      scored = i ? scoreB : scoredA,
      visible = i ? k.beat.beatIndex >= 3 : k.beat.beatIndex >= 2;
    panel(
      c,
      x,
      149,
      429,
      274,
      visible ? t.rate + ' offered per second' : 'Trial ' + (i ? 'B' : 'A'),
      i ? C.plum : C.blue,
    );
    if (visible) {
      for (let j = 0; j < t.offered; j++) {
        const px = x + 28 + (j % 20) * 19.2,
          py = 216 + Math.floor(j / 20) * 14;
        dot(c, px, py, 4.4, show ? (j < t.qualified ? C.sea : C.red) : C.line);
      }
      label(
        c,
        show ? t.qualified + ' / ' + t.offered + ' qualify' : 'Scoring attempts',
        x + 21,
        323,
        22,
      );
      label(
        c,
        scored
          ? t.goodput + ' qualified/s  ·  ' + 100 * t.fraction + '%'
          : 'Goodput and qualifying fraction?',
        x + 21,
        359,
        21,
        C.soft,
        { w: 383 },
      );
      if (scored)
        tag(c, t.pass ? 'Passes ≥90%' : 'Below 90%', x + 21, 374, 236, t.pass ? C.mint : C.peach);
    } else {
      const measures = i
        ? ['Qualifying share', 'valid and timely ÷ offered', 'At least 90% to pass']
        : ['Qualified goodput', 'valid and timely ÷ seconds', 'Count every measured second'];
      label(c, measures[0], x + 21, 230, 27, C.ink, { face: 'Serif' });
      label(c, measures[1], x + 21, 300, 23, C.blue);
      label(c, measures[2], x + 21, 360, 20, C.soft);
    }
  }
  note(c, 'Ten-second trials  /  all offered attempts count  /  threshold 90% valid and timely');
}
function diagnose(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const altered = on(k, 0, 'The prefix hit falls');
    const edited = b === 0 && altered;
    const cold = on(k, 1, 'Now send'),
      worker = cold ? 'B' : 'A';
    const warm = [10, 20, 30, 40],
      req = edited ? [99, 20, 30, 40] : warm,
      local = cold ? [] : warm;
    const hit = prefixReuse(local, req, 'A', 'A').reusable,
      show = !cold || on(k, 2, 'Zero on B');
    label(c, 'Incoming request  /  model R7, adapter A', 40, 170, 20, C.soft);
    cells(
      c,
      req,
      40,
      185,
      880,
      63,
      req.map((_, i) => (edited && !i ? C.peach : C.paper)),
    );
    label(c, 'Local replica ' + worker + '  /  ' + (cold ? 'cold' : 'warm'), 40, 297, 20, C.soft);
    cells(
      c,
      cold ? ['·', '·', '·', '·'] : warm,
      40,
      311,
      880,
      63,
      cold ? [] : Array(4).fill(C.sky),
    );
    if (b > 0)
      label(c, 'Observed on A: original prefix 4  /  edited first ID 0', 40, 413, 20, C.soft);
    note(
      c,
      show
        ? hit + ' matched prefix positions on ' + worker
        : 'Same restored request on B. How many positions match locally?',
    );
  } else {
    drawPoolReplay(c, false);
    note(c, 'Trace the admitted chunk, runner time and queues for the delayed decode.');
  }
}
function sourceFiles(c, k) {
  if (!on(k, 1, 'Suppose you change the scheduler')) {
    panel(c, 40, 157, 421, 251, 'SGLang core source', C.plum);
    mono(c, 'LICENSE', 62, 242, 27);
    if (on(k, 1, 'Apache two point zero')) label(c, 'Apache-2.0', 62, 318, 37, C.plum);
    if (on(k, 1, 'Check the license')) {
      panel(c, 484, 157, 436, 251, 'Check each component', C.blue);
      label(c, 'Model checkpoint', 505, 238, 24);
      label(c, 'Tokenizer', 505, 282, 24);
      label(c, 'Dataset', 505, 326, 24);
      label(c, 'Third-party kernel', 505, 370, 24);
    }
    return;
  }
  const entry = on(k, 1, 'Look up its directory');
  const selected = on(k, 1, 'Ying Sheng');
  label(c, 'Changed file', 40, 153, 19, C.soft);
  mono(c, schedulerReview.path, 40, 192, 27, C.ink);
  if (!entry) return;
  panel(c, 40, 219, 880, 199, '.github/CODEOWNERS', C.blue);
  mono(c, 'revision ' + pin.slice(0, 7), 668, 254, 19, C.soft);
  mono(c, schedulerReview.directoryRule, 62, 303, 24);
  let x = 62;
  for (const login of schedulerReview.owners) {
    const handle = '@' + login;
    const highlight = selected && login === schedulerReview.reviewer.login;
    mono(c, handle, x, 376, 21, highlight ? C.sea : C.soft);
    const width = c.measureText(handle).width;
    if (highlight) line(c, x, 383, x + width, 383, C.sea, 3);
    x += width + 24;
  }
  if (selected) {
    note(c, schedulerReview.reviewer.name + ' (' + schedulerReview.reviewer.login + ') can review this change.');
  }
}
function source(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    panel(c, 40, 157, 421, 251, 'Founding paper', C.blue);
    label(c, 'Lianmin Zheng, Liangsheng Yin,', 62, 237, 23);
    label(c, 'Zhiqiang Xie, Ying Sheng', 62, 276, 23);
    label(c, 'and collaborators', 62, 315, 23);
    panel(c, 484, 157, 436, 251, 'sgl-project / sglang', C.plum);
    label(c, 'LMSYS incubation', 505, 244, 28, C.ink, { face: 'Serif' });
    label(
      c,
      'Multi-contributor implementation',
      505,
      307,
      20,
      C.soft,
    );
  } else if (b === 1) {
    sourceFiles(c, k);
  } else {
    label(c, 'Reading revision', 40, 158, 17, C.soft);
    mono(c, pin, 40, 199, 24, C.blue);
    const routes = [
      ['Named output', 'lang API → IR → interpreter'],
      ['Stalled batch', 'scheduler → budget → radix locks'],
      ['Legal token', 'grammar manager'],
      ['Draft method', 'speculative registry'],
      ['Missing KV', 'prefill → decode transfer'],
    ];
    const active =
      b === 2
        ? on(k, 2, 'stalled batch')
          ? 1
          : 0
        : on(k, 3, 'prefill and decode modules')
          ? 4
          : on(k, 3, 'speculative registry') ? 3 : 2;
    rows(
      c,
      routes.map(([a, v], i) => [a, v, i === active ? C.sea : C.soft]),
      40,
      224,
      880,
      { height: 41, labels: 0.31 },
    );
    note(c, 'Trace the deployed worker at its installed revision.');
  }
}
function desk(c, k) {
  const show = on(k, 2, 'Send the bug reply');
  panel(c, 40, 150, 337, 266, 'Settings  /  ' + requests[0].id, C.blue);
  crescent(c, 340, 177, 14);
  label(c, 'Add dark mode', 61, 237, 36, C.ink, { face: 'Serif' });
  label(c, 'to settings', 61, 279, 36, C.ink, { face: 'Serif' });
  tag(c, 'Reference  /  feature', 61, 336, 260, C.sky);
  for (const [i, value] of [requests[0].label, category.category].entries()) {
    const y = 150 + i * 142;
    panel(c, 407, y, 513, 123, 'Reply ' + (i + 1) + '  /  schema passes');
    mono(c, JSON.stringify({ category: value }), 429, y + 83, 22, C.ink, 310);
    if (show) {
      const pass = value === requests[0].label;
      tag(c, pass ? 'accept' : 'review', 770, y + 56, 130, pass ? C.mint : C.peach);
    }
  }
  note(
    c,
    show
      ? 'The same schema accepts both strings. The reference label separates the replies.'
      : 'Check the category against the user’s request.',
  );
}
function finalPractice(c, k) {
  const fill = step(k, 2, 'Watch the last thirty-two', 1.3),
    received = 64 + Math.round(32 * fill),
    replayed = k.beat.beatIndex >= 3;
  const beat = k.beat.beatIndex;
  const complete = (i, phrase) =>
    beat > i || (beat === i && k.elapsed + 1e-9 >= k.wordCue(phrase).end);
  const named = complete(1, 'Zero positions carry over from A');
  const shown = complete(1, 'B still needs thirty-two mebibytes');
  const seven = ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    reused = prefixReuse(seven, seven, 'A', 'B', 4).reusable;
  label(c, 'Store A  /  request B  /  page size 4', 40, 153, 19, C.soft);
  cells(
    c,
    seven,
    40,
    169,
    547,
    39,
    seven.map((_, i) => (i < 4 ? C.sky : C.paper)),
  );
  label(
    c,
    named ? reused + ' reusable from A' : 'Reusable from A?',
    646,
    197,
    24,
    named ? C.plum : C.soft,
  );
  if (!replayed) {
    panel(c, 40, 234, 880, 184, 'Receiving worker  /  B  /  attempt 2');
    buffer(c, 62, 291, 836, 52, received, 96, 3);
    label(c, received + ' / 96 MiB received', 62, 389, 23);
    label(c, shown ? 96 - received + ' MiB missing' : 'Ready event pending', 539, 389, 23, C.soft);
    label(c, received === 96
      ? 'Full buffer. Attempt 2 still needs its ready event.'
      : 'What else must arrive before this worker can read?',
      40, 433, 19, C.sea);
  } else {
    const left = complete(3, 'The left event belongs to attempt one');
    const right = complete(3, 'The right event belongs to attempt two');
    const openPhrase = 'Only the right reader may start';
    const waitPhrase = 'The left reader keeps waiting for two';
    const open = complete(4, openPhrase);
    const wait = complete(4, waitPhrase);
    const progress = (phrase) => {
      if (beat !== 4) return Number(beat > 4);
      const { start, end } = k.wordCue(phrase);
      return Math.max(0, Math.min(1, (k.elapsed - start) / (end - start)));
    };
    for (const [i, event] of [left ? 1 : null, right ? 2 : null].entries()) {
      const x = 40 + 450 * i,
        s = handoff(96, received, 2, event);
      panel(c, x, 237, 429, 181, (i ? 'Right' : 'Left') + ' replay  /  B  /  attempt 2');
      buffer(c, x + 18, 295, 392, 43, received, 96, 3);
      label(c, event === null ? 'No event yet' : 'Ready(' + event + ')', x + 20, 391, 22, C.soft);
      const gateX = x + 215;
      const result = s.canDecode ? open : wait;
      const verdictColor = s.canDecode ? C.sea : C.plum;
      line(c, x + 104, 368, gateX, 368, C.line, 2);
      if (s.canDecode && open) line(c, gateX, 368, x + 246, 368, verdictColor, 2);
      else line(c, gateX, 358, gateX, 378, result ? verdictColor : C.line, 2);
      const p = progress(i === 1 ? openPhrase : waitPhrase);
      if (event !== null && p > 0) {
        const tokenX = x + 104 + (s.canDecode ? 142 : 104) * p;
        dot(c, tokenX, 368, 9, verdictColor);
        mid(c, event, tokenX, 373, 13, C.paper, 16);
      }
      if (result)
        tag(c, s.canDecode ? 'Read KV' : 'Wait for 2', x + 257, 376, 150,
          s.canDecode ? C.mint : C.peach, C.ink, 29);
      else
        label(c, 'Requires Ready(2)', x + 246, 399, 17, C.soft, { w: 156 });
    }
    label(c, 'Same B buffer, model, layout, dtype and positions in both replays.', 40, 433, 19, C.sea);
  }
}
export const deliveryScenes = [
  transfer,
  payloadBuild,
  reservation,
  interruption,
  cpu,
  benchmark,
  goodput,
  diagnose,
  source,
  desk,
  finalPractice,
];
