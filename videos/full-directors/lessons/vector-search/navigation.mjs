import {
  P,
  text,
  line,
  rect,
  circle,
  polygon,
  title,
  footer,
  chip,
  caption,
  heading,
  row,
  cue,
  on,
  lerp,
} from './plates.mjs';
import {
  POINTS,
  pt,
  ids,
  d2,
  distance,
  retainedTrace,
  bridgeNames,
  bridgeScores,
  g,
  neighbors,
  baseComponents,
  raw,
  listWork,
  operating,
} from './examples.mjs';
import { field } from './neighborhood.mjs';

function bridge(c, seen, retained, active, { x = 104, y = 263, width = 478, probe } = {}) {
  const xs = [x, x + width * 0.5, x + width],
    ys = [y, y - 61, y + 29];
  for (let j = 0; j < 2; j++) {
    line(
      c,
      xs[j],
      ys[j],
      xs[j + 1],
      ys[j + 1],
      seen.includes(j + 1) ? P.sea : P.grid,
      seen.includes(j + 1) ? 4 : 2,
    );
  }
  if (probe) {
    const { from, to, progress } = probe;
    line(
      c,
      xs[from],
      ys[from],
      lerp(xs[from], xs[to], progress),
      lerp(ys[from], ys[to], progress),
      P.rust,
      3,
    );
  }
  bridgeNames.forEach((id, i) => {
    if (active === i) circle(c, xs[i], ys[i], 25, null, P.rust, 2.5);
    chip(c, id, xs[i], ys[i], retained.includes(i) ? P.sea : P.dim, 18);
    text(
      c,
      seen.includes(i) ? String(bridgeScores[i]) : '?',
      xs[i],
      ys[i] + 45,
      22,
      seen.includes(i) ? P.ink : P.dim,
      'center',
      'Mono',
    );
  });
}
export function walk(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 3) {
    title(
      c,
      'What if the next step goes uphill?',
      'Greedy graph search   /   a separate three-node bridge',
    );
    const m = on(k, 3, 'A greedy walk');
    bridge(c, m ? [0, 1] : [0], [0], 0, { x: 153, y: 273, width: 650 });
    footer(
      c,
      m
        ? 'E keeps the lead. The score behind M is still unknown.'
        : 'The numbers under the nodes are squared distances. Smaller wins.',
    );
    return;
  }
  title(c, 'How far can the stored links take us?', 'Graph traversal   /   rollback query');
  const s1 = cue(k, 2, 'Follow E’s link to C', 1),
    s2 = cue(k, 2, 'From C', 1),
    n = 1 + Number(s1 === 1) + Number(s2 === 1);
  field(c, {
    scale: 42,
    segments: [
      ['E', 'C', s1],
      ['C', 'A', s2],
    ],
    marked: ['E', 'C', 'A'].slice(0, n),
  });
  heading(c, 'Squared distance on this path', 574, 144);
  ['E', 'C', 'A'].forEach((id, i) => {
    if (i < n) row(c, 573, 199 + 61 * i, 'Passage ' + id, d2(pt(id)), 334);
  });
  caption(c, n + ' of six passages scored', 573, 403);
  footer(c, 'A graph stores routes between passages. The route restricts which IDs compete.');
}
function layers(
  c,
  { build = false, wire = false, upper = 0, down = 0, showG = false, detail = false } = {},
) {
  const Y = [352, 254, 156],
    X = { E: 182, C: 306, A: 415, B: 495, D: 653, F: 760, G: 572 };
  const plane = [['E', 'C', 'A', 'B', 'D', 'F'], ['E', 'A', 'F'], build ? ['E', 'F'] : ['E', 'A']];
  for (let l = 2; l >= 0; l--) {
    const y = Y[l];
    polygon(
      c,
      [
        [78, y + 20],
        [774, y + 20],
        [844, y - 20],
        [148, y - 20],
      ],
      l === 0 ? '#dfebe3' : '#e7e9df',
      P.grid,
    );
    text(c, 'L' + l, 45, y, 17, P.dim, 'left', 'Mono');
    const a = plane[l];
    for (let i = 1; i < a.length; i++) line(c, X[a[i - 1]], y, X[a[i]], y, P.dim, 1.4);
    if (l === 2 && upper > 0) {
      const start = build ? X.F : X.E,
        target = build ? X.E : X.A;
      line(c, start, y, lerp(start, target, upper), y, P.rust, 4);
    }
    if (!build && l < 2 && down > 0)
      line(
        c,
        X.A,
        Y[l + 1],
        X.A,
        lerp(Y[l + 1], y, Math.min(1, Math.max(0, down * 2 - (1 - l)))),
        P.rust,
        2,
        [4, 3],
      );
    if (build && wire && l < 2) {
      const links = l === 1 ? ['A'] : ids(neighbors());
      links.forEach((id) => line(c, X.G, y - 20, X[id], y, P.sea, 2.6));
    }
    a.forEach((id) => {
      chip(c, id, X[id], y, P.ink, 10);
    });
    if (build && showG && l < 2) chip(c, 'G', X.G, y - 20, P.sea, 13);
  }
  if (detail) text(c, 'Entry F', 760, 115, 14, P.rust, 'center', 'Mono');
}
const narrowTrace = retainedTrace(1);
const wideTrace = retainedTrace(3);

function expanding(before, after, progress, scored) {
  return {
    ...before,
    current: after.current,
    queue: before.queue.filter((i) => i !== after.current),
    visited: scored ? after.visited : before.visited,
    comparisons: scored ? after.comparisons : before.comparisons,
    probe: { from: after.current, to: after.visited.at(-1), progress },
  };
}

function bridgePicture(k, b) {
  const begin = (phrase, span = 0) => k.reveal(phrase, span, { captionStart: false });
  const after = (phrase) => k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  const [seed, keptM, keptH] = wideTrace;
  const rejectedM = narrowTrace[1];
  const rejected = 'M scores worse than E. The full heap keeps E and the queue is empty.';
  const narrowWork = 'At width one, we scored M even though only E fit in the result heap.';
  const heapRoles = 'The queue picks the next expansion. The heap keeps the best scores seen.';

  if (b === 2) {
    if (begin('with room for three')) {
      const scan = begin('Now it keeps M', 0.45);
      const kept = after('Now it keeps M alongside E');
      const state = kept ? keptM : scan ? expanding(seed, keptM, scan, scan === 1) : seed;
      return {
        state,
        capacity: 3,
        note: kept
          ? 'M is next to expand. What can we reach from M?'
          : 'Same graph and entry point. This time the result heap has three slots.',
      };
    }
    const scan = begin('Score M', 0.65);
    const scored = after('Two is worse than one');
    const discarded = after('The narrow search discards M');
    const state = discarded ? rejectedM : scan ? expanding(seed, rejectedM, scan, scored) : seed;
    return {
      state,
      capacity: 1,
      note: discarded ? rejected : scored ? 'M scores 2 against a full cutoff of 1.' : heapRoles,
    };
  }
  if (b === 3) {
    if (after('At width one we still scored two nodes')) {
      return { state: rejectedM, capacity: 1, note: narrowWork };
    }
    const pop = begin('Expand M');
    const scan = k.reveal('Its next link reaches H', 0.7, {
      captionStart: 'Its next link reaches H',
    });
    k.reveal('with a score of one tenth', 0, { captionStart: 'with a score of one tenth' });
    const scored = after('with a score of one tenth');
    const kept = after('H moves ahead of E');
    return {
      state: kept ? keptH : pop ? expanding(keptM, keptH, scan, scored) : keptM,
      capacity: 3,
      note: kept
        ? 'H now has the best score. M still sets the worst retained score.'
        : 'M has a worse score than E, but there is room to keep and expand it.',
    };
  }
  if (b === 4) {
    return { state: rejectedM, capacity: 1, note: narrowWork };
  }
  if (b === 5) {
    const popE = begin('Pop E');
    const popM = begin('Pop M');
    const scanM = begin('Pop E', 0.42);
    const scanH = begin('Pop M', 0.42);
    const sawM = begin('then admit M');
    const sawH = begin('then admit H');
    let state = seed;
    if (popE) state = expanding(seed, keptM, scanM, sawM);
    if (after('then admit M')) state = keptM;
    if (popM) state = expanding(keptM, keptH, scanH, sawH);
    if (after('then admit H')) state = keptH;
    return { state, capacity: 3, note: heapRoles };
  }
  const narrow = begin('In the narrow run');
  return {
    state: narrow ? rejectedM : keptH,
    capacity: narrow ? 1 : 3,
    note: narrow
      ? 'The queue emptied before M could expand. H was never scored.'
      : 'With a full heap, a next candidate worse than its cutoff can end the search.',
  };
}

function bridgeSlots(c, entries, y, color, capacity) {
  const count = capacity ?? entries.length;
  for (let i = 0; i < count; i++) {
    const node = entries[i];
    const x = 535 + i * 125;
    const head = i === 0 && node !== undefined;
    rect(c, x, y, 114, 43, head ? color : P.white, node === undefined ? P.grid : color);
    if (node !== undefined)
      text(
        c,
        bridgeNames[node] + '  ' + bridgeScores[node],
        x + 57,
        y + 22,
        22,
        head ? P.white : color,
        'center',
        'Mono',
      );
  }
  if (count === 0) {
    rect(c, 535, y, 114, 43, P.white, P.grid);
    text(c, 'empty', 592, y + 22, 20, P.dim, 'center', 'Mono');
  }
}

export function hierarchy(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    title(
      c,
      'Drop to a denser layer at the same passage',
      'Hierarchical navigable small world graph',
    );
    layers(c, { upper: cue(k, 1, 'a long link', 1.2), down: cue(k, 1, 'drop down', 0.8) });
    footer(c, 'The sparse layer crosses neighborhoods. Lower layers expose local links.');
    return;
  }
  const { state, capacity, note } = bridgePicture(k, b);
  title(c, 'Can the search keep an uphill step?', 'HNSW   /   return one result');
  caption(c, 'Squared distance · smaller wins', 72, 132);
  bridge(c, state.visited, state.retained, state.probe ? state.current : null, {
    x: 98,
    y: 255,
    width: 358,
    probe: state.probe,
  });
  if (state.probe) text(c, 'Expanding ' + bridgeNames[state.current], 72, 343, 20, P.rust);
  const worstFirst = [...state.retained].reverse();
  const best = state.retained[0];
  row(c, 72, 391, 'Best retained', bridgeNames[best] + '  ' + bridgeScores[best], 407);
  text(c, 'Retained capacity (ef_search)   ' + capacity, 535, 132, 18, P.dim, 'left', 'Mono');
  heading(c, 'Expansion queue · nearest first', 535, 174);
  bridgeSlots(c, state.queue, 196, P.sea);
  heading(c, 'Result heap · worst first', 535, 274);
  bridgeSlots(c, worstFirst, 296, P.berry, capacity);
  row(c, 535, 391, 'Distinct nodes scored', state.comparisons, 364);
  footer(c, note);
}
export function insertion(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 6) {
    const raised = on(k, 6, 'or reject'),
      cap = raised ? 12 : 6;
    title(
      c,
      raised ? 'Twelve slots meet the capacity requirement' : 'Can six retained slots serve k = 12?',
      'Query configuration   /   lab contract',
    );
    for (let i = 0; i < 12; i++) {
      let x = 52 + (i % 6) * 145,
        y = 152 + Math.floor(i / 6) * 107;
      rect(c, x, y, 126, 79, i < cap ? P.lagoon : P.white, i < cap ? P.sea : P.grid);
      text(c, i + 1, x + 63, y + 39, 27, i < cap ? P.sea : P.dim, 'center', 'Mono');
    }
    footer(
      c,
      'ef_search = ' +
        cap +
        '   ·   k = 12   ·   ' +
        (raised ? 'valid capacity for a timing trial' : 'raise capacity or reject the request'),
    );
    return;
  }
  if (b === 4) {
    title(
      c,
      'Which second link reaches a new direction?',
      'HNSW insertion   /   base-layer first pass',
    );
    const keepB = on(k, 4, 'A is also close'),
      skipA = on(k, 4, 'Skip A'),
      compareE = on(k, 4, 'E is farther'),
      keepE = on(k, 4, 'Select up to M');
    const candidate = compareE ? 'E' : 'A';
    field(c, {
      scale: 41,
      center: { x: 5.1, y: 4.8 },
      shown: [...POINTS, g],
      qMark: false,
      segments: [
        [g, 'B', Number(keepB)],
        [g, 'E', Number(keepE)],
        [pt(candidate), pt('B'), Number(skipA), P.berry],
      ],
    });
    heading(c, 'Compare squared distances', 568, 147);
    row(c, 568, 201, 'G to B', d2(pt('B'), g), 343);
    if (skipA) {
      row(c, 568, 252, 'G to ' + candidate, d2(pt(candidate), g), 343);
      row(c, 568, 303, 'B to ' + candidate, d2(pt(candidate), pt('B')), 343, P.berry);
    }
    if (keepE) row(c, 568, 362, 'Kept links', ids(neighbors()).join(', '), 343, P.sea);
    footer(c, 'Keep a candidate if it is closer to G than to every neighbor already chosen.');
    return;
  }
  title(
    c,
    b === 2 ? 'How sparse do the upper layers get?' : 'Where does a new passage get links?',
    'HNSW construction   /   M = 4',
  );
  if (b === 2) {
    const counts = [64, 16, 4];
    counts.forEach((count, i) => {
      const y = 162 + i * 90;
      heading(c, 'Layer ' + i, 40, y);
      for (let j = 0; j < count; j++)
        circle(c, 210 + (j % 32) * 17, y - 7 + Math.floor(j / 32) * 13, 4.2, i ? P.sea : P.ink);
      text(c, count + ' / 64', 910, y, 21, P.dim, 'right', 'Mono');
    });
    footer(c, 'Expected counts with 64 points and sampling scale 1 / ln(M). Actual draws vary.');
    return;
  }
  layers(c, {
    build: true,
    upper: cue(k, 3, 'Walk across layer two', 1),
    showG: on(k, 3, 'G drew layer one'),
    wire: on(k, 3, 'Wire G'),
    detail: true,
  });
  footer(
    c,
    b === 5
      ? 'Typical base cap 2M = 8. Pruning may remove a reverse link. F remains the entry.'
      : b === 3
        ? 'Navigate layer 2. Search and wire layers 1 and 0 with the construction beam.'
        : 'M limits links selected per insertion. Random sampling chooses the top occupied layer.',
  );
}

export function scaleBudget(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    title(c, 'What does a flat scan cost?', 'Raw float32 coordinates   /   before index overhead');
    for (let i = 0; i < 100; i++) {
      const x = 64 + (i % 10) * 26,
        y = 133 + Math.floor(i / 10) * 26;
      rect(c, x, y, 22, 21, P.sea);
      line(c, x + 4, y + 7, x + 17, y + 7, '#9ab9b4');
      line(c, x + 4, y + 13, x + 13, y + 13, '#9ab9b4');
    }
    heading(c, 'One tile holds a million passages', 379, 152);
    row(c, 379, 212, '100 million × 1,536', baseComponents / 1e9 + 'B components', 529);
    if (on(k, 1, 'At four bytes each')) {
      row(c, 379, 282, 'Four bytes per component', raw / 1e9 + ' GB', 529, P.sea);
      row(c, 379, 352, 'Binary units', '≈ ' + Math.round(raw / 2 ** 30) + ' GiB', 529);
    }
    footer(c, 'Unfiltered flat search scores N × d components per query.');
    return;
  }
  if (b <= 3) {
    const probes = on(k, 3, 'Raise the budget') ? 20 : 5;
    title(c, 'How much work does one probe add?', 'Balanced IVF lists   /   flat coarse quantizer');
    for (let i = 0; i < 32; i++)
      for (let j = 0; j < 32; j++) {
        const index = i * 32 + j;
        rect(c, 50 + j * 8.5, 129 + i * 8.5, 7, 7, index < probes ? P.rust : '#a5bbaf');
      }
    caption(c, '1,024 lists', 50, 424);
    heading(c, 'One million vectors in total', 378, 148);
    row(c, 378, 208, 'Average list length', '≈ ' + Math.round(listWork(1)), 530);
    row(
      c,
      378,
      270,
      probes + ' lists × mean length',
      '≈ ' + Math.round(listWork(probes)).toLocaleString('en-US'),
      530,
      P.rust,
    );
    row(c, 378, 332, 'Centers scored', '1,024', 530);
    footer(c, 'Use the mean list size for this estimate. Measure time on the actual workload.');
    return;
  }
  if (b === 4) {
    title(
      c,
      'When can a tree skip a branch?',
      'Distance bounds   /   illustrative one-dimensional slice',
    );
    const best = 2;
    const xs = (v) => 160 + 80 * v;
    line(c, xs(0), 265, xs(8.2), 265, P.ink, 2);
    chip(c, 'q', xs(0), 265, P.rust);
    circle(c, xs(best), 265, 8, P.sea);
    text(c, 'current best = 2', xs(2), 209, 19, P.sea, 'center');
    rect(c, xs(4), 236, 240, 58, P.lagoon, P.sea);
    for (const z of [4.4, 5.2, 6.6]) circle(c, xs(z), 265, 8, P.sea);
    text(c, 'branch starts at 4', xs(5.5), 324, 18, P.sea, 'center');
    footer(
      c,
      on(k, 4, 'Pad the points')
        ? 'Adding zero coordinates preserves every distance and bound here.'
        : 'The branch starts beyond the current best. Every point inside can be skipped.',
    );
    return;
  }
  title(
    c,
    'Which settings belong on the frontier?',
    'Illustrative measurements   /   higher recall, lower latency',
  );
  const X = (x) => 104 + x * 35,
    Y = (y) => 407 - y * 290;
  [0, 0.25, 0.5, 0.75, 1].forEach((n) => {
    line(c, 100, Y(n), 891, Y(n), P.grid);
    text(c, Math.round(n * 100) + '%', 85, Y(n), 14, P.dim, 'right', 'Mono');
  });
  [0, 4, 8, 12, 16, 20].forEach((n) => text(c, n + ' ms', X(n), 426, 14, P.dim, 'center', 'Mono'));
  const found = on(k, 5, 'On the frontier');
  line(c, X(12), Y(0), X(12), Y(1), P.dim, 1, [3, 4]);
  operating.forEach(([x, y], i) => {
    if (found && i > 0 && i < 4)
      line(c, X(operating[i - 1][0]), Y(operating[i - 1][1]), X(x), Y(y), P.sea, 2);
    circle(c, X(x), Y(y), 8, found && i === 4 ? P.berry : P.sea);
    if (x === 12) text(c, y * 100 + '%', X(x) + 17, Y(y) + 15, 17, P.ink);
  });
  footer(
    c,
    found
      ? 'At 12 ms the 85% setting dominates the 70% setting.'
      : 'Two runs have the same latency. Follow the vertical line at 12 ms.',
  );
}
