import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawEvents(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('events', state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  {
    text(
      ctx,
      api,
      'V2.5 deferred EPBuffer dispatch → EventOverlap',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    api.focus.target(
      'events-id-comm-label-dispatch-id-independent-label-independent-work-id-expe',
      () =>
        teaching.timeline({
          x: 150,
          y: 400,
          width: 1600,
          height: 400,
          domain: [0, 6],
          time: modelState.time,
          lanes: [
            {
              id: 'comm',
              label: 'Dispatch',
            },
            {
              id: 'independent',
              label: 'Independent work',
            },
            {
              id: 'expert',
              label: 'Expert consumer',
            },
          ],
          intervals: [
            {
              id: 'dispatch',
              lane: 'comm',
              start: 0,
              end: 4,
              color: themeColors.blue,
            },
            {
              id: 'independent',
              lane: 'independent',
              start: 1,
              end: 3,
              color: themeColors.cyan,
            },
            {
              id: 'expert',
              lane: 'expert',
              start: 4,
              end: 6,
              color: themeColors.pink,
            },
          ],
          ticks: [0, 1, 3, 4, 6],
          labelWidth: 340,
          fontSize: 27,
          color: themeColors.muted,
          trackColor: themeColors.panel,
        }),
    );
    text(
      ctx,
      api,
      `Host wait calls ${modelState.waitCalls} · first result ${modelState.first ? 'four objects retained' : 'not requested'}`,
      960,
      890,
      32,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      currentBeat === 2
        ? result('events-second')
          ? 'Second wait → no repeated epilogue results'
          : 'Second wait requested · returned-copy result pending'
        : `Device dispatch ready: ${modelState.deviceReady} · host return is separate`,
      960,
      1000,
      33,
      currentBeat === 2 ? themeColors.yellow : themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'events',
  draw: drawEvents,
  cues: [
    'events-beat-1-focus-1',
    'events-beat-2-focus-1',
    'events-beat-3-focus-1',
    'dep-result-events-second',
  ],
};
