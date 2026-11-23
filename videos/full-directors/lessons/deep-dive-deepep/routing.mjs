import assert from 'node:assert/strict';
import { hidden, routes, source, finalToken } from '../../../films/deep-dive-deepep/fixtures.mjs';
import {
  ledger,
  combine,
  alignedLayout,
  resolveAlignedSlot,
  completeLayerReceipt,
  expertReturnReceipt,
  expertThreeReplay,
  weightedExpertRow,
} from '../../../films/deep-dive-deepep/model.mjs';
import {
  C,
  mix,
  smooth,
  cue,
  alpha,
  text,
  mono,
  rect,
  path,
  dot,
  hatch,
  card,
  board,
  chip,
  row,
  linePoint,
  scene,
  note,
  fmt,
  vector,
} from './bench.mjs';

const coLocated = {
  ...routes,
  a: [
    [2, 0.7],
    [3, 0.3],
  ],
};
const oneJob = { ...coLocated, a: [coLocated.a[0], [-1, 0.3]] };
const rankOneStart = 2;
function receivedChoices(choices) {
  return choices.map(([expert, gate]) => ({
    expert,
    gate,
    local: expert >= rankOneStart && expert < rankOneStart + 2 ? expert - rankOneStart : -1,
  }));
}
const ledgers = [routes, coLocated, oneJob].map((r) => ledger(r));
const receipt = completeLayerReceipt();
const a = receipt.mapping.a;
const calculated = a.map((r) => r.weighted[0]);
const inverse = new Map(ledgers[0].slots.map((r) => [r.key, r.token]));
const weighted = ledgers[0].slots.map((r) => ({
  key: r.key,
  value: r.raw.map((v) => v * r.weight),
}));
const reversed = [...weighted].reverse();
const arrivals = reversed.filter((r) => inverse.get(r.key) === 'a');
const recovered = combine(reversed, inverse);
const pairSwap = expertThreeReplay();
const otherContributions = pairSwap.pair.map(({ key, source }) =>
  weighted.find((r) => r.key !== key && inverse.get(r.key) === source).value,
);
const packed = alignedLayout([3, 1], 1);
const aligned = alignedLayout([3, 1], 4);
const fresh = expertReturnReceipt(finalToken.input, finalToken.current, finalToken.gates);
const stale = weightedExpertRow(finalToken.input, finalToken.cached, finalToken.gates);
const cash = (v) => v.toFixed(2);

export function fork(g, c) {
  const selected = cue(c, 0, 'picked experts two and three', 0.7);
  const travel = cue(c, 1, 'Send the row across', 1.65);
  const fork = cue(c, 2, 'expand the received row', 1.35);
  const jobs = cue(c, 3, 'The caller then', 0);
  const gated = cue(c, 3, 'Keep each result', 0);
  scene(g, 'Dispatch', 'How many rows cross the link?');
  board(g, 95, 290, 505, 456, 'Rank 0  /  source GPU');
  board(g, 921, 290, 902, 456, 'Rank 1  /  expert GPU');
  const src = [352, 516],
    junction = [1105, 516],
    endpoints = [
      [1575, 430],
      [1575, 626],
    ];
  for (const offset of [-12, 0, 12])
    path(
      g,
      [
        [src[0], src[1] + offset],
        [junction[0], junction[1] + offset],
      ],
      '#a7ad8b',
      4,
    );
  text(g, 'Inter-GPU link', 761, 449, 32, C.muted, 'center');
  text(g, 'Token a', src[0], 426, 34, C.white, 'center');
  text(g, 'Receive row', junction[0], 426, 32, C.white, 'center');
  for (const [i, p] of endpoints.entries()) {
    const r = ledgers[1].slots.filter((r) => r.token === 'a')[i];
    const route = [junction, [1240, 516], [1340, p[1]], p];
    path(g, route, '#a7ad8b', 5);
    chip(
      g,
      p[0] - 135,
      p[1] - 46,
      270,
      92,
      'E' + r.expert,
      selected === 1 ? '#53756a' : '#36545a',
      C.white,
    );
    text(g, 'Expert ' + r.expert, p[0], p[1] + 76, 30, C.white, 'center');
    if (fork > 0) {
      const values = gated === 1 ? r.raw.map((v) => v * r.weight) : jobs === 1 ? r.raw : hidden.a;
      row(g, ...linePoint(route, fork), vector(values), gated === 1 ? C.pale : C.gold, 220);
    }
  }
  row(g, ...src, vector(hidden.a));
  if (travel > 0) row(g, ...linePoint([src, junction], travel), vector(hidden.a), C.gold, 196);
  note(
    g,
    gated === 1
      ? 'Caller gates E2 by 0.70 and E3 by 0.30. DeepEP retains the slot map.'
      : jobs === 1
        ? 'Toy expert k multiplies its input by k + 1.'
        : fork === 1
          ? '1 delivered row   →   2 expert assignments on rank 1'
          : travel === 1
            ? '1 row received on rank 1'
            : 'Router choices for a     E2  +  E3',
  );
}

export function counts(g, c) {
  const alternate = cue(c, 2, 'to expert two', 0);
  const mask = cue(c, 3, 'with minus one', 0);
  const which = mask ? 2 : alternate ? 1 : 0;
  const data = ledgers[which],
    rts = [routes, coLocated, oneJob][which];
  const known =
    which === 0
      ? cue(c, 1, 'Count the occupied', 0)
      : which === 1
        ? cue(c, 3, 'The two expert names', 0)
        : cue(c, 4, 'Expert two still', 0);
  scene(g, 'Routing ledger', 'How many destinations and expert jobs?');
  const cols = [237, 570, 1020, 1485];
  const laidOut = cue(c, 0, 'Read across the four lines', 0.85);
  ['Token / source', 'Router choices', 'Rank 0    E0 · E1', 'Rank 1    E2 · E3'].forEach((s, i) =>
    text(g, s, cols[i], 301, 34, C.muted, 'center'),
  );
  Object.keys(hidden).forEach((id, i) => {
    const y = 382 + i * 105,
      selected = data.slots.filter((r) => r.token === id);
    rect(
      g,
      95,
      y - 43,
      1730,
      87,
      i === 0 ? C.white : i % 2 ? '#e6ebe1' : '#edf0e7',
      i === 0 ? C.ink : null,
      2,
      8,
    );
    mono(g, id + ' / R' + source[id], cols[0], y, 39);
    mono(g, rts[id].map(([e]) => (e < 0 ? '−1' : 'E' + e)).join('   '), cols[1], y, 36);
    if (laidOut < (i + 1) / 4) return;
    if (i === 0 && which === 2 && !known) {
      text(g, 'Recount this route', 1238, y, 35, C.muted, 'center');
      return;
    }
    for (let rank = 0; rank < 2; rank++) {
      const dest = selected.filter((r) => r.rank === rank),
        cx = cols[2 + rank];
      if (!dest.length) {
        mono(g, '·', cx, y, 42, C.muted);
        continue;
      }
      rect(
        g,
        cx - 150,
        y - 30,
        300,
        60,
        rank === 0 ? C.pale : C.sky,
        rank === 0 ? C.teal : C.blue,
        2,
        25,
      );
      mono(g, dest.map((r) => 'E' + r.expert).join(' + '), cx, y, 35);
    }
  });
  if (known) {
    [
      [data.destinations, 'Destination rows', C.teal],
      [data.slots.length, 'Expert jobs', C.blue],
    ].forEach(([n, name, color], i) => {
      const x = 130 + i * 874;
      text(g, name, x, 793, 32, C.muted);
      for (let k = 0; k < 8; k++)
        rect(g, x + 300 + k * 56, 768, 47, 48, k < n ? color : C.white, color, 2, 4);
    });
  }
  note(
    g,
    known
      ? data.destinations +
          ' destination rows     /     ' +
          data.slots.length +
          ' expert assignments' +
          (which === 2 ? '     /     a keeps gate 0.70' : '')
      : 'One capsule per token and destination. Each expert name is one assignment.',
  );
}

export function layout(g, c) {
  const move = cue(c, 1, 'Slide the fourth row', 1.7),
    expanded = move > 0;
  const probed = cue(c, 2, 'writes a zero', 0.35),
    rejected = cue(c, 3, 'Reject that return', 0);
  const data = expanded ? aligned : packed,
    base = 157,
    dx = 199,
    yy = 525;
  if (!cue(c, 0, 'Now take a separate expanded buffer', 0)) {
    const replay = cue(c, 0, 'expert three, with gate', 0);
    const opened = cue(c, 0, 'Open the single non-expanded row', 0);
    const local = cue(c, 0, 'The gates stay in that order', 0);
    const grouped = cue(c, 0, 'The caller groups', 0);
    const choices = receivedChoices(replay ? coLocated.a : oneJob.a);
    scene(
      g,
      'Receive memory',
      opened ? 'Which numbers index the experts on R1?' : 'Which route is a using?',
    );
    board(
      g,
      128,
      295,
      1664,
      485,
      opened ? 'Rank 1   /   non-expanded receive row' : 'Rank 0   /   router choices',
    );
    row(g, 393, 541, vector(hidden.a), C.gold, 286);
    text(g, 'Token a', 393, 636, 36, C.white, 'center');
    text(g, 'Global expert names and supplied gates', 1190, 409, 35, C.white, 'center');
    choices.forEach(({ expert, gate }, i) => {
      const label = expert < 0 ? '−1   masked' : 'E' + expert + ' × ' + cash(gate);
      chip(g, 723 + i * 495, 464, 437, 88, label, expert < 0 ? C.white : i ? C.sky : C.pale);
    });
    if (opened) {
      text(g, 'R1 starts at global expert 2', 1190, 619, 34, C.white, 'center');
      mono(
        g,
        'Local indices    ' + (local ? vector(choices.map((r) => r.local)) : '[?, ?]'),
        1190,
        701,
        39,
        C.gold,
      );
    }
    note(
      g,
      grouped
        ? 'Group the two weighted local outputs into one return for a.'
        : opened
          ? 'Subtract the first global expert on R1 from each in-range choice.'
          : replay
            ? 'Replay E2 and E3 with a fresh route handle.'
            : 'The previous run kept E2 at 0.70 and masked the second choice.',
    );
    return;
  }
  scene(g, 'Receive memory', 'Which slots have a source?');
  const slotX = (i) => base + i * dx;
  const bracket = (lo, hi, label, col) => {
    const left = slotX(lo),
      right = slotX(hi) - 14;
    path(
      g,
      [
        [left, 385],
        [left, 360],
        [right, 360],
        [right, 385],
      ],
      col,
      4,
    );
    text(g, label, (left + right) / 2, 314, 36, col, 'center');
  };
  bracket(0, data.capacities[0], 'Expert 0', C.teal);
  bracket(data.starts[1], data.capacity, 'Expert 1', C.blue);
  for (let i = 0; i < data.capacity; i++) {
    const x = slotX(i),
      gap = !data.valid[i];
    rect(g, x, 443, dx - 14, 164, gap ? '#e3e4d8' : C.white, C.ink, 2, 6);
    if (gap) hatch(g, x + 2, 445, dx - 18, 160);
    mono(g, i, x + (dx - 14) / 2, 657, 34, C.muted);
  }
  for (const [i, r] of packed.records.entries()) {
    const x = mix(slotX(r.slot), slotX(aligned.records[i].slot), move);
    row(g, x + (dx - 14) / 2, yy, r.token, i === 3 ? C.sky : C.pale, 147);
  }
  if (probed) {
    const x = slotX(3) + (dx - 14) / 2;
    row(g, x, yy, '0', rejected ? C.rose : C.gold, 110);
    alpha(g, probed, () => text(g, 'Probe writes 0', x, 738, 36, C.rust, 'center'));
  }
  const info = !expanded
    ? 'Counts [3, 1]     /     alignment 1     /     4 occupied slots'
    : move < 1
      ? 'Moving the fourth row to the next aligned start'
      : rejected
        ? 'Slot 3 has no inverse entry. Valid device ranges are [0, 3) and [4, 5).'
        : 'Starts [0, 4]     /     valid endpoints [3, 5]     /     4 real rows in 8 slots';
  note(g, info);
}

function checkReturnBatch(g, c) {
  const swap = cue(c, 4, 'A values-only swap', 1.8);
  const reattach = cue(c, 5, 'Reattach each value', 1.8);
  const repairing = c.beat.beatIndex === 5;
  const displacement = swap - reattach;
  const swapped = displacement === 1 && (repairing || c.elapsed >= c.wordCue('token into a').end);
  const paired =
    displacement === 0 && (!repairing || c.elapsed >= c.wordCue('one point nine, zero').end);
  const outputs = swapped ? pairSwap.detached : paired ? pairSwap.paired : null;
  const traceSecond = swapped && cue(c, 5, 'That one point eight belongs to c', 0);
  const laneX = [530, 1390];
  const payloadY = 466;

  scene(g, 'Check the batch', 'Did the value stay with its slot?');
  // Keep the inverse map and source rows fixed while only the payload cards move.
  pairSwap.pair.forEach(({ key, source }, i) => {
    const x = laneX[i];
    const color = i === 0 ? C.teal : C.blue;
    path(
      g,
      [
        [x, 334],
        [x, 603],
      ],
      color,
      4,
      [8, 8],
    );
    card(g, x - 164, 258, 328, 76);
    mono(g, key + ' → ' + source, x, 296, 43, color);
    card(g, x - 300, 603, 600, 125, swapped ? C.rose : C.white);
    const label = outputs ? vector(outputs[source]) : '…';
    const valueX = x + 105;
    text(g, 'Other reply', x - 260, 635, 34, C.muted);
    mono(g, '+ ' + vector(otherContributions[i]), valueX, 635, 38, C.muted);
    text(g, 'Combined ' + source, x - 260, 688, 34, C.muted);
    mono(g, label, valueX, 688, 53);
    if (traceSecond && source === 'a') {
      const left = valueX - g.measureText(label).width / 2;
      const start = left + g.measureText('[' + fmt(outputs.a[0]) + ', ').width;
      const end = start + g.measureText(fmt(outputs.a[1])).width;
      path(
        g,
        [
          [start, 716],
          [end, 716],
        ],
        C.blue,
        5,
      );
    }
  });
  const travel = smooth(displacement);
  pairSwap.pair.forEach(({ value, source }, i) => {
    const x = mix(laneX[i], laneX[1 - i], travel);
    const y = payloadY + (i === 0 ? -70 : 70) * Math.sin(Math.PI * travel);
    card(g, x - 175, y - 48, 350, 96, i === 0 ? C.pale : C.sky);
    text(g, 'From ' + source, x, y - 22, 34, C.ink, 'center');
    mono(g, vector(value), x, y + 20, 43);
  });

  text(g, receipt.uniqueReturnedSlots + ' unique return keys', 166, 778, 38, C.teal);
  for (const [i, source] of ['b', 'd'].entries()) {
    mono(g, source + '  ' + vector(recovered[source]), 990 + i * 480, 778, 38, C.muted);
  }
  let caption = 'Each Expert 3 slot points to one source row.';
  if (swap > 0) caption = 'The slot keys and their source rows stay fixed.';
  if (traceSecond) {
    caption = 'Follow the payload from c into the second coordinate of a.';
  }
  if (reattach > 0) caption = 'Match each payload to its original slot and sum again.';
  if (repairing && paired)
    caption = 'The sums are restored. The key check passed with either pairing.';
  note(g, caption);
}

export function returns(g, c) {
  if (cue(c, 4, 'Check the rest', 0)) return checkReturnBatch(g, c);
  const w = cue(c, 1, 'Keep each value', 0);
  const remote = cue(c, 2, 'Expert three arrives first', 1.5);
  const local = cue(c, 3, 'Add the local contribution', 1.5);
  const total = cue(c, 3, 'Read both coordinates', 0) ||
    (c.beat.beatIndex === 3 &&
      c.reveal('gives one point nine', 0, { captionStart: false }));
  scene(g, 'Combine', 'Which row receives the second reply?');
  const targets = [435, 1300],
    y = 414,
    acc = [910, 720];
  a.forEach((r, i) => {
    const x = targets[i],
      route = [
        [x, 510],
        [x, 600],
        [acc[0], acc[1]],
      ];
    const progress = i === 1 ? remote : local;
    const color = i ? C.blue : C.teal;
    const key = r.expert + ':' + r.slot;
    path(g, route, progress > 0 ? color : C.line, 5);
    card(g, x - 301, y - 100, 602, 199, i ? C.sky : C.pale);
    text(
      g,
      'Expert ' + r.expert + '   /   slot ' + r.expert + ':' + r.slot,
      x,
      y - 58,
      34,
      C.ink,
      'center',
    );
    mono(
      g,
      cash(r.raw[0]) + ' × ' + cash(r.gate) + ' = ' + (w ? cash(calculated[i]) : '?'),
      x,
      y + 28,
      42,
    );
    if (progress > 0 && progress < 1)
      row(g, ...linePoint(route, progress), key + ' · ' + cash(calculated[i]), i ? C.sky : C.pale, 298);
  });
  text(g, 'Saved slot map', 1570, 586, 31, C.muted, 'center');
  arrivals.forEach(({ key }, i) => {
    const active = i === 0 ? remote > 0 : local > 0;
    const y = 640 + i * 50;
    if (active) rect(g, 1438, y - 23, 264, 45, i ? C.pale : C.sky, null, 2, 7);
    mono(g, key + ' → ' + inverse.get(key), 1570, y, 35, active ? C.ink : C.muted);
  });
  const label = total
    ? 'a  [' + cash(recovered.a[0]) + ', 0]'
    : local === 1
      ? 'a   1.20 + 0.70'
      : remote === 1
        ? 'a  [' + cash(arrivals[0].value[0]) + ', 0]'
        : 'a  [  ,  ]';
  row(g, ...acc, label, total ? C.pale : C.gold, 456);
  text(
    g,
    total
      ? 'Gated once: 1.90     /     raw sum: 5.00' +
          (cue(c, 3, 'All three answers', 0) ? '     /     gated twice: 0.85' : '')
      : remote === 1
        ? 'First arrival: E3, slot 0. The local reply has the same source.'
        : w
          ? 'Caller-weighted replies, ready to return'
          : 'Input a = [1, 0]     /     toy expert k scales by k + 1',
    96,
    854,
    37,
  );
}

export function backward(g, c) {
  const sent = cue(c, 0, 'sends the same incoming gradient', 1.2);
  const deriv = cue(c, 1, 'The gate gradients use', 0);
  const gates = cue(c, 1, 'Then the expert derivatives', 0);
  const sum = Number(c.beat.beatIndex === 1 && c.elapsed >= c.speechDuration);
  if (c.beat.beatIndex === 2) {
    const sorted = cue(c, 2, 'sorts within each expert', 1);
    scene(g, 'Fixed route', 'How does deterministic order keep the mapping?');
    text(g, 'Expert 3   /   expanded layout', 160, 330, 39);
    const positions = [574, 1268];
    ['c', 'a'].forEach((v, i) => {
      const x = mix(positions[i], positions[1 - i], sorted),
        y = 514 + (i ? 1 : -1) * 100 * Math.sin(Math.PI * sorted);
      row(g, x, y, (v === 'a' ? '3:0' : '3:1') + ' → ' + v, v === 'a' ? C.pale : C.sky, 355);
    });
    note(
      g,
      sorted === 1
        ? 'Sorted by source within E3. Slot pointers follow the permutation.'
        : 'Keep the source identity attached to each received row.',
    );
    return;
  }
  scene(g, 'Backward pass', 'Where does a gradient of one go?');
  const xs = [490, 1390];
  path(
    g,
    [
      [960, 357],
      [960, 421],
      [xs[0], 421],
      [xs[0], 492],
    ],
    C.teal,
    5,
  );
  path(
    g,
    [
      [960, 421],
      [xs[1], 421],
      [xs[1], 492],
    ],
    C.blue,
    5,
  );
  row(g, 960, 321, 'a   grad = 1', C.gold, 350);
  a.forEach((r, i) => {
    const x = xs[i];
    alpha(g, sent, () => row(g, x, 497, 'E' + r.expert + '    1', i ? C.sky : C.pale, 255));
    if (deriv) mono(g, '× ' + cash(r.gate) + ' → ' + cash(r.gate), x, 612, 43);
    if (gates) mono(g, '× ' + (r.expert + 1) + ' → ' + cash(calculated[i]), x, 714, 43);
  });
  note(
    g,
    sum === 1
      ? 'Input gradient = 0.70 + 1.20 = 1.90     /     gate gradients = [1, 4]'
      : gates
        ? 'Back through each toy expert: multiply by its derivative.'
        : deriv
          ? 'Back through each gate: multiply by its supplied weight.'
          : 'Copy the gradient of the sum into both contribution slots.',
  );
}

export function practice(g, c) {
  const rebuild = cue(c, 1, 'Rebuild it', 0),
    first = cue(c, 1, 'Weight its output by one fifth', 0.55);
  const second = cue(c, 1, 'Weight its output by four fifths', 0.55),
    arriving = cue(c, 1, 'read the second slot first', 1.25);
  const done = cue(c, 2, 'Add each coordinate', 0),
    compare = cue(c, 2, 'Counting GPUs', 0);
  if (c.beat.beatIndex === 3) {
    const wait = cue(c, 3, 'place the dispatch wait', 0.6);
    const copy = cue(c, 3, 'Its hook copies the rows', 0.6);
    const read = cue(c, 3, 'Queue the first expert read', 0.6);
    const other = cue(c, 3, 'have it wait for a ready event', 0);
    const time = cue(c, 3, 'Then time', 0.6);
    scene(g, 'Final practice', 'When may the expert read z?');
    card(g, 115, 340, 594, 355, C.white);
    text(g, 'Rebuilt route   /   E1 + E2', 410, 404, 34, C.muted, 'center');
    text(g, 'Source z', 410, 490, 45, C.ink, 'center', 'Serif');
    row(g, 410, 595, vector(fresh.output), C.gold, 434);
    const x = 820,
      ready = 1080,
      y = 420;
    text(g, 'Device stream trace', x, 314, 39);
    rect(g, x, y, ready - x, 76, C.blue, null, 0, 8);
    text(g, 'Dispatch', 0.5 * (x + ready), y + 37, 35, C.white, 'center');
    if (wait > 0) {
      alpha(g, wait, () => {
        path(
          g,
          [
            [ready, y + 38],
            [ready + 30, y + 38],
            [ready + 30, 586],
          ],
          C.blue,
          4,
        );
        dot(g, ready + 30, 586, 10, C.gold, C.ink);
        text(g, 'wait', ready - 22, 585, 33, C.blue, 'right');
      });
    } else text(g, 'First read needs a dependency', x, 585, 35, C.muted);
    if (copy)
      alpha(g, copy, () => {
        rect(g, 1133, 550, 253, 72, C.rust, null, 0, 6);
        text(g, 'Copy rows', 1259, 585, 34, C.white, 'center');
      });
    if (read)
      alpha(g, read, () => {
        rect(g, 1438, 550, 309, 72, C.teal, null, 0, 6);
        text(g, 'First expert read', 1592, 585, 34, C.white, 'center');
      });
    if (other) {
      dot(g, 1411, 586, 9, C.teal);
      path(
        g,
        [
          [1411, 600],
          [1411, 671],
        ],
        C.teal,
        3,
      );
      text(g, 'Other stream waits for ready', 1411, 696, 33, C.teal, 'center');
    }
    if (time) alpha(g, time, () => text(g, 'Time through combine', x, 780, 38, C.teal));
    note(
      g,
      wait === 1
        ? 'Verify z on the device and trace the dispatch wait before comparing layer latency.'
        : 'The CPU fixture establishes the expected value at z.',
    );
    return;
  }
  scene(g, 'Final practice', 'Can token z reuse the saved route?');
  const left = 145,
    right = 990;
  text(g, 'Input z    ' + vector(finalToken.input), left, 313, 48, C.ink);
  text(g, 'Gates    ' + vector(finalToken.gates), right, 313, 48, C.ink);
  const versions = [
    ['Saved', finalToken.cached],
    ['Router', finalToken.current],
  ];
  versions.forEach(([name, ids], i) => {
    const x = i ? right : left;
    card(g, x, 378, 771, 202, i && rebuild ? C.pale : C.white);
    text(g, name + ' choices', x + 32, 419, 34, C.muted);
    ids.forEach((id, j) => {
      chip(g, x + 63 + j * 366, 472, 274, 70, 'E' + id + ' / R' + Math.floor(id / 2), C.white);
    });
  });
  if (first) {
    const prefix = 'E' + finalToken.current[0];
    mono(g, prefix + '   [4, -2] × 0.2 = ' + vector(fresh.slots[0].value), 501, 657, 40);
  }
  if (second)
    mono(
      g,
      'E' + finalToken.current[1] + '   [6, -3] × 0.8 = ' + vector(fresh.slots[1].value),
      1370,
      657,
      40,
    );
  if (first) {
    path(
      g,
      [
        [1376, 582],
        [1376, 602],
        [501, 602],
        [501, 620],
      ],
      C.teal,
      3,
    );
    path(
      g,
      [
        [1376, 602],
        [1376, 620],
      ],
      C.teal,
      3,
    );
  }
  if (arriving > 0) {
    const pos = linePoint(
      [
        [1380, 723],
        [1070, 770],
        [958, 770],
      ],
      arriving,
    );
    row(
      g,
      ...pos,
      done ? 'z  ' + vector(fresh.output) : 'z  ' + vector(fresh.trace[0].accumulator),
      C.gold,
      480,
    );
  }
  note(
    g,
    compare
      ? 'Rebuilt  ' +
          vector(fresh.output) +
          '     /     cached  ' +
          vector(stale.output) +
          '     /     same two destination GPUs'
      : done
        ? 'Sum the contributions at z, one coordinate at a time.'
        : arriving === 1
          ? 'E2 arrived first. Now add the E1 contribution at the same source.'
          : rebuild
            ? 'Both experts need the new slot map.'
            : 'Both routes touch rank 0 and rank 1.',
  );
}

export function checkRouting() {
  assert.deepEqual(
    receivedChoices(oneJob.a).map((r) => r.local),
    [0, -1],
  );
  assert.deepEqual(
    receivedChoices(coLocated.a).map((r) => [r.expert, r.local, r.gate]),
    [
      [2, 0, 0.7],
      [3, 1, 0.3],
    ],
  );
  assert.deepEqual(
    ledgers.map((l) => [l.destinations, l.slots.length]),
    [
      [8, 8],
      [7, 8],
      [7, 7],
    ],
  );
  assert.deepEqual(
    ledgers[1].slots.filter((r) => r.token === 'a').map((r) => [r.rank, r.expert, r.remote]),
    [
      [1, 2, true],
      [1, 3, true],
    ],
  );
  assert.deepEqual(
    ledgers[2].slots.filter((r) => r.token === 'a').map((r) => [r.rank, r.expert, r.weight]),
    [[1, 2, 0.7]],
  );
  assert.deepEqual([aligned.starts, aligned.endpoints, aligned.capacity], [[0, 4], [3, 5], 8]);
  assert.throws(() => resolveAlignedSlot(aligned, 3, 0));
  assert.deepEqual(
    packed.records.map((r) => r.token),
    aligned.records.map((r) => r.token),
  );
  assert.deepEqual(
    arrivals.map((r) => [r.key, r.value]),
    [
      ['3:0', [1.2, 0]],
      ['0:0', [0.7, 0]],
    ],
  );
  assert.deepEqual(recovered, combine(weighted, inverse));
  assert.deepEqual(recovered.a, [1.9, 0]);
  assert.equal(cash(a.reduce((v, r) => v + r.weighted[0] * r.gate, 0)), '0.85');
  assert.deepEqual(otherContributions, [[0.7, 0], [1.1, 1.1]]);
  assert.deepEqual(pairSwap.paired, recovered);
  assert.equal(receipt.uniqueReturnedSlots, inverse.size);
  assert.deepEqual(pairSwap.detached.b, recovered.b);
  assert.deepEqual(pairSwap.detached.d, recovered.d);
  assert.deepEqual(pairSwap.detached.a, [2.5, 1.8]);
  assert.deepEqual(pairSwap.detached.c, [2.3, 1.1]);
  assert.throws(() => combine(reversed.slice(1), inverse));
  assert.throws(() => combine([...reversed, reversed[0]], inverse));
  assert.deepEqual(
    fresh.trace.map((r) => r.key),
    ['2:0', '1:0'],
  );
  assert.equal(vector(fresh.output), '[5.6, -2.8]');
  assert.equal(vector(stale.output), '[6.8, -3.4]');
}
