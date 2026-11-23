import { C, after, key, proofLine } from './printshop.mjs';
import {
  TOKENS,
  seqLabels,
  pairs,
  ignored,
  padding,
  REPLY_PROBS,
  accounting,
  targetLoss,
  groupRows,
  valid,
  ageAt,
  needsReview,
  answerLoss,
  promptLoss,
  avg,
  sum,
} from './examples.mjs';

export function opening(p, k) {
  const age = ageAt(after(k, 0, 'By day eighteen', 1.6));
  const proposed = after(k, 0, 'Rotation can wait'),
    opened = after(k, 1, 'Open a rotation ticket');
  p.note('Incident T102   /   service key', 105, 98, C.gold);
  const x = 170 + (age - 12) * 187;
  key(p, x, 275, 1.65);
  p.number(Number(age.toFixed(1)) + ' days', x, 411, 54, C.cream, 'center');
  p.poly(
    [
      [x - 11, 437],
      [x + 11, 437],
      [x, 459],
    ],
    C.gold,
  );
  p.line(170, 467, 1666, 467, C.faint, 6);
  p.line(546, 467, 1666, 467, C.gold, 8);
  for (let i = 12; i <= 20; i++) {
    const tick = 170 + (i - 12) * 187;
    p.line(tick, 460, tick, 494, i === 14 ? C.gold : C.faint, 3);
    p.number(i, tick, 537, 32, i === 14 ? C.gold : C.faint, 'center');
  }
  p.txt('Older than 14 days', 546, 598, 39, C.gold, 'Serif');
  p.note('Open a rotation ticket for security review', 546, 641);
  if (!proposed) return;
  p.sheet(107, 700, 1695, 230, opened ? C.paper : '#edceae');
  p.note(
    opened ? 'ROTATION TICKET   /   T102' : 'PROPOSED DEMONSTRATION',
    150,
    760,
    opened ? C.green : C.rust,
  );
  p.txt(
    opened ? 'Open a rotation ticket for security review.' : '“Rotation can wait until next month.”',
    150,
    853,
    61,
    C.ink,
    'Serif',
    'left',
    opened ? 1120 : 1540,
  );
  if (opened && needsReview(age)) {
    p.line(1317, 724, 1317, 913, C.brass, 2, [9, 8]);
    p.note('SECURITY APPROVAL', 1364, 784, C.ink);
    p.number('PENDING', 1363, 862, 53, C.brass);
  }
  if (k.beat.beatIndex >= 2)
    p.note(
      k.beat.beatIndex === 2
        ? 'Baseline trial   /   supply the rule, then generate on new cases'
        : 'If behavior still fails   /   inspect groups, labels and checkpoint',
      115,
      1007,
    );
}
export function split(p, k) {
  const i = k.beat.beatIndex;
  p.heading(
    'Demonstration intake',
    i === 0 ? 'Which rows can enter the split?' : 'What does this holdout test?',
  );
  if (i === 0) {
    const done = after(k, 0, 'Set those two aside');
    const xs = [175, 505, 930, 1510];
    p.sheet(97, 274, 1715, 580);
    ['Incident', 'Request', 'Approved reply', 'Decision'].forEach((s, n) =>
      p.note(s, xs[n], 365, C.green),
    );
    groupRows.forEach((row, n) => {
      const y = 480 + 133 * n;
      p.line(145, y - 70, 1760, y - 70, '#b6b29d', 2);
      [...row, done ? (valid(row) ? 'Keep' : 'Set aside') : ''].forEach((s, j) =>
        p.txt(
          s || (j < 3 ? '(missing)' : ''),
          xs[j],
          y,
          43,
          j === 3 ? (valid(row) ? C.green : C.rust) : s ? C.ink : C.rust,
          j === 0 ? 'Mono' : 'Sans',
        ),
      );
    });
    return;
  }
  const done = after(k, 1, 'Put both in training', 0.9),
    held = after(k, 1, 'Hold out');
  const seam = 993;
  p.note('TRAINING INCIDENTS', 135, 302, C.mint);
  p.note('VALIDATION INCIDENTS', 1090, 302, C.gold);
  p.line(seam, 273, seam, 802, C.line, 3, [12, 13]);
  function slug(x, y, id, body, tint) {
    p.sheet(x, y, 680, 111, tint);
    p.number(id, x + 33, y + 70, 39, C.ink);
    p.txt(body, x + 200, y + 70, 37, C.ink);
    if (i === 2 && id !== 'P771') {
      p.box(x + 558, y + 19, 88, 59, C.ink, 4);
      p.number('D1', x + 602, y + 60, 33, C.cream, 'center');
    }
  }
  slug(131, 354, 'T102', 'How old is the key?', C.paper);
  slug(1090 - 959 * done, 495, 'T102', 'Who approves?', C.paper);
  if (done === 1) slug(131, 637, 'P771', 'Other incident', C.paper);
  if (held) slug(1090, 637, 'R550', 'Held-out request', C.gold);
  if (i === 2) {
    p.txt('T102 and R550 both cite D1', 960, 885, 62, C.gold, 'Serif', 'center');
    p.note('To test a new document, move its connected incidents together.', 482, 951);
  } else if (held) proofLine(p, 'Shared incident IDs', 'None', 916);
}
export function compress(p, k) {
  p.heading('Approved demonstration   /   T102', 'Where does the reply end?');
  p.sheet(132, 278, 1650, 240);
  p.note('REVIEWED ANSWER', 182, 350, C.green);
  p.txt('“Open a rotation ticket for security review.”', 182, 448, 65, C.ink, 'Serif');
  if (!after(k, 0, 'two pieces')) return;
  const end = after(k, 1, 'Include the turn-ending token');
  const symbols = ['open', 'ticket'];
  if (after(k, 1, 'How will the model learn')) symbols.push(end ? 'END' : '?');
  p.arrow(410, 530, 410, 625, C.gold);
  p.note('Teaching symbols', 135, 687);
  p.rail(symbols, {
    x: 137,
    y: 737,
    w: (1250 / 3) * symbols.length,
    h: 122,
    colors: [C.paper, C.paper, end ? C.mint : C.slate],
    ink: [C.ink, C.ink, end ? C.ink : C.gold],
    fontsize: 62,
  });
  if (end) p.note('End of turn', 1034, 945, C.mint);
}
export function template(p, k) {
  const i = k.beat.beatIndex;
  p.heading(
    'Checkpoint chat template',
    i < 2 ? 'Render the complete exchange' : 'Where does generation begin?',
  );
  if (i < 2) {
    [
      ['SYSTEM', 'Over 14 days? Open a ticket', 'for security review.'],
      ['USER', 'My key is 18 days old.', 'Can I still use it?'],
      ['ASSISTANT', 'Open a rotation ticket', 'for security review.'],
    ].forEach(([role, first, last], j) => {
      const x = 126 + 572 * j;
      p.sheet(x, 294, 525, 203, j === 2 ? C.mint : C.paper);
      p.note(role, x + 29, 350, C.green);
      p.txt(first, x + 29, 415, 39, C.ink, 'Serif', 'left', 469);
      p.txt(last, x + 29, 463, 39, C.ink, 'Serif', 'left', 469);
    });
    p.arrow(955, 508, 955, 586);
    p.note('Tokenized exchange   /   symbolic positions', 130, 635);
    p.rail(TOKENS, {
      y: 719,
      indices: TOKENS.map((_, n) => n),
      colors: TOKENS.map((_, n) => (n >= 5 ? C.mint : n === 4 ? C.gold : C.paper)),
      fontsize: 38,
    });
    if (i === 1) proofLine(p, 'Boundary check', '4 = assistant marker     5 = first reply token', 947);
  } else {
    const partial = after(k, 2, 'For a partial reply');
    p.note('New reply', 135, 346);
    p.rail(['SYSTEM', 'policy', 'USER', '18 days', 'ASSIST'], {
      x: 134,
      y: 380,
      w: 1350,
      h: 100,
      fontsize: 35,
    });
    p.arrow(1512, 430, 1620, 430);
    p.txt('start', 1650, 447, 43, C.gold, 'Serif');
    if (partial) {
      p.note('Continue an existing reply', 135, 640);
      p.rail(['SYSTEM', 'policy', 'USER', '18 days', 'ASSIST', 'open'], {
        x: 134,
        y: 675,
        w: 1350,
        h: 100,
        fontsize: 35,
        colors: [, , , , , C.mint],
      });
      p.arrow(1512, 723, 1620, 723);
      p.txt('continue', 1641, 740, 43, C.gold, 'Serif');
    }
    if (i === 3)
      p.note('One assistant header in each rendered input. Inspect the final token IDs.', 136, 928);
  }
}
export function labelView(
  p,
  {
    tokens = TOKENS,
    labels = seqLabels,
    links = [],
    showLabels = true,
    showIndices = true,
    colors = [],
    targetColors = [],
    x = 130,
    w = 1660,
    inputY = 368,
    lowerY = 647,
    fontsize = 39,
  } = {},
) {
  const indices = showIndices ? tokens.map((_, i) => i) : null;
  const xs = p.rail(tokens, { x, w, y: inputY, h: 102, indices, colors, fontsize });
  if (showLabels)
    p.rail(
      labels.map((v) => (v === ignored ? '−100' : v)),
      {
        x,
        w,
        y: lowerY,
        h: 94,
        colors: labels.map((v, i) => targetColors[i] ?? (v === ignored ? '#a4b6ac' : C.mint)),
        fontsize,
      },
    );
  links.forEach(({ from, to, color }) =>
    p.arrow(xs[from], inputY + 116, xs[to], lowerY - 13, color ?? C.gold, 6),
  );
  return xs;
}
export function shift(p, k) {
  p.heading('Teacher forcing   /   T102', 'Which scores predict “open”?');
  const count =
    after(k, 1, 'Use position four') +
    after(k, 1, 'Its scores predict ticket') +
    after(k, 1, 'the next target is end');
  p.note('Model input and position', 135, 277);
  const links = pairs(seqLabels).slice(0, count);
  const labels = TOKENS.map((v, n) => (n >= 5 ? v : '·'));
  labelView(p, {
    labels,
    links,
    colors: TOKENS.map((v, n) => (links.some((l) => l.from === n) ? C.gold : C.paper)),
    targetColors: TOKENS.map((_, n) => (n < 5 ? '#a4b6ac' : C.mint)),
  });
  p.note('Approved targets', 135, 811);
  if (count)
    p.number(links.map((l) => l.from + ' → ' + l.to).join('      '), 1800, 911, 46, C.mint, 'right');
}
export function mask(p, k) {
  p.heading('Response-only objective', 'Which positions get a grade?');
  const applied = after(k, 0, 'Set the five context labels');
  const trace = after(k, 1, 'The model is at open');
  p.note('Input positions', 134, 275);
  const all = after(k, 2, 'Open, ticket and end');
  labelView(p, {
    showLabels: !!applied,
    links: all ? pairs(seqLabels) : trace ? [pairs(seqLabels)[1]] : [],
    colors: TOKENS.map((_, j) => ((all ? j >= 4 && j <= 6 : trace && j <= 5) ? C.gold : C.paper)),
  });
  if (applied) p.note('Loss labels', 133, 814);
  if (all) proofLine(p, 'Scored labels', '3 targets after the shift', 924);
  else
    proofLine(
      p,
      trace ? 'Readable prefix at open' : 'Inputs in this example',
      trace ? 'Policy, age, assistant marker and open' : '8 positions',
      924,
    );
}
export function losses(p, k) {
  p.heading('Three next-token predictions', 'What does the stop target contribute?');
  const removed = after(k, 3, 'The stop term drops out');
  const active = removed ? 2 : 3,
    a = accounting(REPLY_PROBS.slice(0, active));
  p.note('Approved token', 144, 344);
  p.note('Probability after its prefix', 144, 466);
  p.note('Loss   −ln(p)', 144, 621);
  ['open', 'ticket', 'END'].forEach((v, i) => {
    const x = 820 + i * 382;
    p.txt(v, x, 345, 66, C.cream, 'Serif', 'center');
    p.number(REPLY_PROBS[i].toFixed(2), x, 474, 57, C.blue, 'center');
    p.line(x - 130, 508, x + 130, 508, C.line, 3);
    if (after(k, 0, 'Take the negative natural log'))
      p.number(
        i < active ? targetLoss(REPLY_PROBS[i]).toFixed(3) : 'skipped',
        x,
        626,
        50,
        i < active ? C.mint : C.coral,
        'center',
      );
  });
  if (after(k, 1, 'Their losses add')) {
    p.sheet(134, 739, 1634, 191);
    p.note('Mean over scored targets', 178, 808, C.green);
    p.number(
      a.total.toFixed(3) + '  /  ' + a.count + '   ≈   ' + a.mean.toFixed(3),
      176,
      889,
      62,
      C.ink,
    );
  }
}
export function pad(p, k, practice = false) {
  const b = k.beat.beatIndex;
  if (!practice && b === 2) {
    p.heading('TRL 1.17   /   collated labels', 'Which dataset did the trainer receive?');
    p.rows(
      [
        ['Prompt + completion', 'completion only'],
        ['Plain messages', 'full sequence'],
        ['Messages + assistant_only_loss', 'assistant spans'],
      ],
      135,
      355,
      1635,
      139,
    );
    p.note('For assistant-only loss, the template must identify its generation spans.', 141, 882);
    return;
  }
  p.heading(
    practice ? 'Batch inspection   /   stop signal' : 'Right padding   /   toy batch',
    practice ? 'Inspect the last prediction' : 'Three copies of ID 2',
  );
  const wrong = practice && after(k, 0, 'ignore every ID');
  const correct = practice
    ? !wrong || after(k, 1, 'Mask only the padding positions')
    : after(k, 1, 'Keep ID two');
  const show = practice || correct;
  const state = padding(!!correct);
  p.note('Token role', 143, 309);
  const xs = p.rail(state.words, { y: 344, h: 94, fontsize: 39 });
  p.note('Input ID', 143, 524);
  state.ids.forEach((v, j) => p.number(v, xs[j], 604, 81, C.cream, 'center'));
  p.line((xs[3] + xs[4]) / 2, 295, (xs[3] + xs[4]) / 2, 900, C.gold, 4, [10, 10]);
  p.note('Right padding', (xs[3] + xs[4]) / 2 + 27, 308, C.gold);
  if (show) {
    p.note('Loss label', 143, 714);
    p.rail(
      state.labels.map((v) => (v === ignored ? '−100' : v)),
      {
        y: 747,
        h: 105,
        colors: state.labels.map((v) => (v === ignored ? '#acbcb0' : C.mint)),
        fontsize: 49,
      },
    );
    const dx = xs[1] - xs[0];
    state.labels.forEach((v, i) => {
      if (v === ignored)
        for (let q = -3; q < 4; q++) {
          const mx = xs[i] + (q * dx) / 9;
          p.line(mx - 8, 831, mx + 1, 815, C.hole, 2);
        }
    });
    if (correct) p.arrow(xs[2] + 12, 615, xs[3], 732);
    p.txt(state.links.length + ' scored targets', 137, 963, 47, C.cream, 'Serif');
    if (correct || b > 0)
      p.txt(
        correct
          ? 'ticket → END     −ln(0.80) ≈ ' + targetLoss(0.8).toFixed(3)
          : 'ticket → END     skipped',
        1781,
        963,
        43,
        correct ? C.mint : C.coral,
        'Mono',
        'right',
      );
  } else p.txt('Which copy ends the real reply?', 130, 840, 68, C.gold, 'Serif');
}
export function active(p, k) {
  const b = k.beat.beatIndex;
  p.heading(
    'Shifted-target check',
    b < 2 ? 'A four-position gradient check' : 'What survived truncation?',
  );
  if (b < 2) {
    p.note('Four equal vocabulary scores at each predictor', 134, 284);
    labelView(p, {
      tokens: ['prompt', 'assistant', 'answer', 'stop'],
      labels: [ignored, ignored, 'ID 2', 'ID 3'],
      links: pairs([ignored, ignored, 2, 3]),
      fontsize: 51,
    });
    if (b === 1)
      proofLine(
        p,
        'Direct logit gradients',
        'Rows 1 and 2     •     −ln(¼) ≈ ' + Math.log(4).toFixed(3),
        923,
      );
  } else {
    const cut = after(k, 2, 'set a length limit of five'),
      n = cut ? 5 : 8;
    const left = seqLabels.slice(0, n);
    p.note('T102   /   retained positions', 135, 285);
    labelView(p, { tokens: TOKENS.slice(0, n), labels: left, links: pairs(left), w: (1660 * n) / 8 });
    proofLine(
      p,
      'Usable shifted targets',
      String(pairs(left).length) + (b === 3 ? '    /    reject or reformat this row' : ''),
      924,
    );
  }
}
export function dilution(p, k) {
  const included = after(k, 0, 'Switch on scoring'),
    probs = included ? [...promptLoss, ...answerLoss] : answerLoss;
  p.heading('Supplied token losses', 'Why did the mean fall?');
  const vals = [...promptLoss, ...answerLoss];
  const xs = vals.map((_, i) => 255 + i * 234);
  vals.forEach((v, i) => {
    const on = i >= 5 || included,
      c = i >= 5 ? C.mint : on ? C.gold : C.line;
    const h = 164 * v;
    p.box(xs[i] - 55, 701 - h, 110, h, c);
    p.number(v.toFixed(2), xs[i], 665 - h, 40, c, 'center');
    p.note(i >= 5 ? 'reply' : 'prompt', xs[i] - 49, 758, c);
  });
  p.line(141, 702, 1795, 702, C.line);
  p.note(included ? 'Combined mean' : 'Answer mean', 143, 866);
  p.number(
    sum(probs).toFixed(2) + ' / ' + probs.length + ' ≈ ' + avg(probs).toFixed(3),
    470,
    871,
    47,
    C.mint,
  );
  if (included)
    p.txt('Answer mean  ' + avg(answerLoss).toFixed(3), 1771, 869, 42, C.mint, 'Sans', 'right');
  if (k.beat.beatIndex >= 2)
    p.note('Larger example   /   800 of 830 scored targets come from the prompt (96%).', 135, 973);
}
