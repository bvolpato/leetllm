import { dotProduct } from 'vizmatic';
export function buildScalarTrace() {
  const inputs = [1, 0.4, 0.9],
    scalar = [0];
  for (const x of inputs) scalar.push(Math.tanh(0.8 * x + 0.5 * scalar.at(-1)));
  return {
    inputs,
    scalar,
  };
}
export const { inputs, scalar } = buildScalarTrace();
export function buildVectorTrace() {
  const wx = [
      [0.8, 0.2, 0.1],
      [0.1, 0.7, 0.4],
    ],
    wh = [
      [0.5, 0.1],
      [0, 0.6],
    ],
    states = [[0, 0]];
  for (let t = 0; t < 3; t++)
    states.push(wx.map((r, i) => Math.tanh(r[t] + dotProduct(wh[i], states.at(-1)))));
  return {
    wx,
    wh,
    states,
  };
}
export const { wx, wh, states } = buildVectorTrace();
export const padded = wh.map((r) => Math.tanh(dotProduct(r, states[2])));
export const cell = 0.98 * 0.855 + 0.02 * 0.1;
export const hidden = 0.8 * Math.tanh(cell);
export const openingWords = ['The', 'dog', 'chased', 'the', 'cat'];
export const eventNames = ['error', 'reproduction', 'rollback'];
