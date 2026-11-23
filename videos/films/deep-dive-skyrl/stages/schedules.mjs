import { sampleModel } from '../model.mjs';
import { drawSkyText } from '../defaults.mjs';
export function drawSchedules(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('schedules', state),
    currentBeat = modelState.b;
  {
    const lanes = [
      {
        id: 'generation',
        label: 'Sampler',
      },
      {
        id: 'environment',
        label: 'Environment',
      },
      {
        id: 'trainer',
        label: 'Update + sync',
      },
    ];
    const intervals = modelState.async
      ? [
          {
            id: 'A',
            lane: 'generation',
            start: 0,
            end: 2,
            color: themeColors.blue,
          },
          {
            id: 'B',
            lane: 'generation',
            start: 4,
            end: 6,
            color: themeColors.blue,
          },
          {
            id: 'long',
            lane: 'environment',
            start: 0,
            end: 8,
            color: themeColors.pink,
          },
          {
            id: 'update1',
            lane: 'trainer',
            start: 2,
            end: 4,
            color: themeColors.cyan,
          },
          {
            id: 'update2',
            lane: 'trainer',
            start: 6,
            end: 8,
            color: themeColors.cyan,
          },
        ]
      : [
          {
            id: 'batch',
            lane: 'generation',
            start: 0,
            end: 4,
            color: themeColors.blue,
          },
          {
            id: 'env',
            lane: 'environment',
            start: 0,
            end: 4,
            color: themeColors.pink,
          },
          {
            id: 'update',
            lane: 'trainer',
            start: 4,
            end: 6,
            color: themeColors.cyan,
          },
          {
            id: 'next',
            lane: 'generation',
            start: 6,
            end: 10,
            color: themeColors.blue,
          },
        ];
    drawSkyText(
      ctx,
      api,
      modelState.async ? 'Independent groups overlap training' : 'Synchronous reference boundaries',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    api.focus.target('schedules-timeline-schedules', () =>
      teaching.timeline({
        x: 150,
        y: 370,
        width: 1600,
        height: 480,
        domain: [0, 10],
        time: modelState.time,
        lanes,
        intervals,
        ticks: [0, 2, 4, 6, 8, 10],
        labelWidth: 330,
        fontSize: 27,
        color: themeColors.muted,
        trackColor: themeColors.panel,
      }),
    );
    drawSkyText(ctx, api, 'Time in example units', 960, 990, 29, themeColors.muted, 'center');
  }
}
export default {
  id: 'schedules',
  draw: drawSchedules,
  cues: ['schedules-beat-1-focus-1', 'schedules-beat-2-focus-1', 'schedules-beat-3-focus-1'],
};
