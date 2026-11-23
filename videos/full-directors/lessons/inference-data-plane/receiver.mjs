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
  lerp,
  clamp,
  ledger,
  arrow,
} from './workbench.mjs';
import {
  bank,
  d12,
  fullCopyBlocks,
  ids,
  practice,
  receiptState,
  receipt,
  query,
  firstStepReady,
} from './examples.mjs';

function carrier(ctx, x, y, color) {
  box(ctx, x - 33, y - 16, 66, 32, C.inset, color, 5, 3);
  for (let k = 0; k < 5; k++) box(ctx, x - 26 + k * 11, y - 9, 8, 18, color, null, 2);
}
export function opening(ctx, c) {
  title(ctx, c, 'PREFILL  P7     /     DECODE  D3');
  const travel = cue(c, 0, 'The paper', 3.2),
    first = cue(c, 1, 'lands first'),
    second = cue(c, 2, 'blue strip lands');
  const checked = firstStepReady([first, second], cue(c, 2, 'commits the handoff'));
  const ink = checked ? cue(c, 2, 'print Blue', 0.45) : 0;
  const received = [first, second],
    colors = [C.copper, C.blue];
  const pos = [
    first ? 1 : travel * 0.92,
    second ? 1 : travel * 0.38 + cue(c, 1, 'other heads', 1.4) * 0.54,
  ];
  chassis(ctx, 108, 273, 496, 398, 'P7   /   Prefill');
  chassis(ctx, 1110, 273, 696, 398, 'D3   /   Decode');
  for (let r = 0; r < 2; r++) {
    const y = 405 + 144 * r,
      color = colors[r];
    mono(ctx, r === 0 ? 'Heads 0–3' : 'Heads 4–7', 150, y - 15, 27, color);
    socket(ctx, 150, y, 387, 61, 1, color);
    cable(ctx, 604, y + 29, 1110, y + 29, 48, C.well);
    box(ctx, 573, y + 11, 40, 36, C.inset, C.line, 5);
    box(ctx, 1098, y + 11, 40, 36, C.inset, C.line, 5);
    if (!received[r]) {
      const t = pos[r];
      carrier(ctx, lerp(615, 1092, t), y + 29 + 144 * t * (1 - t), color);
    }
    mono(ctx, r === 0 ? 'Heads 0–3' : 'Heads 4–7', 1150, y - 15, 27, color);
    socket(ctx, 1150, y, 398, 61, received[r], color);
    mono(ctx, received[r] ? 'present' : 'empty', 1580, y + 41, 31, received[r] ? C.green : C.soft);
  }
  mono(ctx, 'Last line of the prompt', 112, 728, 26, C.dim);
  label(ctx, '“What color is the clear daytime sky?”', 112, 790, 40, C.ink, 'Serif');
  mono(ctx, 'Both shards cover positions 0–8191.', 112, 850, 26, C.dim);
  printer(
    ctx,
    1110,
    684,
    696,
    ink ? 'Blue' : '',
    ink,
    'First token  /  ' + (checked ? 'decode owns the step' : 'waiting'),
  );
}
export function reservation(ctx, c) {
  title(
    ctx,
    c,
    `NEW RUN   /   D12   ·   ${d12.prefixBlocks} REUSABLE PREFIX BLOCKS   ·   ${fullCopyBlocks} BLOCKS TO COPY`,
  );
  const grant = cue(c, 0, 'Reserve forty-eight'),
    transfer = cue(c, 2, 'copy begins', 3.7);
  const b = bank(grant * fullCopyBlocks, Math.floor(transfer * fullCopyBlocks), d12.capacity);
  const second = cue(c, 1, 'so it waits');
  chassis(ctx, 96, 230, 964, 582, 'Block pool   /   D12');
  for (let i = 0; i < b.total; i++) {
    const x = 149 + (i % 16) * 54,
      y = 345 + Math.floor(i / 16) * 88;
    const reserved = i < b.reserved,
      written = i < b.written;
    box(
      ctx,
      x,
      y,
      44,
      66,
      written ? C.copper : C.inset,
      reserved ? C.copper : C.dim,
      5,
      reserved ? 4 : 2,
    );
    if (written) for (let k = 0; k < 4; k++) box(ctx, x + 7 + k * 8, y + 12, 4, 40, C.rust);
  }
  label(
    ctx,
    grant ? 'Copper outline  ·  held for R4219' : 'R4219 requests 48 blocks',
    150,
    752,
    32,
    C.bright,
  );
  ledger(
    ctx,
    1120,
    322,
    674,
    [
      ['Pool capacity', b.total + ' blocks'],
      ['Held for R4219', b.reserved],
      ['Written', b.written],
      ['Free to claim', grant && !cue(c, 1, 'Sixteen remain') ? '?' : b.free],
    ],
    90,
  );
  if (grant) {
    mono(ctx, 'R4220    /    asks for 24', 1120, 705, 33, C.ink);
    if (second) label(ctx, 'Wait for capacity', 1120, 769, 49, C.rust, 'Serif');
  }
  foot(
    ctx,
    index(c) >= 2
      ? 'The writer fills only the blocks held by R4219.'
      : grant
        ? 'An empty block can already have an owner.'
        : 'Count the free cells before the grant.',
  );
}

export function lifecycle(ctx, c) {
  title(ctx, c, 'D12   /   SUCCESSFUL FULL COPY   ·   R4219   ·   OP-17');
  const flags = [
    cue(c, 0, 'enters the queue'),
    cue(c, 0, 'reserves the destination'),
    cue(c, 0, 'Transfer starts'),
    cue(c, 0, 'reports completion'),
    cue(c, 1, 'Commit gives'),
    cue(c, 2, 'generates Blue'),
    cue(c, 2, 'only at delivery'),
  ];
  const names = [
    'Queued',
    'Reserved',
    'Moving',
    'Copy done',
    'Committed',
    'Generated',
    'Delivered',
  ];
  const points = names.map((_, i) => 135 + i * 270);
  line(ctx, points[0], 339, points[6], 339, C.line, 8);
  names.forEach((name, i) => {
    const reached = flags[i];
    if (i > 0 && reached) line(ctx, points[i - 1], 339, points[i], 339, C.teal, 9);
    box(
      ctx,
      points[i] - 13,
      326,
      26,
      26,
      reached ? C.teal : C.paper,
      reached ? C.teal : C.line,
      13,
      4,
    );
    label(ctx, name, points[i], 299, 28, reached ? C.ink : C.dim, 'Sans', 600, 'center');
  });
  chassis(ctx, 100, 439, 503, 310, 'Registered memory');
  socket(ctx, 137, 546, 419, 70, flags[3] ? 1 : cue(c, 0, 'Transfer starts', 1.2) * 0.82, C.copper);
  mono(
    ctx,
    flags[3]
      ? 'Copy receipt  /  op-17'
      : flags[2]
        ? 'Write in flight'
        : flags[1]
          ? 'Range held'
          : 'Range empty',
    137,
    689,
    25,
    C.soft,
  );
  arrow(ctx, 625, 593, 701, 593, C.dim);
  printer(
    ctx,
    732,
    482,
    450,
    flags[5] ? 'Blue' : '',
    1,
    'Decode  /  ' + (flags[4] ? 'owns step' : 'waiting'),
  );
  arrow(ctx, 1209, 593, 1326, 593, C.dim);
  printer(
    ctx,
    1350,
    482,
    469,
    flags[6] ? 'Blue' : '',
    1,
    'Client  /  ' + (flags[6] ? 'received' : 'waiting'),
  );
  foot(
    ctx,
    flags[6]
      ? 'Frontend delivery records the word at the client.'
      : flags[5]
        ? 'The word exists at decode.'
        : flags[4]
          ? 'Verified coverage, interpretation and GPU visibility permit the first step.'
          : flags[3]
            ? 'The engine can acknowledge its copy.'
            : 'Follow the event to its owner.',
  );
}

function retryPool(ctx, x, y) {
  box(ctx, x, y, 626, 136, null, C.teal, 9, 3);
  label(ctx, 'Retry pool D8   /   48 separate blocks', x + 22, y + 41, 28, C.teal);
  for (let k = 0; k < 48; k++)
    box(ctx, x + 24 + (k % 24) * 24, y + 57 + Math.floor(k / 24) * 30, 19, 23, C.paper, C.teal, 3);
}
function segmentBank(ctx, x, y, w, r, { released = false, highlight = false } = {}) {
  chassis(
    ctx,
    x,
    y,
    w,
    365,
    'D12    /    ' + (released ? 'returned to pool' : 'op-17    ·    generation 4'),
  );
  const cw = (w - 216) / 3;
  ids.forEach(({ rank, first, last, segment }, i) => {
    const xx = x + 152 + (i % 3) * cw,
      yy = y + 104 + rank * 103;
    if (i % 3 === 0) mono(ctx, 'Rank ' + rank, x + 30, yy + 36, 26, C.bright);
    const present = !released && r.unique.has(segment);
    const color = rank ? C.blue : C.copper;
    for (let k = 0; k < 8; k++) {
      const width = (cw - 25) / 8;
      box(
        ctx,
        xx + k * width,
        yy,
        width - 4,
        43,
        present ? color : C.inset,
        released ? C.dim : present ? color : C.soft,
        3,
      );
    }
    mono(ctx, segment + '  ·  ' + first + '–' + last, xx, yy + 77, 24, present ? color : C.soft);
    if (highlight && !present && !released)
      line(ctx, xx, yy + 49, xx + cw - 30, yy + 49, C.copper, 4);
  });
}
export function timeout(ctx, c) {
  title(
    ctx,
    c,
    `D12   /   SAME ${fullCopyBlocks}-BLOCK COPY   ·   ${d12.prefixBlocks} REUSABLE PREFIX BLOCKS   ·   R4219`,
  );
  const arrivals = Math.floor(cue(c, 0, 'Watch four arrive', 1.3) * 4);
  const timed = cue(c, 0, 'sender times out'),
    queried = cue(c, 1, 'op seventeen'),
    denied = cue(c, 1, 'refuses commit');
  const expired = cue(c, 2, 'lease now expires'),
    retry = cue(c, 3, 'retry needs disjoint'),
    cancel = cue(c, 3, 'cancellation request');
  const stopped = cue(c, 3, 'confirms it stopped'),
    readers = cue(c, 3, 'last access stops'),
    released = cue(c, 3, 'return those');
  const r = receiptState([1, 2, 3, 4].slice(0, arrivals), { expired, stopped, readers, released });
  const reply = queried ? query('op-17', 4, [r]) : null;
  label(
    ctx,
    timed ? 'Sender   /   timed out' : 'Sender   /   copying',
    94,
    261,
    36,
    C.ink,
    'Serif',
  );
  label(
    ctx,
    queried
      ? 'Receiver query   →   op-17, generation 4'
      : `Expected   /   ${ids.length} segments of ${d12.segmentBlocks} blocks`,
    94,
    314,
    30,
    C.dim,
  );
  segmentBank(ctx, 92, 348, 1000, r, { released: !r.charged, highlight: queried });
  mono(ctx, 'Charged to old region', 1125, 395, 30, C.ink);
  bar(ctx, 1127, 425, 637, 42, r.charged / 48, C.rust);
  mono(ctx, r.charged + ' / 48 blocks', 1125, 526, 42, C.ink);
  mono(
    ctx,
    r.writerStopped ? 'Transport stopped' : cancel ? 'Cancel requested' : 'Writer outstanding',
    1125,
    599,
    30,
    C.dim,
  );
  if (stopped)
    mono(ctx, readers ? 'GPU accesses stopped' : 'Checking GPU readers', 1125, 652, 28, C.dim);
  if (retry) retryPool(ctx, 1126, 686);
  printer(
    ctx,
    94,
    720,
    1000,
    '',
    1,
    'First token   /   ' +
      (released
        ? 'attempt retired'
        : expired
          ? 'lease expired'
          : denied && !r.commit
            ? 'commit refused'
            : reply
              ? reply.blocks + ' of 48 blocks verified'
              : arrivals * 8 + ' of 48 blocks received'),
  );
}

function afterPhrase(c, beat, phrase, captionStart = phrase) {
  if (index(c) !== beat) return index(c) > beat;
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart }) === 1;
}

function receiptStamp(ctx, x, y, segment, fill, ink, stroke = null) {
  box(ctx, x - 26, y - 25, 52, 50, fill, stroke, 5, 3);
  mono(ctx, segment, x, y + 11, 31, ink, 'center');
}

export function ending(ctx, c) {
  title(
    ctx,
    c,
    index(c) === 0
      ? 'D12   /   SUCCESSFUL FULL COPY   ·   CLIENT DELIVERY'
      : `D12   /   ${fullCopyBlocks} BLOCKS EXPECTED   ·   ${d12.prefixBlocks} REUSABLE PREFIX BLOCKS`,
  );
  if (index(c) === 0) {
    const seen = cue(c, 0, 'first token to the client');
    const ok = receipt(ids.map((s) => s.segment));
    segmentBank(ctx, 96, 270, 1000, ok);
    arrow(ctx, 1130, 480, 1228, 480);
    printer(ctx, 1260, 381, 538, seen && ok.commit ? 'Blue' : '', 1, 'Client delivery');
    foot(ctx, 'Follow one owner from admission through the delivery receipt.');
    return;
  }
  const count = Math.floor(cue(c, 1, 'Read the six notices', 1.3) * practice.length);
  const position = cue(c, 1, 'Press each number', 3.4) * practice.length;
  const landed = Math.floor(position);
  const stamped = Math.min(count, landed);
  const travel = position - landed;
  const moving = travel > 0 && stamped < count;
  const destination = moving ? ids.find(({ segment }) => segment === practice[stamped]) : null;
  const showUnique = afterPhrase(c, 2, 'Five unique segments arrived');
  const showDuplicate = afterPhrase(c, 2, 'Two was stamped twice');
  const showMissing = afterPhrase(c, 2, 'Five is missing');
  const denied = afterPhrase(c, 2, 'keeps the decoder from printing a word', 'That hole');
  const expired = afterPhrase(c, 3, 'Its lease expires with the writer still active');
  const retry = afterPhrase(c, 4, 'Give the retry separate capacity if policy allows');
  const stopped = afterPhrase(c, 4, 'transport and GPU readers have stopped', false);
  const released = afterPhrase(c, 4, 'Then reclaim it');
  const notices = practice.slice(0, stamped);
  const r = receiptState(notices, {
    expired,
    stopped,
    readers: stopped,
    released,
  });
  const sourceX = (i) => 380 + i * 136;
  const target = ({ rank, segment }) => ({
    x: 310 + ((segment - 1) % (ids.length / 2)) * 279,
    y: 467 + rank * 124,
  });
  const cellPitch = 19;
  let stamp = null;
  if (destination) {
    const x = sourceX(stamped);
    const end = target(destination);
    const routeY = 314;
    // Lower-rank stamps descend through a gap between the upper ranges.
    const lane = end.x - (destination.rank ? 59 : 0);
    const turn = destination.rank ? 0.8 : 1;
    const approach = clamp((travel - 0.16) / 0.34);
    const descent = clamp((travel - 0.5) / (turn - 0.5));
    const stampX = travel < turn
      ? lerp(x, lane, approach)
      : lerp(lane, end.x, (travel - turn) / (1 - turn));
    const stampY = travel < 0.5
      ? lerp(245, routeY, clamp(travel / 0.16))
      : lerp(routeY, end.y, descent);
    stamp = { x: stampX, y: stampY };
  }

  label(ctx, 'Arrival notices', 96, 257, 34, C.ink, 'Serif');
  const repeated = showDuplicate ? notices.filter((segment, i) => notices.indexOf(segment) < i) : [];
  practice.forEach((segment, i) => {
    const x = sourceX(i);
    const duplicate = repeated.includes(segment);
    const active = moving && i === stamped;
    if (i < count) {
      const lifting = active && stamp.y < 289;
      receiptStamp(
        ctx, x, 245, lifting ? '' : segment, C.well, C.bright,
        active || duplicate ? C.copper : null,
      );
    } else box(ctx, x - 26, 220, 52, 50, null, C.line, 5);
    if (i < stamped) line(ctx, x - 20, 280, x + 20, 280, duplicate ? C.rust : C.teal, 4);
  });

  chassis(ctx, 96, 346, 1030, 358, 'D12');
  label(
    ctx,
    r.charged ? 'Range receipt' : 'Range receipt retained',
    1088, 402, 28, C.bright, 'Sans', 600, 'right',
  );
  for (const rank of [0, 1]) {
    mono(ctx, 'Rank ' + rank, 123, 478 + rank * 124, 26, C.bright);
  }
  ids.forEach((range) => {
    const { rank, first, last, segment } = range;
    const { x, y } = target(range);
    const present = r.unique.has(segment);
    const color = rank ? C.blue : C.copper;
    const incoming = destination === range && Math.abs(stamp.x - x) < 55 && Math.abs(stamp.y - y) < 53;
    if (!incoming) receiptStamp(ctx, x, y, segment, C.inset, C.bright, present ? color : C.dim);
    for (let k = 0; k < d12.segmentBlocks; k++) {
      box(ctx, x + 37 + k * cellPitch, y - 24, 16, 48, present ? color : C.inset, color, 3);
    }
    mono(ctx, first + '–' + last, x + 37, y + 62, 27, present ? color : C.soft);
    if (showMissing && !present) {
      box(ctx, x + 31, y - 32, d12.segmentBlocks * cellPitch + 10, 64, null, C.copper, 6, 4);
    }
  });
  if (stamp) receiptStamp(ctx, stamp.x, stamp.y, destination.segment, C.paper, C.ink, C.rust);

  mono(ctx, 'Notice count', 1190, 394, 30, C.dim);
  mono(ctx, count + ' / ' + ids.length, 1190, 458, 53);
  if (showUnique) {
    mono(ctx, 'Distinct ranges', 1190, 530, 30, C.dim);
    mono(ctx, r.unique.size + ' / ' + ids.length, 1190, 594, 53, C.rust);
  }
  if (expired) {
    bar(ctx, 1190, 617, 625, 14, r.charged / fullCopyBlocks, C.rust);
    mono(ctx, r.charged + ' blocks charged at D12', 1190, 665, 31, C.ink);
    mono(
      ctx,
      stopped ? 'All accesses stopped' : 'Writer still active',
      1190,
      715,
      28,
      stopped ? C.teal : C.rust,
    );
  }
  printer(
    ctx,
    96,
    718,
    1030,
    '',
    1,
    'First token  /  ' +
      (released
        ? 'region reclaimed'
        : expired
          ? 'lease expired'
          : denied && !r.commit
            ? 'coverage incomplete'
            : 'waiting'),
  );
  if (retry) retryPool(ctx, 1186, 752);
}
