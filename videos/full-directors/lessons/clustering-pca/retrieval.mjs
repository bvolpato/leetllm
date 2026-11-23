import {
  xy,
  labels,
  centroids,
  query,
  coarseDistances,
  transferDocuments,
  transferQuery,
} from '../../../films/clustering-pca/fixtures.mjs';
import { distance, pca2 } from '../../../films/clustering-pca/arithmetic.mjs';
import { cosine } from '../../../films/clustering-pca/model.mjs';
import {
  ids,
  names,
  mix,
  between,
  dot,
  times,
  minus,
  plus,
  sum,
  f,
  pair,
  nearIndex,
  cue,
  filingTab,
} from './drawing.mjs';
const normalize = (v) => times(v, 1 / Math.hypot(...v));
const q = [1, 0],
  docs = [
    [1, 0.1],
    [8, 4],
  ];
export const centerMeans = [
  [0.1, 0],
  [0.8, 0.6],
];
export function metricState(t) {
  return docs.map((v) => between(v, normalize(v), t));
}
export function metric(a, k) {
  const b = k.beat.beatIndex,
    n = cue(k, 1, 'Divide each document', 1.35),
    cs = metricState(n);
  const scale = Math.min(520, 860 / cs[1][0]),
    o = [225, 754],
    pt = (v) => [o[0] + scale * v[0], o[1] - scale * v[1]];
  a.title(
    n === 1 ? 'Both document tips sit on the unit circle' : 'A long arrow can win on reach',
    'Dot product and cosine',
  );
  a.line([100, o[1]], [1195, o[1]], a.p.line, 2);
  a.ctx.save();
  a.ctx.beginPath();
  a.ctx.rect(80, 198, 1150, 686);
  a.ctx.clip();
  a.circle(o, scale, null, a.p.faint, 3);
  a.ctx.restore();
  a.arrow(o, pt(q), a.p.brass, 6);
  a.tag('Q', pt(q)[0], o[1] + 44, a.p.brass, 30, 'center');
  cs.forEach((v, i) => {
    const tip = pt(v),
      col = a.group(i);
    a.line(tip, pt([v[0], 0]), col, 2, [7, 8]);
    a.arrow(o, tip, col, 7);
    a.tag(i ? 'Release' : 'Charge', tip[0] + 13, tip[1] - 31, col, 32);
  });
  const first = b === 0 ? cue(k, 0, 'The dot product') : true;
  if (first)
    cs.forEach((v, i) =>
      a.value(
        (i ? 'Release' : 'Duplicate charge') + (n === 1 ? ' · cosine' : ' · dot'),
        f(dot(q, v), n === 1 ? 3 : 2),
        1300,
        324 + i * 173,
        a.group(i),
        62,
      ),
    );
  if (b === 2) a.note('Unit vectors   d² = 2 − 2 cos θ', 1230, 801);
}
function circlePlot(a) {
  const o = [638, 560],
    r = 257,
    pt = (v) => [o[0] + r * v[0], o[1] - r * v[1]];
  a.circle(o, r, null, a.p.line, 3);
  a.line(pt([-1.18, 0]), pt([1.18, 0]), a.p.faint, 2);
  a.line(pt([0, -1.13]), pt([0, 1.18]), a.p.faint, 2);
  a.pin(o, a.p.sub, 5);
  return { o, r, pt };
}
export function spherical(a, k) {
  const b = k.beat.beatIndex;
  a.title(
    b === 0
      ? 'The mean of two unit tips'
      : b < 3
        ? 'Two ways to choose a list'
        : b === 3
          ? 'Return the center to the circle'
          : 'An opposite pair cancels',
    'Ordinary and spherical centers',
  );
  const { o, pt } = circlePlot(a);
  if (b === 0 || b >= 3) {
    const opposite = b === 4,
      v = opposite ? [-1, 0] : [0, 1],
      s = plus(q, v),
      m = times(s, 0.5);
    [q, v].forEach((vec, i) => a.arrow(o, pt(vec), a.group(i), 6));
    a.line(pt(q), pt(v), a.p.line, 2, [5, 7]);
    const summed = b === 3 && cue(k, 3, 'Add the arrows'),
      unitCenter = b === 3 && cue(k, 3, 'Divide their sum', 1.0);
    const current = summed ? between(s, normalize(s), unitCenter) : m;
    if (summed) a.arrow(o, pt(current), a.p.brass, 5);
    a.target(pt(current), 15, a.p.brass);
    a.value(
      opposite
        ? 'Vector sum'
        : unitCenter === 1
          ? 'Normalized sum'
          : unitCenter
            ? 'Normalizing'
            : summed
              ? 'Vector sum'
              : 'Coordinate mean',
      pair(current, 2),
      1120,
      326,
      a.p.brass,
      67,
    );
    a.value('Length', f(Math.hypot(...current), 3), 1120, 562);
    if (opposite) a.note('Zero sum · choose a new seed', 1120, 768);
  } else {
    const direction = cue(k, 1, 'Now compare directions');
    const d2 = centerMeans.map((v) => distance(q, v) ** 2),
      cos = centerMeans.map((v) => cosine(q, v)),
      vals = direction ? cos : d2;
    a.arrow(o, pt(q), a.p.brass, 5);
    a.tag('Q', pt(q)[0] + 29, pt(q)[1] + 23, a.p.brass, 32);
    centerMeans.forEach((v, i) => {
      const end = pt(v),
        from = direction ? o : pt(q);
      if (direction) a.arrow(from, end, a.group(i), 6);
      else a.line(from, end, a.group(i), 5);
      a.pin(end, a.group(i), 10);
      a.tag('C' + i, end[0] + (i ? 22 : -13), end[1] + (i ? -21 : 51), a.group(i), 34);
    });
    vals.forEach((v, i) =>
      a.value(
        'C' + i + (direction ? ' · cosine' : ' · squared distance'),
        f(v, 2),
        1120,
        308 + i * 165,
        a.group(i),
        56,
      ),
    );
    if (cue(k, 1, direction ? 'Cosine picks' : 'The shorter trip') || b > 1)
      a.text(
        'Open C' + (direction ? nearIndex(cos.map((x) => -x)) : nearIndex(d2)),
        1120,
        735,
        60,
        a.p.brass,
        'Serif',
      );
  }
}
const cosineQuery = [1, 2],
  cosineDocs = [
    [1.1, 2.1],
    [2, 1],
  ];
const docMean = times(plus(...cosineDocs), 0.5);
export function angleState(t) {
  const o = times(docMean, t);
  return { o, angles: cosineDocs.map((v) => cosine(minus(cosineQuery, o), minus(v, o))) };
}
export function originShift(a, k) {
  const b = k.beat.beatIndex,
    t = cue(k, 1, 'Subtract the fitted document mean', 1.35),
    { o, angles } = angleState(t);
  const P = ([x, y]) => [140 + x * 270, 832 - y * 270];
  a.title('Move the sight, keep the three points', 'Cosine after centering');
  const starts = P(o);
  if (b >= 2) cosineDocs.forEach((v) => a.line(P(cosineQuery), P(v), a.p.line, 3, [7, 8]));
  [cosineQuery, ...cosineDocs].forEach((v, i) => {
    const c = i ? a.group(i - 1) : a.p.brass;
    a.arrow(starts, P(v), c, 5);
    a.tag(
      i ? 'D' + i : 'Q',
      P(v)[0] + (i ? 18 : -30),
      P(v)[1] + (i ? -25 : 0),
      c,
      30,
      i ? 'left' : 'right',
    );
  });
  a.target(starts, 13, a.p.red);
  a.tag('Origin', starts[0] - 24, starts[1] - 27, a.p.red, 29, 'right');
  angles.forEach((v, i) =>
    a.value('cos(Q, D' + (i + 1) + ')', f(v, 4), 1120, 288 + i * 169, a.group(i), 62),
  );
  if (b === 2)
    a.note(
      'Distances from Q   ' + cosineDocs.map((v) => f(distance(v, cosineQuery), 3)).join('  /  '),
      1120,
      738,
    );
  if (b === 3) {
    a.circle(starts, 24, null, a.p.red);
    a.note('Document at mean → length 0', 1120, 733);
    a.note('Cosine undefined', 1120, 796, a.p.red);
  }
}
const cellOrder = coarseDistances
  .map((v, i) => i)
  .sort((i, j) => coarseDistances[i] - coarseDistances[j]);
export function probe(n) {
  const cells = cellOrder.slice(0, n),
    rows = xy.map((v, i) => i).filter((i) => cells.includes(labels[i])),
    ds = rows.map((i) => distance(xy[i], query));
  return { cells, rows, best: rows[nearIndex(ds)], cost: centroids.length + rows.length };
}
export function boundaryState(y) {
  const q = [2.8, y],
    ds = centroids.map((v) => distance(q, v)),
    tie = Math.abs(ds[0] - ds[1]) < 1e-12;
  const list = tie ? 0 : nearIndex(ds),
    members = xy.map((_, i) => i).filter((i) => labels[i] === list);
  return {
    ds,
    tie,
    list,
    flat: nearIndex(xy.map((v) => distance(v, q))),
    best: members[nearIndex(members.map((i) => distance(q, xy[i])))],
  };
}
function boundary(a, k) {
  const level =
    2.69 + 0.01 * cue(k, 4, 'Slide up', 0.85) + 0.01 * cue(k, 4, 'One hundredth higher', 0.85);
  const s = boundaryState(level),
    point = (y) => [527, 580 - (y - 2.7) * 16200];
  a.title('Cross the routing boundary', 'Vertical slice at x = 2.8 · enlarged');
  a.rect(120, 286, 816, 294, a.p.blue + '16');
  a.rect(120, 580, 816, 248, a.p.teal + '16');
  a.line([120, 580], [936, 580], a.p.line, 3, [8, 9]);
  a.line(point(2.712), point(2.688), a.p.line, 3);
  a.note('Upper list', 161, 347, a.p.blue);
  a.note('Left list', 161, 786, a.p.teal);
  a.target(point(level), 18);
  a.tag('Q   y = ' + f(level, 4), 575, point(level)[1] - 25, a.p.brass, 32);
  a.value(
    'Distance to left  /  upper center',
    f(s.ds[0], 5) + '  /  ' + f(s.ds[1], 5),
    1050,
    289,
    a.p.ink,
    52,
  );
  a.value(
    s.tie ? 'Tie → first center' : 'Nearest center',
    s.list === 0 ? 'Left · A and B' : 'Upper · C and D',
    1050,
    488,
    a.group(s.list),
    53,
  );
  a.text(
    'One probe    ' + ids[s.best] + '     /     Flat search    ' + ids[s.flat],
    1050,
    741,
    40,
    a.p.ink,
    'Serif',
  );
}
export function indexLists(a, k) {
  if (k.beat.beatIndex === 4) return boundary(a, k);
  const b = k.beat.beatIndex,
    first = cue(k, 2, 'Open the upper list'),
    second = cue(k, 3, 'Open the next closest list'),
    s = probe(first + second);
  const compare = cue(k, 1, 'Compare all three');
  a.title('“Why was I charged twice?”', 'IVF · full vectors in each list');
  const groups = ['Left', 'Upper', 'Right'];
  groups.forEach((name, g) => {
    const x = 100 + g * 575,
      y = 389,
      open = s.cells.includes(g),
      c = a.group(g);
    a.note(name + ' center   ' + pair(centroids[g], 1), x, y - 100, c);
    if (compare) a.text('d = ' + f(coarseDistances[g], 3), x, y - 43, 35, a.p.ink, 'Mono');
    a.poly(
      [
        [x, y + 20],
        [x + 25, y],
        [x + 175, y],
        [x + 200, y + 20],
        [x + 489, y + 20],
        [x + 489, y + 269],
        [x, y + 269],
      ],
      a.p.faint + '91',
      c,
      3,
    );
    if (open) {
      [0, 1].forEach((j) => {
        const i = g * 2 + j,
          yy = y + 47 + j * 96;
        a.rect(x + 14, yy, 461, 81, a.p.bg, c, 2);
        a.text(ids[i], x + 32, yy + 41, 33, c, 'Mono');
        a.text(names[i], x + 78, yy + 41, 28, a.p.ink);
        a.text(f(distance(xy[i], query), 3), x + 456, yy + 41, 25, c, 'Mono', 'right');
      });
    } else {
      a.rect(x + 1, y + 64, 487, 205, a.p.bg, c, 3);
      a.rect(x + 183, y + 94, 123, 16, a.p.faint, c, 2);
      a.text(
        'Closed · ' + ids[g * 2] + ' / ' + ids[g * 2 + 1],
        x + 245,
        y + 180,
        38,
        c,
        'Serif',
        'center',
      );
    }
  });
  if (first) {
    const verdict = second ? cue(k, 3, 'B is closer') : cue(k, 2, 'C, the reset link');
    a.note(
      'Document comparisons   ' + s.rows.length + '     ·     Center comparisons   3',
      102,
      727,
    );
    if (verdict)
      a.text(
        'Nearest in open lists   ' + ids[s.best] + ' · ' + names[s.best],
        100,
        804,
        57,
        a.p.teal,
        'Serif',
      );
  } else if (compare) a.note('Flat search returned B.', 100, 811);
}
const workRows = (n, K, probes) => ({
  per: n / K,
  docs: (n / K) * probes,
  total: K + (n / K) * probes,
});
export { workRows };
export function unevenScan(closedLength) {
  const lengths = [1, 4, closedLength], open = [0, 1];
  return { lengths, open, corpus: sum(lengths), docs: sum(open.map((i) => lengths[i])) };
}
export function work(a, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    a.title('Open all three lists', 'IVFFlat · exact distances and consistent ties');
    const n = Math.floor(3 * cue(k, 0, 'probing all lists', 1.5) + 1e-9);
    labels.forEach((g, i) => {
      const x = 147 + g * 577,
        y = 340 + (i % 2) * 158;
      filingTab(a, x, y, 450, ids[i], names[i], a.group(g), cellOrder.slice(0, n).includes(g));
    });
    a.value(
      'Candidates in open lists',
      String(probe(n).rows.length) + ' / 6',
      150,
      738,
      a.p.teal,
      65,
    );
    if (cue(k, 0, 'Compressed IVF codes'))
      a.note('Quantized payloads can change the distance ranking.', 845, 810);
  } else if (b === 1) {
    const lists = 40, probes = 2, v = workRows(9600, lists, probes);
    a.title('9,600 documents in 40 equal lists', 'Balanced posting lists');
    for (let i = 0; i < lists; i++) {
      const x = 139 + (i % 10) * 90,
        y = 305 + Math.floor(i / 10) * 95,
        c = i < probes ? a.p.teal : a.p.faint;
      a.rect(x, y, 56, 54, c);
      if (i < probes) a.text(i + 1, x + 28, y + 28, 29, a.p.bg, 'Mono', 'center');
    }
    a.note('Each list holds ' + v.per + ' documents.', 140, 786);
    const scanned = cue(k, 1, 'Four hundred eighty'),
      total = cue(k, 1, 'Add forty');
    a.value('Document distances', scanned ? String(v.docs) : probes + ' × ' + v.per, 1225, 327, a.p.teal);
    if (total)
      a.value('Including coarse search', v.docs + ' + ' + lists + ' = ' + v.total, 1225, 574, a.p.brass, 56);
  } else if (b === 2) {
    const lists = 4096, probes = 16, doubled = cue(k, 2, 'Double every list'),
      per = doubled ? 200 : 100, v = workRows(lists * per, lists, probes);
    a.title('Sixteen probes out of 4,096 equal lists', 'Balanced posting lists');
    for (let i = 0; i < lists; i++) {
      const x = 183 + (i % 64) * 8, y = 259 + Math.floor(i / 64) * 8;
      a.rect(x, y, 6, 6, i < probes ? a.p.brass : a.p.faint);
    }
    a.value('Share scanned with equal lists', f((100 * probes) / lists, 4) + '%', 974, 280, a.p.brass);
    a.value('Open lists × documents per list', probes + ' × ' + per + ' = ' + v.docs, 974, 472, a.p.teal, 58);
    a.note('Flat routing   ·   4,096 centers', 974, 670);
    if (doubled) a.note('Double each list → double the candidates', 974, 775);
  } else if (b === 3) {
    const add = cue(k, 3, 'Add three documents'),
      s = unevenScan(add ? 4 : 1);
    a.title('Count the documents in the open lists', 'Uneven posting lists');
    s.lengths.forEach((n, i) => {
      const open = s.open.includes(i), y = 346 + i * 153;
      a.text('List ' + i, 125, y, 34, a.p.ink, 'Mono');
      for (let j = 0; j < n; j++)
        a.rect(390 + j * 102, y - 28, 78, 56, open ? a.p.teal : a.p.faint);
      a.text(open ? 'open' : 'closed', 855, y, 33, open ? a.p.teal : a.p.sub);
    });
    a.value('Documents in the index', String(s.corpus), 1200, 290);
    if (cue(k, 3, 'One plus four'))
      a.value('Documents scanned', s.open.map((i) => s.lengths[i]).join(' + ') + ' = ' + s.docs, 1200, 540, a.p.teal, 67);
  } else {
    const q2 = [4.1, 4.1],
      i = nearIndex(xy.map((v) => distance(v, q2))),
      hit = cue(k, 4, 'The index returns'),
      judge = cue(k, 4, 'A reviewer chose');
    a.title(
      'A duplicate-charge query near the reset link',
      'Separate held-out example · query (4.1, 4.1)',
    );
    a.note('Flat search', 140, 290);
    filingTab(a, 140, 343, 640, ids[i], names[i], a.p.blue);
    a.note('Index return', 140, 513);
    if (hit) filingTab(a, 140, 564, 640, ids[i], names[i], a.p.blue);
    if (hit) a.value('ANN recall@1', '1', 1040, 302, a.p.teal, 86);
    if (judge) {
      a.note('Reviewed relevant page', 140, 735);
      filingTab(a, 140, 785, 640, 'B', names[1], a.p.red);
      a.value('Relevance hit@1', '0', 1040, 576, a.p.red, 86);
    }
  }
}
export function audit(a, k) {
  const b = k.beat.beatIndex,
    reverse = cue(k, 1, 'reverse order'),
    single = cue(k, 2, 'Singleton groups');
  const topics = ['Billing', 'Sign-in', 'Release'];
  a.title('Keep the reviewed topic with the run', 'Human review of six message texts');
  const gs = single ? [0, 1, 2, 3, 4, 5] : [0, 1, 2];
  gs.forEach((g, i) => {
    const x = 95 + (i % 3) * 578,
      y = single ? 278 + Math.floor(i / 3) * 251 : 336,
      c = a.group(single ? labels[g] : g);
    const members = single ? [g] : xy.map((v, j) => j).filter((j) => labels[j] === g);
    const number = single ? g : reverse ? 2 - g : g;
    a.note((single ? 'Run C' : reverse ? 'Run B' : 'Run A') + '   /   Group ' + number, x, y, c);
    members.forEach((j, n) => filingTab(a, x, y + 40 + n * 88, 500, ids[j], names[j], c));
    if (b > 0)
      a.text(
        'Reviewed · ' + topics[single ? labels[g] : g],
        x,
        y + (single ? 158 : 263),
        37,
        a.p.ink,
        'Serif',
      );
    if (b === 2)
      a.note(
        'Purity   ' + members.length + ' / ' + members.length + ' = 1',
        x,
        y + (single ? 211 : 333),
        c,
      );
  });
  if (single) a.note('Six perfect scores. Every group now holds just one message.', 95, 874);
}
const pages = transferDocuments,
  fit = pca2(pages.map((p) => p.point));
const pageNames = ['Billing policy', 'Billing help', 'Sign-in help', 'Release policy', 'Runbook'];
export function pageSearch(height) {
  const rel = pages.map((v) => {
    const d = minus(v.point, transferQuery),
      along = dot(d, fit.vector);
    const perp = dot(d, [-fit.vector[1], fit.vector[0]]);
    return [along, perp * height];
  });
  const ds = rel.map((p) => Math.hypot(...p)),
    minimum = Math.min(...ds),
    ties = pages.filter((v, i) => Math.abs(ds[i] - minimum) < 1e-10).map((v) => v.id);
  return { rel, ds, ties, winner: ties[0], kept: fit.varianceKept };
}
export function sight(a, k) {
  const b = k.beat.beatIndex,
    zoom = cue(k, 1, 'Look closely', 1.2),
    flat = cue(k, 2, 'As we flatten', 1.8),
    back = cue(k, 5, 'Bring back', 1.55),
    height = 1 - flat * (1 - back);
  const s = pageSearch(height),
    qpt = [959, 408],
    scale = 36;
  a.text('“My sign-in code keeps failing.”', 84, 119, 66, a.p.ink, 'Serif');
  a.note('Storage order', 90, 225);
  const select =
    (b === 1 && cue(k, 1, 'returns L')) ||
    (b === 4 && cue(k, 4, 'B, billing help')) ||
    (b >= 5 && back === 1 && cue(k, 5, 'L wins'));
  pages.forEach((v, i) =>
    filingTab(
      a,
      89 + i * 350,
      264,
      325,
      v.id,
      pageNames[i],
      a.group(i),
      select && v.id === s.winner,
    ),
  );
  const pt = (v) => [qpt[0] + scale * v[0], qpt[1] - scale * v[1]];
  const col = a.p.teal,
    lineY = qpt[1] + transferQuery[1] * height * scale;
  a.line([87, lineY], [1832, lineY], a.p.line, 3);
  const hints = [
    [0, 56],
    [-288, 60],
    [272, -8],
    [0, 56],
    [239, 48],
  ];
  pages.forEach((v, i) => {
    const loc = pt(s.rel[i]);
    if (loc[0] < 65 || loc[0] > 1850) return;
    const [dx, dy] = hints[i],
      label = plus(loc, [dx, dy]);
    a.line(loc, plus(loc, [dx * 0.63, dy]), a.group(i), 2.5);
    if (i === 2 || i === 1 || i === 4)
      a.line(plus(loc, [dx * 0.63, dy]), [label[0] + (dx > 0 ? -18 : 18), label[1]], a.group(i), 2);
    a.pin(loc, a.group(i), 8);
    a.tag(
      v.id + ' · ' + pageNames[i],
      label[0],
      label[1],
      a.group(i),
      29,
      dx > 0 ? 'left' : dx < 0 ? 'right' : 'center',
    );
  });
  a.target(qpt, 17, a.p.brass);
  a.tag('Query', qpt[0] - 38, qpt[1] - 23, a.p.brass, 29, 'right');
  if (b >= 2) a.note(f(s.kept * 100, 1) + '% of spread on PC1', 90, 812, a.p.sub);
  const gapStated = b === 1
    ? k.elapsed >= k.wordCue('Sign-in help lies two tenths below it').end
    : b > 5 || (b === 5 && k.elapsed >= k.wordCue('two tenths of a unit away').end);
  if (gapStated && height === 1)
    a.text('Q to L   ' + f(s.ds[2], 1), 1280, 814, 40, col, 'Mono');
  else if (height === 0) a.text('B, L, R   ·   distance 0', 1200, 814, 43, a.p.ink, 'Serif');
  if ((b === 1 && zoom > 0) || (b >= 5 && back === 1)) {
    const loupe = [1618, 708],
      focus = b === 1 ? zoom : 1,
      top = [loupe[0], loupe[1] - 36],
      gap = s.ds[2] * 360,
      bottom = [top[0], top[1] + gap];
    a.circle(loupe, 90 * focus, a.p.edge, a.p.brass, 4);
    if (focus < 1) return;
    a.line([loupe[0] + 64, loupe[1] + 64], [loupe[0] + 117, loupe[1] + 117], a.p.brass, 13);
    a.target(top, 12);
    a.pin(bottom, a.group(2), 7);
    a.line([top[0] - 31, top[1]], [bottom[0] - 31, bottom[1]], a.p.ink, 2);
    for (const y of [top[1], bottom[1]]) a.line([top[0] - 39, y], [top[0] - 23, y], a.p.ink, 2);
    a.text('Q', top[0] + 23, top[1], 24, a.p.brass, 'Mono');
    a.text('L', bottom[0] + 23, bottom[1], 24, a.group(2), 'Mono');
  }
}
