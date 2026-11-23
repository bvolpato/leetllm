import assert from 'node:assert/strict';
import {
  binomialMasses,
  exactRightTail,
  exactSignPower,
} from '../../../films/hypothesis-testing/arithmetic.mjs';
import {
  studies,
  variantStudies,
  peeking,
  developmentBootstrap,
  taskRows,
} from '../../../films/hypothesis-testing/fixtures.mjs';
import {
  P,
  bi,
  rect,
  line,
  dot,
  text,
  label,
  title,
  ticket,
  note,
  captionSafeNote,
  cue,
  total,
  bracket,
} from './art.mjs';
const discord = taskRows.filter((r) => r.a !== r.b);
const n = discord.length,
  obs = discord.filter((r) => r.b).length;
const counts = Array(n + 1).fill(0);
const prefixCounts = [counts.slice()];
for (let mask = 0; mask < 2 ** n; mask++) {
  let wins = 0;
  for (let i = 0; i < n; i++) wins += (mask >> i) & 1;
  counts[wins]++;
  if ((mask + 1) % 32 === 0) prefixCounts.push(counts.slice());
}
const tail = total(counts.slice(obs)),
  fmt = (n) => n.toLocaleString('en-US');
const chance = tail / 2 ** n;
const prob = (v) => (v * 100).toFixed(1) + '%';
function hist(
  c,
  {
    x = 170,
    y = 742,
    w = 1580,
    h = 330,
    ranges = [],
    progress = 1,
    small = false,
  } = {},
) {
  const step = w / counts.length,
    peak = Math.max(...counts);
  const shown = prefixCounts[Math.floor(progress * (prefixCounts.length - 1))];
  for (let i = 0; i < counts.length; i++) {
    const height = shown[i] ? Math.max(2, (shown[i] / peak) * h) : 0,
      cx = x + (i + 0.5) * step;
    const lit = ranges.some(([lo, hi]) => i >= lo && i <= hi);
    rect(c, cx - step * 0.41, y - height, step * 0.82, height, lit ? P.gold : P.teal, 3);
    if (!small || i % 2 === 0 || i === n)
      label(c, i, cx, y + 32, small ? 22 : 28, P.slate, 'center');
  }
  line(c, x, y + 1, x + w, y + 1, P.ink, 3);
}
export function nullModel(c, k) {
  const b = bi(k);
  if (b === 0) {
    ticket(c, 169, 394, 558, 278);
    label(c, 'T02   /   permission', 215, 450, 30);
    title(c, 'One disagreement', 215, 535, 49);
    text(c, 'Assign its direction.', 215, 611, 35);
    line(c, 727, 530, 886, 530, P.line, 5);
    line(c, 886, 399, 886, 657, P.line, 5);
    for (const [i, name] of ['A', 'B'].entries()) {
      const y = 399 + 258 * i;
      line(c, 886, y, 1040, y, P.line, 5);
      dot(c, 1117, y, 71, i ? P.teal : P.rust);
      title(c, name, 1117, y - 3, 68, P.white, 'center');
      text(c, 'wins', 1220, y, 45);
      if (cue(k, 0, 'Half the time', 0) && k.elapsed >= k.speechDuration)
        label(c, '½', 1624, y, 60, P.ink, 'center');
    }
    note(c, 'At the equal-win boundary, either sign fits.');
  } else if (b === 1) {
    const q = cue(k, 1, 'assign each a fair direction', 2.0);
    const signs = studies.null[0].signs.slice(0, Math.floor(q * n));
    discord.forEach((row, i) => {
      const x = 137 + (i % 7) * 240,
        y = 365 + Math.floor(i / 7) * 190;
      ticket(c, x, y, 205, 146, P.white);
      label(c, row.id, x + 101, y + 34, 25, P.slate, 'center');
      title(
        c,
        i < signs.length ? (signs[i] ? 'B' : 'A') : '?',
        x + 101,
        y + 98,
        56,
        i >= signs.length ? P.gold : signs[i] ? P.teal : P.rust,
        'center',
      );
    });
    note(c, 'One fair assignment on the same thirteen IDs.', total(signs) + ' B wins');
  } else {
    const q = cue(k, 2, 'Enumerating every possible sign assignment', 2.3);
    label(c, 'Fair assignments grouped by their B-win count', 168, 317, 31);
    hist(c, { progress: q });
    captionSafeNote(
      c,
      'B wins per assignment',
      fmt(Math.floor(q * (prefixCounts.length - 1)) * 32) + ' patterns counted',
    );
  }
}
function highlightedRanges(last, twoSided) {
  if (last < obs) return [];
  return twoSided ? [[0, n - obs], [obs, n]] : [[obs, last]];
}
function patternCount(ranges) {
  return total(ranges.map(([lo, hi]) => total(counts.slice(lo, hi + 1))));
}
function winLabel(lo, hi) {
  if (lo === hi) return 'B wins = ' + lo;
  if (hi === n) return 'B wins ≥ ' + lo;
  if (lo === 0) return 'B wins ≤ ' + hi;
  return lo + ' ≤ B wins ≤ ' + hi;
}
export function tailScene(c, k) {
  const b = bi(k);
  const start = cue(k, 0, 'Start at eight', 0.35),
    sweep = cue(k, 0, 'Include nine', 1.7);
  const inc = start > 0 ? obs + Math.floor((n - obs) * sweep) : -1;
  const two =
    b === 1 && k.reveal('two-sided question', 0.3) > 0 && k.reveal('Here we retain', 0.3) < 1;
  const ranges = highlightedRanges(inc, two);
  const sum = patternCount(ranges);
  label(c, 'Fair patterns on 13 disagreements', 170, 316, 31);
  hist(c, { ranges });
  for (const [lo, hi] of ranges) {
    const step = 1580 / (n + 1),
      x = 170 + lo * step,
      width = (hi - lo + 1) * step;
    bracket(c, x, 378, width, P.gold);
    label(c, winLabel(lo, hi), x + width / 2, 345, 27, P.gold, 'center');
  }
  const done = cue(k, 0, 'A result this favorable', 0);
  let caption = 'B won eight of thirteen disagreements.';
  if (sum)
    caption = inc < n ? 'Running count of highlighted patterns.' : 'Right tail for a planned B advantage.';
  if (two) caption = 'Two-sided test. Count both gold tails.';
  c.save();
  c.translate(0, -57);
  note(
    c,
    caption,
    sum
      ? fmt(sum) + ' / ' + fmt(2 ** n) + (done ? '  ≈ ' + prob(sum / 2 ** n) : '')
      : '',
  );
  c.restore();
}

function bootInset(c, x, y, w, h) {
  const bins = Array(29).fill(0);
  for (const v of developmentBootstrap.means) {
    const i = Math.round((v + 0.3) * 40);
    bins[i]++;
  }
  const peak = Math.max(...bins),
    dx = w / bins.length;
  bins.forEach((v, i) => {
    const bh = (v / peak) * h;
    rect(c, x + i * dx, y - bh, dx - 4, Math.max(1, bh), i < 12 ? P.rust : P.teal);
  });
  line(c, x, y, x + w, y, P.ink, 3);
  label(c, '0', x + 12.5 * dx, y + 32, 26, P.slate, 'center');
}
export function drawingRules(c, k) {
  const b = bi(k);
  if (b < 2) {
    const x = 243,
      y = 566,
      w = 1420;
    label(c, 'Win chance for B on a disagreement', x, 352, 32);
    rect(c, x, y - 36, w / 2, 72, P.sea);
    line(c, x, y, x + w, y, P.ink, 4);
    for (const [i, value] of ['0', '¼', '½', '¾', '1'].entries()) {
      const xx = x + (w * i) / 4;
      line(c, xx, y - 23, xx, y + 24, i === 2 ? P.gold : P.slate, 4);
      label(c, value, xx, y + 68, 40, i === 2 ? P.gold : P.slate, 'center');
    }
    dot(c, x + w / 2, y, 16, P.gold);
    title(c, 'Null', x + w * 0.25, y - 96, 55, P.teal, 'center');
    title(c, 'B advantage', x + w * 0.75, y - 96, 55, P.slate, 'center');
    captionSafeNote(
      c,
      b === 0
        ? 'The fair coin sits at the edge of the null.'
        : 'Redraw the winner on each disagreement.',
      n + ' fixed disagreements',
    );
  } else if (b <= 3) {
    label(c, 'NULL DRAW', 130, 341, 30);
    label(c, 'PAIRED BOOTSTRAP', 1005, 341, 30);
    line(c, 953, 319, 953, 772, P.line, 2);
    hist(c, { x: 132, y: 694, w: 740, h: 226, ranges: [[obs, n]], small: true });
    const show = cue(k, 2, 'On the right', 0.4);
    if (show) {
      bootInset(c, 1010, 694, 733, 226);
      label(c, 'lift in points', 1372, 775, 28, P.slate, 'center');
    }
    label(c, 'B wins in 13 fair directions', 500, 775, 26, P.slate, 'center');
    note(
      c,
      'Two draws, two different questions.',
      b === 3 ? 'A posterior needs a prior + model' : '',
    );
  } else if (b <= 5) {
    const empty = cue(k, 5, 'With no disagreements', 0.4) > 0;
    if (empty) {
      ticket(c, 338, 383, 1244, 313);
      label(c, 'DISAGREEMENT TICKETS', 399, 446, 30);
      line(c, 389, 501, 1528, 501, P.line, 2, [8, 7]);
      title(c, 'No signs to assign', 399, 592, 61);
      label(c, 'd = 0', 1479, 590, 51, P.slate, 'right');
      note(c, 'The single empty assignment has zero B wins.', 'p = 1');
      return;
    }
    const five = cue(k, 4, 'Add a fifth', 1) > 0,
      d = five ? 5 : 4,
      count = 2 ** d;
    for (let i = 0; i < count; i++) {
      const cols = count === 16 ? 4 : 8,
        x = 148 + ((i % cols) * 1620) / cols,
        y = 365 + Math.floor(i / cols) * 96;
      const ss = i.toString(2).padStart(d, '0').replaceAll('0', 'A').replaceAll('1', 'B');
      const hit = i === count - 1;
      ticket(c, x, y, 1620 / cols - 22, 76, hit ? P.straw : P.white);
      label(c, ss, x + (1620 / cols - 22) / 2, y + 39, 33, hit ? P.gold : P.ink, 'center');
    }
    note(c, 'One sweep among equally likely strings.', '1 / ' + count + '  =  ' + prob(1 / count));
  } else {
    const cells = [
      ['Null true', 'False win · Type I', 'Correct non-rejection'],
      ['B advantage', 'Detection · power', 'Miss · Type II'],
    ];
    label(c, 'TRUTH', 153, 355);
    label(c, 'Reject H₀', 710, 355);
    label(c, 'Fail to reject H₀', 1280, 355);
    cells.forEach((r, i) =>
      r.forEach((v, j) => {
        const x = [145, 700, 1270][j],
          y = 411 + i * 148;
        ticket(c, x, y, 500, 109, j === 0 ? P.white : (i === 0) === (j === 1) ? P.blush : P.sea);
        text(c, v, x + 28, y + 56, 38);
      }),
    );
    note(
      c,
      b === 6
        ? 'Trace the same decision under two truths.'
        : 'Equivalence needs a tolerance chosen in advance.',
    );
  }
}
export function power(c, k) {
  const b = bi(k),
    d = b === 2 ? 64 : 13,
    alt = b === 0 ? 0.5 : 0.65;
  const xs = [studies.null, studies.small, studies.large][b],
    rule = exactSignPower(d, 0.65);
  const rate = b === 0 ? rule.size : rule.power;
  const visible = Math.max(
    1,
    Math.floor(
      xs.length *
        cue(k, b, ['Each dot', 'Keep the same rejection rule', 'The critical count'][b], 3.0),
    ),
  );
  const xmin = b === 2 ? 23 : 0,
    xmax = b === 2 ? 58 : 13;
  const x = (v) => 147 + (1570 * (v - xmin)) / (xmax - xmin),
    gate = x(rule.critical - 0.5);
  label(c, 'Chance B wins a disagreement  ' + prob(alt), 147, 320, 30);
  label(c, 'rejection begins at ' + rule.critical, gate, 374, 28, P.gold, 'center');
  line(c, gate, 407, gate, 723, P.gold, 4, [10, 7]);
  const rejected = xs.slice(0, visible).filter((s) => s.rejects).length;
  label(c, rejected + ' of ' + visible + ' studies reject', 145, 407, 28, P.teal);
  const stack = new Map();
  xs.slice(0, visible).forEach((r) => {
    const j = stack.get(r.wins) || 0;
    stack.set(r.wins, j + 1);
    const col = b === 2 ? 2 : 5;
    dot(
      c,
      x(r.wins) + ((j % col) - (col - 1) / 2) * 10,
      706 - Math.floor(j / col) * 12,
      5.3,
      r.rejects ? P.gold : P.teal,
    );
  });
  line(c, x(xmin), 723, x(xmax), 723, P.ink, 3);
  for (let i = xmin; i <= xmax; i++)
    if (d === 13 || i % 5 === 0) label(c, i, x(i), 723 + 34, 26, P.slate, 'center');
  label(c, 'B wins per study', x(xmax), 800, 27, P.slate, 'right');
  const summary = b === 0
    ? 'False rejections under equal win chances.'
    : 'Detection under the specified advantage.';
  const result = visible === xs.length
    ? (b === 0 ? 'Exact size  ' : 'Exact power  ') + prob(rate)
    : visible + ' / ' + xs.length + ' studies';
  if (b === 2) {
    title(c, summary, 94, 850, 43);
    text(c, result, 1826, 850, 42, P.teal, { face: 'Mono', align: 'right' });
  } else note(c, summary, result);
}
const familyAlpha = 0.05;
const comparisons = variantStudies.length;
function rejectionGate(name, alpha) {
  return { name, alpha, ...exactSignPower(n, 0.65, alpha) };
}
const unadjustedGate = rejectionGate('Unadjusted', familyAlpha);
const bonferroniGate = rejectionGate('Bonferroni', familyAlpha / comparisons);
const familyRisk = 1 - (1 - unadjustedGate.size) ** comparisons;
export function search(c, k) {
  const b = bi(k);
  if (b < 2) {
    const gate = cue(k, 1, 'twelve', 0) ? bonferroniGate : unadjustedGate;
    const crit = gate.critical;
    const x = 170,
      y = 745,
      h = 352,
      w = 1548,
      step = w / comparisons,
      at = (v) => y - (h * v) / n;
    const seen = Math.max(1, Math.ceil(comparisons * cue(k, 0, 'twenty prompt variants', 2.4)));
    variantStudies.slice(0, seen).forEach((r, i) => {
      const bh = y - at(r.wins);
      rect(c, x + i * step + 8, y - bh, step - 16, bh, r.wins >= crit ? P.gold : P.teal, 3);
      if (r.wins >= unadjustedGate.critical)
        label(c, r.wins, x + (i + 0.5) * step, y - bh + 52, 26, P.white, 'center');
      label(c, i + 1, x + (i + 0.5) * step, y + 36, 24, P.slate, 'center');
    });
    line(c, x, at(crit), x + w, at(crit), P.gold, 4, [12, 7]);
    label(c, gate.name + '  ·  reject at ' + crit + ' or more B wins', x, at(crit) - 36, 29, P.gold);
    label(c, 'B wins out of ' + n, x, 315, 29);
    captionSafeNote(
      c,
      b === 0
        ? 'Twenty independent tests under the null.'
        : gate === unadjustedGate
          ? 'Divide the family budget across the comparisons.'
          : 'Bonferroni also bounds risk for dependent tests.',
      b === 0
        ? seen === comparisons && k.elapsed >= k.speechDuration
          ? 'Family risk  ' + prob(familyRisk)
          : seen + ' of ' + comparisons + ' comparisons'
        : gate === unadjustedGate
          ? familyAlpha + ' ÷ ' + comparisons
          : 'α per test  =  ' + gate.alpha,
    );
  } else {
    const seen = Math.max(
      2,
      Math.ceil(peeking.length * cue(k, 2, 'Follow this fixed null sequence', 4)),
    );
    const x = (i) => 170 + i * 24.4,
      y = (v) => 462 - 220 * Math.log10(Math.max(0.008, v));
    // A logarithmic axis gives the crossing enough room to inspect.
    const yy = (v) => 320 + (y(v) - 462) * 0.95;
    for (const v of [1, 0.1, 0.05, 0.01]) {
      line(c, 170, yy(v), 1720, yy(v), v === 0.05 ? P.gold : P.line, 2, v === 0.05 ? [10, 6] : []);
      label(c, v, 153, yy(v), 25, P.slate, 'right');
    }
    peeking.slice(0, seen).forEach((r, i) => {
      if (i) line(c, x(i - 1), yy(peeking[i - 1].p), x(i), yy(r.p), P.teal, 5);
      if (r.p <= 0.05) dot(c, x(i), yy(r.p), 9, P.rust);
    });
    label(c, 'p-value', 170, 280);
    label(c, 'successive looks  →', 1720, 800, 27, P.slate, 'right');
    note(c, 'A first-crossing stop selects a favorable look.', 'Fix the stopping rule.');
  }
}
export function checkInference() {
  assert.deepEqual(
    counts,
    binomialMasses(13).map((v) => v * 8192),
  );
  assert.equal(counts[8], 1287);
  assert.equal(tail, 2380);
  assert.deepEqual(
    Array.from({ length: n - obs + 1 }, (_, i) => patternCount(highlightedRanges(obs + i, false))),
    [1287, 2002, 2288, 2366, 2379, 2380],
  );
  assert.equal(patternCount(highlightedRanges(n, true)), 4760);
  assert.equal(chance, exactRightTail(obs, n));
  assert.equal(unadjustedGate.critical, 10);
  assert.equal(bonferroniGate.critical, 12);
  assert.equal(exactRightTail(variantStudies[18].wins, n), 92 / 8192);
  for (const gate of [unadjustedGate, bonferroniGate]) {
    for (const { wins } of variantStudies) {
      assert.equal(wins >= gate.critical, exactRightTail(wins, n) <= gate.alpha);
    }
  }
  assert.equal(Math.round(familyRisk * 100), 61);
  assert.equal(Math.round(exactSignPower(64).power * 100), 71);
  assert(peeking.some((r) => r.p < 0.05));
  assert(peeking.at(-1).p > 0.05);
}
