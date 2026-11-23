export function route(logits, topK = 2) {
  const peak = Math.max(...logits);
  const masses = logits.map((value) => Math.exp(value - peak));
  const total = masses.reduce((a, b) => a + b, 0);
  const probabilities = masses.map((value) => value / total);
  const selected = probabilities
    .map((_, index) => index)
    .sort((a, b) => probabilities[b] - probabilities[a])
    .slice(0, topK);
  const selectedMass = selected.reduce((sum, index) => sum + probabilities[index], 0);
  return {
    probabilities,
    selected,
    weights: selected.map((index) => probabilities[index] / selectedMass),
    selectedMass,
  };
}
export const mc = (x) => Math.max(0, Math.min(1, x));
export const vec = (v) => '[' + v.map((x) => fmt(x)).join(', ') + ']';
export const fmt = (v, n = 3) => Number(v.toFixed(n)).toString();
export const center = (bounds) => ({
  x: bounds.x + bounds.width / 2,
  y: bounds.y + bounds.height / 2,
});
export const pointRoute = (a, b, bendX) =>
  bendX === undefined
    ? [a, b]
    : [
        a,
        {
          x: bendX,
          y: a.y,
        },
        {
          x: bendX,
          y: b.y,
        },
        b,
      ];
