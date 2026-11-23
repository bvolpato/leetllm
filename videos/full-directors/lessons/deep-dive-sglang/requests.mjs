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
  mix,
  panel,
  trace,
} from './paint.mjs';
import {
  requests,
  prompt,
  explanationState,
  pinnedMatch,
  ids,
  locations,
  cachedPage,
  localQueue,
  nextLocalRequest,
  tierLookup,
  common,
  prefixReuse,
  a,
  z,
  other,
  stamps,
  gaps,
  first,
  second,
} from './examples.mjs';
import { drawPoolReplay } from './pools.mjs';

// Both windows keep their request and selected value when the program reads a copy.
function requestWindow(c, request, x, y, settings) {
  const w = 395, header = settings ? C.blue : C.peach;
  box(c, x, y, w, 174, C.paper, C.line, 12);
  c.save();
  c.clip();
  c.fillStyle = header;
  c.fillRect(x, y, w, 46);
  c.restore();
  label(c, settings ? 'Settings' : 'Sign in', x + 21, y + 31, 21, settings ? C.paper : C.ink, { bold: true });
  mono(c, request.id, x + w - 58, y + 30, 17, settings ? C.paper : C.red);
  if (settings) {
    label(c, 'Add dark mode', x + 21, y + 98, 32, C.ink, { face: 'Serif' });
    box(c, x + 291, y + 62, 80, 40, C.sky, C.blue, 20);
    dot(c, x + 312, y + 82, 16, C.paper);
    crescent(c, x + 312, y + 82, 10);
  } else {
    mono(c, 'HTTP ' + request.status, x + 20, y + 97, 27, C.red);
    label(c, 'Server error', x + 194, y + 97, 23, C.soft);
  }
  line(c, x + 21, y + 119, x + w - 21, y + 119);
  label(c, 'Label', x + 21, y + 155, 21, C.soft);
  if (request.label) {
    tag(c, request.label, x + 216, y + 127, 108, C.sky, C.blue);
  } else {
    c.save();
    c.setLineDash([5, 4]);
    box(c, x + 216, y + 127, 108, 36, null, C.soft, 5);
    c.restore();
  }
}

function opening(c, k) {
  const [settings, signIn] = requests;
  const arrive = step(k, 0, 'Someone wants', 0.75);
  const neighbor = step(k, 0, 'A second user', 0.85);
  const ask = on(k, 0, 'Which explanation can start');
  const take = on(k, 1, 'Take the dark-mode request');
  const travel = step(k, 1, 'Copy feature', 1.3);
  const submit = on(k, 1, 'Now start');
  const writing = step(k, 1, 'Dark mode would', 2.35);
  const reply = explanationState(settings, travel, submit, writing);
  const x = 57, y = 102;
  requestWindow(c, settings, x - 22 * (1 - arrive), y + 12 * (1 - arrive), true);
  if (neighbor > 0) {
    c.save();
    c.globalAlpha = neighbor;
    requestWindow(c, signIn, 508 + 25 * (1 - neighbor), y, false);
    c.restore();
  }
  if (ask && !take) {
    label(c, k.beat.chapterTitle, 480, 379, 42, C.ink, { face: 'Serif', align: 'center' });
  }
  if (!take) return;

  // The continuation hangs directly under its owner. Leave the other request still.
  line(c, x + 13, y + 174, x + 13, 454, C.sky, 3);
  label(c, 'Prompt', x + 30, 314, 20, C.blue);
  mono(c, 'Label:', x + 30, 362, 23);
  const destX = x + 133, destY = 334;
  line(c, destX, destY + 34, destX + 108, destY + 34, C.line);
  if (travel > 0) {
    const t = travel * travel * (3 - 2 * travel);
    tag(c, settings.label, mix(x + 216, destX, t), mix(y + 127, destY, t), 108, C.sky, C.blue);
  }
  if (!reply.assembled) return;
  mono(c, reply.assembled.split('\n')[1].trimEnd(), x + 30, 408, 23);
  if (!reply.started) return;
  label(c, reply.text, x + 30, 445, 21, C.sea, { face: 'Serif' });
  if (writing < 1) {
    const cursor = x + 32 + c.measureText(reply.text).width;
    line(c, cursor, 428, cursor, 447, C.sea, 2);
  }
}
function program(c, k) {
  const b = k.beat.beatIndex,
    returned = on(k, 2, 'Append it'),
    append = on(k, 2, 'Add Explanation'),
    cursor = on(k, 2, 'Now the cursor');
  panel(c, 40, 142, 341, 277, 'R42  /  Python program', C.blue);
  crescent(c, 351, 169, 11);
  mono(c, 'select("label", …)', 62, 227, 23);
  label(c, 'bug   /   feature   /   question', 62, 264, 18, C.soft);
  line(c, 62, 290, 354, 290);
  mono(c, 'gen("explanation", …)', 62, 338, 20);
  tag(
    c,
    cursor ? 'submitted' : returned ? 'assembling prompt' : 'waiting for label',
    62,
    363,
    215,
    cursor ? C.mint : C.pale,
  );
  panel(c, 411, 142, 509, 277, 'Assembled messages');
  rows(
    c,
    [
      ['system', 'Return concise, evidence-backed answers.'],
      ['user', requests[0].user],
    ],
    433,
    194,
    461,
    { labels: 0.2, height: 48 },
  );
  mono(c, 'Label: ' + (returned ? requests[0].label : ''), 434, 326, 26);
  if (append)
    mono(c, prompt(requests[0]).split('\n')[1] + (cursor ? '▏' : ''), 434, 373, 25, C.blue);
  note(
    c,
    b >= 3
      ? 'Integration example  /  next check: named outputs on a configured backend'
      : cursor
        ? 'The next generated span starts at the cursor.'
        : 'Program state owns the named value.',
  );
}
function branches(c, k) {
  const fork = step(k, 0, 'independent prompt-state', 0.9),
    done = on(k, 1, 'Join collects'),
    wait = on(k, 1, 'Now change the heading');
  if (wait) {
    panel(c, 40, 174, 407, 191, 'Reason  /  completed');
    label(c, 'Adds a display option.', 63, 282, 29, C.ink, { face: 'Serif' });
    line(c, 448, 267, 503, 267, C.sea, 3);
    panel(c, 505, 174, 415, 191, 'Heading  /  dependent input', C.plum);
    mono(c, 'Summarize this reason:', 528, 251, 20);
    label(c, 'Adds a display option.', 528, 298, 27, C.ink, { face: 'Serif' });
    note(c, 'Submit the heading task after the reason becomes available.');
    if (k.beat.beatIndex >= 2) {
      tag(c, 'Paper metric: completed program instances/s', 40, 385, 529, C.sky);
    }
    return;
  }
  tag(c, 'R42  /  shared prompt', 40, 254, 213, C.sky);
  [180, 333].forEach((y, i) => {
    const yy = y + 25;
    line(c, 253, 272, mix(253, 331, fork), mix(272, yy, fork), C.blue, 2);
    panel(c, 331, yy - 25, 300, 83, i ? 'Write heading' : 'Write reason', i ? C.plum : C.sea);
    label(
      c,
      done
        ? i
          ? 'Display settings'
          : 'Adds a display option'
        : i
          ? 'own stop state'
          : 'own output span',
      352,
      yy + 35,
      18,
    );
    if (done) line(c, 631, yy + 5, 709, 272, i ? C.plum : C.sea, 2);
  });
  if (done) {
    panel(c, 709, 228, 211, 95, 'join');
    label(c, '2 named results', 729, 295, 20);
  }
  note(c, 'Independent branches inherit the same instructions.');
}
function owners(c, k) {
  const phases = [
    [0, 'entrypoints'],
    [0, 'tokenizer manager'],
    [1, 'scheduler owns'],
    [1, 'model runner'],
    [2, 'Grammar and sampling'],
    [2, 'Detokenization supplies'],
    [2, 'streaming delivers'],
  ];
  const index = Math.max(
    0,
    phases.reduce((n, [b, p], i) => (on(k, b, p) ? i : n), -1),
  );
  const steps = ['entry', 'tokenizer', 'scheduler', 'runner', 'sampling', 'detokenizer', 'client'];
  const data = [
    ['Request payload', 'R42  /  user + assistant roles'],
    ['Model input', 'R42  /  token IDs + request state'],
    ['Runnable batch', 'R42  /  input positions + KV locations'],
    ['Model forward', 'R42  /  batch → next-token scores'],
    ['Selected output', 'R42  /  legal sampled ID'],
    ['Decoded text', 'R42  /  text for the stream'],
    ['Client arrival', 'R42  /  delivered text chunk'],
  ];
  trace(c, [65, 198, 339, 472, 601, 742, 890], 191, steps, index);
  panel(c, 121, 278, 721, 119, data[index][0]);
  crescent(c, 151, 357, 12);
  mono(c, data[index][1], 177, 366, 28, C.blue, 642);
  note(c, 'Request identity stays with the work across queues and processes.');
}
function clocks(c, k) {
  const n = on(k, 0, 'Later output arrivals') ? 4 : on(k, 0, 'two hundred forty') ? 2 : 1;
  const result = on(k, 2, 'These constructed times');
  const px = (v) => 77 + v * 2.22;
  line(c, px(0), 242, px(350), 242, C.ink, 3);
  stamps.slice(0, n).forEach((v, i) => {
    dot(c, px(v), 242, 8, i ? C.sea : C.blue);
    mid(c, v + ' ms', px(v), 207, 20);
    mid(c, i ? 'token ' + i : 'request', px(v), 282, 16, C.soft);
  });
  for (let i = 0; i < Math.min(n - 1, 3); i++) {
    const x = px(stamps[i]),
      end = px(stamps[i + 1]);
    line(c, x, 337, end, 337, i ? C.plum : C.blue, 3);
    line(c, x, 329, x, 346);
    line(c, end, 329, end, 346);
    mid(c, result ? gaps[i] + ' ms' : '?', (x + end) / 2, 380, 24, i ? C.plum : C.blue);
  }
  note(
    c,
    result
      ? 'TTFT spans request to first arrival. ITL uses adjacent output arrivals.'
      : 'One illustrative clock measured at the client',
  );
}
function mixed(c, k) {
  if (on(k, 4, 'Now look at a separate run')) {
    drawPoolReplay(c, false);
    note(c, 'The shared worker starts R0’s decode when the long chunk finishes.');
    return;
  }
  const p1 = on(k, 1, 'Four remain'),
    p2 = on(k, 2, 'One slot goes unused'),
    both = on(k, 3, 'Now both'),
    selected = on(k, 2, 'The selected token'),
    consumed = on(k, 3, 'Now both');
  const active = consumed || both ? 3 : p2 ? 2 : p1 ? 1 : 0;
  const chunk = active === 1 ? first : second;
  label(c, 'Compatible prefix already in KV', 40, 155, 20, C.soft);
  cells(c, ids.slice(0, 4), 40, 169, 340, 41, Array(4).fill(C.sky));
  label(c, 'R1  /  unmatched prompt remaining', 40, 252, 20, C.soft);
  const remaining = active ? chunk.remaining : 9;
  const queued = Array.from({ length: 9 }, (_, i) => (i < 9 - remaining ? '·' : 'P' + (i + 1)));
  cells(
    c,
    queued,
    40,
    270,
    548,
    46,
    queued.map((v) => (v === '·' ? C.pale : C.paper)),
  );
  panel(c, 635, 146, 285, 174, 'R1  /  first output');
  label(
    c,
    consumed
      ? 'KV ready'
      : selected
        ? 'selected'
        : active === 2
          ? 'prefill finished'
          : 'awaiting prefill',
    657,
    244,
    28,
    C.ink,
  );
  label(
    c,
    consumed ? 'forward complete' : selected ? 'own forward pending' : 'no selected token',
    657,
    284,
    18,
    C.soft,
  );
  label(
    c,
    active ? 'Fresh positions  /  step ' + active : 'Fresh positions  /  budget 6',
    40,
    353,
    19,
    C.soft,
  );
  const slots =
    active === 3
      ? ['R0', 'R1', 'free', 'free', 'free', 'free']
      : [
          'R0',
          ...Array.from({ length: 5 }, (_, i) =>
            !active ? '?' : i < chunk.prefill ? 'P' + (i + (active === 1 ? 1 : 6)) : 'free',
          ),
        ];
  cells(
    c,
    slots,
    40,
    370,
    880,
    52,
    slots.map((v) => (v === 'R0' || v === 'R1' ? C.peach : v.startsWith('P') ? C.mint : C.paper)),
  );
  note(
    c,
    active
      ? 'Fresh prompt work remaining: ' + remaining + ' positions'
      : 'Reserve one position for R0 decode. What fits beside it?',
  );
}
function pages(c, k) {
  const fifth = step(k, 1, 'second page', 0.8);
  label(c, 'Requested prompt positions', 40, 172, 20, C.soft);
  cells(c, ['P1', 'P2', 'P3', 'P4', 'P5'], 40, 187, 565, 49, Array(5).fill(C.mint));
  label(c, 'Allocator  /  four positions per page', 40, 282, 20, C.soft);
  cells(c, ['P1', 'P2', 'P3', 'P4'], 40, 301, 414, 66, Array(4).fill(C.sky));
  cells(c, [fifth ? 'P5' : '·', '·', '·', '·'], 488, 301, 414, 66, [
    fifth ? C.peach : C.pale,
    C.pale,
    C.pale,
    C.pale,
  ]);
  label(c, 'Free page', 40, 403, 22, C.blue);
  label(
    c,
    fifth ? 'Second page required · unavailable' : 'No second free page',
    488,
    403,
    22,
    fifth ? C.red : C.soft,
  );
  note(
    c,
    fifth
      ? 'Admission waits for enough KV slots.'
      : 'Fresh-input budget passes. Check physical capacity next.',
  );
}
function radix(c, k) {
  const split = step(k, 1, 'edge splits', 1.1),
    newQuery = on(k, 2, 'Try Birds fly'),
    changed = on(k, 2, 'switch the adapter');
  const query = newQuery ? other : z;
  const n = prefixReuse(a, query, 'A', changed ? 'B' : 'A').reusable;
  const count = changed
    ? on(k, 2, 'Real backends')
    : newQuery
      ? on(k, 2, 'Lake reappears')
      : on(k, 0, 'so their existing');
  label(c, 'Incoming  /  adapter ' + (changed ? 'B' : 'A'), 40, 163, 19, C.soft);
  cells(
    c,
    query,
    40,
    178,
    880,
    49,
    query.map((_, i) => (i < n && count ? C.mint : C.paper)),
  );
  label(c, 'Stored  /  adapter A', 40, 277, 19, C.soft);
  const edge = common(a, z);
  const trunk = a.slice(0, edge).join(' ');
  if (split === 0) {
    tag(c, a.join(' '), 40, 316, 833, C.sky);
    note(
      c,
      count
        ? 'First lookup: four leading tokens agree.'
        : 'Compare the incoming words from the left.',
    );
    return;
  }
  tag(c, trunk, 40, 316, 342, C.sky);
  const dx = 491,
    dy = mix(316, 268, split);
  line(c, 382, 334, dx, dy + 18, C.blue, 2);
  tag(c, a.slice(edge).join(' '), dx, dy, 382, C.sky);
  if (split > 0) {
    const yy = mix(316, 367, split);
    line(c, 382, 334, dx, yy + 18, C.sea, 2);
    c.save();
    c.globalAlpha = Math.max(0, (split - 0.4) / 0.6);
    tag(c, z.slice(edge).join(' '), dx, yy, 382, C.mint);
    c.restore();
  }
  note(
    c,
    split > 0 && !newQuery
      ? 'Insert the new suffix after the four positions found by the first lookup.'
      : count
        ? n +
          ' reusable leading position' +
          (n === 1 ? '' : 's') +
          '  /  word tokens in this drawing'
        : 'Compare the incoming words from the left.',
  );
}
function keys(c, k) {
  const change = on(k, 2, 'adapter to B'),
    ans1 = on(k, 3, 'zero reusable tokens'),
    ans2 = on(k, 3, 'raises ValueError');
  const key = change ? 'B' : 'A';
  const n = prefixReuse(ids, ids, 'A', key, 4).reusable;
  const page = on(k, 0, 'Locations twelve');
  label(c, 'Stored A', 40, 181, 23);
  label(c, 'Request ' + key, 40, 243, 23);
  cells(
    c,
    ids,
    211,
    144,
    708,
    49,
    ids.map((_, i) => (page && i < 4 ? C.sky : C.paper)),
  );
  cells(
    c,
    ids,
    211,
    208,
    708,
    49,
    ids.map((_, i) => (change ? C.lilac : page && i < 4 ? C.sky : C.paper)),
  );
  mono(
    c,
    page ? 'A / KV addresses   ' + locations.join('   ') : 'A / full pages of 4 positions',
    42,
    301,
    19,
    C.blue,
  );
  if (change) {
    panel(c, 40, 327, 420, 96, 'Teaching helper  /  match_len');
    panel(c, 482, 327, 438, 96, 'Pinned class  /  RadixKey.match', C.plum);
    mono(c, ans1 ? n + ' reusable tokens' : '?', 60, 401, 26, C.sea);
    mono(c, ans2 ? pinnedMatch.mismatch : '?', 502, 401, 26, C.plum);
  }
  note(
    c,
    change
      ? 'Same token IDs and positions. Only the requested adapter changed.'
      : page
        ? 'E starts the next page. The first four IDs fill one page.'
        : 'Five exact IDs. Which positions belong to a complete page?',
  );
}
function context(c, k) {
  const changed = on(k, 1, 'early template'),
    restored = on(k, 2, 'Restore the original template'),
    mask = on(k, 2, 'change only the output grammar'),
    embedded = on(k, 2, 'rendered into the prompt');
  const first = ['SYS', 'rules', 'USER', 'login', 'Label:', 'Explain:'];
  const second = [
    changed && !restored ? 'time' : 'SYS',
    embedded ? 'schema' : 'rules',
    'USER',
    'dark',
    'Label:',
    'Explain:',
  ];
  const n = common(first, second);
  mono(c, '500', 40, 163, 17, C.red);
  label(c, 'R43  /  sign-in request', 89, 163, 20, C.red);
  cells(
    c,
    first,
    40,
    180,
    880,
    58,
    first.map((_, i) => (i < n ? C.sky : C.paper)),
  );
  crescent(c, 55, 286, 11);
  label(c, 'R42  /  dark-mode request', 89, 294, 20, C.blue);
  cells(
    c,
    second,
    40,
    311,
    880,
    58,
    second.map((_, i) => (i < n ? C.sky : C.paper)),
  );
  note(
    c,
    embedded
      ? 'Schema in the prompt changes the second position.'
      : mask
        ? 'Output-only constraints leave compatible prompt KV intact.'
        : n + ' leading positions agree. Later matching text has different history.',
  );
}
function lifetime(c, k, reader) {
  const released0 = reader ? on(k, 2, 'R zero has finished') : on(k, 1, 'releases its reference');
  const readerDone = reader && on(k, 2, 'Now R one releases');
  const released1 = reader
    ? on(k, 2, 'The segment is eligible')
    : on(k, 2, 'path becomes eligible');
  const owners = [!released0, !released1];
  const cancelled = reader && on(k, 2, 'its final GPU reader');
  owners.forEach((active, i) => {
    const x = 99 + 464 * i;
    tag(
      c,
      'R' + i + '  /  ' + (active ? 'reference held' : 'released'),
      x,
      159,
      295,
      active ? C.mint : C.pale,
    );
    if (reader && i === 1)
      tag(
        c,
        cancelled
          ? readerDone
            ? 'Final GPU read complete'
            : 'Client gone · GPU read pending'
          : 'GPU reader active',
        x + 12,
        207,
        270,
        cancelled && !readerDone ? C.peach : C.sky,
      );
    line(
      c,
      x + 147,
      reader && i === 1 ? 243 : 195,
      x + 147,
      263,
      active ? C.sea : C.line,
      active ? 4 : 1,
      active ? [] : [3, 5],
    );
  });
  cells(
    c,
    locations.map((n) => 'KV ' + n),
    119,
    262,
    722,
    82,
    Array(4).fill(C.sky),
  );
  const readers = owners.filter(Boolean).length;
  label(c, readers + ' live owner' + (readers === 1 ? '' : 's'), 120, 392, 27, C.ink);
  label(c, readers ? 'Protected' : 'Eligible for eviction', 570, 392, 27, readers ? C.blue : C.sea);
  note(
    c,
    reader
      ? readerDone
        ? 'Final device read complete. The allocator may reclaim after release.'
        : 'An outstanding GPU reader can outlive an application response.'
      : 'The cache manager can retain an eligible page for another request.',
  );
}
function locality(c, k) {
  if (k.beat.beatIndex === 3) return hostPage(c, k);
  if (k.beat.beatIndex > 0) return queuedRequests(c, k);
  const moved = on(k, 0, 'different cold replica');
  for (const [i, name] of ['Replica A  /  warm', 'Replica B  /  cold'].entries()) {
    const x = 40 + 450 * i;
    panel(c, x, 162, 429, 198, name, i ? C.plum : C.blue);
    cells(
      c,
      i ? ['·', '·', '·', '·'] : ids.slice(0, 4),
      x + 22,
      246,
      385,
      56,
      i ? [] : Array(4).fill(C.sky),
    );
    if (i === 0 || moved) {
      crescent(c, x + 35, 330, 10);
      tag(
        c,
        (moved && i === 0 ? 'Earlier lookup' : 'R42 lookup') + '  →  ' + (i ? 0 : 4) + ' matched',
        x + 57,
        312,
        290,
        Number(moved) === i ? C.mint : C.pale,
      );
    }
  }
  note(c, 'Same tokens and adapter. The route selects the local tree.');
}
function queuedRequests(c, k) {
  const progress = step(k, 2, 'R forty-two goes first', 1.1);
  label(c, 'Worker A', 40, 157, 22, C.blue, { bold: true });
  label(c, 'Resident page', 347, 157, 19, C.soft);
  cells(c, cachedPage, 493, 129, 404, 41, cachedPage.map(() => C.sky));
  line(c, 40, 184, 920, 184);
  label(c, 'Waiting in arrival order', 40, 220, 22);
  label(c, 'One execution slot', 621, 220, 22);
  box(c, 606, 243, 314, 163, C.paper, C.line);
  if (progress === 0) mid(c, 'Available', 763, 330, 23, C.soft);
  for (const request of localQueue) {
    const selected = request === nextLocalRequest;
    const x = selected ? mix(40, 625, progress) : 40;
    const y = selected ? mix(334, 287, Math.max(0, 2 * progress - 1)) : 245;
    box(c, x, y, 274, 77, selected ? C.sky : C.pale, null);
    if (selected) crescent(c, x + 23, y + 24, 10);
    label(c, request.id, x + (selected ? 43 : 14), y + 31, 23, selected ? C.blue : C.ink);
    label(c, 'prefix  ' + request.tokens.slice(0, 4).join(' '), x + 94, y + 29, 17);
    label(c, request.matched + ' matched positions', x + 14, y + 61, 18, C.soft);
  }
  note(c, progress === 1
    ? 'R51 arrived first and is still waiting on worker A.'
    : 'One worker, one free slot. Both requests use the same adapter.');
}
function hostPage(c, k) {
  const copy = step(k, 3, 'Copy the four positions', 1.4);
  const state = tierLookup(copy, on(k, 3, 'the attention kernel reads'));
  label(c, 'Worker A', 40, 157, 22, C.blue, { bold: true });
  crescent(c, 245, 151, 10);
  label(c, 'R42  /  same prefix and adapter', 271, 157, 20, C.blue);
  line(c, 40, 181, 920, 181);
  label(c, 'Host memory', 40, 223, 24);
  label(c, 'Device memory', 602, 223, 24);
  const tokens = (x, active) => cells(c, active ? cachedPage : cachedPage.map(() => '·'),
    x, 263, 316, 63, cachedPage.map(() => active ? C.sky : C.paper));
  tokens(40, true);
  tokens(602, state.onDevice);
  label(c, 'Compatible KV page', 40, 354, 20, C.blue);
  label(c, state.reading ? 'Kernel reading KV' : state.onDevice ? 'Page available' : 'Awaiting page',
    602, 354, 20, state.onDevice ? C.sea : C.soft);
  if (state.inFlight) {
    line(c, 198, 400, 760, 400, C.gold, 1.8);
    tag(c, 'KV  A–D', mix(198, 760, copy) - 60, 382, 120, C.sky, C.blue);
  }
  note(c, state.reading ? 'The attention kernel can use the device copy.'
    : state.inFlight ? 'Copying the matched page from host to device.'
      : state.onDevice ? 'The device copy is complete.' : 'Four matching positions are resident in host memory.');
}
export const requestScenes = [
  opening,
  program,
  branches,
  owners,
  clocks,
  mixed,
  pages,
  radix,
  keys,
  context,
  (c, k) => lifetime(c, k, false),
  (c, k) => lifetime(c, k, true),
  locality,
];
