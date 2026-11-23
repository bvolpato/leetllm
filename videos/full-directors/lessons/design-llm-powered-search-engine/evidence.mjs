import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

function document(id, revision, text, workspace = 'A') {
  return {
    id,
    revision,
    text,
    workspace,
    key: id + '@' + revision,
    digest: createHash('sha256').update(text).digest('hex'),
  };
}

export const policy = document(
  'policy',
  2,
  'Parser-v2 SDK migrations must start within 30 days after the deprecation notice.',
);
export const exception = document(
  'exception',
  1,
  'Service-account SDK migrations may start within 60 days after the notice only with security approval.',
);
export const revised = document(
  'exception',
  2,
  'Service-account SDK migrations may start within 45 days after the notice only with security approval recorded before Friday.',
);
const obsolete = document('policy', 1, 'Parser-v2 migrations may start within 90 days.');
const roadmap = document(
  'roadmap',
  1,
  'Private parser-v2 service-account SDK migration roadmap.',
  'B',
);
export const candidates = [roadmap, obsolete, policy, exception];
export const alice = { workspace: 'A', group: 'engineering' };
export const registry = Object.fromEntries(
  [roadmap, policy, exception].map((d) => [
    d.id,
    { revision: d.revision, published: true, readers: ['engineering'] },
  ]),
);
export function updated(doc, revision) {
  return { ...registry, [doc.id]: { ...registry[doc.id], revision } };
}
export function eligible(d, access = registry, user = alice) {
  const r = access[d.id];
  return Boolean(
    r?.published &&
    d.revision === r.revision &&
    d.workspace === user.workspace &&
    r.readers.includes(user.group),
  );
}
export function currentPassages(access = registry) {
  return candidates.filter((d) => eligible(d, access));
}
export const words = (s) => s.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
export function quote(d, end = d.text.length, start = 0) {
  return { key: d.key, digest: d.digest, start, end, text: d.text.slice(start, end) };
}
export function publish(pack, access = registry, currentException = exception) {
  return (
    pack.length === 2 &&
    [policy, currentException].every(
      (d) =>
        eligible(d, access) &&
        pack.some(
          (q) =>
            q.key === d.key &&
            q.digest === d.digest &&
            q.start === 0 &&
            q.end === d.text.length &&
            q.text === d.text,
        ),
    )
  );
}
export function windowFor(d, approval, day) {
  const approved = d === revised ? approval === 'Thursday' : approval === 'signed';
  const limit = Number((approved ? d : policy).text.match(/within (\d+) days/)[1]);
  return { day, limit, fits: day <= limit, approved };
}
const answerPack = [quote(policy), quote(exception)];
export const migrationAnswer = {
  sentence:
    'You normally have 30 days from the deprecation notice to start, but security approval gives your service account 60 days, so day 45 fits.',
  citations: answerPack.map((q) => `${q.key} [${q.start}, ${q.end})`).join('   ·   '),
};
export function routes(question) {
  const live = /build-|quota remaining/i.test(question);
  const policyQuestion = /policy|migration|exception/i.test(question);
  return {
    live,
    documents: policyQuestion || !live,
    current: policyQuestion || /current|latest/i.test(question),
  };
}
export const buildQuery = 'Is build-1042 running now?';
export const mixedQuery = 'Build-1042 status and the current migration exception';
export const policyQuery = 'Current parser-v2 migration policy';
export function rankingSignals() {
  const query = words('parser-v2 SDK migration policy for service-account exceptions');
  const docs = [policy, exception];
  const terms = docs.map((d) => words(d.text));
  const avg = terms.reduce((n, t) => n + t.length, 0) / docs.length;
  const lexical = terms.map((t) =>
    query.reduce((sum, word) => {
      const df = terms.filter((row) => row.includes(word)).length;
      const tf = t.filter((v) => v === word).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      return sum + (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * t.length) / avg));
    }, 0),
  );
  const cosine = [
    [1, 0.5],
    [0.5, 1],
  ].map(([x, y]) => (x + y) / (Math.sqrt(2) * Math.hypot(x, y)));
  const ordered = (scores) =>
    docs
      .map((d, i) => ({ key: d.key, score: scores[i] }))
      .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
      .map((d) => d.key);
  return { lexical: ordered(lexical), dense: ordered(cosine), cosine: cosine[0] };
}
export function fusion(lists, k = 60) {
  const rows = new Map();
  for (const list of lists) {
    [...new Set(list)].forEach((key, i) => {
      const row = rows.get(key) ?? { key, ranks: [], score: 0 };
      row.ranks.push(i + 1);
      row.score += 1 / (k + i + 1);
      rows.set(key, row);
    });
  }
  return [...rows.values()].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}
export function packWords(budget) {
  const selected = [];
  let used = 0;
  for (const d of [exception, policy]) {
    const size = words(d.text).length;
    if (used + size <= budget) {
      selected.push(quote(d));
      used += size;
    }
  }
  return { selected, used, budget, free: budget - used };
}
export const cut = exception.text.indexOf(' only');
export const fridayCut = revised.text.indexOf(' recorded');
export const supportExample = {
  claim: 'Security approval is required',
  source: 'Security approval is not required',
  paraphrase: 'Authorization from the security team is mandatory',
};
export function containsTerms(claim, source) {
  return words(claim).every((w) => words(source).includes(w));
}

const event = (id, draft, rev, accepted) => ({
  id,
  draft,
  rev,
  accepted,
  request: 'A',
  kind: 'check',
});
export const events = [
  event(3, 'd1', 1, true),
  event(6, 'd2', 2, 1),
  event(7, 'd2', 2, true),
  event(7, 'd2', 2, true),
];
export function reduce(list, access = registry) {
  let status = 'Pending',
    emitted = 0;
  const seen = new Set();
  for (const e of list) {
    if (
      !Number.isInteger(e.id) ||
      e.id < 0 ||
      !Number.isInteger(e.rev) ||
      e.rev < 0 ||
      typeof e.accepted !== 'boolean' ||
      e.request !== 'A' ||
      seen.has(e.id)
    )
      continue;
    seen.add(e.id);
    if (status !== 'Pending' || e.kind !== 'check' || e.draft !== 'd2' || e.rev !== 2) continue;
    status = e.accepted && publish(answerPack, access) ? 'Checked' : 'Blocked';
    if (status === 'Checked') emitted++;
  }
  return { status, emitted };
}
export function callbacks(fields) {
  let last = '';
  return fields.map((field) => {
    if (field !== undefined) last = field;
    return last;
  });
}
export function schedule(dependent) {
  const plan = 40,
    searchFrom = dependent ? plan : 0;
  const found = searchFrom + 260,
    ranked = found + 90,
    packed = ranked + 20;
  const token = packed + 430,
    complete = token + 100,
    checked = complete + 80;
  return {
    plan,
    searchFrom,
    found,
    ranked,
    packed,
    token,
    complete,
    checked,
    spans: [
      [0, plan],
      [searchFrom, found],
      [found, ranked],
      [ranked, packed],
      [packed, token],
      [token, complete],
      [complete, checked],
    ],
  };
}
export function capacity() {
  const rate = 600,
    waits = [0.37, 1.93, 0.2],
    lifetime = waits.reduce((a, b) => a + b);
  const resident = Math.round(rate * waits[1]),
    all = Math.round(rate * lifetime);
  const shape = [2, 32, 8, 128, 2],
    perPosition = shape.reduce((a, b) => a * b);
  const positions = 1560,
    gib = (resident * positions * perPosition) / 2 ** 30;
  const decodeRate = rate * 120;
  return {
    rate,
    waits,
    lifetime,
    resident,
    all,
    shape,
    positions,
    perPosition,
    gib,
    decodeRate,
    memory: Math.ceil(gib / 12),
    decode: Math.ceil(decodeRate / 6000),
  };
}
export function charges(moved, pending = 0) {
  const counts = [60 + moved, 30 - moved - pending, 10],
    prices = [0.97, 0.03, 0.1];
  const parts = counts.map((n, i) => n * prices[i]);
  const mean = pending ? null : parts.reduce((a, b) => a + b) / 100;
  return {
    counts,
    prices,
    parts,
    mean,
    pending,
    perMinute: pending ? null : (mean / 100) * 1000 * 60,
  };
}
export function metrics(hits, gold, k) {
  const unique = distinctTop(hits, k);
  if (!gold.length) return { recall: null, ndcg: null };
  const discounted = (i) => 1 / Math.log2(i + 2);
  const recall = unique.filter((x) => gold.includes(x)).length / gold.length;
  const ideal = gold.slice(0, k).reduce((sum, _, i) => sum + discounted(i), 0);
  return {
    recall,
    ndcg: unique.reduce((sum, x, i) => sum + (gold.includes(x) ? discounted(i) : 0), 0) / ideal,
  };
}
export function distinctTop(hits, k) {
  return [...new Set(hits)].slice(0, k);
}
export function traceAnswer(stage) {
  const retrieved = [policy.key, exception.key];
  const packed = stage === 'packing' ? [policy.key] : [...retrieved];
  const cited = stage === 'access' ? [roadmap.key] : [...packed];
  const draft =
    stage === 'packing'
      ? 'Start within 30 days.'
      : stage === 'writing'
        ? 'Service accounts get 60 days.'
        : 'Citation to workspace B';
  const repair = cited.includes(roadmap.key)
    ? 'Check access'
    : !packed.includes(exception.key)
      ? 'Repair packing'
      : 'Check claim support';
  return { retrieved, packed, cited, draft, repair };
}

export function verifyEvidence() {
  const keys = (docs) => docs.map((d) => d.key);
  assert.deepEqual(
    candidates.slice(0, 2).filter((d) => eligible(d)),
    [],
  );
  assert.deepEqual(keys(candidates.filter((d) => eligible(d)).slice(0, 2)), [
    policy.key,
    exception.key,
  ]);
  assert.deepEqual(keys(currentPassages(updated(policy, 3))), [exception.key]);
  assert.deepEqual(keys(currentPassages()), [policy.key, exception.key]);
  assert.equal(eligible(exception, {}), false);
  assert.deepEqual(routes(mixedQuery), { live: true, documents: true, current: true });
  assert.equal(routes(buildQuery).documents, false);
  assert.equal(routes(policyQuery).live, false);
  const { lexical, dense } = rankingSignals();
  assert.deepEqual(
    [lexical, dense],
    [
      [policy.key, exception.key],
      [exception.key, policy.key],
    ],
  );
  const [a, b] = fusion([[lexical[0], ...lexical], dense]);
  assert.equal(a.score, b.score);
  assert.equal(a.key, exception.key);
  assert.equal(fusion([lexical, dense, dense])[0].score.toFixed(5), '0.04892');
  assert.deepEqual(
    [
      words(exception.text).length,
      words(policy.text).length,
      cut,
      exception.text.length,
      policy.text.length,
    ],
    [15, 12, 72, 101, 80],
  );
  assert.equal(packWords(18).free, 3);
  assert.equal(publish(packWords(26).selected), false);
  const packed = packWords(27);
  assert.equal(packed.used, 27);
  assert.equal(publish(packed.selected), true);
  assert.equal(publish([quote(policy), quote(exception, cut)]), false);
  assert.equal(publish([quote(policy), quote(exception, 101, 1)]), false);
  assert.equal(publish(packed.selected, updated(policy, 3)), false);
  assert.equal(
    publish(packed.selected, { ...registry, exception: { ...registry.exception, readers: [] } }),
    false,
  );
  assert.equal(containsTerms(supportExample.claim, supportExample.source), true);
  assert.equal(containsTerms(supportExample.claim, supportExample.paraphrase), false);
  assert.deepEqual(
    events.map((_, i) => reduce(events.slice(0, i + 1)).emitted),
    [0, 0, 1, 1],
  );
  assert.deepEqual(reduce([event(5, 'd2', 2, false), events[2]]), {
    status: 'Blocked',
    emitted: 0,
  });
  assert.deepEqual(reduce(events.slice(0, 2)), { status: 'Pending', emitted: 0 });
  assert.deepEqual(reduce(events.slice(0, 3)), { status: 'Checked', emitted: 1 });
  assert.equal(reduce([events[2]], updated(policy, 3)).emitted, 0);
  assert.equal(
    reduce([events[2]], { ...registry, exception: { ...registry.exception, readers: [] } }).emitted,
    0,
  );
  assert.equal(migrationAnswer.citations, 'policy@2 [0, 80)   ·   exception@1 [0, 101)');
  assert.deepEqual(
    [...migrationAnswer.sentence.matchAll(/(\d+) days/g)].map((m) => Number(m[1])),
    [windowFor(exception, 'pending', 45).limit, windowFor(exception, 'signed', 45).limit],
  );
  assert.deepEqual(callbacks(['12', undefined, '']), ['12', '12', '']);
  assert.deepEqual(
    [
      schedule(false).token,
      schedule(false).complete,
      schedule(false).checked,
      schedule(true).token,
      schedule(true).checked,
    ],
    [800, 900, 980, 840, 1020],
  );
  const c = capacity();
  assert.deepEqual(
    [c.all, c.resident, c.perPosition, c.gib.toFixed(2), c.memory, c.decode],
    [1500, 1158, 131072, '220.52', 19, 12],
  );
  assert.deepEqual(
    [charges(0).mean.toFixed(3), charges(0).perMinute.toFixed(2), charges(10).mean.toFixed(3)],
    ['0.601', '360.60', '0.695'],
  );
  for (let moved = 0; moved <= 10; moved++) {
    const bill = charges(moved, 10 - moved);
    assert.deepEqual(bill.counts, [60 + moved, 20, 10]);
    assert.equal(bill.counts.reduce((a, b) => a + b) + bill.pending, 100);
    assert.equal(bill.mean === null, moved < 10);
  }
  const gold = keys([policy, exception]);
  assert.equal(metrics([policy.key, policy.key, 'FAQ'], gold, 2).ndcg.toFixed(4), '0.6131');
  const repeated = [policy.key, policy.key, exception.key];
  assert.deepEqual(metrics(repeated, gold, 2), { recall: 1, ndcg: 1 });
  assert.equal(metrics(repeated.slice(0, 2), gold, 2).recall, 0.5);
  assert.deepEqual(
    ['packing', 'writing', 'access'].map((s) => traceAnswer(s).repair),
    ['Repair packing', 'Check claim support', 'Check access'],
  );
  assert.equal(publish(packed.selected, updated(exception, 2), revised), false);
  assert.equal(
    publish([quote(policy), quote(revised, fridayCut)], updated(exception, 2), revised),
    false,
  );
  assert.equal(publish([quote(policy), quote(revised)], updated(exception, 2), revised), true);
  assert.deepEqual(
    [
      windowFor(exception, 'pending', 45).fits,
      windowFor(exception, 'signed', 45).fits,
      windowFor(revised, 'Friday', 40).fits,
      windowFor(revised, 'Thursday', 40).fits,
    ],
    [false, true, false, true],
  );
}
