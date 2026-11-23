import { P, fmt, coord, mix, lerpVector } from './drawing.mjs';
import { GRAPH, AUTH } from '../../../films/embedding-geometry/fixtures.mjs';
import { graphSearch, authorizedSearch } from '../../../films/embedding-geometry/model.mjs';
import { cosine, l2, quantize } from '../../../films/embedding-geometry/arithmetic.mjs';
import { tips, grid } from './geometry.mjs';
import { storage } from './codec.mjs';

export function walk(d) {
  const wide = d.cue(4, 'Restart at B') > 0,
    run = graphSearch(wide ? 3 : 1);
  if (wide) {
    const events = run.events;
    let step = 0;
    if (d.cue(4, 'check D') > 0) step = 1;
    if (d.cue(4, 'at A') > 0) step = 2;
    if (d.cue(4, 'link to C') > 0) step = 3;
    if (d.cue(4, 'follow C to E') > 0) step = 4;
    return {
      wide,
      step,
      event: events[step],
      edges: [
        ['B', 'D'],
        ['B', 'A'],
        ['A', 'C'],
        ['C', 'E'],
      ].slice(0, step),
    };
  }
  const step = d.cue(3, 'Follow B to D') > 0 ? 1 : 0;
  return { wide, step, event: run.events[step], edges: [['B', 'D']].slice(0, step) };
}
export function graph(d) {
  const { b, cue, head, txt, line, circle, box } = d;
  if (b <= 2) {
    head('Follow a point down through the index', 'Hierarchical navigable small world graph');
    const levels = [
      ['A', 'B'],
      ['A', 'B', 'C'],
      ['A', 'B', 'C', 'D', 'E'],
    ];
    const pos = { A: 165, B: 405, C: 650, D: 835, E: 1060 };
    levels.forEach((ids, i) => {
      const y = 212 + i * 155;
      txt('L' + (2 - i), 65, y + 10, 25, P.muted, 'Mono');
      line(148, y + 26, 1124, y + 26, P.faint, 2);
      ids.forEach((id, j) => {
        if (j > 0 && i < 2) line(pos[ids[j - 1]], y, pos[id], y, P.metal, 3);
      });
      if (i === 2)
        for (const [id, neighbors] of Object.entries(GRAPH.edges))
          for (const other of neighbors)
            if (id < other) {
              const a = pos[id],
                z = pos[other];
              d.ctx.beginPath();
              d.ctx.moveTo(a, y);
              d.ctx.quadraticCurveTo((a + z) / 2, y - 62, z, y);
              d.ctx.strokeStyle = P.metal;
              d.ctx.lineWidth = 2;
              d.ctx.stroke();
            }
      ids.forEach((id) => {
        circle(pos[id], y, 15, P.shadow, id === 'B' ? P.gold : P.metal);
        txt(id, pos[id], y + 7, 19, P.ink, 'Mono', 'center');
      });
    });
    const travel = cue(2, 'follow links toward', 0.85);
    const drop = cue(2, 'drop to the same point', 1.7);
    d.line(405, 231, 405, 503, P.gold, 2, [3, 5]);
    circle(mix(pos.A, pos.B, travel), 212 + 310 * drop, 22, null, P.gold, 3);
    return;
  }
  const trace = walk(d),
    here = trace.event.id,
    pt = (v) => [111 + v[0] * 142, 520 - v[1] * 139];
  head('Keep a route open through the graph', 'Base layer   ·   entry B   ·   fixed query [5, 2]');
  for (const [id, nn] of Object.entries(GRAPH.edges))
    for (const other of nn)
      if (id < other) line(...pt(GRAPH.points[id]), ...pt(GRAPH.points[other]), P.metal, 4);
  for (const [a, z] of trace.edges) line(...pt(GRAPH.points[a]), ...pt(GRAPH.points[z]), P.gold, 7);
  for (const [id, v] of Object.entries(GRAPH.points)) {
    const a = pt(v);
    circle(...a, 12, id === here ? P.gold : P.dark, id === here ? P.gold : P.muted, 3);
    txt(id, a[0] + (id === 'E' ? -20 : 0), a[1] - 24, 26, P.ink, 'Mono', 'center');
  }
  const q = pt(GRAPH.query);
  d.line(q[0] - 8, q[1], q[0] + 8, q[1], P.query, 3);
  d.line(q[0], q[1] - 8, q[0], q[1] + 8, P.query, 3);
  txt('q', q[0] + 17, q[1] + 17, 24, P.query, 'Mono');
  txt('Search list  ef = ' + (trace.wide ? 3 : 1), 914, 237, 24, P.muted);
  txt('Expand ' + here, 914, 310, 37, P.gold, 'Serif');
  txt('gap²   ' + fmt(l2(GRAPH.query, GRAPH.points[here]) ** 2), 914, 367, 29, P.ink, 'Mono');
  const retained =
    trace.step === 0 && !(trace.wide && cue(4, 'Keep A') > 0)
      ? ['B']
      : graphSearch(trace.wide ? 3 : 1).events[Math.max(0, trace.step - 1)].best;
  txt('Retained candidates', 914, 464, 22, P.muted);
  retained.forEach((id, i) => {
    box(914 + i * 70, 490, 57, 47, P.shadow, P.gold);
    txt(id, 943 + i * 70, 522, 27, P.gold, 'Mono', 'center');
  });
}
export const trials = [
  [16, 0.89, 42],
  [48, 0.97, 56],
  [96, 0.99, 78],
];
export const accepts = ([, r, t]) => r >= 0.96 && t <= 60;
export function budget(d) {
  const { b, head, txt, cue, line, box, circle } = d;
  if (b <= 2) {
    head('How often does a node reach the upper layer?', 'Common maximum-level sampler  ·  M = 32');
    const num = 1024;
    for (let j = 0; j < num; j++) {
      const x = 80 + (j % 64) * 11,
        y = 252 + Math.floor(j / 64) * 14;
      circle(x, y, j % 32 === 0 ? 4.7 : 2.7, j === 0 ? P.gold : j % 32 === 0 ? P.query : P.metal);
    }
    txt('Expected counts per 1,024 nodes', 76, 195, 27, P.ink, 'Serif');
    txt('L ≥ 1     1 / 32', 845, 309, 30, P.query, 'Mono');
    txt('L ≥ 2     1 / 1,024', 845, 389, 28, P.gold, 'Mono');
    if (b === 2) txt('L = floor(−ln U / ln M)     0 < U < 1', 76, 587, 29, P.ink, 'Mono');
    return;
  }
  if (b <= 5) {
    head(
      'Which run meets both gates?',
      'One built graph  ·  illustrative measurements  ·  requested neighbors = 10',
    );
    const X = (t) => 154 + (t - 30) * 17.7,
      Y = (r) => 552 - (r - 0.87) * 2790;
    box(X(30), Y(1), X(60) - X(30), Y(0.96) - Y(1), '#234c43', null, 0);
    line(X(30), Y(0.96), X(84), Y(0.96), P.gold, 2, [5, 5]);
    line(X(60), Y(1), X(60), Y(0.87), P.gold, 2, [5, 5]);
    line(X(30), Y(0.87), X(84), Y(0.87), P.metal);
    line(X(30), Y(0.87), X(30), Y(1), P.metal);
    txt('Recall@10', 64, 166, 22, P.muted);
    txt('0.96', X(30) - 13, Y(0.96) + 7, 22, P.gold, 'Mono', 'right');
    txt('60 ms', X(60), Y(0.87) + 43, 23, P.gold, 'Mono', 'center');
    txt('p99 latency', X(84), Y(0.87) + 43, 23, P.muted, 'Sans', 'right');
    trials.forEach((row) => {
      const [ef, rec, ms] = row,
        x = X(ms),
        y = Y(rec),
        on = cue(5, 'Use forty-eight') > 0 && accepts(row);
      circle(x, y, 9, on ? P.gold : P.query);
      if (on) circle(x, y, 17, null, P.gold, 2);
      txt('ef ' + ef, x + 18, y - 10, 27, on ? P.gold : P.ink, 'Serif');
      txt(
        rec.toFixed(2) + ' / ' + ms + ' ms',
        x + 18,
        y + (ef === 48 ? -43 : 22),
        20,
        P.muted,
        'Mono',
      );
    });
    return;
  }
  const M = 32,
    graphBytes = 2 * M * 4;
  head(
    'Which allocation is larger?',
    'Base layer  ·  2M reserved neighbor IDs per row  ·  four bytes per ID',
  );
  const slots = (x, y, n, col) => {
    for (let i = 0; i < n; i++)
      box(x + (i % 32) * 24, y + Math.floor(i / 32) * 26, 21, 18, col, null, 2);
  };
  txt('Product code', 69, 251, 31, P.ink, 'Serif');
  slots(375, 224, 96 / 4, P.green);
  txt('96 B', 1055, 251, 32, P.green, 'Mono');
  txt('Neighbor slots', 69, 390, 31, P.ink, 'Serif');
  slots(375, 354, 2 * M, P.gold);
  txt(graphBytes + ' B', 1055, 461, 32, P.gold, 'Mono');
  txt('Each block is 4 bytes.', 69, 548, 25, P.muted);
  if (b === 7) txt('Upper links, counts and metadata add to this allocation.', 69, 606, 27, P.ink);
}
export function accessState(d) {
  let k = 1,
    pre = false,
    gated = false,
    picked = false,
    rescored = false,
    allDenied = false;
  if (d.b >= 3) {
    picked = d.cue(3, 'private note takes') > 0;
    gated = d.cue(3, 'Remove the denied') > 0;
  }
  if (d.cue(4, 'Widen the list') > 0) {
    k = 2;
    picked = true;
    gated = d.cue(4, 'Apply the permission') > 0;
    rescored = d.cue(4, 'Fetch its retained') > 0;
  }
  if (d.cue(5, 'Return to one slot') > 0) {
    k = 1;
    pre = d.cue(5, 'check eligibility during') > 0;
    picked = d.cue(5, 'Rotation takes') > 0;
    gated = pre;
    rescored = false;
  }
  if (d.b === 6) {
    allDenied = true;
    pre = true;
    picked = true;
    gated = true;
  }
  if (d.b === 7) {
    k = 2;
    pre = true;
    picked = true;
    gated = true;
  }
  const r = authorizedSearch(k, pre),
    rows = allDenied ? [] : r.rows;
  return {
    k,
    pre,
    gated,
    picked,
    rescored,
    allDenied,
    rows,
    survivors: rows.filter((v) => v.allow),
  };
}
export function access(d) {
  const s = accessState(d);
  const { head, txt, box, line, arrow, fade, after, b } = d;
  const noFetch = b === 3 && after(3, 'Nobody is left') === 1;
  const widePick = b === 4 && after(4, 'Now it holds private and rotation') === 1;
  const rotationOnly = b === 4 && after(4, 'Only rotation survives') === 1;
  const filtered = b === 5 && after(5, 'Rotation takes that slot') === 1;
  const denyAll = b === 6 && after(6, 'take the empty-result path') === 1;
  const rerank = b === 7 && after(7, 'Both public guides survive') === 1;
  const ready = s.picked && s.gated && (b !== 3 || noFetch) && (b !== 4 || rotationOnly);

  head(
    'Which guide reaches the reader?',
    s.allDenied
      ? 'Separate request · all access denied'
      : b === 7
        ? 'Separate request · filter before selection'
        : `Query signs  ${AUTH.query.map((x) => +(x > 0)).join('')}  ·  lower Hamming wins  ·  storage order breaks ties`,
  );

  txt('Stored passages', 72, 199, 29, P.ink);
  txt(`Shortlist · K = ${s.k}`, 670, 199, 29, P.ink, 'Sans', 'center');
  txt('Eligible to fetch', 1060, 199, 29, P.ink, 'Sans', 'center');
  const gateX = s.pre ? 483 : 849;
  txt(s.pre ? 'Filter first' : 'Filter after', gateX, 237, 24, b === 1 ? P.muted : P.gold, 'Sans', 'center');
  if (b >= 2) line(gateX, 250, gateX, 506, P.gold, 3, [9, 8]);

  AUTH.rows.forEach((r, i) => {
    const y = 280 + i * 98;
    const col = i === 0 ? P.pink : P.green;
    const hd = r.vector.filter((x, j) => x > 0 !== AUTH.query[j] > 0).length;
    const index = s.rows.findIndex((item) => item.id === r.id);
    const candidate =
      s.picked && index >= 0 &&
      (b !== 4 || widePick) && (b !== 5 || filtered) && (b !== 7 || rerank);
    const eligible = candidate && ready && r.allow && !s.allDenied;
    const denied = denyAll || (!r.allow && ((candidate && ready) || (s.pre && (filtered || rerank))));
    const rowText = !s.allDenied && r.allow ? 'Allowed' : 'Denied';

    box(62, y - 34, 330, 76, P.shadow, P.metal);
    txt(r.id, 81, y - 2, 32, col, 'Serif');
    if (!s.allDenied) txt(r.vector.map((x) => +(x > 0)).join('') + '  H=' + hd, 251, y - 2, 25, P.ink, 'Mono');
    txt(rowText, 82, y + 28, 23, rowText === 'Allowed' ? P.green : P.pink);

    if (candidate) {
      arrow([399, y + 1], [542, y + 1], col, 3);
      box(551, y - 28, 236, 58, P.shadow, col);
      txt(`Slot ${index + 1} · ${r.id}`, 669, y + 10, 28, col, 'Sans', 'center');
    } else {
      line(550, y + 1, 786, y + 1, P.faint, 2, [5, 8]);
    }
    if (denied) {
      const start = s.pre ? 399 : 794;
      line(start, y + 1, gateX - 10, y + 1, P.pink, 3);
      txt('×', gateX, y + 10, 35, P.pink, 'Sans', 'center');
    }
    if (eligible) {
      const result = s.rows[index];
      const score = b === 4 && after(4, 'Fetch its retained vector and rescore it') === 1;
      arrow([794, y + 1], [913, y + 1], col, 3);
      box(925, y - 28, 282, 58, P.shadow, col);
      if (score) {
        txt(r.id, 1066, y - 3, 27, col, 'Sans', 'center');
        txt('cos ' + result.cosine.toFixed(4), 1066, y + 21, 25, col, 'Mono', 'center');
      } else {
        txt(r.id, 1066, y + 10, 31, col, 'Mono', 'center');
      }
    }
  });

  if (b === 2) txt('One slot. Which passage can pass the check?', 72, 557, 31, P.gold);
  if (noFetch || denyAll) txt('Empty result · no fetch', 72, 557, 32, P.pink);
  if (b === 4 || b === 5) {
    txt('K = 1, filter after → empty', 72, 550, 25, P.muted);
    if (rotationOnly || filtered)
      txt(b === 4 ? 'K = 2, filter after → Rotation' : 'K = 1, filter first → Rotation', 647, 550, 28, P.green);
  }
  if (b === 5 && after(5, 'Recheck current access before fetching passage text') === 1)
    txt('Recheck access before reading text.', 647, 584, 25, P.gold);
  if (rerank)
    fade(after(7, 'cross encoder', 0.4), () =>
      txt('Reranker input · two permitted query–passage pairs', 72, 557, 29, P.gold),
    );
}
export function deployment(d) {
  const { head, txt, box, b, cue, line } = d,
    store = storage(50e6, 768, 96),
    gb = (n) => fmt(n / 1e9, 1);
  head('Size the serving path', '50 million rows  ×  768 coordinates  ·  target p99 ≤ 60 ms');
  const codes = cue(2, 'codes add') > 0,
    all = cue(3, 'two vector stores total') > 0;
  txt('Retained originals', 66, 208, 26, P.query, 'Serif');
  box(66, 234, 819, 63, P.query, null, 3);
  txt(gb(store.float) + ' GB', 85, 278, 29, P.dark, 'Mono');
  if (codes) {
    box(885, 234, 205, 63, P.gold, null, 3);
    txt(gb(store.scalar) + ' GB', 901, 278, 26, P.dark, 'Mono');
    txt('Scalar codes', 887, 208, 25, P.gold, 'Serif');
  }
  if (all) {
    line(66, 328, 1090, 328, P.metal);
    txt('Combined payload   ' + gb(store.float + store.scalar) + ' GB', 66, 389, 31, P.ink, 'Mono');
  }
  if (b >= 4) {
    txt('Request p99', 67, 480, 24, P.muted);
    txt(b === 4 ? '?' : 'measure end to end', 66, 535, 37, P.gold, 'Serif');
    if (b === 5) {
      txt('Search  →  fetch originals  →  rescore', 515, 533, 29, P.ink, 'Mono');
      txt(
        'Same eligible queries  ·  exact-neighbor recall and judged relevance',
        65,
        614,
        25,
        P.muted,
      );
    }
  } else {
    txt('Shared evaluation', 66, 489, 23, P.muted);
    txt('Model version   /   unit vectors   /   eligible documents', 66, 548, 29, P.ink, 'Mono');
  }
}
const vertical = [0, 1];
export function shortlist(d) {
  const { cue, after } = d;
  const snap = after(2, 'C and D both store one, point two', 0.48);
  const k = after(4, 'Widen the shortlist to two') === 1 ? 2 : 1;
  const admitted = [after(3, 'Only C survives the cutoff'), after(4, 'D now gets a slot')];
  const fetch = [cue(3, 'Fetch its original vector', 1), cue(4, "Fetch D's original vector", 1)];
  const scored = [
    after(3, 'Its cosine is about point one three'),
    after(4, 'Its cosine is point two eight'),
  ];
  const ranked = after(4, 'Put D first') === 1;
  const rows = tips.map((v, i) => {
    const repr = quantize(v, grid);
    const selected = i < k && admitted[i] === 1;
    const travel = selected ? fetch[i] : 0;
    return {
      id: ['C', 'D'][i],
      v,
      repr,
      codeScore: cosine(vertical, repr),
      score: cosine(vertical, v),
      selected,
      travel,
      scored: travel === 1 && scored[i] === 1,
    };
  });
  const order = rows.filter((row) => row.scored).sort((a, b) => b.score - a.score);
  return {
    rows,
    snap,
    k,
    slotsOpen: after(2, 'Suppose the first stage keeps one slot') === 1,
    showOriginals: after(1, 'With the full coordinates, D wins on cosine') === 1,
    fetched: rows.filter((row) => row.travel === 1).length,
    order: ranked || k === 1 ? order : [],
    ranked,
  };
}
export function rescore(d) {
  const { head, txt, line, box, circle, fade } = d,
    s = shortlist(d);
  head(
    'Which originals can the rescorer open?',
    `Fixed upward query ${coord(vertical)}  ·  grid step ${fmt(grid)}  ·  ties keep storage order`,
  );
  const pt = ([x, y]) => [92 + x * 360, 527 - y * 360];
  const origin = pt([0, 0]);
  const queryTip = pt(vertical);
  const colors = [P.green, P.pink];
  line(...origin, ...pt([1.22, 0]), P.faint);
  d.arrow(origin, queryTip, P.query, 5);
  txt('q', queryTip[0] - 13, queryTip[1] + 11, 28, P.query, 'Mono', 'right');
  if (s.snap === 1) {
    const [x, y] = pt(s.rows[0].repr);
    circle(x, y, 8, P.gold);
    line(x + 12, y + 3, x + 53, y + 74, P.gold, 2);
    txt('Shared code', x + 54, y + 105, 25, P.gold, 'Sans', 'right');
  }
  s.rows.forEach((r, i) => {
    const tip = pt(r.v);
    const col = colors[i];
    fade(s.snap * 0.55, () => {
      line(...origin, ...tip, col, 2, [4, 6]);
      circle(...tip, 7, P.dark, col);
    });
    if (s.snap < 1) {
      const current = pt(lerpVector(r.v, r.repr, s.snap));
      line(...origin, ...current, col, 4);
      circle(...current, 7, col);
    }
    fade(r.travel, () => {
      line(...origin, ...tip, col, 4);
      circle(...tip, 7, col);
    });
    txt(r.id, tip[0] + 16, tip[1] + (i ? -5 : 24), 25, col, 'Mono');
  });

  const compressed = s.snap > 0;
  const scoresTitle = s.snap === 1 ? 'Code cosine' : compressed ? 'Rounding' : 'Original cosine';
  txt(scoresTitle, 554, 211, 24, P.muted);
  if (s.slotsOpen) {
    txt(`Shortlist · K = ${s.k}`, 759, 211, 24, P.muted);
    txt('Fetched cosine', 1002, 211, 24, P.muted);
  }
  s.rows.forEach((r, i) => {
    const y = 311 + i * 126;
    const col = colors[i];
    txt(r.id, 553, y + 8, 28, col, 'Mono');
    if (s.snap === 1 || (!compressed && s.showOriginals)) {
      txt((compressed ? r.codeScore : r.score).toFixed(4), 591, y + 8, 28, col, 'Mono');
      txt(coord(compressed ? r.repr : r.v), 554, y + 46, 22, P.muted, 'Mono');
    }
    if (!s.slotsOpen) return;
    if (i < s.k) {
      box(760, y - 35, 113, 69, P.shadow, r.selected ? col : P.metal);
      txt(r.selected ? r.id : '?', 817, y + 10, 32, r.selected ? col : P.muted, 'Mono', 'center');
    } else if (s.rows[0].selected) {
      line(760, y - 24, 760, y + 22, P.muted, 2);
      txt('Outside cutoff', 773, y + 8, 24, P.muted);
    }
    if (r.travel > 0) {
      const destination = 1002;
      const front = mix(879, destination, r.travel);
      line(879, y, destination, y, P.metal, 2, [4, 5]);
      line(879, y, front, y, col, 3);
      circle(front, y, 6, col);
    }
    if (r.travel === 1) {
      box(1002, y - 35, 202, 69, P.shadow, col);
      txt(
        r.scored ? r.id + '  ' + r.score.toFixed(4) : 'Scoring ' + r.id,
        1103,
        y + 9,
        27,
        col,
        'Mono',
        'center',
      );
    }
  });
  if (s.fetched) {
    line(554, 529, 1204, 529, P.metal);
    txt(`${s.fetched} ${s.fetched === 1 ? 'original' : 'originals'} fetched`, 554, 583, 26, P.ink);
  }
  if (s.order.length) {
    txt('Returned order', 813, 583, 23, P.muted);
    s.order.forEach((r, i) => {
      const x = 996 + i * 108;
      const col = r.id === 'C' ? P.green : P.pink;
      box(x, 549, 95, 49, P.shadow, col);
      txt(`${i + 1}  ${r.id}`, x + 47, 583, 26, col, 'Mono', 'center');
    });
  }
}
