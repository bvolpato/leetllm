export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export function stateLedger(stage) {
  const p = 1.5,
    ranks = 4,
    parts = [
      (p * 2) / (stage >= 3 ? ranks : 1),
      (p * 2) / (stage >= 2 ? ranks : 1),
      (p * 12) / (stage >= 1 ? ranks : 1),
    ];
  return {
    parts,
    total: sum(parts),
  };
}
export function adam([w, m, v], g, step) {
  m = 0.9 * m + 0.1 * g;
  v = 0.999 * v + 0.001 * g * g;
  const mh = m / (1 - 0.9 ** step),
    vh = v / (1 - 0.999 ** step);
  return [w - (0.01 * mh) / (Math.sqrt(vh) + 1e-8), m, v];
}
export function buildOptimizerTrajectory() {
  const gradients = [1, 3, -2, 0.5, 2],
    trajectory = [[1, 0, 0]];
  for (let step = 1; step <= 5; step++)
    trajectory.push(adam(trajectory.at(-1), gradients[step - 1], step));
  const saved = trajectory.at(-1);
  return {
    gradients,
    trajectory,
    saved,
  };
}
export const { gradients, trajectory, saved } = buildOptimizerTrajectory();
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const mix = (a, z, p) => a + (z - a) * clamp(p);
