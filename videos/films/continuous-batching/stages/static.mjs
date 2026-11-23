import { schedule, scheduleSnapshot } from '../model.mjs';
import { drawEstablishedBatchingGrid, drawEstablishedBatchingText } from '../defaults.mjs';
export function drawStatic(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {});
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  {
    const trace = schedule(false),
      reveal = currentBeat === 0 ? Math.max(1, Math.ceil(6 * phaseForBeat(0))) : 6,
      snapshot = scheduleSnapshot(false, reveal);
    drawEstablishedBatchingGrid(ctx, api, trace, reveal);
    if (currentBeat === 2)
      api.focus.target('static-first-gap', () =>
        api.text(ctx, 'idle', 860, 480, 36, themeColors.yellow, 'center'));
    api.focus.target('static-readout', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        `${snapshot.tokens} useful tokens / ${snapshot.reserved} visible reserved seat-steps${snapshot.utilization === null ? '' : ` = ${(snapshot.utilization * 100).toFixed(1)}%`}`,
        960,
        285,
        38,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'static',
  draw: drawStatic,
  cues: [
    'static-seats',
    'empty-seat',
    'seat-accounting',
    'useful-occupancy',
    'first-empty',
    'next-opportunity',
  ],
};
