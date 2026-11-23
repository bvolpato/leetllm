import { cloneMatrix } from './arithmetic.mjs';
import { FEATURES, LABELS, LR, fitInitial, fitInputs, fitTargets } from './fixtures.mjs';
import { stableSoftmax } from 'vizmatic';
export function fitState(parameters, updates) {
  let loss = 0,
    correct = 0;
  const predictions = [];
  for (let i = 0; i < fitInputs.length; i++) {
    const input = fitInputs[i],
      target = fitTargets[i];
    const hidden = parameters.firstWeights.map((row, j) =>
      Math.max(0, row[0] * input[0] + row[1] * input[1] + parameters.firstBias[j]),
    );
    const logits = parameters.secondWeights.map((row, c) =>
      row.reduce((sum, weight, j) => sum + weight * hidden[j], parameters.secondBias[c]),
    );
    const probabilities = stableSoftmax(logits),
      prediction = probabilities[1] > probabilities[0] ? 1 : 0;
    loss -= Math.log(probabilities[target]) / fitInputs.length;
    correct += Number(prediction === target);
    predictions.push({
      target,
      prediction,
      correct: prediction === target,
    });
  }
  const values = [
    ...parameters.firstWeights.flat(),
    ...parameters.firstBias,
    ...parameters.secondWeights.flat(),
    ...parameters.secondBias,
  ];
  return {
    updates,
    loss,
    accuracy: correct / fitInputs.length,
    correct,
    predictions,
    weightNorm: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)),
    weights: {
      first: cloneMatrix(parameters.firstWeights),
      firstBias: [...parameters.firstBias],
      second: cloneMatrix(parameters.secondWeights),
      secondBias: [...parameters.secondBias],
    },
  };
}
export function trainFitFixture() {
  const parameters = {
    firstWeights: cloneMatrix(fitInitial.firstWeights),
    firstBias: [...fitInitial.firstBias],
    secondWeights: cloneMatrix(fitInitial.secondWeights),
    secondBias: [...fitInitial.secondBias],
  };
  const history = [fitState(parameters, 0)];
  for (let update = 1; update <= 120; update++) {
    const firstGradients = parameters.firstWeights.map(() => [0, 0]),
      firstBiasGradients = parameters.firstBias.map(() => 0);
    const secondGradients = parameters.secondWeights.map(() => Array(8).fill(0)),
      secondBiasGradients = parameters.secondBias.map(() => 0);
    for (let i = 0; i < fitInputs.length; i++) {
      const input = fitInputs[i],
        target = fitTargets[i];
      const preactivations = parameters.firstWeights.map(
        (row, j) => row[0] * input[0] + row[1] * input[1] + parameters.firstBias[j],
      );
      const hidden = preactivations.map((value) => Math.max(0, value));
      const logits = parameters.secondWeights.map((row, c) =>
        row.reduce((sum, weight, j) => sum + weight * hidden[j], parameters.secondBias[c]),
      );
      const probabilities = stableSoftmax(logits);
      const logitGradients = probabilities.map(
        (probability, c) => (probability - Number(target === c)) / fitInputs.length,
      );
      const hiddenGradients = Array(8).fill(0);
      for (let c = 0; c < 2; c++) {
        secondBiasGradients[c] += logitGradients[c];
        for (let j = 0; j < 8; j++) {
          secondGradients[c][j] += logitGradients[c] * hidden[j];
          hiddenGradients[j] += logitGradients[c] * parameters.secondWeights[c][j];
        }
      }
      for (let j = 0; j < 8; j++) {
        const gradient = preactivations[j] > 0 ? hiddenGradients[j] : 0;
        firstBiasGradients[j] += gradient;
        for (let k = 0; k < 2; k++) firstGradients[j][k] += gradient * input[k];
      }
    }
    const learningRate = 0.15;
    for (let j = 0; j < 8; j++) {
      parameters.firstBias[j] -= learningRate * firstBiasGradients[j];
      for (let k = 0; k < 2; k++)
        parameters.firstWeights[j][k] -= learningRate * firstGradients[j][k];
    }
    for (let c = 0; c < 2; c++) {
      parameters.secondBias[c] -= learningRate * secondBiasGradients[c];
      for (let j = 0; j < 8; j++)
        parameters.secondWeights[c][j] -= learningRate * secondGradients[c][j];
    }
    history.push(fitState(parameters, update));
  }
  return history;
}
export const fitHistory = trainFitFixture();
export function oneTrainingStep() {
  const weights = [
    [0, 0],
    [0, 0],
  ];
  const logits = FEATURES.map((row) =>
    weights.map((weight) => weight.reduce((sum, w, j) => sum + w * row[j], 0)),
  );
  const probabilities = logits.map((row) => stableSoftmax(row));
  const loss =
    probabilities.reduce((sum, row, i) => sum - Math.log(row[LABELS[i]]), 0) / FEATURES.length;
  const gradient = weights.map((_row, cls) =>
    FEATURES[0].map((_value, feature) =>
      FEATURES.reduce(
        (sum, x, i) =>
          sum +
          ((probabilities[i][cls] - Number(LABELS[i] === cls)) * x[feature]) / FEATURES.length,
        0,
      ),
    ),
  );
  const updated = weights.map((row, cls) =>
    row.map((value, feature) => value - LR * gradient[cls][feature]),
  );
  return {
    weights,
    logits,
    probabilities,
    loss,
    gradient,
    updated,
  };
}
export function trainBigramHistory() {
  const train =
      'the queue held the request. the request left the queue. the reply reached the user. the user read the reply. ',
    validation = 'the driver held the lock. the worker left the pool. the user read the docs. ',
    chars = [...new Set(train + validation)].sort(),
    index = new Map(chars.map((v, i) => [v, i])),
    pairs = (text) =>
      Array.from(
        {
          length: text.length - 1,
        },
        (_, i) => [index.get(text[i]), index.get(text[i + 1])],
      ),
    trainPairs = pairs(train),
    validationPairs = pairs(validation),
    v = chars.length,
    counts = Array.from(
      {
        length: v,
      },
      () => Array(v).fill(0),
    );
  for (const [a, b] of trainPairs) counts[a][b]++;
  const logits = Array.from(
      {
        length: v,
      },
      () => Array(v).fill(0),
    ),
    totals = counts.map((row) => row.reduce((a, b) => a + b, 0)),
    history = [];
  let bestLoss = Infinity,
    bestStep = 0,
    best = null;
  const loss = (data, probs) =>
    data.reduce((sum, [a, b]) => sum - Math.log(probs[a][b]), 0) / data.length;
  for (let step = 0; step <= 1000; step++) {
    const probs = logits.map((row) => stableSoftmax(row)),
      val = loss(validationPairs, probs),
      trainLoss = loss(trainPairs, probs);
    history.push({
      step,
      train: trainLoss,
      validation: val,
    });
    if (val < bestLoss) {
      bestLoss = val;
      bestStep = step;
      best = cloneMatrix(logits);
    }
    if (step === 1000) break;
    for (let a = 0; a < v; a++)
      for (let k = 0; k < v; k++)
        logits[a][k] -= (2 * (totals[a] * probs[a][k] - counts[a][k])) / trainPairs.length;
  }
  const seen = new Set(trainPairs.map(([a, b]) => a + ',' + b)),
    unseen = validationPairs.filter(([a, b]) => !seen.has(a + ',' + b)).length,
    floor =
      counts.reduce(
        (sum, row, a) =>
          sum + row.reduce((s, count) => (count ? s - count * Math.log(count / totals[a]) : s), 0),
        0,
      ) / trainPairs.length;
  return {
    chars,
    counts,
    totals,
    trainPairs: trainPairs.length,
    validationPairs: validationPairs.length,
    unseen,
    best,
    bestStep,
    bestLoss,
    history,
    floor,
  };
}
export const LOOP_BIGRAM = trainBigramHistory();
