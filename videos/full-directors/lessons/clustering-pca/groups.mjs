import {
  xy,
  query,
  centroids,
  seeds,
  labels,
  clusterTrials,
} from '../../../films/clustering-pca/fixtures.mjs';
import { distance, kmeans, silhouette } from '../../../films/clustering-pca/arithmetic.mjs';
import { emptyCenterRepair, seedMass } from '../../../films/clustering-pca/model.mjs';
import {
  ids,
  names,
  mix,
  between,
  sum,
  f,
  pair,
  cue,
  nearIndex,
  grid,
  constellation,
  center,
  filingTab,
} from './drawing.mjs';

export const distances = xy.map((pt) => distance(pt, query));
const fixed = (a) => grid(a, [90, 835], 104, [0, 10, 0, 6]);
const tab = (a, label, v, y, c) => {
  a.note(label, 1260, y);
  a.text(v, 1260, y + 55, 50, c ?? a.p.ink, 'Mono');
};
export const error = (pts, cs, owners) => sum(pts.map((v, i) => distance(v, cs[owners[i]]) ** 2));

export function opening(a, k) {
  const touched = cue(k, 2, 'B, the duplicate payment');
  const r = mix(0.47, distances[1] - 0.079, cue(k, 0, 'Watch it grow', 2.1)) + touched * 0.079;
  const wide = cue(k, 2, "Here's the full map", 1.45);
  const scale = mix(154, 107, wide),
    q = between([608, 518], [440, 577], wide);
  const pt = ([x, y]) => [q[0] + (x - query[0]) * scale, q[1] - (y - query[1]) * scale];
  a.title('“Why was I charged twice?”', 'Incoming support request');
  a.ctx.save();
  a.ctx.beginPath();
  a.ctx.rect(55, 198, 1140, 728);
  a.ctx.clip();
  for (let i = 1; i <= 4; i++) a.circle(q, i * scale, null, a.p.faint, 1.5);
  a.ctx.restore();
  a.circle(q, r * scale, a.p.brass + '0b', a.p.brass, 4);
  if (wide < 0.01) {
    // A sliding beam compass shares its pivot and opening with the measured circle.
    const beam = r * scale;
    a.ctx.save();
    a.ctx.translate(...q);
    a.ctx.rotate(-0.29);
    a.rect(-18, -9, beam + 36, 18, '#b78b48', '#edd197', 2);
    a.rect(9, -3, beam, 6, '#413b32');
    for (let z = 16; z < beam; z += 12) a.line([z, -8], [z, -4], '#584828', 1.5);
    a.rect(beam - 9, -15, 18, 29, '#e6c98c', '#514735', 2);
    a.circle([beam, 0], 6, '#373d3a', '#f9e1a8', 2);
    a.circle([0, 0], 19, '#ddbb78', '#665738', 3);
    a.circle([0, 0], 8, '#514a39');
    a.line([-4, -3], [4, 3], '#f6db97', 2);
    a.ctx.restore();
  } else a.target(q, 18);
  a.tag('Query', q[0] + 21, q[1] + 40, a.p.brass);
  xy.forEach((v, i) => {
    if (i !== 1 && i !== 2 && wide < 0.99) return;
    const s = pt(v),
      c = i === 1 && r >= distances[1] - 1e-9 ? a.p.teal : a.p.ink;
    a.pin(s, c, 7);
    const dx = wide > 0 ? 0 : i === 1 ? -25 : 20,
      dy = wide > 0 ? (i % 2 === 0 ? 35 : -35) : i === 1 ? 31 : -30;
    if (wide === 0) {
      const x = i === 1 ? 145 : 790,
        y = i === 1 ? 747 : 200,
        w = i === 1 ? 374 : 353;
      a.line(s, [x + 63, y + (i === 1 ? 0 : 72)], c, 2);
      filingTab(a, x, y, w, ids[i], names[i], c, touched && i === 1);
    } else a.tag(ids[i], s[0] + dx, s[1] + dy, c, 31, 'center');
  });
  if (wide > 0.99) {
    a.value('Full search · 6 messages', 'B', 1300, 343, a.p.teal, 128);
    a.text('Duplicate payment', 1300, 541, 44, a.p.ink, 'Serif');
    a.note('Distance  ' + f(distances[1], 3), 1300, 613);
  } else {
    const lo = 1.76,
      hi = 1.96,
      x = (v) => 1255 + ((v - lo) / (hi - lo)) * 480,
      y = 552;
    a.note('Radius · final 0.20 units', 1250, 390);
    a.line([1255, y], [1735, y], a.p.line, 5);
    for (let n = 0; n <= 20; n++) {
      const x0 = 1255 + n * 24;
      a.line([x0, y], [x0, y + (n % 5 === 0 ? 24 : 10)], a.p.line, 2);
    }
    [1, 2].forEach((i, j) => {
      const xx = x(distances[i]);
      a.line([xx, y - 30], [xx, y + 60], a.p.ink, 2);
      if (touched) a.text(ids[i], xx, y + 88, 35, a.p.ink, 'Mono', 'center');
    });
    if (r >= lo) {
      const xx = x(r);
      a.poly(
        [
          [xx, y - 3],
          [xx - 11, y - 24],
          [xx + 11, y - 24],
        ],
        a.p.brass,
      );
    }
    a.text(f(lo), 1255, y + 146, 29, a.p.sub, 'Mono', 'center');
    a.text(f(hi), 1735, y + 146, 29, a.p.sub, 'Mono', 'center');
    if (touched) a.tag('First contact · B', 1250, 763, a.p.teal, 43);
  }
}
export function neighbors(a, k) {
  a.title('A straight line between two messages', 'Euclidean distance');
  const all = cue(k, 1, 'Repeating this check');
  if (all) {
    const pt = fixed(a);
    [0, 2, 4].forEach((i, g) => {
      a.line(pt(xy[i]), pt(xy[i + 1]), a.group(g), 7);
      tab(
        a,
        names[i] + '  /  ' + names[i + 1],
        f(distance(xy[i], xy[i + 1])),
        260 + g * 170,
        a.group(g),
      );
    });
    constellation(a, pt, xy, labels.map(a.group));
    return;
  }
  const s = [390, 805],
    unit = 517,
    end = [s[0] + 0.2 * unit, s[1] - 0.8 * unit],
    corner = [end[0], s[1]];
  const x = cue(k, 0, 'Move two tenths', 0.75),
    y = cue(k, 0, 'then eight tenths', 0.8),
    diagonal = cue(k, 0, 'The square root', 0.9);
  a.line(s, between(s, corner, x), a.p.brass, 7);
  a.line(corner, between(corner, end, y), a.p.teal, 7);
  if (diagonal) a.line(s, between(s, end, diagonal), a.p.ink, 6);
  a.pin(s);
  a.pin(end);
  a.tag('A   (1.0, 1.0)', s[0] - 25, s[1] + 8, a.p.ink, 32, 'right');
  a.tag('B   (1.2, 1.8)', end[0] + 25, end[1] - 13);
  if (x === 1) a.text('0.2', s[0] + 51, s[1] + 50, 36, a.p.brass, 'Mono', 'center');
  if (y === 1) a.text('0.8', end[0] + 35, (end[1] + s[1]) / 2, 36, a.p.teal, 'Mono');
  if (cue(k, 0, 'Square those changes')) a.value('Coordinate changes', '0.2² + 0.8²', 1060, 340);
  if (diagonal === 1) a.value('Straight-line distance', '√0.68  ≈  0.82', 1060, 535, a.p.teal, 65);
  if (k.beat.beatIndex === 1) a.note('A to reset link   ' + f(distance(xy[0], xy[2])), 1060, 720);
}
export function inputProblem(docs, centers) {
  const width = docs[0]?.length;
  if (!width || !centers.length || [...docs, ...centers].some((r) => r.length !== width))
    return 'Reject the width mismatch.';
  if ([...docs, ...centers].some((r) => r.some((v) => !Number.isFinite(v))))
    return 'Reject the nonfinite coordinate.';
  return null;
}
export function matrix(a, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    a.title('Two features per message', 'Assignment input');
    const broken = b === 1,
      example = broken ? [[4]] : seeds,
      problem = inputProblem(xy, example);
    function matrixAt(x, rows, w, label) {
      a.note(label, x, 245);
      rows.forEach((r, i) =>
        r.forEach((v, j) => {
          a.rect(
            x + j * w,
            303 + i * 72,
            w - 7,
            65,
            j === 1 && broken && label.startsWith('Center') ? a.p.red + '22' : a.p.faint,
          );
          a.text(f(v, 1), x + (j + 0.5) * w - 4, 335 + i * 72, 38, a.p.ink, 'Mono', 'center');
        }),
      );
    }
    matrixAt(125, xy, 145, 'Documents   6 × 2');
    matrixAt(675, example, 145, broken ? 'Centers   1 × 1' : 'Centers   3 × 2');
    if (broken) {
      a.arrow([857, 340], [1055, 340], a.p.red, 5);
      matrixAt(1120, [[4, 4]], 145, 'Broadcast result');
      a.text('Second 4 copied', 1120, 465, 44, a.p.red, 'Serif');
      a.note(problem, 1120, 533);
    } else {
      a.value('Shared feature width', 'd = 2', 1240, 310);
      if (cue(k, 0, 'reject nonfinite')) a.note('Require finite coordinates.', 1240, 512);
    }
  } else {
    a.title('Where do the two pulls balance?', 'Fixed membership · squared Euclidean error');
    const unit = 950,
      base = [335, 735],
      pt = ([x, y]) => [base[0] + (x - 1) * unit, base[1] - (y - 1) * 580];
    const u = cue(k, 2, 'Setting it to zero', 1.1),
      m = between(xy[0], centroids[0], u);
    a.line(pt(xy[0]), pt(xy[1]), a.p.line, 3);
    [0, 1].forEach((i) => {
      a.pin(pt(xy[i]));
      a.tag(ids[i], pt(xy[i])[0] - 32, pt(xy[i])[1], a.p.ink, 34, 'right');
    });
    center(a, pt(m), a.p.teal);
    a.text(pair(m, 2), pt(m)[0] + 35, pt(m)[1] + 10, 36, a.p.teal, 'Mono');
    a.value('Gradient', '2 Σ (μ − x)', 995, 332);
    if (u === 1) {
      a.value('At balance', 'μ = (1.1, 1.4)', 995, 546, a.p.teal);
      a.note('Unique mean for this nonempty pair.', 995, 725);
    }
  }
}
export const lloydMemberships = [seeds, centroids].map((cs) => kmeans(xy, cs, 1).labels);
const bDistances = [seeds, centroids].map((cs) => cs.map((c) => distance(xy[1], c)));
const comparisonScale = 410 / Math.max(...bDistances.flat());
const seedError = error(xy, seeds, lloydMemberships[0]);

export function lloydStep(a, k) {
  const b = k.beat.beatIndex;
  const pass = Number(b === 2);
  const moving = cue(k, 1, 'Move all three centers', 1.8);
  const cs = seeds.map((v, i) => between(v, centroids[i], moving));
  const linked = b === 2 ? cue(k, 2, 'around the new centers', 1.1) : cue(k, 0, 'connect it', 1.4);
  const comparing = b === 2
    ? cue(k, 2, 'Assign again', 0.85)
    : cue(k, 0, 'Compare each point', 0.85);
  const settled = cue(k, 2, 'remain, so this run has settled') && linked === 1;
  const owners = lloydMemberships[pass];
  const titles = ['Assign to the nearest centers', 'Move the centers, keep the pairs', 'Assign again with the new centers'];
  a.title(titles[b], 'Lloyd update · six messages, three centers');
  const pt = fixed(a);
  const assigned = [1, 0, 2, 3, 4, 5].slice(0, Math.floor(linked * xy.length + 1e-8));
  if (b === 2) {
    xy.forEach((v, i) => {
      if (!assigned.includes(i)) a.line(pt(v), pt(cs[lloydMemberships[0][i]]), a.p.faint, 7);
    });
  }
  if (b !== 1 && comparing && !settled) {
    cs.forEach((c, g) => {
      if (g === owners[1] && assigned.includes(1)) return;
      a.line(pt(xy[1]), pt(between(xy[1], c, comparing)), a.p.line, 3, [7, 9]);
    });
  }
  assigned.forEach((i) => a.line(pt(xy[i]), pt(cs[owners[i]]), a.group(owners[i]), 7));
  constellation(
    a,
    pt,
    xy,
    owners.map((g, i) => (assigned.includes(i) ? a.group(g) : a.p.ink)),
  );
  cs.forEach((v, i) => {
    const [x, y] = pt(v),
      c = a.group(i);
    center(a, [x, y], c);
    a.tag('C' + i, i === 1 ? x : x + 30, i === 1 ? y - 35 : y, c, 29, i === 1 ? 'center' : 'left');
  });

  if (b === 1) {
    a.value('Center C0 · A and B', pair(cs[0], 2), 1230, 268, a.group(0), 66);
    a.text('Inertia across all six', 1230, 462, 47, a.p.ink, 'Serif');
    const current = error(xy, cs, owners);
    [seedError, current].forEach((v, i) => {
      const y = 552 + i * 150;
      a.note(i ? (moving === 1 ? 'At the means' : 'Current centers') : 'At the seeds', 1230, y);
      a.rect(1230, y + 32, 420, 24, a.p.faint);
      a.rect(1230, y + 32, 420 * (v / seedError), 24, i ? a.p.teal : a.p.line);
      a.text(f(v), 1830, y + 43, 52, i ? a.p.teal : a.p.ink, 'Mono', 'right');
    });
  } else if (comparing) {
    a.text('Distance from B', 1230, 272, 50, a.p.ink, 'Serif');
    const compareComplete = b === 2 ? settled : assigned.includes(1);
    bDistances[pass].forEach((v, i) => {
      const y = 354 + i * 132;
      const color = compareComplete && i === owners[1] ? a.group(i) : a.p.sub;
      a.note('Center C' + i, 1230, y, color);
      a.rect(1230, y + 25, v * comparisonScale * comparing, 24, color);
      if (comparing === 1) a.text(f(v, 3), 1830, y + 37, 47, color, 'Mono', 'right');
    });
    if (settled) {
      const changed = owners.filter((g, i) => g !== lloydMemberships[0][i]).length;
      a.text(changed + ' of ' + xy.length + ' assignments changed', 1230, 761, 39, a.p.teal, 'Serif');
      a.note('Inertia stays at ' + f(error(xy, cs, owners)), 1230, 821);
    }
  }
}
const repair = emptyCenterRepair();
export const firstUpdate = kmeans(xy, repair.repaired, 1);
export const secondUpdate = kmeans(xy, firstUpdate.centers, 1);
export const repeat = kmeans(xy, secondUpdate.centers, 1);

export function empty(a, k) {
  const reseed = cue(k, 2, 'Move the empty center'),
    assign = cue(k, 2, 'Assign the six messages again'),
    means = cue(k, 4, 'Average each shelf'),
    compare = cue(k, 4, 'Measure from B'),
    move = cue(k, 5, 'B moves to C zero'),
    recenter = cue(k, 5, 'Average the new pairs'),
    reassign = cue(k, 5, 'Assign all six once more'),
    settled = cue(k, 5, 'The assignments repeat');
  const owners = move ? secondUpdate.labels : assign ? firstUpdate.labels : repair.before;
  const cs = recenter ? secondUpdate.centers : means ? firstUpdate.centers : reseed ? repair.repaired : repair.initial;
  const heading = settled ? 'The next assignment keeps all three pairs'
    : reassign ? 'Assign again with the new centers'
    : recenter ? 'Update the means of the new pairs'
    : move ? 'B moves to its nearest center'
    : compare ? 'Which center is nearest to B?'
    : means ? 'Update the means with membership fixed'
    : 'Count members before taking a mean';
  a.title(heading, 'Empty-center guard');
  if (compare) a.note('Distance from B', 1130, 221);
  cs.forEach((c, g) => {
    const y = 282 + g * 195,
      which = ids.filter((_, i) => owners[i] === g);
    a.text('C' + g, 84, y + 24, 48, a.group(g), 'Mono');
    const coords = means ? '(' + c.map((v) => Number(v.toFixed(3))).join(', ') + ')' : pair(c, 1);
    a.text(coords, 180, y + 25, 36, a.p.sub, 'Mono');
    a.line([475, y + 69], [1450, y + 69], a.p.line, 3);
    which.forEach((id, j) => {
      const x = 510 + j * 174;
      a.rect(x, y - 16, 132, 83, a.group(g) + '24', a.group(g));
      a.text(id, x + 66, y + 25, 46, a.group(g), 'Mono', 'center');
    });
    a.text(which.length + ' / 6', 1540, y + 23, 53, which.length ? a.group(g) : a.p.red, 'Mono');
    if (compare) a.text(f(distance(xy[1], c), 3), 1130, y + 25, 40, a.group(g), 'Mono');
    if (!which.length) a.note('No members to average', 510, y + 26, a.p.red);
  });
  if (k.beat.beatIndex === 3)
    a.note(
      'First center on ties     ·     Repeat assignments to stop     ·     Cap at 20 updates',
      475,
      815,
    );
  if (compare) a.note('B  ' + pair(xy[1]) + '    ·    Duplicate payment', 510, 815);
}
export function seeding(a, k) {
  const chosen = cue(k, 2, 'F gets the seed'),
    refresh = cue(k, 2, 'Measure to the nearer');
  const mass = seedMass(refresh ? [0, 5] : [0]),
    y = 678,
    w = 1580,
    x0 = 155;
  a.title(
    refresh ? 'Measure to the nearer seed' : 'A longer link buys a larger interval',
    'Original k-means++ draw',
  );
  const pt = grid(a, [140, 555], 72, [0, 10, 0, 5]);
  xy.forEach((v, i) => {
    const s = refresh && distance(v, xy[5]) < distance(v, xy[0]) ? 5 : 0;
    a.line(pt(xy[s]), pt(v), i === 5 ? a.p.brass : a.p.line, 3);
  });
  constellation(a, pt, xy);
  center(a, pt(xy[0]), a.p.teal);
  if (chosen) center(a, pt(xy[5]), a.p.teal);
  a.text(refresh ? 'Nearest of A and F' : 'Distance to seed A', 1060, 246, 36, a.p.ink, 'Serif');
  a.note('ID', 1060, 315);
  a.note('D²', 1180, 315);
  a.note('Share', 1490, 315);
  [1, 4, 5].forEach((i, j) => {
    const y = 380 + j * 61;
    a.text(ids[i], 1060, y, 32, a.p.ink, 'Mono');
    a.text(f(mass.weights[i]), 1180, y, 32, a.p.ink, 'Mono');
    a.text(f(100 * mass.probabilities[i], 2) + '%', 1490, y, 32, a.p.ink, 'Mono');
  });
  a.note('Total over six   ' + f(mass.total), 1060, 565);
  const colors = [a.p.sub, a.p.red, a.p.blue, a.p.violet, a.p.teal, a.p.brass];
  mass.intervals.forEach(([lo, hi], i) => {
    if (hi <= lo) return;
    const x = x0 + w * lo,
      width = w * (hi - lo);
    a.rect(x, y, width, 78, colors[i], a.p.bg, 2);
    if (width > 58) a.text(ids[i], x + width / 2, y + 39, 39, a.p.bg, 'Mono', 'center', 600);
  });
  a.text('0', x0, y + 114, 29, a.p.sub, 'Mono');
  a.text('1', x0 + w, y + 114, 29, a.p.sub, 'Mono', 'right');
  if (cue(k, 1, 'Put a supplied draw') && !refresh) {
    const x = x0 + 0.8 * w;
    a.poly(
      [
        [x, y],
        [x - 15, y - 22],
        [x + 15, y - 22],
      ],
      a.p.ink,
    );
    a.text('u = 0.80', x, y - 58, 32, a.p.ink, 'Mono', 'center');
  }
  if (k.beat.beatIndex >= 3)
    a.text(
      k.beat.beatIndex === 3
        ? 'E[Jseed] ≤ 8 (ln k + 2) J*'
        : 'Greedy trials per seed    /    explicit restart budget',
      955,
      813,
      41,
      a.p.ink,
      'Serif',
      'center',
    );
}
export function partitions(a, k) {
  const selected = k.beat.beatIndex
    ? 3
    : cue(k, 0, 'Add a fourth')
      ? 4
      : cue(k, 0, 'Add a third')
        ? 3
        : 2;
  const fit = clusterTrials[selected - 2],
    pt = fixed(a);
  a.title('Which messages share a center?', 'Best converged fit among the tested seeds');
  xy.forEach((v, i) => a.line(pt(v), pt(fit.centers[fit.labels[i]]), a.group(fit.labels[i]), 6));
  fit.centers.forEach((c, i) => center(a, pt(c), a.group(i)));
  constellation(a, pt, xy, fit.labels.map(a.group));
  a.value('Number of groups', String(selected), 1250, 240);
  tab(a, 'Inertia', f(fit.inertia), 430, a.p.brass);
  if (k.beat.beatIndex === 1) {
    const s = silhouette(xy, fit.labels, 0);
    a.line(pt(xy[0]), pt(xy[1]), a.p.brass, 3);
    for (const j of [2, 3]) a.line(pt(xy[0]), pt(xy[j]), a.p.blue, 3, [7, 10]);
    a.note('A · within pair   ' + f(s.a), 1250, 635);
    a.note('Closest group average   ' + f(s.b), 1250, 700);
  } else if (k.beat.beatIndex === 2) tab(a, 'Mean silhouette', f(fit.silhouette), 635, a.p.teal);
}
const fourGroupFit = clusterTrials[2];
export const rivalsOfD = fourGroupFit.centers.flatMap((_, group) => {
  if (group === fourGroupFit.labels[3]) return [];
  const members = ids.filter((_, i) => fourGroupFit.labels[i] === group);
  const mean = sum(members.map((id) => distance(xy[3], xy[ids.indexOf(id)]))) / members.length;
  return [{ group, members, mean }];
});
function singletonRival(a, k) {
  const result = cue(k, 7, 'E is the nearest rival group'),
    own = cue(k, 7, 'Score E itself'),
    s = silhouette(xy, fourGroupFit.labels, 3);
  a.title('Which rival group is closest to D on average?', 'Four groups   ·   AB  /  CD  /  E  /  F');
  a.note('Rival members', 130, 255);
  a.note('Mean distance from D', 515, 255);
  rivalsOfD.forEach(({ group, members, mean }, i) => {
    const y = 359 + 144 * i, color = a.group(group);
    a.text(members.join(' + '), 135, y, 49, color, 'Mono');
    a.rect(505, y - 15, mean * 105, 30, color);
    a.text(f(mean, 3), 530 + mean * 105, y, 35, a.p.ink, 'Mono');
  });
  a.note('D shares its own group with C.', 130, 826);
  a.value('Within CD   ·   a', f(s.a, 3), 1270, 285);
  if (result) a.value('Closest rival   ·   b', 'E    ' + f(s.b, 3), 1270, 486, a.group(s.otherGroup), 62);
  if (own) a.value('E’s own silhouette', '0', 1270, 690, a.group(s.otherGroup), 62);
}
export function scores(a, k) {
  const b = k.beat.beatIndex,
    fit = clusterTrials[1],
    s = silhouette(xy, fit.labels, 0);
  if (b >= 6) return singletonRival(a, k);
  a.title(
    b >= 3 ? 'The fourth center splits a pair' : 'Average each rival group separately',
    'Silhouette and inertia',
  );
  if (b <= 2) {
    const means = [1, 2].map(
      (g) => sum(xy.filter((_, i) => fit.labels[i] === g).map((v) => distance(xy[0], v))) / 2,
    );
    const rows = [
      ['Own · B', s.a],
      ['Rival · C and D', means[0]],
      ['Rival · E and F', means[1]],
    ];
    rows.forEach(([name, v], i) => {
      const y = 292 + i * 156;
      a.text(name, 100, y, 39, a.p.ink, 'Serif');
      a.rect(426, y - 17, 78 * v, 34, i === 0 ? a.p.teal : a.p.blue);
      a.text(f(v, 3), 455 + 78 * v, y, 34, a.p.ink, 'Mono');
    });
    if (b === 2 && cue(k, 2, 'Collect all six')) {
      a.rect(65, 231, 1080, 545, a.p.bg);
      a.note('Six contributions for k = 3', 105, 269);
      xy.forEach((_, i) => {
        const x = 118 + i * 161,
          s = silhouette(xy, fit.labels, i).score;
        a.rect(x, 648 - 305 * s, 98, 305 * s, a.group(fit.labels[i]));
        a.text(ids[i], x + 49, 695, 32, a.p.ink, 'Mono', 'center');
        a.text(f(s, 2), x + 49, 610 - 305 * s, 32, a.p.ink, 'Mono', 'center');
      });
    }
    if (b > 0) a.value('A’s silhouette', '(b − a) / max(a, b)', 105, 736, a.p.ink, 49);
    if (b === 1 || b === 2) a.value('For A', f(s.score, 3), 1285, 329, a.p.teal);
    if (b === 2) {
      a.note('Singleton → 0', 1285, 531);
      a.note('a = b = 0  →  0', 1285, 592);
      a.note('2 ≤ groups < n', 1285, 653);
    }
  } else {
    a.note('Mean of all six silhouettes', 140, 262);
    a.note('Within-group squared error', 1010, 262);
    clusterTrials.forEach((t, i) => {
      const y = 384 + 160 * i;
      a.text('k = ' + t.k, 130, y, 36, a.p.ink, 'Mono');
      a.rect(300, y - 18, 605 * t.silhouette, 36, a.group(i));
      a.text(f(t.silhouette, 3), 330 + 605 * t.silhouette, y, 35, a.p.ink, 'Mono');
      if (b >= 4) {
        a.rect(1020, y - 18, (590 * t.inertia) / clusterTrials[0].inertia, 36, a.group(i));
        a.text(
          f(t.inertia),
          1050 + (590 * t.inertia) / clusterTrials[0].inertia,
          y,
          35,
          a.p.ink,
          'Mono',
        );
      }
    });
    if (b >= 4)
      a.note('Third center separates two pairs. Fourth center separates E from F.', 130, 817);
  }
}
export function corners(a, k, stretched) {
  const b = k.beat.beatIndex;
  const width = stretched ? mix(2, 8, cue(k, 0, 'Stretch it', 1.3)) : 2;
  const pts = [
    [0, 0],
    [0, 2],
    [width, 0],
    [width, 2],
  ];
  const sideways = stretched ? !cue(k, 3, 'Move just the seeds') : !!cue(k, 0, 'turn the split');
  const owners = sideways ? [0, 1, 0, 1] : [0, 0, 1, 1];
  const mean = stretched
    ? sideways
      ? cue(k, 2, 'Both means land', 0.9)
      : cue(k, 3, 'Move each center', 0.9)
    : 1;
  const cs = sideways
    ? [
        [width * 0.5 * mean, 0],
        [width * 0.5 * mean, 2],
      ]
    : [
        [0, mean],
        [width, mean],
      ];
  const scale = stretched ? 142 : 210,
    x0 = stretched ? 172 : 418,
    y0 = stretched ? 739 : 745,
    pt = ([x, y]) => [x0 + scale * x, y0 - scale * y];
  a.title(
    stretched ? 'A restart on the stretched rectangle' : 'Two equally good cuts of a square',
    stretched ? 'Two groups · same four points' : 'Four messages · two groups',
  );
  a.poly(
    pts.map((_, i) => pt(pts[[0, 2, 3, 1][i]])),
    a.p.faint + '48',
    a.p.faint,
    3,
  );
  pts.forEach((v, i) => {
    const c = a.group(owners[i]);
    a.line(pt(v), pt(cs[owners[i]]), c, 10);
    a.pin(pt(v), c, 12);
    a.text(pair(v, 0), pt(v)[0], pt(v)[1] + (v[1] ? -48 : 50), 32, c, 'Mono', 'center');
  });
  cs.forEach((v, i) => center(a, pt(v), a.group(i)));
  const show = !stretched || (b >= 2 && mean === 1);
  a.note('Within-group squared error', 1400, 352);
  a.text(
    show ? f(error(pts, cs, owners), mean === 0 || mean === 1 ? 0 : 1) : '?',
    1400,
    461,
    112,
    a.p.brass,
    'Serif',
  );
  if (stretched && b === 3 && !sideways) a.note('First run   64', 1400, 599);
  if (!stretched && b >= 1) {
    a.text('User tier', 628, 825, 33, a.p.sub, 'Sans', 'center');
    a.text('Severity', 193, 535, 33, a.p.sub);
    a.line([999, 337], [999, 825], a.p.line, 2, [7, 8]);
    a.note('Who needs the same response?', 1134, 641);
    if (b === 2) {
      a.note('Across tiers', 1134, 707, a.p.teal);
      a.note('Within severity level', 1134, 755, a.p.teal);
    }
  }
}
