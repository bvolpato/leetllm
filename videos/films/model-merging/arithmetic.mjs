export function average(a, b) {
  return a.map((value, i) => (value + b[i]) / 2);
}
export function doubleWell(w) {
  return 4 * w * w * (w - 4) ** 2;
}
export function connectedBasin(w) {
  return 0.15 * Math.sin((Math.PI * w) / 4) ** 2;
}
export function taskArithmetic(base, deltas) {
  return base.map(
    (value, i) => value + deltas.reduce((sum, item) => sum + item.scale * item.vector[i], 0),
  );
}
export function evaluateNeurons(model, x) {
  return model.input.reduce((sum, weight, i) => sum + model.output[i] * Math.max(0, weight * x), 0);
}
