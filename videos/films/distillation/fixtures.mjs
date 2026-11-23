export const WORDS = Object.freeze(['bird', 'dog', 'cat', 'tree']);
export const TEACHER = Object.freeze([2, 1.4, 1, 0]);
export const INITIAL = Object.freeze([0.1, 0.3, 1.8, 0.5]);
export const POLICY_CASES = [
  { prompt: 'disabled prod key restore', rule: '7 days' },
  { prompt: 'expired admin restore', rule: 'not allowed' },
];
export const POLICY_REPLIES = ['7 days', 'not allowed'];
export const POLICY_TEACHER = [0.9, 0.1];
export const POLICY_STUDENT = [0.9, 0.1];
export const RELEASE_LIMITS = { accuracy: 0.9, policy: 0.01, latency: 60, monthlyCost: 20000 };
export const RELEASE_CANDIDATES = [
  { name: 'Alder', accuracy: 0.94, errors: 3, policyCases: 100, latency: 52, monthlyCost: 19000 },
  { name: 'Birch', accuracy: 0.94, errors: 1, policyCases: 100, latency: 52, monthlyCost: 19000 },
];
export const LEARNING_CUES = Object.freeze({
  updateBeatDuration: 18.6,
  predictionBeatDuration: 15.728,
  gradientAt: 8.3,
  lowerAt: 9.925,
  lowerUntil: 10.825,
});
