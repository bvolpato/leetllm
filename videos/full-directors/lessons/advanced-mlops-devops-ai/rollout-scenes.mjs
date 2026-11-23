import { P, box, line, dot, txt, mono, cap, serif, stage, caption, cue, fade, travel } from './paint.mjs';
import { receipt, budget, pairs, pairedSummary, assigned } from './mechanics.mjs';

function contract(c, k) {
  stage(
    c,
    'OFFLINE EVALUATION',
    'Which answers count as a release test?',
    'Example golden request   /   “When does the western deployment window open?”',
  );
  const base = cue(k, 0, 'pin reviewed requests', 0.5);
  const fast = cue(k, 0, 'Check schemas', 0.45);
  const generated = cue(k, 0, 'generate fresh answers', 0.7);
  box(c, 96, 365, 780, 444, P.dark);
  cap(c, 'Reviewed before the edit', 146, 434, P.ice);
  fade(c, base, () => {
    serif(c, 'The calendar says 09:00.', 145, 551, 54, P.white);
    txt(c, 'Rubric accepts equivalent wording.', 146, 627, 36, P.ice);
    txt(c, 'Check grounding, safety and task outcome.', 146, 689, 32, P.ice);
  });
  cap(c, 'Evidence for this candidate', 998, 436);
  if (fast) {
    dot(c, 1021, 513, 13, P.aqua);
    txt(c, 'Parse schema and verify digests', 1061, 528, 39);
    dot(c, 1021, 594, 13, P.aqua);
    txt(c, 'Compare the feature values', 1061, 609, 39);
  }
  fade(c, generated, () => {
    dot(c, 1021, 705, 13, P.blue);
    txt(c, 'Generate and judge fresh replies', 1061, 720, 39, P.blue);
  });
  caption(
    c,
    generated
      ? 'Bind the scores to the evaluated prompt, model, settings, features and judge.'
      : 'The reviewed question and rubric stay fixed while the prompt changes.',
  );
}
export function budgetScene(c, k) {
  if (k.beat.beatIndex === 0) return contract(c, k);
  const base = receipt.baseline,
    cand = receipt.candidate;
  const q = cue(k, 1, 'quality rises'),
    lat = cue(k, 1, 'percentile latency'),
    seenBaseline = cue(k, 1, 'The baseline used');
  const seenLimit = cue(k, 1, 'fifteen percent growth'),
    seenCount = cue(k, 1, 'The candidate used');
  const showCap = cue(k, 2, 'The ceiling'),
    showGap = cue(k, 2, 'seventy-seven over');
  const oneOver = cue(k, 2, 'saving seventy-six tokens');
  const atCap = cue(k, 3, 'At seven hundred thirteen');
  const ceiling = budget(cand.tokens).cap;
  const r = budget(atCap ? ceiling : oneOver ? ceiling + 1 : cand.tokens);
  stage(
    c,
    'PROMOTION POLICY',
    'How far is the candidate from the token cap?',
    atCap || oneOver
      ? 'Arithmetic replay   /   quality and latency held fixed'
      : 'Same reviewed requests   /   all three point checks must pass',
  );
  cap(c, 'Quality must improve', 105, 405);
  if (q) mono(c, base.quality.toFixed(2) + ' → ' + cand.quality.toFixed(2), 103, 480, 54, P.aqua);
  cap(c, 'p95 latency ≤ ' + receipt.latencyLimit + ' ms', 1010, 405);
  if (lat) mono(c, base.latency + ' → ' + cand.latency + ' ms', 1009, 480, 54, P.aqua);
  if (oneOver) {
    const x = (t) => 318 + (t - (ceiling - 3)) * 211;
    cap(c, 'Token cap close-up   /   one tick per token', 103, 577);
    mono(c, 'baseline 620   +15%', 1800, 577, 32, P.muted, 'right');
    line(c, x(ceiling - 3), 674, x(ceiling + 3), 674, P.line, 4);
    for (let t = ceiling - 3; t <= ceiling + 3; t++) {
      line(c, x(t), 662, x(t), 690, P.muted, 2);
      mono(c, t, x(t), 738, 33, P.muted, 'center');
    }
    line(c, x(ceiling), 612, x(ceiling), 696, P.aqua, 5);
    mono(c, 'cap ' + ceiling, x(ceiling), 600, 33, P.aqua, 'center');
    const col = r.pass ? P.aqua : P.red;
    dot(c, x(r.tokens), 674, 17, col);
    mono(c, 'candidate ' + r.tokens, x(r.tokens), 818, 39, col, 'center');
    caption(
      c,
      r.pass
        ? '713 meets the cap. Re-evaluate any real prompt change.'
        : 'Hold promotion   ·   1 token over   ·   ' + r.growth.toFixed(1) + '% token growth',
      col,
    );
    return;
  }
  const x = (n) => 150 + n * 1.91;
  const y = 670;
  line(c, x(0), y, x(850), y, P.line, 3);
  for (let t = 0; t <= 800; t += 100) {
    line(c, x(t), y - 8, x(t), y + 11, P.muted, 2);
    if (t % 200 === 0) mono(c, t, x(t), y + 58, 26, P.muted, 'center');
  }
  cap(c, 'Mean tokens per request', 102, 578);
  if (seenBaseline) {
    line(c, x(0), y - 27, x(base.tokens), y - 27, P.blue, 10);
    mono(c, 'baseline ' + base.tokens, x(base.tokens) - 20, 615, 32, P.blue, 'right');
  }
  if (seenLimit) {
    line(c, x(base.tokens), y - 27, x(ceiling), y - 27, P.aqua, 10);
    line(c, x(ceiling), y - 102, x(ceiling), y + 91, P.aqua, 4, [9, 7]);
    mono(c, showCap ? 'cap ' + ceiling : 'cap +15%', x(ceiling), 550, 32, P.aqua, 'center');
  }
  if (seenCount) {
    const col = showGap ? (r.pass ? P.aqua : P.red) : P.amber;
    dot(c, x(r.tokens), y, 14, col);
    mono(c, 'candidate ' + r.tokens, x(r.tokens), 817, 39, col, 'center');
    line(c, x(r.tokens), y + 17, x(r.tokens), y + 30, col, 3);
  }
  const gapText = r.over === 1 ? '1 token over' : r.over + ' tokens over';
  caption(
    c,
    atCap
      ? '713 meets the cap. Re-evaluate any real prompt change.'
      : showGap
        ? 'Hold promotion   ·   ' + gapText + '   ·   ' + r.growth.toFixed(1) + '% token growth'
        : 'With the quality and latency checks met, how many tokens must the candidate save?',
    showGap && !r.pass ? P.red : P.aqua,
  );
}

function shadowFork(c, k) {
  stage(
    c,
    'SHADOW TRAFFIC',
    'Who receives the second answer?',
    'Sampled request   /   “When can we deploy?”',
  );
  const live = cue(k, 0, 'Control answers', 0.65);
  const deliver = cue(k, 0, 'sends that answer', 0.6);
  const mirror = cue(k, 0, 'copies the request', 0.75);
  const answer = cue(k, 0, 'Its answer is');
  const log = cue(k, 1, 'Into the shadow log', 0.6);
  const labels = ['Control', 'Shadow candidate'];
  const progress = [live, mirror];
  cap(c, 'Gateway', 110, 537);
  dot(c, 298, 568, 20, P.ink);
  for (let i = 0; i < 2; i++) {
    const y = i ? 714 : 450,
      col = i ? P.amber : P.blue;
    travel(
      c,
      [
        [320, 568],
        [452, 568],
        [565, y],
        [684, y],
      ],
      progress[i],
      col,
    );
    txt(c, labels[i], 710, y - 28, 40, col);
    if (i ? answer : live === 1) mono(c, i ? '13:00' : '09:00', 709, y + 54, 66, col);
    const dst = i ? log : deliver;
    travel(
      c,
      [
        [1070, y],
        [1390, y],
      ],
      dst,
      col,
    );
    if (dst === 1) {
      if (i) {
        box(c, 1438, y - 54, 322, 113, P.peach);
        mono(c, 'Shadow log', 1464, y + 17, 38, P.amber);
      } else {
        box(c, 1438, y - 54, 322, 113, P.mint);
        txt(c, 'User reply', 1474, y + 17, 43, P.blue);
      }
    }
  }
  caption(
    c,
    log
      ? 'Isolated credentials   ·   recorded tool results   ·   one user-visible reply'
      : 'The gateway has one user-facing response channel.',
  );
}
function pairsScene(c, k) {
  stage(
    c,
    'PAIRED SHADOW RUN',
    'What did the shadow comparison measure?',
    'Three matched inputs   /   control served every user',
  );
  const cols = [111, 398, 657, 919, 1199, 1500];
  ['Request', 'Live judge', 'Shadow judge', 'Difference', 'Live tokens', 'Shadow tokens'].forEach(
    (s, i) => cap(c, s, cols[i], 390),
  );
  const diff = cue(k, 2, 'Subtract each'),
    mean = cue(k, 2, 'The mean gain'),
    cost = cue(k, 2, 'Shadow uses'),
    decision = cue(k, 2, 'This calls for review');
  pairs.forEach((p, i) => {
    const y = 469 + 98 * i;
    const cells = [
      'req ' + (i + 1),
      ...p.scores.map((n) => n.toFixed(2)),
      diff ? '+' + (p.scores[1] - p.scores[0]).toFixed(2) : '',
      ...p.tokens,
    ];
    line(c, 104, y + 27, 1816, y + 27, P.line);
    cells.forEach((s, j) => mono(c, s, cols[j], y, 41, j === 2 || j === 5 ? P.amber : P.ink));
  });
  const s = pairedSummary();
  if (mean) mono(c, 'Mean gain  +' + s.gain.toFixed(3), 111, 797, 43, P.blue);
  if (cost)
    mono(
      c,
      s.totals[0] + ' → ' + s.totals[1] + ' tokens   (+' + s.growth.toFixed(1) + '%)',
      939,
      797,
      37,
      P.amber,
    );
  caption(
    c,
    decision && s.review
      ? 'Cost review above +10%. User preference remains unmeasured.'
      : 'Compare the cost of answering the same three requests.',
  );
}
function rampScene(c, k) {
  const changed = cue(k, 3, 'Raise the threshold'),
    saved = cue(k, 3, 'Save that immutable release');
  const selected = cue(k, 3, 'bucket seventeen goes to control');
  const inspectX = cue(k, 4, 'X keeps control'),
    inspectY = cue(k, 4, 'Y gets the candidate');
  const threshold = changed ? 20 : 10,
    bucket = 17,
    original = assigned(bucket, 10),
    stored = saved ? original : undefined;
  stage(
    c,
    'CANARY TRAFFIC',
    'Who owns the next turn?',
    'New conversations use the current threshold. Existing conversations keep their saved release.',
  );
  const x = (n) => 175 + n * 52;
  cap(c, 'Hash buckets 0–29 of 100', 111, 393);
  for (let i = 0; i < 30; i++) {
    const col = i < threshold ? P.amber : P.blue;
    box(c, x(i), 459, 44, 78, i < threshold ? P.peach : '#d5e5e8');
    line(c, x(i), 536, x(i) + 44, 536, col, 5);
    if (i % 5 === 0 || i === 17) mono(c, i, x(i) + 22, 585, 29, col, 'center');
  }
  line(c, x(threshold) - 4, 411, x(threshold) - 4, 548, P.ink, 4);
  mono(c, '< ' + threshold + '%', x(threshold) - 17, 424, 34, P.ink, 'right');
  dot(c, x(bucket) + 22, 497, 14, P.dark);
  cap(c, 'Conversation X   /   bucket 17', 109, 675);
  mono(
    c,
    inspectX
      ? 'Serve ' + assigned(bucket, threshold, stored)
      : saved
        ? 'Saved release ' + stored
        : selected
          ? 'Assigned ' + original
          : 'At creation',
    107,
    756,
    50,
    P.blue,
  );
  if (changed) {
    cap(c, 'Conversation Y   /   bucket 17', 1001, 675);
    mono(
      c,
      inspectY ? 'Serve ' + assigned(bucket, threshold) : 'No saved release',
      999,
      756,
      50,
      inspectY ? P.amber : P.muted,
    );
  }
  caption(
    c,
    inspectY
      ? 'X reuses control B. Y starts on candidate C.'
      : 'B = control      C = candidate      ·      apply the bucket rule at creation',
  );
}
export function shadowScene(c, k) {
  if (k.beat.beatIndex < 2) return shadowFork(c, k);
  if (k.beat.beatIndex === 2) return pairsScene(c, k);
  return rampScene(c, k);
}
