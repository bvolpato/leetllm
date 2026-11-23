import {
  bench,
  rect,
  chip,
  line,
  dot,
  txt,
  mono,
  pill,
  frame,
  foot,
  poly,
  opacity,
  cue,
  on,
  mix,
  smooth,
  paper,
  ink,
  muted,
  teal,
  gold,
  coral,
  lilac,
  blue,
} from './bench.mjs';
import { memoryState, terms, bucketState, queueState, exerciseState, fresh } from './fixtures.mjs';

function pin(c, x, y, label) {
  txt(c, label, x + 30, y - 65, 32, lilac);
  line(
    c,
    [
      [x + 17, y - 66],
      [x, y - 66],
      [x, y - 12],
    ],
    lilac,
    5,
  );
  poly(
    c,
    [
      [x - 10, y - 20],
      [x + 10, y - 20],
      [x, y - 2],
    ],
    lilac,
  );
}
function nameTag(c, x, y) {
  poly(
    c,
    [
      [x, y - 31],
      [x + 76, y - 31],
      [x + 107, y],
      [x + 76, y + 31],
      [x, y + 31],
    ],
    gold,
  );
  mono(c, 'x', x + 41, y + 1, 43, ink);
}
function packageRow(c, y, name, data, color = paper) {
  txt(c, name, 240, y + 47, 47, color, 'center', 'Mono');
  data.forEach((v, i) => {
    const x = 328 + i * 192;
    chip(c, x, y, 145, 92, v);
    // Contact fingers below each number carry the value in binary for this integer fixture.
    for (let j = 0; j < 3; j++)
      rect(c, x + 36 + j * 27, y + 76, 16, 9, v & (1 << (2 - j)) ? '#855c27' : '#c6c0ac', 2);
  });
}
export function memory(c, k) {
  const travel = cue(k, 0, 'Move the Python name', 1.1),
    copy = cue(k, 2, 'Copy B into A', 1.45);
  const replayed = on(k, 2, 'The completed sum is four');
  const state = memoryState(travel >= 1, copy >= 1, replayed);
  bench(
    c,
    'memory',
    'Which allocation will replay read?',
    'ADDRESS PROBE   /   captured input and output retained',
  );
  const top = 361,
    low = 627;
  pin(c, 355, top - 13, 'Captured input address');
  packageRow(c, top, 'A', state.allocations.A, lilac);
  packageRow(c, low, 'B', state.allocations.B);
  nameTag(c, 79, mix(top, low, smooth(travel)) + 47);
  if (copy > 0 && copy < 1)
    for (let i = 0; i < 4; i++) {
      const x = 400 + i * 192,
        y = mix(low - 12, top + 111, copy);
      line(
        c,
        [
          [x, low - 10],
          [x, top + 105],
        ],
        '#9bbeb96b',
        2,
      );
      dot(c, x, y, 22, teal);
      mono(c, 0, x, y + 1, 29, ink);
    }
  const scan =
    k.beat.beatIndex === 1
      ? cue(k, 1, 'Follow the fixed pin', 1.65)
      : k.beat.beatIndex === 2
        ? cue(k, 2, 'Replay with the same pointer', 1.6)
        : 0;
  const followingPin = on(k, 1, 'Follow the fixed pin');
  if (scan < 1 && (scan > 0 || (k.beat.beatIndex === 1 && followingPin))) {
    const x = mix(322, 1058, scan);
    line(
      c,
      [
        [x, top - 10],
        [x, top + 106],
      ],
      lilac,
      5,
    );
  }
  frame(c, 1167, 331, 632, 420);
  txt(c, 'O   /   last completed replay', 1207, 392, 34, muted);
  mono(c, state.last.result, 1480, 514, 111, replayed ? teal : gold);
  if (followingPin) mono(c, state.last.squares.join(' + '), 1482, 654, 38, paper);
  const cpu = on(k, 2, 'another replay can reuse');
  foot(
    c,
    cpu
      ? 'CPU reader finished    /    O can now be reused'
      : copy === 1
        ? 'static_input.copy_(x)    →    graph.replay()    ·    same stream'
        : copy > 0
          ? 'Copying B into A. O still holds the previous result.'
          : followingPin
            ? 'Replay reads A through the captured input address.'
            : travel === 1
              ? 'x now names B. Which row will replay read?'
              : travel > 0
                ? 'Follow x to B. Which row will replay read?'
                : 'Find the Python name and the captured input address.',
  );
}

export function padding(c, k) {
  const fit = on(k, 0, 'Eight fits'),
    affine = cue(k, 1, 'Run the affine step'),
    square = cue(k, 1, 'Square the row'),
    unmasked = on(k, 1, 'we get four hundred fifty-six'),
    mask = on(k, 2, 'Close the two validity gates'),
    reduced = on(k, 2, 'Four hundred fifty-four'),
    write = on(k, 2, 'Let the first dummy store'),
    reset = on(k, 3, 'Start that cache trial again'),
    guard = on(k, 3, 'The dummy skips'),
    changedAdapter = on(k, 3, 'Now change only'),
    fallback = on(k, 3, 'Use a supported fallback');
  const cacheTrial = guard ? 'guarded' : reset ? 'reset' : write ? 'unguarded' : 'initial';
  const state = bucketState({
    masked: mask,
    sumReady: unmasked && (!mask || reduced),
    cacheTrial,
    adapter: changedAdapter ? 'B' : 'A',
  });
  if (changedAdapter) {
    routeRequest(c, state, fallback);
    return;
  }
  bench(
    c,
    'memory',
    'Which slots belong in the sum?',
    'BATCH DISPATCH   /   FP32, fixed layout, same mode',
  );
  const start = 347,
    dx = 148,
    cx = (i) => start + i * dx + 55;
  txt(c, 'Capacity  4   /   8   /   16', 103, 268, 32, muted);
  txt(c, 'Request   6 rows   ·   adapter ' + state.adapter, 821, 268, 32, paper);
  pill(
    c,
    1417,
    243,
    372,
    state.bucket === null ? 'Fallback' : fit ? 'Bucket ' + state.bucket : 'Choose bucket',
    state.bucket === null ? coral : teal,
  );
  if (fit) {
    rect(c, start + 6 * dx - 12, 322, dx * 2 - 4, 486, '#71544177', 14);
    txt(c, 'Padding', cx(6) + dx / 2, 347, 30, gold, 'center');
  }
  const rows = [
    ['Input', terms.input, 1],
    ['2x + 1', terms.affine, affine],
    ['Square', terms.squares, square],
  ];
  rows.forEach(([label, vals, progress], j) => {
    const y = 394 + j * 113;
    txt(c, label, 100, y + 25, 38);
    vals.forEach((v, i) => {
      if (i >= 6 && !fit) return;
      chip(c, cx(i) - 50, y - 6, 100, 66, null, { empty: !progress, selected: i >= 6 });
      opacity(c, progress, () => mono(c, v, cx(i), y + 28, 40, ink));
      if (j < 2)
        line(
          c,
          [
            [cx(i), y + 66],
            [cx(i), y + 100],
          ],
          i >= 6 ? gold : '#67827d',
          2.5,
        );
    });
  });
  if (square) {
    txt(c, 'Count slot?', 100, 762, 37);
    state.gates.forEach((allow, i) => {
      const x = cx(i),
        color = allow ? teal : coral;
      line(
        c,
        [
          [x, 697],
          [x, 716],
        ],
        '#81958a',
        3,
      );
      if (allow) {
        dot(c, x, 744, 19, '#27574e');
        line(
          c,
          [
            [x - 10, 745],
            [x - 3, 752],
            [x + 11, 735],
          ],
          teal,
          4,
        );
      } else {
        rect(c, x - 24, 731, 48, 24, coral, 3);
        line(
          c,
          [
            [x - 8, 743],
            [x + 8, 743],
          ],
          ink,
          3,
        );
      }
      mono(c, allow ? '1' : '0', x, 792, 28, color);
    });
  }
  frame(c, 1559, 369, 237, 247);
  txt(c, 'Reduction', 1678, 422, 30, muted, 'center');
  mono(c, state.total ?? '?', 1678, 520, 68, state.total === null ? muted : gold);
  if (k.beat.beatIndex >= 2) {
    if (on(k, 2, 'A dummy can still write')) {
      const x = cx(6);
      line(
        c,
        [
          [x + 54, 650],
          [x + 67, 650],
          [x + 67, 844],
          [1682, 844],
          [1682, 809],
        ],
        guard ? muted : coral,
        4,
      );
      if (guard) {
        rect(c, x + 54, 823, 26, 15, coral, 3);
      }
      txt(
        c,
        guard ? 'Store skipped' : 'Dummy store path',
        1382,
        867,
        26,
        guard ? teal : coral,
        'center',
      );
    }
    txt(c, 'Foreign cache', 1682, 683, 30, paper, 'center');
    chip(c, 1601, 723, 161, 71, state.cache, { selected: true });
  }
  const summary = guard
    ? 'Dummy store skipped   /   the cache owner keeps 42'
    : write && !reset
      ? 'An unguarded dummy store replaced 42 with 1'
      : mask
        ? reduced
          ? 'Masked sum   /   the two closed lanes add 0'
          : 'Validity mask closes lanes 7 and 8 before the reduction'
        : unmasked
          ? 'Unmasked sum   /   six real lanes add 454 and two padded lanes add 2'
          : 'Each lane computes (2x + 1)²   /   only real requests own output slots';
  foot(c, summary);
}

const slotStyles = {
  free: [muted, 'Free'],
  published: [blue, 'Published'],
  worker: [lilac, 'Claimed'],
  reader: [gold, 'CPU reader'],
};
function residency(c, k) {
  bench(
    c,
    'queue',
    'Can the required kernel start?',
    'RESIDENCY PROBE   /   abstract block capacity',
  );
  const occupied = on(k, 3, 'Every resident worker');
  const solved = on(k, 3, 'reserve enough resources');
  txt(c, 'Resident block slots', 114, 310, 43);
  for (let i = 0; i < 4; i++) {
    const x = 132 + i * 417,
      child = solved && i === 3;
    frame(c, x, 387, 352, 247);
    const color = child ? teal : lilac;
    txt(c, 'Slot ' + i, x + 32, 436, 31, muted);
    if (occupied) {
      rect(c, x + 28, 490, 296, 94, color, 10);
      txt(
        c,
        child ? 'Required kernel' : 'Worker ' + i,
        x + 176,
        537,
        38,
        ink,
        'center',
        'Sans',
        700,
      );
    }
  }
  txt(
    c,
    solved
      ? 'The required kernel has a resident slot.'
      : occupied
        ? 'Required kernel waiting to become resident'
        : 'Four block slots available',
    116,
    765,
    48,
    solved ? teal : gold,
  );
  foot(
    c,
    solved
      ? 'Reserve resources for dependent work and verify the schedule.'
      : occupied
        ? 'Polling holds the same capacity the dependency needs.'
        : 'Consider a worker that waits for a second kernel.',
  );
}
export function queue(c, k) {
  if (k.beat.beatIndex === 3) {
    residency(c, k);
    return;
  }
  const b = k.beat.beatIndex;
  let count = 0;
  if (b === 0) {
    const fill = cue(k, 0, 'Watch four workers', 1.25);
    count = Math.round(8 * fill);
    if (on(k, 0, 'leaves nine')) count = 9;
  } else if (b === 1) {
    count = 9;
    if (on(k, 1, 'releases slot zero')) count = 10;
    if (on(k, 1, 'Publish five there')) count = 11;
    if (on(k, 1, 'A worker claims it')) count = 12;
    if (on(k, 1, 'Six waits for the reader')) count = 13;
    if (on(k, 1, 'after that reader finishes')) count = 14;
    if (on(k, 1, 'can six enter')) count = 15;
    if (on(k, 1, 'The queue pushes back')) count = 16;
  } else count = 16 + Math.round(8 * cue(k, 2, 'each last reader releases', 1.9));
  const state = queueState(count);
  bench(
    c,
    'queue',
    'Who can release the slot?',
    'PERSISTENT QUEUE   /   four storage slots, six requests',
  );
  txt(c, b === 2 ? 'Admissions stopped' : 'Waiting for storage', 105, 289, 38, muted);
  state.pending.forEach((id, i) => {
    rect(c, 510 + i * 139, 254, 119, 64, '#edd8b0', 7);
    mono(c, 'R' + id, 570 + i * 139, 288, 38, ink);
  });
  if (!state.pending.length) txt(c, 'No pending requests', 515, 288, 37, muted);
  state.slots.forEach((slot, i) => {
    const x = 109 + i * 429,
      w = 401;
    const [color, status] = slotStyles[slot.state];
    // Each socket holds one request until the consumer releases the contact.
    frame(c, x, 393, w, 338);
    txt(c, 'S' + i, x + 34, 444, 35, muted, 'left', 'Mono');
    if (slot.id !== null) {
      rect(c, x + 31, 490, w - 62, 115, color, 7);
      mono(c, 'R' + slot.id, x + w / 2, 546, 65, ink);
    } else {
      rect(c, x + 31, 490, w - 62, 115, '#102428', 7);
      line(
        c,
        [
          [x + 74, 548],
          [x + w - 74, 548],
        ],
        '#576763',
        4,
      );
    }
    const owner =
      slot.state === 'worker'
        ? 'W' + i + ' holds slot'
        : slot.state === 'reader'
          ? 'Reading ' + slot.value
          : status;
    txt(c, owner, x + w / 2, 667, 37, color, 'center');
  });
  txt(c, 'Receipts held by readers', 110, 811, 35, muted);
  state.delivered.forEach((r, i) => mono(c, r.value, 720 + i * 167, 811, 42, teal));
  const focus = state.slots[0];
  foot(
    c,
    count === 24
      ? 'Six results delivered   /   all four slots released'
      : focus.state === 'reader' && focus.id === 1
        ? b === 0
          ? 'The CPU is reading 9. Which slot could request 5 use now?'
          : 'Request 5 waits while the CPU reads 9 from S0'
        : count === 10
          ? 'Reader holds 9   /   S0 is free for the next request'
          : count >= 11 && count < 17
            ? 'R5 occupies S0   /   request identity changes on reuse'
            : 'Publish descriptor   →   one worker claims   →   complete   →   last reader releases',
  );
}
export function practice(c, k) {
  const copied = on(k, 1, 'First copy'),
    mask = on(k, 2, 'Clear just the fourth'),
    partial = on(k, 1, 'The sum is twenty-eight'),
    fixed = on(k, 2, 'gives twenty-seven') && k.elapsed >= k.wordCue('gives twenty-seven').end;
  const copyStart = fixed ? k.wordCue('then finish copying it to the CPU').start : Infinity;
  const copying = k.elapsed >= copyStart;
  const receiptPhrase = 'The caller keeps twenty-seven';
  const copyEnd = copying ? k.wordCue(receiptPhrase).end : Infinity;
  const cpu = on(k, 2, receiptPhrase) && k.elapsed >= copyEnd;
  const state = exerciseState(copied, mask, fixed ? 2 : partial ? 1 : 0, cpu);
  bench(
    c,
    'memory',
    'Can this sum go back to the caller?',
    'FINAL PROBE   /   three real inputs in a four-slot graph',
  );
  const x = (i) => 515 + i * 169;
  rect(c, x(3) - 61, 286, 123, 518, '#785d4259', 12);
  txt(c, 'Real inputs', x(1), 277, 31, teal, 'center');
  txt(c, 'B padding', x(3), 277, 31, gold, 'center');
  const rows = [
    ['Request B', fresh],
    ['Captured A', state.storage.input],
    ['Retained mask M', state.storage.valid],
    ['Last replay terms', state.result.squares],
  ];
  rows.forEach(([name, values], r) => {
    const y = 339 + r * 132;
    txt(c, name, 105, y + 35, 35, r === 1 ? lilac : paper);
    values.forEach((v, i) => {
      chip(c, x(i) - 47, y, 94, 67, v, { selected: i === 3 });
      if (r === 3 && !state.result.valid[i])
        line(
          c,
          [
            [x(i) - 45, y + 64],
            [x(i) + 44, y + 4],
          ],
          '#b84e37',
          6,
        );
    });
  });
  frame(c, 1236, 324, 545, 419);
  txt(c, 'GPU output O', 1284, 433, 35, muted);
  const receiptX = 1638,
    outputY = 433,
    receiptY = 654,
    pathStart = outputY + 73,
    pathEnd = receiptY - 73;
  mono(c, state.result.total, receiptX, outputY, 83, fixed ? teal : gold);
  txt(c, 'CPU receipt', 1284, receiptY, 35, muted);
  mono(c, state.cpu ?? '·', receiptX, receiptY, cpu ? 83 : 48, cpu ? teal : muted);
  line(
    c,
    [
      [receiptX, pathStart],
      [receiptX, pathEnd],
    ],
    '#718d88',
    3,
  );
  if (copying && !cpu) {
    const y = mix(pathStart, pathEnd, (k.elapsed - copyStart) / (copyEnd - copyStart));
    txt(c, 'Copying to CPU', 1284, 544, 32, teal);
    dot(c, receiptX, y, 33, teal);
    mono(c, state.result.total, receiptX, y + 1, 38, ink);
  }
  foot(
    c,
    cpu
      ? `Caller holds ${state.cpu}    /    output storage can serve the next request`
      : fixed
        ? 'Completed device output    /    the CPU copy must still finish'
        : mask
          ? 'Fourth mask bit cleared    /    replay the reduction'
          : partial
            ? 'Both zeros contributed 1. Which contribution belongs to the caller?'
            : copied
              ? 'Fresh data arrived at the same address    /    the mask still includes four slots'
              : on(k, 0, 'Rebind x')
                ? 'x now names B. What does the caller still need?'
                : 'Retained A and M still hold the previous request.',
  );
}
function routeRequest(c, state, revealRoute) {
  const fallback = revealRoute && state.bucket === null;
  bench(
    c,
    'memory',
    'Can adapter B use the same graph?',
    'GRAPH POOL   /   same count, layout, dtype and mode',
  );
  txt(c, 'Incoming request', 112, 310, 40);
  frame(c, 109, 379, 634, 202);
  txt(c, '6 rows  ·  FP32', 149, 439, 43);
  pill(c, 149, 493, 254, 'Adapter ' + state.adapter, gold);
  txt(c, 'Captured keys', 960, 309, 40);
  for (const [i, cap] of [4, 8, 16].entries()) {
    const y = 377 + i * 108;
    rect(c, 968, y, 672, 78, '#334c50', 9);
    mono(c, cap + ' slots', 1100, y + 39, 38, i === 0 ? muted : paper);
    txt(c, 'FP32     /     adapter A', 1260, y + 39, 34, i === 0 ? muted : paper);
  }
  if (fallback) {
    line(
      c,
      [
        [426, 584],
        [426, 745],
        [888, 745],
      ],
      gold,
      7,
    );
    poly(
      c,
      [
        [888, 731],
        [910, 745],
        [888, 759],
      ],
      gold,
    );
    pill(c, 963, 717, 557, 'Supported fallback', gold);
  }
  foot(
    c,
    fallback
      ? 'No captured key matches adapter B.'
      : 'Choose a key that fits the count and matches the adapter.',
  );
}
