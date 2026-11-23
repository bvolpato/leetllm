import {
  grid,
  soft,
  white,
  gold,
  mint,
  blue,
  rose,
  paper,
  paperInk,
  rect,
  line,
  poly,
  circle,
  arrow,
  text,
  mono,
  title,
  label,
  plate,
  screw,
  gridPlot,
  cue,
  smooth,
  fmt,
  pair,
  summary,
} from './drawing.mjs';
import { FRESH_BASIS } from '../../../films/embedding-projection/fixtures.mjs';
import { savedCoordinates, unitFinite } from '../../../films/embedding-projection/arithmetic.mjs';

export const candidates = [
  { name: 'Full', bytes: 6144, recall: 1 },
  { name: 'Native 256', bytes: 1024, recall: 0.984 },
  { name: 'PCA 256', bytes: 1024, recall: 0.971 },
  { name: 'PQ 16', bytes: 16, recall: 0.939 },
];
export function verdict({ bytes, recall }) {
  if (
    !Number.isInteger(bytes) ||
    bytes <= 0 ||
    !Number.isFinite(recall) ||
    recall < 0 ||
    recall > 1
  )
    return 'Invalid report';
  if (bytes > 1200) return 'Over budget';
  if (recall < 0.975) return 'Below floor';
  return 'Eligible';
}
export function gateScene(c, k) {
  const b = k.beat.beatIndex;
  if (b < 5) {
    title(c, 'Which shorter index earns a trial?');
    label(c, 'EXAMPLE REPORTS FROM THE SAME JUDGED QUERIES', 81, 173);
    const costs = (v) => 375 + (Math.log2(v) - 3) * 40,
      recalls = (v) => 962 + (v - 0.93) * 4730;
    const bad = cue(k, 3, 'positive infinity'),
      results =
        (!!cue(k, 2, 'Native shortening qualifies') && !bad && b < 3) ||
        !!cue(k, 4, 'None qualifies'),
      second = cue(k, 1, 'The second rail');
    label(c, 'RAW BYTES  /  LOG SCALE', 366, 242);
    if (second) label(c, 'RECALL@10', 953, 242);
    candidates.forEach((orig, i) => {
      const row = bad && i === 1 ? { ...orig, recall: Infinity } : orig,
        y = 329 + i * 99;
      text(c, row.name, 79, y, 32);
      line(c, costs(8), y, costs(8192), y, grid, 4);
      line(c, costs(8), y, costs(1200), y, soft, 7);
      line(c, costs(1200), y - 20, costs(1200), y + 20, gold, 3);
      circle(c, costs(row.bytes), y, 9, blue);
      mono(c, row.bytes, 805, y, 29);
      if (second) {
        line(c, recalls(0.93), y, recalls(1), y, grid, 4);
        line(c, recalls(0.975), y, recalls(1), y, soft, 7);
        line(c, recalls(0.975), y - 20, recalls(0.975), y + 20, gold, 3);
        if (Number.isFinite(row.recall)) circle(c, recalls(row.recall), y, 9, mint);
        mono(
          c,
          Number.isFinite(row.recall) ? row.recall.toFixed(3) : '∞',
          1352,
          y,
          33,
          Number.isFinite(row.recall) ? white : rose,
        );
      }
      if (results)
        text(
          c,
          verdict(row),
          1471,
          y + 31,
          25,
          verdict(row) === 'Eligible' ? mint : soft,
          'center',
        );
    });
    mono(c, '≤ 1,200 B', 369, 718, 30, gold);
    if (second) mono(c, '≥ 0.975', 958, 718, 30, gold);
    if (results)
      text(
        c,
        bad
          ? 'Keep the current index. Remeasure native shortening.'
          : 'Advance native shortening to a held-out trial.',
        84,
        810,
        36,
        bad ? rose : mint,
      );
    return;
  }
  title(c, b < 7 ? 'What did the storage budget buy?' : 'Measure the complete search');
  label(c, 'PER-VECTOR PAYLOAD', 81, 182);
  const bytes = [6144, 1024, 256];
  ['Full float32', '256 float32', '256 int8'].slice(0, b === 5 ? 2 : 3).forEach((s, i) => {
    const y = 315 + i * 129;
    label(c, s, 81, y);
    rect(c, 359, y - 18, (850 * bytes[i]) / 6144, 36, i ? mint : blue);
    mono(c, bytes[i].toLocaleString('en-US') + ' B', 1475, y, 39, white, 'right');
  });
  line(c, 81, 673, 1504, 673, grid, 2);
  text(
    c,
    b === 5
      ? 'One sixth of the original coordinate array.'
      : b === 6
        ? 'One twenty-fourth of the original coordinate array.'
        : b === 7
          ? 'Count graph bytes, full vectors, fetch and rescore.'
          : 'Use untouched queries and report each critical policy slice.',
    81,
    749,
    37,
    b < 7 ? mint : gold,
  );
}
const mean = [2, 1],
  request = [3, 3],
  rotation = [4, 2],
  merge = [0, 2];
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const cosine = (a, b) => dot(unitFinite(a), unitFinite(b));
export function searchState(flipped = false) {
  const queryBasis = FRESH_BASIS.map((r) => r.map((v) => v * (flipped ? -1 : 1)));
  const q = savedCoordinates(request, mean, queryBasis),
    r = savedCoordinates(rotation, mean, FRESH_BASIS),
    m = savedCoordinates(merge, mean, FRESH_BASIS);
  const scores = [cosine(q, r), cosine(q, m)];
  return { queryBasis, q, r, m, scores, winner: scores[0] > scores[1] ? 'Rotation' : 'Merge' };
}
function cartridge(c, x, y, basis, flip) {
  const w = 622,
    h = 181;
  poly(
    c,
    [
      [x + 14, y],
      [x + w - 48, y],
      [x + w, y + 42],
      [x + w, y + h],
      [x, y + h],
      [x, y + 14],
    ],
    flip ? '#ecd4bf' : paper,
    '#ab9f86',
    3,
  );
  screw(c, x + 14, y + 18);
  screw(c, x + w - 17, y + h - 17);
  label(
    c,
    flip ? 'QUERY WORKER  /  REVERSED AXES' : 'INDEX TRANSFORM  /  SAVED AXES',
    x + 37,
    y + 36,
    paperInk,
  );
  mono(c, 'μ = (2, 1)', x + 35, y + 86, 31, paperInk);
  text(c, 'Normalize after projection', x + 285, y + 87, 24, paperInk);
  mono(c, 'v₁ ' + pair(basis[0], 1) + '    v₂ ' + pair(basis[1], 1), x + 35, y + 140, 26, paperInk);
}
function arrowVector(c, world, v, color, name, offset) {
  const from = world([0, 0]),
    p = world(v);
  arrow(c, ...from, ...p, color, 6, 21);
  if (name) text(c, name, p[0] + offset[0], p[1] + offset[1], 27, color, offset[2] || 'left');
}
export function finalScene(c, k) {
  const b = k.beat.beatIndex;
  const flipped = !!cue(k, 4, 'loads a basis') && !cue(k, 7, 'Load the saved transform');
  const replay = !!cue(k, 7, 'Replay the unchanged question'),
    repairing = b === 7 && !replay;
  const after = (phrase) => k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  const awaitingQuery = b === 6 && !after('minus two point two and minus point four');
  const predicted = b === 2 || b === 5 || (b === 4 && flipped) || repairing || awaitingQuery;
  const answer = !predicted && (b === 3 || (b === 4 && !flipped) || b === 6 || replay);
  const st = searchState(flipped);
  if (b < 3) {
    title(c, 'Read the key question in the saved basis');
    const t = smooth(cue(k, 1, 'Move the origin', 1.6)),
      origin = mean.map((n) => n * t),
      w = ([x, y]) => [171 + x * 119, 708 - y * 119],
      o = w(origin);
    gridPlot(c, 73, 196, 752, 538, 59.5);
    if (t === 1) {
      FRESH_BASIS.forEach((row, i) => {
        const a = w(row.map((n, j) => origin[j] - n * 1.25)),
          z = w(row.map((n, j) => origin[j] + n * 2.55));
        line(c, ...a, ...z, soft, 2, [6, 6]);
        text(c, 'v' + (i ? '₂' : '₁'), z[0], z[1] - 22, 24, soft);
      });
    }
    [rotation, request].forEach((v, i) => {
      const p = w(v);
      arrow(c, ...o, ...p, i ? gold : mint, 6, 23);
      text(
        c,
        i ? 'Key query' : 'Rotation',
        p[0] + (i ? -24 : 18),
        p[1] + (i ? -19 : 26),
        29,
        i ? gold : mint,
        i ? 'right' : 'left',
      );
    });
    circle(c, ...o, 9, white);
    mono(c, 'Origin ' + pair(origin, 1), 95, 237, 31, soft);
    cartridge(c, 897, 203, FRESH_BASIS, false);
    if (!b)
      summary(
        c,
        [
          ['Original document and query', '(4, 2)  ·  (3, 3)'],
          ['Original cosine', cosine(rotation, request).toFixed(3), gold],
        ],
        918,
        459,
        138,
      );
    else {
      const aligned = cue(k, 1, 'For rotation that gives');
      summary(
        c,
        [
          ['Query from the moving origin', pair(request.map((n, i) => n - origin[i])), gold],
          ...(aligned ? [['Stored rotation', pair(st.r), mint]] : []),
        ],
        918,
        446,
        130,
      );
      if (b === 2) text(c, 'Query on axes v₁ and v₂?', 917, 706, 42, gold, 'left', 'Serif');
    }
    return;
  }
  title(
    c,
    repairing
      ? 'Reload the index transform'
      : flipped
        ? 'The query worker reversed both axes'
        : 'Search in the stored coordinate system',
  );
  const w = ([x, y]) => [464 + x * 123, 498 - y * 123];
  gridPlot(c, 74, 186, 785, 486, 61.5);
  line(c, 102, 498, 832, 498, grid, 3);
  line(c, 464, 210, 464, 665, grid, 3);
  label(c, 'STORED COORDINATES', 98, 694);
  arrowVector(c, w, st.r, mint, 'Rotation', [8, 29]);
  arrowVector(c, w, st.m, blue, 'Merge', [-8, -27, 'right']);
  if (answer) arrowVector(c, w, st.q, gold, 'Query', flipped ? [-20, 32, 'right'] : [14, -25]);
  circle(c, ...w([0, 0]), 7, white);
  mono(c, 'Rotation ' + pair(st.r) + '     Merge ' + pair(st.m), 97, 724, 27, soft);
  cartridge(c, 898, 189, st.queryBasis, flipped);
  if (answer) {
    label(c, 'PROJECTED QUERY  /  BEFORE NORMALIZATION', 918, 404);
    mono(c, pair(st.q, 1), 913, 450, 53, gold);
    const showScores =
      b === 3
        ? cue(k, 3, 'cosine is point eight')
        : b === 6
          ? after('Rotation scores minus point eight')
          : b === 7
            ? cue(k, 7, 'Rotation recovers')
            : true;
    if (showScores) {
      label(c, 'COSINE WITH THE QUERY', 918, 496);
      const second = b === 6 ? after('Merge still scores zero') : b > 4 || (b === 4 && cue(k, 4, 'score is zero'));
      text(c, 'Rotation', 918, 537, 33, mint);
      mono(c, fmt(st.scores[0], 2), 1475, 537, 38, mint, 'right');
      if (second) {
        text(c, 'Merge', 918, 585, 33, blue);
        mono(c, fmt(st.scores[1], 2), 1475, 585, 38, blue, 'right');
      }
    }
    if (b === 6 && after('merge rule ranks first')) {
      plate(c, 898, 616, 622, 111);
      text(c, 'A failed scan blocks a merge.', 934, 674, 36, paperInk, 'left', 'Serif');
    }
    if (replay && cue(k, 7, 'Read the retrieved rule')) {
      plate(c, 898, 616, 622, 112);
      text(c, 'Keys over 14 days require a ticket.', 925, 657, 34, paperInk, 'left', 'Serif');
      if (cue(k, 7, 'Eighteen days exceeds'))
        mono(c, '18 > 14     Open a rotation ticket.', 927, 702, 26, paperInk);
    }
  } else {
    label(c, 'SAME INPUT QUESTION', 917, 453);
    mono(c, '(3, 3) − (2, 1) = (1, 2)', 917, 526, 33, gold);
    text(
      c,
      repairing ? 'Replay with the saved directions.' : 'Which clause will rank first?',
      916,
      658,
      37,
      white,
      'left',
      'Serif',
    );
  }
}
