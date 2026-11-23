import { fixedBudgetPlans, lifetimePlans } from './arithmetic.mjs';
import {
  LEARNING_UNKNOWN_REPORT_AT,
  baselineCases,
  candidates,
  evidence,
  expandedRules,
  heldOut,
  historyRows,
  newPhrases,
  trainingCases,
  unsafe,
} from './fixtures.mjs';
export function releaseAction(route, score, evidenceSet) {
  if (['latency', 'quality', 'access'].includes(route)) return route;
  if (route !== 'promote') return 'human_review_unknown_route';
  if (!evidenceSet.has('eval_report')) return 'request_evidence';
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1)
    return 'human_review_invalid_score';
  return score < 0.95 ? 'human_review_failed_gate' : 'promote';
}
export function exactRoute(text, rules = ['timeout', 'citation', 'password']) {
  const lower = text.toLowerCase();
  const routes = {
    timeout: 'latency',
    tokens: 'latency',
    cites: 'quality',
    citation: 'quality',
    'stale source': 'quality',
    password: 'access',
    authenticate: 'access',
  };
  return rules.find((rule) => lower.includes(rule))
    ? routes[rules.find((rule) => lower.includes(rule))]
    : 'manual_review';
}
export function ruleScores() {
  const baseline = baselineCases.filter((row) => exactRoute(row.text) === row.expected).length;
  const oldExpanded = baselineCases.filter(
    (row) => exactRoute(row.text, expandedRules) === row.expected,
  ).length;
  const freshExpanded = newPhrases.filter(
    (row) => exactRoute(row.text, expandedRules) === row.expected,
  ).length;
  return {
    baseline,
    oldExpanded,
    freshExpanded,
    baselineCases: baselineCases.map((row) => ({
      ...row,
      predicted: exactRoute(row.text),
    })),
    freshCases: newPhrases.map((row) => ({
      ...row,
      predicted: exactRoute(row.text, expandedRules),
    })),
  };
}
export function ruleGrowthState(progress) {
  const count = Math.min(4, Math.max(0, Math.ceil(progress * 4)));
  const rules = [
    'timeout',
    'citation',
    'password',
    ...['tokens', 'cites', 'stale source', 'authenticate'].slice(0, count),
  ];
  return {
    rules,
    score: baselineCases.filter((row) => exactRoute(row.text, rules) === row.expected).length,
  };
}
export function fitWordCounts(rows = trainingCases) {
  const counts = Object.fromEntries(['latency', 'quality', 'access'].map((label) => [label, {}]));
  for (const row of rows)
    for (const word of row.text.toLowerCase().match(/[a-z]+/g) ?? [])
      counts[row.label][word] = (counts[row.label][word] ?? 0) + 1;
  return counts;
}
export function scoreWords(text, counts = fitWordCounts()) {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const scores = Object.fromEntries(
    Object.entries(counts).map(([label, terms]) => [
      label,
      words.reduce((sum, word) => sum + (terms[word] ?? 0), 0),
    ]),
  );
  const top = Math.max(...Object.values(scores));
  const winners = Object.entries(scores)
    .filter(([, score]) => score === top)
    .map(([label]) => label);
  return {
    scores,
    route: top > 0 && winners.length === 1 ? winners[0] : 'manual_review',
  };
}
export function learningStates(step) {
  const correction = {
    text: 'the site loads slowly',
    label: 'latency',
  };
  const baseCounts = fitWordCounts(trainingCases);
  const activeRows = step > 1 ? [...trainingCases, correction] : trainingCases;
  const counts = fitWordCounts(activeRows);
  const before = scoreWords(correction.text, baseCounts);
  const after = scoreWords(correction.text, fitWordCounts([...trainingCases, correction]));
  const heldOutScore = heldOut.filter(
    (row) => scoreWords(row.text, counts).route === row.expected,
  ).length;
  return {
    counts,
    citationCount: counts.quality.citation,
    example: scoreWords('unsupported citation answer', counts),
    unknown: scoreWords('responses take ages', counts),
    correction,
    before,
    after,
    heldOutScore,
    step,
  };
}
export function learningConstruction(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const phase = (a, z) => Math.max(0, Math.min(1, (p - a) / (z - a)));
  const mode =
    beat === 0
      ? 'train'
      : beat === 1
        ? p < LEARNING_UNKNOWN_REPORT_AT
          ? 'score'
          : 'unknown'
        : 'correct';
  const words =
    mode === 'correct'
      ? ['the', 'site', 'loads', 'slowly']
      : mode === 'unknown'
        ? ['responses', 'take', 'ages']
        : ['unsupported', 'citation', 'answer'];
  const trained = beat === 0 ? phase(0.12, 0.78) * 3 : 3;
  const correction = beat < 2 ? 0 : phase(0.08, 0.26);
  const scoreProgress =
    mode === 'score'
      ? phase(0.04, LEARNING_UNKNOWN_REPORT_AT - 0.06) * 3
      : mode === 'correct'
        ? phase(0.27, 0.43) * 4
        : 0;
  const completed = Math.min(words.length, Math.floor(scoreProgress + 1e-9));
  const scores = {
    quality: mode === 'score' ? completed : 0,
    latency: mode === 'correct' ? completed : 0,
    access: 0,
  };
  return {
    mode,
    words,
    trained,
    correction,
    completed,
    scoreProgress,
    scores,
    route:
      mode === 'unknown' || (mode === 'correct' && correction < 1)
        ? 'manual review'
        : completed === words.length
          ? mode === 'correct'
            ? 'latency'
            : 'quality'
          : 'await word evidence',
    qualityCounts: ['unsupported', 'citation', 'answer'].map((word, i) => ({
      word,
      count: trained >= i + 1 ? 1 : 0,
      progress: Math.max(0, Math.min(1, trained - i)),
    })),
    slowlyCount: correction === 1 ? 1 : 0,
  };
}
export function verifierScore(candidate) {
  if (candidate.route !== 'quality') return -1;
  return new Set(candidate.evidence.filter((id) => evidence.has(id))).size;
}
export function searchState(step) {
  const budget = [1, 2, 4][step];
  const visible = candidates.slice(0, budget);
  const chosen = visible.reduce(
    (best, row) => (verifierScore(row) > verifierScore(best) ? row : best),
    visible[0],
  );
  return {
    step,
    budget,
    candidates: visible.map((row) => ({
      ...row,
      score: verifierScore(row),
    })),
    chosen,
    unsafeScore: verifierScore(unsafe),
  };
}
export function releaseGate(step) {
  const rows = [
    {
      score: 0.91,
      report: true,
    },
    {
      score: 0.98,
      report: true,
    },
    {
      score: 0.98,
      report: false,
    },
  ];
  const candidate = rows[step];
  return {
    ...candidate,
    decision: !candidate.report
      ? 'request report'
      : candidate.score < 0.95
        ? 'human review'
        : 'eligible for promotion',
  };
}
export function sceneSnapshot(id, step) {
  if (id === 'opening')
    return {
      step,
      issue: 'tokens arrive slowly',
      hasTimeout: false,
      cpu: [1, 8, 8][step],
      route: step < 2 ? 'manual review' : 'latency · learned evidence',
    };
  if (id === 'historical-pattern')
    return {
      step,
      rows: historyRows,
    };
  if (id === 'rulebook')
    return {
      step,
      ...ruleScores(),
    };
  if (id === 'rule-growth')
    return {
      step,
      ...ruleScores(),
      ruleCount: step === 0 ? 3 : 7,
      oldScore: step === 0 ? ruleScores().baseline : ruleScores().oldExpanded,
    };
  if (id === 'learning') return learningStates(step);
  if (id === 'search') return searchState(step);
  if (id === 'training-compute')
    return {
      step,
      plans: fixedBudgetPlans(),
    };
  if (id === 'serving-break-even')
    return {
      step,
      ...lifetimePlans(),
      q: [0, 100e9, 200e9][step],
    };
  return {
    step,
    ...releaseGate(step),
  };
}
