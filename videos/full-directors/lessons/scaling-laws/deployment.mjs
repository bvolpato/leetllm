import { surfaceLoss } from '../../../films/scaling-laws/arithmetic.mjs';
import {
  title,
  label,
  reading,
  line,
  rect,
  dot,
  cloth,
  cord,
  chart,
  cue,
  mix,
  fixed,
  ink,
  dim,
  warp,
  weft,
  teal,
  gold,
  grid,
  paper,
} from './studio.mjs';

export const trial = {
  prediction: surfaceLoss(10e9, 100e9),
  tolerance: 0.02,
  observed: [2.35, 2.32],
};
export function qualifies(v) {
  return Math.abs(v - trial.prediction) <= trial.tolerance;
}
export function trialRuler(c, k) {
  const practice = k.beat.chapterId === 'c25',
    i = k.beat.beatIndex + 1;
  const showBand = practice ? cue(k, 1, 'Allow two hundredths') : cue(k, 2, 'two hundredths');
  const values = practice
    ? [cue(k, 3, 'Run A finishes'), cue(k, 3, 'Run B finishes')]
    : [cue(k, 3, 'example run comes in')];
  const verdict = practice ? cue(k, 4, 'Run B goes on') : cue(k, 4, 'Hold the large run');
  title(
    c,
    practice ? 'Which trial advances?' : 'Set the tolerance before measuring',
    '10B weights × 100B presentations   •   same tokenizer, held-out text and recipe',
  );
  const x = (v) => 230 + ((v - 2.28) / 0.08) * 1435,
    y = 392;
  const { prediction: f, tolerance: t } = trial;
  if (showBand) {
    rect(c, x(f - t), y, x(f + t) - x(f - t), 344, '#c9dfd1');
    label(c, 'Accepted loss range', x(f), y - 26, 38, teal, 'center');
  }
  line(c, x(f), y - 7, x(f), y + 349, teal, 4);
  label(c, 'Forecast  ' + f.toFixed(3), x(f), y + 455, 37, teal, 'center');
  for (const z of [f - t, f, f + t, 2.35])
    label(c, z.toFixed(3), x(z), y + 400, 33, dim, 'center', 'Mono');
  values.forEach((known, j) => {
    const yy = y + 106 + 163 * j,
      v = trial.observed[j];
    line(c, x(2.28), yy, x(2.36), yy, '#aa9ba6', 2);
    label(c, practice ? 'Run ' + 'AB'[j] : 'Trial', x(2.28) - 27, yy + 13, 39, dim, 'right');
    if (known) {
      dot(c, x(v), yy, 16, warp);
      label(c, v.toFixed(3), x(v), yy - 28, 39, warp, 'center');
    }
    if (verdict)
      label(
        c,
        qualifies(v) ? 'Advance' : 'Hold',
        x(v) + 27,
        yy + 52,
        37,
        qualifies(v) ? teal : weft,
      );
  });
  if (!practice && i <= 4 && cue(k, 4, 'positive four hundredths'))
    label(
      c,
      'Residual  +' + (trial.observed[0] - f).toFixed(3) + ' nat per token',
      170,
      952,
      40,
      weft,
    );
  if (!practice && i >= 5 && cue(k, 5, 'one million useful tokens')) {
    const time = cue(k, 5, 'Spend two thousand GPU-seconds') ? 2000 : 1000;
    label(
      c,
      'Throughput    1,000,000 tokens / ' +
        time.toLocaleString('en-US') +
        ' GPU-s = ' +
        (1e6 / time).toLocaleString('en-US') +
        ' tokens/GPU-s',
      170,
      960,
      39,
      teal,
    );
  } else if ((practice && verdict) || (!practice && i >= 5))
    label(c, 'Next measurement    useful tokens / GPU-second on the target stack', 170, 958, 40);
}
export const models = [
  { n: 70, d: 1.4 },
  { n: 30, d: 4 },
];
export function bills(q) {
  return models.map(({ n, d }) => {
    const train = 0.06 * n * d,
      serve = 0.02 * n * q;
    return { n, d, train, serve, total: train + serve, rate: 2 * n };
  });
}
export const crossing =
  (bills(0)[1].train - bills(0)[0].train) / (0.02 * (models[0].n - models[1].n));
export function lifetime(c, k) {
  const post = k.beat.chapterId === 'c20',
    i = k.beat.beatIndex + 1;
  const q = post
    ? cue(k, 1, 'Move demand', 1.5) +
      (crossing - 1) * cue(k, 3, 'bars meet', 1.1) +
      (3 - crossing) * cue(k, 5, 'move demand', 1.3)
    : 0;
  title(
    c,
    'The training bill comes first',
    'Both models meet the same deployed quality target   •   dense-projection FLOPs',
  );
  label(c, 'Processed inference demand', 150, 311, 37, dim);
  label(c, fixed(q) + ' trillion tokens', 728, 318, 53, ink, 'left', 'Serif');
  const rows = bills(q);
  const barStart = 550;
  const billUnit = 110;
  const won =
    post &&
    i === 5 &&
    q === 3 &&
    k.reveal('compact model comes out ahead', 0, { captionStart: false });
  const showReference =
    post && (i > 4 || (i === 4 && k.reveal('eight point one nine', 0, { captionStart: false })));
  if (showReference) {
    const equalBill = bills(crossing)[0].total;
    const x = barStart + equalBill * billUnit;
    line(c, x, 492, x, 634, dim, 2);
    line(c, x, 699, x, 711, dim, 2);
    line(c, x, 754, x, 776, dim, 2);
    label(c, fixed(equalBill) + ' break-even bill', x, 801, 32, dim, 'center');
  }
  rows.forEach((row, j) => {
    if (!post && j && !cue(k, 1, 'compact model beside')) return;
    const y = 428 + j * 208,
      start = barStart,
      unit = billUnit;
    label(c, row.n + 'B on ' + row.d + 'T', 150, y + 45, 44);
    cord(c, start, y, row.train * unit, warp, 55);
    cord(c, start + row.train * unit, y, row.serve * unit, teal, 55);
    label(c, row.total.toFixed(2), start + row.total * unit + 20, y + 45, 45);
    label(c, row.train.toFixed(2) + ' training', start, y + 107, 32, warp);
    if (q > 0)
      label(c, row.serve.toFixed(2) + ' serving', start + row.train * unit, y + 107, 32, teal);
    if (!post && i === 2 && cue(k, 2, j ? 'smaller one uses' : 'larger model uses'))
      label(c, row.rate + 'B FLOPs per processed token', start + 420, y + 109, 33, teal);
  });
  if (!post && cue(k, 2, 'measure task quality'))
    label(
      c,
      'Profile latency and memory at the intended batch size and context length.',
      150,
      945,
      37,
    );
  label(c, 'Bill measured in 10²³ FLOPs', 150, post ? 830 : 842, 33, dim);
  if (post && i === 2) label(c, '2NQ > 6ND when Q > 3D', 150, 884, 41);
  if (won) {
    const saved = rows[0].total - rows[1].total;
    label(c, '30B model saves ' + fixed(saved) + ' × 10²³ FLOPs over its lifetime', 150, 884, 38, teal);
  } else if (post && i >= 3 && i <= 5) {
    const premium = cue(k, 3, 'paid an extra'),
      saving = cue(k, 3, 'eighty billion');
    label(
      c,
      premium ? 'Extra training   1.32 × 10²³ FLOPs' : 'Extra training   7.20 − 5.88',
      150,
      884,
      38,
      warp,
    );
    if (saving) label(c, 'Saving   80B FLOPs per processed token', 955, 884, 38, teal);
  }
  if (post && i === 6 && cue(k, 6, 'Twice the price'))
    label(
      c,
      'Training FLOPs priced at 2× serving FLOPs    →    dollar break-even at ' +
        fixed(2 * crossing) +
        'T',
      150,
      884,
      38,
      weft,
    );
}
function spool(c, x, y, col, name) {
  rect(c, x - 61, y - 62, 122, 127, col);
  for (let a = -54; a < 60; a += 8) line(c, x - 55, y + a, x + 55, y + a - 3, '#fff2d780', 2);
  rect(c, x - 74, y - 75, 148, 15, dim);
  rect(c, x - 74, y + 65, 148, 15, dim);
  label(c, name, x, y + 132, 34, col, 'center');
}
export function dataSupply(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 2) {
    const disjoint = cue(k, 2, 'disjoint corpora'),
      count = 1 + Math.floor(3 * cue(k, 1, 'source labels repeat', 1.6));
    title(
      c,
      'Can four runs share the same source?',
      'Each spool supplies 15 trillion token positions.',
    );
    for (let j = 0; j < count; j++) {
      const x = 271 + j * 454,
        source = disjoint ? j : 0,
        col = [warp, weft, teal, gold][source];
      spool(c, x, 459, col, 'Corpus ' + 'ABCD'[source]);
      line(c, x, 612, x, 674, col, 4);
      label(c, 'Run ' + (j + 1), x, 734, 39, ink, 'center');
    }
    label(c, 15 * count + 'T presentations', 150, 917, 61, ink, 'left', 'Serif');
    label(
      c,
      (disjoint ? 15 * count : 15) + 'T unique positions',
      937,
      917,
      61,
      teal,
      'left',
      'Serif',
    );
    return;
  }
  if (i <= 4) {
    title(c, 'A forecast of public-text supply', 'Villalobos et al.  •  published June 2024');
    const X = (v) => 213 + (v - 2024) * 167;
    line(c, X(2024), 525, X(2033), 525, dim, 4);
    for (let year = 2024; year <= 2033; year++) {
      line(c, X(year), 506, X(year), 546, dim);
      label(c, year, X(year), 603, 32, dim, 'center');
    }
    if (cue(k, 3, 'range ran')) {
      cord(c, X(2026), 471, X(2032) - X(2026), warp, 39);
      label(c, 'Projected intersection', X(2026), 409, 40, warp);
    }
    if (cue(k, 3, 'median near')) {
      dot(c, X(2028), 490, 18, weft);
      label(c, 'Median', X(2028), 687, 37, weft, 'center');
    }
    if (i === 4)
      label(
        c,
        '15.6T reported presentations / ~400T projected effective stock = 3.9%',
        173,
        879,
        40,
      );
    return;
  }
  if (i === 5) {
    title(
      c,
      'Count usable text for this run',
      'One illustrative inventory after licensing, filtering and deduplication',
    );
    const stages = [
      ['Collected', ['A', 'B', 'A', 'C', 'D']],
      ['Licensed', ['A', 'B', 'A', 'C']],
      ['Quality filter', ['A', 'B', 'A']],
      ['Deduplicated', ['A', 'B']],
    ];
    stages.forEach(([name, items], j) => {
      const y = 325 + j * 156;
      label(c, name, 161, y + 51, 40);
      items.forEach((item, a) => {
        const x = 692 + a * 197;
        rect(c, x, y, 145, 73, { A: warp, B: teal, C: gold, D: weft }[item]);
        label(c, item, x + 72, y + 52, 41, paper, 'center');
      });
    });
    return;
  }
  title(
    c,
    'Extrapolating beyond the fitted ratios',
    'Sardana et al.   •   47 models   •   training-token presentations per parameter',
  );
  const X = (v) => 267 + Math.log10(v) * 349;
  for (const [j, end, name] of [
    [0, 100, 'Low-ratio fitting range'],
    [1, 1000, 'Larger models studied'],
    [2, 10000, 'Smallest model studied'],
  ]) {
    const y = 420 + j * 200;
    line(c, X(1), y, X(end), y, [dim, warp, weft][j], 8);
    dot(c, X(end), y, 14, [dim, warp, weft][j]);
    label(c, name, X(1), y - 40, 38);
    label(c, end, X(end), y + 64, 37, ink, 'center');
  }
}

export const draftBill = (n) => 2 * 8e9 * 512 * n;
export function drafts(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i === 1) {
    title(
      c,
      'Three ways to spend inference compute',
      'Trace generated tokens and record which selection procedure actually ran.',
    );
    ['Long answer', 'Independent drafts', 'Verifier selection'].forEach((s, j) => {
      const x = 170 + j * 563;
      label(c, s, x, 363, 39);
      if (j > 0 && !cue(k, 1, j === 1 ? 'several independent drafts' : 'external verifier')) return;
      const rows = j === 0 ? 1 : 3;
      for (let a = 0; a < rows; a++) {
        const y = 481 + a * 104;
        cord(c, x, y, j === 0 ? 410 : 246, j === 2 && a === 1 ? teal : warp, 35);
        if (j === 2) label(c, [0.3, 0.8, 0.5][a], x + 290, y + 29, 31, a === 1 ? teal : dim);
      }
    });
    return;
  }
  if (i >= 4) {
    title(
      c,
      'Allocate work by problem difficulty',
      'Snell et al. on MATH  •  illustrative comparison of generation strategies',
    );
    label(c, 'One response', 164, 338, 46, ink, 'left', 'Serif');
    cord(c, 166, 448, 650, warp, 55);
    label(c, 'Larger model', 166, 580, 39, warp);
    label(c, 'Score and revise', 1020, 338, 46, ink, 'left', 'Serif');
    for (let j = 0; j < 3; j++) {
      const yy = 421 + j * 89;
      cord(c, 1020, yy, 220, teal, 32);
      label(c, j < 2 ? 'score  →  revise' : 'score  →  select', 1270, yy + 28, 30, dim);
    }
    label(c, 'Smaller model', 1020, 746, 39, teal);
    if (cue(k, 4, 'fourteen times'))
      label(
        c,
        'In some matched-compute cases the baseline had about 14× as many parameters.',
        150,
        884,
        37,
      );
    if (i === 5)
      label(
        c,
        'Include difficulty estimation, scoring and demand in a deployment decision.',
        150,
        950,
        34,
        dim,
      );
    return;
  }
  const n = 1 + 3 * cue(k, 2, 'then four') + 12 * cue(k, 2, 'then sixteen');
  title(
    c,
    'Pay for every completed draft',
    '8B dense weights   •   exactly 512 generated tokens per candidate',
  );
  for (let j = 0; j < n; j++) {
    const x = 170 + (j % 4) * 223,
      y = 313 + Math.floor(j / 4) * 130;
    rect(c, x, y, 186, 99, '#ece1cd');
    line(c, x + 16, y + 26, x + 158, y + 26, warp, 4);
    line(c, x + 16, y + 42, x + 174, y + 42, warp, 4);
    line(c, x + 16, y + 59, x + 110, y + 59, warp, 4);
    label(c, j + 1, x + 161, y + 85, 24, dim, 'center');
  }
  reading(c, 'Generated tokens', n + ' × 512 = ' + n * 512, 1140, 326, warp, 53);
  reading(c, 'Generation FLOPs', (draftBill(n) / 1e12).toFixed(3) + ' × 10¹²', 1140, 532, teal, 54);
  if (i >= 3)
    label(
      c,
      i >= 4
        ? 'Compare task success at matched total compute, including verification.'
        : 'Add prompt processing, attention and verifier work separately.',
      170,
      926,
      38,
    );
}
export const answers = [
  '10110',
  '11110',
  '01101',
  '11111',
  '11000',
  '10101',
  '11111',
  '00111',
  '11010',
  '01110',
];
export function score(count) {
  const rows = answers.slice(0, count);
  return {
    correct: rows.join('').split('1').length - 1,
    complete: rows.filter((row) => row === '11111').length,
  };
}
export function scoringState(k) {
  const demonstrated = 3 * cue(k, 4, 'first three rows') + cue(k, 4, 'Row four');
  return {
    count: cue(k, 4, 'Finish counting') ? answers.length : demonstrated,
    tokenRows: cue(k, 5, 'Thirty-four of the fifty tokens') ? answers.length : demonstrated,
    gradedRows: cue(k, 5, 'Two of the ten answers') ? answers.length : demonstrated,
  };
}
export function metrics(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i === 1) {
    title(
      c,
      'Two evaluations of a coding model',
      'One held-out token and one executable test ask different questions.',
    );
    label(c, 'return a +', 175, 480, 76, warp, 'left', 'Mono');
    label(c, 'b', 672, 480, 76, weft, 'left', 'Mono');
    label(c, 'Observed next token', 175, 586, 40, dim);
    label(c, 'add(2, 3) == 5', 987, 480, 68, teal, 'left', 'Mono');
    label(c, 'Check the function on an input', 987, 586, 38, dim);
    label(c, 'Perplexity  =  exp(loss in nats)', 175, 815, 49);
    return;
  }
  if (i < 4) {
    title(
      c,
      'All five tokens must be correct',
      'Toy model   •   independent token outcomes, each correct with probability p',
    );
    const p = chart(c, {
      x: 191,
      y: 335,
      w: 965,
      h: 465,
      xlim: [0, 1],
      ylim: [0, 1],
      xt: [0, 0.25, 0.5, 0.75, 1],
      yt: [0, 0.25, 0.5, 0.75, 1],
      xlabel: 'Token accuracy p',
      ylabel: 'Whole-answer success probability',
    });
    p.curve((x) => x ** 5, 0, 1, warp);
    const v = 0.7 + 0.2 * cue(k, 2, 'fifth power', 1.4);
    p.point(v, v ** 5, weft, 13);
    reading(
      c,
      'Five-token exact match',
      fixed(v) + '⁵ = ' + (v ** 5).toFixed(3),
      1283,
      410,
      weft,
      55,
    );
    if (i === 3) label(c, 'Finite samples give integer counts.', 1250, 734, 34);
    return;
  }
  const { count, tokenRows, gradedRows } = scoringState(k);
  title(
    c,
    'Score the same ten answers twice',
    'Each filled row is one five-token answer. A cross marks an incorrect token.',
  );
  answers.forEach((row, j) => {
    const y = 283 + j * 61;
    label(c, j + 1, 167, y + 29, 28, dim, 'right');
    for (let a = 0; a < 5; a++) {
      const x = 213 + a * 108,
        seen = j < count;
      rect(c, x, y, 87, 40, seen ? (row[a] === '1' ? warp : '#e9c5b7') : '#e8decf');
      if (seen && row[a] === '0') label(c, '×', x + 44, y + 31, 31, weft, 'center');
    }
    if (j < gradedRows && row === '11111') label(c, '✓', 790, y + 34, 39, teal);
  });
  reading(
    c,
    tokenRows < count ? 'Correct tokens in the first four rows' : 'Correct tokens',
    tokenRows ? score(tokenRows).correct + ' / ' + tokenRows * 5 : 'Awaiting rows',
    1015,
    379,
    warp,
    83,
  );
  reading(
    c,
    gradedRows < count ? 'Entirely correct answers in the first four rows' : 'Entirely correct answers',
    gradedRows ? score(gradedRows).complete + ' / ' + gradedRows : 'Awaiting rows',
    1015,
    639,
    teal,
    83,
  );
}
export const route = { shared: [0, 1], experts: [6, 17, 34], billionsPerTile: 2 };
export function architecture(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 3) {
    title(
      c,
      'Which weights does one token use?',
      'Forty stored tiles   •   each tile holds two billion weights',
    );
    const shared = cue(k, 1, 'shared layers'),
      experts = cue(k, 1, 'selected experts');
    for (let j = 0; j < 40; j++) {
      const x = 155 + (j % 8) * 123,
        y = 308 + Math.floor(j / 8) * 110;
      const col = shared && route.shared.includes(j) ? warp : experts && route.experts.includes(j) ? weft : '#c9c1ba';
      rect(c, x, y, 102, 88, col);
      line(c, x + 9, y + 12, x + 93, y + 12, '#fff5e08a', 2);
      if (col !== '#c9c1ba') label(c, col === warp ? 'S' : 'E', x + 51, y + 60, 36, paper, 'center');
    }
    label(c, 'S   shared weights', 155, 920, 34, warp);
    label(c, 'E   selected experts', 603, 920, 34, weft);
    reading(
      c,
      cue(k, 2, 'hundred sixty') ? 'Storage  ·  80B × 2 bytes' : 'Stored weights  ·  2B per tile',
      cue(k, 2, 'hundred sixty') ? '160 GB' : '40 tiles',
      1213,
      343,
      ink,
      61,
    );
    if (cue(k, 3, 'Four billion shared')) {
      const sharedB = route.shared.length * route.billionsPerTile;
      const expertB = route.experts.length * route.billionsPerTile;
      const showExperts = cue(k, 3, 'six billion selected');
      const showTotal = cue(k, 3, 'ten billion active');
      const terms = sharedB + 'B' + (showExperts ? ' + ' + expertB + 'B' : '');
      const equation = showTotal ? terms + ' = ' + (sharedB + expertB) + 'B' : terms;
      const heading = showTotal ? 'Active for this token' : showExperts ? 'Shared + selected weights' : 'Shared weights';
      reading(c, heading, equation, 1213, 545, warp, 53);
    }
    if (cue(k, 3, 'six times ten to the twenty-first'))
      label(c, '6 × 10B × 100B = 6 × 10²¹ FLOPs', 1194, 849, 35, weft);
    return;
  }
  title(
    c,
    'What grows with context length?',
    'Count attention pairs during prefill and reads during cached decoding.',
  );
  const n = 4 + Math.floor(4 * cue(k, 4, 'growing history', 1.4));
  label(c, 'Causal attention', 150, 340, 48, warp, 'left', 'Serif');
  for (let r = 0; r < n; r++)
    for (let a = 0; a <= r; a++)
      rect(c, 152 + a * 49, 393 + r * 49, 43, 43, r === n - 1 ? weft : warp);
  label(c, n + ' cached positions read by the last query', 150, 886, 35, weft);
  if (cue(k, 4, 'state-space model')) {
    label(c, 'Recurrent state', 1045, 340, 48, teal, 'left', 'Serif');
    for (let a = 0; a < 4; a++) rect(c, 1045 + a * 123, 546, 110, 110, teal);
    label(c, 'Fixed state dimension', 1045, 743, 40);
  }
}
