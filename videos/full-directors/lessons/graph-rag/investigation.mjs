import assert from 'node:assert/strict';
import {
  incidentQuery,
  incidentNotes,
  lexicalRows,
  incidentSelection,
} from '../../../films/graph-rag/incident-example.mjs';
import { CLUSTER_EDGES } from '../../../films/graph-rag/fixtures.mjs';
import { modularityTerms } from '../../../films/graph-rag/model.mjs';
import {
  dependsOn,
  usesPolicy,
  forecast,
  sourceSentence,
  traceIncident,
} from './incident-path.mjs';
import {
  C,
  txt,
  box,
  line,
  disc,
  arrow,
  paper,
  on,
  mark,
  cut,
  base,
  foot,
  slip,
  node,
} from './print.mjs';

const [dependency, policy, breach] = incidentNotes;
const sentence = (n) => n.text.split('. ')[0].replace(/\.$/, '') + '.';
const normalized = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const scopedKey = (name, environment, tenant) =>
  [tenant, environment, 'Datastore', normalized(name)].join('/');
export function extract(c, k) {
  const b = k.beat.beatIndex + 1;
  base(
    c,
    b <= 3
      ? 'Which relationship does this sentence support?'
      : b <= 5
        ? 'Which cache records can we merge?'
        : 'What evidence comes from sharing a text unit?',
    'INCIDENT ARCHIVE   /   EXTRACTION',
    C.slate,
  );
  if (b <= 3) {
    const hypothetical = b === 2 && cut(k, 2, 'might depend on');
    slip(
      c,
      51,
      172,
      1098,
      126,
      hypothetical ? 'HYPOTHETICAL WORDING' : 'NOTE 1842   /   US-EAST-1',
      [hypothetical ? 'inference-api might depend on redis-cache.' : sentence(dependency)],
      { size: 35 },
    );
    node(c, 203, 409, 'inference-api', { w: 244 });
    node(c, 997, 409, 'redis-cache', { w: 243 });
    arrow(c, 327, 409, 869, 409, C.yellow, mark(k, 1, 'extractor proposes', 0.9));
    txt(c, hypothetical ? 'might depend on' : 'depends on', 602, 386, 32, {
      align: 'center',
      color: C.light,
      family: 'Serif',
    });
    txt(c, hypothetical ? 'retain uncertainty' : 'source 1842', 602, 451, 22, {
      align: 'center',
      color: C.ice,
    });
    foot(
      c,
      b === 3
        ? 'Text units   →   extracted records   →   merged graph   →   communities   →   reports and embeddings'
        : 'Source ID comes from the record the extractor read.',
      true,
    );
  } else if (b <= 5) {
    const scoped = cut(k, 5, 'same tenant and environment');
    const rows = [
      ['Redis Cache', 'prod', 'A'],
      ['redis cache', 'prod', 'A'],
      ['Redis Cache', 'test', 'A'],
      ['Redis Cache', 'prod', 'B'],
    ];
    const norm = mark(k, 4, 'normalizes case and spaces', 0.8);
    rows.forEach(([name, env, tenant], i) => {
      const y = 175 + i * 86,
        match = scopedKey(name, env, tenant) === scopedKey(...rows[0]);
      paper(c, 53, y, 504, 65);
      txt(c, name, 69, y + 43, 29, { family: 'Serif' });
      txt(c, env + ' / tenant ' + tenant, 332, y + 41, 21, { color: C.dim });
      on(c, i < 2 ? norm : scoped, () => {
        arrow(c, 564, y + 32, 679, y + 32, '#9cb9a9');
        txt(
          c,
          scoped ? (match ? 'Same scoped identity' : 'Separate identity') : normalized(name),
          696,
          y + 43,
          28,
          { color: match ? '#bbdbc8' : '#efc7a8' },
        );
      });
    });
    foot(
      c,
      'Canonical title + type within a tenant and environment. Keep dates and sources for conflicts.',
      true,
    );
  } else {
    slip(c, 57, 180, 1082, 120, 'TEXT UNIT', ['cache timeout during migration'], { size: 37 });
    node(c, 268, 408, 'cache timeout', { w: 255 });
    node(c, 932, 408, 'migration', { w: 250 });
    on(c, mark(k, 6, 'link noun phrases'), () => {
      line(c, 398, 408, 805, 408, C.yellow, 4);
      txt(c, 'co-occurs with', 601, 384, 29, { color: C.light, align: 'center' });
    });
    foot(
      c,
      b === 8
        ? 'FastGraphRAG still uses a model for reports. Tables can store its artifacts.'
        : b === 7
          ? 'Inspect common-noun hubs and review what the filter removes. Causation needs more evidence.'
          : 'The exact-text fixture uses reviewed outputs and supplied weights. Changed text goes to review.',
      true,
    );
  }
}

const firstHop = 'follow its dependency';
const secondHop = 'From the cache, follow the policy link';
const policyResult = 'Note twenty thirty-one completes the set';

function afterPhrase(k, beat, phrase, captionStart = false) {
  const b = k.beat.beatIndex + 1;
  if (b !== beat) return b > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: captionStart ? phrase : false }) === 1;
}

function walkState(k, policyFound) {
  const policySeed = cut(k, 4, 'Start at the policy') && !cut(k, 4, 'Return to the service');
  const missing = cut(k, 4, 'Remove only the policy link') && !cut(k, 5, 'Restore the policy link');
  const proposed = cut(k, 5, 'Replace the policy edge');
  const replayed = afterPhrase(k, 5, 'One hop now adds that note to the two lexical hits');
  const depth = proposed ? Number(replayed) : policyFound ? 2 : Number(cut(k, 3, firstHop));
  return traceIncident(
    policySeed ? usesPolicy.to : dependsOn.from,
    proposed ? forecast : missing ? null : usesPolicy,
    depth,
    !cut(k, 9, 'withdraw this reader'),
  );
}

function hopReceipt(c, x, label, state, active) {
  txt(c, label, x, 482, 23, { align: 'center', color: active ? C.yellow : C.ice });
  txt(c, state, x, 511, 20, { align: 'center', color: C.ice });
}

export function incident(c, k) {
  const b = k.beat.beatIndex + 1;
  const policyFound = afterPhrase(k, 4, policyResult, true);
  const s = walkState(k, policyFound),
    ranked = cut(k, 2, 'cache policy drops out');
  const proposed = s.secondEdge === forecast;
  base(
    c,
    b < 3
      ? 'Which note falls outside the top two?'
      : !s.readPolicy
        ? 'What leaves context when access changes?'
        : proposed
          ? 'Does this path support a forecast?'
          : 'Which source does the walk add?',
    'INCIDENT ARCHIVE   /   THREE-NOTE LAB',
    C.slate,
  );
  const sorted = [...lexicalRows].sort((a, z) => z.matches.length - a.matches.length);
  const policySource = usesPolicy.source;
  const coverage = s.selected.size + ' / ' + sorted.length;
  txt(c, 'Query    ' + incidentQuery, 54, 167, 23, { color: C.ice, family: 'Mono' });
  if (b >= 3)
    txt(c, coverage + ' relevant notes in context', 1143, 167, 23, {
      align: 'right',
      color: '#b8d9bb',
    });
  sorted.forEach((r, i) => {
    const x = 55 + 369 * i,
      admitted = s.selected.has(r.id),
      revoked = r.id === policySource && !s.readPolicy;
    paper(c, x, 191, 350, 136, revoked ? '#d7c7bf' : admitted && ranked ? C.mint : C.light);
    txt(c, '#' + r.id, x + 15, 222, 21, { color: C.blue, family: 'Mono' });
    txt(c, revoked ? 'Access withdrawn' : r.topic, x + 15, 263, 31, { family: 'Serif', w: 317 });
    txt(
      c,
      revoked
        ? 'Outside context'
        : r.matches.length + ' matches   •   ' + (r.matches.join(', ') || 'none'),
      x + 15,
      302,
      19,
      { w: 321, color: C.dim },
    );
  });
  if (b <= 2) {
    txt(
      c,
      ranked ? coverage + ' annotated notes' : 'Select two notes by distinct query terms.',
      600,
      432,
      46,
      { align: 'center', color: C.light, family: 'Serif' },
    );
    foot(
      c,
      ranked
        ? '3155 and 1842 enter context. The policy note shares no query terms.'
        : 'The test author marked all three notes as relevant.',
      true,
    );
    return;
  }
  const [serviceX, cacheX, targetX] = [155, 574, 1010];
  const graphY = 414;
  const atPolicy = s.seed === usesPolicy.to;
  const first = proposed
    ? Number(s.traversed.has(dependsOn.source))
    : atPolicy
      ? 0
      : mark(k, 3, firstHop, 0.8);
  const added = s.traversed.has(policySource);
  node(c, serviceX, graphY, dependsOn.from, { w: 207, fill: atPolicy ? C.light : C.mint });
  node(c, cacheX, graphY, dependsOn.to, { w: 209 });
  txt(c, 'START', atPolicy ? targetX : serviceX, 369, 19, {
    align: 'center',
    color: C.ice,
    bold: true,
  });
  arrow(c, 262, graphY, 465, graphY, '#819b9e');
  arrow(c, 262, graphY, 465, graphY, C.yellow, first, 4);
  txt(c, dependsOn.relation, 363, 391, 23, { align: 'center', color: C.ice });

  if (!proposed) {
    node(c, targetX, graphY, usesPolicy.to, { w: 238, fill: atPolicy ? C.mint : C.light });
    const second = atPolicy ? 0 : mark(k, 3, secondHop, 1.15);
    if (first === 1) hopReceipt(c, 363, 'Hop 1 · #' + dependsOn.source, 'Already in context', true);
    if (s.secondEdge) {
      arrow(c, 682, graphY, 887, graphY, '#819b9e');
      arrow(c, 682, graphY, 887, graphY, C.yellow, second, 4);
      txt(c, usesPolicy.relation, 784, 391, 23, { align: 'center', color: C.ice });
      if (second === 1 || policyFound)
        hopReceipt(
          c,
          784,
          'Hop 2 · ' + (policyFound ? '#' + policySource : 'Source ?'),
          added ? 'Added to context' : atPolicy ? 'Not reached' : 'Which note does this add?',
          second > 0,
        );
    }
    foot(
      c,
      atPolicy
        ? 'No arrow leads out of the policy. Only the two lexical hits remain.'
        : !s.secondEdge
          ? 'The walk still reaches Redis. Without the second link, #' + policySource + ' drops out.'
          : added && cut(k, 4, 'The old policy')
            ? 'The old policy is still in use. A compatibility test is blocking the migration.'
            : 'Keep the two lexical hits while following the directed links.',
      true,
    );
    return;
  }

  if (!s.readPolicy) {
    paper(c, 54, 476, 1089, 74, C.pink);
    txt(c, 'Dependent report withheld with its source', 73, 523, 26, { color: C.red });
    foot(c, 'The other two notes stay in context.', true);
    return;
  }

  const reviewed = afterPhrase(k, 6, 'the stored hash and quotation still match');
  const read = reviewed && cut(k, 6, 'Read that quotation');
  const withheld = afterPhrase(k, 7, 'Leave the forecast open', true);
  const color = withheld ? '#efb19b' : C.yellow;
  const shortcutY = 477;
  node(c, targetX, graphY, forecast.to + '?', { w: 238 });
  line(c, serviceX, graphY + 27, serviceX, shortcutY, color, 3);
  line(c, serviceX, shortcutY, targetX, shortcutY, color, 3);
  arrow(c, targetX, shortcutY, targetX, graphY + 27, color);
  txt(c, 'Proposed: ' + forecast.relation + ' · #' + forecast.source, 602, shortcutY - 9, 23, {
    align: 'center',
    color,
  });
  if (read) {
    paper(c, 54, 490, 1089, 63);
    txt(c, 'NOTE #' + forecast.source + '  /  SOURCE CHECKS PASSED', 70, 512, 17, {
      color: C.teal,
      bold: true,
    });
    txt(c, sourceSentence(forecast), 70, 540, 24, { family: 'Serif', w: 775 });
    if (withheld) {
      box(c, 876, 498, 253, 47, C.red);
      txt(c, 'Forecast unsupported', 1002, 529, 22, { align: 'center', color: C.white });
    }
  } else {
    txt(
      c,
      reviewed
        ? 'Source checks passed.'
        : b >= 6
          ? 'Checking access, source version and quotation…'
          : added
            ? 'One hop returned the same note.'
            : 'Replay from the same service.',
      55,
      527,
      23,
      { color: C.ice },
    );
  }
  foot(
    c,
    cut(k, 7, 'To test a causal role')
      ? 'To test cause, compare policy settings under the same release and load.'
      : withheld
        ? 'The note documents policy use.'
        : read
          ? 'Would you use this quotation to predict another breach?'
          : 'The proposal links the service directly to a future breach.',
    true,
  );
}

const groups = [
  ['A', 'B', 'C', 'D'],
  ['E', 'F'],
];
const points = {
  A: [82, 55],
  B: [260, 55],
  C: [260, 186],
  D: [82, 186],
  E: [421, 55],
  F: [421, 186],
};
const degrees = Object.fromEntries(
  Object.keys(points).map((id) => [id, CLUSTER_EDGES.filter((p) => p.includes(id)).length]),
);
const labels = CLUSTER_EDGES.map((_, i) => 'R' + (i + 1));
const evaluationReceipt = { endpoints: ['E', 'F'], text: 'The evaluation run records a metric.' };
const scoredGroups = (groups) =>
  modularityTerms(groups, CLUSTER_EDGES).reduce((sum, t) => sum + t.contribution, 0);
function graph(c, ox, oy, directed, combined, showDegree, outlines) {
  c.save();
  c.translate(ox, oy);
  if (outlines) {
    c.strokeStyle = combined ? C.blue : C.teal;
    c.lineWidth = 3;
    c.strokeRect(31, 8, combined ? 443 : 280, 228);
    if (!combined) {
      c.strokeStyle = C.ochre;
      c.strokeRect(375, 8, 98, 228);
    }
  }
  for (const [i, [u, v]] of CLUSTER_EDGES.entries()) {
    const [x, y] = points[u],
      [ex, ey] = points[v],
      d = Math.hypot(ex - x, ey - y),
      dx = (ex - x) / d,
      dy = (ey - y) / d;
    const a = [x + 24 * dx, y + 24 * dy, ex - 24 * dx, ey - 24 * dy];
    if (directed) {
      arrow(c, ...a, C.dim, 1, 2.5);
      const lx = (x + ex) / 2 + dy * 20,
        ly = (y + ey) / 2 - dx * 15 + 4;
      txt(c, labels[i], lx, ly, 16, { align: 'center', color: C.blue });
    } else line(c, ...a, C.ink, 2.5);
  }
  for (const [id, [x, y]] of Object.entries(points)) {
    disc(
      c,
      x,
      y,
      22,
      directed ? C.light : combined ? C.ice : groups[0].includes(id) ? C.mint : '#fde6ab',
      C.ink,
    );
    txt(c, showDegree ? degrees[id] : id, x, y + 8, 23, { align: 'center' });
  }
  c.restore();
}
export function communities(c, k) {
  const b = k.beat.beatIndex + 1,
    one = cut(k, 6, 'Join the two outlines');
  if (b <= 8) {
    base(
      c,
      'How much structure does this partition capture?',
      'CLUSTERING   /   SAME SIX RELATIONSHIPS',
    );
    txt(c, 'Directed source index', 72, 184, 30, { family: 'Serif' });
    txt(c, 'Undirected clustering view', 624, 184, 30, { family: 'Serif' });
    paper(c, 52, 204, 520, 252);
    paper(c, 616, 204, 530, 252);
    graph(c, 64, 204, true, false, false, false);
    on(c, mark(k, 1, 'second view', 0.65), () =>
      graph(c, 623, 204, false, one, !!cut(k, 2, 'degree'), true),
    );
    const terms = modularityTerms(one ? [groups.flat()] : groups, CLUSTER_EDGES);
    if (b === 7 && cut(k, 7, 'Open the receipt')) {
      txt(
        c,
        labels[
          CLUSTER_EDGES.findIndex((pair) => pair.join() === evaluationReceipt.endpoints.join())
        ] +
          '   “' +
          evaluationReceipt.text +
          '”',
        63,
        512,
        33,
        { family: 'Serif' },
      );
      foot(
        c,
        'E = evaluation run   •   F = metric   •   The directed record supplies the meaning.',
      );
    } else if (b === 8) {
      txt(c, 'Two hand-scored candidates', 65, 505, 27, { family: 'Serif' });
      txt(
        c,
        'Two groups: ' +
          scoredGroups(groups).toFixed(3) +
          '     One group: ' +
          scoredGroups([groups.flat()]),
        620,
        505,
        27,
        { family: 'Serif' },
      );
      foot(
        c,
        'Leiden searches and refines communities. Connectedness and the score describe graph structure.',
      );
    } else if (b >= 3) {
      const spelled = one
        ? 'All: 6/6 − (12/12)²'
        : terms
            .map(
              (t, i) => (i ? 'Eval: ' : 'Cache: ') + t.internal + '/6 − (' + t.degreeSum + '/12)²',
            )
            .join('       ');
      txt(c, spelled, 62, 503, 29, { family: 'Serif', w: 810 });
      const result = one ? cut(k, 6, 'The directed sources') : cut(k, 5, 'What would happen');
      if (result) {
        const q = terms.reduce((sum, t) => sum + t.contribution, 0);
        txt(c, 'Q = ' + (one ? q : q.toFixed(3)), 1137, 506, 37, {
          color: C.teal,
          align: 'right',
          family: 'Serif',
        });
      } else if (!one && cut(k, 4, 'In the little eval group'))
        txt(
          c,
          cut(k, 4, 'The two groups contribute') ? '5/36 per group' : 'Cache: 5/36',
          1137,
          506,
          26,
          {
            align: 'right',
            color: C.teal,
          },
        );
      foot(
        c,
        'Simple, unweighted, undirected view   •   m = 6 > 0   •   resolution = 1   •   Q = Σ [e/m − (K/2m)²]',
      );
    } else {
      txt(c, 'Each arrow retains its source receipt.', 66, 506, 24, { color: C.dim });
      txt(
        c,
        cut(k, 2, 'degree')
          ? 'Labels show degree. Six lines have twelve ends.'
          : 'Same pairs, each with weight one.',
        631,
        506,
        24,
        { color: C.dim, w: 507 },
      );
      foot(
        c,
        cut(k, 2, 'The little pair on the right')
          ? 'A largest-component filter would leave the small E–F pair outside the grouping input.'
          : 'Compare the same six endpoints before and after projection.',
      );
    }
  } else {
    base(
      c,
      'How do communities become reports?',
      'INDEX CONSTRUCTION   /   HIERARCHICAL SUBDIVISION',
    );
    const positions = {
      Serving: [206, 221],
      Eval: [578, 221],
      Cache: [139, 347],
      Queue: [358, 347],
      Metric: [592, 347],
      Small: [84, 485],
      Large: [251, 485],
    };
    for (const [a, z] of [
      ['Serving', 'Cache'],
      ['Serving', 'Queue'],
      ['Eval', 'Metric'],
      ['Cache', 'Small'],
      ['Cache', 'Large'],
    ]) {
      const [x, y] = positions[a],
        [ex, ey] = positions[z];
      line(c, x, y + 22, ex, ey - 23, C.teal, 3);
    }
    for (const [id, [x, y]] of Object.entries(positions))
      node(c, x, y, id, { w: id === 'Small' || id === 'Large' ? 115 : 139 });
    if (b === 10)
      slip(
        c,
        728,
        194,
        417,
        310,
        'COMMUNITY REPORT',
        ['Cache behavior', 'Source-linked finding:', 'API depends on Redis.', 'Record 1842'],
        { size: 29 },
      );
    if (b === 9) {
      txt(c, 'Level 0', 745, 233, 27, { color: C.blue });
      txt(c, 'First subdivision', 745, 357, 27, { color: C.blue });
      txt(c, 'Cache splits again', 745, 495, 27, { color: C.blue });
    }
    if (cut(k, 10, 'model-rated impact'))
      txt(c, 'Impact scale   0–10', 750, 465, 24, { color: C.teal });
    foot(
      c,
      b === 9
        ? 'Two roots, unequal branch depths. Recursion splits large groups toward a size limit.'
        : 'Check the referenced finding. Impact, query relevance and frequency answer different questions.',
    );
  }
}

export function checkInvestigation() {
  for (const [seed, secondEdge, depth, access, hops, ids] of [
    [dependsOn.from, usesPolicy, 1, true, [1842], [3155, 1842]],
    [dependsOn.from, usesPolicy, 2, true, [1842, 2031], [3155, 1842, 2031]],
    [usesPolicy.to, usesPolicy, 2, true, [], [3155, 1842]],
    [dependsOn.from, null, 2, true, [1842], [3155, 1842]],
    [dependsOn.from, forecast, 1, true, [1842, 2031], [3155, 1842, 2031]],
    [dependsOn.from, forecast, 1, false, [1842], [3155, 1842]],
  ]) {
    const state = traceIncident(seed, secondEdge, depth, access);
    assert.deepEqual([...state.traversed], hops);
    assert.deepEqual([...state.selected], ids);
  }
  assert.equal(sourceSentence(dependsOn), 'inference-api depends on redis-cache.');
  assert.equal(
    sourceSentence(usesPolicy),
    'redis-cache in us-east-1 still uses the old maxmemory policy.',
  );
  assert.equal(sentence(dependency), 'inference-api depends on redis-cache.');
  assert.equal(scopedKey('Redis  Cache', 'prod', 'A'), scopedKey(' redis cache ', 'prod', 'A'));
  assert.notEqual(scopedKey('redis-cache', 'prod', 'A'), scopedKey('redis cache', 'prod', 'A'));
  assert.deepEqual(
    lexicalRows.map((r) => r.matches.length),
    [2, 0, 3],
  );
  for (const [opts, ids] of [
    [{}, [3155, 1842]],
    [{ hops: 2 }, [3155, 1842, 2031]],
    [{ hops: 1, changedClaim: true }, [3155, 1842, 2031]],
    [{ hops: 1, changedClaim: true, readPolicy: false }, [3155, 1842]],
  ]) {
    assert.deepEqual([...incidentSelection(opts)], ids);
  }
  assert(policy.text.includes('old maxmemory policy'));
  assert(breach.text.includes('Rollback restored latency'));
  const terms = modularityTerms(groups, CLUSTER_EDGES);
  assert.deepEqual(
    terms.map((t) => [t.internal, t.degreeSum]),
    [
      [5, 10],
      [1, 2],
    ],
  );
  assert(Math.abs(terms.reduce((s, t) => s + t.contribution, 0) - 5 / 18) < 1e-10);
  assert.equal(modularityTerms([groups.flat()], CLUSTER_EDGES)[0].contribution, 0);
}
