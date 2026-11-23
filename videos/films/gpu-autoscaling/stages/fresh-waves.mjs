import { freshBurstSchedules, warmPrediction } from '../model.mjs';
import { decision, requestStrip, startBoard, markStartChange } from '../admission-board.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const { four, five: original, fiveShort: short, six } = freshBurstSchedules;

export function drawFreshWaves(ctx, scene, state, api) {
  const { C } = api;
  const prediction = warmPrediction(state);
  const shorter = prediction.deadline === 12;
  const failedFour = shorter || prediction.comparisonVisible;
  const tryFive = afterClause(state, 'try-five', 1, 0.58);
  const passedFive = shorter || prediction.shown;
  const move = cueProgress(state, 'shorter-gate', 2, 0.28, 0.63);
  const failedFive = shorter && prediction.comparisonVisible;
  const passedSix = shorter && prediction.shown;
  const schedule = passedSix ? six : failedFive ? short : tryFive ? original : four;
  const warm = passedSix ? short.minimum : tryFive ? original.minimum : original.minimum - 1;
  const gate = 18 - 6 * move;
  let now = 12 * cueProgress(state, 'fresh-input', 0, 0.57, 0.78);
  if (failedFour) now = 25;
  if (tryFive && !passedFive) now = 12;
  const replay = move > 0 && !failedFive;
  requestStrip(ctx, api, {
    rows: schedule.rows,
    now,
    deadline: gate,
    pin: 'R72',
    detail: replay
      ? 'Previous starts with 5 warm replicas'
      : '4 slots per replica  ·  6 s service  ·  cold ready 120 s',
  });
  startBoard(ctx, api, {
    trackedId: 'R72',
    rows: schedule.rows,
    slots: 4,
    warm,
    service: 6,
    deadline: gate,
    now,
    previousRows: original.rows,
    showLost: failedFive && !passedSix,
  });
  if (failedFive) {
    const shift = passedSix ? cueProgress(state, 'track-last-request', 3, 0.68, 0.94) : 0;
    markStartChange(
      ctx,
      api,
      original.rows.at(-1).start,
      six.rows.at(-1).start,
      6,
      shift,
      passedSix,
    );
  }
  let message = 'What is the smallest warm pool that starts all 72 by 18 s?';
  if (failedFour)
    message = '4 warm  ·  ' + four.admitted + ' start  ·  ' + four.expired + ' expire';
  if (tryFive) message = '5 warm workers  ·  one more legal start at 18 s';
  if (passedFive)
    message = original.minimum + ' warm  ·  all ' + original.admitted + ' start by 18 s';
  if (move > 0) message = 'Which requests lose their start? What is the smallest warm pool now?';
  if (failedFive) message = '5 warm  ·  ' + short.admitted + ' start  ·  R61–R72 miss the gate';
  if (passedSix) message = short.minimum + ' warm  ·  all ' + six.admitted + ' start by 12 s';
  if (passedSix && afterClause(state, 'track-last-request', 3, 0.94))
    message = `${six.minimum} warm GPUs × 4 slots × ${six.waves} starts per slot = ${six.admitted} requests`;
  decision(ctx, api, message, failedFive && !passedSix ? C.pink : C.ink);
}
export default {
  id: 'fresh-waves',
  draw: drawFreshWaves,
  cues: [
    'fresh-input',
    'ga-fresh-four',
    'try-five',
    'ga-fresh-five',
    'shorter-gate',
    'ga-fresh-five-short',
    'ga-fresh-six',
    'track-last-request',
  ],
};
