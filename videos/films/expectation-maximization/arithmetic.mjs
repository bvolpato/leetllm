export const gammaDensity = (x, mean, variance) =>
  Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
export const logScores = (x, model) =>
  model.weights.map(
    (weight, k) =>
      Math.log(weight) -
      0.5 *
        (Math.log(2 * Math.PI * model.variances[k]) +
          (x - model.means[k]) ** 2 / model.variances[k]),
  );
export const logsumexp = (scores) => {
  const max = Math.max(...scores);
  return max + Math.log(scores.reduce((sum, value) => sum + Math.exp(value - max), 0));
};
export const mixtureDensity = (x, model) =>
  model.weights.reduce(
    (sum, weight, k) => sum + weight * gammaDensity(x, model.means[k], model.variances[k]),
    0,
  );
export const logLikelihood = (data, model) =>
  data.reduce((sum, x) => sum + logsumexp(logScores(x, model)), 0);
export const posterior = (data, model) =>
  data.map((x) => {
    const scores = logScores(x, model),
      z = logsumexp(scores);
    return scores.map((score) => Math.exp(score - z));
  });
export function mStep(data, rows, varianceFloor = 1) {
  const kCount = rows[0].length;
  const effective = Array.from(
    {
      length: kCount,
    },
    (_, k) => rows.reduce((sum, row) => sum + row[k], 0),
  );
  if (effective.some((count) => count < 1e-12))
    throw new Error('Numerically empty component: try another initialization');
  const weights = effective.map((v) => v / data.length);
  const means = effective.map((n, k) => data.reduce((sum, x, i) => sum + rows[i][k] * x, 0) / n);
  const variances = effective.map((n, k) =>
    Math.max(
      varianceFloor,
      data.reduce((sum, x, i) => sum + rows[i][k] * (x - means[k]) ** 2, 0) / n,
    ),
  );
  return {
    weights,
    means,
    variances,
    effective,
  };
}
export const restrictedModel = (mean) => ({
  weights: [0.5, 0.5],
  means: [mean, 90],
  variances: [400, 400],
});
export function evidenceBound(data, q, model) {
  return data.reduce(
    (sum, x, i) =>
      sum +
      q[i].reduce((s, r, k) => s + (r > 0 ? r * (logScores(x, model)[k] - Math.log(r)) : 0), 0),
    0,
  );
}
export const varianceObjective = (variance, count = 4, squared = 1) =>
  -0.5 * count * Math.log(variance) - squared / (2 * variance);
export const scalarEncoder = (mean = 1, deviation = 2, noise = 0.5) => ({
  mean,
  deviation,
  noise,
  z: mean + deviation * noise,
  dMean: 1,
  dDeviation: noise,
});
export function reconstructionTrace(
  mean = 1,
  deviation = 2,
  noise = 0.5,
  weight = 1,
  observed = 3,
) {
  const sample = scalarEncoder(mean, deviation, noise),
    prediction = weight * sample.z,
    residual = prediction - observed;
  return {
    ...sample,
    weight,
    observed,
    prediction,
    loss: 0.5 * residual ** 2,
    meanGradient: residual * weight,
    deviationGradient: residual * weight * noise,
    weightGradient: residual * sample.z,
  };
}
