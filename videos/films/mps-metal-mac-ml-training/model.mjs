import { largerBatch, mpsExtensionIds, sceneBeatCounts, sceneIds } from './fixtures.mjs';
import {
  allocatorCase,
  autocastExample,
  backendChoice,
  clamp,
  classifierFixture,
  classifierShapes,
  classifierTrainingFixture,
  crossoverCost,
  cueComplete,
  cueProgress,
  cueStarted,
  ease,
  featureBytes,
  float32Neighbors,
  freshMpsFixture,
  mpsExtensionModel,
  profilingTrace,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-0',
        snapshot: {
          step: 0,
        },
      },
      cues: Array.from(
        {
          length: sceneBeatCounts[id] - 1,
        },
        (_, i) => ({
          id: id + '-' + (i + 1),
          beat: i + 1,
          at: 0,
          snapshot: {
            step: i + 1,
          },
        }),
      ),
    }),
  ]),
);
export const trained = classifierTrainingFixture();
export const full = classifierFixture();
export function trainingLossAtUpdate(factor) {
  const weights = trained.weights.map((row, j) =>
    row.map((v, k) => v + (trained.updatedWeights[j][k] - v) * factor),
  );
  const biases = trained.biases.map((v, k) => v + (trained.updatedBiases[k] - v) * factor);
  return full.pooled.reduce((total, row, ticket) => {
    const scores = biases.map((b, k) => row.reduce((n, x, j) => n + x * weights[j][k], b)),
      maximum = Math.max(...scores);
    return (
      total +
      (maximum +
        Math.log(scores.reduce((n, x) => n + Math.exp(x - maximum), 0)) -
        scores[trained.labels[ticket]]) /
        4
    );
  }, 0);
}
export function sampleModel(id, state) {
  const step = tracks[id].sample(state).snapshot.step;
  const raw = clamp(state.beatP ?? 0),
    p = raw === 1 && state.beat < sceneBeatCounts[id] - 1 ? 0 : raw;
  const cues = state.cues ?? {},
    progress = (name, fallback = p) => cueProgress(cues, name, fallback);
  const started = (name, fallback = false) => cueStarted(cues, name, fallback);
  const done = (name, fallback = false) => cueComplete(cues, name, fallback);
  const base = {
    step,
    p,
  };
  if (mpsExtensionIds.has(id))
    return {
      ...base,
      ...mpsExtensionModel(id, {
        step,
        p,
        cues,
      }),
    };
  if (id === 'opening')
    return {
      ...base,
      pool: step ? 1 : ease(progress('opening-mean', clamp(p / 0.4))),
      travel: step ? 1 : ease(progress('opening-linear', clamp((p - 0.4) / 0.2))),
      blocked: step > 0 && started('failed-call', p > 0.1),
      repair: step > 0 && started('opening-repair', p > 0.65),
    };
  if (id === 'return-ticket') {
    return {
      ...base,
      pool: ease(progress('return-mean', clamp(p / 0.25))),
      travel: ease(progress('return-linear', clamp((p - 0.25) / 0.25))),
      returned: done('accepted-call', p > 0.55),
      nextRun: started('next-run', p > 0.75),
      lossBefore: trained.loss,
      lossAfter: trained.lossAfter,
    };
  }
  if (id === 'backend') {
    const available = step === 1 && started('runtime-open', p >= 0.35);
    return {
      ...base,
      built: true,
      available,
      selected: backendChoice({
        built: true,
        available,
      }),
    };
  }
  if (id === 'shared-pool')
    return {
      ...base,
      unified: step > 0,
      morph: ease(p),
    };
  if (id === 'assignment') {
    const copy = step === 0 ? progress('returned-copy', ease(clamp((p - 0.1) / 0.75))) : 1;
    const assigned = step > 0 && started('assign-return', p >= 0.3);
    return {
      ...base,
      copyProgress: copy,
      copyReady: step > 0 || done('returned-copy', p >= 0.86),
      assigned,
      batchDevice: assigned ? 'mps' : 'cpu',
      sourceDevice: 'cpu',
    };
  }
  if (id === 'pooling') {
    const reduction =
      step === 0 ? 0 : progress('average-positions', ease(clamp((p - 0.05) / 0.65)));
    const positions = step === 0 ? 0 : Math.min(8, Math.floor(reduction * 8));
    const fixture = classifierFixture(Math.max(1, positions));
    return {
      ...base,
      reduction,
      positions,
      mean: fixture.pooled[0][0],
      values: full.input[0].map((row) => row[0]),
      features: full.pooled[0],
      shapeReady: step > 0 && positions === 8 && started('mean-shape', p >= 0.8),
    };
  }
  if (id === 'score') {
    const productProgress =
      step === 0 ? 0 : progress('sum-products', ease(clamp((p - 0.04) / 0.7)));
    const terms = Math.min(16, Math.floor(productProgress * 16));
    return {
      ...base,
      terms,
      productProgress,
      score:
        trained.firstClassBias +
        trained.firstClassContributions.slice(0, terms).reduce((n, x) => n + x, 0),
      complete: terms === 16,
    };
  }
  if (id === 'probabilities')
    return {
      ...base,
      probabilitiesReady: step > 0 || started('probability-bars', p >= 0.35),
      lossReady: step > 0 && started('correct-route-loss', p >= 0.25),
      probabilities: trained.firstTicket.probabilities,
      loss: trained.firstTicket.loss,
    };
  if (id === 'batch-update') {
    const count = step === 0 ? Math.min(4, Math.floor(progress('batch-loss', ease(p)) * 4)) : 4;
    const update = step === 0 ? 0 : progress('optimizer-update', ease(clamp((p - 0.05) / 0.65)));
    return {
      ...base,
      count,
      loss: trained.loss,
      lossAfter: trained.lossAfter,
      weight:
        trained.firstWeightUpdate.before +
        (trained.firstWeightUpdate.after - trained.firstWeightUpdate.before) * update,
      currentLoss: trainingLossAtUpdate(update),
      lossCompared: update === 1 && started('recompute-loss', p >= 0.8),
      update,
    };
  }
  if (id === 'fallback')
    return {
      ...base,
      enabled: step > 0,
      travel: step === 0 ? ease(p) * 0.35 : progress('cpu-detour', ease(p)),
      returned: step > 0 && done('cpu-detour', p >= 0.9),
    };
  if (id === 'precision') {
    const replay = step >= 2;
    const shift = step === 3 ? 1 : step === 2 ? ease(progress('move-midpoint', clamp(p / 0.4))) : 0;
    const castCue = replay ? 'cast-next-midpoint' : 'rounding-snap';
    const casting = step === 1 || step === 3;
    const castProgress = progress(castCue, ease(replay ? clamp(p / 0.16) : clamp((p - 0.04) / 0.62)));
    return {
      ...base,
      ...float32Neighbors(shift === 1 ? 16_777_219 : 16_777_217),
      replay,
      shift,
      merge: casting ? castProgress : 0,
      merged: casting && castProgress === 1,
      showParity: replay || (step === 1 && started('even-significands', p > 0.65)),
      inputGap: step === 3 && started('original-gap', p > 0.32),
      storedGap: step === 3 && started('rounded-gap', p > 0.48),
      subtractFirst: step === 3 && started('subtract-first', p > 0.8),
    };
  }
  if (id === 'autocast') {
    const edge = step === 4 || (step === 3 && done('edge-candidate', p > 0.75));
    return {
      ...base,
      ...autocastExample(step > 0, edge ? 9500 : 9300),
      available: step > 0,
      operationProgress: step === 1 ? progress('mixed-operations', ease(p)) : step > 1 ? 1 : 0,
      referenceReady: step > 2 || (step === 2 && done('reference-accuracy', p > 0.38)),
      bandReady: step > 2 || (step === 2 && done('accuracy-band', p > 0.67)),
      validationReady: step > 2 || (step === 2 && done('quality-comparison', p >= 0.85)),
      qualityReady: edge
        ? step === 4 && done('edge-verdict', p > 0.3)
        : step === 3 && done('autocast-verdict', p > 0.12),
      edge,
    };
  }
  if (id === 'profiling') {
    const trace = profilingTrace(step > 0),
      scan = progress(step === 0 ? 'capture-signposts' : 'logging-gaps', ease(p));
    return {
      ...base,
      ...trace,
      scan,
      time: trace.completion * scan,
    };
  }
  if (id === 'crossover') {
    const grow = step === 0 ? 0 : progress('grow-workload', ease(p));
    return {
      ...base,
      grow,
      ...crossoverCost(Math.round(256 * (1 + grow))),
    };
  }
  if (id === 'allocator') {
    const reducedReady = step === 2 && started('reduce-memory', p >= 0.2),
      baseline = allocatorCase(step === 2 && !reducedReady ? 1 : step),
      release = step === 0 ? 0 : step === 1 ? progress('release-unused', ease(clamp(p / 0.45))) : 1;
    const requestVisible = step > 1 || (step === 1 && started('request-activations', p >= 0.6));
    return {
      ...base,
      ...baseline,
      release,
      reducedReady,
      cached: step === 1 ? 16 * (1 - release) : baseline.cached,
      driver: step === 1 ? 32 + 16 * (1 - release) : baseline.driver,
      requestVisible,
      requestProgress:
        step === 1
          ? progress('request-activations', clamp((p - 0.6) / 0.24))
          : Number(requestVisible),
    };
  }
  if (id === 'timing') {
    const hostDispatch = 3,
      deviceWork = 35;
    const dispatch = progress(step === 0 ? 'dispatch-send' : 'repeat-send', clamp(p / 0.25));
    const work = progress(
      step === 0 ? 'dispatch-clock' : 'wait-completion',
      ease(clamp((p - 0.25) / 0.7)),
    );
    return {
      ...base,
      hostDispatch,
      deviceWork,
      deviceEnd: hostDispatch + deviceWork,
      elapsed: hostDispatch * dispatch + deviceWork * work,
      workProgress: work,
      clock: step === 0 ? hostDispatch : hostDispatch + deviceWork * work,
      synchronized: step > 0,
    };
  }
  if (id === 'memory-budget') {
    const shrink = step === 0 ? 0 : progress('halve-batch', ease(clamp((p - 0.05) / 0.6)));
    return {
      ...base,
      batch: step > 0 && shrink >= 0.5 ? 16 : 32,
      positions: 128,
      features: 768,
      shrink,
      inputMiB: 12 - 6 * shrink,
      baselineMiB: 12,
    };
  }
  return {
    ...base,
    progress: ease(p),
    lossBefore: trained.loss,
    lossAfter: trained.lossAfter,
    inputMiB: 6,
    batch: 16,
  };
}
export function validateModel() {
  assert.deepEqual(classifierShapes(), {
    input: [4, 8, 16],
    pooled: [4, 16],
    logits: [4, 3],
  });
  assert(Math.abs(full.pooled[0][0] - 0.146) < 1e-12);
  assert.equal(featureBytes(largerBatch), 12 * 1024 ** 2);
  assert.equal(featureBytes({ batch: 4, positions: 8, features: 16, bytesPerValue: 4 }), 2048);
  assert.deepEqual(freshMpsFixture().logits, [3.5, 0, -3.5]);
  assert.deepEqual(freshMpsFixture(-21).logits, [-1, 0, 1]);
  assert.deepEqual(float32Neighbors().cast, [16_777_216, 16_777_216]);
  assert.deepEqual(float32Neighbors(16_777_219).cast, [16_777_216, 16_777_220]);
  for (const candidateBp of [9500, 9600, 9700]) assert(autocastExample(true, candidateBp).validation.accepted);
  for (const candidateBp of [9300, 9499, 9701]) assert(!autocastExample(true, candidateBp).validation.accepted);
  assert(trained.lossAfter < trained.loss);
  assert.equal(
    backendChoice({
      built: true,
      available: false,
    }),
    'cpu',
  );
  assert.equal(
    backendChoice({
      built: true,
      available: true,
    }),
    'mps',
  );
  for (const id of sceneIds)
    for (let beat = 0; beat < sceneBeatCounts[id]; beat++) {
      for (const beatP of [0, 0.1, 0.5, 0.9, 1])
        assert.equal(
          sampleModel(id, {
            beat,
            beatP,
          }).step,
          beatP === 1 && beat < sceneBeatCounts[id] - 1 ? beat + 1 : beat,
        );
      if (beat < sceneBeatCounts[id] - 1)
        assert.deepEqual(
          sampleModel(id, {
            beat,
            beatP: 1,
          }),
          sampleModel(id, {
            beat: beat + 1,
            beatP: 0,
          }),
        );
    }
  return true;
}
