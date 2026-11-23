import { xy, pca, means, stds, query } from '../../../films/clustering-pca/fixtures.mjs';
import { scaleCalculation, energyRows } from '../../../films/clustering-pca/model.mjs';
import { distance } from '../../../films/clustering-pca/arithmetic.mjs';
import {
  ids,
  names,
  cue,
  f,
  pair,
  mix,
  between,
  minus,
  plus,
  times,
  sum,
  dot,
  grid,
  constellation,
} from './drawing.mjs';
const scaleData = scaleCalculation(),
  energies = energyRows();
export const energy = (key) => sum(energies.map((r) => r[key]));
export const project = (v) =>
  plus(pca.mean, times(pca.vector, dot(minus(v, pca.mean), pca.vector)));
export function scaleRows(a, k) {
  const scaled = cue(k, 1, 'Subtract each column mean'),
    paired = cue(k, 1, 'Recompute the two distances');
  const labels = scaled ? scaleData.standardizedLabels : scaleData.rawLabels;
  const repr = scaled ? 'standardized' : 'raw';
  a.title(
    scaled ? 'Each feature in standard deviations' : 'A short billing note seeks a neighbor',
    'Topic coordinate × message length',
  );
  const unit = scaled ? 185 : 0.66;
  const pt = (v) => [562 + v[0] * unit, (scaled ? 552 : 850) - v[1] * unit];
  const rows = scaleData.rows.map((r) => ({ ...r, pt: pt(r[repr]) }));
  a.line([122, 832], [1015, 832], a.p.line, 3);
  a.line([122, 832], [122, 225], a.p.line, 3);
  a.note(scaled ? 'Length (z)' : 'Length (characters)', 120, 206);
  a.note(scaled ? 'Topic (z)' : 'Topic coordinate', 775, 810);
  if (!scaled || paired)
    [1, 3].forEach((i) => a.line(rows[0].pt, rows[i].pt, a.group(labels[i]), 5));
  rows.forEach((r, i) => {
    const left = i < 3,
      col = a.group(labels[i]),
      x = r.pt[0] + (left ? -105 : 105),
      y = r.pt[1] + (left ? 13 : -13);
    a.line(r.pt, [x + (left ? 10 : -10), y], col, 2);
    a.pin(r.pt, col, scaled ? 10 : 3);
    a.tag(r.id, x, y, col, 30, left ? 'right' : 'left');
  });
  a.note(scaled ? 'One unit = one column SD' : 'Equal axis units', 1130, 806);
  a.value('B100 coordinates', pair(rows[0][repr], scaled ? 2 : 1), 1130, 274, a.p.ink, 58);
  if (!scaled || paired)
    scaleData.pairs.forEach((r, i) => {
      const y = 496 + i * 147;
      a.note(r.from + ' → ' + r.to, 1130, y);
      a.text(f(r[repr]), 1130, y + 57, 55, i === Number(!scaled) ? a.p.teal : a.p.ink, 'Mono');
    });
}
export const qRaw = [-3.1, 300];
export const queryZ = (origin) => qRaw.map((v, i) => (v - origin[i]) / stds[i]);
export function fitted(a, k) {
  const own = cue(k, 1, 'Replace the mean') && !cue(k, 1, 'Restore the stored transform');
  const show = cue(k, 0, 'Here comes a query'),
    origin = own ? [means[0], qRaw[1]] : means;
  a.title('Use one origin for the corpus and query', 'Stored transform · six corpus rows');
  const x0 = 217,
    unit = 1.49,
    y = 485,
    X = (v) => x0 + unit * v;
  a.note('Message length in characters', 155, 240);
  a.line([X(0), y], [X(1000), y], a.p.line, 4);
  for (let i = 0; i <= 1000; i += 100) {
    const x = X(i);
    a.line([x, y - 10], [x, y + 12], a.p.line, 2);
    a.text(i, x, y + 44, 27, a.p.sub, 'Mono', 'center');
  }
  scaleData.rows.forEach((r, i) => {
    const v = r.raw[1],
      s = [X(v), y - 65 - 55 * (i >= 3)];
    a.line(s, [X(v), y - 9], a.p.line, 2);
    a.pin(s, a.group(Number(i >= 3)), 8);
    a.text(r.id, s[0] + (i < 3 ? -20 : 20), s[1], 26, a.p.ink, 'Mono', i < 3 ? 'right' : 'left');
  });
  const oz = X(origin[1]);
  a.line([oz, 590], [oz, y + 67], a.p.red, 4);
  a.line([oz, y + 19], [oz, y - 24], a.p.red, 4);
  a.text(
    own ? 'Query length used as mean' : 'Corpus mean 505',
    oz,
    625,
    33,
    a.p.red,
    'Sans',
    'center',
  );
  if (show) {
    a.target([X(qRaw[1]), y], 15);
    a.value(
      'Query length · 300 characters',
      '(300 − ' + f(origin[1], 0) + ') / ' + f(stds[1], 2),
      160,
      747,
      a.p.ink,
      57,
    );
    a.value('Length score', f(queryZ(origin)[1], 3), 1248, 747, a.p.brass, 82);
    if (k.beat.beatIndex >= 2) a.note('Both query features   ' + pair(queryZ(origin), 3), 1135, 641);
  }
}
export function axes(a, k) {
  const b = k.beat.beatIndex,
    t = cue(k, 0, 'subtract the same', 1.1),
    rotation = cue(k, 1, 'Rotate the line', 2.0);
  const angle = mix(Math.PI / 2, Math.atan2(pca.vector[1], pca.vector[0]), rotation),
    dir = [Math.cos(angle), Math.sin(angle)];
  const current = xy.map((v) => minus(v, times(pca.mean, t)));
  const origin = between([165, 804], [688, 572], t),
    pt = (v) => [origin[0] + 113 * v[0], origin[1] - 113 * v[1]];
  a.title(
    b === 0 ? 'Move the origin to the corpus mean' : 'Turn the line through the cloud',
    'Principal component analysis',
  );
  a.line([95, origin[1]], [1260, origin[1]], a.p.faint, 2);
  a.line([origin[0], 231], [origin[0], 868], a.p.faint, 2);
  const sign = cue(k, 2, 'Reversing the direction') ? -1 : 1,
    score = dot(current[2], dir);
  if (b > 0) {
    const len = 3 + 2.1 * rotation;
    a.line(pt(times(dir, -len)), pt(times(dir, len)), a.p.teal, 4);
    a.arrow(pt(times(dir, sign * (len - 0.45))), pt(times(dir, sign * len)), a.p.teal, 5);
    const drop = cue(k, 1, 'Project each point', 1.2);
    current.forEach((v, i) => {
      const foot = times(dir, dot(v, dir));
      a.line(pt(v), pt(between(v, foot, drop)), a.p.line, 3, [5, 8]);
      if (drop === 1) a.circle(pt(foot), 6, a.p.teal);
    });
  }
  constellation(a, pt, current);
  a.target(pt([0, 0]), 13, a.p.brass);
  if (b === 0) a.value('Mean subtracted', pair(times(pca.mean, t), 2), 1290, 374, a.p.brass, 52);
  else {
    a.value(
      'Sum of squared scores',
      f(sum(current.map((v) => dot(v, dir) ** 2))),
      1320,
      315,
      a.p.teal,
      68,
    );
    if (b === 2) {
      a.value('Score of C', f(sign * score, 3), 1320, 556, a.p.brass, 72);
      a.note('Axis sign ' + (sign > 0 ? '+' : '−'), 1320, 725);
    }
  }
}
export function solver(a, k) {
  const b = k.beat.beatIndex;
  if (b < 5) {
    a.title('Cut each axis into variance units', 'SVD of the centered message matrix');
    const parts = cue(k, 3, 'Five pieces'),
      split = energy('retained'),
      other = energy('discarded');
    [split, other].forEach((v, i) => {
      const x = 176,
        y = 343 + i * 255,
        w = 21 * v,
        c = a.group(i);
      a.text('PC' + (i + 1), x, y - 61, 41, c, 'Mono');
      a.rect(x, y, w, 82, c + '33', c, 3);
      if (parts) {
        a.rect(x, y, w / 5, 82, c);
        for (let j = 1; j < 5; j++) a.line([x + (j * w) / 5, y], [x + (j * w) / 5, y + 82], c, 3);
      }
      a.text('Σ score² = ' + f(v, 3), x, y + 132, 34, a.p.ink, 'Mono');
      if (parts) a.text('λ = ' + f(v / 5, 4), 1485, y + 37, 38, c, 'Mono');
    });
    if (b === 1)
      a.note('Right singular vectors give the axes. Each strip has length σ².', 176, 802);
    if (b === 2) a.text('6 centered scores · their sum is zero', 176, 802, 41, a.p.ink, 'Serif');
    if (b === 4)
      a.text(
        'PC1   ' + f(100 * pca.varianceKept, 1) + '% of total variance',
        176,
        802,
        44,
        a.p.teal,
        'Serif',
      );
  } else if (b < 7) {
    a.title('One matrix fits in a strip. The other is square.', '100 documents × 1,536 features');
    const size = 465,
      h = (size * 100) / 1536;
    a.rect(145, 500, size, h, a.p.teal + '44', a.p.teal, 3);
    a.note('Centered rows   100 × 1,536', 145, 610);
    a.arrow([678, 517], [867, 517], a.p.line);
    a.rect(940, 279, size, size, a.p.blue + '16', a.p.blue, 3);
    for (let j = 1; j < 16; j++) {
      a.line([940 + (size * j) / 16, 279], [940 + (size * j) / 16, 279 + size], a.p.blue + '32', 1);
      a.line([940, 279 + (size * j) / 16], [940 + size, 279 + (size * j) / 16], a.p.blue + '32', 1);
    }
    a.text('X', 1058, 508, 55, a.p.blue, 'Serif');
    a.text('T', 1098, 477, 26, a.p.blue, 'Serif');
    a.text('X / 99', 1120, 508, 55, a.p.blue, 'Serif');
    a.note('Sample covariance   1,536 × 1,536', 886, 816);
    a.note('Rank ≤ 99', 1510, 429);
    a.note('Singular matrix', 1510, 500);
    if (b === 6) a.note('Direct SVD works on the strip.', 145, 790, a.p.teal);
  } else {
    a.title('A tied variance leaves a plane of choices', 'Record the solver and retained subspace');
    const o = [595, 563],
      r = 251;
    a.circle(o, r, null, a.p.line, 3);
    const ang = (cue(k, 7, 'rotate together', 2) * Math.PI) / 3;
    for (const [i, v] of [ang, ang + Math.PI / 2].entries()) {
      const d = [Math.cos(v) * r, -Math.sin(v) * r];
      a.arrow(minus(o, d), plus(o, d), a.group(i), 6);
    }
    a.value('Equal eigenvalues', 'λ₁ = λ₂', 1100, 341);
    a.note('Either line keeps the same squared spread.', 1100, 569);
  }
}
export function compressionState(k) {
  const cOnly = cue(k, 0, "That's our reconstruction", 0.95) * (1 - cue(k, 1, 'Put C back', 0.65));
  const projectAll = cue(k, 1, 'Watch the two distances', 1.45),
    restore = cue(k, 4, 'Bring back', 1.1);
  const t = projectAll * (1 - restore);
  const rows = xy.map((v, i) => between(v, project(v), i === 2 ? Math.max(cOnly, t) : t)),
    q = between(query, project(query), t);
  return {
    rows,
    q,
    t,
    distances: rows.map((v) => distance(v, q)),
    residual: sum(rows.map((v, i) => distance(v, xy[i]) ** 2)),
  };
}
export function compression(a, k) {
  const s = compressionState(k),
    b = k.beat.beatIndex,
    compare = b > 0 && cue(k, 1, "Here's the duplicate-charge request"),
    pt = (v) => [112 + 121 * v[0], 782 - 121 * v[1]];
  a.title('Keep every message in the search', 'Six candidates · Euclidean distance');
  a.line(
    pt(plus(pca.mean, times(pca.vector, -4.8))),
    pt(plus(pca.mean, times(pca.vector, 5.2))),
    a.p.teal,
    4,
  );
  xy.forEach((v, i) => {
    a.circle(pt(v), 6, null, a.p.line, 2);
    a.line(pt(v), pt(s.rows[i]), a.p.red, 3, [7, 6]);
  });
  if (compare) {
    a.line(pt(query), pt(s.q), a.p.red, 3, [7, 6]);
    for (const i of [1, 2]) a.line(pt(s.q), pt(s.rows[i]), a.p.brass, 6);
  }
  constellation(
    a,
    pt,
    s.rows,
    [],
    [
      [-17, 38],
      [17, -36],
      [-12, -39],
      [12, 36],
      [-12, 39],
      [14, -36],
    ],
  );
  if (compare) {
    a.target(pt(s.q));
    a.tag('Q', pt(s.q)[0] - 4, pt(s.q)[1] + 55, a.p.brass, 29, 'center');
    a.text('Distance from Q', 1320, 235, 48, a.p.ink, 'Serif');
    a.text('Original 2D', 1440, 320, 37, a.p.sub, 'Sans', 'center');
    a.text(s.t === 1 ? 'PC1 only' : 'On the map', 1748, 320, 37, a.p.brass, 'Sans', 'center');
    [1, 2].forEach((i, j) => {
      const y = 401 + j * 148;
      a.line([1320, y - 41], [1868, y - 41], a.p.faint, 2);
      a.text(ids[i] + ' · ' + names[i], 1320, y, 40);
      a.text(f(distance(xy[i], query), 3), 1440, y + 68, 54, a.p.sub, 'Mono', 'center');
      a.text(f(s.distances[i], 3), 1748, y + 68, 54, a.p.brass, 'Mono', 'center');
    });
    const answered = (b === 3 && cue(k, 3, 'It lost more')) || (b >= 4 && s.t === 0);
    if (answered) {
      const i = s.distances.indexOf(Math.min(...s.distances));
      a.value('Nearest of six', ids[i] + ' · ' + names[i], 1240, 694, a.p.teal, 46);
      a.note('Squared error   ' + f(s.residual, 3), 1240, 822, a.p.red);
    } else a.value('Squared reconstruction error', f(s.residual, 3), 1245, 697, a.p.red, 53);
  } else {
    a.value('C · position along PC1', f(pca.scores[2], 3), 1310, 336, a.p.teal);
    a.value('C · squared gap', f(s.residual, 3), 1310, 563, a.p.red);
  }
}
function squareOn(a, A, B, opposite, t, color) {
  if (!t) return;
  const d = minus(B, A),
    n = [-d[1], d[0]],
    off = times(n, (dot(n, minus(opposite, A)) > 0 ? -1 : 1) * t);
  a.poly([A, B, plus(B, off), plus(A, off)], color + '48', color, 3);
  for (let i = 1; i <= 6; i++) {
    const v = between(A, B, i / 7);
    a.line(v, plus(v, off), color + '52', 1.6);
  }
}
export function squares(a, k) {
  const row = energies[2],
    o = [791, 623],
    scale = 164,
    pt = (v) => [o[0] + scale * v[0], o[1] - scale * v[1]];
  const c = pt(row.centered),
    foot = pt(row.foot),
    b = k.beat.beatIndex;
  const drop = cue(k, 0, 'Drop a perpendicular', 1.0),
    along = cue(k, 0, 'Build a square', 0.95),
    across = cue(k, 0, 'Build a second square', 1.15);
  a.title('Two squares for one message', 'C · reset link');
  a.line(pt(times(pca.vector, -3.8)), pt(times(pca.vector, 2.6)), a.p.line, 3);
  squareOn(a, o, foot, c, along, a.p.teal);
  squareOn(a, foot, c, o, across, a.p.red);
  a.line(o, c, a.p.ink, 4);
  a.line(c, between(c, foot, drop), a.p.red, 5);
  a.line(o, foot, a.p.teal, 5);
  a.pin(c);
  a.tag('C', c[0] + 24, c[1] - 16);
  a.target(o, 11, a.p.brass);
  a.tag('Mean', o[0] + 29, o[1] + 34, a.p.brass, 29);
  if (drop === 1) {
    const u = times(pca.vector, 18),
      v = [-u[1], u[0]];
    const d = [u[0], -u[1]],
      n = [v[0], -v[1]];
    a.line(plus(foot, d), plus(plus(foot, d), n), a.p.ink, 2);
    a.line(plus(foot, n), plus(plus(foot, d), n), a.p.ink, 2);
  }
  const all = cue(k, 1, 'Sum over all six');
  a.note(all ? 'Six messages together' : 'Squared distance from the mean', 1240, 258);
  a.text(f(all ? energy('total') : row.total, 3), 1240, 345, 83, a.p.ink, 'Serif');
  if (along === 1)
    a.value(
      'Along PC1 · score²',
      f(all ? energy('retained') : row.retained, 3),
      1240,
      475,
      a.p.teal,
      62,
    );
  if (across === 1)
    a.value(
      'Perpendicular · residual²',
      f(all ? energy('discarded') : row.discarded, 3),
      1240,
      658,
      a.p.red,
      62,
    );
  if (b === 2 && cue(k, 2, 'To reconstruct a point')) {
    const restored = cue(k, 2, 'Both directions recover C', 1.0),
      one = cue(k, 2, 'Keeping just the first', 1.0);
    const alongLeg = cue(k, 2, 'multiply each saved score', 0.8),
      end = between(foot, c, restored * (1 - one));
    a.arrow(o, between(o, foot, alongLeg), a.p.teal, 7);
    if (restored * (1 - one) > 0) a.arrow(foot, end, a.p.red, 7);
    const mark = alongLeg === 1 ? end : between(o, foot, alongLeg);
    a.target(mark, 13, a.p.brass);
    a.rect(1160, 200, 720, 679, a.p.bg);
    a.value(
      'Reconstructed C',
      pair([pca.mean[0] + (mark[0] - o[0]) / scale, pca.mean[1] + (o[1] - mark[1]) / scale], 2),
      1210,
      312,
      a.p.brass,
      68,
    );
    a.value('Squared gap', f((distance(mark, c) / scale) ** 2, 3), 1210, 558, a.p.red, 68);
    a.note('Start at the mean. Add the saved directions.', 169, 821);
    return;
  }
  if (b >= 1) {
    const wipe = cue(k, 1, 'The perpendicular square', 0.65);
    if (wipe) {
      const mid = between(c, foot, 0.5);
      a.tag('Discarded', mid[0] - 160, mid[1], a.p.red, 32, 'center');
    }
    if (all) {
      const W = 725,
        T = energy('total'),
        x = 168,
        y = 778;
      let left = x;
      for (const [key, col] of [
        ['retained', a.p.teal],
        ['discarded', a.p.red],
      ]) {
        for (const r of energies) {
          const w = (W * r[key]) / T;
          a.rect(left, y, w, 32, col, a.p.bg, 1.5);
          left += w;
        }
      }
      a.note('All six  ·  score² and residual²', x, y + 52);
    }
  }
}
