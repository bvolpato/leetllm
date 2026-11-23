import { freshServingRows, meanInFlight, servingReceipt } from './model.mjs';
export const averageInFlight = meanInFlight(0, 3000);
export const limit = (x) => Math.max(0, Math.min(1, x));
export const cueProgress = (cues, id, fallback) =>
  !cues?.[id]
    ? fallback
    : cues[id].phase === 'before'
      ? 0
      : cues[id].phase === 'after'
        ? 1
        : cues[id].progress;
export const cueStarted = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function servingClock(progress = 0) {
  const scheduled = 760,
    sent = 765 + Math.round(35 * limit(progress)),
    first = 1050;
  return {
    scheduled,
    sent,
    first,
    lag: sent - scheduled,
    ttft: first - sent,
    valid: sent - scheduled <= 20,
  };
}
export function freshServingState(beat, progress, cues) {
  const after = (id, threshold) =>
    cues?.[id] ? cues[id].phase === 'after' : progress >= threshold;
  const rows = freshServingRows();
  const move = cueProgress(cues, 'fresh-delay', limit((progress - 0.06) / 0.18));
  const restore = cueProgress(cues, 'fresh-restore', limit((progress - 0.65) / 0.15));
  const shift = beat === 2 ? Math.round(45 * move * (1 - restore)) : 0;
  rows[1].sent += shift;
  return {
    rows,
    receipt: servingReceipt(rows, [0, 2500]),
    delay: shift > 0,
    showAttainment: beat > 1 || (beat === 1 && after('fresh-attainment', 0.2)),
    showQualified: beat > 1 || (beat === 1 && after('fresh-qualified', 0.44)),
    showSuccess: beat > 1 || (beat === 1 && after('fresh-success', 0.65)),
    showOffered: beat > 1 || (beat === 1 && after('fresh-offered', 0.94)),
    promise: beat >= 3 && after('fresh-promise', 0.35),
  };
}
