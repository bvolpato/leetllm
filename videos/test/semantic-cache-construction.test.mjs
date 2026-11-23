import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARTICLE_RECORD,
  answerDigest,
  exactIdentity,
  scaledCosine,
  SHADOW_ROWS,
  shadowReplay,
  servingWindow,
  reportDecision,
  freshCacheFrame,
  draw,
} from '../animations/semantic-cache.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-10),
  cue = (phase) => ({ phase, progress: phase === 'after' ? 1 : phase === 'before' ? 0 : 0.99 });
test('scaled cosine preserves direction for large finite coordinates and rejects invalid vectors', () => {
  near(scaledCosine([1e308, 1e308], [1e308, -1e308]), 0);
  near(scaledCosine([1, 0], [0.99, 0.04]), 0.9991847547814338);
  for (const pair of [
    [[], []],
    [
      [0, 0],
      [1, 0],
    ],
    [[1], [1, 0]],
    [
      [true, 1],
      [1, 0],
    ],
    [
      [Infinity, 1],
      [1, 0],
    ],
  ])
    assert.throws(() => scaledCosine(...pair));
});
test('exact identity preserves text bytes and all scope fields before hashing', () => {
  const seen = ['UserID', 'userid', 'User  ID', 'User ID'].map((s) => exactIdentity(s));
  assert.equal(new Set(seen).size, 4);
  assert.equal(seen[0], '2df0744d8b90c92ef17e41f79c3d13d8404cba6d55c9e7217cfcad5762b9f0c6');
  assert.notEqual(exactIdentity('UserID', { ...ARTICLE_RECORD.scope, release_id: 'R8' }), seen[0]);
  assert.throws(() =>
    exactIdentity('UserID', ARTICLE_RECORD.scope, { tenant_id: 'internal-admin' }),
  );
});
test('approval binds response content while evidence-ID lookup remains separate', () => {
  assert.equal(answerDigest(), '217d4084c6c63a1e44d00466ddd7544264e920295768d41f761bff03e27e182a');
  assert.notEqual(
    answerDigest({ ...ARTICLE_RECORD, response: ARTICLE_RECORD.response + '!' }),
    answerDigest(),
  );
  assert.equal(
    answerDigest({ ...ARTICLE_RECORD, admission_evidence_id: 'other-lookup' }),
    answerDigest(),
  );
  assert.notEqual(answerDigest({ ...ARTICLE_RECORD, expires_at: 4601 }), answerDigest());
});
test('proposal precision and recall retain eligibility and required-answer denominators', () => {
  const a = shadowReplay(0.99),
    b = shadowReplay(0.995),
    c = shadowReplay(0.999);
  assert.equal(a.total, 7);
  assert.equal(a.eligible, 5);
  near(a.precision, 0.8);
  near(a.recall, 1);
  near(a.proposalRate, 5 / 7);
  assert.equal(b.good.length, 4);
  near(c.recall, 0.25);
  const changed = SHADOW_ROWS.map((r) => ({ ...r, score: r.id === 'P5' ? 0.99995 : r.score }));
  for (const cutoff of [0.994, 0.995, 0.999, 0.9999]) {
    const r = shadowReplay(cutoff, changed);
    assert(r.proposals.some((r) => r.id === 'P5'));
  }
  assert.equal(shadowReplay(1).precision, null);
});
test('full-window accounting preserves shadow charges and nearest-rank mixture tails', () => {
  const large = servingWindow(10000, 5714);
  near(large.mean, 448.6);
  assert.equal(large.rank, 9500);
  assert.equal(large.p95, 1020);
  near(large.saving, 22.056);
  near(large.shadowCost, 40.8);
  const changed = servingWindow(10, 5);
  near(changed.mean, 520);
  near(changed.cost, 0.0208);
  near(changed.saving, 0.0192);
  assert.equal(changed.shadowGenerations, 10);
  assert.equal(servingWindow(100, 95).p95, 20);
  assert.equal(servingWindow(100, 94).p95, 1020);
});
test('promotion reconstructs counts and admits inclusive age and metric boundaries', () => {
  const r = {
    id: 'fixture',
    created: 6400,
    scopeCurrent: true,
    policyCurrent: true,
    lookups: 1000,
    proposals: 500,
    reviewed: 500,
    acceptable: 500,
    saving: 5,
    p95: 1050,
  };
  assert.match(reportDecision(r).decision, /^promote/);
  for (const bad of [
    { created: 6399 },
    { created: 10001 },
    { reviewed: 499 },
    { acceptable: 501 },
    { proposals: true },
    { saving: -1 },
    { saving: NaN },
    { p95: 1051 },
    { scopeCurrent: false },
  ])
    assert.equal(reportDecision({ ...r, ...bad }).decision, 'keep shadow only');
});
test('changed-release prediction preserves all identities and withholds the unresolved request outcome', () => {
  const before = { beat: 0, beatP: 0.99, cues: { 'sc-fresh-release-change': cue('before') } },
    changed = { ...before, cues: { 'sc-fresh-release-change': cue('after') } };
  assert.equal(freshCacheFrame(before).rows[5].activeRelease, 'R7');
  const f = freshCacheFrame(changed);
  assert.equal(f.rows[5].activeRelease, 'R8');
  assert.equal(f.rows[5].storedRelease, 'R7');
  assert.equal(f.rows[5].outcome, 'pending');
  assert.equal(f.resolved, false);
  const result = freshCacheFrame({ beat: 1, beatP: 0.99, cues: { 'sc-fresh-five': cue('after') } });
  assert.equal(result.rows.filter((r) => r.outcome === 'reuse').length, 5);
  assert.equal(result.meanVisible, false);
  assert.deepEqual(freshCacheFrame(changed), f);
});
test('painted fresh prediction withholds later mean, calls and prices until completed result cues', () => {
  function labels(state) {
    const out = [],
      noop = () => {};
    const api = {
      C: {
        ink: 'white',
        muted: 'gray',
        panel: 'black',
        blue: 'blue',
        cyan: 'cyan',
        green: 'green',
        pink: 'pink',
        yellow: 'yellow',
      },
      clamp: (v) => v,
      text: (_, s) => out.push(String(s)),
      line: noop,
      rect: noop,
      arrow: noop,
      circle: noop,
      components: { card: (o) => out.push(o.label) },
      teaching: {},
      focus: { target: (_, paint) => paint() },
    };
    draw({}, { id: 'fresh-population' }, state, api);
    return out;
  }
  const q = labels({ beat: 0, beatP: 0.99, cues: { 'sc-fresh-release-change': cue('after') } });
  assert(!q.some((s) => /520|0\.0208|five generation calls|Five safe hits/.test(s)));
  const ids = [
    'sc-fresh-five',
    'sc-fresh-mean',
    'sc-fresh-tail',
    'sc-fresh-cost',
    'sc-fresh-saving',
  ];
  const s = {
    beat: 1,
    beatP: 0.99,
    cues: Object.fromEntries(ids.map((id) => [id, cue('during')])),
  };
  assert(!labels(s).some((s) => /520 ms|0\.0208/.test(s)));
  s.cues['sc-fresh-mean'] = cue('after');
  assert(labels(s).some((s) => s.includes('520 ms')));
  assert(!labels(s).some((s) => s.includes('0.0208')));
  s.cues['sc-fresh-cost'] = cue('after');
  assert(labels(s).some((s) => s.includes('0.0208')));
});
