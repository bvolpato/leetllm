import { thresholds, track, trustedSensitiveIntake } from './fixtures.mjs';
import { batches } from './construction.mjs';
export function exampleDecision(value, broad = false) {
  return value.toLowerCase().includes(broad ? 'official' : 'official account private access')
    ? 'BLOCK'
    : 'ALLOW';
}
export function decide(values) {
  if (
    values.length !== 6 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1)
  )
    return 'REVIEW';
  return values.some((v, i) => v >= thresholds[i][1])
    ? 'BLOCK'
    : values.some((v, i) => v >= thresholds[i][0])
      ? 'REVIEW'
      : 'ALLOW';
}
export function sensitiveAdmission(request) {
  const intake = trustedSensitiveIntake[request.id];
  const admitted = Boolean(
    intake?.authenticated && intake.authorizedReview && intake.workflow === 'S3 sensitive-review',
  );
  return {
    id: request.id,
    authenticated: intake?.authenticated === true,
    workflow: intake?.workflow ?? null,
    admitted,
    modelAgreement: request.modelAgreement === true,
  };
}
export const arrivals = [0, 1, 2, 20, 27].map((at, i) => ({
  at,
  id: String.fromCharCode(65 + i),
}));
export const scheduled = batches(arrivals);
export function queue(time) {
  return time <= 20 ? Math.max(0, time) * 300 : Math.max(0, 6000 - (time - 20) * 100);
}
export function applyResult(revision, resultRevision, deadline, time) {
  return revision === resultRevision && time < deadline ? 'APPLY' : 'IGNORE STALE';
}
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  return {
    b,
    p,
    q: b ? 1 : p,
    time: b ? 20 + 60 * p : 20 * p,
    batchTime: b ? 3 + 29 * p : 3 * p,
  };
}
export function fusionResult(caption, image, signature = false) {
  if (typeof signature !== 'boolean')
    return {
      action: 'REVIEW',
      score: null,
    };
  if (signature)
    return {
      action: 'BLOCK',
      score: null,
    };
  if (
    [caption, image].some(
      (value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1,
    )
  )
    return {
      action: 'REVIEW',
      score: null,
    };
  const score = 0.45 * caption + 0.55 * image;
  return {
    action: score >= 0.65 ? 'REVIEW' : 'ALLOW',
    score,
  };
}
export function selectedLuminance(values, fps = 4, threshold = 30) {
  if (!Number.isInteger(fps) || fps < 1 || !values.every(Number.isFinite))
    throw Error('Invalid luminance fixture');
  return values.flatMap((value, index) =>
    index % fps === 0 || (index > 0 && Math.abs(value - values[index - 1]) > threshold)
      ? [index]
      : [],
  );
}
export function boundDecision(item, receipt) {
  const { revision, scope, policy, action, id } = receipt;
  if (
    !Number.isInteger(revision) ||
    revision < 0 ||
    ![scope, policy, id].every((value) => typeof value === 'string' && value.trim()) ||
    !['ALLOW', 'BLOCK'].includes(action)
  )
    return {
      status: 'INVALID',
      item,
    };
  const binding = [revision, scope, policy, action],
    prior = item.applied[id];
  if (prior)
    return {
      status: JSON.stringify(prior) === JSON.stringify(binding) ? 'DUPLICATE' : 'CONFLICT',
      item,
    };
  if (revision !== item.revision || scope !== item.scope || policy !== item.policy)
    return {
      status: 'STALE',
      item,
    };
  if (item.state !== 'PENDING')
    return {
      status: 'CLOSED',
      item,
    };
  return {
    status: 'APPLIED',
    item: {
      ...item,
      state: action === 'ALLOW' ? 'PUBLISHED' : 'BLOCKED',
      applied: {
        ...item.applied,
        [id]: binding,
      },
    },
  };
}
export function moderationPopulation(total, prevalence, recall, fpr) {
  const violations = total * prevalence,
    legitimate = total - violations;
  const tp = violations * recall,
    fp = legitimate * fpr;
  return {
    total,
    violations,
    legitimate,
    tp,
    fn: violations - tp,
    fp,
    tn: legitimate - fp,
    precision: tp / (tp + fp),
  };
}
