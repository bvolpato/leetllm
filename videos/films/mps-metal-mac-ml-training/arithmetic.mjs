import { deterministicBiases, deterministicWeights, dimensions } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const cueProgress = (cues, id, fallback = 0) => {
  const cue = cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress ?? 0)
    : fallback;
};
export const cueStarted = (cues, id, fallback = false) => {
  const cue = cues?.[id];
  return cue ? cue.phase !== 'before' : fallback;
};
export const cueComplete = (cues, id, fallback = false) => {
  const cue = cues?.[id];
  return cue ? cue.phase === 'after' || clamp(cue.progress ?? 0) >= 1 : fallback;
};
export const ease = (n) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
export const featureBytes = ({ batch, positions, features, bytesPerValue }) =>
  batch * positions * features * bytesPerValue;
export function classifierShapes() {
  return {
    input: [dimensions.tickets, dimensions.positions, dimensions.features],
    pooled: [dimensions.tickets, dimensions.features],
    logits: [dimensions.tickets, dimensions.classes],
  };
}
export function classifierFixture(positions = 8) {
  const input = Array.from(
    {
      length: 4,
    },
    (_, ticket) =>
      Array.from(
        {
          length: 8,
        },
        (_, position) =>
          Array.from(
            {
              length: 16,
            },
            (_, feature) => (ticket + 1) * 0.1 + (position + 1) * 0.01 + (feature + 1) * 0.001,
          ),
      ),
  );
  const pooled = input.map((ticket) =>
    ticket[0].map(
      (_, feature) =>
        ticket.slice(0, positions).reduce((sum, position) => sum + position[feature], 0) /
        positions,
    ),
  );
  const logits = pooled.map((row) =>
    deterministicBiases.map((bias, category) =>
      row.reduce(
        (sum, value, feature) => sum + value * deterministicWeights[feature][category],
        bias,
      ),
    ),
  );
  return {
    input,
    pooled,
    logits,
    weights: deterministicWeights,
    biases: deterministicBiases,
  };
}
export function classifierTrainingFixture() {
  const { pooled, logits, weights, biases } = classifierFixture();
  const labels = [0, 2, 1, 0];
  const probabilities = logits.map((row) => {
    const maximum = Math.max(...row);
    const exponentials = row.map((value) => Math.exp(value - maximum));
    const denominator = exponentials.reduce((sum, value) => sum + value, 0);
    return exponentials.map((value) => value / denominator);
  });
  const losses = probabilities.map((row, ticket) => -Math.log(row[labels[ticket]]));
  const loss = losses.reduce((sum, value) => sum + value, 0) / losses.length;
  const gradients = Array.from(
    {
      length: 16,
    },
    (_, feature) =>
      Array.from(
        {
          length: 3,
        },
        (_, category) =>
          pooled.reduce(
            (sum, row, ticket) =>
              sum +
              row[feature] *
                (probabilities[ticket][category] - Number(labels[ticket] === category)),
            0,
          ) / pooled.length,
      ),
  );
  const biasGradients = Array.from(
    {
      length: 3,
    },
    (_, category) =>
      probabilities.reduce(
        (sum, row, ticket) => sum + row[category] - Number(labels[ticket] === category),
        0,
      ) / probabilities.length,
  );
  const learningRate = 0.1;
  const updatedWeights = weights.map((row, feature) =>
    row.map((weight, category) => weight - learningRate * gradients[feature][category]),
  );
  const updatedBiases = biases.map(
    (bias, category) => bias - learningRate * biasGradients[category],
  );
  const updatedLogits = pooled.map((ticket) =>
    biases.map((_, category) =>
      ticket.reduce(
        (sum, value, feature) => sum + value * updatedWeights[feature][category],
        updatedBiases[category],
      ),
    ),
  );
  const updatedProbabilities = updatedLogits.map((row) => {
    const maximum = Math.max(...row);
    const exponentials = row.map((value) => Math.exp(value - maximum));
    const denominator = exponentials.reduce((sum, value) => sum + value, 0);
    return exponentials.map((value) => value / denominator);
  });
  const lossAfter = updatedProbabilities.reduce(
    (sum, row, ticket) => sum - Math.log(row[labels[ticket]]) / labels.length,
    0,
  );
  const firstClassContributions = pooled[0].map((feature, index) => feature * weights[index][0]);
  return {
    labels,
    probabilities,
    losses,
    loss,
    lossAfter,
    gradients,
    weights,
    updatedWeights,
    biases,
    updatedBiases,
    biasGradients,
    learningRate,
    firstClassBias: biases[0],
    firstClassContributions,
    firstTicket: {
      logits: logits[0],
      probabilities: probabilities[0],
      label: labels[0],
      loss: losses[0],
    },
    firstWeightUpdate: {
      before: weights[0][0],
      gradient: gradients[0][0],
      after: updatedWeights[0][0],
    },
  };
}
export function float32Neighbors(second = 16_777_217) {
  const values = [16_777_216, second];
  return {
    input: values,
    cast: values.map(Math.fround),
    preserved: values[0] === Math.fround(values[0]) && values[1] === Math.fround(values[1]),
  };
}
export function backendChoice(report) {
  return report?.built === true && report?.available === true ? 'mps' : 'cpu';
}
export const fixed = (n) => Number(n).toFixed(3);
export function precisionDecision({ available, finite, metricDelta, tolerance }) {
  if (!available)
    return {
      accepted: false,
      reason: 'unavailable',
      selected: 'float32',
    };
  if (!finite)
    return {
      accepted: false,
      reason: 'nonfinite',
      selected: 'float32',
    };
  if (Math.abs(metricDelta) > tolerance)
    return {
      accepted: false,
      reason: 'task-quality',
      selected: 'float32',
    };
  return {
    accepted: true,
    reason: 'quality-checked',
    selected: 'measure autocast',
  };
}
export function autocastExample(available, candidateBp) {
  const referenceBp = 9600;
  const toleranceBp = 100;
  return {
    referenceBp,
    candidateBp,
    toleranceBp,
    validation: precisionDecision({
      available,
      finite: true,
      metricDelta: candidateBp - referenceBp,
      tolerance: toleranceBp,
    }),
  };
}
export function crossoverCost(width) {
  const work = (width / 256) ** 3,
    host = work,
    dispatch = 3,
    device = work * 0.25;
  return {
    width,
    work,
    host,
    dispatch,
    device,
    mps: dispatch + device,
    winner: host < dispatch + device ? 'cpu' : 'mps',
  };
}
export function allocatorCase(stage) {
  if (stage === 0)
    return {
      input: 12,
      state: 12,
      cached: 16,
      other: 8,
      requested: 0,
      live: 24,
      driver: 48,
      peak: 48,
      budget: 48,
      accepted: true,
    };
  if (stage === 1)
    return {
      input: 12,
      state: 12,
      cached: 0,
      other: 8,
      requested: 24,
      live: 24,
      driver: 32,
      peak: 56,
      budget: 48,
      accepted: false,
    };
  return {
    input: 6,
    state: 12,
    cached: 0,
    other: 8,
    requested: 12,
    live: 30,
    driver: 38,
    peak: 38,
    budget: 48,
    accepted: true,
  };
}
export function profilingTrace(logging) {
  const host = [],
    gpu = [];
  for (let i = 0; i < 3; i++) {
    const enqueue = logging ? i * 17 : i,
      start = logging ? enqueue + 1 : 1 + i * 4;
    host.push({
      kind: 'enqueue',
      start: enqueue,
      end: enqueue + 1,
    });
    gpu.push({
      start,
      end: start + 4,
    });
    if (logging && i < 2)
      host.push(
        {
          kind: 'wait',
          start: enqueue + 1,
          end: start + 4,
        },
        {
          kind: 'logging',
          start: start + 4,
          end: enqueue + 17,
        },
      );
  }
  return {
    host,
    gpu,
    completion: gpu.at(-1).end,
    waitUntilCompleted: false,
  };
}
export function serialMpsSchedule(detour = false) {
  let cursor = 0;
  const parts = detour
    ? [
        ['A', 3, 'mps'],
        ['out', 1, 'boundary'],
        ['U', 6, 'cpu'],
        ['back', 1, 'boundary'],
        ['B', 4, 'mps'],
      ]
    : [
        ['A', 3, 'mps'],
        ['U', 2, 'mps'],
        ['B', 4, 'mps'],
      ];
  const intervals = parts.map(([id, duration, device]) => {
    const start = cursor;
    cursor += duration;
    return {
      id,
      duration,
      device,
      start,
      end: cursor,
    };
  });
  return {
    intervals,
    total: cursor,
  };
}
export function tensorShapeContract(batch, positions, features, classes) {
  for (const n of [batch, positions, features, classes]) assert(Number.isSafeInteger(n) && n > 0);
  return {
    input: [batch, positions, features],
    pooled: [batch, features],
    logits: [batch, classes],
    bytes: batch * positions * features * 4,
  };
}
export function freshMpsFixture(lastPosition = 6) {
  const positions = [1, 2, 3, 4, 5, lastPosition],
    weights = [1, 0, -1],
    mean = positions.reduce((n, v) => n + v, 0) / positions.length;
  return {
    ...tensorShapeContract(3, 6, 8, 3),
    positions,
    weights,
    mean,
    logits: weights.map((w) => (w === 0 ? 0 : w * mean)),
    sourceDevice: 'cpu',
    returnedDevice: 'mps',
    otherFeatures: 0,
    biases: [0, 0, 0],
  };
}
export function mpsWatermarkExample(recommendedGiB = 6, ratio = 1.7) {
  assert(recommendedGiB > 0 && Number.isFinite(recommendedGiB));
  assert(ratio >= 0 && Number.isFinite(ratio));
  return {
    recommendedGiB,
    ratio,
    limitGiB: ratio === 0 ? null : recommendedGiB * ratio,
    limitDisabled: ratio === 0,
  };
}
export function mpsExtensionModel(id, { step, p, cues = {} }) {
  const on = (id, fallback) => cueStarted(cues, id, fallback),
    progress = (id, fallback) => cueProgress(cues, id, fallback);
  if (id === 'release-prerequisites')
    return {
      runtimeReady: step === 2 && on('mps-runtime-ready', p > 0.55),
    };
  if (id === 'shape-and-step')
    return {
      shape: tensorShapeContract(4, 8, 16, 3),
      pooled: step > 0 || on('mps-contract-pool', p > 0.3),
      logits: step > 0 || on('mps-contract-logits', p > 0.45),
      bytes: step > 0 || on('mps-contract-bytes', p > 0.75),
      grad: step === 1 && on('mps-contract-grad', p > 0.4),
      updated: step === 1 && on('mps-contract-step', p > 0.6),
    };
  if (id === 'fallback-accounting') {
    const supported = serialMpsSchedule(false);
    const detour = serialMpsSchedule(true);
    const cuesByInterval = [
      'fallback-accounting-b2',
      'mps-detour-schedule',
      'mps-detour-cpu',
      'mps-detour-return',
      'mps-detour-finish',
    ];
    const detourTime =
      step === 0
        ? 0
        : step > 1
          ? detour.total
          : detour.intervals.reduce(
              (elapsed, part, index) =>
                elapsed + part.duration * progress(cuesByInterval[index], clamp(p * 5 - index)),
              0,
            );
    return {
      supported,
      detour,
      supportedTime:
        supported.total * (step > 0 ? 1 : progress('fallback-accounting-b1', clamp(p / 0.6))),
      detourTime,
      totalReady:
        step === 0
          ? cueComplete(cues, 'mps-supported-total', p > 0.7)
          : step === 2 && cueComplete(cues, 'mps-detour-total', p > 0.24),
    };
  }
  if (id === 'dtype-allocation')
    return {
      rejected: step > 0 || on('mps-dtype-reject', p > 0.45),
      converted: step > 0 && on('mps-dtype-convert', p > 0.3),
      labelsReady: step > 0 && cueComplete(cues, 'class-index-dtype', p > 0.65),
    };
  if (id === 'measurement-receipt') {
    const warm = step > 0 ? 1 : progress('mps-measure-warm', clamp((p - 0.15) / 0.2)),
      timed = step > 0 ? 1 : progress('mps-measure-ten', clamp((p - 0.4) / 0.2));
    const synchronized = timed === 1 && (step > 0 || cueComplete(cues, 'mps-measure-sync', p >= 0.7));
    return {
      warm,
      timed,
      warmProducts: Math.floor(warm * 3),
      timedProducts: Math.floor(timed * 10),
      synchronized,
      cpuBoundaries: step > 0 || on('cpu-measure-boundaries', p >= 0.72),
      normalized: synchronized && (step > 0 || on('mps-measure-normalize', p > 0.75)),
    };
  }
  if (id === 'allocator-limits') {
    const tileCues = ['tile-first', 'tile-across', 'tile-next-queries', 'tile-last'];
    const tile = step === 3
      ? tileCues.findLastIndex((name, index) => cueComplete(cues, name, p >= 0.34 + index * 0.14))
      : -1;
    return {
      ...mpsWatermarkExample(),
      limitReady: step > 0 || cueComplete(cues, 'mps-watermark-total', p > 0.5),
      halfBatch:
        step === 2 && on('mps-shape-halfbatch', p > 0.1) && !on('mps-reset-batch', p > 0.3),
      attention: step === 3 || (step === 2 && cueComplete(cues, 'full-attention', p > 0.5)),
      short: step === 3 || (step === 2 && cueComplete(cues, 'mps-cut-length', p > 0.82)),
      quarterScore: step === 3 && cueComplete(cues, 'mps-shape-halfsequence', p > 0.12),
      tiled: step === 3 && on('open-score-tile', p > 0.22),
      tile,
    };
  }
  if (id === 'fresh-ticket') {
    const assigned = step > 1 || (step === 1 && on('mps-fresh-assign', p > 0.12)),
      shapesReady = assigned && (step > 1 || on('mps-fresh-shapes', p > 0.3)),
      meanReady = shapesReady && (step > 1 || on('mps-fresh-mean', p > 0.48)),
      weightsReady = meanReady && (step > 1 || on('mps-fresh-weights', p > 0.65)),
      logitsReady = weightsReady && (step > 1 || on('mps-fresh-logits', p > 0.8));
    const cpuKnown = step > 1 || (step === 1 && on('mps-fresh-cpu', p > 0.02));
    const sourceEdited = step > 2 || (step === 2 && cueComplete(cues, 'mps-fresh-edit', p > 0.35));
    const copiedAgain = step === 4 && cueComplete(cues, 'mps-fresh-replace', p > 0.2);
    const revised = freshMpsFixture(-21);
    const original = freshMpsFixture();
    const scored =
      step === 4
        ? copiedAgain && cueComplete(cues, 'mps-fresh-rescore', p > 0.65)
        : logitsReady && (step > 1 || cueComplete(cues, 'mps-fresh-logits', p > 0.85));
    const placed = copiedAgain ? revised : original;
    const routeKnown =
      (step === 1 && cueComplete(cues, 'mps-fresh-first-route', p > 0.95)) ||
      (step === 3 && cueComplete(cues, 'mps-fresh-keep', p > 0.14)) ||
      (step === 4 && cueComplete(cues, 'mps-fresh-route', p > 0.78));
    return {
      ...original,
      source: sourceEdited ? revised : original,
      placed,
      sourceEdited,
      copiedAgain,
      unboundValues: step === 0 && !cueComplete(cues, 'fresh-discard-copy', p > 0.65)
        ? Math.floor(original.positions.length * progress('fresh-unbound-copy', clamp((p - 0.45) / 0.1)))
        : 0,
      callingWithCorrection: step === 4 && on('fresh-next-call', p > 0.3),
      recopyProgress: step === 4 ? progress('mps-fresh-replace', clamp(p / 0.2)) : 0,
      scored,
      revisedMeanReady: copiedAgain && cueComplete(cues, 'mps-fresh-remean', p > 0.45),
      winningClass: scored ? placed.logits.indexOf(Math.max(...placed.logits)) : null,
      verdict: scored && routeKnown,
      assigned,
      cpuKnown,
      activeDevice: assigned ? 'mps' : cpuKnown ? 'cpu' : null,
      shapesReady,
      meanReady,
      weightsReady,
      logitsReady,
    };
  }
  return {};
}
