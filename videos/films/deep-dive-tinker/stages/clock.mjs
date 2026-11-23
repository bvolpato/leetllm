import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawClock(ctx, scene, state, api) {
  return api.focus.target('tk-clock-trace', () => paintClock(ctx, scene, state, api));
}
function paintClock(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const modelState = sampleModel('clock', state);
  const progress = modelState.q;
  {
    const trace = api.focus.target(
      'clock-id-naive-label-wait-between-calls-id-pipelined-label-submit-ordered',
      () =>
        teaching.timeline({
          x: 100,
          y: 350,
          width: 1720,
          height: 455,
          domain: [0, 3],
          time: modelState.time,
          labelWidth: 330,
          fontSize: 26,
          ticks: [0, 1, 2, 3],
          formatTime: (value) => 'cycle ' + value,
          lanes: [
            {
              id: 'naive',
              label: 'Wait between calls',
            },
            {
              id: 'pipelined',
              label: 'Submit ordered pair',
            },
          ],
          intervals: [
            {
              id: 'naive-forward',
              lane: 'naive',
              start: 0,
              end: 1,
              label: 'forward/backward',
              color: themeColors.blue,
            },
            {
              id: 'naive-wait',
              lane: 'naive',
              start: 1,
              end: 2,
              label: 'await result',
              color: themeColors.yellow,
            },
            {
              id: 'naive-opt',
              lane: 'naive',
              start: 2,
              end: 3,
              label: 'optimizer step',
              color: themeColors.pink,
            },
            {
              id: 'pipe-pair',
              lane: 'pipelined',
              start: 0,
              end: 1,
              label: 'submit fwd + optim',
              color: themeColors.cyan,
            },
            {
              id: 'pipe-wait',
              lane: 'pipelined',
              start: 1,
              end: 2,
              label: 'await both',
              color: themeColors.green,
            },
          ],
        }),
    );
    drawOriginalText(
      ctx,
      api,
      'The training client preserves request order',
      960,
      290,
      35,
      themeColors.ink,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Naive span: 3 illustrative cycles',
      525,
      885,
      30,
      themeColors.pink,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Pair submitted before awaiting',
      1390,
      885,
      30,
      themeColors.green,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Clock-cycle schedule from documentation · measure your initialized client',
      960,
      985,
      27,
      themeColors.muted,
      'center',
    );
    if (!Number.isFinite(trace.intervals['pipe-pair'].elapsed))
      throw new Error('timeline interval must be finite');
  }
}
export default {
  id: 'clock',
  draw: drawClock,
  cues: [
    'clock-beat-1-focus-1',
    'tk-clock-0-0',
    'tk-clock-0-1',
    'tk-clock-0-2',
    'clock-beat-2-focus-1',
    'clock-beat-2-focus-2',
    'tk-clock-1-0',
    'tk-clock-1-1',
    'tk-clock-1-2',
    'clock-beat-3-focus-1',
    'tk-clock-2-0',
    'tk-clock-2-1',
    'tk-clock-2-2',
    'tk-clock-2-3',
  ],
};
