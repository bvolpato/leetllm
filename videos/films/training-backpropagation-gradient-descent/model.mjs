import { example, symmetric } from './fixtures.mjs';
import { clamp, ease, lossAt } from './arithmetic.mjs';
import { rms } from './construction.mjs';
import assert from 'node:assert/strict';
export function cueProgress(state, id, beat = 0) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : ease(((state.beatP ?? 0) - 0.15) / 0.65);
}
export function updateOnce(rate, input = example) {
  const prediction = input.weight * input.x + input.bias,
    residual = prediction - input.target;
  const gradWeight = residual * input.x,
    gradBias = residual;
  const weight = input.weight - rate * gradWeight,
    bias = input.bias - rate * gradBias;
  const nextPrediction = weight * input.x + bias;
  return {
    rate,
    prediction,
    residual,
    loss: 0.5 * residual ** 2,
    gradWeight,
    gradBias,
    weight,
    bias,
    nextPrediction,
    nextLoss: 0.5 * (nextPrediction - input.target) ** 2,
    multiplier: 1 - (input.x ** 2 + 1) * rate,
  };
}
export function reverseTrace() {
  const result = updateOnce(0.1);
  return {
    product: 2,
    prediction: result.prediction,
    residual: result.residual,
    loss: result.loss,
    seed: 1,
    gradPrediction: result.residual,
    gradWeight: result.gradWeight,
    gradBias: result.gradBias,
  };
}
export function finiteDifference(epsilon = 0.01) {
  const minus = lossAt(1 - epsilon),
    plus = lossAt(1 + epsilon);
  return {
    epsilon,
    minus,
    plus,
    numerical: (plus - minus) / (2 * epsilon),
    analytic: -8,
  };
}
export function nonlinearTrace(x = 2, target = 6, rate = 0.05) {
  const weights = [1, -1],
    biases = [0, 1],
    outWeights = [1, 1],
    outBias = 0;
  const z = weights.map((w, i) => w * x + biases[i]),
    hidden = z.map((v) => Math.max(0, v));
  const prediction = hidden.reduce((sum, h, i) => sum + h * outWeights[i], outBias),
    residual = prediction - target;
  const gradOut = hidden.map((h) => (h === 0 ? 0 : residual * h)),
    gradHidden = outWeights.map((w) => residual * w),
    gradZ = gradHidden.map((g, i) => (z[i] > 0 ? g : 0)),
    gradWeights = gradZ.map((g) => (g === 0 ? 0 : g * x));
  const nextWeights = weights.map((w, i) => w - rate * gradWeights[i]),
    nextBiases = biases.map((v, i) => v - rate * gradZ[i]),
    nextOut = outWeights.map((v, i) => v - rate * gradOut[i]),
    nextOutBias = outBias - rate * residual;
  const nextZ = nextWeights.map((w, i) => w * x + nextBiases[i]),
    nextHidden = nextZ.map((v) => Math.max(0, v)),
    nextPrediction = nextHidden.reduce((sum, h, i) => sum + h * nextOut[i], nextOutBias);
  return {
    x,
    target,
    rate,
    weights,
    biases,
    outWeights,
    outBias,
    z,
    hidden,
    prediction,
    residual,
    loss: 0.5 * residual ** 2,
    gradOut,
    gradOutBias: residual,
    gradHidden,
    gradZ,
    gradWeights,
    gradBiases: gradZ,
    nextWeights,
    nextBiases,
    nextOut,
    nextOutBias,
    nextZ,
    nextHidden,
    nextPrediction,
    nextLoss: 0.5 * (nextPrediction - target) ** 2,
  };
}
export function classificationTrace() {
  const probabilities = [0.2, 0.3, 0.5],
    target = [0, 1, 0],
    logits = probabilities.map(Math.log),
    gradient = probabilities.map((p, i) => p - target[i]);
  return {
    probabilities,
    target,
    logits,
    gradient,
    loss: -Math.log(probabilities[1]),
  };
}
export function tokenMeanTrace() {
  const chunks = [
      [1, 2, 3],
      [4, 4, 4, 4, 4, 4, 4],
    ],
    counts = chunks.map((x) => x.length),
    total = counts.reduce((a, b) => a + b),
    means = chunks.map((x) => x.reduce((a, b) => a + b) / x.length),
    weights = counts.map((n) => n / total);
  return {
    chunks,
    counts,
    total,
    means,
    weights,
    mean: means.reduce((sum, v, i) => sum + v * weights[i], 0),
    incorrectRequestMean: (means[0] * 2) / 3 + means[1] / 3,
  };
}
export function microbatchGradients(weight = 0, bias = 0) {
  const rows = [
      [1, 3],
      [2, 5],
      [3, 7],
    ],
    rowGradients = rows.map(([x, target]) => {
      const residual = weight * x + bias - target;
      return {
        weight: residual * x,
        bias: residual,
      };
    });
  const mean = (rows) => ({
    weight: rows.reduce((sum, row) => sum + row.weight, 0) / rows.length,
    bias: rows.reduce((sum, row) => sum + row.bias, 0) / rows.length,
  });
  const full = mean(rowGradients),
    first = mean(rowGradients.slice(0, 2)),
    last = mean(rowGradients.slice(2));
  return {
    weight,
    bias,
    rows,
    rowGradients,
    full,
    first,
    last,
    weighted: {
      weight: (first.weight * 2) / 3 + last.weight / 3,
      bias: (first.bias * 2) / 3 + last.bias / 3,
    },
    equal: {
      weight: (first.weight + last.weight) / 2,
      bias: (first.bias + last.bias) / 2,
    },
  };
}
export function simulateStopping(limit = 7) {
  const values = [4.5, 3.1, 2, 1.8, 1.85, 1.92, 2.1];
  let bestLoss = Infinity,
    bestEpoch = 0,
    progressLoss = Infinity,
    counter = 0,
    stoppedAt = null;
  const trace = [];
  for (let i = 0; i < Math.min(limit, values.length); i++) {
    const value = values[i],
      epoch = i + 1;
    if (value < bestLoss) {
      bestLoss = value;
      bestEpoch = epoch;
    }
    if (value < progressLoss - 1e-4) {
      progressLoss = value;
      counter = 0;
    } else counter++;
    if (counter >= 3) stoppedAt = epoch;
    trace.push({
      epoch,
      value,
      best: epoch === bestEpoch,
      counter,
      stopped: stoppedAt === epoch,
    });
    if (stoppedAt !== null) break;
  }
  return {
    values,
    trace,
    bestLoss,
    bestEpoch,
    stoppedAt,
  };
}
export function sampleModel(sceneId, state) {
  const b = state.beat ?? 0,
    P = (id, beat) => cueProgress(state, id, beat),
    D = (id, beat) => P(id, beat) === 1;
  const result = {
    step: b,
    p: state.beatP ?? 0,
  };
  if (sceneId === 'one-update') {
    const next = updateOnce(0.1),
      updated = P('update-apply', 0) > 0;
    return {
      ...result,
      ...next,
      updated,
      currentWeight: updated ? next.weight : 1,
      currentBias: updated ? next.bias : 0,
      currentPrediction: updated ? next.nextPrediction : 2,
      currentLoss: updated ? next.nextLoss : 8,
      weightGain: 1.6 * P('update-weight-contribution', 1),
      biasGain: 0.4 * P('update-bias-contribution', 1),
      gradientReference: {
        ...example,
        prediction: 2,
        residual: -4,
        loss: 8,
      },
    };
  }
  if (sceneId === 'autograd-buffer') {
    const first = P('buffer-first', 1),
      second = P('buffer-second', 1),
      repeat = P('buffer-repeat', 2),
      clear = P('buffer-clear', 2);
    const currentBuffer =
      clear > 0
        ? 0
        : repeat === 1
          ? 12
          : repeat > 0
            ? 6 + 3 * Math.floor(repeat * 2)
            : 3 * Number(first === 1) + 3 * Number(second === 1);
    return {
      ...result,
      a: 3,
      square: 9,
      pathContributions: [3, 3],
      first: 6,
      summed: 6,
      firstProgress: first,
      secondProgress: second,
      repeatProgress: repeat,
      clearing: clear > 0,
      currentBuffer,
    };
  }
  if (sceneId === 'batches') {
    const gradients = microbatchGradients(),
      wrong = P('batch-wrong', 2),
      p = P('batch-weight', 1);
    const weights = [1 / 3 - wrong / 12, 1 / 3 - wrong / 12, 1 / 3 + wrong / 6];
    const arrivals = [p >= 0.45, p >= 0.95],
      chunkShares = [weights[0] + weights[1], weights[2]];
    const accumulated = [gradients.first, gradients.last].reduce(
      (sum, row, i) => sum + Number(arrivals[i]) * row.weight * chunkShares[i],
      0,
    );
    const biasAccumulated = [gradients.first, gradients.last].reduce(
      (sum, row, i) => sum + Number(arrivals[i]) * row.bias * chunkShares[i],
      0,
    );
    return {
      ...result,
      ...gradients,
      weights,
      arrivals,
      accumulated,
      biasAccumulated,
    };
  }
  if (sceneId === 'deep-gradients') {
    const contractionSteps = Math.min(5, Math.floor(P('deep-contract', 0) * 5 + 1e-9));
    const expansionSteps = Math.min(5, Math.floor(P('deep-expand', 0) * 5 + 1e-9));
    const clipping = P('deep-clip', 1),
      scale = 1 - clipping / 2,
      currentVector = [6 * scale, 8 * scale];
    return {
      ...result,
      contractionSteps,
      expansionSteps,
      clipping,
      currentVector,
      currentNorm: Math.hypot(...currentVector),
    };
  }
  if (sceneId === 'initialization') {
    const included = P('init-sum', 0),
      scaled = P('init-scale', 0),
      count = Math.floor(256 * included);
    const he = P('init-he', 2),
      relu = P('init-relu', 2),
      weightVariance = 1 - scaled + scaled / 256 + he / 256;
    const preactivationVariance = count * weightVariance,
      inputs = symmetric.map((value) => (value / rms) * Math.sqrt(preactivationVariance));
    const outputs = inputs.map((value) => (value < 0 ? value * (1 - relu) : value));
    return {
      ...result,
      count,
      weightVariance,
      preactivationVariance,
      inputs,
      outputs,
      relu,
      he,
      outputSecondMoment: outputs.reduce((sum, value) => sum + value ** 2, 0) / outputs.length,
    };
  }
  if (sceneId === 'validation') {
    const beforeBest = P('validation-build', 1),
      best = P('validation-best', 1),
      later = P('validation-patience', 1);
    const builtEpochs = beforeBest > 0 ? Math.max(1, Math.ceil(4 * beforeBest - 1e-9)) : 0;
    const visibleEpochs =
      b < 1
        ? 0
        : b > 1
          ? 7
          : Math.max(builtEpochs, best > 0 ? 4 : 0) + Math.floor(3 * later + 1e-9);
    return {
      ...result,
      ...simulateStopping(Math.min(7, visibleEpochs)),
      visibleEpochs: Math.min(7, visibleEpochs),
      restore: P('validation-restore', 1),
    };
  }
  if (sceneId === 'nonlinear-request' || sceneId === 'network-transfer') {
    const fresh = sceneId === 'network-transfer',
      trace = fresh ? nonlinearTrace(3, 7, 0.025) : nonlinearTrace();
    const updateBeat = fresh ? 1 : 2,
      backwardBeat = 1;
    return {
      ...result,
      ...trace,
      fresh,
      forward: P(fresh ? 'transfer-forward' : 'network-z', 0) > 0,
      activation: P(fresh ? 'transfer-forward' : 'network-h', 0) > 0,
      initialPrediction: D(fresh ? 'transfer-forward' : 'network-y', 0),
      backward: P(fresh ? 'transfer-gradients' : 'network-backward', backwardBeat) > 0,
      gradientsReady: D(fresh ? 'transfer-gradients' : 'network-gradient-result', backwardBeat),
      updated: D(fresh ? 'transfer-weights' : 'network-parameters', updateBeat),
      recomputed: D(fresh ? 'transfer-hidden' : 'network-recompute', updateBeat),
      payoff: D(fresh ? 'transfer-result' : 'network-update', updateBeat),
      lossReady: D(fresh ? 'transfer-loss' : 'network-loss-result', updateBeat),
    };
  }
  return result;
}
export function validateModel() {
  const network = nonlinearTrace(),
    fresh = nonlinearTrace(3, 7, 0.025);
  assert.deepEqual(network.z, [2, -1]);
  assert.deepEqual(network.gradWeights, [-8, 0]);
  assert.deepEqual(network.gradOut, [-8, 0]);
  assert(Math.abs(network.nextPrediction - 4.4) < 1e-12);
  assert(Math.abs(network.nextLoss - 1.28) < 1e-12);
  assert.deepEqual(fresh.z, [3, -2]);
  assert.deepEqual(fresh.gradWeights, [-12, 0]);
  assert.deepEqual(fresh.gradOut, [-12, 0]);
  assert(Math.abs(fresh.nextPrediction - 5.3) < 1e-12);
  assert(Math.abs(fresh.nextLoss - 1.445) < 1e-12);
  assert.deepEqual(classificationTrace().gradient, [0.2, -0.7, 0.5]);
  assert(Math.abs(tokenMeanTrace().mean - 3.4) < 1e-12);
  const result = updateOnce(0.1);
  assert.deepEqual(
    [
      result.prediction,
      result.residual,
      result.loss,
      result.gradWeight,
      result.gradBias,
      result.weight,
      result.bias,
      result.nextPrediction,
      result.nextLoss,
    ],
    [2, -4, 8, -8, -4, 1.8, 0.4, 4, 2],
  );
  assert.equal(updateOnce(0.2).nextLoss, 0);
  assert.equal(updateOnce(0.5).multiplier, -1.5);
  const negative = updateOnce(0.1, {
    x: -2,
    target: 6,
    weight: -1,
    bias: 0,
  });
  assert.deepEqual(
    [negative.gradWeight, negative.weight, negative.bias, negative.nextPrediction],
    [8, -1.8, 0.4, 4],
  );
  for (const eps of [0.1, 0.01, 1e-5]) assert(Math.abs(finiteDifference(eps).numerical + 8) < 1e-8);
  const batch = microbatchGradients();
  assert.deepEqual(batch.full, {
    weight: -34 / 3,
    bias: -5,
  });
  assert(Math.abs(batch.weighted.weight - batch.full.weight) < 1e-12);
  assert.deepEqual(batch.equal, {
    weight: -13.75,
    bias: -5.5,
  });
  const full = {
    beat: 2,
    beatP: 1,
  };
  assert.equal(sampleModel('autograd-buffer', full).currentBuffer, 0);
  assert(Math.abs(sampleModel('initialization', full).outputSecondMoment - 1) < 1e-12);
  assert.deepEqual([simulateStopping().bestEpoch, simulateStopping().stoppedAt], [4, 7]);
  return true;
}
