import { ARTIFACT } from './fixtures.mjs';
export function publishable(bytes) {
  return bytes.length === ARTIFACT.length && bytes.every((value, i) => value === ARTIFACT[i]);
}
