import { C, wordings, names, mix, ease } from './counter.mjs';
import {
  baseline,
  p4,
  id,
  dec,
  pct,
  rates,
  flips,
  served,
  cutoffState,
  register,
} from './audit.mjs';

export function opening(g, t) {
  const { rect, serif, type, mono, blender, receipt, paper, slip, line, ctx } = g;
  g.ground(true);
  rect(0, 462, 1200, 213, '#bf9271');
  rect(0, 470, 1200, 7, '#977357');
  for (let i = 0; i < 5; i++) line(0, 499 + i * 39, 1200, 478 + i * 39, '#986c5129', 2);
  blender(94, 340, 0.91);
  receipt(59, 486, 264);
  const showConversational = t.at(1, 'Now try the same claim', 0.65);
  wordings.forEach((key, j) => {
    const a = j ? showConversational : 1;
    if (!a) return;
    const arrive = j ? ease(a) : ease(Math.min(1, t.clock.seconds / 0.72));
    const x = 398 + 48 * (1 - arrive),
      y = 67 + j * 225;
    ctx.save();
    ctx.globalAlpha = j ? a : 1;
    paper(x, y, 744, 183);
    rect(x, y, 9, 183, C[key]);
    mono(names[key].toUpperCase(), x + 28, y + 34, 16, C[key]);
    serif(
      j ? '“Can you replace it?”' : '“Please replace it under the thirty-day policy.”',
      x + 28,
      y + 84,
      33,
      C.ink,
      'left',
      683,
    );
    const scoreIn = j ? t.at(3, 'Automatic service starts') : t.at(3, 'Conversational gets');
    const scoreX = x + 29;
    if (scoreIn) {
      const move = j ? t.at(4, 'Its score falls', 0.75) : t.at(4, 'Changing just', 0.75);
      const review = x + 309,
        auto = x + 545;
      const dest = j ? review : auto,
        pos = mix(scoreX, dest, ease(move));
      if (t.at(3, 'Which request')) {
        line(scoreX + 48, y + 135, auto + 47, y + 135, C.rule, 2);
        for (const [px, label] of [
          [review, 'Review'],
          [auto, 'Automatic'],
        ]) {
          rect(px - 4, y + 110, 102, 49, '#c4c7b5', 5);
          rect(px - 1, y + 113, 96, 43, '#ebe7d0', 3);
          type(label, px + 47, y + 179, 18, C.ink, 'center');
        }
      }
      slip(pos, y + 113, 94, 47, key, dec(p4[key]), 25);
    }
    ctx.restore();
  });
  if (t.at(3, 'Which request') || t.b === 4) {
    paper(400, 538, 740, 71);
    type('Automatic service starts at', 427, 584, 28);
    mono('0.70', 846, 586, 36, C.ink);
  }
}

export function harms(g, t) {
  g.ground();
  const reply = !!t.at(2, 'both versions get automatic service');
  const insult = !!t.at(2, 'Read the words');
  const { paper, mono, serif, type, rect, line, slip } = g;
  g.head(
    'P4   /   SERVICE RECORD',
    t.b === 3 ? 'Who wrote the request?' : reply ? 'Read the reply' : 'Follow the service record',
  );
  paper(55, 171, 541, 401);
  mono('ROUTING LOG', 84, 211, 16);
  wordings.forEach((key, j) => {
    const y = 262 + j * 98;
    slip(85, y, 190, 52, key, names[key], 19);
    line(288, y + 26, 339, y + 26, C.rule, 3);
    type(j && !reply ? 'Review' : 'Automatic', 351, y + 35, 28);
  });
  line(81, 456, 565, 456);
  type(t.b === 3 ? 'Audited field' : 'Measured here', 84, 499, 19, C.sub);
  type(t.b === 3 ? 'Request wording' : 'Route assignment', 84, 537, 29);
  paper(633, 171, 510, 401, '#e8ebd8');
  if (t.b === 3) {
    mono('GROUP INFORMATION', 666, 212, 16);
    serif('Unknown', 665, 300, 53);
    type('Wording alone cannot identify a group.', 666, 355, 24, C.ink, 'left', 'Sans', 400, 444);
    line(665, 401, 1107, 401);
    type('Review definitions and examples.', 666, 450, 23);
    type('Restrict access to customer data.', 666, 496, 23);
  } else if (reply) {
    mono('CUSTOMER REPLY   /   EXAMPLE', 665, 212, 16);
    if (insult) {
      serif('“You sound', 662, 319, 50);
      serif('uneducated.”', 662, 379, 50);
      rect(667, 403, 258, 4, C.brick);
      type('Representational harm', 666, 493, 27, C.brick);
    } else {
      serif('Reply text', 665, 326, 46);
    }
  } else {
    mono('OUTCOME RECORD', 666, 212, 16);
    for (const [i, label] of ['Wait until service', 'Replacement arrived'].entries()) {
      type(label, 666, 283 + i * 115, 25);
      mono('Unmeasured', 666, 321 + i * 115, 23, C.sub);
    }
    if (t.at(1, 'To measure its cost'))
      type('Allocative harm to investigate', 82, 619, 25, C.brick);
  }
}

export function matching(g, t) {
  g.ground();
  const changed = t.at(2, 'Would you keep') && !t.at(4, 'Put twelve days back');
  const draft = changed ? 32 : 12;
  g.head('P4   /   WORDING-PAIR REVIEW', 'Which fact changed?');
  const { type, line, mono, rect, serif, paper } = g;
  paper(60, 166, 1080, 227);
  [
    ['Product', 'Blender'],
    ['Defect', 'Stopped working'],
    ['Requested action', 'Replacement'],
  ].forEach(([a, b], i) => {
    const x = 97 + i * 354;
    mono(a.toUpperCase(), x, 206, 16);
    serif(b, x, 272, 38);
    if (i < 2) line(x + 313, 191, x + 313, 300);
  });
  line(89, 310, 1110, 310);
  type('The reviewer checked these facts in both versions.', 99, 354, 24);
  const x = (d) => 270 + 22 * d;
  rect(x(0), 432, x(30) - x(0), 137, '#d3ddc9');
  line(x(30), 422, x(30), 577, C.ink, 3);
  mono('30-day policy', x(30), 415, 16, C.sub, 'center');
  wordings.forEach((key, j) => {
    const val = j ? draft : 12,
      y = 471 + 65 * j;
    type(names[key], 65, y + 7, 23, C[key]);
    line(x(0), y, x(36), y, C.rule, 2);
    g.dot(x(val), y, 9, C[key]);
    mono('day ' + val, x(val) + 17, y + 7, 21, C[key]);
  });
  if (t.at(3, 'Thirty-two days') && changed)
    type('Reject this pair. Eligibility changed.', 63, 625, 29, C.brick);
  if (t.at(4, 'This pair tests'))
    type(
      'Matched facts     |     Score difference  ' + dec(p4.formal - p4.conversational),
      63,
      625,
      28,
    );
}

function pairPlot(
  g,
  rows,
  cut,
  { left = 185, right = 841, top = 169, pitch = 40, focus = [], shade = true } = {},
) {
  const x = (v) => left + ((right - left) * (v - 0.4)) / 0.6;
  const bottom = top + pitch * 9;
  if (shade) g.rect(x(cut), top - 18, right - x(cut), pitch * 9 + 38, '#d9e3cc');
  g.line(x(cut), top - 23, x(cut), bottom + 18, C.green, 2);
  g.mono('cut ' + dec(cut), x(cut), top - 34, 16, C.green, 'center');
  baseline.forEach((base, i) => {
    const y = top + i * pitch,
      r = rows.find((item) => item.id === base.id);
    g.mono(id(base), left - 55, y + 6, 17, focus.includes(base.id) ? C.brick : C.ink);
    if (!r) {
      g.line(left, y, right, y, C.rule, 1);
      g.rect(left + 30, y - 15, 160, 29, C.paper);
      g.type('Pair missing', left + 40, y + 5, 18, C.brick);
      return;
    }
    const crosses = served(r.formal, cut) !== served(r.conversational, cut);
    g.line(
      x(r.conversational),
      y,
      x(r.formal),
      y,
      focus.includes(r.id) && crosses ? C.ink : C.rule,
      focus.includes(r.id) && crosses ? 5 : 2,
    );
    for (const key of wordings) {
      const px = x(r[key]),
        py = y + (r.formal === r.conversational ? (key === 'formal' ? -4 : 4) : 0);
      if (r.ready) g.dot(px, py, 7, C[key]);
      else g.rect(px - 7, py - 7, 14, 14, C[key]);
    }
  });
  g.rule(left, bottom + 26, right - left, 0.4, 1, 0.1, (v) => dec(v));
}
function key(g, x, y) {
  wordings.forEach((k, i) => {
    g.dot(x, y + i * 38, 7, C[k]);
    g.type(names[k], x + 19, y + 7 + i * 38, 21, C[k]);
  });
}
export function manifest(g, t) {
  g.ground();
  const { rows, missing } = register(t);
  g.head('PAIRED SCORES   /   BASELINE', 'One line per expected claim');
  pairPlot(g, rows, 0.7, {
    left: 148,
    right: 788,
    top: 206,
    pitch: 37,
    focus:
      t.b >= 3 || t.at(2, 'Now look at N one') ? ['p4', 'p5', 'n1'] : t.b === 2 ? ['p4', 'p5'] : [],
  });
  const { type, mono, paper, serif } = g;
  paper(835, 171, 307, 405);
  mono('MANIFEST', 862, 213, 16);
  serif(rows.length + ' / ' + baseline.length, 861, 287, 56);
  type('pairs received', 863, 323, 23);
  key(g, 867, 375);
  type('●  Ready       ■  Unclear', 863, 463, 19);
  if (missing.length) type('Missing  ' + missing.map(id).join(', '), 863, 534, 25, C.brick);
  else if (t.at(4, 'This is a deterministic test'))
    type(flips(0.7, rows).length + ' route flips', 863, 534, 27, C.brick);
  if (t.b === 3 && missing.length)
    type('Check expected IDs before counting flips.', 64, 634, 26, C.brick);
  if (t.b === 4 && t.at(4, 'For a judge'))
    type('Variable judge   /   Repeat each pair and compare route frequencies.', 64, 634, 25);
}

export function denominators(g, t) {
  g.ground();
  const ready = t.b <= 2,
    rows = baseline.filter((r) => r.ready === ready),
    n = rows.length;
  const started = ready ? t.at(1, 'Move the slips', 1.15) : 1;
  const compared = ready
    ? t.after(2, 'P four and P five')
    : t.after(4, 'Only the formal version of N one got through');
  const reveal = ready
    ? [t.after(2, 'Five of six with formal wording'), t.after(2, 'Three of six with conversational wording')]
    : [t.after(4, 'One out of four'), t.after(4, 'zero out of four')];
  const { type, mono, line, slip, rect, serif } = g;
  g.head(
    (ready ? 'TRUE POSITIVE RATE' : 'FALSE POSITIVE RATE') + '   /   CUTOFF 0.70',
    ready ? 'Of the ready claims, who got service?' : 'Of the unclear claims, who got through?',
  );
  wordings.forEach((key, j) => {
    const y = 227 + j * 160;
    type(names[key], 54, y + 30, 23, C[key]);
    type('Automatic', 247, y + 3, 17, C.sub, 'right');
    type('Review', 247, y + 70, 17, C.sub, 'right');
    for (const [i, r] of rows.entries()) {
      const x = 306 + i * 106,
        auto = served(r[key]),
        dest = y + (auto ? 0 : 66);
      if (!j) {
        const difference = served(r.formal) !== served(r.conversational);
        if (compared && difference) rect(x + 5, 155, 55, 35, '#ecd8ac', 4);
        mono(id(r), x + 32, 177, 19, C.ink, 'center');
      }
      line(x + 32, y, x + 32, y + 66, C.rule);
      g.dot(x + 32, y, 3, C.rule);
      g.dot(x + 32, y + 66, 3, C.rule);
      slip(x, mix(y + 30, dest, ease(started)) - 17, 65, 35, key, dec(r[key]), 16);
    }
    if (reveal[j]) {
      const count = rows.filter((r) => served(r[key])).length;
      serif(count + ' / ' + n, 991, y + 44, 42, C[key]);
    }
  });
  line(51, 496, 1144, 496);
  const a = rates('formal'),
    b = rates('conversational'),
    f = ready ? a.tpr : a.fpr,
    c = ready ? b.tpr : b.fpr;
  const showGap = ready
    ? t.after(2, 'thirty-three point three percentage points')
    : t.after(4, 'false positive rate');
  type(n + ' ' + (ready ? 'ready' : 'unclear') + ' claims per wording', 56, 539, 24);
  if (showGap) {
    type(ready ? 'Ready-case access gap' : 'Unclear-case admission gap', 542, 539, 24);
    serif(Number(((f - c) * 100).toFixed(1)) + ' pp', 1138, 542, 35, C.brick, 'right');
  }
}

export function cutoff(g, t) {
  g.ground();
  const { cut, rows, useCandidate } = cutoffState(t);
  const { paper, mono, type, serif, line } = g;
  g.head(
    useCandidate ? 'HAND-WRITTEN CANDIDATE SCORES' : 'BASELINE SCORES',
    'What passes this cutoff?',
  );
  pairPlot(g, rows, cut, { left: 111, right: 649, top: 214, pitch: 36 });
  paper(687, 165, 458, 415);
  mono('AUTOMATIC SERVICE', 706, 201, 16);
  type('Formal', 974, 252, 18, C.formal, 'right');
  type('Conversational', 1127, 252, 18, C.conversational, 'right');
  for (const [i, ready] of [true, false].entries()) {
    const subset = rows.filter((r) => r.ready === ready),
      y = 304 + i * 99;
    type(ready ? 'Ready' : 'Unclear', 711, y, 24);
    type(ready ? 'Floor 80%' : 'Ceiling 10%', 711, y + 32, 18, C.sub);
    wordings.forEach((key, j) => {
      const count = subset.filter((r) => served(r[key], cut)).length;
      serif(count + ' / ' + subset.length, 966 + j * 150, y + 11, 36, C[key], 'right');
    });
  }
  line(709, 461, 1121, 461);
  type('Absolute gap limit per rate', 709, 500, 21);
  mono('10 pp', 1121, 500, 21, C.ink, 'right');
  const f = rates('formal', cut, rows),
    c = rates('conversational', cut, rows);
  type(
    'Gaps   ' +
      Number((Math.abs(f.tpr - c.tpr) * 100).toFixed(1)) +
      ' pp ready   /   ' +
      Number((Math.abs(f.fpr - c.fpr) * 100).toFixed(1)) +
      ' pp unclear',
    709,
    548,
    20,
  );
  if (useCandidate && t.at(4, 'But each wording'))
    type(
      'Per wording    ' +
        f.ready +
        ' ready of 50 needed     ·     ' +
        f.unclear +
        ' unclear of 30 needed',
      60,
      635,
      26,
      C.brick,
    );
  else {
    g.dot(72, 624, 7, C.formal);
    type('Formal', 90, 631, 20, C.formal);
    g.dot(220, 624, 7, C.conversational);
    type('Conversational', 239, 631, 20, C.conversational);
    type('Shaded scores get automatic service', 674, 631, 21, C.green);
  }
}
