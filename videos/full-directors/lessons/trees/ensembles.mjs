import {
  C,
  background,
  txt,
  sub,
  math,
  box,
  line,
  path,
  jewel,
  dot,
  glass,
  cue,
  mix,
  neat,
  signed,
  clamp,
} from './glass.mjs';
import {
  votes,
  rows,
  targets,
  boost,
  mean,
  squareError,
  newtonRound,
  validationAfterBoosting,
  stump,
  requests,
} from './model.mjs';

export function forestScene(g, k) {
  const b = k.beat.beatIndex,
    cover = cue(k, 5, 'Cover the tree that trained on R3', 0.85);
  const cards = votes(cover === 1),
    used = cards.filter((v) => v.eligible);
  background(
    g,
    'Bootstrap forest',
    b >= 4 ? 'Which trees can score R3 out of bag?' : 'Follow R3 through three trees',
  );
  const amount = cue(k, 0, 'Give each tree eight draws', 2.5);
  const opened = cue(k, 1, 'Its ambiguity is two', 1);
  const outside = cue(k, 1, 'Both send it', 1.3);
  const middle = cue(k, 1, 'The middle tree tests support', 1.5);
  cards.forEach(({ member, i, sample, score }) => {
    const cx = 360 + i * 600,
      x = cx - 233;
    txt(g, 'Tree ' + (i + 1), cx, 264, 39, C.ink, 'center', 'Serif');
    const count = Math.max(1, Math.ceil(8 * amount));
    for (let j = 0; j < 8; j++) {
      const col = x + (j % 4) * 121,
        y = 306 + Math.floor(j / 4) * 52;
      box(g, col, y, 104, 43, C.slate, C.line, 1);
      if (j < count)
        txt(
          g,
          'R' + (sample[j] + 1),
          col + 52,
          y + 22,
          26,
          sample[j] === 2 && cover > 0 ? C.amber : C.ink,
          'center',
          'Mono',
        );
    }
    const left = rows[2][member.feature] <= member.cut,
      side = left ? -1 : 1;
    const travel = i === 1 ? middle : outside;
    const criterion = member.feature ? 'Support' : 'Ambiguity';
    txt(g, criterion + ' ≤ ' + neat(member.cut), cx, 456, 31, C.dim, 'center');
    const rootY = 545,
      bottom = 700,
      dx = 137;
    [-1, 1].forEach((sign) => {
      const chosen = travel === 1 && side === sign;
      line(g, cx, rootY, cx + dx * sign, bottom, chosen ? C.amber : C.line, chosen ? 8 : 5);
      dot(g, cx + dx * sign, bottom, 13, chosen ? C.ink : C.line);
      txt(g, sign < 0 ? 'Yes' : 'No', cx + sign * 159, 624, 24, C.dim, 'center');
    });
    if (opened) {
      const flight = travel,
        xx = cx + side * dx * flight,
        yy = mix(rootY, bottom, flight);
      jewel(g, xx, yy, 1, 24);
      txt(g, 'R3', xx + 36, yy - 17, 24);
      math(g, 'R3  ·  ' + rows[2][member.feature], cx, rootY - 49, 27, C.ink, 'center');
    }
    if (travel === 1) {
      const group = sample
          .map((j) => rows[j])
          .filter((r) => r[member.feature] <= member.cut === left),
        positive = group.filter((r) => r[2]).length;
      math(g, positive + ' / ' + group.length + '  =  ' + score, cx, 787, 36, C.ink, 'center');
    }
    if (i === 1 && cover > 0) {
      const h = 405 * cover;
      g.save();
      g.beginPath();
      g.rect(x - 7, 424, 492, h);
      g.clip();
      box(g, x - 7, 424, 492, 405, '#29373d', C.edge, 4);
      for (let y = 431; y <= 820; y += 40) {
        line(g, x - 4, y, x + 480, y, '#35474c', 5);
      }
      box(g, x + 23, 559, 432, 112, '#29373d');
      txt(g, 'Trained on R3', cx, 597, 34, C.amber, 'center', 'Serif');
      txt(g, 'Exclude this tree', cx, 643, 28, C.dim, 'center');
      g.restore();
    }
  });
  const ready = cue(k, 2, 'Only the middle tree contributed', 0.05) > 0;
  const oob = cue(k, 5, "That's R3's out-of-bag score", 0.02) > 0;
  const sum = used.reduce((s, v) => s + v.score, 0);
  if (b < 4 && ready)
    math(
      g,
      'Full forest     (' +
        used.map((v) => v.score).join(' + ') +
        ') / ' +
        used.length +
        '  =  ' +
        sum +
        '/' +
        used.length,
      960,
      226,
      43,
      C.amber,
      'center',
    );
  else if (b >= 4 && oob)
    math(
      g,
      'Out of bag     (' +
        used.map((v) => v.score).join(' + ') +
        ') / ' +
        used.length +
        '  =  ' +
        sum / used.length,
      960,
      226,
      43,
      C.blue,
      'center',
    );
  else if (b === 4 || b === 5)
    txt(
      g,
      cover === 1 ? 'Two eligible trees' : 'Which sample contains R3?',
      960,
      226,
      43,
      C.ink,
      'center',
      'Serif',
    );
  else if (b === 1 || b === 2)
    txt(g, 'Average the leaf scores', 960, 226, 41, C.ink, 'center', 'Serif');
  else
    txt(
      g,
      'Draw with replacement   ·   One candidate feature per split',
      960,
      226,
      34,
      C.dim,
      'center',
    );
}

export function residuals(g, k) {
  const b = k.beat.beatIndex;
  const atOne = cue(k, 3, 'The tree proposed thirty more minutes', 0.6);
  background(
    g,
    'Boosting handling time',
    atOne === 1 ? 'Measure the remaining gap' : 'How far will each prediction move?',
  );
  const later = cue(k, 4, 'Each round starts', 3.5);
  const round = b < 4 ? (atOne === 1 ? 1 : 0) : 1 + Math.floor(later * 3);
  const pred = b === 3 ? boost[0].map((v, i) => mix(v, boost[1][i], atOne)) : boost[round];
  const x = (v) => 430 + v * 19.7;
  const showLeaf = cue(k, 1, 'the leaf proposes', 0.5) > 0;
  sub(g, 'Handling minutes', 430, 254);
  for (let t = 0; t <= 60; t += 10) {
    const xx = x(t);
    math(g, t, xx, 322, 29, C.dim, 'center');
    line(g, xx, 351, xx, 678, C.line, 1);
  }
  targets.forEach((v, i) => {
    const y = 405 + i * 113;
    txt(g, 'Request ' + (i + 1), 130, y - 9, 35, C.ink, 'left', 'Serif');
    sub(g, 'Ambiguity ' + [1, 2, 5][i], 130, y + 35);
    line(g, x(0), y, x(60), y, C.line, 6);
    line(g, x(pred[i]), y, x(v), y, C.rose, 10);
    line(g, x(v), y - 24, x(v), y + 24, C.amber, 8);
    dot(g, x(pred[i]), y, 15, C.ink, '#31444d', 3);
    math(g, neat(pred[i], 2), x(pred[i]), y - 40, 30, C.ink, 'center');
    math(g, signed(v - pred[i]), 1788, y, 33, C.rose, 'right');
  });
  sub(g, 'Residual', 1790, 322, 'right');
  if (b === 1 || b === 2) {
    if (showLeaf) {
      sub(g, 'Leaf 1  ·  first two requests', 126, 741);
      math(g, '(−20 − 10) / 2 = −15', 126, 810, 36, C.ink);
      sub(g, 'Leaf 2  ·  last request', 991, 741);
      math(g, b === 2 ? '30 + 0.10 × 30 = ?' : '+30 min', 991, 810, 40, C.amber);
    }
  } else if (b >= 3) {
    txt(g, 'Completed rounds', 122, 738, 35, C.dim);
    for (let i = 1; i <= 4; i++) {
      const xx = 514 + (i - 1) * 76;
      dot(g, xx, 738, 23, i <= round ? C.blue : C.slate, C.faint);
      txt(g, i, xx, 738, 25, i <= round ? C.dark : C.dim, 'center', 'Mono');
    }
    math(
      g,
      'MSE   ' + squareError(targets, pred).toFixed(2) + ' min²',
      1777,
      738,
      40,
      C.ink,
      'right',
    );
    if (b === 3 && atOne === 1) math(g, '60 − 33 = 27 min', 960, 808, 39, C.rose, 'center');
  } else {
    line(g, 150, 755, 150, 805, C.amber, 8);
    sub(g, 'Observed time', 184, 780);
    dot(g, 573, 780, 16, C.ink);
    sub(g, 'Prediction', 611, 780);
    line(g, 953, 780, 1066, 780, C.rose, 8);
    sub(g, 'Gap to the target', 1109, 780);
  }
}

export function classification(g, k) {
  const b = k.beat.beatIndex;
  background(
    g,
    'Boosting review scores',
    b < 4
      ? 'How far should R3’s leaf move?'
      : b === 4
        ? 'What step does each leaf propose?'
        : 'What changed at the routing cutoff?',
  );
  if (b < 5) {
    const groups = newtonRound(0);
    groups.forEach((state, i) => {
      const x = i === 0 ? 117 : 1125;
      txt(g, i ? 'Right leaf' : 'R3’s leaf', x, 289, 42, C.ink, 'left', 'Serif');
      const w = i ? 680 : 910;
      glass(g, x, 346, w, 156, null);
      state.group.forEach((r, j) => {
        const id = rows.indexOf(r) + 1,
          xx = x + ((j + 0.5) * w) / state.group.length;
        jewel(g, xx, 408, r[2], 24);
        txt(g, 'R' + id, xx, 466, 30, C.ink, 'center', 'Mono');
        const showRs =
          (i === 0 && (r[2] ? cue(k, 0, 'R3 contributes plus a half', 0.6) === 1 : b >= 1)) ||
          (i === 1 && cue(k, 4, 'three reviews all pull upward', 0.5) > 0);
        if (showRs) math(g, signed(state.rs[j]), xx, 558, 31, C.rose, 'center');
        if (
          (i === 0 && cue(k, 2, 'Each row contributes', 0.6) > 0) ||
          (i === 1 && cue(k, 4, 'Divide by three quarters', 0.3) > 0)
        )
          math(g, state.cs[j].toFixed(2), xx, 625, 30, C.blue, 'center');
      });
      const sums =
        i === 0
          ? cue(k, 2, 'Five quarters go in the denominator', 0.7) === 1
          : cue(k, 4, 'the step is plus two', 0.7) === 1;
      if (sums) {
        line(g, x + 15, 674, x + w - 15, 674, C.faint, 2);
        const step = i === 0 ? cue(k, 4, "That's one approximate Newton step", 0.1) > 0 : sums;
        math(
          g,
          signed(state.sum) +
            ' / ' +
            state.curvature.toFixed(2) +
            ' = ' +
            (step ? signed(state.step) : '?'),
          x + w / 2,
          756,
          41,
          step ? C.amber : C.ink,
          'center',
        );
      }
    });
    txt(g, 'Residual   y − p', 128, 219, 33, C.rose);
    txt(g, 'Curvature   p(1 − p)', 684, 219, 33, C.blue);
    txt(g, 'Starting probability   0.50', 1788, 219, 33, C.dim, 'right');
    return;
  }
  const applied = cue(k, 5, 'convert back to probability', 0.6) === 1;
  const cycle = cue(k, 5, 'From round one through round four', 3.6);
  const round = applied ? 1 + Math.floor(3 * cycle) : 0,
    state = newtonRound(round);
  sub(g, 'Current review score', 158, 293);
  const x = (p) => 268 + p * 1384,
    y = 527;
  glass(g, x(0), y - 14, 692, 28);
  glass(g, x(0.5), y - 14, 692, 28, true);
  line(g, x(0.5), y - 80, x(0.5), y + 66, C.amber, 4);
  math(g, '0.50 cutoff', x(0.5), y + 105, 29, C.amber, 'center');
  state.forEach((leaf, i) => {
    const a = x(leaf.p),
      xx = i === 0 ? Math.min(a - 25, 820) : Math.max(a + 25, 1090),
      align = i ? 'left' : 'right';
    dot(g, a, y + (i ? 11 : -11), 14, i ? C.amber : C.blue);
    txt(
      g,
      (i ? 'Right' : 'Left') + ' leaf   ' + leaf.p.toFixed(3),
      xx,
      391,
      38,
      i ? C.amber : C.blue,
      align,
    );
    math(g, 'logit   ' + signed(leaf.logit), xx, 448, 29, C.dim, align);
  });
  const stats = validationAfterBoosting(round);
  math(g, 'Round ' + round, 159, 751, 42);
  math(g, 'Validation log loss   ' + stats.loss.toFixed(3), 1777, 751, 42, C.ink, 'right');
  if (b === 5 && round === 1) {
    const first = newtonRound(0);
    first.forEach((leaf, i) =>
      math(
        g,
        '0 + 0.10 × (' + signed(leaf.step) + ') = ' + signed(state[i].logit),
        i ? 1780 : 140,
        815,
        35,
        i ? C.amber : C.blue,
        i ? 'right' : 'left',
      ),
    );
  }
  if (b === 6)
    txt(
      g,
      'V3 and V8 still fall below the cutoff.     Misses   $' + stats.cost,
      960,
      815,
      40,
      C.rose,
      'center',
      'Serif',
    );
}
