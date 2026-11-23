import { REMOTE_ASSIGNMENTS } from '../../../films/moe/fixtures.mjs';
import { moeWire, moeServing } from '../../../films/moe/model.mjs';
import {
  C,
  fmt,
  vec,
  expert,
  cue,
  mix,
  ease,
  type,
  mono,
  rule,
  box,
  arrow,
  board,
  foot,
  tag,
} from './bench.mjs';

export const pool = { shared: 3, partition: 2, experts: 8, k: 2, bytes: 2 };
export const parameters = (k) => pool.shared + k * pool.partition;
export function memory(c, k) {
  const active = cue(k, 1, 'Each token uses', 0.4),
    raw = cue(k, 2, 'Count all nineteen', 0.5);
  const bytes = cue(k, 2, 'thirty-eight decimal gigabytes', 0.5);
  const blocks = [pool.shared, ...Array(pool.experts).fill(pool.partition)];
  const top = 192,
    unit = 33,
    start = 118,
    selected = [0, 1, 3];
  type(c, 'Raw weight pool', 47, 129, 23);
  const measure = bytes ? pool.bytes : 1;
  let x = start;
  blocks.forEach((n, i) => {
    const w = n * unit;
    const run = active && selected.includes(i);
    box(c, x, top, w - 3, 83, run ? C.teal : '#b6c3b5', null, 4);
    mono(
      c,
      i ? expert(i - 1) : 'shared',
      x + (w - 3) / 2,
      top + 26,
      16,
      run ? C.chalk : C.ink,
      'center',
    );
    mono(
      c,
      n * measure + (bytes ? ' GB' : 'B'),
      x + (w - 3) / 2,
      top + 58,
      16,
      run ? C.chalk : C.ink,
      'center',
    );
    if (run) rule(c, x, top + 94, x + w - 4, top + 94, C.teal, 4);
    x += w;
  });
  mono(
    c,
    (bytes ? parameters(8) * 2 + ' GB' : parameters(8) + 'B') + ' stored',
    881,
    311,
    22,
    C.ink,
    'right',
  );
  if (active) {
    type(c, bytes ? '14 GB budget' : 'Active weight quantity', 50, 368, 19, C.mid);
    box(c, 283, 354, parameters(2) * unit, 26, C.teal, null, 3);
    if (bytes) box(c, 283 + parameters(2) * unit, 354, 12 * unit, 26, '#d6aa92', null, 3);
    if (bytes) mono(c, '24 GB short', 283 + 13 * unit, 367, 17, C.ink, 'center');
    else mono(c, parameters(2) + 'B', 286 + parameters(2) * unit, 367, 18, C.teal);
  }
  foot(
    c,
    bytes
      ? 'Two bytes per weight. The checkpoint alone exceeds 14 GB before KV cache or scratch space.'
      : raw
        ? 'Count the shared weights once and all eight expert partitions.'
        : 'Hypothetical model  ·  each partition aggregates one expert position across MoE layers.',
  );
}
export const owner = (e) => Number(e >= 2);
export const remote = REMOTE_ASSIGNMENTS.filter((row) => owner(row.expert) !== row.source);
export const coordinates = 4096;
const bytesPerCoordinate = 2;
export const vectorKiB = (coordinates * bytesPerCoordinate) / 1024;
const wireExample = moeWire();
export const wire = moeWire(
  wireExample.gates,
  wireExample.outputs.map((pair) => {
    const output = Array(coordinates).fill(0);
    pair.forEach((value, j) => {
      output[j] = value;
    });
    return output;
  }),
);
export const tokenId = 42;
export const hashRoutes = new Map([[tokenId, [2, 3]]]);
export function interconnect(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    type(c, 'Expert parallelism', 50, 137, 23);
    type(c, 'Tensor parallelism', 508, 137, 23);
    for (let i = 0; i < 2; i++) {
      const y = 199 + i * 87;
      tag(c, 'GPU ' + i, 48, y, 83);
      [0, 1].forEach((_, j) => tag(c, expert(2 * i + j), 151 + j * 94, y, 75, C.teal));
    }
    type(c, 'One expert matrix', 509, 178, 18, C.mid);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        box(c, 518 + j * 49, 209 + i * 36, 44, 30, j < 2 ? C.teal : C.plum, null, 2);
    type(c, 'rank 0', 562, 380, 17, C.teal, 'center');
    type(c, 'rank 1', 663, 380, 17, C.plum, 'center');
    foot(
      c,
      'Different expert IDs can have different owners. Several ranks can also share one expert matrix.',
    );
    return;
  }
  const dispatch = cue(k, 0, 'the hidden state travels', 1.2),
    back = cue(k, 0, 'The output then returns', 1.1);
  const batch = cue(k, 1, 'Two assignments stay local', 0.6);
  const count = cue(k, 2, 'forty-eight kibibytes', 0.4);
  type(c, 'Token origin', 51, 130, 21);
  type(c, 'Expert owner', 666, 130, 21);
  const data = batch ? REMOTE_ASSIGNMENTS : [remote[0]];
  data.forEach((r, i) => {
    const y = 183 + i * 42,
      cross = owner(r.expert) !== r.source;
    mono(c, 't' + r.token + ' · GPU ' + r.source, 52, y, 18);
    mono(c, expert(r.expert) + ' · GPU ' + owner(r.expert), 668, y, 18);
    if (cross) {
      rule(c, 225, y - 5, 629, y - 5, C.rule);
      arrow(c, 225, y - 5, 225 + 404 * dispatch, y - 5, C.rust, 2, 8);
      if (back) arrow(c, 629, y + 6, 629 - 404 * back, y + 6, C.teal, 2, 8);
    } else {
      rule(c, 224, y, 629, y, '#bcc5b8');
      type(c, 'local', 427, y - 9, 15, C.mid, 'center');
    }
  });
  foot(
    c,
    count
      ? '3 remote assignments × (8 KiB out + 8 KiB back) = 48 KiB of token-state payload.'
      : 'Copper dispatches a hidden state. Green returns the output. The expert weights stay resident.',
  );
}
export function protocol(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const known = cue(k, 2, 'Suppose token', 0);
    const scored = cue(k, 2, 'A router that ranks', 0);
    const lookup = cue(k, 2, 'A token-ID table', 0);
    const ids = cue(k, 2, 'Stage their pages', 0);
    const transfer = cue(k, 2, 'Stage their pages', 1.25);
    type(c, 'Offloaded expert weights', 48, 126, 22);
    if (!scored) {
      const fetch = cue(k, 2, 'weight pages can move', 1.25);
      board(c, 46, 168, 289, 188);
      board(c, 625, 168, 289, 188);
      type(c, 'CPU / SSD', 72, 206, 22, C.chalk);
      type(c, 'Accelerator', 650, 206, 22, C.chalk);
      for (let j = 0; j < 4; j++) {
        box(c, 81 + j * 8, 273 - j * 5, 117, 44, '#83948b', C.seam, 4);
      }
      mono(c, 'weights', 163, 280, 18, C.ink, 'center');
      arrow(c, 336, 280, 620, 280, C.mid, 2);
      if (fetch) tag(c, 'weight page', mix(236, 663, ease(fetch)), 264, 128, C.brass, C.ink);
      if (known) tag(c, 'token ID ' + tokenId, 459, 110, 153);
      foot(
        c,
        known
          ? 'The next layer’s hidden state is still being computed. Which expert pages can we stage?'
          : 'Offloading can move expert weight pages from storage to the accelerator.',
      );
      return;
    }
    if (known) {
      tag(c, 'token ID ' + tokenId, 454, 110, 153);
      type(c, 'Next hidden state in progress', 628, 126, 19, C.mid);
    }
    board(c, 44, 166, 871, 243);
    type(c, 'Selection rule', 69, 201, 18, C.faint);
    type(c, 'Exact expert IDs', 341, 201, 18, C.faint);
    type(c, 'Storage', 583, 201, 18, C.faint);
    type(c, 'Accelerator', 879, 201, 18, C.faint, 'right');
    rule(c, 68, 225, 893, 225, C.seam);
    type(c, 'Rank state scores', 69, 265, 20, C.chalk);
    type(c, 'Wait for state', 341, 265, 19, C.brass);
    type(c, 'Early fetch is speculative', 583, 265, 19, C.faint);
    if (lookup) {
      rule(c, 68, 302, 893, 302, C.seam);
      type(c, 'Toy token-ID table', 69, 350, 20, C.chalk);
      const labels = hashRoutes.get(tokenId).map(expert).join(', ');
      mono(c, tokenId + ' → ' + (ids ? labels : '?'), 341, 350, 18, C.ice);
      if (ids) {
        arrow(c, 586, 350, 876, 350, C.faint, 2);
        const x = mix(580, 765, ease(transfer));
        tag(c, labels + ' pages', x, 334, 126, C.ice, C.ink);
      }
    }
    foot(
      c,
      lookup
        ? 'The token ID identifies which pages to fetch. Blend weights still need the hidden state.'
        : 'A score-ranked route becomes exact once the router can score the next hidden state.',
    );
    return;
  }
  const combined = cue(k, 1, 'Send the input once', 0),
    merged = cue(k, 1, 'Send one combined result home', 0),
    returned = cue(k, 1, 'One full vector in each direction', 0),
    counted = cue(k, 1, 'Synchronization and overlap', 0);
  board(c, 40, 138, 171, 248);
  board(c, 653, 138, 268, 248);
  type(c, 'Origin', 67, 174, 23, C.chalk);
  tag(c, 'token x', 65, 245, 120, C.ice, C.ink);
  type(c, 'Remote owner', 676, 173, 22, C.chalk);
  type(c, 'First 2 of ' + coordinates + ' coordinates', 676, 204, 16, C.faint);
  wire.outputs.forEach((v, i) =>
    mono(
      c,
      expert(2 + i) + '  ' + fmt(wire.gates[i]) + ' × ' + vec(v.slice(0, 2)),
      676,
      234 + i * 48,
      18,
      C.chalk,
    ),
  );
  const rows = combined
    ? [
        ['input vector', true],
        ['weighted sum', false],
      ]
    : [
        ['input for E3', true],
        ['input for E4', true],
        ['return from E3', false],
        ['return from E4', false],
      ];
  rows.forEach(([label, out], i) => {
    if (combined && !out && !returned) return;
    const y = combined ? 222 + i * 89 : 177 + i * 59;
    arrow(c, out ? 218 : 641, y + 14, out ? 641 : 218, y + 14, out ? C.rust : C.teal, 2.6, 10);
    mono(c, label + '  ·  ' + vectorKiB + ' KiB', 430, y - 2, 17, C.ink, 'center');
  });
  if (merged) mono(c, 'Σ ' + vec(wire.destinationCombined.slice(0, 2)), 677, 350, 20, C.ice);
  type(
    c,
    'Each arrow carries all ' +
      coordinates +
      ' coordinates × ' +
      bytesPerCoordinate +
      ' bytes = ' +
      vectorKiB +
      ' KiB.',
    45,
    416,
    19,
    C.mid,
  );
  let message = 'Two experts on one remote GPU. Four separate 8 KiB messages carry 32 KiB.';
  if (combined) message = 'Apply 0.6 to E3 and 0.4 to E4 at their common owner.';
  if (merged) message = 'The owner has the weighted sum for all ' + coordinates + ' coordinates.';
  if (returned) message = 'One input goes to the owner. One weighted vector comes back.';
  if (counted)
    message = 'Payload falls from 32 KiB to 16 KiB. Both expert functions and gates stay the same.';
  foot(c, message);
}
export const rankRows = [
  [6, 2],
  [2, 6],
];
export function workloads(c, k) {
  if (k.beat.beatIndex >= 2) {
    const reveal = cue(k, 3, 'GPU zero has six rows', 0);
    type(c, 'Simultaneous expert rows by device', 49, 131, 22);
    ['Step 1', 'Step 2', 'Across both'].forEach((s, i) =>
      type(c, s, [253, 490, 763][i], 187, 19, C.mid),
    );
    rankRows.forEach((row, i) => {
      const y = 253 + 80 * i;
      mono(c, 'GPU ' + i, 54, y, 22);
      row.forEach((n, j) => {
        const x = [254, 491][j];
        for (let r = 0; r < n; r++)
          box(c, x + r * 21, y - 11, 18, 22, reveal && n === 6 ? C.rust : C.teal, null, 2);
        mono(c, n, x + 152, y, 18);
      });
      mono(c, row.reduce((a, b) => a + b) + ' rows', 763, y, 20);
    });
    foot(
      c,
      reveal
        ? 'The heavier owner switches between steps. Check per-step work and combine waits.'
        : 'Each row costs the same in this example. Which owner has more work in the first step?',
    );
    return;
  }
  const decode = cue(k, 0, 'Small decode batches', 0.9);
  const prefill = cue(k, 1, 'In a prefill', 0.9);
  type(c, 'One request during decode', 49, 135, 21);
  type(c, 'Four known prefill positions', 503, 135, 21);
  const labels = ['route', 'group', 'dispatch', 'FFN', 'combine'];
  labels.forEach((l, j) => {
    const x = 60 + j * 80;
    type(c, l, x + 31, 197, 14, C.mid, 'center');
    for (let i = 0; i < (decode ? 4 : 1); i++) {
      const y = 232 + i * 39;
      box(c, x, y, 60, 20, j === 3 ? C.teal : '#99aa9a', null, 3);
      if (j < 4) arrow(c, x + 61, y + 10, x + 77, y + 10, C.rule, 1.2, 4);
      if (j === 3) mono(c, 't' + i, x + 30, y + 10, 13, C.chalk, 'center');
    }
  });
  if (prefill) {
    labels.forEach((l, j) => {
      const x = 513 + j * 80;
      type(c, l, x + 31, 197, 14, C.mid, 'center');
      box(c, x, 232, 60, 137, j === 3 ? C.teal : '#bdc9bc', null, 4);
      for (let i = 0; i < 4; i++) {
        const y = 247 + i * 34;
        if (i > 0) rule(c, x + 6, y - 15, x + 54, y - 15, '#e3e9db');
        if (j === 3) mono(c, 't' + i, x + 30, y, 13, C.chalk, 'center');
      }
    });
  }
  rule(c, 470, 161, 470, 392, C.rule);
  foot(
    c,
    prefill
      ? 'Same four expert rows: four dependent one-row calls during decode or one four-row call in prefill.'
      : 'One expert selection per pictured position. Stage widths are schematic.',
  );
}
export function serving(c, k) {
  const changed = cue(k, 2, 'fifty milliseconds', 0);
  const limit = changed ? 50 : 60,
    rows = moeServing(limit);
  const verdict = changed ? cue(k, 3, 'Neither clears', 0) : cue(k, 1, 'The mixture clears', 0);
  type(c, 'Synthetic matched requests', 50, 122, 19, C.mid);
  const xs = [58, 260, 425, 609, 816];
  ['Candidate', 'Quality', 'p95', 'Tokens/s', 'Decision'].forEach((t, i) =>
    type(c, t, xs[i], 170, 18, C.mid),
  );
  mono(c, '≥ 0.82', xs[1], 211, 17);
  mono(c, '≤ ' + limit + ' ms', xs[2], 211, 17, changed ? C.rust : C.ink);
  mono(c, '≥ 1000', xs[3], 211, 17);
  rows.forEach((r, i) => {
    const y = 278 + i * 74;
    box(c, 42, y - 27, 876, 55, i ? '#d7e1d2' : '#e3e5d9', null, 5);
    [r.id, fmt(r.quality), r.latency + ' ms', r.throughput].forEach((t, j) => {
      const color = verdict && j > 0 && !r.checks[j - 1] ? C.red : C.ink;
      mono(c, t, xs[j], y, 21, color);
      if (verdict && j > 0 && !r.checks[j - 1])
        rule(c, xs[j], y + 17, xs[j] + 64, y + 17, C.red, 2.5);
    });
    mono(
      c,
      verdict ? (r.accepted ? 'accept' : 'reject') : '?',
      xs[4],
      y,
      19,
      verdict ? (r.accepted ? C.teal : C.red) : C.mid,
    );
  });
  foot(
    c,
    changed
      ? 'Only the p95 requirement moved. All measured values and both other requirements stayed fixed.'
      : 'Apply all three requirements. A higher token rate cannot buy extra milliseconds of p95.',
  );
}
