import { sum } from '../arithmetic.mjs';
import { phases, sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawTiming(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const colors = [
        themeColors.blue,
        themeColors.cyan,
        themeColors.green,
        themeColors.pink,
        themeColors.yellow,
      ],
      immediate = modelState.timing.immediate;
    const first = api.focus.target('timing-id-immediate-label-immediate', () =>
      teaching.timeline({
        x: 190,
        y: 365,
        width: 1540,
        height: 185,
        domain: [0, 350],
        lanes: [
          {
            id: 'immediate',
            label: 'Immediate',
          },
        ],
        intervals: phases(0, 'immediate').map((v, i) => ({
          ...v,
          color: colors[i],
        })),
        time: immediate,
        ticks: [0, 100, 200, 300, 350],
        fontSize: 25,
        labelWidth: 220,
      }),
    );
    const objectiveX = first.point(200);
    api.line(ctx, objectiveX, 390, objectiveX, 490, themeColors.yellow, 3);
    text(ctx, api, '200 ms objective', objectiveX + 20, 340, 27, themeColors.yellow);
    let delayed = 0;
    if (modelState.b) {
      const second = api.focus.target('timing-debounced-path', () =>
        teaching.timeline({
          x: 190,
          y: 650,
          width: 1540,
          height: 185,
          domain: [0, 350],
          lanes: [
            {
              id: 'debounced',
              label: 'Debounced',
            },
          ],
          intervals: [
            {
              id: 'wait',
              lane: 'debounced',
              start: 0,
              end: 150,
              color: themeColors.muted,
            },
            ...phases(150, 'debounced').map((v, i) => ({
              ...v,
              color: colors[i],
            })),
          ],
          time: modelState.timing.delayed,
          ticks: [0, 100, 200, 300, 350],
          fontSize: 25,
          labelWidth: 220,
        }),
      );
      delayed = sum(Object.values(second.intervals).map((v) => v.elapsed));
      api.line(ctx, objectiveX, 675, objectiveX, 775, themeColors.yellow, 3);
    }
    api.focus.target('timing-elapsed-comparison', () =>
      text(
        ctx,
        api,
        'Immediate elapsed ' +
          sum(Object.values(first.intervals).map((v) => v.elapsed)).toFixed(0) +
          ' ms' +
          (modelState.b ? ' · debounced elapsed ' + delayed.toFixed(0) + ' ms' : ''),
        960,
        280,
        34,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'timing',
  draw: drawTiming,
  cues: ['timing-beat-1-focus-1', 'timing-beat-1-focus-2', 'timing-beat-2-focus-1'],
};
