import {
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  breakerTransition,
  finishProbe,
  recoveryObservation,
} from './model.mjs';
export function recoveryTransferWaitConstruction(state, waitProgress = 1) {
  const cue = state.cues?.['transfer-stop'];
  const joined = cue?.phase === 'after' ? Math.max(0, Math.min(1, (state.t - cue.end) / 0.42)) : 0;
  return {
    minimum: {
      x: 300,
      y: 480,
      width: 960 * waitProgress,
      height: 85,
    },
    jitter: {
      x: 300 + 960 * joined,
      y: 650 - 170 * joined,
      width: 240 * waitProgress,
      height: 85,
    },
    joined,
    showVerdict: joined === 1,
  };
}
export function introRecoverySnapshot(beat, progress) {
  return {
    sent: beat > 0 || progress >= 0.72,
    committed: beat > 1 || (beat === 1 && progress >= 0.12),
    replyLost: beat > 1 || (beat === 1 && progress >= 0.36),
    timedOut: beat > 1 || (beat === 1 && progress >= 0.55),
  };
}
export function commitDisplay(beat, progress) {
  const staged = beat > 0 || progress >= 0.18;
  const rolledBack = beat > 1 || (beat === 1 && progress >= 0.1);
  const committed = beat > 1 || (beat === 1 && progress >= 0.37);
  return {
    before: {
      pending: staged && !rolledBack ? 2 : 0,
      durable: 0,
      rolledBack,
    },
    after: {
      pending: staged && !committed ? 2 : 0,
      durable: committed ? 2 : 0,
      committed,
    },
    replyLost: beat > 1 || (beat === 1 && progress >= 0.65),
  };
}
export function breakerDisplay(beat, progress, cues) {
  const lifecycle = breakerLifecycle();
  if (beat === 0) {
    let current = {
      state: 'closed',
      generation: 1,
      failures: 0,
      threshold: 2,
      probeAvailable: false,
    };
    if (progress >= 0.25)
      current = breakerTransition(current, {
        type: 'failure',
        generation: 1,
      });
    if (progress >= 0.6)
      current = breakerTransition(current, {
        type: 'failure',
        generation: 1,
      });
    return current;
  }
  if (beat === 1) {
    let current = {
      ...lifecycle.halfOpen,
    };
    const admitted = cues?.['half-open-probe']
      ? cues['half-open-probe'].phase !== 'before'
      : progress >= 0.3;
    const healthy = cues?.['healthy-probe']
      ? cues['healthy-probe'].phase !== 'before'
      : progress >= 0.7;
    if (admitted) current = admitProbe(current, 'probe-2');
    if (healthy)
      current = finishProbe(current, {
        id: 'probe-2',
        generation: 2,
        outcome: 'success',
      });
    return {
      ...current,
      occupied: Boolean(current.inFlight),
      probe: 'probe-2',
    };
  }
  return {
    ...lifecycle.opened,
    ...breakerRace(),
    state: 'open',
    generation: 4,
  };
}
export function recoveryDisplay(beat, progress, cues) {
  const begun = (id, fallback) => (cues?.[id] ? cues[id].phase !== 'before' : fallback);
  const observed = beat > 1 || (beat === 1 && begun('current-status', progress >= 0.4));
  const reported =
    observed && (beat > 1 || (beat === 1 && begun('bounded-claim', progress >= 0.7)));
  const observation = observed ? recoveryObservation() : null;
  return {
    observation,
    claim: reported ? boundedRecoveryClaim(observation) : null,
  };
}
export function admissionDisplay(beat, progress) {
  const advance = (start, end) => Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return {
    readProposal: beat > 0 ? 1 : advance(0.04, 0.26),
    readCheck: beat > 0 ? 1 : advance(0.26, 0.55),
    readResult: beat > 0 ? 1 : advance(0.55, 0.82),
    writeProposal: beat > 1 ? 1 : beat === 1 ? advance(0.04, 0.26) : 0,
    writeCheck: beat > 1 ? 1 : beat === 1 ? advance(0.26, 0.55) : 0,
    writeResult: beat > 1 ? 1 : beat === 1 ? advance(0.55, 0.82) : 0,
    repair: advance(0.08, 0.4),
    recheck: advance(0.4, 0.75),
  };
}
