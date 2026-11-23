import {
  BYPASS_TEXT,
  CLAIMS,
  POLICY_ID,
  POLICY_TEXT,
  SLICE_OUTCOMES,
  policyClaims,
} from './fixtures.mjs';
import { clamp, completed, spoken } from './construction.mjs';
import { createHash } from 'node:crypto';
export function policyFixture(fresh = false) {
  const revision = fresh ? 'deploy-policy/2026-07-01' : 'deploy-policy/2026-06-01',
    text = fresh
      ? POLICY_TEXT + ' A maintenance-window identifier is also required before rollout.'
      : POLICY_TEXT;
  const records = {
    [POLICY_ID]: {
      id: POLICY_ID,
      parent: 'deploy-policy-v' + (fresh ? 3 : 2),
      version: revision,
      permitted: true,
      current: true,
      text,
    },
    'payment-service-rollback-runbook': {
      id: 'payment-service-rollback-runbook',
      parent: 'payment-rollback-v1',
      version: 'payment-rollback/2026-05-20',
      permitted: true,
      current: true,
      text: 'Payment-service rollback drills must keep the previous artifact available for 30 minutes. This runbook does not authorize freeze deploys.',
    },
    'frontend-docs-deploy-rule': {
      id: 'frontend-docs-deploy-rule',
      parent: 'frontend-docs-v1',
      version: 'frontend-docs/2026-03-01',
      permitted: true,
      current: true,
      text: 'Frontend documentation deploys may ship during normal business hours without freeze approval.',
    },
    'restricted-breakglass-note': {
      id: 'restricted-breakglass-note',
      parent: 'breakglass-terms',
      version: 'breakglass/2026-05-01',
      permitted: false,
      current: true,
      text: 'Payment-service deploys may bypass freeze approval during executive escalations.',
    },
  };
  const ids = ['payment-service-rollback-runbook', 'frontend-docs-deploy-rule', POLICY_ID];
  const trace = {
    caseId: 'payment-freeze-deploy-001',
    question:
      'What does DEPLOY-17 require for a payment-service production deploy during a release freeze?',
    candidates: ids,
    rerankInput: [...ids],
    reranked: [POLICY_ID, ...ids.slice(0, 2)],
    selected: [POLICY_ID],
    selectedVersions: [revision],
    versions: {
      retriever: 'policy-retriever-v2',
      index: 'policy-index/2026-06-02',
      sparse: 'bm25-tokenizer-v1',
      dense: 'fixture-embeddings-v1',
      fusion: 'rrf-k60',
      reranker: 'fixture-cross-encoder-v1',
    },
  };
  const labels = [
    ...policyClaims,
    ...(fresh
      ? [
          {
            id: 'maintenance-window',
            point: 'maintenance-window',
            text: 'A maintenance-window identifier is required before rollout.',
          },
        ]
      : []),
  ].map((v) => ({
    ...v,
    source: POLICY_ID,
    version: revision,
  }));
  const complete = labels.map((v) => ({
      id: v.id,
      text: v.text,
      citation: POLICY_ID,
    })),
    snapshot = structuredClone(records);
  return {
    records,
    snapshot,
    trace,
    expected: {
      caseId: trace.caseId,
      question: trace.question,
    },
    labels,
    complete,
    required: [...labels.map((v) => v.point)],
  };
}
export function recordDigest(record) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.keys(record)
            .sort()
            .map((key) => [key, record[key]]),
        ),
      ),
    )
    .digest('hex');
}
export function admissiblePolicy(trace, fixture = policyFixture()) {
  const { records, snapshot, expected } = fixture;
  if (
    trace.caseId !== expected.caseId ||
    trace.question !== expected.question ||
    !trace.selected?.length ||
    trace.selected.length !== trace.selectedVersions?.length
  )
    return false;
  if (
    ['retriever', 'index', 'sparse', 'dense', 'fusion', 'reranker'].some(
      (k) => typeof trace.versions?.[k] !== 'string' || !trace.versions[k].trim(),
    )
  )
    return false;
  const stages = [trace.candidates, trace.rerankInput, trace.reranked, trace.selected];
  if (stages.some((ids) => !Array.isArray(ids) || ids.length !== new Set(ids).size)) return false;
  if (
    stages
      .flat()
      .some(
        (id) =>
          !records[id] ||
          !snapshot[id] ||
          records[id].permitted !== true ||
          records[id].current !== true ||
          recordDigest(records[id]) !== recordDigest(snapshot[id]),
      )
  )
    return false;
  return (
    trace.rerankInput.every((id) => trace.candidates.includes(id)) &&
    trace.reranked.length === trace.rerankInput.length &&
    trace.reranked.every((id) => trace.rerankInput.includes(id)) &&
    trace.selected.every(
      (id, i) => trace.reranked.includes(id) && records[id].version === trace.selectedVersions[i],
    )
  );
}
export function policyEvaluation(trace, answer, fixture = policyFixture()) {
  const requiredSources = [POLICY_ID],
    coverage = (ids) =>
      requiredSources.filter((id) => ids.includes(id)).length / requiredSources.length;
  const annotation = (text) => fixture.labels.find((label) => label.text === text),
    sourceSupports = (text, id) => {
      const label = annotation(text),
        record = fixture.records[id];
      return (
        !!label &&
        !!record &&
        !!fixture.snapshot[id] &&
        label.source === id &&
        label.version === record.version &&
        recordDigest(record) === recordDigest(fixture.snapshot[id])
      );
    };
  const known = answer.every((c) => annotation(c.text) || c.text === BYPASS_TEXT),
    supported = answer.filter((c) => trace.selected.some((id) => sourceSupports(c.text, id))),
    points = new Set(supported.map((c) => annotation(c.text).point));
  const n = answer.length,
    faithfulness = n && known ? supported.length / n : null,
    citationCoverage = n
      ? answer.filter((c) => typeof c.citation === 'string' && c.citation.trim()).length / n
      : null,
    citationSupport =
      n && known
        ? answer.filter(
            (c) => trace.selected.includes(c.citation) && sourceSupports(c.text, c.citation),
          ).length / n
        : null,
    completeness = known
      ? fixture.required.filter((p) => points.has(p)).length / fixture.required.length
      : null;
  const stages = [
    ['admissibility', admissiblePolicy(trace, fixture)],
    ['candidate retrieval', coverage(trace.candidates) === 1],
    ['context selection', coverage(trace.selected) === 1],
    ['claim presence', n > 0],
    ['claim review', known],
    ['answer faithfulness', faithfulness === 1],
    ['citation support', citationSupport === 1],
    ['answer completeness', completeness === 1],
  ];
  const failed = stages.findIndex(([, pass]) => !pass),
    firstFailure = failed < 0 ? 'pass' : stages[failed][0];
  return {
    firstFailure,
    release: firstFailure === 'pass',
    stages: stages.map(([name, pass], i) => ({
      name,
      status: failed >= 0 && i > failed ? 'unscored' : pass ? 'pass' : 'fail',
    })),
    candidateRecall: coverage(trace.candidates),
    contextRecall: coverage(trace.selected),
    selectedPrecision: trace.selected.length
      ? trace.selected.filter((id) => requiredSources.includes(id)).length / trace.selected.length
      : 0,
    faithfulness,
    citationCoverage,
    citationSupport,
    completeness,
    points: [...points],
    known,
  };
}
export function policyVariants() {
  const f = policyFixture(),
    clone = (v) => structuredClone(v),
    runbook = 'payment-service-rollback-runbook';
  const miss = clone(f.trace);
  miss.candidates = miss.candidates.filter((id) => id !== POLICY_ID);
  miss.rerankInput = [...miss.candidates];
  miss.reranked = [...miss.candidates];
  miss.selected = [runbook];
  miss.selectedVersions = [f.records[runbook].version];
  const drop = clone(f.trace);
  drop.selected = [runbook];
  drop.selectedVersions = [f.records[runbook].version];
  return [
    {
      name: 'Complete',
      trace: f.trace,
      answer: f.complete,
      expected: 'pass',
    },
    {
      name: 'Bypass',
      trace: f.trace,
      answer: [
        f.complete[0],
        {
          id: 'bypass',
          text: BYPASS_TEXT,
          citation: POLICY_ID,
        },
      ],
      expected: 'answer faithfulness',
    },
    {
      name: 'Wrong citations',
      trace: f.trace,
      answer: f.complete.map((c) => ({
        ...c,
        citation: runbook,
      })),
      expected: 'citation support',
    },
    {
      name: 'Empty',
      trace: f.trace,
      answer: [],
      expected: 'claim presence',
    },
    {
      name: 'Dropped context',
      trace: drop,
      answer: f.complete,
      expected: 'context selection',
    },
    {
      name: 'Missing rollback',
      trace: f.trace,
      answer: f.complete.slice(0, 2),
      expected: 'answer completeness',
    },
    {
      name: 'Missing candidate',
      trace: miss,
      answer: f.complete,
      expected: 'candidate retrieval',
    },
  ].map((v) => ({
    ...v,
    result: policyEvaluation(v.trace, v.answer, f),
  }));
}
export function abstentionOutcome(corpus, context, response) {
  if (context && !corpus) throw Error('Sufficient context contradicts the permitted-corpus label');
  const supported = response === 'complete-supported' && context,
    bounded = response === 'bounded-abstention';
  return {
    safe: supported || bounded,
    evidencePath: !corpus || context,
    taskSuccess: supported || (!corpus && bounded),
  };
}
export function sliceGate(rows = SLICE_OUTCOMES) {
  const slices = ['freeze', 'hotfix', 'migration'].map((name) => {
    const cases = rows.filter((v) => v.slice === name);
    return {
      name,
      cases,
      k: cases.filter((v) => v.correct).length,
      n: cases.length,
      pass:
        cases.length > 0 &&
        cases.every((v) => typeof v.correct === 'boolean') &&
        100 * cases.filter((v) => v.correct).length >= 95 * cases.length,
    };
  });
  return {
    slices,
    pass: slices.every((v) => v.pass),
    overall: rows.length ? rows.filter((v) => v.correct).length / rows.length : null,
  };
}
export function policyTransferSnapshot(state) {
  const fixture = policyFixture(true),
    revealed = completed(state, 'release-answer', 1),
    citations = completed(state, 'rageval-fresh-citations', 1),
    completeness = completed(state, 'rageval-fresh-completeness', 1),
    repaired = completed(state, 'release-repair', 1),
    passed = completed(state, 'rageval-fresh-pass', 1),
    answer = fixture.complete.slice(0, repaired ? 4 : 3);
  return {
    fixture,
    answer,
    revealed,
    citations,
    completeness,
    repaired,
    passed,
    result: policyEvaluation(fixture.trace, answer, fixture),
  };
}
export function reorderPositions(progress, kind = 'vertical') {
  const p = clamp(progress),
    travel = clamp((p - 0.2) / 0.6),
    out = clamp(p / 0.2),
    back = clamp((p - 0.8) / 0.2);
  if (kind === 'vertical')
    return [
      {
        x: 710,
        y: 430 + 140 * travel,
      },
      {
        x: 710,
        y: 570 + 140 * travel,
      },
      {
        x: 710 + 575 * (out - back),
        y: 710 - 280 * travel,
      },
    ];
  return [
    {
      x: 120 + 1140 * travel,
      y: 510 + 200 * (out - back),
    },
    {
      x: 690 - 570 * travel,
      y: 510,
    },
    {
      x: 1260 - 570 * travel,
      y: 510,
    },
  ];
}
export function evidenceSnapshot(state) {
  const progress = spoken(state, 'both-sources', 1),
    candidateIds = progress >= 0.5 ? ['A', 'B', 'C'] : ['A', 'C'],
    ids = progress === 1 ? ['A', 'B', 'C'] : ['A', 'C'];
  return {
    progress,
    candidateIds,
    ids,
    candidateRecall: candidateIds.filter((id) => id !== 'C').length / 2,
    recall: ids.filter((id) => id !== 'C').length / 2,
    precision: ids.filter((id) => id !== 'C').length / ids.length,
  };
}
export function citationSnapshot(state) {
  const progress = spoken(state, 'rebind-citation', 2);
  return {
    progress,
    source: progress === 1 ? 'A' : 'B',
  };
}
export function metrics(ids, citations = ids.map((id) => CLAIMS.find((c) => c.id === id).source)) {
  const claims = ids.map((id) => CLAIMS.find((c) => c.id === id));
  const supported = claims.filter((c) => c.source);
  const points = new Set(supported.map((c) => c.point));
  return {
    faithfulness: claims.length ? supported.length / claims.length : null,
    completeness: points.size / 3,
    citationSupport: claims.length
      ? claims.filter((c, i) => c.source && c.source === citations[i]).length / claims.length
      : null,
  };
}
export function omissionSnapshot(beat, progress) {
  const ids =
    beat === 0
      ? ['closed', 'box'].slice(0, Math.floor(clamp((progress - 0.02) / 0.3) * 2 + 1e-9))
      : beat === 1
        ? ['closed', 'box']
        : progress < 0.4
          ? []
          : ['next'];
  return {
    ids,
    ...metrics(ids),
  };
}
export function aggregationSnapshot(beat, progress) {
  const cases = Array.from(
    {
      length: 10,
    },
    (_, i) => ({
      id: i < 9 ? `A${i + 1}` : 'B1',
      answer: i < 9 ? 'A' : 'B',
      supported: i < 9,
    }),
  );
  const examined =
    beat === 0 ? Math.floor(clamp((progress - 0.06) / 0.56) * cases.length + 1e-9) : cases.length;
  const observed = cases.slice(0, examined),
    supported = observed.filter((item) => item.supported).length;
  const rates =
    beat === 0
      ? []
      : beat > 1
        ? ['A', 'B']
        : ['A', 'B'].slice(0, Math.floor(clamp((progress - 0.08) / 0.42) * 2 + 1e-9));
  return {
    cases,
    observed,
    supported,
    pooled: examined ? supported / examined : null,
    rates,
    mean: rates.length === 2 ? 0.5 : null,
    emptyCase: beat === 2 && progress >= 0.3,
  };
}
