import { data } from './fixtures.mjs';
export const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
export function createFittedReference() {
  const meanX = average(data.map((row) => row.x)),
    meanY = average(data.map((row) => row.y));
  const varianceX = average(data.map((row) => (row.x - meanX) ** 2));
  const optimum = {
    slope: average(data.map((row) => (row.x - meanX) * (row.y - meanY))) / varianceX,
  };
  optimum.intercept = meanY - optimum.slope * meanX;
  return {
    meanX,
    meanY,
    varianceX,
    optimum,
  };
}
export const { meanX, meanY, varianceX, optimum } = createFittedReference();
export const quadratic = (x) => 93 + 26 * x - x * x;
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const phase = (value, start, end) => clamp((value - start) / (end - start));
export const smooth = (value) => value * value * (3 - 2 * value);
