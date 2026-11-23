import {
  C,
  paper,
  heading,
  text,
  serif,
  num,
  rect,
  line,
  dot,
  key,
  at,
  mix,
  beat,
  percent,
  signed,
} from './studio.mjs';
import { vignette } from './engravings.mjs';
import {
  WORDS,
  TEACHER,
  INITIAL,
  POLICY_TEACHER,
  POLICY_STUDENT,
  POLICY_CASES,
  sm,
  target,
  savedWord,
  hardTarget,
  swapAlternatives,
  trace,
  terms,
  sum,
  binary,
} from './examples.mjs';

export function keyCase(g, k) {
  paper(g, true);
  const teacher = at(k, 5, 'The teacher gives'),
    student = at(k, 5, 'The student gives'),
    settled = at(k, 6, 'It stays put'),
    opened = at(k, 6, 'Restoration is forbidden');
  key(g, 202, 242, 1.32);
  text(g, 'ACCESS POLICY   /   INVENTED CASE', 895, 137, 31, C.teal);
  serif(g, 'Expired admin key', 890, 236, 88, C.white);
  text(g, 'Can its owner restore it?', 895, 310, 45, C.white);
  const x = 535,
    w = 1110;
  dot(g, 620, 408, 19, C.brass);
  dot(g, 620, 408, 12, C.night);
  text(g, 'Teacher', 651, 419, 36, C.brass);
  dot(g, 882, 408, 9, C.teal);
  text(g, 'Student', 908, 419, 36, C.teal);
  text(g, 'Probability of reply', 1430, 418, 33, C.faint, 'center');
  ['Seven days', 'Not allowed'].forEach((s, i) => {
    const y = 536 + i * 148;
    serif(g, s, 123, y + 14, 49, C.white);
    line(g, x, y, x + w, y, '#637d77', 4);
    for (let j = 0; j <= 10; j++)
      line(g, x + (w * j) / 10, y - 11, x + (w * j) / 10, y + 11, '#76938c', 3);
    if (teacher) {
      const px = x + w * POLICY_TEACHER[i];
      dot(g, px, y, 25, C.brass);
      dot(g, px, y, 17, C.night);
      num(g, percent(POLICY_TEACHER[i]), px, y - 40, 39, C.white, 'center');
    }
    if (student) dot(g, x + w * POLICY_STUDENT[i], y, 11, C.teal);
  });
  if (opened) {
    line(g, 122, 800, 1810, 800, '#688078', 2);
    text(g, 'Independent rule', 125, 877, 42, C.teal);
    serif(g, POLICY_CASES[1].rule, 555, 885, 66, C.white);
    text(
      g,
      'Teacher and student still match',
      1780,
      879,
      34,
      C.brass,
      'right',
    );
  } else if (settled) {
    serif(g, 'Leave the scores in place.', 124, 876, 59, C.teal);
    num(g, 'KL = 0', 1770, 875, 46, C.brass, 'right');
  } else if (at(k, 5, 'If we train only')) {
    serif(g, 'Move the student’s seven-day score?', 124, 862, 56, C.white);
    text(g, 'Raise   /   Lower   /   Hold', 1788, 863, 37, C.teal, 'right');
  }
}

const leftPage = 128, rightPage = 1022;
const plateY = 374, plateW = 727, plateH = 383;

function birdPlate(g, x, w = plateW, h = plateH, y = plateY) {
  rect(g, x + 6, y + 8, w, h, '#bbab88');
  vignette(g, savedWord, x, y, w, h, true);
}

function distributionPage(g, x, values, color, { highlightCat = false, reference } = {}) {
  WORDS.forEach((word, i) => {
    const y = 338 + 134 * i;
    vignette(g, i, x, y, 157, 104);
    serif(g, word, x + 183, y + 52, 48);
    const start = x + 327, width = 259;
    rect(g, start, y + 48, width, 18, C.edge);
    rect(g, start, y + 48, width * values[i], 18, color);
    if (reference && reference[i] !== values[i]) {
      const originalEnd = start + width * reference[i];
      line(g, originalEnd, y + 39, originalEnd, y + 75, C.gold, 4);
    }
    num(g, percent(values[i], 1), x + plateW, y + 60, 38, color, 'right');
    if (highlightCat && word === 'cat')
      line(g, x + 180, y + 91, x + plateW, y + 91, C.pink, 4);
  });
}

function spread(g, divided = true) {
  paper(g);
  serif(g, 'The child saw a …', 122, 153, 93);
  if (divided) line(g, 955, 228, 955, 882, C.edge, 3);
}

export function oneWord(g, k) {
  const copy = at(k, 1, 'Make one copy', 1.15);
  spread(g, copy === 1);
  const plateX = mix(385, leftPage, copy);
  const w = mix(1150, plateW, copy), h = mix(500, plateH, copy), y = mix(304, plateY, copy);
  const question = at(k, 2, 'Which word ranked second');
  const uncover = beat(k) === 3
    ? k.reveal('Uncover the teacher', 1.1, { captionStart: 'Dog came second' })
    : Number(beat(k) > 3);
  const hard = at(k, 4, 'hard target');
  const restore = at(k, 4, 'The saved word', 0.9);
  const swap = at(k, 3, 'If dog and cat traded places', 1.9) * (1 - restore);
  let teacherLabel = uncover ? 'Teacher probabilities' : 'Teacher’s choice';
  if (swap > 0) {
    teacherLabel = beat(k) === 3
      ? 'Teacher probabilities if dog and cat swap'
      : 'Return to the original probabilities';
  }
  text(g, teacherLabel, plateX, mix(268, 285, copy), 39, C.blue);
  if (copy === 1) text(g, 'Student’s copy', rightPage, 285, 39, C.green);
  if (uncover < 1) {
    birdPlate(g, plateX, w, h, y);
    serif(g, WORDS[savedWord], plateX, y + h + 85, 62);
  }
  if (uncover) {
    g.save();
    g.beginPath();
    g.rect(leftPage - 5, 315, (plateW + 27) * uncover, 570);
    g.clip();
    rect(g, leftPage - 5, 315, plateW + 27, 570, C.paper);
    distributionPage(g, leftPage, swap > 0 ? swapAlternatives(swap) : target, C.blue, {
      reference: swap > 0 ? target : undefined,
    });
    g.restore();
  }
  if (copy > 0) {
    birdPlate(g, mix(385, rightPage, copy), w, h, y);
    if (copy === 1) serif(g, WORDS[savedWord], rightPage, 842, 62);
  }
  if (hard) {
    num(g, percent(hardTarget[savedWord]) + ' target mass', rightPage + 187, 834, 38, C.green);
    text(g, 'Every other word gets zero target mass.', rightPage, 922, 36, C.muted);
  } else if (question && !uncover) {
    serif(g, 'From this copy, was dog or cat second?', 126, 959, 54);
  }
  if (swap > 0) {
    text(g, 'Gold ticks mark the original shares.', leftPage, 915, 36, C.muted);
    const sameCopy = beat(k) > 3 ||
      k.elapsed >= k.wordCue('The student would get exactly the same copy').end;
    if (!hard && sameCopy) {
      text(g, 'Same saved word', rightPage + 187, 834, 38, C.green);
    }
  }
}

export function compareWords(g, k) {
  spread(g);
  const answered = at(k, 2, 'Cat');
  text(g, 'Teacher probabilities', leftPage, 285, 39, C.blue);
  distributionPage(g, leftPage, target, C.blue, { highlightCat: answered });
  text(g, 'Student probabilities', rightPage, 285, 39, C.green);
  distributionPage(g, rightPage, trace[0].probs, C.green, { highlightCat: answered });
  if (beat(k) === 3) text(g, 'Each distribution sums to one.', leftPage, 952, 43, C.muted);
  else if (answered) {
    const cat = WORDS.indexOf('cat');
    text(g, 'Cat has ' + (100 * (trace[0].probs[cat] - target[cat])).toFixed(1) +
      ' percentage points more in the student.', leftPage, 952, 43, C.pink);
  } else serif(g, 'Which word gets the largest excess from the student?', leftPage, 952, 50);
}

export function temperature(g, k) {
  paper(g);
  const t = 1 + 3 * at(k, 1, 'Raise it from one to four', 1.4);
  const q = sm(TEACHER, t),
    p = sm(INITIAL, t),
    limit = at(k, 3, 'One quarter');
  heading(
    g,
    'The child saw a   /   four possible next words',
    'Keep the scores. Change the temperature.',
  );
  num(g, 'T = ' + t.toFixed(1), 134, 316, 42, C.green);
  text(g, 'Teacher', 630, 315, 35, C.blue);
  text(g, 'Student', 868, 315, 35, C.green);
  text(g, 'p = softmax(z / T)      T > 0', 1770, 314, 34, C.muted, 'right');
  WORDS.forEach((word, i) => {
    const x = 185 + 420 * i,
      base = 727;
    vignette(g, i, x, 365, 286, 148);
    for (const [j, v, color] of [
      [0, q[i], C.blue],
      [1, p[i], C.green],
    ]) {
      const px = x + 87 + 120 * j,
        py = base - 280 * v;
      rect(g, px - 24, py, 48, base - py, color);
      num(g, v.toFixed(3), px, py - 15, 30, color, 'center');
    }
    line(g, x, base, x + 286, base, C.root, 2);
    serif(g, word, x + 143, 803, 51, C.root, 'center');
    num(g, 'z   ' + TEACHER[i] + '  /  ' + INITIAL[i], x + 143, 864, 29, C.muted, 'center');
    if (limit) {
      const y = base - 280 * 0.25;
      g.save();
      g.setLineDash([10, 7]);
      line(g, x, y, x + 286, y, C.gold, 3);
      g.restore();
    }
  });
  if (limit)
    text(
      g,
      'Dashed line   ·   each probability approaches ¼ as T grows',
      960,
      955,
      36,
      C.gold,
      'center',
    );
}

export function contributions(g, k) {
  paper(g);
  const start = at(k, 1, 'For each token', 2);
  const count = beat(k) > 1 ? 4 : Math.min(4, Math.ceil(4 * start));
  heading(
    g,
    'Forward KL   /   teacher q, student p   /   temperature 1',
    'What does each word add?',
  );
  const y = (v) => 704 - v * 380;
  line(g, 118, 704, 1780, 704, C.edge, 3);
  text(g, '0', 86, 715, 27, C.muted);
  let total = 0;
  WORDS.forEach((word, i) => {
    const x = 174 + i * 425;
    serif(g, word, x, 820, 49);
    num(
      g,
      'q ' + target[i].toFixed(3) + '   p ' + trace[0].probs[i].toFixed(3),
      x,
      875,
      27,
      C.muted,
    );
    if (i >= count) return;
    const prev = total;
    total += terms[i];
    const col = terms[i] > 0 ? C.green : C.pink;
    rect(g, x, Math.min(y(prev), y(total)), 200, Math.abs(y(prev) - y(total)), col);
    if (i < count - 1) line(g, x + 200, y(total), x + 425, y(total), C.muted, 2);
    num(g, signed(terms[i]), x + 99, Math.min(y(prev), y(total)) - 15, 37, col, 'center');
  });
  num(g, 'Σ q[i] ln(q[i] / p[i])', 122, 302, 47);
  if (count)
    text(
      g,
      (count === 4 ? 'KL' : 'Partial sum') + '   ' + total.toFixed(3) + ' nats',
      1750,
      300,
      46,
      C.green,
      'right',
    );
  if (beat(k) === 5)
    text(
      g,
      'Frozen teacher    ·    soft cross-entropy = KL + H(q)',
      960,
      959,
      36,
      C.muted,
      'center',
    );
}

function illustratedRow(g, values, x, y, w, h) {
  let offset = x;
  values.forEach((p, i) => {
    const width = w * p;
    vignette(g, i, offset, y, width, h);
    line(g, offset, y, offset, y + h, C.paper, 3);
    offset += width;
  });
}
function updateState(k, replay) {
  if (replay) {
    const progress = at(k, 1, 'Its share now moves', 3.1);
    return Math.floor(40 * progress ** 2);
  }
  const progress = at(k, 2, 'one update', 1);
  const bird = at(k, 2, 'several more', 1.6),
    dog = at(k, 2, 'Dog passes cat', 0),
    end = at(k, 2, 'as the divergence shrinks', 1.8);
  if (beat(k) >= 4) return at(k, 4, 'descent subtracts') ? 13 : 12;
  return Math.max(Math.floor(progress), Math.floor(4 * bird), dog ? 7 : 0, Math.floor(12 * end));
}
export function fit(g, k, replay = false) {
  paper(g);
  const step = updateState(k, replay),
    r = trace[step],
    cat = 2;
  heading(g, 'One fitted prefix   /   temperature 1', 'The child saw a');
  const winner = WORDS[r.probs.indexOf(Math.max(...r.probs))];
  serif(g, winner + '.', 667, 207, 84, C.green);
  text(g, 'Teacher', 120, 313, 35, C.blue);
  text(g, 'Student    ·    update ' + step, 120, 612, 35, C.green);
  if (replay && at(k, 1, 'forty updates') && !at(k, 1, 'Its share now moves'))
    text(g, 'Will cat’s share rise or fall?', 1360, 612, 42, C.green, 'right');
  illustratedRow(g, target, 120, 348, 1240, 158);
  illustratedRow(g, r.probs, 120, 646, 1240, 158);
  text(g, 'Probability of cat', 1430, 311, 33, C.muted);
  num(g, percent(target[cat], 2), 1430, 440, 62, C.blue);
  num(g, percent(r.probs[cat], 2), 1430, 745, 62, C.green);
  num(g, 'KL   ' + r.loss.toFixed(5) + ' nats', 123, 903, 38);
  if (!replay) {
    const grad = trace[12].probs[cat] - target[cat];
    if (beat(k) === 3) text(g, 'Next cat score   ↑ or ↓ ?', 1730, 904, 39, C.green, 'right');
    if (beat(k) === 4)
      num(
        g,
        'cat z   ' +
          trace[12].logits[2].toFixed(3) +
          (step === 13 ? ' → ' + r.logits[2].toFixed(3) : '') +
          '     gradient at 12 = ' +
          signed(grad),
        1760,
        904,
        36,
        C.green,
        'right',
      );
  } else if (beat(k) > 1) {
    text(
      g,
      beat(k) === 2
        ? 'Evidence covers this prefix'
        : 'Release needs fresh requests and device measurements',
      1760,
      903,
      34,
      C.green,
      'right',
    );
  }
}
export function scaling(g, k) {
  paper(g, true);
  const soft = binary(4).scaled,
    hard = binary(1).p - 1;
  const mixing = beat(k) >= 6;
  heading(
    g,
    'Detached teacher [2, 0]    /    student [0, 2]',
    mixing ? 'Who supplies the target?' : 'The gradient on the first student logit',
    true,
  );
  if (!mixing) {
    const columns = [177, 500, 800, 1140, 1535],
      data = [1, 4, 40];
    ['T', 'Teacher q', 'Student p', '(p − q) / T', 'T × (p − q)'].forEach((s, i) =>
      text(g, s, columns[i], 335, 35, C.faint),
    );
    data.forEach((t, i) => {
      const visible =
        i === 0 || (i === 1 && at(k, 3, 'move to four')) || (i === 2 && at(k, 4, 'Try forty'));
      if (!visible) return;
      const { q, p, raw, scaled } = binary(t),
        y = 462 + i * 139;
      line(g, 148, y + 28, 1790, y + 28, '#47625e', 2);
      [
        t,
        q.toFixed(3),
        p.toFixed(3),
        signed(raw, 4),
        at(k, 2, 'Multiply the soft loss') ? signed(scaled, 4) : '',
      ].forEach((s, j) => num(g, s, columns[j], y, 47, j === 4 ? C.brass : C.white));
    });
    text(
      g,
      beat(k) >= 5
        ? 'Large T limit    ·    [(0 − 1) − (2 − 1)] / 2 = −1'
        : 'q and p use the same T. The derivative is with respect to the undivided score.',
      147,
      904,
      36,
      C.teal,
    );
  } else {
    const alpha = at(k, 7, 'Turn up alpha', 2) * 0.8,
      grad = (1 - alpha) * hard + alpha * soft;
    text(g, 'First-token gradient', 144, 320, 37, C.teal);
    num(g, 'Hard  [1, 0]    T = 1     ' + signed(hard), 144, 440, 47, C.white);
    if (at(k, 6, 'The other token'))
      text(g, 'Second token   ' + signed(-hard), 1736, 438, 34, C.teal, 'right');
    num(g, 'Scaled KL       T = 4     ' + signed(soft), 144, 543, 47, C.white);
    const x = 148,
      w = 1000;
    line(g, x, 699, x + w, 699, '#839993', 8);
    dot(g, x + w * alpha, 699, 24, C.brass);
    num(g, 'α = ' + alpha.toFixed(2), 1245, 713, 55, C.brass);
    text(g, 'Trusted label', x, 776, 34, C.faint);
    text(g, 'Scaled teacher loss', x + w, 776, 34, C.faint, 'right');
    num(g, '(1 − α) × hard + α × scaled = ' + signed(grad), 148, 893, 41, C.teal);
  }
}
