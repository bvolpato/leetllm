import { run, selectiveCoefficients } from './arithmetic.mjs';
export const xs = [3, 1, 4, 2];
export const hs = run(xs);
export const weights = xs.map((_, i) => 0.2 * 0.9 ** (3 - i));
export const contrib = xs.map((x, i) => x * weights[i]);
export const pairs = xs.map((x) => [0.9, 0.2 * x]);
export const DELTA_BEAT_SECONDS = [19.176, 20.09, 17.308];
export const CHECKPOINT_BEAT_SECONDS = 19.874;
export const KERNEL_INTERVENTION_SECONDS = 18.724;
export function buildSelectiveStates(values = xs) {
  const selective = [];
  let h = 0;
  for (const x of values) {
    const { delta, a, write, c } = selectiveCoefficients(x);
    h = a * h + write;
    selective.push({
      x,
      delta,
      a,
      write,
      c,
      h,
      y: c * h,
    });
  }
  return selective;
}
export const selective = buildSelectiveStates(xs);
