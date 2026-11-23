export const TASK_SCOPE = new Set(['search-run', 'expand-failure', 'save-local-draft']);
export const INITIAL_PORTAL = Object.freeze({
  sessionId: 'session-9',
  frameId: 'frame-1',
  version: 1,
  view: 'dashboard',
  runId: null,
  failureOpen: false,
  draft: null,
});
export const freshnessIntervals = [8.542, 10.758, 9.934];
export const NOTE_REQUEST = Object.freeze({
  id: 'N-1',
  text: 'CI failure draft',
});
export const NOTE_SCREEN = Object.freeze({
  draft: NOTE_REQUEST.text,
  confirmationBanner: false,
});
// Measured words: “queues” in beat 2; “checks authoritative state” in beat 3.
export // Measured words: “queues” in beat 2; “checks authoritative state” in beat 3.
const QUEUE_CUE = 3.575 / 9.774;
export const PROBE_START = 2 / 10.438;
export const PROBE_END = 3.7 / 10.438;
