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
  line,
  arrow,
  txt,
  head,
  cap,
  rule,
  plot,
  marker,
  readout,
  tag,
  slip,
  stackText,
} from './art.mjs';
import { sigmoid, prefLoss } from '../../../films/preference-alignment/arithmetic.mjs';
import {
  alignmentClipping,
  alignmentGae,
  alignmentBudget,
  alignmentTilt,
} from '../../../films/preference-alignment/model.mjs';
export function judgeState(k) {
  const change = cue(k, 3, 'swap only the two reward scores', 1.35),
    swapped = change === 1;
  const a = Math.round(10 * mix(1.8, 0.7, change)) / 10,
    b = (25 - Math.round(10 * a)) / 10;
  return { a, b, gap: a - b, p: sigmoid(a - b), loss: prefLoss(a - b), swapped };
}
export function judge(c, k) {
  const b = k.beat.beatIndex,
    s = judgeState(k);
  head(
    c,
    'How well did the judge predict the vote?',
    'Observed choice   /   Ticket over direct grant',
  );
  readout(c, 'TICKET', fixed(s.a, 1), 55, 166, teal);
  readout(c, 'DIRECT GRANT', fixed(s.b, 1), 55, 279, blue);
  const { X, Y } = plot(c, {
    x: 360,
    y: 160,
    w: 520,
    h: 200,
    xmin: -3,
    xmax: 3,
    ymin: 0,
    ymax: 1,
    xticks: [-3, -2, -1, 0, 1, 2, 3],
    yticks: [0, 0.5, 1],
    fn: sigmoid,
  });
  txt(c, 'Chance of a vote for the ticket', 360, 132, 18);
  txt(c, 'Reward gap     ' + signed(s.gap, 1), 620, 425, 19, ink, 'center', 'Mono');
  if (cue(k, 1, 'The judge gives')) {
    marker(c, X(s.gap), Y(s.p));
    if (cue(k, 1, 'This curve is a sigmoid'))
      txt(c, fixed(100 * s.p, 1) + '%', X(s.gap), Y(s.p) - 21, 23, teal, 'center');
  }
  if (b > 2 || (b === 2 && k.elapsed >= k.speechDuration))
    txt(c, 'Loss  −ln(p)  =  ' + fixed(s.loss, 3), 55, 465, 25, ink, 'left', 'Mono');
}
export function methods(c, k) {
  const b = k.beat.beatIndex,
    again = cue(k, 0, 'Run another pass');
  head(
    c,
    'One migration request, two ways to train',
    'Where do the words scored in this update come from?',
  );
  cap(c, 'DPO  /  ARCHIVED VOTE', 50, 154);
  slip(c, 49, 178, 320, 120, 'A over B', ['Ticket with P-7', 'Grant until tomorrow'], teal);
  arrow(c, 386, 232, 469, 232, muted);
  tag(c, 'Policy + reference', 483, 213, 203, blue);
  arrow(c, 699, 232, 753, 232, muted);
  txt(c, 'Pass ' + (again ? 2 : 1), 778, 242, 27, ink, 'left', 'Serif');
  if (b >= 2) {
    line(c, 48, 323, 908, 323, '#c8c8b8');
    cap(c, 'PPO  /  NEW ROLLOUT', 50, 354);
    txt(c, 'Actor', 51, 410, 25, blue);
    arrow(c, 124, 401, 178, 401, muted);
    const written = cue(k, 2, 'It offers to send');
    txt(c, written ? '“I’ll send the change to a reviewer.”' : 'Writing a reply…', 195, 410, 22);
    if (cue(k, 2, 'reward model can score it') || b > 2) {
      arrow(c, 570, 401, 620, 401, muted);
      tag(c, 'Reward model', 642, 382, 183, teal);
    }
    if (b >= 5)
      txt(c, 'A fresh human vote can join the archive for the next DPO pass.', 50, 475, 20);
  }
}
export function roles(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Who owns the score for this token?', 'One response from the rollout batch');
  const words = ['Cite', 'P-7', 'and', 'escalate.'];
  const q = b ? 1 : cue(k, 0, 'actor writes', 1.4);
  words.forEach((w, i) => {
    const x = 53 + i * 159;
    box(c, x, 208, 141, 66, i / 4 <= q ? white : pale, 4);
    if (i / 4 <= q) txt(c, w, x + 70, 250, 24, ink, 'center', 'Mono');
  });
  cap(c, 'ACTOR  /  GENERATE', 52, 188);
  if (q === 1) {
    arrow(c, 688, 241, 739, 241, muted);
    tag(c, 'Reward scorer', 750, 223, 158, red);
    txt(c, 'Finished reply', 747, 287, 18, muted);
  }
  if (b >= 1) {
    line(c, 119, 281, 119, 320, blue);
    txt(c, 'Reference', 53, 352, 23, blue);
    txt(c, 'log p for drift', 53, 380, 18);
    line(c, 436, 281, 436, 320, teal);
    txt(c, 'Critic', 371, 352, 23, teal);
    txt(c, 'Value of prefix', 371, 380, 18);
  }
  if (b >= 2) {
    box(c, 45, 412, 865, 71, ink, 4);
    txt(c, 'Frozen for this batch', 65, 441, 18, gold);
    txt(
      c,
      'Old token probability → ratio denominator     •     Detached advantage target',
      65,
      469,
      20,
      white,
    );
  }
}
export function credit(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 5) {
    chargedReturn(c, k);
    return;
  }
  if (b === 1 || b === 2) {
    head(c, 'Why can one sampled log ratio be negative?', 'Reference probabilities  ½, ½');
    const ps = [0.8, 0.2],
      logs = ps.map((p) => Math.log(p / 0.5)),
      zero = 480;
    ps.forEach((p, i) => {
      const y = 197 + 123 * i;
      txt(c, 'p = ' + p, 70, y + 8, 24);
      line(c, zero, y, zero + logs[i] * 235, y, hues[i], 12);
      marker(c, zero + logs[i] * 235, y, hues[i]);
      txt(c, signed(logs[i], 3), zero + logs[i] * 235, y - 22, 23, ink, 'center');
    });
    line(c, zero, 154, zero, 364, muted);
    txt(c, '0', zero, 386, 16, muted, 'center');
    if (b === 2)
      txt(
        c,
        'Expected KL   0.8 × 0.470 + 0.2 × (−0.916)  ≈  ' +
          fixed(
            ps.reduce((a, p, i) => a + p * logs[i], 0),
            3,
          ),
        56,
        455,
        24,
      );
    return;
  }
  head(
    c,
    b === 0
      ? 'Charge each token, pay for the reply once'
      : 'Carry the last reward back through the reply',
    b === 0
      ? 'Per token   /   −β (log p old − log p reference)'
      : 'True terminal   /   γ = 1, all prefix values = 0',
  );
  const lambda = cue(k, 4, 'At lambda one half') ? 0.5 : 1;
  const adv = alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, lambda).advantages;
  ['Cite', 'P-7', 'escalate'].forEach((w, i) => {
    const x = 75 + 300 * i;
    box(c, x, 174, 210, 77, white, 7);
    txt(c, w, x + 105, 223, 30, hues[i], 'center', 'Serif', 600);
    if (b === 0) {
      txt(c, '−β × log ratio', x + 105, 300, 21, ink, 'center');
      if (i === 2 && cue(k, 0, 'last token')) tag(c, '+ sequence reward', x, 330, 210, red);
    } else {
      txt(c, 'reward   ' + [0, 0, 1][i], x + 105, 295, 21, ink, 'center', 'Mono');
      if (b === 4 && cue(k, 4, 'At lambda one')) {
        txt(c, fixed(adv[i], 2), x + 105, 385, 38, teal, 'center', 'Mono');
        if (i) arrow(c, x - 8, 370, x - 79, 370, teal);
      }
    }
  });
  if (b === 3)
    stackText(
      c,
      ['δ at t = reward + γ × next value − current value', 'A at t = δ at t + γλ × next advantage'],
      76,
      372,
      43,
      24,
    );
  if (b === 4) txt(c, 'Backward credit    λ = ' + lambda, 75, 459, 23, muted);
}
export function returnExample() {
  const logs = [0.4, -0.2, 0.6],
    charges = logs.map((v) => -0.5 * v),
    rewards = charges.map((v, i) => v + (i === 2 ? 2 : 0));
  return {
    logs,
    charges,
    rewards,
    advantages: alignmentGae(rewards, [0, 0, 0, 0], 1, 0.5).advantages,
  };
}
function chargedReturn(c, k) {
  const s = returnExample();
  head(
    c,
    'What reaches the first token now?',
    'True terminal   /   β = 0.5, γ = 1, λ = 0.5   /   All prefix values = 0',
  );
  const xs = [390, 583, 776];
  for (const [i, name] of ['Token 1', 'Token 2', 'Token 3'].entries()) cap(c, name, xs[i], 150);
  const revealed = ['The first advantage', 'The middle advantage', 'The last advantage'].map(
    (phrase) => cue(k, 6, phrase),
  );
  const rows = [
    ['Old − reference log p', s.logs],
    ['Drift charge', s.charges],
    ['Immediate reward', s.rewards],
    ['Advantage', s.advantages],
  ];
  rows.forEach(([label, values], j) => {
    const y = 203 + j * 64;
    txt(c, label, 54, y, 21, j === 3 ? teal : ink);
    values.forEach((v, i) =>
      txt(
        c,
        j === 3 && !revealed[i] ? '?' : fixed(v, j === 3 ? 3 : 2),
        xs[i],
        y,
        24,
        j === 3 ? teal : ink,
        'left',
        'Mono',
      ),
    );
  });
  txt(c, 'Final token receives the sequence score of +2 once.', 52, 474, 22);
}
export function clipState(k) {
  const up = cue(k, 1, 'Raise the current probability', 1),
    down = cue(k, 4, 'Take the current probability down', 1);
  const current = 0.2 + 0.1 * up - 0.2 * down,
    ratio = current / 0.2;
  return { current, ratio, rows: [1, -1].map((a) => alignmentClipping(ratio, a)) };
}
export function clipping(c, k) {
  const s = clipState(k),
    b = k.beat.beatIndex;
  head(
    c,
    'Which signed product does PPO keep?',
    'One sampled token   /   Old policy fixed at 20%   /   ε = 0.2',
  );
  const X = rule(
    c,
    80,
    585,
    221,
    0,
    0.4,
    [0, 0.1, 0.2, 0.3, 0.4],
    (v) => Math.round(100 * v) + '%',
  );
  line(c, X(0.16), 203, X(0.24), 203, gold, 10);
  txt(c, 'Clip range in probability units', X(0.2), 165, 16, muted, 'center');
  marker(c, X(s.current), 221, blue);
  readout(c, 'CURRENT / OLD', fixed(s.ratio, 2) + '×', 680, 157, blue);
  if (b >= 1) {
    ['Advantage', 'Actual × A', 'Clipped × A', 'Minimum'].forEach((s, i) =>
      cap(c, s, [68, 297, 538, 768][i], 317),
    );
    s.rows.forEach((r, i) => {
      const y = 369 + 66 * i;
      [signed(r.advantage, 0), signed(r.raw, 2), signed(r.clipped, 2)].forEach((s, j) =>
        txt(c, s, [72, 305, 542][j], y, 28, ink, 'left', 'Mono'),
      );
      const shown =
        i === 0
          ? cue(k, 3, 'Increasing the probability helped')
          : cue(k, 3, 'so the entire cost counts');
      txt(
        c,
        shown ? signed(r.surrogate, 2) : '?',
        772,
        y,
        30,
        shown ? teal : muted,
        'left',
        'Mono',
        600,
      );
    });
  }
}
export function budget(c, k) {
  const b = k.beat.beatIndex,
    s = alignmentBudget(70e9, !cue(k, 2, 'Removing this critic'));
  if (b === 3) {
    headBudgetSchedule(c, k);
    return;
  }
  head(
    c,
    'How much state do four roles retain?',
    'Illustrative worksheet   /   70 billion parameters per backbone   /   decimal GB',
  );
  if (b === 0) {
    const costs = [2, 2, 4, 4, 4],
      names = ['Weight', 'Gradient', 'Moment 1', 'Moment 2', 'Master'];
    let x = 52;
    costs.forEach((n, i) => {
      const w = n * 52;
      box(c, x, 186, w - 3, 98, i < 2 ? blue : teal);
      txt(c, n + ' B', x + w / 2, 247, 29, white, 'center', 'Mono');
      txt(c, names[i], x + w / 2, 322, 19, ink, 'center');
      x += w;
    });
    txt(c, 'Trainable   16 B / parameter', 54, 413, 26);
    txt(c, 'Frozen   2 B / parameter', 519, 413, 26);
    return;
  }
  s.roles.forEach((r, i) => {
    const y = 156 + i * 67;
    txt(c, r.id, 50, y + 25, 23);
    box(c, 198, y, 510, 34, '#dedac9', 2);
    if (r.present) box(c, 198, y, (r.gb / 1120) * 510, 34, r.trainable ? teal : blue, 2);
    txt(c, (r.present ? r.gb : 0) + ' GB', 734, y + 25, 23, ink, 'left', 'Mono');
  });
  txt(
    c,
    'Aggregate   ' + s.total.toLocaleString('en-US') + ' GB',
    50,
    466,
    31,
    ink,
    'left',
    'Serif',
    600,
  );
  if (s.saved) txt(c, fixed(100 * s.saved, 1) + '% saved', 603, 466, 26, teal);
}
function headBudgetSchedule(c, k) {
  head(
    c,
    'When do the engines take turns?',
    'Generation and policy updates   /   Illustrative timing',
  );
  cap(c, 'COLOCATED', 52, 170);
  tag(c, 'Generate', 260, 145, 245, blue);
  tag(c, 'Train', 508, 145, 244, teal);
  cap(c, 'ASYNCHRONOUS', 52, 291);
  tag(c, 'Generate batch 2', 372, 258, 378, blue);
  tag(c, 'Train on batch 1', 250, 308, 385, teal);
  line(c, 250, 370, 869, 370, muted, 2);
  arrow(c, 840, 370, 869, 370, muted);
  txt(c, 'Time', 875, 375, 16);
  txt(c, 'Which actor revision generated batch 2?', 53, 448, 24);
}
export function tilt(c, k) {
  const b = k.beat.beatIndex,
    t = alignmentTilt();
  head(
    c,
    'How does a reward tilt the reference?',
    'Fixed prompt   /   β = 1   /   Finite Z   /   Both answers have reference support',
  );
  const names = ['Reference', 'Multiply by exp(reward / β)', 'Normalize by Z'];
  for (let j = 0; j < 3; j++) {
    const x = 53 + 307 * j;
    cap(c, names[j], x, 161);
    for (let i = 0; i < 2; i++) {
      const y = 220 + 114 * i,
        show = j === 0 || cue(k, 1, j === 1 ? 'Unnormalized masses' : 'Z is two');
      txt(c, String.fromCharCode(65 + i), x, y, 23, hues[i]);
      if (!show) continue;
      const v = [t.reference, t.masses, t.probabilities][j][i];
      box(c, x + 33, y - 20, v * 129, 27, hues[i]);
      txt(c, fixed(v, 2), x + 34, y + 38, 23, ink, 'left', 'Mono');
    }
  }
  txt(
    c,
    b >= 2 ? 'J(π) = β ln Z − β KL(π || π*)' : 'Rewards   A = ln 3,  B = 0',
    54,
    453,
    27,
    ink,
    'left',
    'Serif',
    600,
  );
  if (b >= 2) txt(c, 'Maximum at π = π*', 611, 453, 23, teal);
}
export function cancel(c, k) {
  const q = cue(k, 1, 'identical beta log Z terms cancel', 0.8),
    b = k.beat.beatIndex,
    implicit = cue(k, 1, 'put the trainable policy');
  head(
    c,
    'Subtract rewards for the same prompt',
    'Positive β   /   Finite Z(x)   /   Reference-supported replies',
  );
  for (let i = 0; i < 2; i++) {
    const y = 190 + i * 101,
      letter = i ? 'B' : 'A';
    txt(c, (implicit ? 'rθ(' : 'r(') + letter + ')', 62, y + 25, 30, hues[i], 'left', 'Serif');
    txt(c, '=', 165, y + 25, 30);
    txt(
      c,
      'β ln [π' + (implicit ? 'θ' : '*') + '(' + letter + ') / πref(' + letter + ')] ',
      221,
      y + 25,
      27,
    );
    if (!implicit) {
      box(c, 620, y - 15, 237, 56, '#e5ce8e', 3);
      txt(c, '+ β ln Z(x)', 738, y + 23, 26, ink, 'center', 'Mono');
      if (q) line(c, 632, y + 19, 632 + 210 * q, y + 4, red, 3);
    }
  }
  if (q === 1)
    txt(
      c,
      (implicit ? 'rθ(A) − rθ(B)' : 'r(A) − r(B)') + '     =     β × reference-relative margin',
      62,
      413,
      27,
      teal,
    );
  if (b >= 2) txt(c, 'Stored vote A over B      Loss = −ln σ(rθ(A) − rθ(B))', 62, 469, 22);
}
