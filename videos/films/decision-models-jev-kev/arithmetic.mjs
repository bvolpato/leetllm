export const softmax = (scores, temperature = 1) => {
  const maximum = Math.max(...scores);
  const weights = scores.map((value) => Math.exp((value - maximum) / temperature));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((value) => value / total);
};

export function confidence(probability, count = 3) {
  if (count === 1) return 1;
  const uniform = 1 / count;
  return (probability - uniform) / (1 - uniform);
}

export function probabilityCutoff(cutoff, count) {
  const uniform = 1 / count;
  return uniform + (1 - uniform) * cutoff;
}
