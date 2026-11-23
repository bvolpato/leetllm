import {
  ink,
  muted,
  white,
  teal,
  blue,
  red,
  gold,
  pale,
  hues,
  fixed,
  signed,
  cue,
  box,
  path,
  line,
  arrow,
  txt,
  head,
  cap,
  rule,
  plot,
  marker,
  readout,
  slip,
} from './art.mjs';
import { prefLoss, sigmoid } from '../../../films/preference-alignment/arithmetic.mjs';
import { alignmentGroup, alignmentClipping } from '../../../films/preference-alignment/model.mjs';
export function ipoState(m, tau = 0.1) {
  const target = 1 / (2 * tau);
  return { target, m, loss: (m - target) ** 2, slope: 2 * (m - target) };
}
const comparisonBeta = 0.1;
export function twoReplyPolicy(m) {
  const a = sigmoid(m);
  const b = sigmoid(-m);
  const kl = a * Math.log(2 * a) + b * Math.log(2 * b);
  return { m, a, b, kl, ipoLoss: ipoState(m).loss, dpoLoss: prefLoss(comparisonBeta * m) };
}
function concentration(c, k) {
  head(
    c,
    'How rare can B get when forward KL is bounded?',
    'Only A and B   /   Reference = (0.5, 0.5)   /   Log-odds margin m = ln[P(A) / P(B)]',
  );
  txt(c, 'Margin', 50, 158, 21);
  txt(c, 'P(A) = σ(m)', 157, 158, 21, teal);
  txt(c, 'P(B)', 387, 158, 21, blue, 'right');
  txt(c, 'Forward KL', 433, 158, 21);
  txt(c, 'IPO loss', 733, 158, 21, ink, 'center');
  txt(c, 'DPO loss', 856, 158, 21, ink, 'center');
  txt(c, 'nats', 433, 184, 16, muted);
  txt(c, 'ln 2 ≈ ' + fixed(Math.LN2, 6), 631, 184, 16, muted, 'right');
  txt(c, 'τ = 0.1', 733, 184, 16, muted, 'center');
  txt(c, 'β = ' + comparisonBeta, 856, 184, 16, muted, 'center');
  const margins = [0];
  if (cue(k, 2, 'Raise the margin to five'))
    margins.push(5 * cue(k, 2, 'Raise the margin to five', 1.2));
  if (cue(k, 2, 'Raise it to ten')) margins.push(5 + 5 * cue(k, 2, 'Raise it to ten', 1.2));

  margins.forEach((m, index) => {
    const s = twoReplyPolicy(m);
    const y = 214 + index * 91;
    txt(c, fixed(m, Number.isInteger(m) ? 0 : 2), 50, y + 22, 28, ink, 'left', 'Mono');
    box(c, 157, y, 230, 17, blue);
    box(c, 157, y, 230 * s.a, 17, teal);
    txt(c, fixed(s.a, 6), 157, y + 44, 18, teal, 'left', 'Mono');
    txt(c, fixed(s.b, 6), 387, y + 44, 18, blue, 'right', 'Mono');
    box(c, 433, y, 198, 17, pale);
    box(c, 433, y, (198 * s.kl) / Math.LN2, 17, ink);
    line(c, 631, y - 5, 631, y + 22, muted, 2);
    txt(c, fixed(s.kl, 6), 433, y + 44, 18, ink, 'left', 'Mono');
    txt(c, fixed(s.ipoLoss, 2), 733, y + 23, 24, ink, 'center', 'Mono');
    txt(c, fixed(s.dpoLoss, 3), 856, y + 23, 24, ink, 'center', 'Mono');
  });
  txt(c, 'KL(π || ref) = P(A) ln[2P(A)] + P(B) ln[2P(B)]', 50, 494, 22);
}
export function ipo(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    concentration(c, k);
    return;
  }
  let m = 0;
  if (b === 1) {
    m = 4 * cue(k, 1, 'up toward five', 1.5);
    if (cue(k, 1, 'Start a second trial')) m = 7 - 2 * cue(k, 1, 'back toward five', 1.5);
  }
  const s = ipoState(m);
  head(
    c,
    'Which way does IPO push the margin?',
    'τ = 0.1 > 0   /   Target = 1 / (2τ) = 5   /   Use the declared completion reduction',
  );
  const { X, Y } = plot(c, {
    x: 82,
    y: 145,
    w: 468,
    h: 235,
    xmin: 0,
    xmax: 10,
    ymin: 0,
    ymax: 25,
    xticks: [0, 2.5, 5, 7.5, 10],
    yticks: [0, 10, 20, 25],
    fn: (v) => ipoState(v).loss,
  });
  marker(c, X(m), Y(s.loss), blue);
  txt(c, 'Reference-relative margin   ' + fixed(m, 2), 128, 451, 22);
  readout(c, 'IPO LOSS  (m − 5)²', fixed(s.loss, 2), 623, 162, teal, 34);
  readout(c, 'DERIVATIVE  2(m − 5)', signed(s.slope, 2), 623, 284, blue, 34);
}
const mismatchedRatios = [-0.6, 1];
export function ktoReference(ratios = mismatchedRatios) {
  const mean = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  return { ratios, mean, z: Math.max(0, mean) };
}
export function ktoState(r, z = ktoReference().z, beta = 0.5) {
  const p = sigmoid(beta * (r - z));
  return { r, good: 1 - p, bad: p };
}
export function kto(c, k) {
  const b = k.beat.beatIndex,
    ref = ktoReference(),
    s = ktoState(1 + cue(k, 2, 'r increases from one to two', 1.9), ref.z);
  head(
    c,
    'One response, two possible labels',
    'Unit weight   /   β = 0.5, detached reference point z = ' + fixed(ref.z, 1),
  );
  if (b === 0) {
    slip(
      c,
      58,
      189,
      453,
      158,
      'One labeled answer',
      ['“Open a reviewer ticket and cite P-7.”'],
      blue,
      'Desirable',
    );
    txt(c, 'No paired reply required.', 559, 255, 24);
    txt(c, 'What did the labeler value?', 559, 295, 20, muted);
    return;
  }
  const { X, Y } = plot(c, {
    x: 74,
    y: 146,
    w: 486,
    h: 230,
    xmin: 0,
    xmax: 3,
    ymin: 0,
    ymax: 1,
    xticks: [0, 1, 2, 3],
    yticks: [0, 0.5, 1],
    fn: (r) => ktoState(r, ref.z).good,
  });
  path(
    c,
    Array.from({ length: 81 }, (_, i) => [X((i * 3) / 80), Y(ktoState((i * 3) / 80, ref.z).bad)]),
    red,
    4,
  );
  line(c, X(s.r), Y(0), X(s.r), Y(1), muted, 1);
  marker(c, X(s.r), Y(s.good), teal);
  marker(c, X(s.r), Y(s.bad), red);
  txt(c, 'Log ratio r = ' + fixed(s.r, 2), 166, 448, 23);
  readout(c, 'DESIRABLE  /  LOSS', fixed(s.good, 3), 646, 180, teal, 38);
  readout(c, 'UNDESIRABLE  /  LOSS', fixed(s.bad, 3), 646, 305, red, 38);
  if (b === 3) {
    cap(c, 'MISMATCHED PAIRS', 62, 476);
    if (cue(k, 3, 'minus zero point six'))
      txt(c, 'Row 1   ' + signed(ref.ratios[0], 1), 62, 505, 20);
    if (cue(k, 3, 'and plus one')) txt(c, 'Row 2   ' + signed(ref.ratios[1], 1), 192, 505, 20);
    if (cue(k, 3, 'Their batch mean')) txt(c, 'Mean   ' + fixed(ref.mean, 1), 345, 505, 20);
    if (cue(k, 3, 'clamps that mean'))
      txt(c, 'max(0, ' + fixed(ref.mean, 1) + ') = ' + fixed(ref.z, 1), 505, 505, 20);
    if (cue(k, 3, 'detaches the result')) txt(c, 'z is detached', 750, 505, 20, teal);
  }
}
export function freeState() {
  const p = [0.2, 0.1],
    odds = p.map((v) => v / (1 - v)),
    mean = [-0.1, -0.15],
    beta = 2,
    gamma = 0.2,
    z = beta * (mean[0] - mean[1]) - gamma;
  return { p, odds, ratio: odds[0] / odds[1], mean, beta, gamma, z, loss: prefLoss(z) };
}
export function referenceFree(c, k) {
  const b = k.beat.beatIndex,
    s = freeState();
  head(
    c,
    b === 0
      ? 'ORPO compares odds and imitates A'
      : b === 1
        ? 'SimPO asks for a target margin'
        : 'What computation remains?',
    'Reference-free optimization   /   One trainable policy',
  );
  if (b < 2) {
    const cols =
      b === 0
        ? ['One-token reply', 'Probability', 'Odds  p / (1 − p)']
        : ['Reply', 'Mean token log p', 'Scaled score  (β = 2)'];
    cols.forEach((v, i) => cap(c, v, [56, 334, 616][i], 166));
    for (let i = 0; i < 2; i++) {
      const y = 230 + i * 100;
      txt(c, i ? 'B  Rejected' : 'A  Chosen', 55, y, 26, hues[i]);
      txt(c, fixed(b ? s.mean[i] : s.p[i], 2), 338, y, 29);
      txt(c, fixed(b ? 2 * s.mean[i] : s.odds[i], b ? 2 : 3), 636, y, 29);
    }
    txt(
      c,
      b
        ? 'z = (−0.20 + 0.30) − 0.20 = ' + fixed(s.z, 2)
        : 'Odds ratio   ' +
            fixed(s.ratio, 2) +
            '       Probability ratio   ' +
            fixed(s.p[0] / s.p[1], 1),
      57,
      441,
      27,
      teal,
    );
  } else {
    ['Score replies', 'Evaluate loss', 'Update policy'].forEach((n, i) => {
      const x = 50 + i * 307;
      box(c, x, 200, 230, 85, white, 4);
      txt(c, n, x + 115, 251, 23, hues[i], 'center');
      if (i < 2) arrow(c, x + 245, 242, x + 288, 242, muted);
    });
    txt(c, 'Compare correctness and concision on held-out answers.', 53, 401, 24);
  }
}
export function group(c, k) {
  const b = k.beat.beatIndex,
    equal = cue(k, 2, 'same reward') === 1,
    s = alignmentGroup(equal ? [1, 1, 1, 1] : [1, 0, 0.5, 1]);
  head(
    c,
    'Four answers to one prompt',
    'One outcome per completion   /   Population standard deviation',
  );
  const X = [161, 354, 547, 740],
    Y = (v) => 314 - 141 * v;
  s.rewards.forEach((r, i) => {
    box(c, X[i] - 45, Y(r), 90, 314 - Y(r), blue, 1);
    line(c, X[i] - 45, 314, X[i] + 45, 314, blue, 3);
    txt(c, String(r), X[i], Y(r) - 15, 22, ink, 'center');
    txt(c, 'Reply ' + (i + 1), X[i], 348, 19, ink, 'center');
  });
  if (b >= 1) {
    line(c, 57, Y(s.mean), 899, Y(s.mean), red, 2);
    txt(c, 'mean ' + fixed(s.mean, 3), 23, Y(s.mean) - 7, 15, red);
    s.advantages.forEach((a, i) => txt(c, signed(a, 3), X[i], 414, 24, teal, 'center', 'Mono'));
    cap(
      c,
      s.std ? 'ADVANTAGE = (REWARD − MEAN) / SD' : 'EQUAL REWARDS   /   ZERO REWARD ADVANTAGE',
      53,
      466,
    );
    txt(c, 'SD ' + fixed(s.std, 3), 764, 467, 19, muted);
  }
}
export function tokenRatios(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    head(
      c,
      'What does clipping each token preserve?',
      'Group outcome advantage +1   /   ε = 0.2   /   Same two generated tokens',
    );
    const r = [1.1, 1.1],
      a = r.map((v) => alignmentClipping(v, 1).surrogate),
      prod = r[0] * r[1];
    cap(c, 'TOKEN RATIOS', 54, 173);
    r.forEach((v, i) => {
      box(c, 55 + i * 221, 209, 194, 82, hues[i], 4);
      txt(c, fixed(v, 2), 152 + i * 221, 261, 31, white, 'center', 'Mono');
    });
    arrow(c, 493, 250, 551, 250, muted);
    readout(c, 'AVERAGE AFTER CLIPPING', fixed((a[0] + a[1]) / 2, 2), 582, 208, teal);
    if (b === 1)
      txt(
        c,
        'Multiply first    1.1 × 1.1 = ' +
          fixed(prod, 2) +
          '    →    clip to ' +
          fixed(alignmentClipping(prod, 1).surrogate, 2),
        55,
        421,
        26,
        blue,
      );
  } else {
    head(
      c,
      'Where does GRPO’s separate KL term come from?',
      'Current-policy sampling   /   Reference = (0.5, 0.5)   /   ℓ = ln(p reference / p current)',
    );
    const p = [0.8, 0.2],
      ell = p.map((v) => Math.log(0.5 / v)),
      terms = ell.map((v) => Math.exp(v) - v - 1);
    ['Outcome', 'Current p', 'Log ratio ℓ', 'exp(ℓ) − ℓ − 1'].forEach((v, i) =>
      cap(c, v, [57, 282, 505, 700][i], 170),
    );
    p.forEach((v, i) => {
      const y = 236 + i * 86;
      txt(c, String.fromCharCode(65 + i), 59, y, 27, hues[i]);
      txt(c, fixed(v, 1), 289, y, 28);
      txt(c, fixed(ell[i], 3), 514, y, 28);
      txt(c, fixed(terms[i], 3), 714, y, 28);
    });
    txt(
      c,
      b === 2
        ? 'Each sample term is nonnegative.'
        : 'Current-policy expectation    ' +
            fixed(
              terms.reduce((a, t, i) => a + p[i] * t, 0),
              3,
            ),
      54,
      427,
      25,
      teal,
    );
    if (b === 4) txt(c, 'TRL 1.13.0: default β = 0 disables this term.', 55, 472, 20, muted);
  }
}
export function ai(c, k) {
  const b = k.beat.beatIndex,
    heldOut = b >= 2;
  head(
    c,
    heldOut ? 'Which reply follows P-7?' : 'Who judged this reply?',
    heldOut
      ? 'Independent human review   /   Held-out request'
      : 'Constitutional AI   /   P-7 illustrates a written principle',
  );
  box(c, 51, 134, 857, 61, ink, 3);
  txt(c, 'P-7', 68, 173, 23, gold, 'left', 'Mono');
  txt(c, 'Cite the policy and escalate privileged changes.', 148, 172, 23, white);
  if (heldOut) {
    txt(
      c,
      '“Can I have admin access until noon for Saturday’s backup?”',
      52,
      239,
      26,
      ink,
      'left',
      'Serif',
    );
    slip(
      c,
      52,
      267,
      416,
      130,
      'Reply X',
      ['“Under P-7, I sent your request', 'to the backup owner for approval.”'],
      muted,
    );
    slip(
      c,
      492,
      267,
      416,
      130,
      'Reply Y',
      ['“Under P-7, your admin access', 'is active until noon.”'],
      muted,
    );
    txt(
      c,
      b === 2
        ? 'Who decides whether to grant access in each reply?'
        : 'X sends the decision to the owner. Y grants access directly.',
      52,
      458,
      23,
    );
    return;
  }
  slip(c, 52, 239, 365, 147, 'Draft', ['“Grant it for tonight.”'], red);
  if (cue(k, 0, 'critiques and revisions')) {
    arrow(c, 438, 303, 501, 303, muted);
    slip(
      c,
      523,
      239,
      386,
      147,
      'Revision',
      ['“I’ll open a reviewer ticket', 'and cite P-7.”'],
      teal,
    );
  }
  txt(
    c,
    b === 1
      ? 'AI feedback names a label source. Check the judgment.'
      : 'SFT learns revised replies. AI comparisons can train a reward model.',
    52,
    454,
    22,
  );
}
