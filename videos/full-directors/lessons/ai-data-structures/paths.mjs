import { MESSAGES, LINKS } from '../../../films/ai-data-structures/fixtures.mjs';
import { breadthFirstTrace, buildIndex } from '../../../films/ai-data-structures/arithmetic.mjs';
import { animalDocs, animalSearch } from './retrieval.mjs';
import {
  C,
  beat,
  cue,
  label,
  text,
  line,
  rect,
  dot,
  plate,
  slots,
  token,
  strip,
  foot,
  arrow,
  node,
  idText,
} from './archive.mjs';

export function tree(g, c) {
  const walk = cue(c, 1, 'Visit its descendants', 2.6);
  const billing = MESSAGES.filter((r) => r.topic === 'Billing');
  const leaves = [...billing, MESSAGES.find((r) => r.topic === 'Access')];
  const topics = [
    [430, 'Billing'],
    [963, 'Access'],
  ];
  const xx = [169, 420, 669, 963];
  for (const [x, name] of topics) {
    const lit = name === 'Billing' && walk;
    line(g, 640, 211, x, 326, lit ? C.gold : C.rail, lit ? 7 : 3);
    leaves.forEach((r, i) => {
      if (r.topic !== name) return;
      const visited = lit && (i + 0.6) / billing.length <= walk;
      line(g, x, 330, xx[i], 462, visited ? C.gold : C.rail, visited ? 6 : 3);
      node(g, xx[i], 465, 'M' + r.id, { r: 37, fill: visited ? C.gold : C.paper });
    });
    token(g, x - 84, 304, name, 168, 59, lit ? C.gold : C.paper);
  }
  token(g, 501, 167, 'Support notes', 278, 62);
  foot(
    g,
    walk === 1
      ? 'Billing reaches M0, M2 and M3. Each leaf has one parent.'
      : 'Follow one topic branch to choose a candidate pool.',
  );
}
const graphPos = { 0: [170, 249], 2: [565, 232], 3: [452, 472] };
function edge(g, from, to, active) {
  const a = graphPos[from],
    b = graphPos[to],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    dist = Math.hypot(dx, dy);
  const offset = (from === 0 && to === 3) || (from === 3 && to === 0) ? 13 : 0;
  const ox = (-dy / dist) * offset,
    oy = (dx / dist) * offset;
  arrow(
    g,
    a[0] + (dx / dist) * 49 + ox,
    a[1] + (dy / dist) * 49 + oy,
    b[0] - (dx / dist) * 52 + ox,
    b[1] - (dy / dist) * 52 + oy,
    active ? C.gold : C.rail,
    active ? 5 : 2.8,
  );
}
export function graph(g, c) {
  const trace = breadthFirstTrace();
  const following = cue(c, 1, 'Follow its neighbors', 0) === 1;
  const marked = cue(c, 1, 'mark each newly discovered ID', 0) === 1;
  const admitted = cue(c, 1, 'then enqueue it', 0) === 1;
  const claimM2 = cue(c, 2, 'Expand M2 next', 0) === 1;
  const claimM3 = cue(c, 2, 'Expand M3', 0) === 1;
  const step = claimM3 ? 3 : claimM2 ? 2 : admitted ? 1 : 0;
  const state = trace[step];
  const current = following && !admitted ? 0 : state.current;
  const pending = following && !admitted ? [] : state.pending;
  const discovered = marked && !admitted ? trace[1].discovered : state.discovered;
  const inspectM2 = claimM2 && !claimM3 && cue(c, 2, 'Its link points to M3', 0) === 1;
  const inspectM3 = claimM3 && cue(c, 2, 'follow its link back to M0', 0) === 1;
  const duplicateM2 = inspectM2 && cue(c, 2, 'which is already waiting', 0) === 1;
  const duplicateM3 = inspectM3 && cue(c, 2, 'already discovered too', 0) === 1;
  const activeSource = inspectM2 ? 2 : inspectM3 ? 3 : current === 0 ? 0 : null;
  for (const [id, neighbors] of Object.entries(LINKS))
    for (const v of neighbors)
      edge(g, Number(id), v, activeSource === Number(id));
  for (const [k, pos] of Object.entries(graphPos))
    node(g, ...pos, 'M' + k, {
      r: 43,
      fill:
        Number(k) === current
          ? C.gold
          : discovered.includes(Number(k))
            ? C.mint
            : C.paper,
    });
  plate(g, 709, 160, 434, 343);
  label(g, 'Waiting · FIFO', 739, 215);
  slots(
    g,
    740,
    241,
    [...pending.map((x) => 'M' + x), ...Array(2 - pending.length).fill(null)],
    { w: 112 },
  );
  label(g, 'Discovered', 739, 359);
  text(g, idText(discovered), 739, 406, 28, C.mint, 'Mono');
  if (duplicateM2) text(g, 'M3 is already waiting', 739, 463, 23, C.gold, 'Mono');
  else if (duplicateM3)
    text(g, 'Seen again  ' + idText(state.skipped), 739, 463, 23, C.gold, 'Mono');
  foot(
    g,
    duplicateM3
      ? 'The return edge to M0 adds no new job. The waiting queue is empty.'
      : 'Mark each new ID when it enters the queue. A later route sees that mark.',
  );
}
export const vocabulary = ['charge', 'charged', 'charges'];
export function prefixMatches(prefix) {
  return vocabulary.filter((w) => w.startsWith(prefix));
}
function pathLetters(g, x, y, prefix, progress, pitch = 88, r = 29) {
  const origin = x - 54;
  line(g, origin, y, x, y, progress >= 1 ? C.gold : C.rail, 4);
  dot(g, origin, y, 8, C.mint);
  text(g, 'root', origin, y + 47, 16, C.pale, 'Mono', 'center');
  for (let i = 1; i < prefix.length; i++)
    line(g, x + (i - 1) * pitch, y, x + i * pitch, y, i < progress ? C.gold : C.rail, 4);
  [...prefix].forEach((l, i) =>
    node(g, x + i * pitch, y, l, { r, fill: i < progress ? C.gold : C.paper }),
  );
}
export function pathCost(g, c) {
  const n = beat(c);
  if (n <= 2) {
    label(g, 'Outgoing adjacency lists', 67, 162);
    label(g, 'All possible pairs', 716, 162);
    const count = Math.ceil(3 * cue(c, 1, 'outgoing links', 1.35));
    const ids = [0, 2, 3].slice(0, count);
    MESSAGES.forEach((r, i) => {
      const y = 190 + i * 85,
        seen = ids.includes(r.id);
      token(g, 68, y, 'M' + r.id, 82, 48, seen ? C.gold : C.paper);
      arrow(g, 166, y + 23, 234, y + 23, seen ? C.gold : C.rail);
      text(
        g,
        LINKS[r.id].length ? idText(LINKS[r.id]) : '∅',
        254,
        y + 31,
        25,
        seen ? C.cream : C.pale,
        'Mono',
      );
    });
    const gridX = 724,
      gridY = 216,
      cell = 62;
    for (let i = 0; i < 4; i++) {
      label(g, 'M' + i, gridX + i * cell + 25, gridY - 13, 'center');
      label(g, 'M' + i, gridX - 16, gridY + i * cell + 33, 'right');
      for (let j = 0; j < 4; j++) {
        const link = LINKS[i].includes(j);
        rect(g, gridX + j * cell, gridY + i * cell, 51, 49, link ? C.gold : C.deep, 4, C.rail);
        text(
          g,
          link ? '1' : '0',
          gridX + j * cell + 26,
          gridY + i * cell + 34,
          23,
          link ? C.ink : C.pale,
          'Mono',
          'center',
        );
      }
    }
    text(
      g,
      ids.length + ' vertices   +   ' + ids.reduce((v, id) => v + LINKS[id].length, 0) + ' links',
      69,
      544,
      26,
      C.mint,
      'Mono',
    );
    foot(
      g,
      n === 2
        ? 'Stored adjacency order gives expected O(V + E). Sorting the neighbors adds work.'
        : 'Inspect each outgoing link of the reachable notes.',
    );
  } else {
    const found = cue(c, 3, 'right child'),
      chars = Math.floor(cue(c, 4, 'takes five steps', 1) * 5);
    label(g, 'Binary search tree · find 3', 65, 172);
    label(g, 'Trie · prefix charg', 634, 172);
    const p = [
      [284, 239],
      [143, 387],
      [433, 387],
    ];
    line(g, ...p[0], ...p[1], C.rail, 4);
    line(g, ...p[0], ...p[2], found ? C.gold : C.rail, 4);
    [2, 1, 3].forEach((v, i) => node(g, ...p[i], v, { fill: i === 2 && found ? C.gold : C.paper }));
    pathLetters(g, 658, 305, 'charg', chars, 100);
    if (n === 4 && cue(c, 4, 'read the endings'))
      text(g, prefixMatches('charg').join('   '), 641, 429, 26, C.mint, 'Serif');
    foot(
      g,
      n === 3
        ? 'Search-tree cost follows depth. A skewed tree can require a linear walk.'
        : 'Five child lookups reach charg. Enumerating descendant words adds work.',
    );
  }
}
export function trie(g, c) {
  const prefix = [...'charg'],
    count = Math.floor(cue(c, 1, 'Walk the shared prefix', 1.5) * 5);
  const branch = cue(c, 2, 'End markers identify', 1.2),
    posting = cue(c, 2, 'Its posting contains');
  const lx = 549,
    ey = 319,
    ex = 711;
  pathLetters(g, 93, ey, prefix.join(''), count, 114, 34);
  line(g, lx + 34, ey, ex - 35, ey, branch ? C.gold : C.rail, 4);
  const ends = [
    [ex, ey, 'e'],
    [918, 202, 'd'],
    [918, 436, 's'],
  ];
  for (const [x, y] of ends.slice(1)) line(g, ex, ey, x, y, branch ? C.gold : C.rail, 4);
  for (const [i, [x, y, ch]] of ends.entries()) {
    node(g, x, y, ch, { r: 36, fill: branch ? C.gold : C.paper });
    if (branch) {
      dot(g, x + 35, y - 29, 8, C.mint);
      text(
        g,
        vocabulary[i],
        x + (i ? 57 : 0),
        y + (i ? 8 : 78),
        25,
        C.cream,
        'Serif',
        i ? 'left' : 'center',
      );
    }
  }
  label(g, 'Shared prefix', 84, 184);
  if (posting) {
    const index = buildIndex();
    strip(g, 79, 458, 'charged', [...index.get('charged')], { w: 650 });
  }
  foot(
    g,
    branch
      ? 'A terminal mark ends a word. Only charged opens a posting in this corpus.'
      : 'A prefix can be a route even when it is not a complete word.',
  );
}
const labFixture = animalDocs.slice(0, 3);
export function checksForLab() {
  const docs = labFixture,
    lookup = animalSearch(docs, 'red fox');
  const cases = ['red fox', 'red', 'Red FOX', 'red red fox', 'otter', ''];
  const agrees = cases.every((q) =>
    [0, 1, 2, 5].every((k) => {
      const r = animalSearch(docs, q, k),
        sorted = [...r.scan].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k);
      return JSON.stringify(sorted.map((v) => v[0])) === JSON.stringify(r.ranked);
    }),
  );
  return [
    ['red posting', String([...lookup.postings.get('red')]) === '0,2'],
    ['empty query', !animalSearch(docs, '').ranked.length],
    ['ranked scan = index', agrees],
    ['lowercasing', String(animalSearch(docs, 'Red FOX').ranked) === '2,0'],
    ['oldest claim', [3, 4].shift() === 3],
    ['cycle ends', breadthFirstTrace().at(-1).pending.length === 0],
  ];
}
export function replayWrites(events) {
  const rows = new Map();
  for (const id of events) rows.set(id, 'embedding');
  return [...rows];
}
export function invariants(g, c) {
  const n = beat(c);
  if (n <= 2) {
    const results = checksForLab(),
      count =
        n === 1
          ? [
              'Check the red posting',
              'the empty query',
              'different result limits',
              'same two ranked IDs',
            ].filter((phrase) => cue(c, 1, phrase, 0) === 1).length
          : 4 +
            Number(cue(c, 2, 'oldest job', 0)) +
            Number(cue(c, 2, 'already discovered note', 0));
    label(g, 'Fresh Python lab  ·  documents ' + labFixture.map((_, id) => id).join(', '), 65, 147);
    for (const [i, [name, pass]] of results.entries()) {
      const x = 65 + (i % 2) * 550,
        y = 176 + Math.floor(i / 2) * 118;
      plate(g, x, y, 514, 85, true);
      text(g, name, x + 23, y + 38, 23, C.ink, 'Mono');
      const example = [
        'red → {0, 2}',
        '“” → []',
        '6 queries × 4 limits',
        'Red FOX → [2, 0]',
        '[3, 4] → 3 first',
        'M3 → M0 already seen',
      ][i];
      if (i < count) text(g, example, x + 23, y + 68, 18, C.ink, 'Mono');
      if (i < count && pass) {
        dot(g, x + 458, y + 42, 20, C.field);
        text(g, '✓', x + 458, y + 51, 24, C.mint, 'Sans', 'center');
      }
    }
    foot(g, 'Check the structure that produced the ranking and the boundaries around it.');
  } else {
    const wrote = cue(c, 3, 'writes that vector'),
      crashed = cue(c, 3, 'crashes'),
      retry = cue(c, 4, 'the retry');
    label(g, 'Indexing worker', 68, 181);
    label(g, 'Durable vector store', 697, 181);
    plate(g, 64, 208, 416, 220);
    plate(g, 686, 208, 449, 220, true);
    if (!crashed || retry) token(g, 104, 258, 'M2', 105, 59, C.gold);
    text(
      g,
      retry ? 'Retry delivered' : crashed ? 'Process stopped' : 'Working',
      97,
      377,
      29,
      crashed && !retry ? C.coral : C.cream,
      'Serif',
    );
    arrow(g, 497, 316, 657, 316, retry ? C.gold : C.rail, 4);
    const rows = replayWrites(wrote ? (retry ? [2, 2] : [2]) : []);
    if (rows.length) {
      text(g, 'M' + rows[0][0] + '   ' + rows[0][1], 723, 308, 29, C.ink, 'Mono');
      text(g, rows.length + ' stored row', 723, 378, 25, C.ink, 'Serif');
    }
    label(g, crashed ? 'Acknowledgement missing' : 'Acknowledgement pending', 64, 499);
    foot(
      g,
      retry
        ? 'The retry writes the same durable ID. Uniqueness keeps one vector.'
        : 'A write can survive a worker that crashes before acknowledging the job.',
    );
  }
}
