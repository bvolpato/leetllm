import { heapTrace, capacityState, rank } from '../../../films/ai-data-structures/arithmetic.mjs';
import {
  C,
  beat,
  cue,
  mix,
  label,
  text,
  line,
  rect,
  slots,
  token,
  receipt,
  foot,
  arrow,
  node,
  idText,
} from './archive.mjs';

export const arrivals = heapTrace();
const key = (r) => '(' + r.score + ', ' + -r.id + ')';
function weighted(g, x, y, r, color = C.paper) {
  if (!r) {
    rect(g, x - 82, y - 31, 164, 62, C.deep, 8, C.rail);
    return;
  }
  token(g, x - 88, y - 32, 'M' + r.id, 76, 64, color);
  rect(g, x - 10, y - 32, 101, 64, C.deep, 4, C.rail);
  text(g, key(r), x + 41, y + 6, 18, C.cream, 'Mono', 'center');
}
export function heap(g, c) {
  const n = beat(c),
    a = cue(c, 1, 'Put the once-charged note'),
    b = cue(c, 2, 'enters the child slot');
  const replace = cue(c, 4, 'earlier note takes its place'),
    repair = cue(c, 4, 'moving the plan-change note up', 1.15);
  const rejected = cue(c, 5, 'discard M1'),
    sorted = cue(c, 5, 'Sort the winners');
  const step = arrivals[n === 1 ? 0 : n === 2 ? 1 : n < 5 ? 2 : 3];
  label(g, 'Arriving key', 70, 166);
  label(g, 'Min-heap · two places', 540, 166);
  label(g, 'Ranked reply', 891, 166);
  line(g, 566, 279, 671, 436, C.rail, 7);
  weighted(g, 559, 270, null);
  weighted(g, 686, 444, null);
  if (n <= 2) {
    if (n === 1) weighted(g, mix(192, 559, a), 270, arrivals[0].incoming, C.gold);
    else {
      weighted(g, 559, 270, arrivals[0].incoming);
      weighted(g, mix(192, 686, b), mix(270, 444, b), arrivals[1].incoming, C.gold);
    }
  } else if (n < 5) {
    const [root, child] = step.before;
    if (replace < 1)
      weighted(
        g,
        mix(559, 193, replace),
        mix(270, 450, replace),
        root,
        replace ? C.coral : C.paper,
      );
    if (replace === 1) {
      weighted(g, 193, 450, root, C.coral);
      label(g, 'Evicted', 193, 523, 'center');
    }
    const swing = Math.sin(Math.PI * repair) * 96;
    weighted(g, mix(686, 559, repair) + swing, mix(444, 270, repair), child);
    weighted(
      g,
      mix(mix(192, 559, replace), 686, repair) - swing,
      mix(270, 444, repair),
      step.incoming,
      C.gold,
    );
  } else {
    weighted(g, 192, 270, step.incoming, rejected ? C.coral : C.gold);
    if (rejected) label(g, 'Zero score · discard', 58, 348);
    step.after.forEach((r, i) => weighted(g, i ? 686 : 559, i ? 444 : 270, r));
  }
  receipt(g, 880, 201, 260, 'Strongest first', sorted ? step.winners.map((r) => r.id) : []);
  foot(
    g,
    n < 4
      ? 'Compare (score, −ID). A lower message ID wins a score tie.'
      : n === 4
        ? 'Replacement can leave the new root stronger than its child. Sift it down.'
        : 'Heap storage exposes the weakest winner. The reply lists the strongest first.',
  );
}
export const heapExample = [1, 5, 3];
export const repairStart = [9, 2, 4, 3, 6, 7, 8];
export function siftPath(values) {
  const state = [...values],
    frames = [[...state]],
    path = [0];
  let i = 0;
  while (2 * i + 1 < state.length) {
    const a = 2 * i + 1,
      b = a + 1;
    const child = b < state.length && state[b] < state[a] ? b : a;
    if (state[i] <= state[child]) break;
    [state[i], state[child]] = [state[child], state[i]];
    i = child;
    path.push(i);
    frames.push([...state]);
  }
  return { frames, path };
}
export function heapOrder(g, c) {
  const n = beat(c);
  if (n <= 2) {
    const p = [
      [460, 224],
      [254, 435],
      [666, 435],
    ];
    for (const i of [1, 2])
      line(g, ...p[0], ...p[i], i === 1 && cue(c, 2, 'left child') ? C.coral : C.rail, 6);
    heapExample.forEach((v, i) => node(g, ...p[i], v, { r: 47, fill: i === 1 ? C.gold : C.paper }));
    label(g, 'Array storage', 835, 246);
    text(g, '[1, 5, 3]', 835, 309, 35, C.gold, 'Mono');
    if (cue(c, 2, 'satisfies the min-heap rule'))
      text(g, '1 ≤ 5   ·   1 ≤ 3', 814, 396, 24, C.mint, 'Mono');
    foot(
      g,
      n === 1
        ? 'Can you use a left-or-right search rule here?'
        : 'Five sits left of one. A min-heap only orders each parent against its children.',
    );
  } else if (n <= 4) {
    const last = arrivals[3],
      bad = n === 3 && cue(c, 3, 'without checking the score') > 0;
    label(g, 'Incoming', 70, 174);
    weighted(g, 166, 270, last.incoming, C.coral);
    label(g, bad ? 'Unconditional replacement' : 'Retained heap', 419, 174);
    line(g, 536, 253, 676, 413, C.rail, 6);
    weighted(g, 536, 253, bad ? last.incoming : last.before[0], bad ? C.coral : C.paper);
    weighted(g, 676, 413, last.before[1]);
    if (bad) {
      label(g, 'Evicted', 930, 180);
      weighted(g, 977, 271, last.before[0], C.coral);
    }
    if (n === 4 && cue(c, 4, 'incoming key is smaller')) {
      text(g, key(last.incoming) + ' < ' + key(last.before[0]), 126, 511, 33, C.mint, 'Mono');
    }
    foot(
      g,
      bad
        ? 'An unconditional heapreplace threw away a two-point winner.'
        : 'A guarded replacement keeps the stronger root.',
    );
  } else if (n <= 6) {
    const sequence = siftPath(repairStart),
      advance = Math.floor(cue(c, 5, 'Follow a repair', 1.4) * 2);
    const pos = [
      [422, 199],
      [260, 325],
      [584, 325],
      [165, 461],
      [348, 461],
      [505, 461],
      [681, 461],
    ];
    for (let i = 1; i < pos.length; i++)
      line(
        g,
        ...pos[(i - 1) >> 1],
        ...pos[i],
        sequence.path.slice(1, advance + 1).includes(i) ? C.gold : C.rail,
        5,
      );
    sequence.frames[advance].forEach((v, i) =>
      node(g, ...pos[i], v, { fill: sequence.path[advance] === i ? C.gold : C.paper }),
    );
    label(g, 'Repair depth', 820, 224);
    text(g, advance + ' / 2 edges', 818, 284, 35, C.gold, 'Serif');
    if (n === 6) {
      text(g, 'O(m log k)', 818, 383, 30, C.mint, 'Mono');
      label(g, 'k winner slots', 820, 437);
    }
    foot(
      g,
      n === 5
        ? 'Peek at the root directly. A repair follows one branch.'
        : 'For 2 ≤ k ≤ m, bounded selection costs O(m log k). List growth can copy references.',
    );
  } else {
    const ranked = arrivals.at(-1).winners;
    label(g, 'One winner', 90, 191);
    receipt(g, 85, 229, 337, 'Best so far', [ranked[0].id], 1);
    label(g, 'Many winners', 561, 191);
    const all = rank(arrivals.map((a) => a.incoming));
    if (cue(c, 7, 'sorting can be simpler'))
      receipt(
        g,
        558,
        229,
        474,
        'All positive scores',
        all.map((r) => 'M' + r.id + '    ' + key(r)),
        all.length,
      );
    foot(g, 'Choose the selection method for the number of winners the caller needs.');
  }
}
const waiting = [0, 2, 3];
export function rail(g, x, y, count, width = 480) {
  rect(g, x - 11, y - 10, width + 22, 84, C.deep, 7, C.rail);
  for (let i = 0; i < count; i++) {
    const xx = x + i * (width / count);
    line(g, xx, y + 68, xx, y + 81, C.gold, 2);
    line(g, xx, y + 57, xx + width / count - 9, y + 57, C.rail, 3);
  }
}
export function queue(g, c) {
  const deque = cue(c, 1, 'Claim the oldest', 1.1),
    list = cue(c, 2, 'claim M0 from a list', 1.15, 'Now claim M0 from a list');
  label(g, 'Waiting · original position marks', 331, 159);
  label(g, 'Claimed', 82, 159);
  for (const [j, [name, t]] of [
    ['Deque', deque],
    ['List', list],
  ].entries()) {
    const y = 224 + j * 177;
    label(g, name, 343, y - 21);
    rail(g, 340, y, 3, 630);
    waiting.forEach((id, i) => {
      const target = i === 0 ? 87 : 340 + (i - (j === 1 ? 1 : 0)) * 210;
      token(g, mix(340 + i * 210, target, t), y + 1, 'M' + id, 117, 53, i === 0 ? C.gold : C.paper);
    });
    if (j === 0) {
      const xx = 399 + 210 * deque;
      arrow(g, xx, y + 117, xx, y + 82, C.mint, 3);
      text(g, 'head', xx + 15, y + 116, 18, C.mint, 'Mono');
    }
  }
  foot(g, 'Both claims deliver the oldest job. Follow M2 and M3 against the fixed marks.', 535, 505);
}
export function workers(g, c) {
  const n = beat(c);
  if (n === 1) {
    const claim = cue(c, 1, 'claim jobs'),
      doneB = cue(c, 1, 'second worker can finish first'),
      doneA = cue(c, 1, 'Then the older job finishes');
    label(g, 'Claim order', 68, 174);
    label(g, 'Worker', 434, 174);
    label(g, 'Completion order', 852, 174);
    for (const [i, id] of [0, 2].entries()) {
      const y = 229 + i * 149;
      line(g, 73, y + 34, 827, y + 34, C.rail, 4);
      token(
        g,
        mix(86, 500, i ? claim : Math.min(1, claim * 1.8)),
        y,
        'M' + id,
        103,
        62,
        i ? C.paper : C.gold,
      );
      label(g, i ? 'B' : 'A', 454, y - 10);
    }
    receipt(g, 850, 208, 280, 'Finished', doneA ? [2, 0] : doneB ? [2] : []);
    foot(g, 'Attach each result to the ID claimed by that worker.');
  } else if (n === 2) {
    const claim = cue(c, 2, 'claims the oldest job'),
      admit = cue(c, 2, 'admit the pending job');
    const state = capacityState(claim > 0.7, admit > 0.7);
    label(g, 'Ring buffer · two physical slots', 438, 178);
    for (const [i, x] of [489, 795].entries()) {
      node(g, x, 331, state.slots[i] === null ? '·' : 'M' + state.slots[i], {
        r: 66,
        fill: state.head === i ? C.gold : C.paper,
      });
      label(g, 'slot ' + i, x, 440, 'center');
    }
    arrow(g, 568, 318, 714, 318);
    arrow(g, 714, 350, 568, 350, C.rail);
    label(g, 'Producer', 72, 212);
    slots(g, 72, 241, [state.pending.length ? 'M5' : null], { w: 122 });
    label(g, 'Claimed', 72, 378);
    slots(g, 72, 405, [state.claimed === null ? null : 'M' + state.claimed], { w: 122 });
    label(
      g,
      'Head at slot ' + state.head + '     waiting order  ' + idText(state.logicalOrder),
      387,
      518,
    );
    foot(
      g,
      'The head records which occupied slot leaves next. The producer holds M5 until admission.',
    );
  } else {
    const b = cue(c, 3, 'takes M3'),
      a = cue(c, 3, 'raises Empty');
    label(g, 'Waiting jobs', 65, 190);
    rail(g, 72, 255, 1, 210);
    label(g, 'Worker B', 470, 200);
    label(g, 'Worker A', 848, 200);
    token(g, mix(76, 482, b), 257, 'M3', 127, 55, C.gold);
    if (a) token(g, 839, 258, 'Empty', 183, 55, C.coral);
    text(g, 'get_nowait()', 470, 423, 27, C.pale, 'Mono');
    text(g, 'get_nowait()', 844, 423, 27, C.pale, 'Mono');
    foot(g, 'A successful get transfers ownership. A previous nonempty check reserves nothing.');
  }
}
export function overflowStates() {
  const before = [0, 2],
    incoming = 3;
  return {
    before,
    incoming,
    recent: [...before.slice(1), incoming],
    waiting: [...before],
    rejected: incoming,
    evicted: before[0],
  };
}
export function policies(g, c) {
  const n = beat(c),
    s = overflowStates();
  const drop = cue(c, 2, 'M0 drops out', 1),
    reject = cue(c, 3, 'producer still owns M3'),
    claims = Math.floor(cue(c, 5, 'claim the waiting jobs', 1.2) * 2);
  label(g, 'Container', 54, 168);
  label(g, 'Oldest → newest', 372, 168);
  label(g, 'Producer', 878, 168);
  for (const [i, name] of ['Bounded deque', 'Synchronized queue'].entries()) {
    const y = 224 + i * 171;
    text(g, name, 53, y + 35, 23, C.cream, 'Serif', 'left', 257);
    rail(g, 361, y, 2, 419);
    const jobs = i ? s.waiting.slice(claims) : drop === 1 ? s.recent : s.before;
    if (!i && drop > 0 && drop < 1) {
      token(g, mix(369, 274, drop), mix(y, y + 79, drop), 'M0', 99, 53, C.coral);
      token(g, mix(575, 369, drop), y, 'M2', 99, 53);
      token(g, mix(887, 575, drop), y, 'M3', 99, 53, C.gold);
    } else {
      jobs.forEach((v, j) =>
        token(g, 369 + j * 206, y, 'M' + v, 99, 53, v === 3 ? C.gold : C.paper),
      );
      if (i || !drop) token(g, 887, y, 'M3', 99, 53, i && reject ? C.coral : C.gold);
    }
    if (!i && drop === 1) label(g, 'Dropped M' + s.evicted, 362, y + 109);
    if (i && reject) label(g, claims ? 'M3 still pending' : 'Full · retry M3', 853, y + 104);
  }
  if (claims > 0) label(g, 'Claimed  ' + idText(s.before.slice(0, claims)), 363, 518);
  foot(
    g,
    n === 5
      ? cue(c, 5, 'raises Empty', 0.65, 'It raises Empty')
        ? 'Next get raises Empty. Completion requires its own record.'
        : 'Claim the accepted jobs in FIFO order.'
      : n < 3
        ? 'Try admitting M3 to each full container.'
        : 'Recent history can discard its oldest entry. Unprocessed work needs an admission policy.',
  );
}
