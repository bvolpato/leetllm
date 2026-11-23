import { goal, old, syncOutcome } from './fixtures.mjs';
import { xor } from './arithmetic.mjs';
export const patch = xor(old, goal);
export const versionedPatch = {
  baseVersion: 11,
  destinationVersion: 12,
  delta: patch,
  targetBytes: goal,
};
export function applyPatch(current, instruction) {
  if (current.version === instruction.destinationVersion) {
    const matches =
      current.bytes.length === instruction.targetBytes.length &&
      current.bytes.every((value, i) => value === instruction.targetBytes[i]);
    return {
      state: current,
      applied: false,
      reason: matches ? 'already applied' : 'destination bytes mismatch',
    };
  }
  if (current.version !== instruction.baseVersion)
    return {
      state: current,
      applied: false,
      reason: 'wrong base version',
    };
  if (current.bytes.length !== instruction.delta.length)
    return {
      state: current,
      applied: false,
      reason: 'invalid patch length',
    };
  const bytes = xor(current.bytes, instruction.delta);
  if (
    bytes.length !== instruction.targetBytes.length ||
    bytes.some((value, i) => value !== instruction.targetBytes[i])
  )
    return {
      state: current,
      applied: false,
      reason: 'target bytes mismatch',
    };
  return {
    state: {
      version: instruction.destinationVersion,
      bytes,
    },
    applied: true,
    reason: 'applied',
  };
}
export function syncState(time, outcome = syncOutcome) {
  const reloadReported = time >= outcome.reload.completedAt,
    reloadSucceeded = reloadReported && outcome.reload.succeeded;
  const loaded = reloadSucceeded ? outcome.reload.loadedVersion : 11,
    versionReported = time >= outcome.verification.completedAt;
  const verified =
    reloadSucceeded &&
    versionReported &&
    outcome.verification.succeeded &&
    outcome.verification.observedVersion === outcome.expectedVersion &&
    loaded === outcome.expectedVersion;
  const ready = verified && time >= outcome.resumeAt;
  return {
    time,
    expectedVersion: outcome.expectedVersion,
    reloadReported,
    reloadSucceeded,
    loaded,
    versionReported,
    observedVersion: versionReported ? outcome.verification.observedVersion : null,
    verified,
    ready,
    paused: time >= 3 && !ready,
    published: time >= 2,
    pulled: time >= 3,
    cacheFlushed: time >= 3.6,
  };
}
export function chooseSlimeCarrier({ delta = false, disk = false, colocated = false }) {
  if (delta) return disk && !colocated ? 'delta disk' : 'reject configuration';
  if (disk) return 'full disk';
  return colocated ? 'tensor handles' : 'NCCL chunks';
}
export function drainGroups(groups, count) {
  const taken = groups.slice(0, count);
  return {
    taken,
    handedOff: [...taken].sort((a, z) => a.index - z.index),
    surplus: groups.slice(count),
  };
}
