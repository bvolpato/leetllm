import { ARTICLE_RECORD, SHADOW_ROWS, answer, ids, probes, scope } from './fixtures.mjs';
import {
  canonicalPythonJson,
  cueFinished,
  hash,
  population,
  scaledCosine,
  servingWindow,
  wilsonLower,
} from './arithmetic.mjs';
import { approvedDigest, tracks } from './construction.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function select(threshold, rows = probes) {
  const selected = rows.filter((row) => row.score >= threshold),
    valid = rows.filter((row) => row.field === answer.field);
  const correct = selected.filter((row) => row.field === answer.field);
  return {
    selected,
    correct,
    precision: selected.length ? correct.length / selected.length : null,
    recall: valid.length ? correct.length / valid.length : null,
  };
}
export function check(record, requestScope, now, authorized = true, revoked = false) {
  const sameScope = Object.keys(scope).every((key) => requestScope[key] === record.scope[key]);
  const fresh = now < record.expires,
    bytes = hash(record) === approvedDigest,
    approval = !revoked && bytes;
  return {
    sameScope,
    fresh,
    bytes,
    approval,
    authorized,
    accepted: authorized && sameScope && fresh && approval,
  };
}
export function economicsState(state, step = state.beat ?? 0) {
  const seconds = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * 20.066;
  const progress = Math.max(0, Math.min(1, (seconds - 13.5125) / (16.65 - 13.5125)));
  const hits = step === 0 ? Math.min(6, Math.floor(6 * progress + 1e-9)) : 6;
  return population(hits);
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot;
  const p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.12) / 0.58));
  if (id === 'geometry') {
    const angleA = Math.acos(probes[0].score),
      angleB = Math.acos(probes[4].score);
    const angle = step === 0 ? angleA : step === 1 ? angleA + (angleB - angleA) * p : angleB;
    const vector = [Math.cos(angle), Math.sin(angle)],
      similarity = vector[0],
      distance = 1 - similarity;
    return {
      step,
      p,
      vector,
      similarity,
      distance,
      settled: step !== 1 || p === 1,
    };
  }
  if (id === 'threshold') {
    const threshold = [0.99, 0.995, 0.999][step];
    return {
      step,
      p,
      threshold,
      ...select(threshold),
    };
  }
  if (id === 'gates') {
    const requestScope = {
        ...scope,
        release: step === 1 ? 'R8' : 'R7',
      },
      now = step === 2 ? 200 : 100;
    return {
      step,
      p,
      requestScope,
      now,
      ...check(answer, requestScope, now),
    };
  }
  if (id === 'admission') {
    const record =
      step === 1
        ? {
            ...answer,
            text: 'Revoked keys remain forever.',
          }
        : answer;
    return {
      step,
      p,
      record,
      digest: hash(record),
      expected: approvedDigest,
      ...check(record, scope, 100, true, step === 2),
    };
  }
  if (id === 'economics')
    return {
      step,
      p,
      ...economicsState(state, step),
    };
  if (id === 'evidence') {
    const n = step === 0 ? 4 : 5714;
    return {
      step,
      p,
      n,
      success: n,
      lower: wilsonLower(n, n),
    };
  }
  const request = [
    {
      question: 'How long do revoked keys stay in the audit log?',
      route: 'public-policy',
      field: 'audit-retention',
    },
    {
      question: 'When are revoked keys removed from the audit log?',
      route: 'public-policy',
      field: 'audit-retention',
    },
    {
      question: 'What is the incident status now?',
      route: 'live-incident',
      field: 'incident-state',
    },
  ][id === 'synthesis' ? 1 : step];
  return {
    step,
    p,
    ...request,
    sameBytes: hash(request.question) === hash('How long do revoked keys stay in the audit log?'),
    eligible: eligible(request.route),
    compatible: request.field === answer.field,
    ...check(answer, scope, 100),
  };
}
export function eligible(route) {
  const facts = {
    'public-policy': {
      live: false,
      write: false,
      contextual: false,
    },
    'live-incident': {
      live: true,
      write: false,
      contextual: false,
    },
    'key-write': {
      live: false,
      write: true,
      contextual: false,
    },
  }[route];
  return Boolean(facts && !facts.live && !facts.write && !facts.contextual);
}
export function validateModel() {
  validateSemanticConstructions();
  assert(eligible('public-policy'));
  assert(!eligible('unknown'));
  assert(!eligible('live-incident'));
  assert(!eligible('key-write'));
  assert.deepEqual(
    [0.99, 0.995, 0.999].map((value) => select(value).selected.length),
    [5, 4, 1],
  );
  assert.equal(select(0.99).precision, 0.8);
  assert.equal(select(0.995).precision, 1);
  assert.equal(select(0.999).recall, 0.25);
  assert.equal(
    select(0.999, [
      ...probes,
      {
        id: 'exception',
        field: 'restore-key',
        score: 0.9999,
      },
    ]).precision,
    0.5,
  );
  assert(
    !check(
      answer,
      {
        ...scope,
        tenant: 'other',
      },
      100,
    ).accepted,
  );
  assert(!check(answer, scope, 100, false).accepted);
  assert(!check(answer, scope, 200).accepted);
  assert(
    !check(
      {
        ...answer,
        text: 'edited',
      },
      scope,
      100,
    ).accepted,
  );
  assert(!check(answer, scope, 100, true, true).accepted);
  assert(Math.abs(wilsonLower(4, 4) - 0.5100999795960008) < 1e-8);
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'geometry') {
          assert(Math.abs(s.vector.reduce((sum, x) => sum + x * x, 0) - 1) < 1e-12);
          assert.equal(s.distance, 1 - s.similarity);
        }
        if (id === 'economics') {
          assert.equal(s.hits + s.generations, 10);
          assert.equal(s.p95, 1020);
          assert(s.cost < s.baseline || s.hits === 0);
        }
        if (id === 'gates' || id === 'admission') assert.equal(s.accepted, beat === 0);
      }
  assert.equal(population(6).mean, 420);
  assert.equal(population(6).cost, 0.0168);
  const atCue = (seconds) =>
    economicsState({
      beat: 0,
      t: 0.4 + seconds,
    });
  assert.equal(atCue(13.5).hits, 0);
  assert.equal(atCue(13.5125).hits, 0);
  assert.equal(atCue((13.5125 + 16.65) / 2).hits, 3);
  assert.equal(atCue(16.65).hits, 6);
  assert.equal(atCue(19).hits, 6);
  assert.deepEqual(
    economicsState({
      beat: 1,
      beatP: 0,
    }),
    atCue(19),
  );
  assert.deepEqual(
    economicsState({
      beat: 2,
      beatP: 0.9,
    }),
    atCue(19),
  );
  for (let i = 0; i <= 12; i++) {
    const current = atCue(13.5125 + ((16.65 - 13.5125) * i) / 12);
    assert.deepEqual(
      current.rows.filter((row) => row.hit).map((row) => row.id),
      Array.from(
        {
          length: current.hits,
        },
        (_, i) => `R${i + 1}`,
      ),
    );
    assert.equal(current.generations, current.rows.filter((row) => !row.hit).length);
    assert.equal(current.mean, current.rows.reduce((sum, row) => sum + row.latency, 0) / 10);
    assert.equal(current.cost, 10 * 0.00008 + current.generations * 0.004);
    assert.equal(current.p95, 1020);
  }
  for (const id of ids) {
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
    assert.equal(
      sampleModel(id, {
        beat: 1,
        beatP: 1,
      }).step,
      2,
    );
  }
  return true;
}
export function answerDigest(record = ARTICLE_RECORD) {
  const { admission_evidence_id, ...bound } = record;
  return createHash('sha256').update(canonicalPythonJson(bound)).digest('hex');
}
export function exactIdentity(text, active = ARTICLE_RECORD.scope, request = {}) {
  for (const key of ['tenant_id', 'access_scope', 'locale', 'response_schema'])
    if (request[key] !== undefined && request[key] !== active[key])
      throw Error('request does not match cache scope');
  return createHash('sha256')
    .update(
      canonicalPythonJson({
        scope: active,
        text,
        route_id: request.route_id ?? 'public-policy',
      }),
    )
    .digest('hex');
}
export function shadowReplay(cutoff = 0.995, rows = SHADOW_ROWS) {
  const eligibleRows = rows.filter((r) => r.eligible),
    required = eligibleRows.filter((r) => r.correct),
    proposals = eligibleRows.filter((r) => r.score >= cutoff),
    good = proposals.filter((r) => r.correct);
  return {
    proposals,
    good,
    eligible: eligibleRows.length,
    total: rows.length,
    precision: proposals.length ? good.length / proposals.length : null,
    recall: required.length ? good.length / required.length : null,
    proposalRate: proposals.length / rows.length,
  };
}
export function reportDecision(r, now = 10000) {
  const integer = (v) => Number.isInteger(v) && v >= 0;
  if (
    !r ||
    typeof r.id !== 'string' ||
    !r.id.trim() ||
    !integer(now) ||
    !integer(r.created) ||
    r.created > now ||
    now - r.created > 3600 ||
    !r.scopeCurrent ||
    !r.policyCurrent ||
    !integer(r.lookups) ||
    !integer(r.proposals) ||
    !integer(r.reviewed) ||
    !integer(r.acceptable) ||
    !(0 < r.proposals && r.proposals <= r.lookups) ||
    r.reviewed !== r.proposals ||
    r.acceptable > r.reviewed
  )
    return {
      decision: 'keep shadow only',
      lower: null,
    };
  const lower = wilsonLower(r.acceptable, r.reviewed),
    pass =
      lower >= 0.99 &&
      Number.isFinite(r.saving) &&
      r.saving >= 5 &&
      Number.isFinite(r.p95) &&
      r.p95 >= 0 &&
      r.p95 <= 1050;
  return {
    decision: pass ? 'promote public-policy semantic cache' : 'keep shadow only',
    lower,
  };
}
export function freshCacheFrame(state) {
  const b = state.beat ?? 0,
    known = (beat, id) => b > beat || (b === beat && cueFinished(state, id)),
    changed = known(0, 'sc-fresh-release-change'),
    resolved = known(1, 'sc-fresh-five'),
    result = servingWindow(10, 5);
  return {
    changed,
    resolved,
    rows: Array.from(
      {
        length: 10,
      },
      (_, i) => ({
        id: 'R' + (i + 1),
        activeRelease: i === 5 && changed ? 'R8' : 'R7',
        storedRelease: 'R7',
        outcome:
          i === 5 && changed && !resolved
            ? 'pending'
            : i < 5 || (i === 5 && !changed)
              ? 'reuse'
              : 'generate',
      }),
    ),
    result,
    meanVisible: known(1, 'sc-fresh-mean'),
    tailVisible: known(1, 'sc-fresh-tail'),
    costVisible: known(1, 'sc-fresh-cost'),
    savingVisible: known(1, 'sc-fresh-saving'),
  };
}
export function validateSemanticConstructions() {
  assert.equal(answerDigest(), '217d4084c6c63a1e44d00466ddd7544264e920295768d41f761bff03e27e182a');
  assert.equal(
    exactIdentity('UserID'),
    '2df0744d8b90c92ef17e41f79c3d13d8404cba6d55c9e7217cfcad5762b9f0c6',
  );
  assert(Math.abs(scaledCosine([1e308, 1e308], [1e308, -1e308])) < 1e-12);
  assert.deepEqual(
    [0.99, 0.995, 0.999].map((c) => shadowReplay(c).proposals.length),
    [5, 4, 1],
  );
  assert.equal(servingWindow(10000, 5714).mean, 448.6);
  assert.equal(servingWindow(10, 5).cost, 0.0208);
  assert.equal(
    freshCacheFrame({
      beat: 0,
      beatP: 0.99,
      cues: {},
    }).resolved,
    false,
  );
  return true;
}
