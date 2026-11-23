import {
  ink,
  muted,
  white,
  teal,
  blue,
  red,
  gold,
  hues,
  pale,
  mix,
  fixed,
  signed,
  cue,
  box,
  dot,
  line,
  arrow,
  txt,
  head,
  cap,
  band,
  rule,
  plot,
  marker,
  readout,
  tag,
} from './art.mjs';
import { sigmoid, prefLoss } from '../../../films/preference-alignment/arithmetic.mjs';
import {
  dpoExample,
  twoLogitTrace,
  alignmentTokenScores,
  alignmentReduction,
} from '../../../films/preference-alignment/model.mjs';
import { EXAMPLE } from '../../../films/preference-alignment/fixtures.mjs';
const worked = dpoExample();
export function reference(c, k) {
  const b = k.beat.beatIndex;
  head(
    c,
    b === 0 ? 'Both routes finish at the same policy score' : 'Which reply gained log probability?',
    'Log probability of each whole reply   /   Natural logs',
  );
  const X = (v) => 230 + (v + 4.2) * 445;
  [EXAMPLE.chosen, EXAMPLE.rejected].forEach((r, i) => {
    const y = 222 + i * 131,
      change = cue(k, 2, i ? 'B moved down' : 'A moved up');
    txt(c, i ? 'B  /  Entrance' : 'A  /  Station', 45, y + 6, 21, hues[i]);
    line(c, 214, y, 884, y, '#c6c7b9', 2);
    if (change) arrow(c, X(r.reference), y, X(r.policy), y, hues[i], 4);
    if (b >= 1) {
      dot(c, X(r.reference), y, 8, white);
      dot(c, X(r.reference), y, 4, hues[i]);
      txt(c, 'ref ' + fixed(r.reference, 1), X(r.reference), y - 26, 21, hues[i], 'center');
    }
    if (change) {
      txt(
        c,
        'change ' + signed(r.policy - r.reference, 1),
        (X(r.policy) + X(r.reference)) / 2,
        y + 43,
        19,
        muted,
        'center',
      );
    }
    marker(c, X(r.policy), y, hues[i]);
    txt(c, 'policy ' + fixed(r.policy, 1), X(r.policy), y - 52, 20, ink, 'center');
  });
  if (cue(k, 3, 'gives a margin of one'))
    txt(
      c,
      'Margin    ' +
        fixed(worked.chosenRatio, 1) +
        ' − (' +
        fixed(worked.rejectedRatio, 1) +
        ') = ' +
        fixed(worked.margin, 1),
      180,
      465,
      31,
      teal,
      'left',
      'Mono',
    );
}
export function probability(c, k) {
  const b = k.beat.beatIndex,
    m = cue(k, 1, 'use the route margin', 1.1) + 4 * cue(k, 3, 'margin rise from one to five', 1.6);
  const z = EXAMPLE.beta * m,
    p = sigmoid(z);
  head(c, 'Will A win the vote?', 'One comparison   /   β = 0.5');
  const { X, Y } = plot(c, {
    x: 73,
    y: 157,
    w: 530,
    h: 236,
    xmin: -3,
    xmax: 3,
    ymin: 0,
    ymax: 1,
    xticks: [-3, -2, -1, 0, 1, 2, 3],
    yticks: [0, 0.5, 1],
    fn: sigmoid,
  });
  line(c, X(z), Y(0), X(z), Y(p), gold, 2);
  marker(c, X(z), Y(p));
  txt(c, 'Scaled margin   βm = ' + fixed(z, 2), 170, 460, 22);
  readout(c, 'A WINS THE VOTE', fixed(100 * p, 1) + '%', 658, 175, teal, 40);
  if (b === 2) {
    readout(
      c,
      'GENERATE EXACT A',
      fixed(100 * Math.exp(EXAMPLE.chosen.policy), 1) + '%',
      658,
      325,
      blue,
    );
    txt(c, 'exp(−3.4)', 658, 409, 19, muted);
  }
}
export function loss(c, k) {
  const b = k.beat.beatIndex;
  let p = 0.5;
  if (cue(k, 1, 'worked margin of one')) p = worked.probability;
  if (cue(k, 2, 'put only eight percent')) p = 0.08;
  if (cue(k, 2, 'put ninety-five percent')) p = 0.95;
  head(c, 'How surprising was this vote?', 'Observed choice stays A over B   /   β = 0.5');
  const x = 69,
    w = 506,
    y = 226;
  cap(c, 'PREDICTED WINNER', x, 181);
  band(c, x, y, w, 80, [p, 1 - p], [teal, blue]);
  txt(c, 'A    ' + fixed(p * 100, 1) + '%', x, y + 125, 24, teal);
  txt(c, 'B    ' + fixed((1 - p) * 100, 1) + '%', x + w, y + 125, 24, blue, 'right');
  readout(c, 'LOSS ON A', fixed(-Math.log(p), 3), 650, 186, ink, 50);
  txt(c, '−ln(' + fixed(p, 3) + ')', 650, 294, 22);
  if (b >= 2) txt(c, 'Margin gradient   β(p − 1) = ' + signed(0.5 * (p - 1), 3), 69, 438, 27, teal);
}
const trace = twoLogitTrace();
export function update(c, k) {
  const b = k.beat.beatIndex,
    step = Math.round(cue(k, 2, 'recalculates the margin', 3) * 6),
    s = trace[step];
  head(
    c,
    'Make one reply more likely than the other',
    'Two complete replies   /   Equal reference logits   /   β = 0.5, step = 0.4',
  );
  const px = (v) => 490 + v * 300;
  for (const [i, name] of ['A  Station', 'B  Entrance'].entries()) {
    const y = 194 + i * 111;
    txt(c, name, 49, y + 8, 24, hues[i]);
    line(c, 210, y, 760, y, pale, 3);
    line(c, 490, y - 14, 490, y + 14, muted, 2);
    if (step) line(c, 490, y, px(s.logits[i]), y, hues[i], 9);
    marker(c, px(s.logits[i]), y, hues[i]);
    txt(c, 'logit  ' + signed(s.logits[i], 3), px(s.logits[i]), y - 26, 20, ink, 'center');
    if (b >= 1) txt(c, '∂L  ' + signed(s.gradient[i], 3), 777, y + 7, 20, ink, 'left', 'Mono');
  }
  band(c, 53, 395, 575, 32, s.probabilities);
  txt(c, 'P(A)   ' + fixed(s.probabilities[0], 3), 53, 462, 22, teal);
  txt(c, 'Update ' + step + '    Loss ' + fixed(s.loss, 3), 667, 420, 22);
}
export function tokenStrip(c, ids, selected, x, y, { step = 88, cell = 77, note = true } = {}) {
  ids.forEach((id, i) => {
    const col = selected[i] ? teal : '#d1d2c5';
    box(c, x + i * step, y, cell, 47, col, 3);
    txt(
      c,
      String(id),
      x + i * step + cell / 2,
      y + 32,
      25,
      selected[i] ? white : muted,
      'center',
      'Mono',
      600,
    );
    if (note)
      txt(
        c,
        i < 2 ? 'prompt' : i === 5 ? 'pad' : i === 4 ? 'EOS' : 'target',
        x + i * step + cell / 2,
        y + 70,
        14,
        muted,
        'center',
      );
  });
}
export function tokenScore(c, k) {
  const b = k.beat.beatIndex,
    boost = cue(k, 4, 'Increasing its two chosen observed logits'),
    excluded = cue(k, 5, "Raise A's prompt and padding logits");
  const t = alignmentTokenScores(boost, excluded * 1000);
  if (b < 2) {
    head(
      c,
      'Two different worked pairs',
      'Whole-response log probabilities   /   Subtract each reply’s own reference',
    );
    const vals = b
      ? [
          [-8.2, -8.5],
          [-9.5, -9.1],
        ]
      : [
          [EXAMPLE.chosen.policy, EXAMPLE.chosen.reference],
          [EXAMPLE.rejected.policy, EXAMPLE.rejected.reference],
        ];
    const beta = b ? 0.1 : 0.5,
      m = vals[0][0] - vals[0][1] - (vals[1][0] - vals[1][1]);
    ['Current policy', 'Frozen reference', 'Change'].forEach((s, i) =>
      cap(c, s, 300 + 214 * i, 162),
    );
    vals.forEach(([v, r], i) => {
      const y = 236 + i * 94;
      txt(c, b ? ['Ticket', 'Grant'][i] : ['Route A', 'Route B'][i], 58, y, 28, hues[i]);
      [fixed(v, 1), fixed(r, 1), signed(v - r, 1)].forEach((s, j) =>
        txt(c, s, 306 + j * 214, y, 29),
      );
    });
    txt(
      c,
      'Margin ' + fixed(m, 1) + '       β ' + beta + '       Loss ' + fixed(prefLoss(beta * m), 3),
      57,
      444,
      28,
    );
    return;
  }
  if (b === 2) {
    gather(c, k, t);
    return;
  }
  head(
    c,
    'Which targets enter the sequence score?',
    'Teacher forcing   /   Predictor row t − 1 supplies target t   /   EOS included',
  );
  txt(c, 'A', 53, 188, 26, teal);
  tokenStrip(c, t.fixture.chosenIds, t.selected, 108, 155);
  txt(c, 'B', 53, 304, 26, blue);
  tokenStrip(c, t.fixture.rejectedIds, t.selected, 108, 271);
  if (b >= 4) {
    txt(c, 'log p', 53, 251, 16, muted);
    t.chosenTerms.forEach((term, i) => {
      if (term !== null) txt(c, fixed(term, 3), 146.5 + i * 88, 251, 18, teal, 'center', 'Mono');
    });
    readout(c, 'SUM A', fixed(t.chosen, 3), 704, 156, teal, 30);
    readout(c, 'SUM B', fixed(t.rejected, 3), 704, 271, blue, 30);
    txt(c, 'Pair loss  ' + fixed(t.loss, 3), 64, 440, 28);
    txt(
      c,
      'Chosen logits   ' +
        fixed(t.fixture.chosenPolicy[1][1], 1) +
        ' and ' +
        fixed(t.fixture.chosenPolicy[2][2], 1),
      420,
      440,
      22,
    );
    const logits = t.fixture.chosenPolicy;
    txt(c, 'A prompt logit  ' + fixed(logits[0][2], 0), 420, 476, 18, muted);
    txt(c, 'A padding logit  ' + fixed(logits[4][0], 0), 663, 476, 18, muted);
  } else {
    txt(
      c,
      'Row 1   →   target 2       Row 2   →   target 3       Row 3   →   target 4',
      60,
      411,
      21,
    );
    txt(
      c,
      'log p(target) = observed logit − log sum exp(all vocabulary logits)',
      60,
      463,
      20,
      muted,
    );
  }
}
function gather(c, k, t) {
  head(
    c,
    'One target from each predictor row',
    'Chosen response   /   Vocabulary IDs 0 through 4   /   Teacher-forced log softmax',
  );
  const targets = t.fixture.chosenIds;
  cap(c, 'PREDICTOR', 54, 155);
  cap(c, 'LOGITS FOR ALL FIVE IDs', 265, 155);
  cap(c, 'GATHER log p', 735, 155);
  for (let row = 1; row <= 3; row++) {
    const target = targets[row + 1],
      y = 183 + (row - 1) * 74;
    txt(c, 'row ' + row + ' → ID ' + target, 55, y + 29, 20);
    t.fixture.chosenPolicy[row].forEach((v, id) => {
      const x = 263 + id * 79;
      box(c, x, y, 70, 44, id === target ? teal : white, 3);
      txt(c, fixed(v, 1), x + 35, y + 29, 20, id === target ? white : ink, 'center', 'Mono');
    });
    txt(c, fixed(t.chosenTerms[row + 1], 3), 743, y + 30, 24, teal, 'left', 'Mono');
  }
  txt(c, 'Sum of selected log probabilities', 54, 448, 23);
  txt(c, fixed(t.chosen, 3), 743, 449, 29, teal, 'left', 'Mono');
}
export function reduction(c, k) {
  const scoreCue = (first, last = first) => {
    if (k.beat.beatIndex !== 1) return Number(k.beat.beatIndex > 1);
    const start = k.wordCue(first).start;
    const end = k.wordCue(last).end;
    return k.reveal(first, end - start, { captionStart: false });
  };
  const useMean = cue(k, 1, 'Per-token averages') === 1;
  const sumMargin = scoreCue('The summed margin', 'positive point one') === 1;
  const meanMargin = scoreCue('giving negative', 'negative point zero five') === 1;
  const avg = scoreCue('Per-token averages', 'point one five');
  const revealed = [
    scoreCue('summed log ratio', 'point four') === 1,
    scoreCue('rejected two-token response', 'point three') === 1,
  ];
  const s = alignmentReduction(avg);
  head(
    c,
    'Can the scoring rule reverse the pair?',
    useMean
      ? 'Mean per completion   /   Divide by that reply’s target count'
      : 'Sum reference-relative log scores over each whole completion',
  );
  const left = 215, right = 864;
  const x = (score) => mix(left, right, score / 0.45);
  for (const [i, r] of s.rows.entries()) {
    const y = 148 + i * 69;
    txt(c, i ? 'Rejected' : 'Chosen', 53, y + 32, 22, hues[i]);
    for (let j = 0; j < r.count; j++) {
      box(c, 203 + j * 90, y, 81, 50, hues[i], 4);
      txt(c, fixed(r.contribution, 2), 244 + j * 90, y + 33, 20, white, 'center', 'Mono');
    }
    txt(c, useMean ? '÷ ' + r.count : 'sum', 601, y + 32, 23, muted);
    if (revealed[i] && (!useMean || avg === 1))
      txt(c, fixed(r.score, 2), 760, y + 34, 32, hues[i], 'left', 'Mono');
  }
  const rows = [323, 360];
  const sum = alignmentReduction();
  const label = useMean ? 'Per-token score' : 'Whole-completion score';
  txt(c, label, 54, 286, 17, muted);
  [0, 0.1, 0.2, 0.3, 0.4].forEach((tick) => {
    line(c, x(tick), 311, x(tick), 370, rule, 1);
    txt(c, fixed(tick, 1), x(tick), 301, 16, muted, 'center', 'Mono');
  });
  rows.forEach((y, i) => {
    line(c, left, y, right, y, rule, 1.2);
    txt(c, i ? 'Rejected' : 'Chosen', 54, y + 4, 18, hues[i]);
    if (!revealed[i]) return;
    if (useMean) dot(c, x(sum.rows[i].score), y, 3, muted);
    const at = x(s.rows[i].score);
    line(c, left, y, at, y, hues[i], 3);
    dot(c, at, y, 7, hues[i]);
  });
  if (meanMargin || (!useMean && sumMargin)) {
    const margin = fixed(s.rows[0].score, 2) + ' − ' + fixed(s.rows[1].score, 2) +
      ' = ' + signed(s.margin, 2);
    txt(c, 'Margin    ' + margin, 54, 408, 25, meanMargin ? red : teal);
  } else if (!useMean && !revealed[1]) {
    txt(c, 'Which reply ranks higher under the sum?', 54, 408, 23, ink);
  }
  if (!useMean && revealed[1])
    txt(c, 'Divide by each count. Which leads now?', 524, 408, 20, ink);
}
export function beta(c, k) {
  const b = k.beat.beatIndex;
  head(
    c,
    b < 3 ? 'A loss of ln 2 still has a slope' : 'Fit the same population vote with different β',
    b < 3
      ? 'One A-over-B vote   /   At equality: m = 0, z = βm, σ(z) = ½'
      : 'Two answers   /   Uniform reference   /   P(A wins) = ¾   /   Initial slopes at m = 0',
  );
  if (b < 3) {
    const { X, Y } = plot(c, {
      x: 93,
      y: 143,
      w: 466,
      h: 237,
      xmin: -3,
      xmax: 3,
      ymin: 0,
      ymax: 2,
      xticks: [-3, 0, 3],
      yticks: [0, 1, 2],
      fn: (m) => prefLoss(0.5 * m),
    });
    marker(c, X(0), Y(Math.log(2)));
    txt(c, 'Margin m   /   β = 0.5', 168, 453, 22);
    readout(c, 'LOSS AT EQUALITY', fixed(Math.log(2), 3), 627, 173);
    readout(c, 'SLOPE IN m', '−β / 2', 627, 302, teal);
  } else {
    ['β', 'Fitted margin', 'Ideal P(A)', 'Slope for one A vote'].forEach((s, i) =>
      cap(c, s, [54, 176, 400, 736][i], 158),
    );
    [0.1, 0.5, 1].forEach((v, i) => {
      const m = Math.log(3) / v,
        p = sigmoid(m),
        y = 212 + i * 84;
      txt(c, String(v), 55, y, 27);
      txt(c, fixed(m, 3), 184, y, 24);
      box(c, 402, y - 19, 174, 19, pale);
      box(c, 402, y - 19, 174 * p, 19, teal);
      txt(c, fixed(p * 100, i === 0 ? 3 : 1) + '%', 593, y, 19);
      txt(c, signed(-v / 2, 2), 757, y, 24, blue);
    });
    txt(
      c,
      b >= 6
        ? 'Near ln 2 after updates? Check gradients and changed weights.'
        : b === 4 && cue(k, 4, 'Average over the population')
          ? 'At m = 0, the population slope is β × (0.50 − 0.75) = −β / 4.'
          : 'Fitted comparison logit βm = ln 3 for all three rows.',
      54,
      455,
      23,
    );
  }
}
export function displacementState(q) {
  const ref = [-8.5, -9.1],
    start = [-8.2, -9.5],
    end = [-9.1, -11.2];
  const policy = start.map((a, i) => mix(a, end[i], q)),
    delta = policy.map((v, i) => v - ref[i]),
    margin = delta[0] - delta[1];
  return { policy, ref, delta, margin, loss: prefLoss(0.1 * margin) };
}
export function displacement(c, k) {
  const q = cue(k, 2, 'Its ticket log score is lower', 2.4),
    s = displacementState(q),
    b = k.beat.beatIndex;
  head(
    c,
    'Where did each reply move?',
    'P-7 request   /   Zero is each reply’s own frozen reference   /   β = 0.1',
  );
  const X = rule(c, 246, 883, 346, -2.5, 0.7, [-2, -1, 0, 0.5], (v) => signed(v, 1));
  line(c, X(0), 131, X(0), 337, muted, 2);
  for (let i = 0; i < 2; i++) {
    const y = 193 + i * 99,
      col = hues[i];
    txt(c, i ? 'B   Grant' : 'A   Ticket', 50, y - 12, 23, col);
    txt(c, fixed(s.policy[i], 2) + ' − (' + fixed(s.ref[i], 1) + ')', 50, y + 21, 16);
    line(c, X(0), y, X(s.delta[i]), y, col, 7);
    marker(c, X(s.delta[i]), y, col);
    txt(c, signed(s.delta[i], 2), X(s.delta[i]), y - 20, 22, col, 'center');
  }
  txt(c, 'Margin    ' + fixed(s.margin, 2), 51, 446, 29);
  if (b >= 3)
    txt(
      c,
      'Loss   ' + fixed(displacementState(0).loss, 3) + ' → ' + fixed(s.loss, 3),
      354,
      446,
      25,
    );
  if (b >= 4) tag(c, 'Ticket below reference', 681, 419, 230, red);
}
