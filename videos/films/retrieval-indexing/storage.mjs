import { GAP_IDS } from './fixtures.mjs';
export const GAP_VALUES = Object.freeze(GAP_IDS.map((id, index) => id - (GAP_IDS[index - 1] ?? 0)));
export function decodeGapValues(gaps) {
  return gaps.reduce((ids, gap) => [...ids, gap + (ids.at(-1) ?? 0)], []);
}
export const storageOpacity = (progress, index, mode) => {
  if (mode === 'decoded') return 1;
  const start = mode === 'gaps' ? 0.244 + index * 0.02 : index * 0.12;
  const end = mode === 'gaps' ? 0.29 + index * 0.03 : 0.62 + index * 0.08;
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
};
export function storageDisplay(snapshot, progress, opacityAt = storageOpacity) {
  const decoded = decodeGapValues(snapshot.gaps);
  if (decoded.length !== snapshot.ids.length || decoded.some((id, i) => id !== snapshot.ids[i])) {
    throw new Error('Gap values must reconstruct the snapshot document IDs');
  }
  const visibleCount = snapshot.ids.reduce(
    (count, _id, index) => count + (opacityAt(progress, index, snapshot.mode) >= 0.5 ? 1 : 0),
    0,
  );
  const visibleIds = snapshot.ids.slice(0, visibleCount);
  const visibleGaps = snapshot.gaps.slice(0, visibleCount);
  return {
    visibleCount,
    visibleIds,
    visibleGaps,
    partialSum: visibleGaps.reduce((sum, gap) => sum + gap, 0),
  };
}
