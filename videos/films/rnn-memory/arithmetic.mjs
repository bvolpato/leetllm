import { dotProduct } from 'vizmatic';
export const bound = (value) => Math.max(0, Math.min(1, value));
export const sigmoid = (value) => 1 / (1 + Math.exp(-value));
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export const norm = (values) => Math.hypot(...values);
export const mv = (matrix, vector) => matrix.map((row) => dotProduct(row, vector));
export const scalarTrace = (values) =>
  values.reduce((trace, value) => [...trace, Math.tanh(0.8 * value + 0.5 * trace.at(-1))], [0]);
export const discountedTrace = (values) =>
  values.reduce((trace, value) => [...trace, 0.6 * trace.at(-1) + value], [0]);
