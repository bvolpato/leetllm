import { FEATURE_TIME_CUES } from './fixtures.mjs';
import { clamp, mix } from './arithmetic.mjs';
export const featureImpact = (progress) => {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new RangeError('feature progress must be from 0 through 1');
  const raw = [3, 4],
    normalized = normalizeReleaseVector(raw),
    weights = [0.5, 0.5],
    offline =
      progress === 0
        ? raw
        : progress === 1
          ? normalized
          : raw.map((value, index) => mix(value, normalized[index], progress)),
    score = (values) => values.reduce((total, value, index) => total + value * weights[index], 0);
  return {
    raw,
    normalized,
    weights,
    offline,
    online: raw,
    offlineScore: score(offline),
    onlineScore: score(raw),
  };
};
export const failureHistory = [
  {
    event: 9,
    available: 9 + 5 / 60,
    value: 5,
  },
  {
    event: 9,
    available: 13,
    value: 9,
  },
];
export function featureAt(hour, ttl) {
  return (
    failureHistory
      .filter((r) => r.event <= hour && r.event >= hour - ttl && r.available <= hour)
      .sort((a, b) => b.event - a.event || b.available - a.available)[0]?.value ?? null
  );
}
export function featureWindowState({ beat = 0, beatP = 0 } = {}) {
  const elapsed = clamp(beatP) * FEATURE_TIME_CUES.duration;
  const fraction =
    beat < 1
      ? 0
      : beat > 1
        ? 1
        : clamp(
            (elapsed - FEATURE_TIME_CUES.tightenStart) /
              (FEATURE_TIME_CUES.tightenEnd - FEATURE_TIME_CUES.tightenStart),
          );
  const progress = fraction * fraction * (3 - 2 * fraction);
  const ttl = mix(24, 1, progress);
  return {
    hour: 12,
    ttl,
    value: featureAt(12, ttl),
  };
}
export function normalizeReleaseVector(vector) {
  if (
    !Array.isArray(vector) ||
    !vector.length ||
    vector.some((v) => typeof v !== 'number' || !Number.isFinite(v))
  )
    throw new RangeError('finite nonempty release vector required');
  const scale = Math.max(...vector.map(Math.abs));
  if (scale === 0) throw new RangeError('zero vector has no L2 direction');
  const scaled = vector.map((v) => v / scale),
    length = Math.hypot(...scaled);
  return scaled.map((v) => v / length);
}
export function temporalReleaseJoin(rows, request, ttl) {
  if (!Number.isFinite(request) || !Number.isFinite(ttl) || ttl < 0)
    throw new RangeError('finite request and nonnegative TTL required');
  return (
    rows
      .filter((r) => r.event <= request && r.event >= request - ttl && r.available <= request)
      .sort((a, b) => b.event - a.event || b.available - a.available)[0] ?? null
  );
}
