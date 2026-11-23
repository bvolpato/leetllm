import {
  C,
  word,
  mono,
  title,
  heading,
  rect,
  dot,
  line,
  arrow,
  ticket,
  stack,
  band,
  pct,
  f,
  ease,
} from './studio.mjs';
import {
  ratings,
  ballots,
  unbalanced,
  single,
  fleiss,
  separate,
  cohenKappa,
  pool,
  binaryMeasures,
  selectionItems,
  nameOf,
  byUncertainty,
  steps,
  links,
  ruler,
  rulerScore,
  radius,
  clusterMean,
  medoidCandidates,
  medoid,
  auditTicket,
  auditInclusion,
  auditWeight,
  closest,
  trial,
  cost,
  threshold,
} from './cases.mjs';

export function matrix(g, m, x, y, cell, labels, highlight = null, diagonal = false) {
  const n = m.length;
  mono(g, 'Reviewer 2', x + (cell * n) / 2, y - 54, 15, C.blue, 'center');
  for (let i = 0; i < n; i++) {
    mono(g, labels[i], x + (i + 0.5) * cell, y - 18, 17, C.blue, 'center');
    mono(g, labels[i], x - 25, y + (i + 0.5) * cell, 17, C.ink, 'center');
    for (let j = 0; j < n; j++) {
      const hit = highlight && i === highlight[0] && j === highlight[1],
        diag = diagonal && i === j;
      const fill = hit ? C.honey : diag ? C.greenWash : C.white;
      rect(g, x + j * cell, y + i * cell, cell - 3, cell - 3, fill, C.line, 4);
      word(g, m[i][j], x + (j + 0.5) * cell, y + (i + 0.5) * cell, cell * 0.44, diag ? C.green : C.ink, {
        align: 'center',
        face: 'Mono',
      });
    }
  }
}
export function agreement(g, { b, cue }) {
  const n = cue(3, 'Row A, column B') ? 120 : cue(1, 'Add one') ? 119 : 118;
  const a = ballots(n),
    diagonal = cue(3, 'Follow the diagonal');
  heading(g, 'One pair, one cell', 'INDEPENDENT BALLOTS');
  mono(g, 'Reviewer 1', 48, 155, 13, C.muted);
  matrix(
    g,
    a.m,
    152,
    173,
    70,
    ratings,
    n === 118 || diagonal || b === 2 ? null : n === 119 ? [0, 0] : [0, 1],
    diagonal,
  );
  for (let i = 0; i < 3; i++) {
    mono(g, a.sums[i], 391, 208 + 70 * i, 18, C.blue, 'center');
    mono(g, a.cols[i], 187 + 70 * i, 408, 18, C.blue, 'center');
  }
  mono(g, 'Σ', 391, 153, 17, C.blue, 'center');
  mono(g, 'Σ', 126, 408, 17, C.blue, 'center');
  mono(g, 'Cases counted    ' + n, 65, 458, 18, C.ink);
  if (b <= 2 || !diagonal) {
    const next = b === 1 ? 119 : 120;
    title(g, 'Ballot ' + next, 490, 151, 29);
    const y = 190;
    [
      [1, 'A'],
      [2, b === 1 ? 'A' : 'B'],
    ].forEach(([r, v], i) => {
      const xx = 490 + i * 201;
      ticket(g, xx, y, 174, 107);
      mono(g, 'Reviewer ' + r, xx + 13, y + 24, 14);
      const voted =
        b === 1
          ? cue(1, i ? 'the second picks A' : 'the first reviewer picks A')
          : cue(2, i ? 'The second picks B' : 'first reviewer picks A');
      word(g, voted ? v : '·', xx + 86, y + 72, 39, C.ink, { align: 'center' });
    });
    if (b === 2) word(g, 'Which cell gets this pair?', 493, 355, 24);
  } else {
    const x = 474;
    if (b === 3) {
      title(g, 'Matching votes', x, 153, 29);
      mono(g, '42 + 38 + 27 = ' + a.diag, x, 228, 22, C.green);
      if (cue(3, 'Divide by'))
        word(g, a.diag + ' / ' + n + '  ≈  ' + pct(a.observed), x, 319, 33, C.green);
    } else if (b <= 5) {
      title(g, 'Chance matches', x, 153, 29);
      const terms = a.sums.map((r, i) => r + ' × ' + a.cols[i]);
      (b === 4 ? terms.slice(0, 1) : terms).forEach((v, i) =>
        mono(g, ratings[i] + '   ' + v + ' / 120²', x, 218 + i * 48, 21),
      );
      if (cue(5, 'about thirty-four')) word(g, 'Total  ≈  ' + f(a.expected, 3), x, 391, 28, C.green);
    } else if (b === 6) {
      title(g, 'Cohen’s kappa', x, 150, 31);
      mono(g, 'observed − chance', x + 16, 217, 22);
      line(g, x, 243, x + 287, 243, C.ink, 2);
      mono(g, '1 − chance', x + 55, 269, 22);
      if (cue(6, 'point eight three five')) {
        word(g, f(a.kappa, 3), x, 350, 40, C.green);
        word(g, '≥  ' + f(threshold), x + 157, 350, 26);
      }
    } else {
      title(g, 'Reopen the ballots', x, 153, 27);
      band(g, a.disagreements + ' disagreements', x, 211, 385, C.red, C.redWash);
      word(g, 'Sign-off in dispute → open the record', x, 287, 19);
      word(g, 'Ambiguous rule → revise and retest', x, 333, 19);
      if (cue(7, 'Sample the agreements'))
        band(g, 'Agreements also need spot checks', x, 390, 389, C.green, C.greenWash);
    }
  }
}
export function chance(g, { b, cue }) {
  if (b <= 2) {
    const all = cue(2, 'approve every case'),
      rates = all ? [1, 1] : [0.92, 0.88],
      st = all ? single : unbalanced;
    heading(g, 'How often would these reviewers match by chance?', 'TWO NAMED REVIEWERS');
    rates.forEach((p, i) => {
      const y = 149 + i * 79;
      mono(g, 'R' + (i + 1), 48, y + 14, 18);
      rect(g, 110, y, 577, 28, C.redWash);
      rect(g, 110, y, 577 * p, 28, C.blue);
      word(g, pct(p) + ' approve', 717, y + 13, 22, C.blue);
    });
    mono(
      g,
      'P(chance match)  =  ' +
        rates.map((v) => f(v)).join(' × ') +
        '  +  ' +
        rates.map((v) => f(1 - v)).join(' × '),
      47,
      326,
      19,
    );
    if (cue(1, 'point eight one nine two'))
      word(g, 'Chance   ' + f(st.expected, 4), 46, 390, 26, C.blue);
    if (b === 2) {
      word(g, 'Observed   ' + f(st.observed), 322, 390, 26);
      if (cue(2, 'point one one five'))
        word(
          g,
          all ? 'κ  undefined   (0/0)' : 'κ   ' + f(st.kappa, 3),
          615,
          390,
          26,
          all ? C.red : C.green,
        );
      if (all) mono(g, '100 cases each   ·   approve 100, reject 0', 48, 451, 17, C.muted);
    }
    return;
  }
  if (b <= 5) {
    heading(g, 'Three votes per item', 'FLEISS’ KAPPA  /  POOLED CATEGORIES');
    const colors = [C.blue, C.green, C.red],
      x = 56;
    const name = ['A', 'B', 'Tie'];
    fleiss.rows.forEach((r, i) => {
      const y = 146 + i * 67;
      mono(g, 'Item ' + (i + 1), x, y, 15);
      let k = 0;
      r.forEach((n, j) => {
        for (let z = 0; z < n; z++) {
          const xx = x + 120 + k++ * 49;
          dot(g, xx, y, 17, colors[j]);
          word(g, name[j], xx, y, 13, C.white, { align: 'center', weight: 700 });
        }
      });
      if (b >= 4) mono(g, fleiss.agreements[i] === 1 ? '6 / 6' : '2 / 6', 349, y, 18, C.ink);
    });
    if (b === 3) {
      title(g, 'Count votes by category', 508, 171, 27);
      word(g, 'The people may change across items.', 509, 235, 20);
      mono(g, 'Each item has 3 votes.', 510, 302, 17);
    } else if (b === 4) {
      title(g, 'Within each item', 497, 158, 29);
      mono(g, 'Σ n(n − 1) / (3 × 2)', 496, 232, 22);
      word(g, 'Mean agreement', 498, 316, 22);
      if (cue(4, 'two thirds')) mono(g, '2 / 3', 500, 373, 32, C.green);
    } else {
      title(g, 'Across all 12 votes', 495, 146, 28);
      fleiss.counts.forEach((v, i) => {
        dot(g, 520 + i * 119, 207, 12, colors[i]);
        mono(g, name[i] + ' ' + v, 539 + i * 119, 207, 16);
      });
      mono(g, 'Chance   (4² + 5² + 3²) / 12²', 498, 273, 17);
      mono(g, '= 50 / 144', 498, 314, 21);
      if (cue(5, 'twenty-three over'))
        word(g, 'κ   23/47  ≈  ' + f(fleiss.kappa, 3), 498, 391, 26, C.green);
    }
    return;
  }
  if (b === 6) {
    heading(g, 'Keep two marginals or pool them?', 'SAME TWO REVIEWERS');
    matrix(g, separate, 122, 196, 72, ['A', 'B'], null, true);
    mono(g, '100 cases', 130, 374, 18);
    const chance = cohenKappa(separate);
    title(g, 'Separate', 391, 149, 26);
    mono(g, '(.90 × .50) + (.10 × .50)', 391, 195, 20);
    if (cue(6, 'one half')) mono(g, '= ' + f(chance.expected), 391, 234, 21, C.blue);
    if (cue(6, 'Pool the ratings')) {
      title(g, 'Pooled', 391, 291, 26);
      mono(g, '(.70 × .70) + (.30 × .30)', 391, 338, 20);
      if (cue(6, 'point five eight')) mono(g, '= ' + f(0.7 ** 2 + 0.3 ** 2), 391, 380, 21, C.green);
    }
    return;
  }
  heading(g, 'What kind of disagreement?', 'DISTANCE AND MISSING RATINGS');
  const x = 100,
    y = 233,
    w = 584;
  [1, 2, 3, 4].forEach((n, i) => {
    line(g, x + (i * w) / 3, y - 12, x + (i * w) / 3, y + 12, C.ink, 2);
    mono(g, n, x + (i * w) / 3, y + 36, 23, C.ink, 'center');
  });
  line(g, x, y, x + w, y, C.ink, 2);
  arrow(g, x, y - 36, x + w / 3, y - 36, C.blue, 3);
  word(g, 'One step', x + 43, y - 68, 20, C.blue);
  arrow(g, x, y + 85, x + w, y + 85, C.red, 3);
  word(g, 'Three steps', x + 237, y + 118, 20, C.red);
  word(g, 'Choose a nominal or ordinal distance for alpha.', 83, 437, 22);
}
export function uncertain(g, { b, cue }) {
  const travel = ease(cue(2, 'Queue the pairs', 0.8)),
    x = 235,
    w = 455,
    y = 145;
  heading(g, 'Two places for four questions', 'PREDICTED PREFERENCE FOR REPLY A');
  line(g, x + w / 2, y - 27, x + w / 2, y + 235, C.green, 2, [4, 4]);
  mono(g, 'even', x + w / 2, y - 40, 13, C.green, 'center');
  const ordered = pool.toSorted((a, b) => b.uncertainty - a.uncertainty).slice(0, 2);
  rect(g, 734, 126, 183, 194, C.night, null, 7);
  mono(g, 'REVIEW INBOX', 752, 151, 13, C.mint);
  ordered.forEach((v, i) => {
    const sy = 180 + i * 68;
    rect(g, 747, sy, 158, 44, '#294651', null, 4);
    if (!travel) mono(g, 'empty', 826, sy + 22, 14, C.fog, 'center');
  });
  for (let i = 0; i < pool.length; i++) {
    const it = pool[i],
      py = y + i * 62,
      xx = x + w * it.probability;
    word(g, it.label, 43, py, 17);
    line(g, x, py, x + w, py, C.line, 2);
    dot(g, xx, py, 8, C.blue);
    rect(g, xx - 23, py - 28, 46, 21, C.paper, null, 4);
    mono(g, pct(it.probability), xx, py - 18, 14, C.blue, 'center');
    const place = ordered.indexOf(it);
    if (travel > 0 && place >= 0) {
      const sx = xx + (747 - xx) * travel,
        sy = py + (180 + 68 * place - py) * travel;
      g.save();
      g.globalAlpha = travel;
      ticket(g, sx, sy, 158, 44, C.greenWash, C.green);
      word(g, it.label, sx + 79, sy + 23, 16, C.green, { align: 'center', max: 147 });
      g.restore();
    }
  }
  mono(g, '0%', x, y + 229);
  mono(g, '100%', x + w, y + 229, 15, C.muted, 'right');
  if (cue(2, 'representative random audit'))
    band(g, 'Random audit  ·  draw across the eligible population', 44, 425, 628, C.blue, C.blueWash);
}
function seats(g, selected) {
  mono(g, 'REVIEW PLACES', 44, 429, 14, C.fog);
  for (let i = 0; i < 4; i++) {
    const x = 194 + i * 181;
    const item = selected[i];
    rect(g, x, 409, 166, 39, item ? '#234b50' : '#18333f', '#48616a', 5);
    mono(g, String(i + 1), x + 11, 429, 14, C.fog);
    word(g, item ? nameOf(item) : 'open', x + 38, 429, 18, item ? C.mint : C.fog);
  }
}

const uncertaintyBatch = byUncertainty.slice(0, steps.length);
const hybridLinks = steps.map(({ selected }) => links(selected));
const longestLinks = hybridLinks.map((rows) => rows.reduce((a, z) => (z.d > a.d ? z : a)));

function scoreComparison(g, { after }) {
  const handoffWins = after(4, 'Handoff takes it', 0, 'Handoff takes it');
  const showHandoff = after(4, 'Its two parts add to point seven nine six', 0, 'Its two parts add');
  const showInjection = after(4, 'Injection comes close at point seven nine one', 0, 'Injection comes close');
  const handoff = hybridLinks[0].find(({ item }) => item === steps[1].chosen.item);
  const injection = hybridLinks[0].find(({ item }) => item === steps[2].chosen.item);
  title(g, 'Who gets the second review?', 449, 133, 28, C.white);
  const x = { uncertainty: 574, distance: 706, total: 916 };
  word(g, 'Uncertainty', x.uncertainty, 178, 18, C.sky);
  word(g, 'Distance', x.distance, 178, 18, C.mint);
  mono(g, '0.6 × U', x.uncertainty, 202, 17, C.sky);
  mono(g, '0.4 × D', x.distance, 202, 17, C.mint);
  mono(g, 'Total', x.total, 202, 17, C.fog, 'right');
  for (const [i, [row, show]] of [[handoff, showHandoff], [injection, showInjection]].entries()) {
    const y = 238 + i * 71;
    const ink = i === 0 && handoffWins ? C.honey : C.white;
    word(g, nameOf(row.item), 449, y, 24, ink);
    mono(g, f(row.u, 3), x.uncertainty, y, 24, C.sky);
    word(g, '+', x.distance - 29, y, 21, C.fog);
    mono(g, f(row.v, 3), x.distance, y, 24, C.mint);
    rect(g, x.uncertainty, y + 23, 240 * row.u, 5, C.sky);
    rect(g, x.distance, y + 23, 240 * row.v, 5, C.mint);
    mono(g, show ? f(row.score, 3) : '?', x.total, y, 25, show ? ink : C.fog, 'right');
  }
  if (showInjection)
    mono(g, 'Handoff leads by ≈ ' + f(handoff.score - injection.score, 3), 449, 377, 19, C.honey);
}

function distanceScale(g, selected, { b, cue, after }) {
  const initial = longestLinks[0];
  const current = longestLinks[selected.length - 1];

  if (selected.length === 2) {
    const showNewScore = after(5, 'Injection scores point seven nine eight', 0, 'Injection scores');
    const injection = steps[2].chosen.item;
    const before = hybridLinks[0].find(({ item }) => item === injection);
    const now = hybridLinks[1].find(({ item }) => item === injection);
    title(g, 'The scale changes', 449, 133, 28, C.white);
    mono(g, 'Longest link before', 449, 172, 17, C.fog);
    mono(g, nameOf(initial.item) + '  ' + f(initial.d) + ' units', 449, 204, 19, C.fog);
    if (b < 5 || !cue(5, 'Keyboard now sets')) return;
    mono(g, 'Longest link now', 723, 172, 17, C.mint);
    arrow(g, 681, 204, 705, 204, C.fog);
    mono(g, nameOf(current.item) + '  ' + f(current.d) + ' units', 723, 204, 19, C.mint);
    word(g, nameOf(injection) + ' stays ' + f(now.d) + ' units from ' + nameOf(now.to) + '.', 449, 252, 22, C.white);
    mono(g, '0.4 × ' + f(before.d) + '/' + f(initial.d) + ' ≈ ' + f(before.v, 3), 449, 296, 20, C.fog);
    mono(g, '0.4 × ' + f(now.d) + '/' + f(current.d) + ' ≈ ' + f(now.v, 3), 449, 333, 20, C.mint);
    if (showNewScore) {
      mono(g, f(now.u, 3), 449, 376, 24, C.sky);
      word(g, '+', 541, 376, 21, C.fog);
      mono(g, f(now.v, 3), 573, 376, 24, C.mint);
      mono(g, '≈ ' + f(now.score, 3), 671, 376, 24, C.white);
    }
    return;
  }

  if (selected.length === 4) {
    title(g, 'All four places are filled', 449, 141, 28, C.white);
    hybridLinks[3].forEach(({ item, to, d }, i) => {
      const y = 223 + i * 66;
      word(g, nameOf(item), 449, y, 23, C.white);
      mono(g, f(d) + ' units from ' + nameOf(to), 585, y, 19, C.mint);
    });
    return;
  }

  title(g, 'Normalize the nearest links', 449, 141, 28, C.white);
  const divide = cue(2, 'Divide the length');
  const showScale = after(2, 'The farthest case gets a distance value of one');
  for (const [i, row] of hybridLinks[selected.length - 1].entries()) {
    const y = 197 + i * 43;
    const ink = row === current && showScale ? C.mint : C.white;
    word(g, nameOf(row.item), 449, y, 21, ink);
    mono(g, f(row.d, 3) + ' units', 590, y, 19, ink);
    if (divide) {
      const normalized = row.d / current.d;
      const ratio = !showScale ? '' : normalized === 1 ? '  =  1' : '  ≈  ' + f(normalized, 3);
      mono(g, '÷ ' + f(current.d, 3) + ratio, 737, y, 19, ink);
    }
  }
  if (selected.length === 3)
    mono(g, 'Keyboard still sets the scale.', 449, 376, 18, C.mint);
}

function compareBatches(g, { cue, after }) {
  title(g, 'What did four reviews buy?', 449, 141, 28, C.white);
  const reveal = after(6, 'Four reviews bought two kinds of case on the first pass and four on the second');
  for (const [i, [name, batch]] of [
    ['Uncertainty only', uncertaintyBatch],
    ['Hybrid', steps.at(-1).selected],
  ].entries()) {
    const y = 213 + i * 100;
    word(g, name, 449, y, 25, C.white);
    if (reveal)
      word(g, new Set(batch.map((item) => item.domain)).size + ' categories', 912, y, 25,
        i ? C.mint : C.sky, { align: 'right' });
    mono(g, batch.map(nameOf).join('  ·  '), 449, y + 37, 17, C.fog);
  }
  if (cue(6, 'compare against random selection'))
    word(g, 'Compare learning on held-out data.', 449, 384, 19, C.white);
}

export function diversity(g, s) {
  const { b, cue, after } = s;
  const top = b === 1;
  let selected = [];
  let placing = 0;
  let next;
  if (top) {
    if (after(1, 'Three canaries and one injection review use the whole budget')) {
      selected = uncertaintyBatch;
    }
  } else if (cue(2, 'Start again with canary one')) {
    selected = steps[0].selected;
    const moves = [
      after(4, 'Seat handoff', 0.55),
      after(5, 'takes the third place', 0.5),
      after(5, 'Keyboard takes the fourth', 0.5, 'Keyboard takes the fourth'),
    ];
    for (const [i, move] of moves.entries()) {
      const step = steps[i + 1];
      if (move < 1) {
        next = step.chosen.item;
        placing = ease(move);
        break;
      }
      selected = step.selected;
    }
  }
  const stretch = ease(cue(2, 'stretch a line', 0.65));
  const comparing = selected.length === 1 && cue(3, 'sixty percent');

  heading(g, 'Four places in the review queue', top ? 'UNCERTAINTY ONLY' : 'HYBRID SELECTION', true);
  const originX = 224;
  const originY = 246;
  const spacing = 29;
  const xy = (item) => [originX + item.xy[0] * spacing, originY - item.xy[1] * spacing];
  for (let i = -4; i <= 4; i += 2) {
    const x = originX + i * spacing;
    const y = originY - i * spacing;
    line(g, x, 102, x, 379, '#29404c');
    line(g, 62, y, 407, y, '#29404c');
  }
  if (b < 6 && stretch && selected.length) {
    const rows = hybridLinks[selected.length - 1];
    const showScale = selected.length === 1
      ? !comparing && cue(2, 'Divide the length')
      : cue(5, 'Keyboard now sets');
    for (const row of rows) {
      const { item, to } = row;
      const [x, y] = xy(item);
      const [X, Y] = xy(to);
      const progress = stretch * (item === next ? 1 - placing : 1);
      const scale = selected.length < 4 && row === longestLinks[selected.length - 1] && showScale;
      const ink = scale ? C.mint : '#59838b';
      line(g, X, Y, X + (x - X) * progress, Y + (y - Y) * progress, ink, scale ? 3 : 1.6);
    }
  }
  const offsets = [[0, 28], [18, 6], [-18, -11], [-49, 1], [1, 22], [0, 23]];
  for (const [i, item] of selectionItems.entries()) {
    const [x, y] = xy(item);
    const [dx, dy] = offsets[i];
    const on = selected.includes(item);
    dot(g, x, y, 8, on ? C.mint : C.sky);
    if (on) dot(g, x, y, 13, null, C.mint, 2);
    if (!on && item === next && placing > 0)
      dot(g, x, y, 8 + 5 * placing, null, C.mint, 2);
    word(g, i < 3 ? String(i + 1) : nameOf(item), x + dx, y + dy, 17, C.white, {
      align: i === 1 ? 'left' : 'center',
    });
  }

  if (top) {
    title(g, 'Rank by uncertainty', 449, 141, 28, C.white);
    byUncertainty.forEach((item, i) => {
      const y = 187 + i * 38;
      word(g, nameOf(item), 449, y, 22, C.white);
      mono(g, f(item.uncertainty), 637, y, 21, C.sky);
    });
  } else if (b === 6) {
    compareBatches(g, s);
  } else if (comparing) {
    scoreComparison(g, s);
  } else if (stretch && selected.length) {
    distanceScale(g, selected, s);
  }
  seats(g, selected);
}

export function scoring(g, { b, cue }) {
  if (b < 5) {
    const p = cue(3, 'point nine seven') ? 0.97 : 0.49;
    const m = binaryMeasures(p);
    heading(g, 'How uncertain is a binary preference?', 'TWO ALTERNATIVES');
    const x = 78,
      w = 803,
      y = 159;
    line(g, x, y, x + w, y, C.line, 12);
    line(g, x + w / 2, y - 17, x + w / 2, y + 19, C.ink);
    dot(g, x + w * p, y, 10, C.blue);
    mono(g, 'P(A) = ' + f(p), Math.min(800, x + w * p), y - 34, 19, C.blue, 'center');
    mono(g, '0', x, y + 30);
    mono(g, '1', x + w, y + 30, 15, C.muted, 'right');
    const metrics = [
      ['Least confidence', '1 − max(p, 1−p)', m.least, 1],
      ['Margin uncertainty', '1 − |2p − 1|', m.margin, 1],
      ['Entropy', '−Σ q log₂ q', m.entropy, 2],
    ];
    metrics.forEach(([name, formula, v, start], i) => {
      if (b < start) return;
      const yy = 245 + i * 79;
      word(g, name, 52, yy, 20);
      mono(g, formula, 277, yy, 17);
      rect(g, 510, yy - 7, 225, 14, C.line, null, 6);
      rect(g, 510, yy - 7, 225 * v, 14, i === 2 ? C.green : C.blue, null, 4);
      mono(g, f(v, i === 2 ? (p === 0.49 ? 4 : 3) : 2) + (i === 2 ? ' bits' : ''), 757, yy, 19, C.ink);
    });
    return;
  }
  if (b === 10) {
    if (!cue(10, 'To estimate a production')) {
      heading(g, 'What does a 40% failure rate describe?', 'TARGETED REVIEW');
      title(g, 'Targeted review queue', 59, 144, 29);
      for (let i = 0; i < 10; i++) {
        const xx = 70 + i * 80;
        ticket(g, xx, 217, 67, 88, i < 4 ? C.redWash : C.greenWash);
        word(g, i < 4 ? 'Fail' : 'Pass', xx + 33, 263, 17, i < 4 ? C.red : C.green, { align: 'center' });
      }
      word(g, '4 / 10 selected cases', 65, 373, 25, C.red);
      word(g, 'Production failure rate   ?', 514, 373, 25);
      return;
    }
    heading(g, 'How do we weight a sampled case?', 'ESTIMATING A PRODUCTION RATE');
    for (let i = 0; i < 40; i++) {
      const x = 65 + (i % 10) * 39,
        y = 161 + Math.floor(i / 10) * 45;
      dot(g, x, y, 9, i % 9 === 1 ? C.red : C.blueWash, C.blue, 1);
    }
    word(g, 'Production population', 65, 355, 24);
    arrow(g, 458, 230, 525, 230, C.ink, 2);
    title(g, 'Probability sample', 547, 167, 29);
    word(g, 'Known, positive inclusion probability', 547, 226, 19);
    if (cue(10, 'Weight each sampled case')) {
      word(g, 'Weight =', 547, 286, 22);
      mono(g, '1', 789, 269, 21, C.ink, 'center');
      line(g, 643, 286, 935, 286, C.ink, 1.5);
      word(g, 'this case’s inclusion probability', 789, 305, 19, C.ink, { align: 'center' });
    }
    if (cue(10, 'Keep that probability'))
      word(g, 'Log the probability and policy with the row.', 545, 367, 18);
    return;
  }
  if (b === 8) {
    heading(g, 'One place, two different objectives', 'SAME THREE RECORDS');
    const X = (v) => 176 + v * 139;
    [
      [1, 'Weighted rule'],
      [2, 'Farthest first'],
    ].forEach(([pick, name], i) => {
      const py = 183 + i * 170,
        chosen = [ruler[0], ruler[pick]],
        missing = ruler.find((r) => !chosen.includes(r));
      const near = chosen.toSorted((a, b) => Math.abs(a.x - missing.x) - Math.abs(b.x - missing.x))[0];
      word(g, name, 46, py - 48, 23);
      line(g, X(0), py, X(5), py, C.line, 2);
      ruler.forEach((r) => {
        dot(g, X(r.x), py, 8, chosen.includes(r) ? C.green : C.blue);
        if (chosen.includes(r)) dot(g, X(r.x), py, 14, null, C.green, 2);
        word(g, r.name, X(r.x), py - 21, 16, C.ink, { align: 'center' });
      });
      line(g, X(near.x), py + 32, X(missing.x), py + 32, i ? C.green : C.red, 3);
      mono(
        g,
        'radius  ' + radius(chosen),
        (X(near.x) + X(missing.x)) / 2,
        py + 58,
        18,
        i ? C.green : C.red,
        'center',
      );
    });
    return;
  }
  const reset = b >= 7;
  const useAppeal = !reset && !!cue(6, 'Mark the appeal'),
    useFar = reset && !!cue(7, 'puts a center at handoff');
  const set = b === 9 ? [] : [ruler[0], ...(useAppeal ? [ruler[1]] : useFar ? [ruler[2]] : [])];
  if (b === 9)
    heading(g, 'Which real record best represents this cluster?', 'ONE CLUSTER  /  THREE RECORDS');
  else if (reset)
    heading(g, 'How large is the remaining gap?', 'COVERING RADIUS  /  SAME POOL');
  else
    heading(g, 'Which record gets the place?', 'WEIGHTED RULE  /  ONE MORE REVIEW');
  const X = (v) => 95 + v * 148,
    y = 200;
  line(g, X(0), y, X(5), y, C.ink, 3);
  for (let i = 0; i <= 5; i++) {
    line(g, X(i), y - 9, X(i), y + 9, C.ink, 1.5);
    mono(g, i, X(i), y + 35, 16, C.muted, 'center');
  }
  ruler.forEach((r) => {
    dot(g, X(r.x), y, 8, set.includes(r) ? C.green : C.blue);
    if (set.includes(r)) dot(g, X(r.x), y, 16, null, C.green, 2);
    word(g, r.name, X(r.x), y - 37, 20, set.includes(r) ? C.green : C.ink, { align: 'center' });
  });
  if (b <= 6) {
    if (!useAppeal)
      ruler.slice(1).forEach((r, i) => {
        const py = 302 + i * 70;
        mono(g, r.name, 57, py, 17, C.ink);
        mono(g, '0.6 × ' + f(r.u) + '   +   0.4 × ' + r.x + '/5', 203, py, 21);
        if (cue(6, 'The appeal gets it'))
          mono(g, '= ' + f(rulerScore(r)), 669, py, 23, i ? C.muted : C.green);
      });
    if (useAppeal) {
      line(g, X(1), y + 60, X(5), y + 60, C.red, 2);
      mono(g, 'remaining gap   ' + radius(set), X(3), y + 90, 20, C.red, 'center');
      word(g, 'Handoff is closest to the appeal at 1.', 65, 380, 23);
    }
  } else if (b === 7) {
    if (useFar) {
      line(g, X(0), y + 71, X(1), y + 71, C.green, 3);
      word(g, '1 unit', X(0.5), y + 99, 19, C.green, { align: 'center' });
    }
    if (cue(7, 'covering radius is one'))
      band(g, 'Farthest first   ·   radius ' + radius(set), 54, 345, 409, C.green, C.greenWash, 48);
  } else {
    if (cue(9, 'Their mean falls')) {
      dot(g, X(clusterMean), y, 11, C.honey, C.ink);
      word(g, 'Mean', X(clusterMean), y - 37, 20, C.ink, { align: 'center' });
    }
    if (cue(9, 'A medoid')) {
      word(g, 'Add the distances to the seed, appeal and handoff.', 46, 285, 22);
      const totalCues = ['From the appeal', 'From the handoff', 'Compare the totals'];
      medoidCandidates.forEach(({ record, distances, total }, i) => {
        const x = X(record.x);
        mono(g, distances.join(' + '), x, 335, 17, C.muted, 'center');
        if (cue(9, totalCues[i])) mono(g, 'Total ' + total, x, 376, 22, C.ink, 'center');
      });
    }
    const ring = ease(cue(9, 'It is the medoid', 0.4));
    if (ring) {
      g.save();
      g.globalAlpha = ring;
      dot(g, X(medoid.record.x), y, 16, null, C.green, 3);
      word(g, medoid.record.name + ' is the medoid. Its total distance is ' + medoid.total + '.',
        46, 446, 24, C.green);
      g.restore();
    }
  }
}
export function experiment(g, { b, cue, after }) {
  if (b === 6) {
    heading(g, 'How did this case enter the sample?', 'SAMPLING LOG');
    const drawn = cue(6, 'What weight does');
    ticket(g, 54, 132, 405, 254);
    mono(g, 'RANDOM AUDIT', 76, 161, 15, C.blue);
    title(g, drawn ? auditTicket.name : 'Eligible ticket', 76, 211, 30);
    word(g, 'Inclusion probability', 77, 273, 19);
    if (cue(6, 'It draws the password reset'))
      mono(g, pct(auditInclusion), 424, 273, 22, C.blue, 'right');
    line(g, 77, 304, 432, 304);
    if (drawn) {
      word(g, 'Sampling weight', 77, 346, 19);
      const weightKnown = cue(6, 'Store that weight');
      const calculation = weightKnown ? '1 / ' + f(auditInclusion) + ' = ' + auditWeight : '?';
      mono(g, calculation, 424, 346, 20, weightKnown ? C.green : C.muted, 'right');
    }
    if (cue(6, 'The missing approver')) {
      ticket(g, 501, 132, 405, 254);
      mono(g, 'TARGETED REVIEW', 523, 161, 15, C.blue);
      title(g, closest.name, 523, 211, 30);
      word(g, 'Selection rule', 524, 273, 19);
      word(g, 'Closest call', 878, 273, 20, C.ink, { align: 'right' });
      line(g, 524, 304, 879, 304);
      word(g, 'Predicted preference for A', 524, 346, 19);
      mono(g, pct(closest.p), 878, 346, 22, C.blue, 'right');
    }
    return;
  }
  heading(
    g,
    b < 5 ? 'Compare gains from the same checkpoint' : 'Which evaluation can guide tuning?',
    b < 5 ? 'MATCHED SELECTOR TRIAL  /  ILLUSTRATIVE SCORES' : 'EXPERIMENT LOG',
  );
  if (b >= 5) {
    const adaptive = cue(5, 'repeatedly checks the private test');
    ['Training families', 'Validation families', 'Private test families'].forEach((n, i) => {
      const x = 51 + i * 300;
      stack(g, x, 155, 252, 150, i === 2 ? C.blueWash : C.white);
      mono(g, 'SPLIT ' + (i + 1), x + 15, 178, 12);
      title(g, n, x + 15, 223, 23);
      word(g, ['Draw review batches', 'Tune weights', 'Final comparison'][i], x + 15, 265, 18);
    });
    if (adaptive) {
      arrow(g, 780, 327, 780, 363, C.red, 2);
      line(g, 780, 363, 473, 363, C.red, 2);
      arrow(g, 473, 363, 473, 324, C.red, 2);
      word(g, 'Repeated test feedback changes the selector.', 196, 411, 22, C.red);
    }
    return;
  }
  const x1 = 201,
    x2 = 599,
    y = (v) => 376 - (v - 60) * 27;
  mono(g, 'Validation score', 44, 117, 14, C.muted);
  for (const v of [60, 62, 64, 66, 68]) {
    line(g, 120, y(v), 650, y(v), C.line);
    mono(g, v + '%', 96, y(v), 14, C.muted, 'right');
  }
  dot(g, x1, y(trial.start), 8, C.ink);
  word(g, trial.start + '%', x1 - 13, y(trial.start) - 25, 20, C.ink);
  mono(g, 'Start', x1, 414, 15, C.muted, 'center');
  mono(g, trial.count + ' accepted labels', x2, 414, 15, C.muted, 'center');
  let hasGain = false;
  trial.runs.forEach((run, i) => {
    const resultPhrase = i ? 'sixty-eight for hybrid' : 'sixty-four for random';
    const progress = ease(cue(3, resultPhrase, 0.85));
    if (!progress) return;
    hasGain = true;
    const ink = i ? C.green : C.blue;
    const dx = x1 + (x2 - x1) * progress;
    const dy = y(trial.start) + (y(run.end) - y(trial.start)) * progress;
    line(g, x1, y(trial.start), dx, dy, ink, 3);
    dot(g, dx, dy, 7, ink);
    if (!after(3, resultPhrase)) return;

    const gain = run.end - trial.start;
    word(g, run.end + '%  ' + run.name, x2 + 13, y(run.end) - 12, 20, ink);
    if (after(3, 'seven percentage points'))
      mono(g, '+' + gain + ' pp', 879, y(run.end) - 12, 18, ink, 'right');
    if (b === 4) {
      const ratePhrase = i ? 'fifty-seven point one' : 'one hundred and thirty-three point three';
      const formula = trial.count + ' ÷ ' + gain;
      const result = after(4, ratePhrase) ? formula + ' = ' + f(cost(run.end), 1) : formula + ' = …';
      mono(g, result, x2 + 18, y(run.end) + 20, 19, ink);
    }
  });
  if (!hasGain) {
    word(g, 'Both runs', 694, 167, 22);
    ['Same rubric', 'Same reviewers', 'Same settings', 'Paired seeds'].forEach((t, i) =>
      word(g, t, 694, 208 + i * 37, 17, C.muted),
    );
  }
  if (b === 4) {
    const costNote = after(4, 'A harder queue can take longer to review');
    word(
      g,
      costNote
        ? 'Accepted labels per point · total cost also includes review time, rejections and compute.'
        : 'Accepted labels per percentage point',
      54,
      431,
      18,
      C.muted,
    );
  }
}
