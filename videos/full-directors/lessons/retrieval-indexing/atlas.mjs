import assert from 'node:assert/strict';
import {
  ivfRoute,
  flatRoute,
  indexedPassages,
  coarseCenters,
  listOwner,
  frontierSearch,
  graphLinks,
  graphDistance,
  graphPoints,
} from '../../../films/retrieval-indexing/vector-search.mjs';
import {
  fused,
  sparse,
  dense,
  reranked,
  jointScores,
} from '../../../films/retrieval-indexing/credential-shortlist.mjs';
import { lerp } from './studio.mjs';

const million = 1e6,
  dim = 1536,
  bytesPer = Float32Array.BYTES_PER_ELEMENT;
function scan(p) {
  const { at, c } = p,
    products = million * dim,
    bytes = products * bytesPer,
    batch = at(2, 'Now batch two queries');
  p.title('Read the vector block', 'EXACT DOT PRODUCT');
  const x = 113,
    y = 331,
    w = 850,
    h = 364,
    active = Math.min(11, Math.floor(at(1, 'visits every row', 1.4) * 12));
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 24; j++)
      p.rect(
        x + (j * w) / 24,
        y + (i * h) / 12,
        w / 24 - 4,
        h / 12 - 4,
        i === active ? c.gold : i < active ? c.green : c.tint,
      );
  p.mono('1,536 coordinates per row', x, y - 39, 34, c.soft);
  p.mono('1,000,000 rows   ·   float32', x, y + h + 69, 39);
  p.arrow(1012, 525, 1150, 525, c.gold);
  p.text(
    batch ? 'Two queries share a block' : 'One full read per query',
    1190,
    342,
    43,
    c.ink,
    'Serif',
  );
  if (at(1, 'coordinate multiplications'))
    p.mono((products / 1e9).toFixed(3) + 'B products/query', 1190, 458, 36);
  if (at(1, 'coordinates alone')) p.mono((bytes / 1e9).toFixed(3) + ' GB / read', 1190, 549, 39);
  if (at(2, 'decimal terabytes') && !batch)
    p.mono('× 200/s = ' + ((bytes * 200) / 1e12).toFixed(4) + ' TB/s', 1190, 660, 32, c.accent);
  if (batch) {
    p.text('Same coordinate block', 1190, 627, 38, c.soft);
    p.tag('q₁', 1192, 664, 165);
    p.tag('q₂', 1392, 664, 165);
  }
  if (at(3, 'exact search'))
    p.text(
      'Compare held-out recall, throughput and tail latency against flat search.',
      109,
      824,
      42,
      c.soft,
    );
}
const pnames = { generic_api: 'Generic API', key_rotation: 'Key rotation', quota_page: 'Quota' };
const position = (x, lo = 0, hi = 10, a = 158, b = 1744) => lerp(a, b, (x - lo) / (hi - lo));
function geography(p, q, route, showDistances) {
  const { c } = p,
    axis = 505;
  [0, 1].forEach((i) => {
    const left = position(i * 5),
      w = position(5) - position(0),
      visited = route?.lists.includes(i);
    p.rect(left, axis - 93, w, 184, visited ? c.tint : c.field);
    const text = route ? (visited ? 'open' : 'closed') : 'list ' + i;
    p.mono(text, left + 120, axis - 38, 34, visited ? c.green : c.soft);
  });
  p.line(position(5), axis - 146, position(5), axis + 70, c.accent, 3);
  p.text('Boundary 5', position(5), axis - 176, 35, c.accent, 'Serif', 'center');
  p.line(position(0), axis, position(10), axis, c.soft, 4);
  coarseCenters.forEach((v) => {
    const x = position(v);
    p.rect(x - 9, axis - 20, 18, 40, c.ink);
    p.text('Center ' + v, x, axis - 162, 37, c.ink, 'Serif', 'center');
  });
  indexedPassages.forEach((doc, i) => {
    const x = position(doc.value);
    const open = route?.lists.includes(listOwner(doc.value));
    p.circle(x, axis, 13, open ? c.green : c.soft);
    p.line(x, axis + 14, x, axis + 56, c.soft, 2);
    p.mono(
      pnames[doc.id] + '  ' + doc.value,
      x,
      axis + 112,
      31,
      c.ink,
      i === 0 ? 'left' : 'center',
    );
    if (showDistances && open)
      p.mono(
        'distance ' + Math.abs(q - doc.value).toFixed(1),
        x,
        axis + 162,
        28,
        c.green,
        i === 0 ? 'left' : 'center',
      );
  });
  if (q !== null) {
    const x = position(q);
    p.line(x, axis - 48, x, axis - 4, c.gold, 6);
    p.circle(x, axis - 48, 11, c.gold);
    p.mono('q = ' + q, x + (q < 5 ? -9 : 9), axis - 93, 37, c.gold, q < 5 ? 'right' : 'left');
  }
}
function resultLine(p, route, flat = false) {
  const { c } = p,
    win = route.ranked[0];
  p.text(pnames[win.id], 115, 855, 66, c.ink, 'Serif');
  p.mono('distance ' + win.distance.toFixed(1), 117, 931, 40, c.green);
  p.mono(
    flat ? 'Flat scan' : route.lists.length + ' probe' + (route.lists.length > 1 ? 's' : ''),
    1212,
    787,
    39,
    c.gold,
  );
  p.mono(
    flat
      ? '3 passages'
      : coarseCenters.length +
          ' centers + ' +
          route.visited.length +
          ' passage' +
          (route.visited.length === 1 ? '' : 's'),
    1210,
    853,
    40,
  );
  p.mono(route.checks + ' distance checks', 1210, 931, 43, c.accent);
}
function ivf(p) {
  const { c, at } = p,
    query = at(3, 'Set the query') ? 4.9 : null,
    opened = at(4, 'It returns generic API'),
    second = at(6, 'Open the second list'),
    route = opened ? ivfRoute(query, second ? 2 : 1) : null;
  p.title('Which list gets to answer?', 'INVERTED FILE   /   EUCLIDEAN DISTANCE');
  geography(p, query, route, !!route);
  if (route) resultLine(p, route);
  else if (query !== null) {
    p.text('Boundary detail', 115, 757, 47, c.ink, 'Serif');
    p.mono('4.7 to 5.3', 115, 820, 37, c.soft);
    const zoom = (v) => position(v, 4.7, 5.3, 688, 1772),
      y = 776;
    p.line(zoom(4.7), y, zoom(5.3), y, c.soft, 5);
    [
      [query, 'query 4.9', c.gold],
      [5, 'boundary 5', c.accent],
      [5.1, 'key rotation 5.1', c.green],
    ].forEach(([v, label, color], i) => {
      const x = zoom(v);
      p.circle(x, y, 12, color);
      p.mono(label, x, y + (i === 1 ? 48 : -45), 33, color, 'center');
    });
  } else p.mono('nlist = 2       each passage belongs to its nearest center', 118, 850, 38, c.soft);
  if (at(7, 'Flat search')) p.text('Flat search checks three passages.', 567, 951, 35, c.soft);
}
const neighborRequest = 1;
function searchGraph(configuredEf, k) {
  const width = Math.max(configuredEf, k);
  const search = frontierSearch(width);
  return { configuredEf, width, steps: search.steps, returned: search.best.slice(0, k) };
}
const graphRuns = [1, 2].map((configuredEf) => searchGraph(configuredEf, neighborRequest));
function graph(p) {
  const { at, c } = p,
    wide = at(4, 'budget of two'),
    bottom = at(2, 'Descend'),
    run = graphRuns[wide ? 1 : 0];
  const step = wide
    ? at(4, 'We changed')
      ? 4
      : at(4, 'it reaches G')
        ? 3
        : at(4, 'it finds B')
          ? 2
          : 1
    : at(3, 'search stops')
      ? 1
      : 0;
  const trace = run.steps,
    snap = trace[Math.min(step, trace.length - 1)];
  const recap = p.beat >= 5;
  const returns = [at(5, 'A'), at(5, 'G')];
  const returnedId = returns[1] ? graphRuns[1].returned[0] : returns[0] ? graphRuns[0].returned[0] : null;
  p.title(recap ? 'Which neighbor did each search return?' : 'Which neighbor keeps the route open?', 'HNSW   /   FIXED GRAPH');
  const points = Object.fromEntries(
    Object.entries(graphPoints).map(([id, [x, y]]) => [id, [240 + 216 * x, (recap ? 639 : 747) - 152 * y]]),
  );
  // The graph is a schematic. Distances use the original two-dimensional coordinates.
  const edges = bottom
    ? [
        ['S', 'A'],
        ['S', 'B'],
        ['B', 'G'],
      ]
    : [['S', 'A']];
  edges.forEach(([a, b]) => {
    const passed = bottom && snap.expanded.includes(a) && snap.visited.includes(b);
    p.line(...points[a], ...points[b], passed && (!recap || returns[1]) ? c.green : c.rule, 7);
  });
  for (const id of bottom ? Object.keys(graphPoints) : ['S', 'A']) {
    const [x, y] = points[id],
      active = recap ? id === returnedId : bottom ? snap.best.includes(id) : id === (at(1, 'to A') ? 'A' : 'S');
    p.circle(x, y, 40, active ? c.green : c.field);
    p.mono(id, x, y + 15, 43, active ? c.bg : c.ink, 'center');
    p.mono(graphDistance(id).toFixed(2) + ' away', x, y + 87, 28, c.soft, 'center');
  }
  p.mono(bottom ? 'BASE LAYER' : 'UPPER LAYER', 125, 307, 33, c.blue);
  p.text('Query [4, 0.8]', 1257, 350, 48, c.ink, 'Serif');
  if (recap) {
    p.text('One neighbor   (k = ' + neighborRequest + ')', 1257, 442, 48, c.ink, 'Serif');
    p.text('Search width', 1257, 550, 43, c.soft);
    p.text('Returns', 1600, 550, 43, c.soft);
    const widths = [at(5, 'With room for one'), at(5, 'With room for two')];
    graphRuns.forEach(({ width, returned }, i) => {
      if (!widths[i]) return;
      const y = 649 + i * 114;
      const id = returned[0];
      p.mono(width, 1257, y, 59, c.gold);
      p.mono(returns[i] ? id : '?', 1600, y, 66, returns[i] ? c.green : c.soft);
    });
    if (at(5, 'Version zero'))
      p.mono('Recommended   ef ≥ k', 110, 774, 34, c.soft);
    if (at(5, 'From the candidates'))
      p.mono('hnswlib 0.8.0   base-layer width = max(ef, k)', 110, 818, 39, c.green);
  } else if (bottom) {
    p.mono('ef = ' + run.configuredEf, 1260, 440, 44, c.gold);
    [
      ['Frontier', snap.frontier],
      ['Retained', snap.best],
      ['Expanded', snap.expanded],
    ].forEach(([title, list], i) => {
      const y = 533 + i * 111;
      p.text(title, 1261, y, 33, c.soft);
      p.mono(list.join('  ') || 'empty', 1261, y + 56, 40, c.ink);
    });
  }
  if (at(6, 'Two other settings'))
    p.mono('Build   M, efConstruction', 1215, 825, 33, c.blue);
}
const vector = [1.1, 0.9, -0.8, -1.2],
  books = [
    [
      [0, 0],
      [1, 1],
    ],
    [
      [-1, -1],
      [0, 0],
    ],
  ];
function encode(v) {
  return books.map((book, i) => {
    const dist = (rep) => rep.reduce((sum, x, j) => sum + (x - v[2 * i + j]) ** 2, 0);
    return dist(book[0]) <= dist(book[1]) ? 0 : 1;
  });
}
const code = encode(vector),
  decoded = code.flatMap((index, i) => books[i][index]),
  errors = vector.map((v, i) => (v - decoded[i]) ** 2);
const fmtVec = (arr) => '[' + arr.join(', ') + ']';
function subspaces(p, reconstruct, error) {
  const { c } = p;
  for (let m = 0; m < 2; m++) {
    const x = 111 + m * 877,
      y = 267,
      color = m ? c.blue : c.green;
    p.strip(x, y, 788, 435);
    p.rect(x, y, 12, 435, color);
    p.mono('SUBSPACE ' + (m + 1), x + 43, y + 66, 33, color);
    p.mono(fmtVec(vector.slice(2 * m, 2 * m + 2)), x + 43, y + 158, 56);
    p.line(x + 41, y + 201, x + 738, y + 201);
    p.text('Two-entry example codebook', x + 42, y + 270, 35, c.soft);
    books[m].forEach((pair, i) => {
      const active = reconstruct && code[m] === i;
      p.rect(x + 41 + i * 354, y + 312, 328, 79, active ? color : c.tint);
      p.mono(i + '   ' + fmtVec(pair), x + 62 + i * 354, y + 362, 34, active ? c.bg : c.ink);
    });
  }
  if (reconstruct)
    p.mono('Code ' + fmtVec(code) + '     →     ' + fmtVec(decoded), 112, 774, 51, c.ink);
  if (error)
    p.mono(
      'Squared error    ' +
        errors.map((v) => v.toFixed(2)).join(' + ') +
        ' = ' +
        errors.reduce((s, x) => s + x, 0).toFixed(2),
      113,
      838,
      36,
      c.accent,
    );
}
function pq(p) {
  const { c, at, beat } = p;
  if (beat < 5) {
    p.title('One index into each codebook', 'PRODUCT QUANTIZATION');
    subspaces(p, at(3, 'chooses representatives'), at(4, 'squared reconstruction error'));
    return;
  }
  p.title('What fits in one vector code?', 'PAYLOAD   /   1,536 COORDINATES');
  const M = 96,
    bits = 8,
    raw = dim * bytesPer,
    size = (M * bits) / 8,
    w = 1475;
  p.text('Float32 coordinates', 115, 332, 48, c.ink, 'Serif');
  p.rect(115, 385, w, 90, c.blue);
  for (let j = 1; j < 96; j++) p.line(115 + (w * j) / 96, 385, 115 + (w * j) / 96, 475, c.bg, 2);
  p.mono(raw + ' bytes', 1632, 451, 34);
  p.text(M + ' subquantizers × ' + bits + ' bits', 115, 627, 47, c.ink, 'Serif');
  p.rect(115, 687, (w * size) / raw, 90, c.green);
  p.mono(size + ' bytes', 177, 748, 47, c.green);
  if (at(6, 'That saves'))
    p.mono((100 * (1 - size / raw)).toFixed(2) + '% smaller coordinate payload', 115, 818, 52);
}
function composition(p) {
  const { at, c, beat } = p;
  const open = at(1, 'Open every list');
  p.title('Opening a list and decoding a vector', 'TWO SOURCES OF APPROXIMATION');
  ['Center 0', 'Center 10'].forEach((s, i) => {
    const x = 106 + i * 508,
      active = !i || open;
    p.rect(x, 340, 466, 319, active ? c.tint : c.field);
    p.text(s, x + 26, 413, 46, c.ink, 'Serif');
    p.mono(active ? 'open' : 'closed', x + 28, 476, 37, active ? c.green : c.soft);
    if (active)
      indexedPassages
        .filter((d) => listOwner(d.value) === i)
        .forEach((d, j) => p.text(pnames[d.id] + '  ' + d.value, x + 27, 549 + j * 65, 37));
  });
  p.line(1150, 291, 1150, 886, c.rule, 3);
  p.text('First PQ subvector', 1224, 351, 50, c.ink, 'Serif');
  p.mono('Input ' + fmtVec(vector.slice(0, 2)), 1224, 478, 39);
  p.mono('Code  ' + code[0] + '  ·  book 1', 1224, 590, 39, c.blue);
  if (at(2, 'Even with both lists'))
    p.mono('Read  ' + fmtVec(decoded.slice(0, 2)), 1224, 700, 45, c.green);
  p.text(
    open ? 'Every stored code is reachable.' : 'Query 4.9 opens the left list.',
    108,
    770,
    46,
    c.ink,
    'Serif',
  );
  if (beat >= 3)
    p.text(
      'Measure build time, update lag, recall and latency after changing the index.',
      109,
      836,
      37,
      c.soft,
    );
}
const versions = [
  ['v1_rotation', 1, 0.99],
  ['v1_credentials', 1, 0.98],
  ['v2_rotation', 2, 0.97],
  ['v2_credentials', 2, 0.96],
];
const pick = (before, depth) =>
  before
    ? versions.filter((row) => row[1] === 2).slice(0, 2)
    : versions
        .slice(0, depth)
        .filter((row) => row[1] === 2)
        .slice(0, 2);
function filter(p) {
  const { c, at, beat } = p;
  const before = beat === 2 || (beat === 1 && at(1, 'filter all four')) || beat >= 5;
  const evaluated = at(1, 'throws both away');
  const depth = at(3, 'Read all four') ? 4 : at(3, 'Read the first three') ? 3 : 2;
  const selected = pick(before, depth);
  p.title('Find two pages for version two', 'ELIGIBILITY   /   K = 2');
  p.text('Score order', 111, 321, 40, c.soft);
  versions.forEach(([id, v, score], i) => {
    const y = 365 + i * 132,
      col = before ? v === 2 : i < depth;
    p.rect(110, y, 914, 101, col ? c.tint : c.field);
    p.mono(id, 146, y + 64, 44, v === 2 ? c.green : c.ink);
    p.mono(score.toFixed(2), 949, y + 64, 44, c.ink, 'right');
  });
  p.text(before ? 'Filter → top two' : 'Top ' + depth + ' → filter', 1110, 321, 44, c.ink, 'Serif');
  [0, 1].forEach((i) => {
    const y = 402 + i * 167;
    p.strip(1110, y, 670, 127);
    if (evaluated)
      p.mono(selected[i]?.[0] ?? 'empty', 1147, y + 83, 49, selected[i] ? c.green : c.soft);
    else if (at(1, 'Take those two')) p.mono(versions[i][0], 1147, y + 83, 49, c.ink);
  });
  if (evaluated) p.mono(selected.length + ' / 2 eligible', 1110, 818, 44, c.accent);
  if (beat >= 5)
    p.text('Exact and approximate search use the same eligible set.', 112, 955, 40, c.soft);
}
const exact = ['key_rotation', 'quota_page', 'display_name', 'duplicate_secret'];
const first = ['generic_api', 'quota_page', 'display_name', 'generic_api'];
const agree = (ids) => ids.filter((id, i) => id === exact[i]).length;
function audit(p) {
  const { c, at, beat } = p;
  p.title(
    beat < 5 ? 'One result, two references' : 'Hold the exact neighbors fixed',
    'NEIGHBOR AGREEMENT',
  );
  if (beat < 5) {
    p.text('Returned by ANN', 116, 367, 42, c.soft);
    p.tag('d1', 118, 428, 227);
    p.text('Rotation guide', 118, 599, 60, c.ink, 'Serif');
    [
      ['Exact top 1', ['d2']],
      ['Judged useful', ['d1', 'd2']],
    ].forEach(([s, ids], i) => {
      const y = 346 + i * 297;
      p.text(s, 874, y, 49, c.ink, 'Serif');
      ids.forEach((id, j) => p.tag(id, 874 + j * 160, y + 59, 130, id === 'd1'));
      if (at(3, 'Zero of one exact'))
        p.mono(
          ids.filter((id) => id === 'd1').length + ' / ' + ids.length,
          1510,
          y + 119,
          61,
          c.accent,
        );
    });
    return;
  }
  const second = at(5, 'Try the second supplied list'),
    run = second ? exact : first;
  ['Query', 'Exact top 1', 'Supplied list ' + (second ? 'B' : 'A'), 'Match'].forEach((s, i) =>
    p.text(s, [103, 410, 978, 1620][i], 331, 40, c.soft),
  );
  exact.forEach((id, i) => {
    const y = 431 + i * 110;
    p.line(100, y + 28, 1785, y + 28);
    p.mono(i + 1, 110, y, 40);
    p.mono(id, 409, y, 40);
    p.mono(run[i], 979, y, 40);
    p.text(run[i] === id ? 'yes' : 'no', 1620, y, 43, run[i] === id ? c.green : c.accent);
  });
  p.mono('Mean recall@1    ' + agree(run) + ' / 4 = ' + (agree(run) / 4).toFixed(2), 106, 927, 49);
}
function trace(p) {
  const { c, at } = p;
  const wide = at(2, 'Open the third slot'),
    received = at(2, 'into the new pair'),
    transfer = at(2, 'into the new pair', 1.35),
    promote = at(2, 'Watch it move', 1.45),
    complete = promote === 1;
  const base = fused().map(([id]) => id),
    fin = reranked(3),
    input = base.slice(0, wide ? 3 : 2);
  if (p.beat === 4) {
    p.title('Replay the same request', 'QUERY LOG   /   ROTATE AN API KEY');
    ['Lane ranks', 'Fused cutoff', 'Pair scores', 'Final order'].forEach((s, i) =>
      p.text(s, 115, 360 + 143 * i, 44, c.soft, 'Serif'),
    );
    const yy = (i) => 360 + 143 * i;
    p.mono('word   ' + sparse.join('  ') + '      dense   ' + dense.join('  '), 591, yy(0), 44);
    p.mono(
      'K = 2   ' + base.slice(0, 2).join('  ') + '      K = 3   ' + base.join('  '),
      591,
      yy(1),
      42,
      c.gold,
    );
    p.mono(base.map((id) => id + '  ' + jointScores[id].toFixed(2)).join('     '), 591, yy(2), 43);
    p.mono(fin.join('  →  '), 591, yy(3), 48, c.green);
    if (at(4, 'time each request'))
      p.text('Measure each cutoff on the same eligible passages.', 112, 952, 41, c.soft);
    return;
  }
  p.title(
    'Where did the credential guide disappear?',
    'REQUEST REPLAY   /   FIXED LANE RANKS   /   RRF 60',
  );
  p.text('Word', 105, 307, 42, c.blue, 'Serif');
  sparse.forEach((id, i) => p.tag(id, 106 + i * 141, 345, 123, false));
  p.text('Dense', 105, 518, 42, c.green, 'Serif');
  dense.forEach((id, i) => p.tag(id, 106 + i * 141, 561, 123, id === 'd2'));
  p.text('Fused order', 634, 306, 46, c.ink, 'Serif');
  p.text('Reranked pairs', 1302, 306, 46, c.ink, 'Serif');
  const row = (i) => 381 + 149 * i;
  base.forEach((id, i) => {
    const y = row(i);
    p.mono(i + 1, 633, y + 57, 40, c.soft);
    p.tag(id, 711, y, 123, id === 'd2');
    p.mono(fused()[i][1].toFixed(5), 875, y + 48, 34, c.soft);
  });
  const cut = row(input.length) - 44;
  p.line(624, cut, 1092, cut, c.accent, 5);
  p.mono('K = ' + input.length, 1098, cut + 11, 30, c.accent);
  const scoring = received ? base : base.slice(0, 2);
  const phase = (t, start, end) => Math.max(0, Math.min(1, (t - start) / (end - start)));
  scoring.forEach((id, i) => {
    let y = lerp(row(i), row(fin.indexOf(id)), phase(promote, 0.28, 0.72)),
      x = 1275;
    if (id === 'd2') {
      const travelY = lerp(row(i), 856, phase(transfer, 0, 0.27)) - 177 * phase(transfer, 0.73, 1);
      x =
        lerp(711, 1275, phase(transfer, 0.27, 0.73)) +
        365 * (phase(promote, 0, 0.28) - phase(promote, 0.72, 1));
      y = lerp(travelY, row(fin.indexOf(id)), phase(promote, 0.28, 0.72));
    }
    p.tag(id, x, y, 110, id === 'd2');
    if (id !== 'd2' || at(2, 'example score'))
      p.mono(jointScores[id].toFixed(2), x + 131, y + 49, 39, id === 'd2' ? c.green : c.ink);
  });
  if (complete) p.text('Credential guide · first pair', 1265, 885, 41, c.green, 'Serif');
  else if (!wide) p.text('Two pairs reached the scorer.', 1255, 887, 36, c.soft, 'Serif');
}
const practiceRuns = [4.9, 5.2].map((query) => ({
  query,
  routes: [flatRoute(query), ivfRoute(query), ivfRoute(query, 2)],
}));
function practiceRoute(p) {
  const { at, after, c } = p;
  const [left, right] = practiceRuns;
  const [flat, oneProbe] = right.routes;
  const move = at(1, 'to five point two', 0.85, { captionStart: false });
  const q = lerp(left.query, right.query, move);
  const qLabel = move > 0 && (move < 1 || !after(1, 'to five point two')) ? 'q' : 'q = ' + q;
  const centerChecks = [after(2, 'five point two'), after(2, 'four point eight')];
  const passageChecks = [
    after(2, 'Key rotation is a tenth away'),
    after(2, 'Quota is three point eight away'),
  ];
  const open = after(2, 'the right list opens');

  p.title('Move the query. Keep one probe.', 'PRACTICE   /   SAME CENTERS AND PASSAGES');
  geography(p, null, open ? oneProbe : null, false);
  const qx = position(q);
  p.line(qx, 449, qx, 496, c.gold, 5);
  p.circle(qx, 449, 10, c.gold);
  coarseCenters.forEach((center, i) => {
    if (!centerChecks[i]) return;
    const x = position(center);
    p.line(x, 396, qx, 396, c.blue, 3);
    p.line(x, 387, x, 405, c.blue, 3);
    p.line(qx, 387, qx, 405, c.blue, 3);
    p.mono(Math.abs(q - center).toFixed(1), (x + qx) / 2, 383, 34, c.blue, 'center');
  });
  const visited = open ? oneProbe.visited.filter((_, i) => passageChecks[i]) : [];
  for (const doc of visited) {
    p.mono(
      'distance ' + Math.abs(q - doc.value).toFixed(1),
      position(doc.value),
      669,
      32,
      c.green,
      'center',
    );
  }

  const lower = (y) => y - 45;
  const boundary = (coarseCenters[0] + coarseCenters[1]) / 2;
  const neighbor = flat.ranked[0];
  const zoom = (v) => position(v, boundary - 0.3, boundary + 0.4, 154, 1024);
  const axis = lower(839);
  p.text('Boundary detail', 111, lower(723), 42, c.ink, 'Serif');
  const split = zoom(boundary);
  p.rect(109, lower(746), split - 109, 173, c.field);
  p.rect(split, lower(746), 1067 - split, 173, open ? c.tint : c.field);
  p.line(zoom(boundary - 0.3), axis, zoom(boundary + 0.4), axis, c.soft, 4);
  p.line(split, lower(799), split, lower(877), c.accent, 3);
  p.mono(boundary + ' · boundary', split, lower(901), 32, c.accent, 'center');
  p.circle(zoom(neighbor.value), axis, 10, c.soft);
  p.mono(pnames[neighbor.id] + ' ' + neighbor.value, zoom(neighbor.value), lower(873), 30, c.ink);
  p.line(zoom(q), lower(808), zoom(q), axis - 2, c.gold, 5);
  p.circle(zoom(q), lower(808), 10, c.gold);
  p.mono(qLabel, zoom(q), lower(787), 37, c.gold, 'center');

  const centers = centerChecks.filter(Boolean).length;
  const passages = visited.length;
  const winner = oneProbe.ranked[0];
  const answered = after(2, 'It returns key rotation in four checks');
  const counted = after(3, 'two passage checks');
  p.text('One probe', 1120, lower(723), 42, c.ink, 'Serif');
  p.text(
    answered ? pnames[winner.id] : 'Which passage?',
    1120,
    lower(785),
    49,
    answered ? c.green : c.gold,
    'Serif',
  );
  const checkCount = `${centers} center${centers === 1 ? '' : 's'} + ${passages} passage${passages === 1 ? '' : 's'}`;
  const pending = answered ? 'Check both centers' : 'How many checks?';
  p.mono(
    counted ? checkCount + ' = ' + oneProbe.checks + ' checks' : centers ? checkCount : pending,
    1120,
    lower(852),
    32,
    counted ? c.accent : c.ink,
  );
  if (after(3, 'same passage in three'))
    p.mono('Flat scan · ' + flat.checks + ' checks', 1120, lower(910), 32, c.soft);
}
function practice(p) {
  const { at, after, c, beat } = p;
  if (beat < 4) return practiceRoute(p);
  p.title('What did the second probe buy?', 'PRACTICE   /   SAME ELIGIBLE PASSAGES');
  ['Query', 'Flat scan', 'One probe', 'Two probes'].forEach((s, i) =>
    p.text(s, [110, 405, 917, 1432][i], 340, 43, c.soft, 'Serif'),
  );
  const answers = [after(5, 'recovers key rotation'), after(5, 'returns the same guide')];
  practiceRuns.forEach(({ query, routes }, i) => {
    const y = 417 + i * 238;
    p.line(108, y - 27, 1790, y - 27);
    p.mono(query, 112, y + 83, 65, c.gold);
    const [flat, oneProbe] = routes;
    routes.forEach((route, j) => {
      const x = 405 + j * 512;
      if (j === 2 && !answers[i]) {
        p.mono('?', x, y + 90, 61, c.gold);
        return;
      }
      const id = route.ranked[0].id;
      const matchesFlat = id === flat.ranked[0].id;
      p.text(pnames[id], x, y + 70, 45, matchesFlat ? c.green : c.accent, 'Serif');
      const extra = j === 2 ? ' (+' + (route.checks - oneProbe.checks) + ')' : '';
      p.mono(route.checks + ' checks' + extra, x, y + 139, 37, c.soft);
      if (j === 2) {
        const changed = id !== oneProbe.ranked[0].id;
        p.text(
          changed ? 'Recovered nearest' : 'Same result',
          x,
          y + 189,
          37,
          changed ? c.green : c.soft,
        );
      }
    });
  });
  if (at(6, 'relevance judgments'))
    p.text(
      'Judge the returned evidence. Measure latency on held-out queries.',
      110,
      275,
      39,
      c.ink,
      'Serif',
    );
}
export const atlasScenes = [scan, ivf, graph, pq, composition, filter, audit, trace, practice];
export function checkAtlas() {
  assert.equal((million * dim * bytesPer) / 1e9, 6.144);
  assert.equal((96 * 8) / 8, 96);
  assert.deepEqual(
    indexedPassages.map((d) => listOwner(d.value)),
    [0, 1, 1],
  );
  for (const { routes: [flat, , two] } of practiceRuns) assert.deepEqual(two.ranked, flat.ranked);
  assert.deepEqual(
    practiceRuns.map(({ routes }) => routes.map((r) => r.checks)),
    [[3, 3, 5], [3, 4, 5]],
  );
  assert.deepEqual(
    practiceRuns.map(({ routes }) => routes[1].ranked[0].id),
    ['generic_api', 'key_rotation'],
  );
  const { query: movedQuery, routes: [, movedRoute] } = practiceRuns[1];
  assert.deepEqual(coarseCenters.map((center) => Math.abs(movedQuery - center)), [5.2, 4.8]);
  assert.deepEqual(movedRoute.lists, [1]);
  assert.deepEqual(
    movedRoute.visited.map(({ id, value }) => [id, Math.abs(movedQuery - value).toFixed(1)]),
    [['key_rotation', '0.1'], ['quota_page', '3.8']],
  );
  assert.deepEqual(graphLinks.A, ['S']);
  assert.deepEqual(graphRuns.map((run) => [run.width, ...run.returned]), [[1, 'A'], [2, 'G']]);
  assert.deepEqual(graphRuns[1].steps.at(-1).expanded, ['A', 'S', 'B', 'G']);
  assert.deepEqual(searchGraph(1, 2).returned, ['G', 'A']);
  assert.deepEqual(code, [1, 0]);
  assert.deepEqual(decoded, [1, 1, -1, -1]);
  assert.equal(errors.reduce((s, x) => s + x, 0).toFixed(2), '0.10');
  assert.deepEqual(
    [2, 3, 4].map((depth) => pick(false, depth).length),
    [0, 1, 2],
  );
  assert.deepEqual(pick(true, 2), versions.slice(2));
  assert.equal(agree(first), 2);
  assert.equal(agree(exact), 4);
  assert.equal(fused()[2][0], 'd2');
  assert.equal(reranked(3)[0], 'd2');
  assert.equal(jointScores.d2, 0.96);
}
