import { meanEmbedding } from './arithmetic.mjs';
export const FOLLOW_UP = 'What do I do now?';
export const RECOVERY_QUERY = 'How do I revoke and rotate a leaked API key?';
export const SUPPORT_PAGES = [
  { id: 'Account overview', text: 'What can I do with my account?' },
  { id: 'Recovery guide', text: 'Revoke or rotate a leaked API key.' },
];
export const INCIDENTS = [
  { id: 'INC-48219', closed: '09:18 UTC' },
  { id: 'INC-48291', closed: '14:32 UTC' },
];
export const REQUIRED_RUNBOOKS = ['burst-policy', 'queue-guide'];
export const HYDE_PROXIES = [
  [0.1, 0.8, 0.2],
  [0.5, 0.6, 0.4],
];
export const HYDE_MEAN = meanEmbedding(HYDE_PROXIES);
export const PROXY_CORPUS = [
  {
    id: 'quota-policy',
    text: 'Temporary quota increase requires approval.',
  },
  {
    id: 'batch-policy',
    text: 'Schedule offline batch jobs.',
  },
  {
    id: 'overview',
    text: 'Automatic replica scaling overview.',
  },
];
export const CRITIQUE_WEIGHTS = [0.2, 0.6, 0.2];
export const CRITIQUE_BRANCHES = [
  {
    id: 'A',
    scores: [0.92, 0.96, 0.81],
  },
  {
    id: 'B',
    scores: [0.95, 0.28, 0.88],
  },
].map((row) => ({
  ...row,
  contributions: row.scores.map((v, i) => v * CRITIQUE_WEIGHTS[i]),
  total: row.scores.reduce((sum, v, i) => sum + v * CRITIQUE_WEIGHTS[i], 0),
}));
export const LATENCY_STAGES = [
  {
    id: 'rewrite',
    ms: 120,
  },
  {
    id: 'encode',
    ms: 20,
  },
  {
    id: 'retrieve',
    ms: 25,
  },
  {
    id: 'rerank',
    ms: 50,
  },
  {
    id: 'first token',
    ms: 180,
  },
];
export const LATENCY_TRACES = Array.from(
  {
    length: 20,
  },
  (_, i) => ({
    id: i + 1,
    a: i === 18 ? 100 : 10,
    b: i === 19 ? 100 : 10,
  }),
).map((v) => ({
  ...v,
  total: v.a + v.b,
}));
export const RELEASE_ROUTES = [
  {
    id: 'baseline',
    supported: 46,
    p95: 280,
  },
  {
    id: 'rewrite',
    supported: 47,
    p95: 340,
  },
  {
    id: 'expensive',
    supported: 48,
    p95: 480,
  },
].map((v) => ({
  ...v,
  total: 50,
  accuracy: v.supported / 50,
}));
export const CORPUS = [
  {
    id: 'burst-policy',
    tenant: 'support',
    text: 'burst quota limit rate policy requests',
    authorized: true,
  },
  {
    id: 'queue-guide',
    tenant: 'support',
    text: 'queue backpressure overload load shed',
    authorized: true,
  },
  {
    id: 'capacity-guide',
    tenant: 'support',
    text: 'capacity replicas autoscaling planning',
    authorized: true,
  },
  {
    id: 'restricted-ops',
    tenant: 'admin',
    text: 'burst quota emergency override operations',
    authorized: false,
  },
];
export const VARIANTS = [
  'burst quota limit',
  'peak queue overload',
  'capacity replicas backpressure',
];
export const PROPOSALS = [
  VARIANTS[0],
  ' BURST quota limit ',
  VARIANTS[1],
  VARIANTS[2],
  'peak request traffic',
];
