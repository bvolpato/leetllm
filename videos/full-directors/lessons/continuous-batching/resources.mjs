import assert from 'node:assert/strict';
import { pageCount, freshBatchingBoundary } from '../../../films/continuous-batching/model.mjs';
import {
  color as c,
  text,
  center,
  box,
  line,
  label,
  base,
  plate,
  cell,
  cue,
  heading,
  note,
} from './art.mjs';

const budget = 12,
  promptSize = 20;
function chunkState(pass, limit = budget) {
  const decode = 3,
    width = limit - decode,
    prior = Math.max(0, pass - 1) * width;
  const count = pass ? Math.min(width, promptSize - prior) : 0;
  return {
    decode,
    prior,
    count,
    remaining: promptSize - prior - count,
    slots: Array.from({ length: limit }, (_, i) =>
      i < decode ? '│' : i < decode + count ? prior + i - decode + 1 : null,
    ),
  };
}
function tray(g, slots, tones, y = 565) {
  plate(g, 76, y - 23, 1768, 157);
  slots.forEach((v, i) => {
    const x = 108 + i * 144;
    box(g, x, y, 129, 99, v === null ? '#1c3434' : tones[i], 7);
    if (v !== null)
      center(g, v, x + 64.5, y + 48, 48, c.white, { font: 'Lesson Mono', weight: 700 });
    else line(g, x + 44, y + 54, x + 85, y + 54, '#68807c', 3);
  });
}
export function prefill(g, k) {
  if (cue(k, 2, 'Try the same twenty-position prompt')) {
    base(
      g,
      'Chunk size comparison  /  same prompt and live streams',
      'How often can the live streams take a turn?',
    );
    heading(g, 'DECODE FIRST', 'ONE CLUSTER = ONE MIXED PASS');
    const small = cue(k, 2, 'Five passes now');
    for (const [i, limit] of [12, 7].entries()) {
      const y = 399 + i * 239,
        passes = Math.ceil(promptSize / (limit - 3));
      text(g, 'Limit ' + limit, 92, y + 44, 49, c.ink, { font: 'Lesson Serif' });
      const wide = limit === 12 ? 438 : 293;
      for (let j = 0; j < passes; j++) {
        if (i === 1 && !small && j > 0) break;
        const x = 374 + wide * j,
          s = chunkState(j + 1, limit);
        s.slots.forEach((v, idx) =>
          box(g, x + idx * 32, y, 28, 85, v === null ? '#dcdcd1' : idx < 3 ? c.teal : c.gold, 4),
        );
        text(g, 'Pass ' + (j + 1), x, y + 122, 30, c.muted);
      }
    }
    note(
      g,
      'Each cluster includes three live decodes. Gold positions process the same 20 prompt tokens.',
    );
    return;
  }
  const pass =
    cue(k, 1, 'Nine prompt positions fit') +
    cue(k, 1, 'Nine more go into') +
    cue(k, 1, 'The last two go');
  const s = chunkState(pass);
  base(g, 'Prompt processing  /  decode first', 'Where do we cut the prompt?');
  heading(g, 'PROMPT POSITIONS', '20 INPUTS');
  const left = 92,
    dx = 87;
  for (let i = 1; i <= promptSize; i++) {
    const done = i <= s.prior,
      here = i > s.prior && i <= s.prior + s.count;
    cell(
      g,
      i,
      left + (i - 1) * dx,
      348,
      80,
      75,
      done ? '#b7d3c0' : here ? c.gold : '#e0d9cb',
      done || !here ? c.ink : c.white,
    );
  }
  if (s.count) {
    const x = left + s.prior * dx,
      w = s.count * dx - 7;
    line(g, x, 451, x + w, 451, c.gold, 5);
    line(g, x, 438, x, 452, c.gold, 5);
    line(g, x + w, 438, x + w, 452, c.gold, 5);
  }
  label(
    g,
    pass ? 'PASS ' + pass + '  /  12 WORK POSITIONS' : 'NEXT PASS  /  12 WORK POSITIONS',
    93,
    508,
  );
  tray(
    g,
    s.slots,
    s.slots.map((_, i) => (i < s.decode ? c.teal : c.gold)),
  );
  text(g, '3 live decodes', 98, 774, 45, c.teal, { weight: 700 });
  if (pass) {
    text(g, s.count + ' prompt positions', 650, 774, 45, c.gold, { weight: 700 });
    text(g, s.remaining + ' remaining', 1435, 774, 45, c.ink);
  }
  note(
    g,
    pass === 0
      ? 'Each green cursor occupies one ordinary decode position.'
      : pass === 3
        ? 'Only 5 of 12 positions are needed on the final pass.'
        : 'The next chunk can attend to the prompt positions processed so far.',
  );
}

const verifyWidth = 4,
  ordinary = 2;
function mixedPass(allocated, rejected) {
  const available = budget - verifyWidth - ordinary;
  return {
    slots: [
      ...Array(verifyWidth).fill('V'),
      ...Array(ordinary).fill('│'),
      ...Array(available).fill(allocated ? 'P' : null),
    ],
    accepted: rejected ? 0 : null,
    corrections: rejected ? 1 : null,
  };
}
export function verify(g, k) {
  const filled = cue(k, 1, 'Six prompt positions fill');
  const rejected = cue(k, 1, 'rejects the first proposed token');
  const s = mixedPass(filled, rejected);
  base(g, 'Target verification  /  a different mixed pass', 'Which positions count as work?');
  heading(g, 'TARGET INPUT POSITIONS', 'STEP LIMIT  12');
  tray(
    g,
    s.slots,
    s.slots.map((v, i) => (i < verifyWidth ? '#745a84' : i < 6 ? c.teal : c.gold)),
    376,
  );
  const used = s.slots.filter((v) => v !== null).length;
  text(g, `4 verification   +   2 decode   +   ${used - 6} prompt`, 98, 592, 50);
  label(g, 'SPECULATIVE STREAM', 99, 713);
  const all = cue(k, 2, 'accepts a whole three-token draft');
  if (all) {
    label(g, 'First proposal rejected', 98, 792);
    cell(g, 'C', 580, 744, 72, 68, c.gold);
    label(g, 'All three accepted', 844, 792);
    ['1', '2', '3', '+1'].forEach((v, i) =>
      cell(g, v, 1262 + i * 91, 745, 77, 68, i === 3 ? c.gold : c.teal),
    );
    text(g, 'Client deliveries under two outcomes', 572, 705, 41, c.ink, { font: 'Lesson Serif' });
  } else {
    text(
      g,
      rejected
        ? `${s.accepted} draft tokens accepted    /    ${s.corrections} correction emitted`
        : 'Awaiting the target’s decision',
      570,
      716,
      49,
      rejected ? c.rust : c.muted,
      { font: 'Lesson Serif' },
    );
  }
  note(
    g,
    filled
      ? `${used} scheduled input positions. Verification work was charged at launch.`
      : 'V marks a verification input. The two ordinary cursors take one position each.',
  );
}

function page(g, owner, used, x, y, w = 610, h = 145, cap = 16, reserved = 0) {
  const fill = owner ? c.board : '#d9dccc',
    fg = owner ? c.white : c.muted;
  box(g, x, y, w, h, fill, 12);
  text(g, owner ?? 'Free page', x + 22, y + h * 0.31, Math.min(38, h * 0.3), fg, { weight: 600 });
  const dx = (w - 42) / cap;
  for (let j = 0; j < cap; j++) {
    box(
      g,
      x + 21 + j * dx,
      y + h * 0.59,
      dx - 4,
      h * 0.23,
      j < used ? c.mint : j < reserved ? c.amber : owner ? '#536b63' : '#bdc4b4',
      2,
    );
  }
}
function growthState(phase) {
  // A reservation colors one slot gold until the input has written its KV.
  const states = [
    [
      ['Urgent', 16],
      ['Background', 16],
    ],
    [
      ['Urgent', 16],
      ['Background', 16],
    ],
    [
      ['Urgent', 16],
      [null, 0],
    ],
    [
      ['Urgent', 16],
      ['Urgent', 0, 1],
    ],
    [
      ['Urgent', 16],
      ['Urgent', 1],
    ],
    [
      [null, 0],
      [null, 0],
    ],
    [
      ['Background', 16],
      ['Background', 0, 1],
    ],
    [
      ['Background', 16],
      ['Background', 1],
    ],
  ];
  return states[phase];
}
export function memory(g, k) {
  if (k.beat.beatIndex === 0) {
    const mapped = cue(k, 0, 'Its third block lives on page six');
    base(g, 'Page table  /  one full-attention history', 'Where does the third block live?');
    heading(g, 'PHYSICAL PAGES', 'FIXED-SIZE ALLOCATION');
    const owners = ['D', 'D', 'B', 'B', 'C', 'C', 'D', null];
    for (let i = 0; i < 8; i++) {
      const x = 94 + i * 218;
      label(g, 'PAGE ' + i, x + 21, 370);
      cell(
        g,
        owners[i] ?? 'Free',
        x,
        421,
        193,
        120,
        owners[i] === 'D' ? c.teal : owners[i] ? c.board : '#d9dbce',
        owners[i] ? c.white : c.ink,
      );
    }
    label(g, 'D’S BLOCK TABLE', 95, 683);
    [0, 1, mapped ? 6 : '?'].forEach((p, i) => {
      cell(g, p, 536 + i * 230, 631, 192, 104, c.teal);
      center(g, 'block ' + i, 632 + i * 230, 787, 30, c.muted);
    });
    note(g, 'A compatible attention kernel follows the logical block order across the gap.');
    return;
  }
  const projected = cue(k, 2, 'Four pages would be needed');
  let phase = 0;
  if (projected) phase = 1;
  if (cue(k, 2, 'release its page')) phase = 2;
  if (cue(k, 2, 'Reserve that page')) phase = 3;
  if (cue(k, 2, 'Now Urgent can run')) phase = 4;
  if (cue(k, 3, 'safe to reuse')) phase = 5;
  if (cue(k, 3, 'restore Background')) phase = 6;
  if (cue(k, 3, 'run its next input')) phase = 7;
  const pages = growthState(phase);
  base(g, 'Memory pressure  /  two physical pages', 'Can both histories grow in the same pass?');
  heading(g, 'CACHE POOL', '16 POSITIONS PER PAGE');
  pages.forEach(([owner, used, reserved], i) => {
    label(g, 'PHYSICAL PAGE ' + i, 125 + i * 870, 374);
    page(g, owner, used, 100 + i * 866, 432, 815, 173, 16, reserved);
  });
  const captions = [
    'Each history owns one full page and needs a private tail.',
    'Both together would need 2 + 2 = 4 pages. Pool capacity is 2.',
    'Background is paused. Its private page is free.',
    'Urgent owns both pages. The gold position is reserved.',
    'Urgent has 17 processed positions. Its tail has 15 unused places.',
    'Urgent has finished. Both pages can be reused.',
    'Background restored 16 positions. Its next position is reserved.',
    'Background has processed position 17 on its second page.',
  ];
  if (phase === 1) {
    for (let i = 0; i < 2; i++) {
      const x = 102 + i * 865;
      box(g, x, 640, 808, 68, '#eadac5', 9, c.gold);
      text(g, '+ 1 private page for position 17', x + 30, 674, 35, c.gold);
    }
  }
  text(g, captions[phase], 96, phase === 1 ? 791 : 736, 43, c.ink, { font: 'Lesson Serif' });
  note(g, 'Mint = written KV     Gold = reserved next input     Dark = private slack');
}

const prompt = [101, 102, 103],
  delivered = [201, 202];
function historyState(count, newOutput = false) {
  return {
    cache: [...prompt, ...delivered].slice(0, count),
    client: newOutput ? [...delivered, 203] : [...delivered],
  };
}
function tokenRow(g, title, values, y, capacity, fill) {
  label(g, title, 97, y + 48);
  for (let j = 0; j < capacity; j++)
    cell(
      g,
      values[j] ?? null,
      675 + j * 212,
      y,
      185,
      96,
      values[j] === undefined ? '#dcdcd1' : fill,
    );
}
export function resume(g, k) {
  const dropped = cue(k, 1, 'Keep both accepted outputs');
  const replay = cue(k, 1, 'Replay the three prompt positions', 1.25);
  const next = cue(k, 2, 'Consume two hundred two'),
    sent = cue(k, 2, 'Only the new token goes out');
  const count = next ? 5 : dropped ? Math.floor(4 * replay) : 4;
  const s = historyState(count, sent);
  base(g, 'Request checkpoint  /  recomputation', 'Which token does decode consume after replay?');
  heading(g, 'TOKEN IDS', 'MODEL, POSITIONS AND SAMPLING STATE PRESERVED');
  tokenRow(g, 'SAVED INPUT HISTORY', [...prompt, ...delivered], 355, 5, c.board);
  tokenRow(g, 'PROCESSED KV', s.cache, 540, 5, c.teal);
  tokenRow(g, 'ALREADY AT CLIENT', s.client, 723, 3, c.gold);
  note(
    g,
    sent
      ? '203 is the only new delivery.'
      : next
        ? 'Decode uses 202 at its original position.'
        : dropped
          ? `${count} of 4 cache positions rebuilt. Both delivered outputs are retained.`
          : '202 has been sampled and delivered. Its input position is still pending.',
  );
}

function admissionState(policy, restored, ran, paused = false) {
  const b = freshBatchingBoundary(policy);
  const pages = Array.from({ length: b.capacity }, () => ({ owner: null, used: 0 }));
  for (const r of b.active) {
    if (paused && r.id === 'B') continue;
    const restoredPositions =
      r.id === 'D' || r.id === 'E' ? Math.floor(r.length * restored) : r.length;
    const count = restoredPositions + Number(ran);
    r.pages.forEach((p, i) => {
      pages[p] = { owner: r.id, used: Math.max(0, Math.min(b.block, count - i * b.block)) };
    });
  }
  const active = b.active.filter((r) => !(paused && r.id === 'B'));
  return { b, pages, active, free: pages.filter((p) => !p.owner).length };
}
export function practice(g, k) {
  const replay = k.beat.beatIndex === 2;
  const fit = !replay && cue(k, 1, 'E can use one page');
  const paused = replay && cue(k, 2, 'safely release its private page');
  const restoreD = cue(k, 2, 'Restore D', 1);
  const aged = replay && cue(k, 2, 'Restore D');
  const r = aged ? restoreD : fit ? cue(k, 1, 'Restore its three positions', 0.8) : 0;
  const ran = replay ? cue(k, 2, 'Run C and D') : cue(k, 1, 'running the next input');
  const s = admissionState(aged ? 'aged' : fit ? 'fit' : 'fifo', r, ran, paused && !aged);
  const verdict = cue(k, 1, 'Leave it open');
  base(g, 'Admission practice  /  four positions per page', 'Which waiting request, if any, runs next?');
  heading(
    g,
    replay ? 'REPLAY  /  AGING POLICY' : fit ? 'FIT SCAN' : 'STRICT ARRIVAL ORDER',
    '3 SEATS    8 WORK POSITIONS    5 PAGES',
  );
  label(g, 'STARTING QUEUE', 96, 382);
  text(g, 'D  ·  11 saved + 1 input', 500, 380, 44);
  text(g, 'E  ·  3 saved + 1 input', 1200, 380, 44);
  for (const [i, p] of s.pages.entries()) {
    const x = 89 + i * 352;
    label(g, 'PAGE ' + i, x + 14, 493);
    page(g, p.owner, p.used, x, 540, 327, 131, 4);
  }
  const seatCount = s.active.length;
  text(g, `Resident: ${s.active.map((r) => r.id).join(' + ')}`, 97, 775, 46, c.ink, {
    font: 'Lesson Serif',
  });
  text(g, `${s.free} free ${s.free === 1 ? 'page' : 'pages'}`, 830, 775, 40, c.teal);
  text(
    g,
    ran
      ? `${seatCount} inputs executed`
      : `${3 - seatCount} open ${seatCount === 2 ? 'seat' : 'seats'}`,
    1342,
    775,
    40,
  );
  const msg = replay
    ? aged
      ? ran
        ? 'D advances with C. B waits and must restore its saved state.'
        : 'D owns pages 2, 3 and 4. Restore its 11 saved positions before decode.'
      : paused
        ? 'B’s page is free. D can now fit.'
        : 'Same two free pages. Try giving the older request priority.'
    : fit
      ? ran
        ? 'E advanced with B and C. D is still waiting.'
        : 'E fits in one page. D keeps its place in the queue.'
      : verdict
        ? 'D needs 3 pages. Strict arrival order leaves the seat empty.'
        : 'Which constraint binds for the first waiting request?';
  note(g, msg);
}

export function checkResources() {
  assert.deepEqual(
    [0, 1, 2, 3].map((n) => {
      const s = chunkState(n);
      return [s.count, s.remaining, s.slots.filter((v) => v !== null).length];
    }),
    [
      [0, 20, 3],
      [9, 11, 12],
      [9, 2, 12],
      [2, 0, 5],
    ],
  );
  assert.deepEqual(
    [1, 2, 3].flatMap((p) => chunkState(p).slots.filter(Number.isInteger)),
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((i) => chunkState(i, 7).count),
    [4, 4, 4, 4, 4],
  );
  const v = mixedPass(true, true);
  assert.deepEqual(
    [
      v.slots.filter((t) => t === 'V').length,
      v.slots.filter((t) => t === 'P').length,
      v.slots.length,
      v.accepted,
      v.corrections,
    ],
    [4, 6, 12, 0, 1],
  );
  assert.equal(2 * pageCount(17, 16), 4);
  assert.deepEqual(growthState(2), [
    ['Urgent', 16],
    [null, 0],
  ]);
  assert.deepEqual(growthState(3)[1], ['Urgent', 0, 1]);
  assert.deepEqual(growthState(7), [
    ['Background', 16],
    ['Background', 1],
  ]);
  for (let i = 0; i <= 4; i++)
    assert.deepEqual(historyState(i), {
      cache: [101, 102, 103, 201].slice(0, i),
      client: [201, 202],
    });
  assert.deepEqual(historyState(5, true), {
    cache: [101, 102, 103, 201, 202],
    client: [201, 202, 203],
  });
  for (const [policy, free, ids] of [
    ['fifo', 2, ['C', 'B']],
    ['fit', 1, ['C', 'B', 'E']],
    ['aged', 0, ['C', 'D']],
  ]) {
    const s = admissionState(policy, 1, policy !== 'fifo');
    assert.deepEqual([s.free, s.active.map((r) => r.id)], [free, ids]);
    assert(s.pages.every((p) => p.used >= 0 && p.used <= 4));
  }
  assert.equal(admissionState('fifo', 0, false, true).free, 3);
  assert.deepEqual(
    admissionState('aged', 1, false)
      .pages.slice(2)
      .map((p) => p.used),
    [4, 4, 3],
  );
}
