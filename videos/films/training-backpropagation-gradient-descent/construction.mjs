import { symmetric } from './fixtures.mjs';
export const rms = Math.sqrt(
  symmetric.reduce((sum, value) => sum + value ** 2, 0) / symmetric.length,
);
