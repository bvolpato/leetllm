export const catalog = [
  {
    id: 'P8',
    match: 0.98,
    ok: false,
    grade: 3,
  },
  {
    id: 'P11',
    match: 0.97,
    ok: false,
    grade: 3,
  },
  {
    id: 'P5',
    match: 0.93,
    ok: true,
    grade: 3,
  },
  {
    id: 'P6',
    match: 0.86,
    ok: true,
    grade: 2,
  },
  {
    id: 'P4',
    match: 0.74,
    ok: true,
    grade: 1,
  },
];
export const ORDERING_PRODUCTS = Object.freeze([
  {
    id: 'P4',
    grade: 1,
  },
  {
    id: 'P5',
    grade: 3,
  },
  {
    id: 'P6',
    grade: 2,
  },
]);
export const rankingFeatures = {
  P4: [0.95, 0.3],
  P5: [0.85, 0.9],
  P6: [0.88, 0.6],
};
export const exposureProducts = [
  {
    id: 'P4',
    cohorts: 10,
    clicksPerCohort: 1,
  },
  {
    id: 'P5',
    cohorts: 2,
    clicksPerCohort: 3,
  },
  {
    id: 'P6',
    cohorts: 1,
    clicksPerCohort: 4,
  },
];
export const REQUIRED_GATES = [
  'candidate_recall_complete',
  'candidate_ndcg_improves',
  'ndcg_slices_at_least_0_95',
  'ranker_p95_latency_ms_at_most_20',
  'blocked_items_absent',
  'impression_schema',
  'slates_complete_and_unique',
  'fixture_requests_retained',
  'implicit_feedback_has_propensity',
  'outcome_schema',
  'outcome_event_ids_unique',
  'fixture_outcomes_retained',
  'outcomes_join_impressions',
  'outcomes_follow_impressions',
  'one_arm_per_shopper',
  'assignment_matches_hash',
  'seller_concentration_at_most_2_per_slate',
];
export const TEST_REQUESTS = [
  {
    id: 'TEST-7',
    products: [
      ['G1', 0.95, 0.35, 1],
      ['G2', 0.87, 0.85, 3],
      ['G3', 0.82, 0.65, 2],
    ],
  },
  {
    id: 'TEST-8',
    products: [
      ['H1', 0.92, 0.75, 3],
      ['H2', 0.87, 0.35, 1],
      ['H3', 0.82, 0.65, 2],
    ],
  },
];
export const EXTENDED_SCENES = new Set([
  'funnel-contract',
  'slate-recheck',
  'metric-contracts',
  'offline-gates',
  'pairwise-objective',
  'training-matrix',
  'temporal-protocol',
  'trained-model',
  'click-model',
  'propensity-contract',
  'response-lineage',
  'outcome-join',
  'experiment-contract',
  'probability-value',
  'online-guardrails',
  'receipt-boundary',
  'fresh-ranking',
]);
