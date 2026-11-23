import { pythonReleaseDigest } from './arithmetic.mjs';
export function releaseFingerprintFixture() {
  const baseline = {
      prompt: 'support@2.8',
      base: 'base@42',
      adapter: 'lora@1.9',
      serving_image: 'image@7',
      feature_view: 'releases@4',
    },
    candidate = {
      ...baseline,
      feature_view: 'releases@5',
    };
  return {
    baseline,
    candidate,
    left: pythonReleaseDigest(baseline),
    right: pythonReleaseDigest(candidate),
  };
}
export function guardedReleaseTransition(current, expected, target, auditFault = false) {
  if (current.release !== expected.release || current.generation !== expected.generation)
    return {
      committed: false,
      pointer: {
        ...current,
      },
      audit: null,
      reason: 'stale routing token',
    };
  if (auditFault)
    return {
      committed: false,
      pointer: {
        ...current,
      },
      audit: null,
      reason: 'audit error → transaction rollback',
    };
  const pointer = {
    release: target,
    generation: current.generation + 1,
  };
  return {
    committed: true,
    pointer,
    audit: {
      from: current.release,
      to: target,
      generation: pointer.generation,
    },
    reason: 'pointer + audit committed',
  };
}
