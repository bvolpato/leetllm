import { C, mix } from './paint.mjs';
import {
  marginSelection,
  observedGrades,
  idealGrades,
  dcg,
  gain,
  serve,
  budgetCandidates,
  batch,
  unpadded,
  padded,
} from './evidence.mjs';

export function calibration(p) {
  p.base('Admission and calibration', 'Held-out queries');
  if (p.b <= 2) {
    p.title('One cutoff, two different questions');
    const x = 710,
      w = 980,
      limit = 0.7,
      rows = [
        ['No answer', 'Best distractor', 0.9],
        ['Answerable', 'Useful passage', 0.6],
      ];
    p.line(x + limit * w, 331, x + limit * w, 815, C.red, 5);
    p.mono('cutoff 0.70', x + limit * w, 308, 34, C.red, 'center');
    rows.forEach(([name, item, val], i) => {
      const y = 455 + i * 261;
      p.text(name, 115, y, 56, C.ink, 'Serif');
      p.text(item, 119, y + 63, 35, C.muted);
      p.box(x, y - 49, w, 70, C.faint);
      p.box(x, y - 49, w * val, 70, i ? C.teal : C.blue);
      p.mono(val.toFixed(2), x + w * val, y + 86, 42, C.ink, 'center');
      if (p.b === 2)
        p.text(
          val >= limit ? 'Absolute cutoff admits' : 'Absolute cutoff omits',
          120,
          y + 122,
          33,
          C.red,
        );
    });
    return;
  }
  if (p.b <= 4) {
    p.title('Keep a fixed distance from the leader');
    const shifted = p.b === 3 && p.at(3, 'Add ten'),
      scaled = p.at(4, 'Double every score');
    const vals = [4, 3.5, 1].map((x) => (scaled ? 2 * x : shifted ? x + 10 : x));
    const min = Math.floor(Math.min(...vals)) - 1,
      max = Math.max(...vals) + 0.5,
      left = 430,
      width = 1200;
    const coord = (v) => left + ((v - min) / (max - min)) * width,
      limit = Math.max(...vals) - 0.75,
      kept = marginSelection(vals, 0.75);
    p.mono('Margin  0.75', 116, 297, 38, C.muted);
    p.box(coord(limit), 358, coord(max) - coord(limit), 442, C.mint);
    p.line(coord(limit), 356, coord(limit), 807, C.teal, 4);
    const settled = p.at(3, 'The first two qualify') > 0;
    vals.forEach((s, i) => {
      const y = 443 + i * 144;
      p.text('ABC'[i], 136, y + 16, 61, C.ink, 'Serif');
      p.line(left, y, coord(max), y, C.faint, 3);
      p.dot(coord(s), y, 17, kept.includes(i) && settled ? C.teal : C.ink);
      p.mono(s, coord(s), y - 35, 40, C.ink, 'center');
    });
    p.mono('top − margin = ' + limit.toFixed(2), 131, 905, 37, C.teal);
    p.text(
      shifted
        ? 'Add 10 to each original score'
        : scaled
          ? 'Double each original score'
          : 'Original scores',
      116,
      984,
      38,
      C.muted,
    );
    return;
  }
  p.title('Does a score of 0.8 mean eight out of ten?');
  const checked = p.at(5, 'Eight are relevant');
  p.mono('PREDICTED RELEVANCE   0.8', 111, 334, 37, C.blue);
  for (let i = 0; i < 10; i++) {
    const x = 120 + i * 168;
    p.box(x, 453, 131, 190, checked ? (i < 8 ? C.mint : C.rose) : C.white);
    p.text(
      checked ? (i < 8 ? '✓' : '×') : '?',
      x + 65,
      577,
      73,
      checked ? (i < 8 ? C.teal : C.red) : C.muted,
      'Sans',
      'center',
    );
    p.mono(i + 1, x + 65, 705, 31, C.muted, 'center');
  }
  if (checked) p.text('Observed relevance   8 / 10', 124, 873, 58, C.teal, 'Serif');
  if (p.b === 6)
    p.text('Fit on development data. Evaluate on fresh labels.', 124, 966, 37, C.muted);
}
export function metrics(p) {
  p.base('Offline evaluation', 'Same candidate pool');
  if (p.b <= 2) {
    p.title('Where is the first relevant passage?');
    const a = p.at(2, 'Move the first hit', 1.25);
    const rows = [3, 1, 0],
      ranks = a === 1 ? [1, 1, 0] : rows;
    rows.forEach((r, i) => {
      const x = 144 + i * 578;
      p.mono('QUERY ' + (i + 1), x, 309, 33, C.blue);
      for (let j = 0; j < 3; j++) {
        const y = 368 + j * 101;
        p.mono(j + 1, x, y + 57, 30, C.muted);
        p.box(x + 65, y, 397, 79, C.faint);
      }
      if (r) {
        const pos = i === 0 ? mix(2, 0, a) : 0,
          y = 368 + 101 * pos;
        p.box(x + 65, y, 397, 79, C.mint);
        p.text('relevant', x + 91, y + 53, 39, C.teal, 'Serif');
      }
      if (a === 0 || a === 1 || i > 0) p.mono(r ? 'RR  1/' + ranks[i] : 'RR  0', x, 768, 40);
    });
    if (p.b === 2 && (a === 0 || a === 1))
      p.text(
        a ? 'Mean   (1 + 1 + 0) / 3 = 2/3' : 'Mean   (1/3 + 1 + 0) / 3 = 4/9',
        124,
        932,
        54,
        C.ink,
        'Serif',
      );
    return;
  }
  if (p.b === 3) {
    p.title('How much evidence made the shortlist?');
    [
      ['Required', 'Passage A', true],
      ['Required', 'Passage B', false],
    ].forEach(([s, name, hit], i) => {
      const x = 122 + i * 875;
      p.sheet(x, 364, 795, 359, hit ? C.mint : C.white);
      p.mono(s.toUpperCase(), x + 44, 434, 32, C.muted);
      p.text(name, x + 44, 549, 68, C.ink, 'Serif');
      p.text(hit ? 'Retrieved' : 'Missing', x + 46, 664, 42, hit ? C.teal : C.red);
    });
    p.text('Candidate recall   1 / 2', 126, 893, 59, C.ink, 'Serif');
    return;
  }
  const ideal = p.at(6, 'Put the highest grades first'),
    grades = ideal ? idealGrades : observedGrades;
  p.title(
    ideal ? 'The best possible order with these labels' : 'What gain falls inside the cutoff?',
  );
  p.mono('GAIN = 2^GRADE − 1', 124, 301, 33, C.muted);
  p.mono('DISCOUNT = 1 / log₂(rank + 1)', 894, 301, 33, C.muted);
  grades.forEach((g, i) => {
    const x = 126 + i * 570;
    p.sheet(x, 402, 514, 346, i < 2 ? C.white : C.faint);
    p.mono('RANK  ' + (i + 1), x + 38, 468, 33, C.muted);
    p.text('Grade ' + g, x + 38, 575, 60, C.ink, 'Serif');
    if (i < 2) p.mono('gain  ' + (2 ** g - 1), x + 38, 651, 39, C.blue);
    p.text(
      i === 2
        ? 'Outside cutoff'
        : p.b >= 5
          ? 'Discounted  ' + gain(g, i + 1).toFixed(3)
          : 'Inside cutoff',
      x + 38,
      716,
      35,
      i === 2 ? C.muted : C.teal,
    );
  });
  if (p.b >= 5)
    p.mono((ideal ? 'Ideal DCG   ' : 'DCG   ') + dcg(grades).toFixed(3), 125, 872, 45, C.ink);
  if (p.b >= 7)
    p.text(
      'NDCG@2   ' +
        dcg(observedGrades).toFixed(3) +
        ' / ' +
        dcg(idealGrades).toFixed(3) +
        ' ≈ ' +
        (dcg(observedGrades) / dcg(idealGrades)).toFixed(3),
      124,
      987,
      48,
      C.teal,
      'Serif',
    );
}
function book(p, x, y, id, inside) {
  const col = [C.lilac, C.blue, C.teal][id];
  p.box(x + 12, y + 12, 485, 224, C.faint);
  p.box(x, y, 485, 224, inside ? col : C.white);
  p.line(x + 41, y + 9, x + 41, y + 216, inside ? C.paper : C.faint, 4);
  p.mono('0' + (id + 1), x + 71, y + 69, 34, inside ? C.paper : C.muted);
  p.text(budgetCandidates[id].label, x + 69, y + 155, 54, inside ? C.white : C.ink, 'Serif');
}
function grid(p, x, y, side, n, fill, stroke = C.paper) {
  p.box(x, y, side, side, fill);
  for (let i = 1; i < n; i++) {
    const k = (side * i) / n;
    p.line(x + k, y, x + k, y + side, stroke, 1.6);
    p.line(x, y + k, x + side, y + k, stroke, 1.6);
  }
}
export function depthCost(p) {
  p.base('Library returns', 'Retrieval depth');
  const lengths = p.at(2, 'Now hold the count');
  if (!lengths) {
    p.title('Can I return a book after closing?');
    let depth = 0;
    for (const [i, w] of ['Read one', 'Read two', 'Read three'].entries())
      if (p.at(2, w)) depth = i + 1;
    for (let i = 0; i < 3; i++) book(p, 127 + i * 582, 384, i, i < depth);
    p.line(109, 652, 1784, 652, C.muted, 8);
    p.text(
      depth ? 'Scorer input   ' + depth + ' / 3' : 'How far down the list must we go?',
      131,
      832,
      59,
      C.ink,
      'Serif',
    );
    return;
  }
  if (p.at(4, 'If the scorer times out')) {
    p.title('The scorer missed its deadline');
    p.mono('DECLARED FALLBACK   /   AUTHORIZED RETRIEVAL ORDER', 122, 318, 32, C.muted);
    for (let i = 0; i < 3; i++) book(p, 127 + i * 582, 379, i, true);
    p.line(110, 648, 1780, 648, C.muted, 8);
    p.text('Trace route   ·   retrieval fallback', 125, 813, 53, C.blue, 'Serif');
    p.text('If the application requires scored evidence, abstain.', 127, 924, 40, C.muted);
    return;
  }
  p.title('Three pairs at two different lengths');
  const large = p.b >= 3;
  for (let i = 0; i < (large ? 2 : 1); i++) {
    const n = i ? 256 : 64,
      side = n * 1.55,
      x = i ? 998 : 247,
      y = 746 - side;
    for (let j = 2; j > 0; j--) p.box(x + j * 21, y - j * 20, side, side, C.faint, C.muted, 2);
    grid(p, x, y, side, n / 16, i ? C.teal : C.blue);
    p.mono(n + ' × ' + n, x, 825, 38);
    p.text('3 × ' + (n * n).toLocaleString('en-US') + ' entries', x, 896, 37, i ? C.teal : C.blue);
  }
  if (large) p.mono('16× the entries', 996, 984, 33, C.teal);
}
export function serving(p) {
  p.base('Serving worksheet', p.b <= 2 ? 'Sequential scoring' : 'Batch budget');
  if (p.b <= 2) {
    p.title('How many comparisons fit in 30 ms?');
    const k = p.at(1, 'Add a fourth') ? 4 : p.at(1, 'Try three candidates') ? 3 : 0,
      ms = serve(k),
      x = 171,
      y = 464,
      u = 42;
    p.box(x, y, 4 * u, 142, C.lilac);
    p.mono('4', x + 84, y + 83, 43, C.white, 'center');
    for (let j = 0; j < k; j++) {
      p.box(x + (4 + j * 7.5) * u + 2, y, 7.5 * u - 4, 142, j === 3 ? C.red : C.blue);
      p.mono('7.5', x + (4 + (j + 0.5) * 7.5) * u, y + 83, 43, C.white, 'center');
    }
    const edge = x + 30 * u;
    p.line(edge, 360, edge, 675, C.red, 6);
    p.mono('30 ms', edge, 325, 40, C.red, 'center');
    p.text('Overhead', x, 701, 36, C.lilac);
    p.text('One block per candidate', x + 221, 701, 36, C.blue);
    p.text(
      k ? k + ' pairs   ·   ' + ms + ' ms' : '4 ms overhead + 7.5 ms per candidate',
      163,
      861,
      k ? 72 : 54,
      k === 4 ? C.red : C.teal,
      'Serif',
    );
    if (p.b === 2)
      p.text(
        'Measure queueing, network, tokenization, scoring and packing.',
        161,
        961,
        40,
        C.muted,
      );
    return;
  }
  if (p.b === 5 || p.b === 6) {
    const ragged = p.b === 5;
    p.title(ragged ? 'Keep the sequence boundaries' : 'Measure speed and relevance together');
    if (ragged) {
      p.mono('RAGGED INPUT BUFFER', 126, 361, 34, C.muted);
      let x = 128;
      batch.forEach((n, i) => {
        const w = n * 4.98;
        p.box(x, 433, w - 3, 157, i ? C.teal : C.blue);
        p.text('Pair ' + (i + 1), x + 40, 532, 54, C.white, 'Serif');
        p.mono(n + ' positions', x, 674, 35, C.ink);
        x += w;
      });
      p.mono('Offsets   [0, 64, 320]', 127, 826, 44, C.blue);
      p.text('A backend must use the offsets to separate the pairs.', 128, 935, 42, C.ink);
    } else {
      p.mono('PUBLISHED MINILM BENCHMARK', 127, 361, 32, C.muted);
      p.text('1,800 pairs / s', 121, 561, 105, C.ink, 'Serif');
      p.text('V100', 1218, 557, 83, C.blue, 'Serif');
      p.line(124, 644, 1751, 644, C.faint, 4);
      p.words(
        'Measure your checkpoint, lengths and hardware. After each change, rerun the relevance evaluation.',
        125,
        766,
        1580,
        48,
        63,
      );
    }
    return;
  }
  if (p.b === 7) {
    p.title('How many pairs can run in 250 ms?');
    p.mono('MEASURED RATE IN THIS EXAMPLE', 121, 343, 34, C.muted);
    p.text('300 pairs / s', 118, 512, 92, C.ink, 'Serif');
    p.text('×   0.25 s', 719, 512, 85, C.blue, 'Serif');
    if (p.at(7, 'before generation')) p.text('=   75 pairs', 1234, 512, 82, C.teal, 'Serif');
    p.line(124, 588, 1770, 588, C.faint, 4);
    p.words(
      'Reserve time for generation and tail latency. Record authorized fallback or abstention if scoring times out.',
      125,
      711,
      1515,
      48,
      72,
    );
    return;
  }
  p.title('What does padding add to the batch?');
  const pad = p.at(4, 'Now pad the short pair'),
    unit = 1.44,
    side = 256 * unit;
  batch.forEach((n, i) => {
    const x = 298 + i * 838,
      y = 762 - side;
    p.text('Pair ' + (i + 1) + '   /   ' + n + ' positions', x, 300, 41, C.ink, 'Serif');
    if (i === 0 && pad) grid(p, x, y, side, 16, C.rose);
    grid(p, x, y, n * unit, n / 16, C.blue);
    p.mono((n * n).toLocaleString('en-US') + ' useful', x, 817, 37, C.blue);
    if (i === 0 && pad)
      p.mono('+ ' + (256 ** 2 - 64 ** 2).toLocaleString('en-US') + ' padding', x, 874, 34, C.red);
  });
  p.text(
    (pad ? padded : unpadded).toLocaleString('en-US') + ' attention entries',
    121,
    982,
    48,
    C.ink,
    'Serif',
  );
  if (pad) p.mono((padded / unpadded).toFixed(2) + '× unpadded', 1178, 972, 38, C.red);
}
