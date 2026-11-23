import { ROUTER_LOGITS, EXPERT_OUTPUTS, CAPACITY_ROUTES } from '../../../films/moe/fixtures.mjs';
import { moeValidatedRoute, moeScalarGate, moeSelection } from '../../../films/moe/model.mjs';
import { queueExample } from '../../../films/moe/construction.mjs';
import {
  C,
  fmt,
  vec,
  expert,
  cue,
  ease,
  type,
  mono,
  rule,
  box,
  dot,
  arrow,
  path,
  alpha,
  board,
  foot,
  tag,
  chip,
  gridPlot,
} from './bench.mjs';

export const hidden = [1, 0, 0, 0],
  matrix = ROUTER_LOGITS.map((x) => [x, 0, 0, 0]);
export const router = moeValidatedRoute(hidden, matrix, 2);
const maxLogit = Math.max(...router.logits);
export const shiftedMasses = router.logits.map((score) => Math.exp(score - maxLogit));
export const massTotal = shiftedMasses.reduce((sum, mass) => sum + mass, 0);
// The article gives zero for the last two coordinates of both selected outputs.
export const selectedOutputs = router.selected.map((e) => [...EXPERT_OUTPUTS[e], 0, 0]);
export const layerUpdate = hidden.map((_, j) =>
  selectedOutputs.reduce((sum, v, i) => sum + router.weights[i] * v[j], 0),
);
export const t4 = queueExample(CAPACITY_ROUTES, 4, [0.6, 0.4], 1, true);
export const switches = [
  { token: 'return', ids: [0, 2] },
  { token: 'total', ids: [1, 7] },
];
export function rack(c, k) {
  const next = cue(k, 2, 'Here comes total', 0) > 0;
  const { token, ids } = switches[Number(next)];
  const travel = next ? cue(k, 2, 'It needs experts', 1.2) : cue(k, 0, 'Its router opens', 1.3);
  const run = next
    ? cue(k, 2, 'experts two and eight', 0.65)
    : cue(k, 1, 'Experts one and three', 0.65);
  const back = next ? cue(k, 2, 'Both were idle', 1) : cue(k, 1, 'Their weighted outputs meet', 1);
  board(c, 39, 119, 882, 291);
  type(c, 'Resident feed-forward networks', 65, 149, 20, C.chalk);
  type(c, '8 sockets', 890, 148, 16, C.faint, 'right');
  const inY = 194,
    outY = 348;
  tag(c, token, 62, inY - 16, 88, '#f2c381', C.ink);
  for (let i = 0; i < 8; i++) {
    const x = 70 + i * 104,
      cx = x + 36,
      selected = ids.includes(i);
    rule(c, cx, 224, cx, 246, C.seam, 2);
    rule(c, cx, 304, cx, 322, C.seam, 2);
    if (selected && travel > 0) {
      const input = [
        [150, inY],
        [cx === 106 ? 161 : cx, inY],
        ...(cx === 106
          ? [
              [161, 214],
              [cx, 214],
            ]
          : []),
        [cx, 246],
      ];
      const p = path(c, input, C.brass, 4, ease(travel));
      if (travel < 1) dot(c, ...p, 4, C.chalk);
      if (back)
        path(
          c,
          [
            [cx, 303],
            [cx, outY],
            [831, outY],
          ],
          C.ice,
          3,
          ease(back),
        );
    }
    chip(c, x, 245, 72, 60, expert(i), selected && travel === 1 && run > 0);
  }
  alpha(c, back, () => tag(c, 'Σ', 831, outY - 15, 53, C.ice, C.ink));
  mono(c, back ? 'weighted return to ' + token : 'input vector  x', 74, 383, 17, C.faint);
  if (next) mono(c, 'previous: return → E1 + E3', 890, 383, 16, C.faint, 'right');
  foot(
    c,
    next
      ? run
        ? 'Two different sockets run for total. All eight sets of weights still have a home.'
        : 'Trace the new token across the same eight resident networks.'
      : back
        ? 'Six expert networks sit idle for return. Which will the next word need?'
        : 'Follow one hidden vector along its two selected routes.',
  );
}
export function layer(c, k) {
  const mix = cue(k, 0, 'Attention mixes', 1),
    open = cue(k, 1, 'Open the feed-forward part', 0.85);
  const selected = cue(k, 1, 'router chooses', 1),
    back = cue(k, 2, 'Combine the selected outputs', 0.9);
  type(c, 'Positions', 53, 137, 20, C.mid);
  const words = ['def', 'total', 'return'];
  const py = (i) => 202 + i * 73;
  words.forEach((w, i) => {
    tag(c, w, 47, py(i) - 17, 94, i === 2 ? C.rust : C.board);
    rule(c, 141, py(i), 206, py(i), C.rule, 2);
  });
  board(c, 207, 164, 140, 229);
  type(c, 'Attention', 277, 190, 20, C.chalk, 'center');
  for (let i = 0; i < 3; i++)
    for (let j = i; j < 3; j++) {
      path(
        c,
        [
          [226, 226 + 52 * i],
          [325, 226 + 52 * j],
        ],
        j === 2 && mix ? C.brass : C.seam,
        j === 2 ? 2 : 1,
      );
    }
  for (let i = 0; i < 3; i++) {
    dot(c, 226, 226 + 52 * i, 4, C.faint);
    dot(c, 325, 226 + 52 * i, 4, i === 2 ? C.brass : C.faint);
  }
  const y = 332;
  arrow(c, 347, y, 425, y, C.teal, 3);
  path(
    c,
    [
      [377, y],
      [377, 417],
      [873, 417],
      [873, y + 20],
    ],
    C.mid,
    2,
  );
  type(c, 'residual', 673, 407, 16, C.mid, 'center');
  if (!open) {
    board(c, 434, 260, 288, 112);
    type(c, 'One dense FFN', 578, 301, 26, C.chalk, 'center', 'Serif');
    type(c, 'Same weights at each position', 578, 343, 16, C.faint, 'center');
    arrow(c, 723, y, 853, y, C.teal);
  } else {
    tag(c, 'router', 412, y - 16, 90);
    for (let i = 0; i < 4; i++) {
      const top = 120 + i * 68,
        use = selected && router.selected.includes(i);
      path(
        c,
        [
          [502, y],
          [526 + i * 5, y],
          [526 + i * 5, top + 27],
          [590, top + 27],
        ],
        use ? C.rust : C.rule,
        use ? 2.8 : 1,
      );
      chip(c, 592, top, 80, 54, expert(i), use);
      if (use)
        path(
          c,
          [
            [673, top + 27],
            [725 + i * 14, top + 27],
            [725 + i * 14, y],
            [788, y],
          ],
          C.teal,
          2.5,
          back,
        );
    }
    if (back) {
      mono(c, 'Σ', 800, y, 24, C.teal, 'center');
      arrow(c, 820, y, 852, y);
    }
  }
  dot(c, 873, y, 16, C.board);
  mono(c, '+', 873, y, 20, C.chalk, 'center');
  foot(
    c,
    back
      ? 'A different token or layer can choose different FFNs.'
      : open
        ? 'The router selects feed-forward functions for one position.'
        : 'Shared attention mixes information from accessible positions.',
  );
}
export function scores(c, k) {
  const project = cue(k, 0, 'first column', 0.5),
    mass = cue(k, 1, 'then exponentiate', 0),
    divided = cue(k, 1, "Expert one's share", 0);
  const values = divided ? router.probabilities : mass ? shiftedMasses : router.logits;
  board(c, 42, 123, 393, 273);
  mono(c, 'x = ' + vec(hidden), 66, 154, 19, C.chalk);
  type(c, 'Router matrix', 67, 205, 18, C.faint);
  box(c, 77, 222, 79, 155, '#506458', null, 3);
  matrix.forEach((row, i) =>
    row.forEach((w, j) =>
      mono(c, fmt(w), 116 + j * 80, 244 + i * 39, 19, j === 0 ? C.brass : C.faint, 'center'),
    ),
  );
  type(
    c,
    divided ? 'Softmax probability' : mass ? 'Shifted exponential mass' : 'Raw logit',
    487,
    146,
    22,
  );
  for (let i = 0; i < 4; i++) {
    const y = 200 + i * 52,
      val = values[i],
      zero = mass ? 552 : 811;
    mono(c, expert(i), 487, y, 20);
    rule(c, 550, y + 14, 812, y + 14, C.rule);
    if (project) {
      const width = Math.abs(val) * (mass ? 260 : 77);
      box(
        c,
        mass ? zero : zero - width,
        y - 9,
        width,
        18,
        divided ? C.teal : mass ? C.rust : C.plum,
        null,
        2,
      );
      mono(c, fmt(val), 910, y, 18, C.ink, 'right');
    }
  }
  const study = cue(k, 2, 'Compare matched prompts', 0.4);
  foot(
    c,
    study
      ? 'One token gives a ranking. A specialty claim needs matched prompts and an expert intervention.'
      : divided
        ? 'Probability = mass ÷ total mass. For E1, 1 ÷ ' +
          fmt(massTotal) +
          ' ≈ ' +
          fmt(router.probabilities[0]) +
          '.'
        : mass
          ? 'Mass = exp(score − max). For E1, exp(0) = 1. Total mass ≈ ' + fmt(massTotal) + '.'
          : 'One nonzero coordinate picks out one column of the learned matrix.',
  );
}
export function blend(c, k) {
  const keep = cue(k, 0, 'Keep experts one and three', 0.45);
  const normalize = cue(k, 1, 'Divide each surviving probability', 0.7);
  const result = cue(k, 2, 'The last two stay zero', 0);
  type(c, 'All four probabilities', 50, 133, 22);
  router.probabilities.forEach((p, i) => {
    const y = 192 + i * 52,
      s = router.selected.includes(i);
    mono(c, expert(i), 50, y, 19);
    box(c, 101, y - 10, (253 * p) / 0.6, 20, s && keep ? C.teal : '#9eada1');
    mono(c, fmt(p), 389, y, 18, C.ink, 'right');
  });
  board(c, 438, 116, 479, 279);
  type(c, normalize ? 'Selected weights' : 'Selected probability mass', 463, 151, 21, C.chalk);
  const w = 399,
    x = 475,
    y = 226;
  box(c, x, y, w, 47, '#192b29', C.seam, 3);
  let offset = 0;
  if (keep)
    router.selected.forEach((e, i) => {
      const p = normalize ? router.weights[i] : router.probabilities[e];
      const wid = p * w;
      box(c, x + offset, y, wid, 47, i ? C.brass : C.ice);
      mono(c, expert(e), x + offset + wid / 2, y + 24, 18, C.ink, 'center');
      offset += wid;
    });
  mono(c, '0', x, y + 63, 15, C.faint);
  mono(c, '1', x + w, y + 63, 15, C.faint, 'right');
  mono(
    c,
    normalize
      ? router.weights.map((n) => fmt(n, 6)).join('  +  ')
      : keep
        ? 'retained ≈ ' + fmt(router.selectedMass)
        : 'retained mass = ?',
    x,
    343,
    21,
    C.chalk,
  );
  if (k.beat.beatIndex === 2) {
    type(c, 'First 2 of ' + hidden.length + ' output coordinates', 50, 418, 20, C.teal);
    type(c, 'Coordinates 3 and 4 are zero in both expert outputs.', 438, 418, 17, C.mid);
  }
  foot(
    c,
    result
      ? '(' +
          router.weights
            .map((n, i) => fmt(n, 6) + ' × ' + vec(selectedOutputs[i].slice(0, 2)))
            .join(') + (') +
          ') ≈ ' +
          vec(layerUpdate.slice(0, 2))
      : k.beat.beatIndex === 2
        ? 'E1 starts with ' +
          vec(selectedOutputs[0].slice(0, 2)) +
          ' and E3 starts with ' +
          vec(selectedOutputs[1].slice(0, 2)) +
          '. Apply their selected weights.'
        : normalize
          ? 'Each selected probability is divided by the unrounded selected mass.'
          : 'Keep the two largest probabilities. Their mass occupies only part of the unit interval.',
  );
}
export function vector(c, k) {
  const rise = cue(k, 1, 'Four tenths of three', 0.9),
    right = cue(k, 2, 'Slide the tip', 1.25);
  board(c, 43, 130, 376, 267);
  type(c, 'Token t4', 67, 170, 30, C.chalk, 'left', 'Serif');
  type(c, '2D example', 395, 170, 17, C.faint, 'right');
  type(c, 'Selected gate × expert output', 67, 216, 18, C.faint);
  t4.terms
    .slice()
    .reverse()
    .forEach((term, i) => {
      const y = 280 + i * 64;
      mono(c, expert(term.expert), 69, y, 21, i ? C.ice : C.brass);
      mono(c, fmt(term.gate) + ' × ' + vec(term.vector), 133, y, 22, C.chalk);
    });
  const x = 545,
    y = 377,
    unit = 135;
  gridPlot(c, x, y, unit, 2.4, 1.7);
  const endX = t4.output[0] * ease(right),
    endY = t4.output[1] * ease(rise);
  const u = x + unit * endX,
    v = y - unit * endY;
  if (rise > 0) arrow(c, x, y, x, v, C.rust, 5, 12);
  if (right > 0) {
    rule(c, x, y, u, v, '#7a8880', 1.4);
    arrow(c, x, v, u, v, C.teal, 5, 12);
  }
  dot(c, u, v, 5, C.ink);
  if (rise > 0) mono(c, vec([endX, endY]), u + 8, v - 20, 17, C.ink);
  foot(
    c,
    right === 1
      ? 'The routed update goes from the origin to ' +
          vec(t4.output) +
          '. The residual is added afterward.'
      : right
        ? 'Trace the first coordinate while the height stays fixed.'
        : rise === 1
          ? 'The tip is 1.2 units high. Predict its next position.'
          : 'Both expert outputs use the same coordinate axes.',
  );
}
export const scalar = [moeScalarGate(0.75), moeScalarGate(0.75, true)];
export function gate(c, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    board(c, 43, 142, 871, 216);
    type(c, 'Mixtral  ·  one MoE layer', 70, 180, 25, C.chalk);
    for (let i = 0; i < 8; i++)
      chip(c, 80 + i * 104, 232, 67, 65, expert(i), router.selected.includes(i));
    foot(c, 'Eight expert FFNs remain available. Two receive this hidden state.');
    return;
  }
  const fixed = cue(k, 1, 'The output is one and a half', 0.4),
    challenge = cue(k, 2, 'divide the sole gate', 0.4),
    answer = cue(k, 3, 'The normalized gate stays one', 0.4);
  const nudge = cue(k, 3, 'Raise the probability', 0.85),
    probability = 0.75 + 0.05 * ease(nudge);
  for (let i = 0; i < 2; i++) {
    const x = 43 + 452 * i;
    if (i && !challenge) continue;
    board(c, x, 135, 424, 262);
    type(c, i ? 'Normalize the sole gate' : 'Retain the softmax gate', x + 23, 170, 22, C.chalk);
    mono(c, i ? 'g = p / p' : 'g = p', x + 25, 221, 24, C.brass);
    type(c, 'Expert returns 2   ·   p = ' + fmt(probability, 3), x + 25, 263, 18, C.faint);
    if ((i ? answer : fixed) > 0) {
      const out = moeScalarGate(probability, Boolean(i)).output;
      box(c, x + 25, 309, 145 * out, 23, i ? C.brass : C.ice);
      mono(c, 'y = ' + fmt(out), x + 25, 363, 24, C.chalk);
    }
  }
  foot(
    c,
    answer
      ? 'Fixed expert ID and fixed expert output: local dy/dp is 2 on the left and 0 on the right.'
      : challenge
        ? 'Keep the winning expert fixed. What happens when p moves a little?'
        : 'The selected probability still carries a task gradient into the router.',
  );
}
export const bias = moeSelection();
export function family(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    type(c, 'Mixtral', 47, 135, 24);
    type(c, 'DeepSeek-V2', 482, 135, 24);
    for (let i = 0; i < 8; i++)
      chip(
        c,
        56 + (i % 4) * 91,
        202 + Math.floor(i / 4) * 80,
        57,
        52,
        expert(i),
        [0, 2].includes(i),
      );
    for (let i = 0; i < 160; i++)
      box(
        c,
        486 + (i % 20) * 18,
        193 + Math.floor(i / 20) * 18,
        14,
        14,
        [0, 9, 41, 65, 106, 157].includes(i) ? C.rust : '#b4bfb2',
      );
    tag(c, 'shared', 486, 358, 91, C.plum);
    tag(c, 'shared', 592, 358, 91, C.plum);
    foot(c, 'Per MoE layer: 2 of 8 routed  |  6 of 160 routed + 2 shared. Expert widths differ.');
    return;
  }
  if (b < 3) {
    const corrected = cue(k, 1, 'Add the load bias', 0.5),
      winner = cue(k, 2, 'Experts three and one win', 0.4);
    type(c, 'V3-style toy router', 48, 123, 21);
    const xs = [66, 237, 441, 655, 815];
    ['Expert', 'Affinity', 'Load bias', 'Pick by', 'Blend with'].forEach((v, i) =>
      type(c, v, xs[i], 174, 17, C.mid),
    );
    bias.affinities.forEach((a, i) => {
      const y = 230 + 58 * i,
        idx = bias.ids.indexOf(i);
      if (winner && idx >= 0) box(c, 45, y - 21, 873, 42, '#d2e4d8', null, 3);
      [
        expert(i),
        fmt(a),
        corrected ? '+' + fmt(bias.bias[i]) : '·',
        corrected ? fmt(bias.scores[i]) : '·',
        winner ? (idx >= 0 ? fmt(bias.weights[idx]) : 'skip') : '?',
      ].forEach((v, j) => mono(c, v, xs[j], y, 21, j === 4 ? C.teal : C.ink));
    });
    foot(
      c,
      winner
        ? 'Gather original affinities for the winners, normalize, then apply the routed scale.'
        : 'Three initial dense layers precede V3’s routed layers: 8 of 256 routed experts + 1 shared.',
    );
    return;
  }
  const examples = [
    ['GLM-5.3', 'dense', 'dense', 'dense', 'learned', 'Routed scale × 2.5'],
    ['V4 Flash 0731', 'hash', 'hash', 'hash', 'learned', 'Token ID selects early routes'],
    ['Qwen3.6-35B-A3B', 'mixer', '+', 'sparse', 'FFN', 'Sequence state + expert pool'],
  ];
  examples.forEach(([name, ...cells], i) => {
    const y = 175 + i * 84;
    type(c, name, 46, y, 21);
    const note = cells.pop();
    cells.forEach((t, j) => tag(c, t, 264 + j * 81, y - 15, 73, t === 'hash' ? C.plum : C.board));
    type(c, note, 607, y, 18);
  });
  foot(c, 'Read the exact checkpoint configuration before estimating compute, state or residency.');
}
