import { complete } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawOffload(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('offload', state),
    currentBeat = modelState.b;
  {
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? 'Move state through the bottleneck'
        : modelState.dependent
          ? 'Transfer must finish before compute starts'
          : 'Independent compute can overlap transfer',
      960,
      285,
      36,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      modelState.time >= 2
        ? 'State-consumer readiness reached at 2 s'
        : 'State consumer waits for the 2 s transfer endpoint',
      960,
      345,
      28,
      modelState.time >= 2 ? themeColors.green : themeColors.muted,
      'center',
    );
    const start = modelState.dependent ? 2 : 0;
    const trace = api.focus.target(
      'offload-id-transfer-label-state-transfer-id-compute-label-compute',
      () =>
        teaching.timeline({
          x: 150,
          y: 390,
          width: 1600,
          height: 380,
          domain: [0, 5],
          time: modelState.time,
          lanes: [
            {
              id: 'transfer',
              label: 'State transfer',
            },
            {
              id: 'compute',
              label: 'Compute',
            },
          ],
          intervals: [
            {
              id: 'transfer',
              label: '12 GB · 2 s',
              lane: 'transfer',
              start: 0,
              end: 2,
              color: themeColors.blue,
            },
            ...(currentBeat > 0
              ? [
                  {
                    id: 'work',
                    label: '3 s work',
                    lane: 'compute',
                    start,
                    end: start + 3,
                    color: themeColors.cyan,
                  },
                ]
              : []),
          ],
          ticks: [0, 1, 2, 3, 4, 5],
          labelWidth: 260,
          fontSize: 27,
          color: themeColors.muted,
          trackColor: themeColors.panel,
          cursorColor: themeColors.yellow,
        }),
    );
    api.line(ctx, trace.point(2), 432, trace.point(2), 534, themeColors.blue, 3);
    if (currentBeat > 0)
      api.line(ctx, trace.point(start + 3), 595, trace.point(start + 3), 697, themeColors.cyan, 3);
    drawOriginalText(
      ctx,
      api,
      `Transferred ${modelState.transferred.toFixed(1)} / 12 GB · clock ${modelState.time.toFixed(1)} s`,
      960,
      865,
      37,
      themeColors.green,
      'center',
    );
    const scheduleReady =
      currentBeat === 1
        ? complete(state, 'offload', 1, 1)
        : currentBeat === 2 && complete(state, 'offload', 2, 0);
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? 'Supplied transfer service time: 2 seconds'
        : !scheduleReady
          ? 'Ideal schedule consequence pending'
          : modelState.dependent
            ? 'Ideal schedule · 2 seconds exposed before dependent work'
            : 'Ideal schedule · 2 seconds hidden within independent work',
      960,
      935,
      28,
      currentBeat === 0
        ? themeColors.cyan
        : !scheduleReady
          ? themeColors.muted
          : modelState.dependent
            ? themeColors.pink
            : themeColors.cyan,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Supplied bandwidth 6 GB/s · compute 3 s · ideal overlap model',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'offload',
  draw: drawOffload,
  cues: [
    'offload-beat-1-focus-1',
    'ds-offload-b0-s0',
    'ds-offload-b0-s1',
    'ds-offload-b0-s2',
    'ds-offload-b0-s3',
    'offload-beat-2-focus-1',
    'ds-offload-b1-s0',
    'ds-offload-b1-s1',
    'ds-offload-b1-s2',
    'offload-beat-3-focus-1',
    'ds-offload-b2-s0',
    'ds-offload-b2-s1',
    'ds-offload-b2-s2',
  ],
};
