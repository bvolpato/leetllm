import assert from 'node:assert/strict';
import {
  subsets,
  passAtK,
  estimatorFactors,
  estimatorExpectation,
} from '../../../films/hypothesis-testing/arithmetic.mjs';
import {
  candidateSubsets,
  passingCandidates,
  macroTaskScores,
  macroTaskResamples,
  macroTaskInterval,
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
  mark,
  note,
  captionSafeNote,
  smooth,
  cue,
  total,
  pct,
  pool,
  bracket,
  arrow,
} from './art.mjs';
const values = Array.from({ length: 10 }, (_, i) => Number(passingCandidates.includes(i)));
const sixPasses = Array.from({ length: 10 }, (_, i) => Number(i < 6));
const fourFailures = sixPasses.flatMap((v, i) => v ? [] : [i]);
const fives = subsets(10, 5).map((ids) => ({ ids, passes: ids.some((i) => values[i]) }));
const hits = (group) => group.filter((r) => r.passes).length;
const testPool = [
  [1, 0, 0],
  [0, 0, 1],
  [0, 0, 0],
];
const first = testPool.filter((r) => r[0]).length,
  any = testPool.filter((r) => r.some(Boolean)).length;
const uniform = total(testPool.flat()) / testPool.flat().length;
const mean = (s) => total(s) / s.length;
function subsetLedger(c, group, shown, x, y, w, cols) {
  const step = w / cols;
  group.forEach((r, i) => {
    const xx = x + (i % cols) * step,
      yy = y + Math.floor(i / cols) * 26;
    rect(c, xx, yy, step - 5, 19, i < shown ? (r.passes ? P.teal : P.rust) : P.faint, 2);
  });
}
export function triples(c, k) {
  const b = bi(k),
    n = candidateSubsets.length,
    q = cue(k, 1, 'Move several other', 2.8);
  const count = b === 0 ? 0 : Math.max(1, Math.round(q * n));
  const chosen = candidateSubsets[Math.max(0, count - 1)];
  label(c, 'PERMISSION   /   10 independent candidate positions', 144, 314, 29);
  pool(c, values, { x: 127, y: 364, w: 1656, selected: chosen.ids });
  label(c, 'One mark per distinct triple', 145, 581, 28);
  subsetLedger(c, candidateSubsets, count, 145, 631, 1608, 30);
  const solved = hits(candidateSubsets);
  const done = cue(k, 1, 'Each subset has', 0) > 0;
  if (b === 2) {
    label(c, 'All-failing triples   ' + (n - solved) + ' of ' + n, 147, 790, 29, P.rust);
    text(c, 'pass@k  =  1 − C(n−c, k) / C(n, k)', 1780, 790, 37, P.ink, { align: 'right' });
  }
  captionSafeNote(
    c,
    b === 0
      ? 'Which three positions are selected?'
      : done
        ? 'Estimate success in three independent tries.'
        : 'Each triple catches a pass or misses both.',
    done ? solved + ' / ' + n + '   =   ' + pct(solved / n) : 'k = 3',
  );
}
function targetCurve(c, k, b) {
  const x0 = 185,
    y0 = 744,
    w = 915,
    h = 356,
    g = (p) => 1 - (1 - p) ** 3;
  line(c, x0, y0, x0 + w, y0, P.slate, 3);
  line(c, x0, y0, x0, y0 - h, P.slate, 3);
  label(c, 'chance at least one of three passes', x0, 315, 28);
  const count = Math.max(1, Math.floor(cue(k, 3, 'For k independent tries', 1.5) * 80));
  for (let i = 1; i <= count; i++)
    line(
      c,
      x0 + ((i - 1) * w) / 80,
      y0 - g((i - 1) / 80) * h,
      x0 + (i * w) / 80,
      y0 - g(i / 80) * h,
      P.teal,
      6,
    );
  for (const n of [0, 0.5, 1]) {
    label(c, String(n), x0 + n * w, y0 + 33, 26, P.slate, 'center');
    if (n) label(c, String(n), x0 - 19, y0 - n * h, 24, P.slate, 'right');
  }
  label(c, 'single-attempt success chance p', x0 + w, y0 + 81, 28, P.slate, 'right');
  label(c, 'ALL k FAIL', 1242, 423, 30);
  title(c, '(1 − p)ᵏ', 1242, 498, 65);
  if (b > 3) {
    label(c, 'AT LEAST ONE PASS', 1242, 604, 30);
    title(c, '1 − (1 − p)ᵏ', 1242, 681, 61, P.teal);
  }
  note(c, 'One fixed task and decoder. Independent draws.', 'k = 3 on curve');
}
export function targets(c, k) {
  const b = bi(k);
  if (b <= 2) {
    const open = cue(k, 0, 'Now allow all three attempts', 0.7) > 0;
    const uniformView = cue(k, 1, 'If each of the three positions', 0.5) > 0;
    ['Timestamp', 'Retry', 'Quota'].forEach((task, i) => {
      const y = 419 + 142 * i;
      title(c, task, 153, y, 42);
      for (let j = 0; j < 3; j++) {
        const x = 690 + j * 261;
        ticket(c, x - 79, y - 53, 158, 106, open || j === 0 ? P.white : P.faint);
        if (open || j === 0) mark(c, x, y, testPool[i][j], 31);
        else label(c, '·', x, y, 42, P.slate, 'center');
      }
      if (uniformView) label(c, total(testPool[i]) + ' / 3', 1580, y, 44, P.teal, 'center');
    });
    for (let j = 0; j < 3; j++)
      label(c, 'Attempt ' + (j + 1), 690 + j * 261, 318, 29, P.slate, 'center');
    if (uniformView) label(c, 'Uniform pick', 1580, 318, 29, P.slate, 'center');
    const firstReady = b > 0 || k.reveal('Hold that first score', 0) > 0;
    const unorderedDone = b >= 2 || (b === 1 && k.elapsed >= k.speechDuration);
    captionSafeNote(
      c,
      uniformView
        ? 'Select one of the three positions uniformly.'
        : open
          ? 'Use all three attempts.'
          : 'Return the first answer.',
      uniformView
        ? unorderedDone
          ? 'Mean = 2/9'
          : ''
        : open
          ? cue(k, 1, 'two tasks solved', 0) > 0
            ? any + ' of 3 solved'
            : first + ' of 3 on first try'
          : firstReady
            ? first + ' of 3 solved'
            : '',
    );
  } else if (b <= 5) targetCurve(c, k, b);
  else {
    const a = [0, 1, 2],
      bset = [1, 2, 3];
    label(c, 'One ten-candidate pool', 159, 319, 31);
    pool(c, values, { y: 391 });
    const centers = Array.from({ length: 10 }, (_, i) => 145 + (i + 0.5) * 156);
    [a, bset].forEach((r, j) => {
      const y = 604 + j * 105,
        x = centers[r[0]] - 48,
        end = centers[r.at(-1)] + 48;
      bracket(c, x, y, end - x, j ? P.rust : P.teal, -19);
      label(c, 'Triple ' + (j + 1), end + 45, y, 30, j ? P.rust : P.teal);
    });
    note(
      c,
      b === 8
        ? 'Set the operating budget before collecting candidates.'
        : 'Two triples reuse positions 2 and 3.',
      b === 6 ? 'Average subset indicators' : b === 7 ? 'HumanEval  n = 200' : 'n ≥ k',
    );
  }
}
const expectation = estimatorExpectation(0.2, 10, 5),
  factors = estimatorFactors(2, 10, 5);
const failingPositions = values.flatMap((passes, i) => passes ? [] : [i]);
const returned = Array(5).fill([failingPositions.length, values.length]);
const removed = returned.map(([failures, size], i) => [failures - i, size - i]);
const complement = (track) => 1 - track.reduce((v, [n, d]) => (v * n) / d, 1);
const fiveHits = hits(fives);
function fractionLabel(numerator, denominator) {
  let divisor = denominator;
  for (let remainder = numerator; remainder;) {
    [divisor, remainder] = [remainder, divisor % remainder];
  }
  return numerator / divisor + '/' + denominator / divisor;
}
const fiveScore = fractionLabel(fiveHits, fives.length);

function afterPhrase(k, beat, phrase) {
  if (bi(k) !== beat) return bi(k) > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: false }) === 1;
}

function failedTracks(c, k) {
  const lift = cue(k, 2, 'if the first pick fails', 0.65, { captionStart: false });
  const putBack = cue(k, 2, 'Put the failed candidate back', 0.7);
  const setAside = cue(k, 2, 'set it aside', 0.7, { captionStart: false });
  const more = 3 * cue(k, 3, 'Follow three more failing picks', 2.7);
  // A frame on a draw boundary can land a fraction below the integer.
  const completed = Math.floor(more + 1e-9);
  const nextPick = Math.max(0, more - completed);

  label(c, 'Candidate positions', 462, 259, 29);
  line(c, 147, 534, 1769, 534, P.line, 2);
  for (const withoutReplacement of [false, true]) {
    const track = withoutReplacement ? removed : returned;
    const y = withoutReplacement ? 638 : 372;
    const color = withoutReplacement ? P.teal : P.rust;
    const firstPick = withoutReplacement ? setAside : putBack;
    const settled = Number(firstPick === 1) + completed;
    const second = withoutReplacement
      ? afterPhrase(k, 3, 'only seven of nine can')
      : afterPhrase(k, 2, 'eight of ten positions can still fail');
    const result = withoutReplacement
      ? afterPhrase(k, 4, 'seven ninths we counted')
      : afterPhrase(k, 3, 'sixty-seven percent');
    const subtract = withoutReplacement
      ? cue(k, 4, 'subtract the product from one', 0, { captionStart: false })
      : cue(k, 3, 'Subtract that product from one', 0, { captionStart: false });

    title(c, withoutReplacement ? 'Set it aside' : 'Put it back', 147, y - 3, 45);
    label(c, track[settled][1] + ' in the pool', 147, y + 44, 32);
    if (withoutReplacement && setAside > 0) label(c, 'Removed picks', 147, y - 59, 29, P.rust);

    values.forEach((passes, slot) => {
      const x = 498 + slot * 108;
      const failure = failingPositions.indexOf(slot);
      let height = 0;
      if (failure === 0) {
        height = withoutReplacement ? (lift + setAside) / 2 : lift * (1 - putBack);
      } else if (failure > 0) {
        if (withoutReplacement && failure <= completed) height = 1;
        else if (failure === completed + 1) {
          height = withoutReplacement ? nextPick : 1 - Math.abs(2 * nextPick - 1);
        }
      }
      const docked = withoutReplacement && failure >= 0 && failure < settled;
      // Pending picks stay in contact with their pool slot until the count commits.
      const liftDistance = withoutReplacement ? (docked ? 60 : 24) : 60;
      const chipY = y - liftDistance * smooth(height);
      if (docked || (!withoutReplacement && height > 0))
        rect(c, x - 47, y - 26, 94, 52, P.faint, 8);
      rect(c, x - 47, chipY - 26, 94, 52, height > 0 ? P.straw : P.white, 8, P.line);
      mark(c, x - 22, chipY, passes, 16);
      label(c, String(slot + 1).padStart(2, '0'), x + 17, chipY, 30, P.ink, 'center');
    });

    label(c, 'Failure chances', 147, y + 103, 28);
    track.forEach(([failures, size], i) => {
      const x = 462 + i * 197;
      const known = i === 0 || (i === 1 ? second : i <= settled);
      const active = known && i === settled;
      const fill = active ? (withoutReplacement ? P.sea : P.blush) : P.white;
      ticket(c, x, y + 71, 152, 66, fill);
      label(
        c,
        known ? failures + '/' + size : '·',
        x + 76,
        y + 104,
        37,
        active ? color : P.slate,
        'center',
      );
      if (i < track.length - 1) label(c, '×', x + 174, y + 104, 28, P.slate, 'center');
    });
    if (subtract) label(c, 'Estimate = 1 − product', 1684, y + 60, 24, P.slate, 'center');
    if (result) {
      const score = withoutReplacement ? fiveScore : '≈ ' + pct(complement(track));
      label(c, score, 1684, y + 104, 43, color, 'center');
    }
  }
  line(c, 94, 809, 1826, 809, P.line, 2);
  title(c, 'Both pools keep the same two passing candidates.', 94, 849, 48);
}
function biasCurve(c, k, b) {
  const x = 197,
    y = 745,
    w = 989,
    h = 353;
  const g = (t) => 1 - (1 - t) ** 5;
  line(c, x, y, x + w, y, P.ink, 3);
  line(c, x, y, x, y - h, P.ink, 3);
  label(c, 'Estimated success in five tries', x, 310, 29);
  const rise = cue(k, 6, 'Trace them up', 1.3);
  for (let i = 1; i <= 100; i++)
    line(
      c,
      x + (w * (i - 1)) / 100,
      y - g((i - 1) / 100) * h,
      x + (w * i) / 100,
      y - g(i / 100) * h,
      P.slate,
      3,
    );
  expectation.mass.forEach((mass, i) => {
    const at = x + (i * w) / 10,
      yy = y - g(i / 10) * h * smooth(rise);
    dot(c, at, yy, Math.max(3, Math.sqrt(mass) * 45), P.gold);
  });
  for (const t of [0, 0.2, 0.5, 1]) label(c, t, x + t * w, y + 37, 28, P.slate, 'center');
  label(c, 'observed c/n', x + w + 240, y + 38, 28, P.slate, 'right');
  label(c, 'True single-draw chance', 1320, 393, 29);
  title(c, 'p = 0.20', 1320, 466, 63);
  if (cue(k, 6, 'Averaged over pools', 0)) {
    label(c, 'Mean plug-in estimate', 1320, 570, 28);
    title(c, pct(expectation.plugin), 1320, 637, 61, P.rust);
  }
  if (b >= 7) label(c, 'True target  ' + pct(expectation.target), 1320, 744, 33, P.teal);
  captionSafeNote(
    c,
    'Dot area follows the probability of each pool count.',
    b >= 7 ? 'Distinct-subset mean  ' + pct(expectation.combinatorial) : '',
  );
}
export function bias(c, k) {
  const b = bi(k);
  if (b < 2) {
    const count = Math.max(1, Math.ceil(fives.length * cue(k, 0, 'next possible five', 3)));
    label(c, 'Same pool   /   now choose five distinct positions', 148, 311, 29);
    pool(c, values, { y: 355, selected: fives[count - 1].ids });
    subsetLedger(c, fives, count, 145, 582, 1615, 42);
    cue(k, 1, 'All we changed', 0);
    const missesKnown = afterPhrase(k, 1, 'fifty-six miss both passing answers');
    const scoreKnown = afterPhrase(k, 1, 'seven ninths');
    if (missesKnown) label(c, fives.length - fiveHits + ' all-failing subsets', 145, 776, 29, P.rust);
    const result = scoreKnown
      ? fiveHits + ' / ' + fives.length + '  =  ' + fiveScore
      : count + ' / ' + fives.length + ' checked';
    line(c, 94, 809, 1826, 809, P.line, 2);
    title(c, 'Count subsets that include at least one pass.', 94, 849, 48, P.ink, 'left', 1060);
    text(c, result, 1826, 849, 44, P.teal, { face: 'Mono', align: 'right', max: 642 });
  } else if (b <= 4) failedTracks(c, k);
  else if (b <= 7) biasCurve(c, k, b);
  else if (b === 8) {
    const forced = cue(k, 8, 'Now put six passes', 0.6) > 0,
      vs = forced ? sixPasses : Array(10).fill(0);
    const setAside = Math.ceil(4 * cue(k, 8, 'Set aside four failures', 0.9));
    const selected = forced ? fourFailures.slice(0, setAside) : [0, 1, 2, 3, 4];
    const scored = forced ? cue(k, 8, 'Only passes remain', 0) : cue(k, 8, 'the score is zero', 0);
    label(c, 'Boundary case   /   10 positions, budget 5', 153, 326, 30);
    pool(c, vs, { y: 411, selected });
    const rackLabel = setAside === 4 ? 'Four failures have used four slots.' : 'Six passes and four failures.';
    title(c, forced ? rackLabel : 'All ten positions fail.', 155, 690, 53);
    const selectionRule = scored ? 'Every five-position subset contains a pass.' : 'Choose five distinct positions.';
    note(
      c,
      forced ? selectionRule : 'Every five-position subset fails.',
      scored ? 'pass@5 = ' + passAtK(total(vs), 10, 5) : '',
    );
  } else {
    label(c, 'PERMISSION   /   n = 10, c = 2, k = 5', 151, 317, 29);
    factors.factors.forEach(({ i }, j) => {
      const x = 187 + j * 517;
      ticket(c, x, 441, 438, 195, P.white);
      label(c, 'i = ' + i, x + 43, 487);
      title(c, '1 − 5/' + i, x + 47, 568, 68);
    });
    title(c, '×', 654, 546, 66);
    title(c, '→', 1192, 549, 67, P.slate);
    label(c, 'ALL FIVE FAIL', 1324, 473, 29);
    title(c, '2/9', 1324, 561, 84, P.rust);
    title(c, '1 − (4/9 × 5/10) = 7/9', 188, 758, 54, P.teal);
    note(c, 'Check the pool, pass count and operating budget.', '0 ≤ c ≤ n,   1 ≤ k ≤ n');
  }
}
const macroCounts = [0, 1, 2, 4];
function taskRacks(c, show) {
  macroCounts.forEach((count, i) => {
    const x = 172 + i * 410;
    label(c, 'TASK ' + (i + 1), x, 328, 30);
    for (let j = 0; j < 10; j++)
      mark(c, x + 24 + (j % 5) * 67, 432 + Math.floor(j / 5) * 80, Number(j < count), 21);
    line(c, x, 578, x + 320, 578, P.line, 2);
    label(c, count + ' of 10 pass', x, 639, 32);
    if (show || i < 2) title(c, pct(macroTaskScores[i]), x, 735, 62, P.teal);
  });
}
export function macro(c, k) {
  const b = bi(k);
  if (b < 2 || b >= 7) {
    taskRacks(c, b !== 0 || cue(k, 0, 'On the second', 0.6) > 0);
    note(
      c,
      b >= 7
        ? 'A matched estimate for A is needed on each task.'
        : 'Each task contributes one score at k = 5.',
      b >= 7
        ? 'B only'
        : b === 1 && k.reveal('This is macro', 0.2) > 0
          ? 'Mean   ' + pct(mean(macroTaskScores))
          : '',
    );
  } else if (b <= 4) {
    const tries = cue(k, 2, 'Give every task four more attempts', 0.5) > 0 ? 5 : 1;
    for (let i = 0; i < 4; i++) {
      const y = 365 + i * 106;
      label(c, 'Task ' + (i + 1), 182, y, 31);
      for (let j = 0; j < tries; j++) mark(c, 544 + j * 158, y, i < 2, 29);
      if (tries === 5)
        text(c, i < 2 ? 'always passes' : 'always fails', 1435, y, 36, i < 2 ? P.teal : P.rust);
    }
    const show = cue(k, 3, "You've invented", 0) > 0;
    captionSafeNote(
      c,
      'Half the tasks always pass. Half always fail.',
      show
        ? '50% actual  /  96.9% pooled'
        : tries + ' attempt' + (tries === 1 ? '' : 's') + ' per task',
    );
  } else {
    const q = cue(k, 5, 'each of those two hundred', 2.7),
      idx = Math.min(255, Math.floor(q * 255)),
      sample = macroTaskResamples[idx];
    label(c, 'Four draws with replacement from the four task scores', 154, 322, 30);
    sample.ids.forEach((id, j) => {
      const x = 151 + j * 420;
      ticket(c, x, 393, 373, 160, P.white);
      label(c, 'Task ' + (id + 1), x + 39, 442, 31);
      title(c, pct(macroTaskScores[id]), x + 39, 510, 52, P.teal);
    });
    const means = macroTaskResamples
      .slice(0, idx + 1)
      .map((r) => r.mean)
      .sort((a, b) => a - b);
    const show = b === 6 && k.reveal('The approximate interval', 0.5) > 0;
    means.forEach((v, i) => {
      const x = 162 + i * 6.19;
      line(
        c,
        x,
        767,
        x,
        767 - v * 145,
        show && (v < macroTaskInterval[0] || v > macroTaskInterval[1]) ? P.line : P.teal,
        4,
      );
    });
    label(
      c,
      show ? 'Ordered resample means   /   2.5th and 97.5th percentiles' : 'Ordered resample means, low to high',
      150,
      808,
      26,
    );
    line(c, 94, 830, 1826, 830, P.line, 2);
    title(
      c,
      show
        ? 'Task mix varies. Each candidate pool stays fixed.'
        : 'Four choices in each of four slots.',
      94,
      859,
      43,
      P.ink,
      'left',
      1060,
    );
    text(
      c,
      show ? pct(macroTaskInterval[0], 0) + ' to ' + pct(macroTaskInterval[1], 0) : '4⁴ = 256',
      1826,
      859,
      43,
      P.teal,
      { face: 'Mono', align: 'right', max: 642 },
    );
  }
}
const draws = ['X', 'X', 'Y', 'Z'],
  unique = [...new Set(draws)];
function drawPairs(strings) {
  return subsets(strings.length, 2).map((ids) => {
    const names = ids.map((j) => strings[j]);
    return { names, passes: names.includes('Y') };
  });
}
const originalPairs = drawPairs(draws),
  reducedPairs = drawPairs(unique);
function pairExamples(c, pairs, showHits, x, y, w) {
  pairs.forEach(({ names, passes }, i) => {
    const xx = x + ((i % 3) * w) / 3,
      yy = y + Math.floor(i / 3) * 90,
      ok = showHits && passes;
    ticket(c, xx, yy, w / 3 - 18, 68, ok ? P.sea : P.white);
    label(
      c,
      names.join(' + '),
      xx + (w / 3 - 18) / 2,
      yy + 35,
      29,
      ok ? P.teal : P.slate,
      'center',
    );
  });
}
export function protocol(c, k) {
  const b = bi(k);
  if (b <= 1) {
    const del = cue(k, 0, 'second X', 0);
    const beforeHits = cue(k, 0, 'Three of the six pairs contain Y', 0);
    const afterHits = cue(k, 0, 'The score jumps', 0);
    const afterScore = cue(k, 0, 'without generating', 0);
    for (const [j, ss, pairs, showHits] of [
      [0, draws, originalPairs, beforeHits],
      [1, unique, reducedPairs, afterHits],
    ]) {
      if (j && !del) continue;
      const x = 159 + 850 * j;
      label(c, j ? 'AFTER DELETING A DRAW' : 'ORIGINAL DRAW POSITIONS', x, 328, 28);
      pool(
        c,
        ss.map((v) => Number(v === 'Y')),
        { x, y: 381, w: 698, names: ss, ids: false },
      );
      pairExamples(c, pairs, showHits, x, 602, 717);
    }
    const originalScore = hits(originalPairs) + '/' + originalPairs.length;
    const reducedScore = hits(reducedPairs) + '/' + reducedPairs.length;
    let caption = 'The duplicate X occupies two sampled positions.';
    if (del) caption = 'How many of the remaining pairs contain Y?';
    if (afterScore) caption = 'Deleting X changes the weight of Y.';
    if (b === 1) caption = 'Early stopping or feedback also changes the experiment.';
    const score = afterScore ? originalScore + '  →  ' + reducedScore : 'Original   ' + originalScore;
    note(c, caption, beforeHits ? score : '');
  } else if (b <= 3) {
    const deterministic = b === 3;
    for (const [i, n] of [50, 100].entries()) {
      const x = 160 + i * 875;
      label(c, 'POOL   n = ' + n, x, 344, 31);
      for (let j = 0; j < n; j++) {
        const xx = x + (j % 20) * 36,
          yy = 435 + Math.floor(j / 20) * 39;
        dot(c, xx + 16, yy, 12, deterministic ? P.teal : P.slate);
      }
      title(c, deterministic ? 'Same passing answer' : 'Budget k = 3', x, 687, 48);
    }
    note(
      c,
      deterministic
        ? 'A genuinely deterministic decoder repeats its answer.'
        : 'Predeclared pool sizes may differ at the same k.',
      deterministic ? 'pass@1 = pass@3' : 'Both pools need n ≥ 3',
    );
  } else if (b < 6) {
    const choose = cue(k, 4, 'Suppose it picks candidate one', 0.5) > 0;
    label(c, 'One task   /   hidden tests accept candidate 3', 158, 321, 30);
    pool(c, [0, 0, 1, 0], { x: 150, y: 419, w: 1190, selected: choose ? [0] : [] });
    line(c, 1410, 346, 1410, 746, P.line, 2);
    label(c, 'USER RECEIVES', 1482, 410, 28);
    if (choose) {
      title(c, 'No. 1', 1482, 515, 65);
      mark(c, 1561, 633, 0, 43);
      label(c, 'fail', 1638, 633, 36, P.rust);
    }
    note(c, 'The product must choose without the hidden tests.', choose ? 'selector picked 1' : '');
  } else {
    const x = 220,
      y = 371;
    rect(c, x, y, 1100, 382, P.sea, 20, P.teal);
    label(c, 'EXECUTION SANDBOX', x + 42, y + 53, 31, P.teal);
    ticket(c, x + 60, y + 132, 361, 141);
    title(c, 'Candidate', x + 97, y + 202, 51);
    arrow(c, x + 449, y + 203, x + 552, y + 203);
    ticket(c, x + 580, y + 132, 450, 141);
    title(c, 'Hidden tests', x + 630, y + 202, 51);
    line(c, 1363, 391, 1363, 741, P.rust, 6, [14, 8]);
    label(c, 'Restricted network', 1400, 529, 30, P.rust);
    text(c, 'Host resources', 1400, 616, 38);
    line(c, 94, 808, 1826, 808, P.line, 2);
    title(c, 'Verify the execution boundary before running candidates.', 94, 851, 44);
    text(c, 'Report cost and latency.', 1826, 851, 41, P.teal, { face: 'Mono', align: 'right' });
  }
}
export function checkAttempts() {
  assert.deepEqual(
    [candidateSubsets.length, hits(candidateSubsets), fives.length, fiveHits],
    [120, 64, 252, 196],
  );
  assert(candidateSubsets[0].passes);
  assert.deepEqual([first, any, uniform], [1, 2, 2 / 9]);
  for (const [i, factor] of removed.entries()) {
    const setAside = failingPositions.slice(0, i);
    const available = values.filter((_, slot) => !setAside.includes(slot));
    assert.deepEqual(factor, [available.length - total(available), available.length]);
    assert.deepEqual(returned[i], [8, 10]);
  }
  assert.equal(fiveScore, '7/9');
  assert.equal(complement(removed), fiveHits / fives.length);
  assert(Math.abs(complement(returned) - 0.67232) < 1e-8);
  assert(expectation.plugin < expectation.target);
  assert(Math.abs(expectation.combinatorial - expectation.target) < 1e-10);
  assert.deepEqual(fourFailures, [6, 7, 8, 9]);
  assert(fives.every(({ ids }) => ids.some((i) => sixPasses[i])));
  assert.equal(passAtK(total(sixPasses), sixPasses.length, 5), 1);
  assert.equal(passAtK(0, 10, 5), 0);
  assert.throws(() => passAtK(1, 2, 3));
  assert(Math.abs(factors.success - 7 / 9) < 1e-10);
  assert.deepEqual(
    macroTaskScores,
    macroCounts.map((c) => passAtK(c, 10, 5)),
  );
  assert.equal(macroTaskResamples.length, 256);
  assert.equal(mean(macroTaskScores).toFixed(3), '0.563');
  assert.deepEqual([hits(originalPairs), originalPairs.length], [3, 6]);
  assert.deepEqual([hits(reducedPairs), reducedPairs.length], [2, 3]);
  for (const [strings, pairs] of [[draws, originalPairs], [unique, reducedPairs]]) {
    const estimate = passAtK(strings.filter((s) => s === 'Y').length, strings.length, 2);
    assert(Math.abs(hits(pairs) / pairs.length - estimate) < 1e-12);
  }
}
