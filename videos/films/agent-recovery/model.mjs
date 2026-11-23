import { fullJitter } from './arithmetic.mjs';
import { DEADLINE, PAGE_SEQUENCE, RETRY_AFTER, RETRY_FRACTIONS } from './fixtures.mjs';
export function retrySchedule(respectRetryAfter = false) {
  let elapsed = 0;
  return RETRY_FRACTIONS.map((fraction, index) => {
    const sample = fullJitter(index + 1, fraction);
    const wait = sample.wait + (respectRetryAfter ? RETRY_AFTER : 0);
    const elapsedBefore = elapsed;
    const elapsedAfter = elapsedBefore + wait;
    const admitted = elapsedAfter <= DEADLINE;
    if (admitted) elapsed = elapsedAfter;
    return {
      attempt: index + 1,
      cap: sample.cap,
      jitter: sample.wait,
      floor: respectRetryAfter ? RETRY_AFTER : 0,
      wait,
      elapsedBefore,
      elapsedAfter,
      admitted,
    };
  });
}
export function dispatchOperation(database, key, payload, fault) {
  const prior = database.operations.get(key);
  if (prior) {
    if (JSON.stringify(prior.payload) !== JSON.stringify(payload))
      return {
        reply: 'conflict',
        job: null,
      };
    return {
      reply: 'replayed',
      job: prior.job,
    };
  }
  const staged = {
    key,
    payload: structuredClone(payload),
    job: `job-${database.jobs.size + 1}`,
  };
  if (fault === 'before-commit')
    return {
      reply: 'error',
      job: null,
    };
  database.operations.set(key, staged);
  database.jobs.set(staged.job, {
    state: 'queued',
    operationKey: key,
    payload: staged.payload,
  });
  if (fault === 'after-commit')
    return {
      reply: 'lost',
      job: null,
    };
  return {
    reply: 'accepted',
    job: staged.job,
  };
}
export function commitScenario(fault) {
  if (!['before-commit', 'after-commit', 'normal'].includes(fault))
    throw new Error(`Unknown fault point: ${fault}`);
  const database = {
    operations: new Map(),
    jobs: new Map(),
  };
  const key = 'rb-842-1',
    payload = {
      run: 'RUN-842',
      revision: 'rev-17',
    };
  const first = dispatchOperation(database, key, payload, fault);
  const replay =
    fault === 'after-commit' ? dispatchOperation(database, key, payload, 'normal') : null;
  const changed =
    fault === 'after-commit'
      ? dispatchOperation(
          database,
          key,
          {
            run: 'RUN-842',
            revision: 'rev-18',
          },
          'normal',
        )
      : null;
  const entry = database.operations.get(key);
  const job = entry ? database.jobs.get(entry.job) : null;
  return {
    ledger: entry?.key ?? null,
    job: job
      ? {
          id: entry.job,
          state: job.state,
        }
      : null,
    reply: first.reply,
    replay: replay?.job ?? null,
    changedPayload: changed?.reply ?? null,
    operationCount: database.operations.size,
    jobCount: database.jobs.size,
  };
}
export function progressSequence(pageIds = PAGE_SEQUENCE, hardLimit = 8, allowance = 2) {
  const seen = new Set();
  let noProgress = 0;
  let remaining = hardLimit;
  return pageIds.map((page, index) => {
    const gainedEvidence = !seen.has(page);
    noProgress = gainedEvidence ? 0 : noProgress + 1;
    remaining -= 1;
    seen.add(page);
    return {
      call: index + 1,
      page,
      gainedEvidence,
      noProgress,
      allowance,
      remaining,
    };
  });
}
export function breakerTransition(state, event) {
  if (event.type === 'failure' && event.generation === state.generation) {
    const failures = state.failures + 1;
    return failures >= state.threshold
      ? {
          ...state,
          state: 'open',
          generation: state.generation + 1,
          failures,
          probeAvailable: false,
        }
      : {
          ...state,
          failures,
        };
  }
  if (event.type === 'cooldown' && state.state === 'open')
    return {
      ...state,
      state: 'half-open',
      probeAvailable: true,
    };
  if (event.type === 'probe-success' && state.state === 'half-open' && state.probeAvailable) {
    return {
      ...state,
      state: 'closed',
      generation: state.generation + 1,
      failures: 0,
      probeAvailable: false,
    };
  }
  if (event.type === 'success' && event.generation !== state.generation) {
    return {
      ...state,
      staleSuccessReturned: true,
    };
  }
  return state;
}
export function breakerLifecycle() {
  let state = {
    state: 'closed',
    generation: 1,
    failures: 0,
    threshold: 2,
    probeAvailable: false,
  };
  state = breakerTransition(state, {
    type: 'failure',
    generation: 1,
  });
  state = breakerTransition(state, {
    type: 'failure',
    generation: 1,
  });
  const opened = state;
  state = breakerTransition(state, {
    type: 'cooldown',
  });
  const halfOpen = state;
  state = breakerTransition(state, {
    type: 'probe-success',
  });
  return {
    opened,
    halfOpen,
    recovered: state,
  };
}
export function admitProbe(state, id) {
  return state.state === 'half-open' && state.probeAvailable === true && !state.inFlight
    ? {
        ...state,
        probeAvailable: false,
        inFlight: {
          id,
          generation: state.generation,
        },
      }
    : state;
}
export function finishProbe(state, receipt) {
  if (
    !state.inFlight ||
    receipt.id !== state.inFlight.id ||
    receipt.generation !== state.generation
  )
    return state;
  if (receipt.outcome === 'cancel')
    return {
      ...state,
      state: 'open',
      generation: state.generation + 1,
      inFlight: null,
      probeAvailable: false,
    };
  if (receipt.outcome === 'other-error')
    return {
      ...state,
      inFlight: null,
      probeAvailable: true,
    };
  if (receipt.outcome === 'success')
    return {
      ...state,
      state: 'closed',
      generation: state.generation + 1,
      failures: 0,
      inFlight: null,
      probeAvailable: false,
      accepted: true,
    };
  if (receipt.outcome === 'failure')
    return {
      ...state,
      state: 'open',
      generation: state.generation + 1,
      inFlight: null,
      probeAvailable: false,
    };
  return state;
}
export function breakerRace() {
  const oldRequest = {
    generation: 3,
  };
  let current = {
    state: 'closed',
    generation: 3,
    failures: 1,
    threshold: 2,
    probeAvailable: false,
  };
  current = breakerTransition(current, {
    type: 'failure',
    generation: 3,
  });
  const stateAfterNewFailure = current.state;
  current = breakerTransition(current, {
    type: 'success',
    generation: oldRequest.generation,
  });
  return {
    olderGeneration: oldRequest.generation,
    currentGeneration: current.generation,
    stateAfterNewFailure,
    stateAfterOldSuccess: current.state,
    oldResultReturned: current.staleSuccessReturned === true,
  };
}
export function recoveryObservation() {
  const committed = commitScenario('after-commit');
  return {
    runId: 'RUN-842',
    operationKey: committed.ledger,
    jobId: committed.job.id,
    state: committed.job.state,
    observedAt: 990,
    source: 'controller',
  };
}
export function boundedRecoveryClaim(observation, now = 1000, maxAge = 30) {
  const committed = commitScenario('after-commit');
  const valid =
    observation?.source === 'controller' &&
    observation.runId === 'RUN-842' &&
    observation.operationKey === committed.ledger &&
    observation.jobId === committed.job.id &&
    ['queued', 'running', 'completed', 'failed'].includes(observation.state) &&
    Number.isInteger(observation.observedAt) &&
    Number.isInteger(now) &&
    Number.isInteger(maxAge) &&
    maxAge >= 0;
  const age = valid ? now - observation.observedAt : null;
  if (!valid || age < 0 || age > maxAge) return null;
  return {
    ...observation,
    age,
    text: `${observation.jobId} was ${observation.state} when checked`,
  };
}
