import {
  coordinateGeneration,
  graphDistances,
  ivf,
  join,
  miniRun,
  narrow,
  norm,
  probe,
  raw,
  rotationLimits,
  unit,
  wide,
  work,
} from './evidence.mjs';
import {
  arrow,
  box,
  cue,
  done,
  dot,
  ease,
  field,
  gold,
  grid,
  head,
  ink,
  key,
  label,
  line,
  mint,
  mix,
  muted,
  night,
  orange,
  pale,
  peach,
  poly,
  rect,
  serif,
  steel,
  teal,
  text,
  white,
} from './art.mjs';

function axes(c, x, y, r) {
  arrow(c, x - 12, y, x + r + 22, y, steel, 2);
  arrow(c, x, y + 15, x, y - r - 20, steel, 2);
  c.beginPath();
  c.arc(x, y, r, -Math.PI / 2, 0);
  c.strokeStyle = '#54777a';
  c.lineWidth = 2;
  c.stroke();
}
export function dense(c, t) {
  field(c, true);
  const b = t.beat.beatIndex;
  if (b < 4) {
    head(c, 'Dense retrieval  /  supplied coordinates', 'The direction of Luna’s question', true);
    const x = 135,
      y = 535,
      r = 298;
    axes(c, x, y, r);
    label(c, 'Session', x - 22, y - r - 47, 21, mint);
    label(c, 'Key', x + r + 20, y + 32, 21, mint);
    const normed = done(t, 2, 'Draw the resulting'),
      values = normed ? unit : raw;
    const ex = x + r * values[0],
      ey = y - r * values[1];
    if (done(t, 0, 'For this example')) arrow(c, x, y, ex, ey, peach, 5);
    if (done(t, 1, 'out of the page')) {
      dot(c, x, y, 10, night, white, 2);
      dot(c, x, y, 3, white);
      label(c, 'Audit (out of page)', x, y + 63, 17, steel);
    }
    label(c, 'QUERY', 600, 221, 18, mint);
    text(c, 'refresh expired machine credential', 600, 266, 29, white, { family: 'Serif' });
    label(c, 'q  =  (0.98, 0.05, 0)', 600, 339, 23, white);
    if (normed) label(c, '‖q‖ ≈ ' + norm.toFixed(4), 600, 389, 22, steel);
    if (done(t, 3, 'Look at the shadow')) {
      line(
        c,
        [
          [ex, ey],
          [ex, y],
        ],
        gold,
        3,
        [4, 4],
      );
      line(
        c,
        [
          [x, y + 7],
          [ex, y + 7],
        ],
        gold,
        4,
      );
      label(c, 'cosine with each unit axis', 600, 454, 17, steel);
      ['Key', 'Session', 'Audit'].forEach((id, i) => {
        const yy = 495 + i * 40;
        label(c, id, 600, yy, 20, white);
        rect(c, 740, yy - 8, 220 * unit[i], 15, mint);
        label(c, unit[i].toFixed(4), 1002, yy, 20, mint);
      });
    }
    return;
  }
  head(c, 'Same permitted passages', 'Two requests, two kinds of evidence', true);
  const rows = [
    ['KROT-14', 'Key', 'no vector supplied'],
    ['refresh expired machine credential', 'empty', 'Key, Session'],
  ];
  ['Query', 'Word search', 'Vector search'].forEach((s, i) =>
    label(c, s, [64, 611, 882][i], 224, 18, mint),
  );
  rows.forEach(([q, a, d], i) => {
    const y = 318 + i * 128;
    if (i === 0 && b === 4 && !done(t, 4, 'Now put')) return;
    line(
      c,
      [
        [63, y - 47],
        [1133, y - 47],
      ],
      steel,
      1,
    );
    text(c, q, 64, y, 30, white, { family: 'Serif' });
    label(c, a, 611, y, 22, white);
    label(c, d, 882, y, 20, peach);
  });
  label(c, 'Paraphrase filter   ·   cosine > 0', 65, 551, 19, steel);
}

export function embeddings(c, t) {
  field(c, true);
  const b = t.beat.beatIndex;
  if (b < 2) {
    head(c, 'Dense Passage Retrieval', 'A query meets a stored passage', true);
    const parts = [
      ['At request time', 'Query encoder', mint],
      ['Indexed ahead of time', 'Passage encoder', peach],
    ];
    parts.forEach(([tag, id, color], i) => {
      const y = 261 + i * 148;
      label(c, tag, 62, y - 41, 18, color);
      box(c, 62, y - 9, 322, 81, 8, '#23454b', steel, 1);
      serif(c, id, 85, y + 32, 31, white);
      arrow(c, 400, y + 33, 472, y + 33, color);
      for (let j = 0; j < 12; j++) rect(c, 497 + j * 22, y + 7, 14, 48, color);
      label(c, '768', 797, y + 31, 25, white);
    });
    if (b > 0) {
      line(
        c,
        [
          [884, 292],
          [915, 292],
          [915, 441],
          [882, 441],
        ],
        steel,
        2,
      );
      text(c, 'q · d', 977, 366, 43, white, { family: 'Mono' });
      label(c, 'equals cosine on unit vectors', 61, 576, 22, mint);
    }
    return;
  }
  if (b <= 3) {
    head(c, 'all-MiniLM-L6-v2  /  reported results', 'Who overtakes the key rule?', true);
    const extra = done(t, 2, 'Add the related'),
      bare = done(t, 3, 'Switch to the bare code');
    const data = miniRun(extra ? 6 : 3, bare ? 2 : 1);
    label(c, 'QUERY', 64, 210, 17, mint);
    serif(c, bare ? 'KROT-14' : 'refresh expired', 63, 268, 43, white);
    if (!bare) serif(c, 'machine credential', 63, 317, 43, white);
    label(c, 'mean pooling · 384 coordinates', 65, 404, 19, steel);
    label(c, 'input limit · 256 wordpieces', 65, 448, 19, steel);
    label(c, 'REPORTED COSINE', 590, 190, 17, mint);
    data.forEach(([id, v], i) => {
      const y = 240 + i * 58;
      label(c, i + 1, 594, y, 18, steel);
      text(c, id, 632, y, 25, white);
      const z = 860;
      rect(
        c,
        Math.min(z, z + v * 330),
        y - 9,
        Math.abs(v) * 330,
        18,
        id === 'KROT-14' ? gold : mint,
      );
      label(c, v.toFixed(2), 1126, y, 21, white, 'right');
    });
    return;
  }
  if (b === 4) {
    head(c, 'Encoder input', 'Where did the risk condition go?', true);
    label(c, 'Passage A', 63, 237, 23, mint);
    label(c, 'Passage B', 63, 350, 23, peach);
    for (let i = 0; i < 2; i++) {
      const y = 249 + i * 113;
      for (let j = 0; j < 20; j++) box(c, 224 + j * 23, y - 26, 18, 36, 3, i ? peach : mint);
      label(c, 'same retained prefix', 226, y + 43, 19, white);
    }
    line(
      c,
      [
        [696, 181],
        [696, 427],
      ],
      gold,
      3,
    );
    label(c, '256 wordpieces', 698, 165, 18, gold, 'center');
    text(c, `Risk signal age ≤ ${rotationLimits.signalHours} h`, 740, 353, 28, steel);
    if (done(t, 4, 'Check for finite')) {
      label(c, 'identical encoder inputs   →   identical vectors', 64, 492, 25, mint);
      label(
        c,
        'Before cosine: finite coordinates · matching dimensions · nonzero norms',
        64,
        548,
        18,
        steel,
      );
    }
    return;
  }
  head(c, 'Index generation', 'Keep the query and passages aligned', true);
  const qa = ease(cue(t, 5, 'Rotate the query', 1.05)) * 90;
  const pa = ease(cue(t, 6, 'Now rotate', 1.05)) * 90;
  const run = coordinateGeneration(qa, pa);
  const x = 378,
    y = 463,
    r = 211;
  line(
    c,
    [
      [84, y],
      [669, y],
    ],
    steel,
    2,
  );
  line(
    c,
    [
      [x, y + 55],
      [x, 197],
    ],
    steel,
    2,
  );
  function vec(v, col, len) {
    arrow(c, x, y, x + v[0] * len, y - v[1] * len, col, 5);
  }
  run.passages.forEach((v, i) => {
    vec(v, i ? peach : mint, r);
    text(
      c,
      i ? 'Session' : 'Key',
      x + v[0] * (r + 32),
      y - v[1] * (r + 32) - 15,
      22,
      i ? peach : mint,
      { align: 'center' },
    );
  });
  vec(run.query, gold, r * 0.74);
  dot(c, x, y, 5, white);
  label(c, 'Query', 698, 225, 20, gold);
  label(c, Math.round(qa) + '°', 1045, 225, 23, gold);
  label(c, 'Stored passages', 698, 281, 20, white);
  label(c, Math.round(pa) + '°', 1045, 281, 23, white);
  line(
    c,
    [
      [697, 322],
      [1122, 322],
    ],
    steel,
    1,
  );
  ['Key', 'Session'].forEach((id, i) =>
    label(
      c,
      id + '   ' + (Math.abs(run.scores[i]) < 0.0001 ? 0 : run.scores[i]).toFixed(3),
      698,
      377 + i * 55,
      25,
      i ? peach : mint,
    ),
  );
  if (
    (qa === 0 && pa === 0) ||
    (qa === 90 && pa === 0 && b === 6) ||
    (pa === 90 && done(t, 6, 'All of those'))
  )
    label(c, 'First   ' + ['Key', 'Session'][run.winner], 699, 519, 24, gold);
}

export function invertedFile(c, t) {
  field(c);
  const b = t.beat.beatIndex;
  if (b === 0) {
    head(c, 'Exact vector scan', 'Read every coordinate');
    for (let i = 0; i < 20; i++) {
      const x = 75 + (i % 5) * 144,
        y = 211 + Math.floor(i / 5) * 72;
      box(c, x, y, 125, 51, 3, pale, grid, 1);
      for (let j = 0; j < 12; j++)
        rect(c, x + 9 + j * 9, y + 10, 4, 30, (i + j) % 4 === 0 ? orange : teal);
    }
    label(c, '1,000,000 vectors', 841, 251, 21, ink);
    label(c, '384 coordinates', 841, 314, 21, ink);
    label(c, '4 bytes each', 841, 377, 21, ink);
    if (done(t, 0, 'before IDs')) label(c, '1.536 GB', 837, 469, 34, teal);
    label(c, 'Raw coordinates only', 75, 565, 20);
    return;
  }
  const scaleUp = done(t, 4, 'Scale up'),
    probes = done(t, 4, 'Twenty probes') ? 20 : 10;
  if (scaleUp) {
    head(c, 'IVF  /  query work', 'Pay for every list you open');
    label(c, '1,000 equal lists   ·   1,000 records per list', 63, 206, 22);
    for (let i = 0; i < 40; i++) {
      const x = 64 + (i % 20) * 53,
        y = 274 + Math.floor(i / 20) * 79;
      box(c, x, y, 41, 61, 4, i < probes ? teal : '#d8d9c5');
      line(
        c,
        [
          [x + 9, y + 16],
          [x + 31, y + 16],
        ],
        i < probes ? mint : muted,
      );
    }
    label(c, 'First 40 lists shown', 64, 450, 16);
    text(c, '1,000 centers + ' + probes + ' × 1,000 records', 64, 508, 30, ink, { family: 'Mono' });
    serif(c, work(probes).toLocaleString('en-US') + ' comparisons', 64, 573, 41, teal);
    return;
  }
  head(c, 'IVF  /  trained centers at 0 and 10', 'The closest record across the border');
  const both = done(t, 4, 'Now the record'),
    n = both ? 2 : 1,
    marker = probe(n);
  const start = 120,
    end = 1070,
    y = 271,
    at = (x) => start + ((end - start) * x) / 10;
  rect(c, start, y - 30, (end - start) / 2, 61, '#c9e2ce');
  rect(c, at(5), y - 30, (end - start) / 2, 61, both ? '#c9e2ce' : '#dbd9c8');
  line(
    c,
    [
      [start, y],
      [end, y],
    ],
    ink,
  );
  [0, 10].forEach((v) => {
    dot(c, at(v), y, 10, teal);
    label(c, 'center ' + v, at(v), y - 59, 18, muted, 'center');
  });
  label(c, 'list boundary 5', at(5), y - 61, 18, muted, 'center');
  line(
    c,
    [
      [at(5), y - 29],
      [at(5), y + 37],
    ],
    muted,
    2,
    [5, 4],
  );
  if (b < 2) return;
  label(c, 'ENLARGED BORDER', 65, 381, 16);
  const left = 155,
    scale = 570,
    xx = (v) => left + (v - 3.8) * scale;
  rect(c, left, 433, xx(5) - left, 58, '#c9e2ce');
  rect(c, xx(5), 433, 1100 - xx(5), 58, both ? '#c9e2ce' : '#dbd9c8');
  line(
    c,
    [
      [left, 461],
      [1100, 461],
    ],
    muted,
    2,
  );
  line(
    c,
    [
      [xx(5), 418],
      [xx(5), 501],
    ],
    muted,
    2,
    [4, 4],
  );
  label(c, 'query 4.9', xx(4.9) - 8, 405, 20, orange, 'right');
  poly(
    c,
    [
      [xx(4.9) - 9, 421],
      [xx(4.9) + 9, 421],
      [xx(4.9), 452],
    ],
    orange,
  );
  ivf.records.forEach((v, i) => {
    dot(c, xx(v), 461, 10, i === 0 || both ? teal : muted);
    label(c, 'record ' + v, xx(v), 516, 20, ink, 'center');
  });
  if (done(t, 2, 'at distance'))
    label(
      c,
      n +
        ' ' +
        (n === 1 ? 'list' : 'lists') +
        ' searched    nearest ' +
        marker.value +
        '    distance ' +
        marker.d.toFixed(1),
      65,
      590,
      23,
      teal,
    );
}

const graphPos = { S: [95, 357], A: [333, 252], B: [615, 222], D: [333, 466], C: [615, 483] };
const edges = [
  ['S', 'A'],
  ['A', 'B'],
  ['S', 'D'],
  ['D', 'C'],
];
const seed = { current: null, expanded: [], pending: ['S'], best: ['S'] };
export function walkState(t) {
  const b = t.beat.beatIndex;
  if (b === 2) {
    const n = done(t, 2, 'At distance two')
      ? 2
      : done(t, 2, 'Follow A')
        ? 1
        : done(t, 2, 'we keep A')
          ? 0
          : -1;
    return { ef: 1, snap: n < 0 ? seed : narrow.snapshots[n] };
  }
  if (b >= 3) {
    const n = done(t, 3, 'The query and links')
      ? 4
      : done(t, 3, 'Its distance is zero')
        ? 3
        : done(t, 3, 'then B')
          ? 2
          : done(t, 3, 'Visit A')
            ? 1
            : done(t, 3, 'This time D stays')
              ? 0
              : -1;
    if (n === 2 && done(t, 3, 'Expand D'))
      return {
        ef: 3,
        snap: {
          current: 'D',
          expanded: wide.expanded.slice(0, 3),
          pending: [],
          best: wide.snapshots[2].best,
        },
      };
    return { ef: 3, snap: n < 0 ? seed : wide.snapshots[n] };
  }
  return { ef: 1, snap: seed };
}
export function graph(c, t) {
  field(c, true);
  const b = t.beat.beatIndex;
  if (b === 0) {
    head(c, 'HNSW  /  layer descent', 'From long jumps to local links', true);
    const columns = ['P', 'Q', 'R', 'T', 'U'];
    const levels = [
      ['P', 'U'],
      ['P', 'R', 'U'],
      columns,
    ];
    const at = (id) => 300 + columns.indexOf(id) * 188;
    const walk = ease(cue(t, 0, 'follow the upper link', 1.6));
    const descend = ease(cue(t, 0, 'Descend at U', 0.9));
    levels.forEach((ids, i) => {
      const y = 235 + i * 136;
      line(c, ids.map((id) => [at(id), y]), steel, 3);
      if (i === 0 && walk > 0)
        line(c, [[at('P'), y], [mix(at('P'), at('U'), walk), y]], gold, 5);
      label(c, i === 2 ? 'All vectors' : 'Layer ' + (2 - i), 66, y, 21, i === 2 ? mint : white);
      ids.forEach((id) => {
        const reached = id === 'U' && (i === 0 && walk === 1 || i === 1 && descend === 1);
        dot(c, at(id), y, 20, night, reached ? gold : i === 2 ? mint : steel, 3);
        label(c, id, at(id), y, 19, white, 'center');
      });
    });
    if (done(t, 0, 'Here the query')) label(c, 'Query at U', at('U'), 183, 20, mint, 'center');
    if (descend > 0) arrow(c, at('U'), 258, at('U'), mix(258, 348, descend), gold, 4);
    if (descend === 1) label(c, 'Entry to layer 1', at('U'), 421, 18, gold, 'center');
    return;
  }
  if (b > 4) {
    head(c, 'Approximate search', 'What did each index spend?', true);
    const measured = b === 6;
    label(
      c,
      measured ? 'Article run · 20,000 vectors · exact top 10' : 'Query controls on a fixed index',
      63,
      197,
      20,
      mint,
    );
    [
      ['HNSW', 'ef_search', 'best points retained', 'M · ef_construction', 618, 0.914, 40],
      ['IVF', 'probes', 'whole lists scanned', 'number of centers', 1149, 0.935, 16],
    ].forEach(([id, knob, unit, build, count, recall, n], i) => {
      const y = 267 + i * 148;
      serif(c, id, 64, y, 42, white);
      label(c, knob + (measured ? ' = ' + n : ''), 287, y, 23, i ? peach : mint);
      if (measured) {
        rect(c, 581, y - 14, count * 0.275, 26, i ? peach : mint);
        label(c, count + ' comparisons', 579, y + 37, 19, white);
        label(c, recall.toFixed(3) + ' recall', 936, y, 19, white);
      } else {
        label(c, unit, 575, y, 22, white);
        label(c, 'Build: ' + build, 575, y + 44, 18, steel);
      }
    });
    label(
      c,
      measured
        ? 'Score neighboring vectors against the exact baseline. Judge relevance separately.'
        : 'Measure memory, inserts, build time and query latency.',
      64,
      565,
      19,
      steel,
    );
    return;
  }
  head(c, 'HNSW  /  separate bottom-layer experiment', 'Which links can we reach from S?', true);
  const { ef, snap } = walkState(t);
  const expanded = new Set(snap.expanded);
  const examined = new Set();
  if (expanded.has('S')) {
    examined.add('S-A');
    examined.add('S-D');
  }
  if (expanded.has('A')) examined.add('A-B');
  if (expanded.has('D')) examined.add('D-C');
  edges.forEach(([a, b]) => {
    const path = a + '-' + b;
    line(
      c,
      [graphPos[a], graphPos[b]],
      examined.has(path) ? (b === 'D' && ef === 1 ? steel : mint) : '#45646a',
      examined.has(path) ? 5 : 2,
      b === 'D' && ef === 1 && examined.has(path) ? [7, 8] : [],
    );
  });
  Object.entries(graphPos).forEach(([id, [x, y]]) => {
    const pending = snap.pending.includes(id),
      current = snap.current === id,
      known = snap.best.includes(id) || expanded.has(id);
    dot(
      c,
      x,
      y,
      37,
      current ? '#365a57' : night,
      current ? gold : known ? mint : steel,
      current ? 5 : 2,
    );
    serif(c, id, x, y, 37, white, 'center');
    label(c, 'd ' + graphDistances[id], x, y + 61, 19, pending ? mint : steel, 'center');
  });
  const yy = 224;
  box(c, 742, yy - 48, 398, 348, 10, '#1a3940', steel, 1);
  label(c, 'Entry S   ·   Query x = 10', 770, yy, 20, mint);
  label(c, 'ef = ' + ef, 770, yy + 59, 29, white);
  for (const [i, [title, ids]] of [
    ['Expand', snap.current ? [snap.current] : []],
    ['Pending', snap.pending],
    ['Retained', snap.best],
  ].entries()) {
    label(c, title, 770, yy + 118 + i * 51, 17, steel);
    label(c, ids.join('  ') || '—', 916, yy + 118 + i * 51, 23, white);
  }
  const travel = b === 3 ? cue(t, 3, 'Expand D', 0.85) : 0;
  if (travel > 0 && travel < 1) {
    dot(
      c,
      mix(graphPos.D[0], graphPos.C[0], travel),
      mix(graphPos.D[1], graphPos.C[1], travel),
      8,
      gold,
    );
  }
  if (snap.current === 'B' && ef === 1)
    label(c, 'B is the closest retained point · distance 2', 65, 602, 22, gold);
  if (snap.best[0] === 'C') label(c, 'C reaches the fixed query · distance 0', 65, 602, 22, gold);
}
