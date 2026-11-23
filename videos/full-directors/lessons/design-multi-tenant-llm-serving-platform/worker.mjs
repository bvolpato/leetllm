import {
  C,
  reveal,
  mix,
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
  die,
  socket,
  strip,
  wire,
} from './drawing.mjs';
import { deficit, machine, price, adapterSlot, guidePrefix, readGuide, proposalSlots } from './examples.mjs';

function batch(c, k) {
  const decode = reveal(k, 0, 'three decode tokens'),
    prefill = reveal(k, 0, 'Fit five tokens');
  head(c, k, 'One model iteration', 'How much prompt work fits beside decode?');
  substrate(c, 89, 342, 1741, 343);
  mono(c, 'STEP BUDGET   /   8 TOKEN POSITIONS', 161, 423, 32, C.cream);
  for (let j = 0; j < 8; j++) {
    const placed = j < 3 ? decode : prefill;
    socket(c, 166 + j * 204, 472, 164, 123, j < 3 ? C.bLight : C.aLight, placed);
    if (placed) mono(c, j < 3 ? 'D' : 'P', 248 + j * 204, 557, 47, C.deep, 'center');
  }
  foot(
    c,
    prefill
      ? '3 decode tokens + 5 prompt tokens fill the step.'
      : 'New work can join at each iteration boundary.',
    'Split a long prefill across steps. Queued tenants still need a service policy.',
  );
}
export function serviceState(k) {
  const grant1 = reveal(k, 1, 'Each round gives'),
    pay1 = reveal(k, 1, 'In round one');
  const pay2 = reveal(k, 2, 'In round two'),
    grant3 = reveal(k, 2, 'add four credits'),
    pay3 = reveal(k, 3, 'Two chunks');
  const b1 = reveal(k, 1, 'B buys two'),
    b2 = reveal(k, 2, 'B buys two more'),
    b3 = reveal(k, 3, 'B buys another two');
  const round = pay3 ? 3 : pay2 ? 2 : pay1 ? 1 : 0;
  const paidB = b3 ? 3 : b2 ? 2 : b1 ? 1 : 0;
  const visit = grant3 ? 3 : pay2 ? 2 : grant1 ? 1 : 0;
  const a = deficit(round),
    b = deficit(paidB);
  return {
    round,
    visit,
    credit: { A: a.credit.A + (visit - round) * 4, B: b.credit.B + (visit - paidB) * 2 },
    served: { A: a.served.A, B: b.served.B },
    jobs: { A: a.jobs.A, B: b.jobs.B },
  };
}
function afterWords(k, words, duration = 0) {
  const end = k.wordCue(words).end;
  return duration
    ? Math.max(0, Math.min(1, (k.elapsed - end) / duration))
    : Number(k.elapsed >= end);
}
function roundThreeMotion(c, owner, y, grant, spend) {
  const isB = owner === 'B';
  const carried = isB ? 0 : 2;
  const added = isB ? 2 : 4;
  const ink = isB ? C.bLight : C.aLight;
  const priorUnits = isB ? 4 : 6;
  for (let n = 0; n < carried + added; n++) {
    const x = 1538 + n * 34;
    const arrival = n < carried ? 1 : Math.max(0, Math.min(1, grant * 1.6 - (n - carried) * 0.16));
    dot(c, x, y + 99, 12, C.trace);
    if (arrival === 0) continue;
    if (spend > 0) {
      const chunk = Math.floor(n / (isB ? 1 : 3));
      const progress = Math.max(0, Math.min(1, spend * 1.25 - chunk * 0.25));
      if (progress === 1) continue;
      const target = 425 + (priorUnits + n) * 86;
      const lift = Math.sin(Math.PI * progress) * 22;
      dot(c, mix(x, target, progress), mix(y + 99, y + 39, progress) - lift, 13, ink);
    } else {
      dot(c, x, y + 99 - 38 * (1 - arrival), 12, n < carried ? ink : C.gold);
    }
  }
}
function turns(c, k) {
  const s = serviceState(k),
    b = k.beat.beatIndex;
  const grant = b === 2 ? afterWords(k, 'add four credits to A’s two', 0.48) : 0;
  const aSpend = b === 3 ? afterWords(k, 'Two chunks for A', 0.48) : 0;
  const bSpend = b === 3 ? afterWords(k, 'B buys another two', 0.48) : 0;
  const work = b === 3 && afterWords(k, 'and B six');
  const chunks = b === 3 && afterWords(k, 'four chunks against six');
  head(
    c,
    k,
    'Deficit scheduling',
    b === 2 ? 'What can A buy on its third visit?' : 'How much work did each tenant receive?',
  );
  substrate(c, 84, 291, 1752, 490);
  mono(c, 'WORK SERVED', 386, 366, 30, C.cream);
  mono(c, 'CREDIT LEFT', 1518, 366, 30, C.cream);
  for (const [i, owner] of ['A', 'B'].entries()) {
    const y = 412 + i * 168,
      cost = i ? 1 : 3,
      ink = i ? C.bLight : C.aLight;
    mono(c, owner, 150, y + 61, 63, ink);
    label(c, cost + ' per chunk', 150, y + 103, 28, C.cream);
    for (let j = 0; j < 12; j++) rect(c, 385 + j * 86, y + 4, 81, 67, '#39564e');
    const spending = b === 3 ? (i ? bSpend : aSpend) : 1;
    const inTransit = b === 3 && spending < 1;
    const prior = i ? 4 : 2;
    const placed = inTransit ? prior + Number(spending >= 0.8) : s.jobs[owner];
    for (let j = 0; j < placed; j++) {
      const x = 385 + j * cost * 86,
        w = cost * 86 - 8;
      plate(c, x, y, w, 76, ink, 4);
      for (let n = 1; n < cost; n++)
        line(
          c,
          [
            [x + n * 86 - 4, y + 17],
            [x + n * 86 - 4, y + 59],
          ],
          '#824b31',
          2,
        );
    }
    mono(
      c,
      b === 3
        ? chunks ? s.served[owner] + ' units   /   ' + s.jobs[owner] + ' chunks'
          : work ? s.served[owner] + ' units' : ''
        : s.served[owner] + ' units   /   ' + s.jobs[owner] + (s.jobs[owner] === 1 ? ' chunk' : ' chunks'),
      387,
      y + 118,
      b === 2 || b === 3 ? 37 : 31,
      ink,
    );
    if (b === 3 || (b === 2 && s.visit === 3)) {
      const remaining = (i ? 2 : 6) - (placed - prior) * cost;
      const ledger = inTransit ? remaining : b === 2 && grant < 1 ? (i ? 0 : 2) : s.credit[owner];
      mono(c, ledger, 1626, y + 63, 62, ink, 'center');
      roundThreeMotion(c, owner, y, b === 3 ? 1 : grant, b === 3 ? spending : 0);
    } else {
      mono(c, s.credit[owner], 1626, y + 63, 62, ink, 'center');
      for (let n = 0; n < s.credit[owner]; n++) dot(c, 1538 + n * 34, y + 99, 12, ink);
    }
  }
  const main =
    b === 4
      ? 'Set a waiting bound for each backlogged tier.'
      : b === 3
        ? chunks ? 'Work 2:1. Chunks 2:3.'
          : work ? 'Compare the lengths on the same scale.'
          : 'Each new piece must be paid for in full.'
        : s.visit === 3 && grant === 1
          ? 'A carries two credits and receives four.'
          : 'Each wide A piece costs three. Each B piece costs one.';
  const detail = 'Round ' + s.visit + '     ·     Grant per round   A +4   /   B +2     ·     Synthetic work units';
  if (b === 2 || b === 3) {
    serif(c, main, 88, 822, 44);
    label(c, detail, 89, 854, 31, C.muted);
  } else {
    foot(c, main, detail);
  }
}
function speculativeStep(c, k) {
  const proposed = reveal(k, 5, 'The draft model proposes');
  const checked = reveal(k, 5, 'The target checks');
  const accepted = reveal(k, 5, 'It accepts');
  const rejected = reveal(k, 5, 'It rejects');
  const readPending = reveal(k, 5, 'A device read');
  const readDone = reveal(k, 6, 'the last read retires');
  const released = reveal(k, 6, 'release the other two');
  const slots = proposalSlots({ proposed, checked, accepted, rejected, released });
  head(c, k, 'Speculative decoding',
    readPending ? 'Which slots can this request overwrite?' : 'What work goes into one proposed block?');
  substrate(c, 84, 265, 1752, 533);
  const rows = [
    ['Draft proposal', 417],
    ['Target work', 514],
    ['Draft outcome', 611],
    ['Request’s KV slot', 714],
  ];
  for (const [name, y] of rows) label(c, name, 153, y, 38, C.cream);
  for (const [i, slot] of slots.entries()) {
    const x = 550 + i * 408, center = x + 183;
    mono(c, 'POSITION ' + (i + 1), center, 334, 29, C.cream, 'center');
    plate(c, x, 361, 366, 79, slot.word ? C.bLight : C.deep, 3);
    mono(c, slot.word ?? 'Pending', center, 414, 38, slot.word ? C.deep : C.steel, 'center');
    if (slot.checked) {
      plate(c, x + 19, 462, 328, 68, C.gold, 2);
      mono(c, '1 check', center, 508, 36, C.deep, 'center');
    } else {
      mono(c, 'Queued', center, 509, 35, C.steel, 'center');
    }
    label(c, slot.verdict ?? 'Pending', center, 611, 38,
      slot.verdict === 'Accepted' ? C.bLight : slot.verdict ? C.aLight : C.steel, { align: 'center' });
    const free = slot.state === 'Free';
    socket(c, x + 19, 651, 328, 85, slot.state === 'Prefix' ? C.bLight : C.aLight, !free);
    mono(c, slot.state === 'Prefix' ? 'Prefix held' : slot.state, center, 706, 38,
      free ? C.cream : C.deep, 'center');
  }
  const question = k.beat.beatIndex === 5;
  let main = 'Reserve work and temporary positions for the block.';
  let detail = 'This request owns the storage for all three positions.';
  if (proposed) main = 'Draft work   ·   ' + slots.filter((s) => s.word).length + ' proposals';
  if (checked) main += '     Target work   ·   ' + slots.filter((s) => s.checked).length + ' checks';
  if (readPending) detail = question
    ? 'A device read is still using the block.'
    : 'All three slots stay occupied while the read is in flight.';
  if (readDone) detail = 'The last device read has retired. The accepted prefix stays in place.';
  if (released) detail = 'Two slots are free for this request. The work record still includes the discarded suffix.';
  foot(c, main, detail);
}
function victim(c, k) {
  const retired = k.reveal('retire or swap', 0),
    next = k.reveal('commit the new ownership', 0);
  head(c, k, 'Preemption', 'When can the next request own this page?');
  substrate(c, 156, 338, 1610, 387);
  mono(c, 'DEVICE PAGE', 223, 422, 33, C.cream);
  for (let j = 0; j < 16; j++)
    socket(c, 235 + j * 91, 497, 77, 95, next ? C.bLight : C.aLight, !retired);
  mono(
    c,
    next ? 'B mapping committed' : retired ? 'A reference retired' : 'A mapping  /  read pending',
    232,
    664,
    37,
    next ? C.bLight : C.aLight,
  );
  foot(
    c,
    next
      ? 'The allocator has committed the new owner.'
      : retired
        ? 'The retired mapping can be removed.'
        : 'Selecting a victim leaves its mapping intact.',
    'Save resume state. Include repeated prefill in the cost of preemption.',
  );
}
export function scheduling(c, k) {
  if (k.beat.beatIndex === 0) return batch(c, k);
  if (k.beat.id === 'c05-preempt') return victim(c, k);
  if (k.beat.id === 'c05-propose' || k.beat.id === 'c05-release') return speculativeStep(c, k);
  turns(c, k);
}

function adapters(c, k) {
  const alias = reveal(k, 0, 'alias moves'),
    retire = reveal(k, 2, 'last reference retires'),
    load = reveal(k, 2, 'Bob’s approved adapter');
  const slot = adapterSlot(Boolean(alias), Boolean(retire), Boolean(load));
  head(
    c,
    k,
    'Adapter residency',
    k.beat.beatIndex === 2 ? 'When can Bob load his adapter?' : 'Which revision will Alice use next?',
  );
  label(c, 'Alias for new requests', 113, 333, 35, C.muted);
  mono(c, 'docs-current', 114, 407, 48);
  wire(c, 128, 469, 545, 469, C.A);
  mono(c, slot.alias, 132, 546, 51, C.A);
  substrate(c, 603, 302, 1195, 481);
  mono(c, 'WORKER   /   ADAPTER SLOT', 677, 372, 30, C.cream);
  const active = slot.aliceRefs > 0;
  die(c, 742, 446, 429, 186, slot.loaded ? C.B : C.board, slot.loaded ? 1 : 0);
  mono(c, slot.artifact, 953, 692, 44, load ? C.bLight : C.aLight, 'center');
  const tag = load ? 'Bob’s load' : active ? 'Alice’s batch' : 'Alice retired';
  mono(c, tag, 1472, 483, 38, C.cream, 'center');
  if (active) {
    line(
      c,
      [
        [1179, 539],
        [1258, 539],
        [1296, 578],
        [1660, 578],
      ],
      C.aLight,
      8,
    );
    dot(c, 1658, 578, 15, C.aLight);
  }
  label(
    c,
    active ? '1 live reference' : load ? 'Authorized load' : '0 live references',
    1472,
    657,
    32,
    active ? C.aLight : C.cream,
    { align: 'center' },
  );
  foot(
    c,
    load
      ? 'Bob’s approved artifact can occupy the retired slot.'
      : retire
        ? 'Alice’s last reference has retired.'
        : alias
          ? k.beat.beatIndex === 0
            ? 'The alias now resolves to docs-v3 for new requests.'
            : 'The batch handle still points to docs-v2.'
          : 'Pin the approved revision together with its compatible base.',
    active
      ? 'A public name can move while an immutable handle stays in use.'
      : 'Validate the artifact before granting a load.',
  );
}
function cache(c, k) {
  const revoked = reveal(k, 4, 'Advance the permission revision');
  const decision = reveal(k, 3, 'The cache service still needs');
  head(c, k, 'Private prefix reuse', 'Who may use the cached guide?');
  substrate(c, 94, 306, 1730, 463);
  mono(c, 'STORED PREFIX', 164, 394, 28, C.cream);
  const fields = [
    'A / ' + guidePrefix.reader,
    guidePrefix.acl,
    guidePrefix.base,
    guidePrefix.adapter,
    guidePrefix.tokens,
  ];
  fields.forEach((v, i) => {
    const x = 164 + i * 325;
    plate(c, x, 438, 299, 92, '#d1d6bb', 4);
    mono(c, v, x + 150, 497, 33, C.deep, 'center');
  });
  const name = k.beat.beatIndex === 3 ? 'Carol' : 'Alice';
  label(c, 'Read request', 165, 620, 34, C.cream);
  mono(c, name + '   /   ' + (revoked ? 'ACL v2' : 'ACL v1'), 166, 693, 40, C.gold);
  label(
    c,
    name === 'Carol' && !decision
      ? 'Same supplied salt'
      : readGuide(name, revoked ? 'ACL v2' : 'ACL v1'),
    1007,
    679,
    42,
    C.cream,
  );
  foot(
    c,
    revoked
      ? 'New reads must pass the current permission check.'
      : name === 'Carol'
        ? 'Matching the salt leaves the reader grant unresolved.'
        : 'Check what changed in the reader’s scope.',
    'Compatibility includes the model, adapter, exact tokens, positions, tokenizer and cache layout.',
  );
}
function partition(c, k) {
  const split = reveal(k, 5, 'use separate GPU instances');
  head(c, k, 'Runtime isolation', 'Which compute units share memory?');
  substrate(c, 208, 328, 1502, 416);
  mono(c, 'HOST   /   DRIVER', 271, 394, 31, C.cream);
  const n = split ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const x = 293 + i * 698,
      w = split ? 627 : 1325;
    plate(c, x, 435, w, 246, i ? '#53768a' : '#486a56', 4);
    mono(c, 'GPU instance ' + (i + 1), x + 34, 499, 32, C.cream);
    const count = split ? 1 : 2;
    for (let j = 0; j < count; j++) {
      const xx = x + 38 + j * 642;
      socket(c, xx, 533, 551, 64, C.gold, true);
      mono(c, 'Compute instance ' + (i + j + 1), xx + 275, 578, 31, C.deep, 'center');
    }
    line(
      c,
      [
        [x + 37, 633],
        [x + w - 36, 633],
      ],
      C.cream,
      10,
    );
    mono(c, 'Memory', x + w / 2, 673, 26, C.cream, 'center');
  }
  foot(
    c,
    split
      ? 'Each GPU instance has its own memory partition.'
      : 'Two compute instances share one parent memory partition.',
    'The host and driver remain shared. Size the model for the chosen partition.',
  );
}
export function reuse(c, k) {
  if (k.beat.beatIndex < 3) return adapters(c, k);
  if (k.beat.beatIndex < 5) return cache(c, k);
  partition(c, k);
}

export function accounting(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    const received = reveal(k, 3, 'client received');
    head(c, k, 'Usage receipt', 'Which tokens did the reader receive?');
    substrate(c, 91, 320, 1739, 444);
    for (let row = 0; row < 2; row++) {
      const y = 428 + row * 150,
        n = row ? 8 : 12,
        shown = !row || received;
      label(c, row ? 'Delivered' : 'Generated', 162, y + 40, 39, C.cream);
      for (let i = 0; i < 12; i++)
        socket(c, 508 + i * 91, y, 74, 63, row ? C.bLight : C.aLight, shown && i < n);
      mono(c, shown ? String(n * 10) : '?', 1750, y + 47, 46, C.cream, 'right');
    }
    foot(
      c,
      'One receipt for A / r1 / attempt 1.',
      'Each mark represents 10 output tokens. The tariff specifies which count is billable.',
    );
    return;
  }
  const total = price(machine),
    costOn = reveal(k, 1, 'The step costs'),
    node = reveal(k, 1, 'A whole-node rate'),
    split = reveal(k, 2, 'A gets one quarter');
  head(
    c,
    k,
    'Shared step cost',
    b === 2 ? 'How is this one cost divided?' : 'Which clock goes with the hourly price?',
  );
  substrate(c, 92, 298, 1736, 496);
  const lanes = reveal(k, 0, 'finish two tenths', 0.75);
  for (let i = 0; i < machine.devices; i++) {
    const y = 390 + i * 82;
    mono(c, 'GPU ' + i, 152, y + 39, 30, C.cream);
    rect(c, 317, y, 628, 51, C.deep);
    if (lanes) {
      c.save();
      c.globalAlpha = lanes;
      strip(c, 317, y, 628, 51, [[1, C.bLight]], 1);
      c.restore();
    }
  }
  mono(c, '0', 318, 755, 27, C.cream);
  mono(c, '0.2 s', 944, 755, 27, C.cream, 'right');
  if (b === 2) {
    mono(c, 'STEP   $' + total.total.toFixed(9), 1051, 400, 32, C.cream);
    if (split) {
      strip(
        c,
        1050,
        464,
        701,
        82,
        [
          [machine.share, C.aLight],
          [1 - machine.share, C.bLight],
        ],
        1,
      );
      mono(c, 'A   25%    $' + total.a.toFixed(9), 1050, 617, 32, C.aLight);
      mono(c, 'B   75%    $' + total.b.toFixed(9), 1050, 681, 32, C.bLight);
    }
  } else {
    mono(c, '$2 / GPU-hour', 1058, 397, 38, C.cream);
    if (reveal(k, 1, 'Eight tenths'))
      mono(c, total.gpuSeconds + ' GPU-s × $2 / 3600', 1058, 478, 37, C.bLight);
    if (costOn) serif(c, '$' + total.total.toFixed(9), 1055, 581, 63, C.gold);
    if (node) {
      mono(c, '0.2 node-s × $8 / 3600', 1058, 672, 33, C.cream);
      label(c, 'Whole-node rate   $8 per node-hour', 1058, 738, 30, C.cream);
    }
  }
  foot(
    c,
    b === 2
      ? 'A and B divide the same measured step.'
      : node
        ? 'One node clock or four device clocks give the same cost.'
        : 'All four GPUs occupy the same 0.2-second wall interval.',
    b === 2
      ? 'Policy shares sum to the total before rounding.'
      : node
        ? 'The rates are illustrative. Using GPU-seconds with the node price charges four times too much.'
        : 'Illustrative rate   $2 per GPU-hour.',
  );
}
