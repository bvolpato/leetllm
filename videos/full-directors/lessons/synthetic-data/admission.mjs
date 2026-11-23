import {
  ink,
  muted,
  paper,
  teal,
  rust,
  ruled,
  white,
  serif,
  mono,
  sans,
  ease,
  cue,
  afterCue,
  round,
  line,
  disc,
  type,
  lab,
  headline,
  backing,
  stock,
  pill,
  ruleText,
  arrow,
} from './press.mjs';
import {
  rows,
  admitted,
  votes,
  originalWords,
  paraphrase,
  cosine,
  comparisons,
  replay,
  logs,
  judgeCalls,
  allCalls,
  full,
  large,
} from './specimens.mjs';

export function overlap(g, k) {
  backing(g);
  headline(g, 'Read five words at a time');
  const changed = cue(k, 5, 'Use the cursor'),
    screen = changed ? paraphrase : originalWords;
  const positions = [
    cue(k, 3, 'Slide past please', 0.75),
    cue(k, 3, 'Advance to every', 0.75),
    cue(k, 3, 'then to page', 0.75),
  ];
  const start = changed ? 0 : positions.reduce((s, q) => s + ease(q), 0);
  const step = 205,
    x = 135;
  function strip(tokens, y, offset = 0) {
    stock(g, 101, y - 75, 1710, 139);
    tokens.forEach((t, i) =>
      type(g, t, x + (i + offset) * step + 82, y + 12, 38, ink, mono, 'center', 184),
    );
  }
  lab(g, 'PRIVATE INDEX   /   RESERVED SEARCH', 123, 278);
  strip(screen.referenceTokens, 389);
  lab(g, changed ? 'REWORDED CANDIDATE' : 'CANDIDATE   /   C5', 123, 561);
  strip(screen.tokens, 670);
  const pos = x + step * start - 15;
  line(g, pos, 718, pos + 5 * step - 10, 718, teal, 9);
  line(g, pos, 718, pos, 688, teal, 7);
  line(g, pos + 5 * step - 10, 718, pos + 5 * step - 10, 688, teal, 7);
  const matches = screen.matches.filter((hit) => hit.start <= Math.floor(start));
  const n = matches.length;
  if (n > 0) {
    const top = x + matches.at(-1).referenceStart * step - 15;
    line(g, top, 431, top + 5 * step - 10, 431, rust, 7);
  }
  if (!changed && n > 0)
    type(g, n + ' matching window' + (n === 1 ? '' : 's'), 129, 863, 56, teal, serif);
  if (changed && cue(k, 5, 'zero matches'))
    type(g, '0 matching windows', 129, 863, 56, teal, serif);
  if (!changed && cue(k, 3, 'keep it out')) pill(g, 'WITHHOLD C5', 1300, 804, 414, rust, white);
  if (changed && cue(k, 5, 'A paraphrase'))
    type(g, 'Same pagination task', 1120, 861, 48, rust, serif);
}
function vector(g, ox, oy, len, v, col, label, dy = 0) {
  const n = Math.hypot(...v),
    X = ox + (len * v[0]) / n,
    Y = oy - (len * v[1]) / n;
  arrow(g, ox, oy, X, Y, col, 8);
  if (label) type(g, label, X - 8, Y + dy, 32, col, mono);
}
export function directions(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1,
    quiz = b >= 4;
  headline(g, quiz ? 'Compare with the vertical reference' : 'How close are these directions?');
  const ox = 224,
    oy = 800,
    R = 422;
  line(g, ox - 40, oy, 818, oy, ruled);
  line(g, ox, oy + 40, ox, 280, ruled);
  g.beginPath();
  g.arc(ox, oy, R, -Math.PI / 2, 0);
  g.lineWidth = 3;
  g.strokeStyle = ruled;
  g.stroke();
  const near = rows[2].vector,
    novel = rows[0].vector;
  vector(g, ox, oy, R, quiz ? [0, 1] : [1, 0], teal, quiz ? '[0,1]' : '[1,0]', quiz ? -20 : 51);
  if (quiz) {
    if (cue(k, 4, 'candidate is three')) vector(g, ox, oy, R, [3, 4], rust, '[3,4]', -22);
    lab(g, 'NORMALIZED DIRECTIONS', 942, 342);
    if (cue(k, 4, 'dot product')) type(g, 'dot = 0 × 3 + 1 × 4', 940, 442, 45, ink, mono);
    if (cue(k, 4, 'length is five')) type(g, 'norms = 1 and 5', 940, 536, 45, ink, mono);
    if (cue(k, 5, 'point eight'))
      type(g, '4 / (1 × 5) = ' + cosine([0, 1], [3, 4]).toFixed(2), 940, 668, 53, teal, mono);
    if (cue(k, 4, 'cutoff is'))
      pill(
        g,
        cue(k, 5, 'rejects this pair') ? 'REJECT   ≥ 0.75' : 'CUTOFF   0.75',
        937,
        750,
        482,
        cue(k, 5, 'rejects this pair') ? rust : teal,
        white,
      );
  } else {
    const first = cue(k, 3, 'page reader'),
      second = cue(k, 3, 'retry case');
    if (first) vector(g, ox, oy, R * 0.91, near, rust, 'C3', -27);
    if (second) vector(g, ox, oy, R, novel, '#5364a0', 'C1', -25);
    lab(g, 'CONSTRUCTED EMBEDDINGS', 922, 346);
    if (b < 3) {
      type(g, 'One vector per task', 920, 464, 67, ink, serif);
      type(g, 'Encoder version fixes the space.', 922, 563, 43, muted, sans);
      if (cue(k, 2, 'dot product')) {
        type(g, 'cos = (u · v) / (norm(u) × norm(v))', 925, 702, 46, teal, mono, 'left', 865);
        lab(g, 'Finite vectors with positive norms', 924, 785);
      }
    } else {
      type(g, 'Review at cosine ≥ 0.95', 919, 446, 56, ink, serif);
      if (first)
        ruleText(
          g,
          'C3   ' + cosine([1, 0], near).toFixed(4) + '   →   review',
          926,
          613,
          811,
          rust,
        );
      if (second)
        ruleText(
          g,
          'C1   ' + cosine([1, 0], novel).toFixed(4) + '   →   eligible',
          926,
          742,
          811,
          teal,
        );
    }
  }
}
export function judge(g, k) {
  backing(g);
  headline(g, 'Follow the answer through the swap');
  const swap = ease(cue(k, 2, 'reverse the display order', 1.5));
  const picked = cue(k, 1, 'picks the left answer'),
    again = cue(k, 2, 'picks left again');
  lab(g, 'LEFT POSITION', 162, 236);
  lab(g, 'RIGHT POSITION', 1113, 236);
  const travel = swap * (1 - swap) * 4;
  for (const [i, id] of ['A', 'B'].entries()) {
    const t = i === 0 ? swap : 1 - swap,
      x = 130 + 933 * t,
      y = 414 + (i === 0 ? -1 : 1) * 149 * travel;
    stock(g, x, y, 742, 228, i === 0 ? '#bfdac3' : '#f4d3b0');
    type(g, id, x + 42, y + 135, 104, ink, serif);
    type(g, i ? 'Request 10,000' : 'Respect the cap', x + 169, y + 100, 52, ink, serif);
    type(g, i ? 'limit = 10000' : 'limit = 100', x + 170, y + 176, 42, muted, mono);
  }
  const audit = votes[1];
  if (picked) {
    lab(g, 'FIRST VOTE', 136, 829);
    type(g, 'Left = A   ' + audit.forwardA.toFixed(2), 132, 905, 48, teal, mono);
  }
  if (again) {
    lab(g, 'SECOND VOTE', 823, 829);
    type(g, 'Left = B   ' + (1 - audit.remappedA).toFixed(2), 819, 905, 48, rust, mono);
  }
  if (cue(k, 2, 'winner changed')) pill(g, audit.stable ? 'KEEP' : 'AUDIT', 1514, 847, 234, rust);
  if (cue(k, 2, 'Averaging')) {
    type(
      g,
      'Score for A:  (0.80 + ' +
        audit.remappedA.toFixed(2) +
        ') / 2 = ' +
        audit.averageA.toFixed(2),
      136,
      987,
      36,
      muted,
      mono,
    );
  }
}
const stations = ['Seed', 'Overlap', 'Client', 'Diversity', 'Judge', 'Shard'];
const reasons = ['no seed', 'exam copy', 'page cap', 'near copy', 'vote flips', 'accepted'];
export function admission(g, k) {
  backing(g);
  headline(g, 'Which rows reach the training shard?');
  const triggers = [
    [1, 'has no seed'],
    [1, 'repeats an exam question'],
    [2, 'fails the page limit'],
    [2, 'close enough'],
    [3, 'winner changes'],
    [3, 'passes the last gate'],
  ];
  const arrivals = [
    [1, 'check the seed'],
    [1, 'screen the remaining tasks'],
    [2, 'Run the four remaining clients'],
    [2, 'Compare the survivors'],
    [3, 'Compare their answers'],
    [3, 'passes the last gate'],
  ];
  const phase = arrivals.map(([b, p], i) => cue(k, b, p, i === 5 ? 0 : 0.5));
  const done = triggers.filter(([b, p]) => cue(k, b, p)).length;
  const pos = [255, 502, 754, 1018, 1281, 1576];
  stations.forEach((t, i) => {
    type(g, t, pos[i] + 25, 266, 36, muted, mono);
    line(g, pos[i] + 45, 302, pos[i] + 45, 845, ruled, 2);
  });
  for (const [i, row] of admitted.entries()) {
    const y = 349 + 94 * i,
      fail = row.passedGates,
      stop = Math.min(fail, 5);
    const arrived = done > fail || (fail === 5 && done === 6);
    const travel = Math.min(
      stop + 1,
      phase.slice(0, stop + 1).reduce((s, n) => s + n, 0),
    );
    const ix = Math.floor(travel),
      t = travel - ix,
      marks = [122, ...pos],
      x = marks[ix] + ((marks[ix + 1] ?? marks[ix]) - marks[ix]) * t;
    line(g, 129, y, x + 20, y, arrived && fail < 5 ? rust : teal, 4);
    round(g, x, y - 30, 100, 61, 12, arrived && fail < 5 ? rust : teal);
    type(g, row.id, x + 51, y + 13, 35, white, mono, 'center');
    if (arrived) type(g, reasons[fail], x + 111, y + 13, 31, fail === 5 ? teal : rust, sans);
  }
  const remaining = admitted.filter((r) => r.passedGates >= Math.min(done, 5)).length;
  type(g, remaining + ' of 6 still eligible', 128, 943, 53, ink, serif);
}
function batchCosts(g, k) {
  headline(g, 'Count the comparisons');
  const gates = cue(k, 1, 'four requests'),
    all = cue(k, 1, 'twelve before retries');
  for (const [i, label] of ['After four gates', 'Judge every row'].entries()) {
    const y = 332 + i * 240,
      n = i ? allCalls : judgeCalls;
    type(g, label, 121, y, 56, ink, serif);
    for (let j = 0; j < n; j++) {
      const x = 124 + j * 128;
      round(g, x, y + 55, 110, 81, 8, (i ? all : gates) ? (j % 2 ? '#a4c9b5' : teal) : '#d9d9c6');
      if (i ? all : gates)
        type(g, j % 2 ? 'BA' : 'AB', x + 55, y + 110, 34, j % 2 ? ink : white, mono, 'center');
    }
    if (i ? all : gates) type(g, String(n), 1690, y + 114, 65, ink, serif);
  }
  if (cue(k, 1, 'save eight'))
    type(g, '8 of 12 requests saved before retries', 128, 914, 56, teal, serif);
}
function calibration(g, k) {
  headline(g, 'Who slips through an approve-all judge?');
  const show = cue(k, 3, 'two bad'),
    both = cue(k, 3, 'admits both');
  for (let i = 0; i < 100; i++) {
    const x = 178 + (i % 10) * 47,
      y = 296 + Math.floor(i / 10) * 47;
    disc(g, x, y, 17, i < 98 ? teal : show ? rust : ruled);
  }
  lab(g, 'HUMAN-REVIEWED ROWS', 124, 816);
  type(g, '98 acceptable', 819, 391, 75, teal, serif);
  if (show) type(g, '2 unacceptable', 819, 495, 72, rust, serif);
  if (cue(k, 3, 'ninety-eight percent')) ruleText(g, 'Overall agreement   98 / 100', 823, 652, 880);
  if (both) ruleText(g, 'Bad rows admitted   2 / 2', 823, 785, 880, rust);
}
const firstPoolRun = replay(false);
const secondPoolRun = replay(true);
function poolRun(g, k) {
  const beat = k.beat.beatIndex + 1;
  const testingB = beat === 5;
  const candidate = testingB ? firstPoolRun.b : firstPoolRun.c;
  const bScored = afterCue(k, 5, 'B clears the cutoff against the two original references');
  const bJoined = afterCue(k, 5, 'Its other checks pass, so B joins the pool');
  const cScored = afterCue(k, 6, 'Now compare C with B');
  const bMatch = afterCue(k, 6, 'Their directions almost coincide');
  const cStopped = afterCue(k, 6, 'Under this rule C stops at the diversity check');
  const withheldPhrase = 'Its winner flips, so B is withheld';
  const bWithheld = afterCue(k, 7, withheldPhrase);
  const cRechecked = afterCue(
    k,
    8,
    "With B out of the pool, C's closest match drops below the cutoff",
  );
  const cJudged = afterCue(k, 8, 'Now C reaches the judge');
  const cJoined = afterCue(
    k,
    8,
    'Its own winner stays the same in both orders, so this time C joins the pool',
  );
  const run = bWithheld ? secondPoolRun : firstPoolRun;
  const best = testingB ? run.bScore : run.cScore;
  const showBest = testingB ? bScored : bWithheld ? cRechecked : cStopped;
  let bOpacity = Number(!bWithheld);
  if (bWithheld && beat === 7) {
    const sinceWithholding = k.elapsed - k.wordCue(withheldPhrase).end;
    bOpacity = 1 - ease(Math.min(1, Math.max(0, sinceWithholding / 0.65)));
  }

  headline(g, testingB ? 'Can B join the accepted pool?' : 'Which reference is closest to C?');
  stock(g, 112, 218, 1695, 620);
  type(
    g,
    'Candidate ' + candidate.id + '  [' + candidate.vector.join(', ') + ']',
    157,
    306,
    53,
    ink,
    serif,
  );
  lab(g, 'COSINE SIMILARITY', 1453, 303);
  const plotStart = 530;
  const plotEnd = 1410;
  const scoreX = (score) => plotStart + score * (plotEnd - plotStart);
  const cutoffX = scoreX(comparisons.cutoff);
  lab(g, 'REFERENCES', 156, 385);
  type(g, '0', plotStart, 385, 34, muted, mono, 'center');
  type(g, '1', plotEnd, 385, 34, muted, mono, 'center');
  if (afterCue(k, 5, 'cutoff is point eight two')) {
    type(g, 'Cutoff ' + comparisons.cutoff.toFixed(2), cutoffX, 385, 34, rust, mono, 'center');
    line(g, cutoffX, 407, cutoffX, 778, rust, 3);
  }

  const references = testingB && !bJoined ? comparisons.references : firstPoolRun.pool;
  references.forEach((reference, i) => {
    const id = ['R1', 'R2', 'B'][i];
    const y = 463 + i * 127;
    const isB = id === 'B';
    const score = cosine(reference, candidate.vector);
    const showScore = isB ? bMatch : testingB ? bScored : cScored;
    const closest = isB ? cStopped : showBest && score === best;
    const color = closest && score >= comparisons.cutoff ? rust : teal;
    type(g, id, 156, y + 3, 54, ink, serif);
    if (isB && testingB) {
      type(g, 'In the pool for the next candidate', plotStart, y + 13, 43, teal, serif);
      return;
    }
    if (isB && bOpacity === 0) {
      type(g, 'Withheld after judge vote changed', plotStart, y + 13, 43, rust, serif);
      return;
    }
    g.save();
    if (isB) g.globalAlpha = bOpacity;
    type(g, '[' + reference.join(', ') + ']', 159, y + 46, 34, muted, mono);
    line(g, plotStart, y, plotEnd, y, ruled, 2);
    if (showScore) {
      const end = scoreX(score);
      line(g, plotStart, y, end, y, color, 8);
      if (closest) disc(g, end, y, 17, color);
      disc(g, end, y, closest ? 7 : 9, closest ? white : color);
      type(g, '≈ ' + score.toFixed(isB ? 7 : 3), 1455, y + 13, 39, color, mono);
    }
    g.restore();
  });

  let status = '';
  if (testingB && bScored && !bJoined) status = 'B clears novelty';
  if (cStopped) status = 'B is above the cutoff. C stops at novelty.';
  if (beat === 7 && !bWithheld && cue(k, 7, 'Replay the same two proposals'))
    status = 'Replay with a different judge vote for B';
  if (bWithheld) status = 'C awaits a new comparison';
  if (cRechecked) status = 'C clears novelty against R1 and R2';
  if (cJudged) status = 'C reaches the judge';
  if (cJoined) status = 'C passes its own judge check and joins the pool';
  if (status) type(g, status, 126, 930, 52, ink, serif);
}
export function economics(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b <= 2) batchCosts(g, k);
  else if (b <= 4) calibration(g, k);
  else poolRun(g, k);
}
export function preference(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  headline(g, b >= 4 ? 'Which words become the target?' : 'What may the support log record?');
  stock(g, 110, 222, 1694, 160);
  lab(g, 'SUPPORT REQUEST', 150, 282);
  type(g, 'Can you put the customer’s email in the failed-search log?', 150, 349, 49, ink, serif);
  const answer = cue(k, 2, 'Choose the request ID'),
    ran = cue(k, 2, 'field each one recorded');
  logs.forEach((row, i) => {
    const x = 114 + i * 865;
    stock(g, x, 445, 800, 344, answer ? (i === 0 ? '#d6e2ca' : '#ecdabe') : paper);
    lab(
      g,
      b >= 4
        ? i
          ? 'PREFERENCE   /   REJECTED'
          : 'PREFERENCE   /   CHOSEN'
        : 'ANSWER ' + (i ? 'B' : 'A'),
      x + 38,
      509,
    );
    type(g, '“' + row.answer + '”', x + 38, 613, 54, ink, serif, 'left', 724);
    if (ran) type(g, 'field: ' + row.fields[0], x + 41, 700, 38, row.allowed ? teal : rust, mono);
    if (answer) {
      const result =
        b >= 3
          ? 'Email logging request: ' + row.emailRequest
          : row.allowed
            ? 'Policy allows request ID'
            : 'Policy excludes customer email';
      type(g, result, x + 40, 758, 33, row.allowed ? teal : rust, sans);
    }
  });
  if (b >= 4) {
    arrow(g, 481, 800, 481, 853, teal);
    type(g, 'SFT target   “' + logs.find((r) => r.allowed).answer + '”', 140, 927, 49, teal, serif);
  } else type(g, 'Allowed field   /   request_id', 128, 926, 40, muted, mono);
}
export function dependencies(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  headline(g, b < 3 ? 'Which receipt belongs to this answer?' : 'Preview two rows from seed S12');
  if (b < 3) {
    const revised = cue(k, 1, 'Change the answer');
    const nodes = [
      ['Search task', 'Fetch every name', 120, 267],
      ['Seed contract', 'S12 · reviewed v1', 120, 584],
      ['Generated answer', revised ? 'Client v2' : 'Client v1', 770, 435],
      ['Trusted fixture', 'Two-page search', 1393, 263],
      ['Verification', revised ? 'v2: run again' : 'v1 receipt', 1393, 591],
    ];
    arrow(g, 592, 369, 753, 485);
    arrow(g, 592, 678, 753, 551);
    arrow(g, 1238, 537, 1376, 678);
    arrow(g, 1585, 458, 1585, 574);
    nodes.forEach(([a, t, x, y]) => {
      stock(g, x, y, 454, 168);
      lab(g, a, x + 29, y + 56);
      type(
        g,
        t,
        x + 29,
        y + 126,
        43,
        a === 'Verification' && revised ? rust : teal,
        serif,
        'left',
        393,
      );
    });
    if (b === 2)
      type(g, 'Declare column inputs, validate, then scale.', 132, 931, 48, muted, serif);
  } else {
    for (const [i, run] of [full, large].entries()) {
      const x = 112 + i * 862;
      stock(g, x, 271, 801, 542);
      lab(g, 'S12   /   ' + (i ? 'OVERSIZED' : 'RETRY'), x + 40, 344);
      type(g, 'First request', x + 40, 444, 56, ink, serif);
      type(g, 'limit = ' + run.requests[0].limit, x + 42, 530, 47, teal, mono);
      if (cue(k, 3, 'open the receipts')) {
        line(g, x + 40, 593, x + 751, 593);
        lab(g, 'EXECUTION RECEIPT', x + 40, 651);
        type(g, run.result.items.join(' · ') || '0 names', x + 40, 746, 57, i ? rust : teal, serif);
      }
    }
    if (b === 4)
      type(g, 'Retain actual outputs, receipts and source versions.', 124, 938, 46, muted, serif);
  }
}
