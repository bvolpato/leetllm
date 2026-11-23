import {
  divergence,
  edgeDevice,
  edgeLoss,
  energyCandidate,
  integrateEnergy,
  interpolateTrace,
} from './arithmetic.mjs';
import {
  EDGE_NEW,
  bundle,
  manifest,
  manuals,
  operations,
  publicKey,
  signature,
  teacherLogits,
  thermalTraces,
  tracks,
  trustedAssets,
} from './fixtures.mjs';
import { clamp, edgeCue, hash } from './construction.mjs';
import { verify } from 'node:crypto';
import { stableSoftmax } from 'vizmatic';
export function verifyAnswer(question, answer) {
  const source = manuals[answer.citation];
  const valueMatch = Boolean(
    source && source.code === answer.code && source.meaning === answer.meaning,
  );
  const applies = Boolean(
    valueMatch && source.sensor === question.sensor && source.code === question.code,
  );
  return {
    valueMatch,
    applies,
    source,
  };
}
export function train(steps, temperature = 3) {
  let logits = [0, 0, 0];
  const teacher = stableSoftmax(teacherLogits, temperature),
    losses = [];
  for (let i = 0; i <= steps; i++) {
    const student = stableSoftmax(logits, temperature);
    losses.push(divergence(logits, temperature));
    if (i < steps)
      logits = logits.map((value, j) => value - 0.2 * temperature * (student[j] - teacher[j]));
  }
  return {
    logits,
    teacher,
    student: stableSoftmax(logits, temperature),
    loss: losses.at(-1),
    losses,
  };
}
export function executeGraph(placement) {
  let value = [2, 1],
    clock = 0;
  const spans = [],
    results = [];
  operations.forEach((operation, i) => {
    if (i && placement[i] !== placement[i - 1]) {
      spans.push({
        name: 'Boundary',
        start: clock,
        end: clock + 8,
        device: 'boundary',
      });
      clock += 8;
    }
    const duration = operation[placement[i]];
    value = operation.run(value);
    results.push([...value]);
    spans.push({
      name: operation.name,
      start: clock,
      end: clock + duration,
      device: placement[i],
    });
    clock += duration;
  });
  return {
    placement,
    spans,
    results,
    output: value[0],
    total: clock,
  };
}
export function policyDecision(payload, destination, clientLabel) {
  const known = payload.every((id) => Object.hasOwn(trustedAssets, id));
  const classification = !known
    ? 'unknown'
    : payload.some((id) => trustedAssets[id].class === 'restricted')
      ? 'restricted'
      : 'public';
  const localOnly = true;
  return {
    classification,
    destination,
    allowed: destination === 'device' || (!localOnly && known && classification === 'public'),
  };
}
export function checkBundle(bytes, metadata = manifest, manifestSignature = signature) {
  const authenticated = verify(
    null,
    Buffer.from(JSON.stringify(metadata)),
    publicKey,
    manifestSignature,
  );
  const length = bytes.length === metadata.length,
    digest = hash(bytes) === metadata.sha256;
  const version = metadata.version >= 1 && metadata.expires > 100;
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString());
  } catch {
    parsed = {};
  }
  const compatible =
    metadata.device === 'handheld' &&
    metadata.runtime <= 3 &&
    parsed.runtime === metadata.runtime &&
    parsed.tokenizer === metadata.tokenizer;
  return {
    authenticated,
    length,
    digest,
    version,
    compatible,
    accepted: authenticated && length && digest && version && compatible,
  };
}
export function sampleModel(id, state) {
  if (EDGE_NEW.has(id)) return edgeState(id, state);
  const { step } = tracks[id].sample(state).snapshot;
  const p = clamp(((state.beatP ?? 0) - 0.12) / 0.6);
  if (id === 'grounding') {
    const question = {
      sensor: 'A',
      code: step === 2 ? 'E9' : 'E2',
    };
    const answer =
      step === 0
        ? {
            citation: 'M8',
            ...manuals.M8,
          }
        : {
            citation: 'M7',
            ...manuals.M7,
          };
    return {
      step,
      p,
      question,
      answer,
      ...verifyAnswer(question, answer),
    };
  }
  if (id === 'training') {
    const soften = state.cues?.['temperature-shares']?.progress ?? p;
    const learn = state.cues?.['gradient-updates']?.progress ?? p;
    const temperature = step === 0 ? 1 : step === 1 ? 1 + 2 * soften : 3;
    const steps = step < 2 ? 0 : Math.floor(60 * learn + 1e-9);
    return {
      step,
      p,
      temperature,
      steps,
      ...train(steps, temperature),
    };
  }
  if (id === 'export-runtime') {
    const graph = executeGraph(
        [
          ['cpu', 'cpu', 'cpu'],
          ['npu', 'cpu', 'npu'],
          ['npu', 'npu', 'npu'],
        ][step],
      ),
      cursor = graph.total * p;
    const completed = graph.spans.filter(
      (span) => span.device !== 'boundary' && span.end <= cursor + 1e-9,
    ).length;
    return {
      step,
      p,
      ...graph,
      cursor,
      completed,
      current: completed ? graph.results[completed - 1] : [2, 1],
    };
  }
  if (id === 'thermal') {
    const trace = thermalTraces[step === 2 ? 1 : 0];
    const failureCue = state.cueTiming === 'provider-words' ? state.cues?.['sample-failure'] : null;
    const minute =
      step === 0
        ? 1.5 * p
        : step === 1
          ? failureCue
            ? failureCue.progress > 0
              ? 10
              : 1.5
            : 1.5 + 8.5 * p
          : 10 * p;
    const samples = trace.filter((point) => point.minute <= minute);
    const minimum = Math.min(...samples.map((point) => point.rate));
    return {
      step,
      p,
      trace,
      minute,
      rate: interpolateTrace(trace, minute),
      minimum,
      passes: minimum >= 18,
    };
  }
  if (id === 'energy') {
    const candidate = energyCandidate(step === 2 ? 'B' : 'A');
    const end = step === 0 ? candidate.phases[1].seconds : 28800;
    const seconds = p * end;
    return {
      step,
      p,
      candidate,
      seconds,
      energy: step === 0 ? (seconds * candidate.watts) / 3600 : integrateEnergy(candidate, seconds),
      total: integrateEnergy(candidate, 28800),
      decodeWh: (candidate.phases[1].watts * candidate.phases[1].seconds) / 3600,
      nominal: 15,
      usable: 12,
    };
  }
  if (id === 'privacy') {
    const payload =
      step === 0
        ? ['manual', 'incident']
        : step === 1
          ? ['manual', 'metrics']
          : ['manual', 'incident'];
    const destination = step === 0 ? 'device' : 'cloud';
    return {
      step,
      p,
      payload,
      route: ['Local inference', 'Crash telemetry', 'Answer escalation'][step],
      ...policyDecision(payload, destination, 'public'),
    };
  }
  if (id === 'updates') {
    const bytes = step === 0 ? bundle.subarray(0, bundle.length - 4) : bundle;
    const checked = checkBundle(bytes);
    const activationCue =
      state.cueTiming === 'provider-words' ? state.cues?.['fresh-session'] : null;
    const activationReady = activationCue ? activationCue.progress > 0 : p >= 0.75;
    const recoveryCue = state.cues?.['health-recovery'];
    const recovered = step === 2 && (recoveryCue ? recoveryCue.progress > 0 : p >= 0.5);
    const activated =
      checked.accepted && ((step === 1 && activationReady) || (step === 2 && !recovered));
    return {
      step,
      p,
      checked,
      bytes: bytes.length,
      expected: bundle.length,
      active: activated ? 2 : 1,
      session: recovered ? 3 : activated ? 2 : 1,
      health: step !== 2,
      recovered,
    };
  }
  return {
    step,
    p,
  };
}
export function edgeState(id, state) {
  const b = state.beat ?? 0,
    q = edgeCue(state, `edge-${id}-op-${b}`),
    done = (key) => edgeCue(state, `edge-${id}-${key}`, 'done'),
    progress = (key) => edgeCue(state, `edge-${id}-${key}`);
  return {
    id,
    b,
    q,
    done,
    progress,
    loss: edgeLoss(),
    device: edgeDevice(b === 2 && done('repair-input') ? 0.9 : 1),
  };
}
