import { authorize, readAuthorizationInputs, retrieve } from './arithmetic.mjs';
import { CANDIDATES, POLICY, PRINCIPAL, RECALL_CUES } from './fixtures.mjs';
export function principalResolutionState(state = {}) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const fallback = (index) =>
    beat < index ? 0 : beat > index ? 1 : Math.max(0, Math.min(1, (p - 0.07) / 0.83));
  const reached = (id, otherwise) =>
    state.cues ? Number(Boolean(state.cues[id]) && state.cues[id].phase !== 'before') : otherwise;
  const tenant = reached('resolve-principal-b1-2', fallback(0));
  const group = reached('resolve-principal-group', fallback(0));
  return {
    tenant,
    group,
    principal: Math.min(tenant, group),
    read: reached('resolve-principal-read', fallback(1)),
    grants: reached('resolve-principal-b2-1', fallback(1)),
    inputs: readAuthorizationInputs(),
  };
}
export function recallComparison({ beat = 0, beatP = 0 } = {}) {
  const elapsed = Math.max(0, Math.min(1, beatP)) * RECALL_CUES.duration;
  const progress =
    beat < 1
      ? 0
      : beat > 1
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (elapsed - RECALL_CUES.boundedStart) /
                (RECALL_CUES.boundedComplete - RECALL_CUES.boundedStart),
            ),
          );
  const inspected = Math.floor(6 * progress + 1e-9);
  return {
    exact: retrieve(),
    topFive: retrieve(CANDIDATES, PRINCIPAL, POLICY, 5),
    bounded: retrieve(CANDIDATES, PRINCIPAL, POLICY, inspected),
    inspected,
    exactOpacity:
      beat < 1 ? 0 : beat > 1 ? 1 : Math.max(0, Math.min(1, elapsed / RECALL_CUES.exactReady)),
    boundedOpacity:
      beat < 1
        ? 0
        : beat > 1
          ? 1
          : Math.max(0, Math.min(1, (elapsed - RECALL_CUES.boundedStart) / 0.6)),
  };
}
export function filterConstructionState(beat, progress) {
  const seconds = progress * [17.642, 16.18, 16.03][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const storeOrder = [...CANDIDATES.slice(0, 5), CANDIDATES[6], CANDIDATES[5]],
    inspected = beat > 0 ? 7 : Math.min(7, Math.floor(7 * ramp(11.2875, 16.0875) + 1e-9));
  const evaluated = storeOrder.slice(0, inspected).map((record) => ({
    record,
    allowed: authorize(record),
    reason:
      record.tenant !== PRINCIPAL.tenant
        ? 'wrong tenant'
        : !PRINCIPAL.groups.includes(record.grant)
          ? 'group not granted'
          : authorize(record)
            ? 'eligible'
            : 'policy rejected',
  }));
  const eligible = evaluated.filter((x) => x.allowed).map((x) => x.record),
    handoff = beat > 1 ? 1 : beat === 1 ? ramp(0.1, 3.3) : 0,
    rank = beat > 1 ? 1 : beat === 1 ? ramp(3.7375, 7.5) : 0;
  return {
    seconds,
    storeOrder,
    inspected,
    evaluated,
    eligible,
    handoff,
    rank,
    ranked: [...eligible].sort((a, z) => z.score - a.score),
    returned: beat > 1 || (beat === 1 && seconds >= 9.2625),
  };
}
export function derivedScopeState(beat, progress) {
  const seconds = progress * [13.342, 14.908, 15.526][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const chunk = beat > 0 ? 1 : ramp(9.6375, 12.4),
    report = beat > 2 ? 1 : beat === 2 ? ramp(0.1, 3.4) : 0,
    foreignAttempt = beat === 2 && seconds >= 6.025,
    foreignDenied = beat === 2 && seconds >= 10.575;
  const local = {
      ...CANDIDATES[5],
      id: 'A:report',
      tenant: 'A',
    },
    foreign = {
      ...CANDIDATES[5],
      id: 'B:report',
      tenant: 'B',
    };
  return {
    seconds,
    chunk,
    report,
    foreignAttempt,
    foreignDenied,
    localAllowed: authorize(local),
    foreignAllowed: authorize(foreign),
  };
}
