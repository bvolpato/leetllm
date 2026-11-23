export const RELEASE_RULES = Object.freeze([
  {
    id: 'TTFT',
    key: 'p95_ttft_ms',
    window: '5m',
    max: 850,
    age: 120,
    action: 'rollback',
    unavailable: 'rollback',
  },
  {
    id: 'Grounding',
    key: 'groundedness_score',
    window: '15m',
    min: 0.82,
    age: 900,
    action: 'review',
    unavailable: 'review',
  },
  {
    id: 'Toxicity',
    key: 'toxicity_rate',
    window: '10m',
    max: 0.004,
    age: 120,
    action: 'rollback',
    unavailable: 'rollback',
  },
  {
    id: 'Completion',
    key: 'task_completion_rate',
    window: '30m',
    min: 0.91,
    age: 600,
    action: 'review',
    unavailable: 'review',
  },
]);
export class ReleaseMetricSample {
  constructor(fields) {
    Object.assign(this, fields);
  }
}
export function releaseTelemetry(rule, sample, release = 'release-a91') {
  const fail = (why) => ({
    valid: false,
    action: rule.unavailable,
    why,
  });
  if (!(sample instanceof ReleaseMetricSample)) return fail('missing / wrong record');
  if (typeof sample.value !== 'number' || !Number.isFinite(sample.value))
    return fail('value type / finite');
  if (sample.release !== release || sample.window !== rule.window) return fail('release / window');
  if (
    !Number.isInteger(sample.count) ||
    sample.count < 100 ||
    !Number.isInteger(sample.age) ||
    sample.age < 0
  )
    return fail('count / age type');
  if (sample.value < 0 || (rule.key !== 'p95_ttft_ms' && sample.value > 1))
    return fail('numeric domain');
  if (sample.age > rule.age) return fail('stale');
  const breach = rule.max !== undefined ? sample.value > rule.max : sample.value < rule.min;
  return {
    valid: true,
    action: breach ? rule.action : 'continue',
    why: breach ? 'threshold breach' : 'within rule',
  };
}
export const combineReleaseActions = (actions) =>
  actions.includes('rollback') ? 'rollback' : actions.includes('review') ? 'review' : 'continue';
export function sustainedReleaseTrace(values, limit = 850, required = 3) {
  let count = 0,
    latched = false;
  return values.map((value, index) => {
    if (!latched) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
        throw new RangeError('invalid window');
      count = value > limit ? count + 1 : 0;
      latched = count >= required;
    }
    return {
      value,
      index,
      count,
      latched,
    };
  });
}
