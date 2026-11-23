import { drawScoreDesk, sceneClock, sweep } from '../desk.mjs';
import { rows } from '../fixtures.mjs';
import { thresholdCounts } from '../model.mjs';

const pair = rows.filter((r) => r.id === 'Freeze' || r.id === 'Angry routine');

export function drawThreshold(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  let cutoff = sweep(0.5, pair[1].p, clock.progress('threshold-guide'));
  if (clock.after('threshold-guide'))
    cutoff = sweep(pair[1].p, pair[0].p, clock.progress('threshold-freeze'));
  if (clock.after('threshold-freeze'))
    cutoff = sweep(pair[0].p, 0.35, clock.progress('threshold-stop'));
  const { FN, FP } = thresholdCounts(pair, cutoff);
  const showRoutes = clock.after('threshold-first');
  const { C } = api;
  api.text(ctx, 'Two example tickets    /    supplied review scores', 122, 264, 32, C.muted);
  api.focus.target('score-rows', () => {
    drawScoreDesk(ctx, api, pair, cutoff, {
      firstY: 495,
      spacing: 150,
      domain: [0.3, 0.55],
      showRoutes,
      pendingTicket: clock.after('threshold-read') ? null : 'Angry routine',
    });
    if (showRoutes) {
      api.text(ctx, 'Required tickets missed', 122, 811, 33, C.muted);
      api.text(ctx, FN, 555, 816, 56, FN ? C.pink : C.ink);
      api.text(ctx, 'Routine tickets sent to review', 815, 811, 33, C.muted);
      api.text(ctx, FP, 1370, 816, 56, FP ? C.pink : C.ink);
    }
  });
  if (state.beat === 1)
    api.text(
      ctx,
      'At 0.35, which tickets enter review? Which one belongs there?',
      960,
      966,
      38,
      C.ink,
      'center',
    );
  else api.text(ctx, 'Send to a person when review score ≥ cutoff', 960, 966, 37, C.ink, 'center');
}

export default {
  id: 'threshold',
  draw: drawThreshold,
  cues: [
    'threshold-read',
    'threshold-first',
    'threshold-guide',
    'threshold-freeze',
    'threshold-stop',
  ],
};
