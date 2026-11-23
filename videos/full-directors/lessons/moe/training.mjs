import { CHOICE_SCORES, SKEW_COUNTS } from '../../../films/moe/fixtures.mjs';
import { moePacked, moeChoice, moeBalance, moeZ } from '../../../films/moe/model.mjs';
import {
  C,
  fmt,
  vec,
  expert,
  cue,
  ease,
  mix,
  type,
  mono,
  rule,
  box,
  dot,
  path,
  board,
  foot,
} from './bench.mjs';

export const packed = moePacked(),
  choice = moeChoice(),
  balance = moeBalance();
export const counterRows = [
  [0.51, 0.09, 0.4],
  [0.09, 0.51, 0.4],
];
const winners = counterRows.map((row) => row.indexOf(Math.max(...row)));
export const counter = moeBalance(
  counterRows[0].map((_, e) => winners.filter((w) => w === e).length / winners.length),
  counterRows[0].map((_, e) => counterRows.reduce((n, r) => n + r[e], 0) / counterRows.length),
);
export function pack(c, k) {
  const order = cue(k, 1, 'Group the rows', 1.4),
    returns = cue(k, 2, 'Multiply each return', 0.6);
  const sum = cue(k, 3, 'Those are the two coordinates', 0);
  type(c, k.beat.beatIndex < 2 ? 'Original assignments' : 'Packed expert rows', 42, 122, 21);
  const pos = (i) => 173 + 47 * i;
  if (k.beat.beatIndex < 2) {
    type(c, 'Grouped by expert', 574, 122, 21);
    const label = (row, x, y, active) => {
      box(
        c,
        x,
        y - 16,
        327,
        32,
        active ? (row.token === 0 ? C.board : '#ced7ca') : '#e2e4d7',
        null,
        4,
      );
      const color = active && row.token === 0 ? C.chalk : C.ink;
      mono(c, 't' + row.token, x + 17, y, 17, color);
      mono(c, 'E' + row.expert, x + 98, y, 17, color);
      mono(c, 'gate ' + fmt(row.gate), x + 170, y, 17, color);
    };
    packed.packed.forEach((row, i) => {
      const y = pos(row.index),
        out = pos(i);
      label(row, 46, y, true);
      box(c, 571, out - 16, 327, 32, '#e2e4d7', C.rule, 4);
      if (order) {
        const route = [
          [374, y],
          [405, y],
          [536, out],
          [571, out],
        ];
        const tip = path(
          c,
          route,
          row.token === 0 ? C.rust : '#97a69a',
          row.token === 0 ? 2 : 1,
          ease(order),
        );
        if (order < 1) dot(c, ...tip, 3, C.rust);
        else label(row, 571, out, true);
      }
    });
    foot(c, 'Each row keeps its address and gate. In this fixture the expert IDs start at E0.');
    return;
  }
  packed.packed.forEach((row, i) => {
    const y = pos(i),
      x = 108;
    const track = row.token === 0;
    box(c, x, y - 17, 334, 34, track ? C.board : '#d0d7cb', null, 4);
    mono(c, 't' + row.token, x + 16, y, 17, track ? C.brass : C.mid);
    mono(c, 'E' + row.expert, x + 95, y, 17, track ? C.chalk : C.mid);
    mono(c, 'gate ' + fmt(row.gate), x + 171, y, 17, track ? C.chalk : C.mid);
    if (order === 1 && track)
      path(
        c,
        [
          [x + 334, y],
          [464, y],
          [482, y + 12],
          [506, y + 12],
        ],
        C.rust,
        2,
      );
  });
  board(c, 504, 145, 411, 265);
  type(c, 'Token address 0', 528, 178, 22, C.chalk);
  mono(c, 'x = [1, 2]', 529, 216, 21, C.brass);
  const rows = packed.packed.filter((r) => r.token === 0);
  rows.forEach((r, i) => {
    const y = 267 + i * 49;
    const term = returns ? vec(r.contribution) : ['negate x', 'halve x'][i];
    mono(c, 'E' + r.expert, 529, y, 18, C.faint);
    mono(
      c,
      returns ? fmt(r.gate) + ' × ' + vec(r.expertOutput) + ' = ' + term : term,
      574,
      y,
      returns ? 15 : 19,
      C.chalk,
    );
  });
  rule(c, 528, 346, 890, 346, C.seam);
  mono(c, sum ? 'Σ  ' + vec(packed.outputs[0]) : 'Σ  ?', 529, 377, 23, sum ? C.ice : C.faint);
  foot(
    c,
    sum
      ? 'One gate per return. Add at the token address even when the expert groups reorder the rows.'
      : returns
        ? 'Add the two signed contributions coordinate by coordinate. What vector belongs at address zero?'
        : order === 1
          ? 'Expert IDs in this packing fixture are numbered from zero. Both highlighted rows belong to t0.'
          : 'Every assignment carries a token address, an expert ID and a gate.',
  );
}
const prefixTokens = [
  { id: 'earlier', p: 0.6 },
  { id: 'future', p: 0.9 },
];
export const prefixWinner = (n) =>
  prefixTokens.slice(0, n).reduce((best, t) => (t.p > best.p ? t : best));
export function buckets(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const close = cue(k, 1, 'Token four gets zero', 0.55);
    board(c, 46, 119, 870, 287);
    const xs = Array.from({ length: 5 }, (_, i) => 232 + 142 * i);
    xs.forEach((x, t) => mono(c, 't' + t, x, 155, 20, C.chalk, 'center'));
    CHOICE_SCORES.forEach((row, e) => {
      const y = 206 + 54 * e;
      mono(c, expert(e), 85, y, 22, C.chalk);
      row.forEach((v, t) => {
        const active = close && choice.buckets[e].includes(t);
        box(c, xs[t] - 44, y - 18, 88, 36, active ? C.brass : '#3c524b', null, 5);
        mono(c, fmt(v, 2), xs[t], y, 20, active ? C.ink : C.chalk, 'center');
      });
    });
    if (close) {
      type(c, 'Returns', 79, 366, 18, C.faint);
      choice.coverage.forEach((v, t) => mono(c, v, xs[t], 366, 24, v ? C.ice : C.brass, 'center'));
    }
    foot(
      c,
      close
        ? 'Every row selected two tokens. Read the zero beneath t4.'
        : 'Each expert row has two slots. Mark the two largest scores in each row.',
    );
    return;
  }
  let future = b > 2;
  if (b === 2) {
    const phrase = 'future token scoring point nine';
    const { start, end } = k.wordCue(phrase);
    future = k.reveal(phrase, end - start, {
      captionStart: 'a future token scoring point nine',
    }) === 1;
  }
  let displaced = false;
  let move = 0;
  if (b === 3) {
    const phrase = 'The future token takes the slot';
    const { start, end } = k.wordCue(phrase);
    displaced = k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    const elapsed = Math.max(0, k.elapsed - end);
    move = displaced ? ease(Math.min(1, elapsed / 0.9)) : 0;
  }
  const previous = prefixWinner(1);
  const replacement = prefixWinner(2);
  type(c, 'Scores available to one expert', 51, 136, 22);
  prefixTokens.slice(0, future ? 2 : 1).forEach((t, i) => {
    const y = 223 + i * 89;
    mono(c, t.id, 52, y, 19);
    box(c, 161, y - 11, t.p * 310, 22, i ? C.rust : C.teal);
    mono(c, fmt(t.p), 470, y, 20);
  });
  board(c, 572, 156, 332, 173);
  type(c, 'One expert slot', 604, 196, 24, C.chalk);
  box(c, 602, 222, 236, 62, C.board2, C.seam, 7);
  const token = (t, x, y, color) => {
    box(c, x, y, 216, 42, color, null, 5);
    mono(c, t.id + '  ·  ' + fmt(t.p), x + 108, y + 21, 22, C.ink, 'center');
  };
  const exit = Math.min(1, move * 2);
  token(previous, 612, mix(232, 330, exit), C.ice);
  if (move > 0) {
    const enter = Math.max(0, 2 * move - 1);
    const route = [[511, 312], [555, 312], [555, 253], [612, 253]];
    const end = path(c, route, C.rust, 3, enter);
    if (enter < 1) dot(c, end[0], end[1], 6, C.rust);
    else token(replacement, 612, 232, C.brass);
  }
  if (exit === 1)
    type(c, 'Earlier token: no expert output', 612, 389, 20, C.teal);
  else if (future && !displaced)
    type(c, 'Which token keeps the slot?', 612, 366, 22, C.ink);
  rule(c, 40, 414, 920, 414, C.rule);
  type(
    c,
    exit === 1
      ? 'Earlier is still at ' + fmt(previous.p) + '. Batch selection changed the route.'
      : 'The earlier hidden state and score stay fixed.',
    42,
    435,
    19,
  );
}
export function training(c, k) {
  const assigned = cue(k, 0, 'This top-one batch', 1.1),
    collect = cue(k, 1, 'Collect the task-gradient', 1.15),
    later = cue(k, 2, 'In later batches', 0.55);
  type(c, 'One top-one batch  ·  20 tokens', 49, 130, 22);
  const rows = SKEW_COUNTS.map((n) => Math.floor(n * assigned + 1e-8));
  rows.forEach((n, i) => {
    const y = 196 + i * 58;
    mono(c, expert(i), 52, y, 22);
    for (let j = 0; j < n; j++) {
      box(c, 113 + j * 31, y - 13, 25, 26, i === 0 ? C.teal : '#7d9182', null, 4);
      if (j < Math.floor(n * collect + 1e-8)) {
        rule(c, 119 + j * 31, y, 131 + j * 31, y, C.chalk, 1.5);
        rule(c, 125 + j * 31, y - 6, 125 + j * 31, y + 6, C.chalk, 1.5);
      }
    }
    mono(c, n + (n === 1 ? ' row' : ' rows'), 534, y, 19);
  });
  rule(c, 646, 154, 646, 409, C.rule);
  type(c, collect ? 'Gradient terms' : 'Assignments', 670, 175, 20, C.mid);
  mono(
    c,
    collect
      ? rows.reduce((a, n) => a + Math.floor(n * collect + 1e-8), 0)
      : rows.reduce((a, n) => a + n, 0),
    670,
    243,
    49,
    C.teal,
  );
  if (later) {
    type(c, 'Next batch', 670, 315, 23);
    type(c, 'Compare routes and', 670, 353, 17);
    type(c, 'held-out predictions.', 670, 379, 17);
  }
  foot(
    c,
    collect
      ? 'Each + marks one example contributing to an expert gradient. Its magnitude can vary.'
      : 'Count the examples that reach each network.',
  );
}
export function balancing(c, k) {
  const b = k.beat.beatIndex;
  const testReference = cue(k, 2, 'Can the score fall', 0);
  if (!testReference) {
    const products = cue(k, 0, 'Their product grows', 0.6),
      total = cue(k, 1, 'The score is', 0.6);
    type(c, 'Switch top-one batch', 50, 125, 21);
    const x0 = 81,
      y = 325,
      scale = 233;
    balance.f.forEach((f, i) => {
      const x = x0 + i * 216,
        p = balance.p[i];
      rule(c, x, y, x + 162, y, C.rule);
      rule(c, x, y, x, y - 148, C.rule);
      if (products) box(c, x, y - p * scale, f * scale, p * scale, i === 0 ? C.teal : '#769384');
      mono(c, expert(i), x, 169, 20);
      mono(c, 'f ' + fmt(f) + '  p ' + fmt(p), x, y + 30, 16);
      if (products) mono(c, 'f·p = ' + fmt(balance.products[i], 4), x, y + 62, 17, C.teal);
    });
    foot(
      c,
      total
        ? '4 × ' +
            fmt(balance.sum, 4) +
            ' = ' +
            fmt(balance.score) +
            ' before α. Uniform routing gives 1.'
        : 'Width = fraction assigned. Height = mean probability. Area = their product.',
    );
    return;
  }
  const answer = cue(k, 3, 'Its frequency is zero', 0.5);
  type(c, 'Two tokens, three experts', 49, 134, 22);
  const xs = [287, 469, 651];
  xs.forEach((x, i) => mono(c, expert(i), x, 191, 20, C.ink, 'center'));
  counterRows.forEach((row, i) => {
    const y = 244 + i * 56;
    mono(c, 't' + i, 99, y, 21);
    row.forEach((p, j) => {
      const wins = b === 3 && p === Math.max(...row);
      box(c, xs[j] - 61, y - 19, 122, 38, wins ? C.teal : '#d6dacd', null, 5);
      mono(c, fmt(p), xs[j], y, 20, wins ? C.chalk : C.ink, 'center');
    });
  });
  if (answer) {
    type(c, 'Fraction won', 53, 366, 18);
    counter.f.forEach((f, i) => mono(c, fmt(f), xs[i], 366, 21, C.ink, 'center'));
  }
  foot(
    c,
    answer
      ? '3 × (0.5 × 0.3 + 0.5 × 0.3 + 0 × 0.4) = ' +
          fmt(counter.score) +
          '. The third expert wins no rows.'
      : 'Each token takes the maximum in its own row. Compare that decision with the uniform reference.',
  );
}
export function partition(c, k) {
  const move = cue(k, 1, 'Both masses gain', 1.4);
  const z = moeZ(3 * ease(move));
  board(c, 43, 135, 423, 259);
  type(c, 'Logits', 69, 169, 21, C.chalk);
  z.logits.forEach((v, i) => {
    const y = 232 + 66 * i;
    mono(c, expert(i), 68, y, 19, C.faint);
    const axis = 221;
    rule(c, axis, y - 17, axis, y + 17, C.faint);
    box(c, v < 0 ? axis + v * 40 : axis, y - 8, Math.max(0.1, Math.abs(v) * 40), 16, C.brass);
    mono(c, fmt(v, 2), 435, y, 18, C.chalk, 'right');
  });
  mono(c, 'common shift  +' + fmt(3 * ease(move), 2), 69, 359, 19, C.ice);
  type(c, 'Softmax shares', 512, 164, 22);
  let x = 515;
  z.p.forEach((p, i) => {
    const w = p * 365;
    box(c, x, 204, w, 52, i ? C.rust : C.teal);
    mono(c, fmt(p), x + w / 2, 230, 21, C.chalk, 'center');
    x += w;
  });
  mono(c, 'log Σ exp(z)  = ' + fmt(z.partition, 2), 516, 306, 22);
  mono(c, 'z-loss        = ' + fmt(z.loss, 2), 516, 360, 22);
  foot(
    c,
    move === 1
      ? 'The chosen expert stays the same. Squaring the shifted log partition gives 9.'
      : 'The same offset is applied to both logits. Compare their shares with the log partition.',
  );
}
