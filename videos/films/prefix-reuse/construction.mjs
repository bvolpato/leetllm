import { clamp } from './arithmetic.mjs';
export const progress = (p) => clamp((p - 0.12) / 0.6);
