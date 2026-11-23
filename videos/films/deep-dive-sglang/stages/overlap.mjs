import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawOverlap(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('overlap', state),
    currentBeat = modelState.b;
  {
    text(
      ctx,
      api,
      modelState.overlap ? 'Plan B during GPU A' : 'Serial planning adds a device gap',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    api.focus.target('overlap-batch-legend', () => {
      card(ctx, api, 'Batch A', 650, 345, 300, themeColors.blue, 65);
      card(ctx, api, 'Batch B', 1080, 345, 300, themeColors.pink, 65);
    });
    const timeline = api.focus.target(
      'overlap-id-host-label-host-planning-id-gpu-label-gpu-work',
      () =>
        teaching.timeline({
          x: 150,
          y: 470,
          width: 1600,
          height: 330,
          domain: [0, 10],
          time: modelState.time,
          lanes: [
            {
              id: 'host',
              label: 'Host planning',
            },
            {
              id: 'gpu',
              label: 'GPU work',
            },
          ],
          intervals: modelState.intervals.map((v) => ({
            ...v,
            color: v.id.endsWith('A') ? themeColors.blue : themeColors.pink,
          })),
          ticks: [0, 2, 4, 6, 8, 10],
          labelWidth: 300,
          fontSize: 28,
          color: themeColors.muted,
          trackColor: themeColors.panel,
        }),
    );
    api.focus.target('overlap-result', () => {
      text(
        ctx,
        api,
        `Completed GPU batches: ${['gpuA', 'gpuB'].filter((id) => timeline.intervals[id].complete).length} / 2`,
        960,
        905,
        36,
        themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        `Supplied schedule · full completion path ${modelState.end} units`,
        960,
        1000,
        29,
        themeColors.muted,
        'center',
      );
    });
  }
}
export default {
  id: 'overlap',
  draw: drawOverlap,
  cues: [
    'overlap-beat-1-focus-1',
    'overlap-beat-1-focus-2',
    'overlap-beat-2-focus-1',
    'overlap-beat-2-focus-2',
    'overlap-b-ready',
    'overlap-beat-3-focus-1',
    'overlap-beat-3-focus-2',
  ],
};
