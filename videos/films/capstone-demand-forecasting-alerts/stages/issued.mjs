import { actual, candidate } from '../fixtures.mjs';
import { capacity, sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawIssued(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('issued', state);
  {
    const evaluated = false,
      n = modelState.b ? 7 : Math.max(2, Math.floor(7 * modelState.p));
    const plot = teaching.axes({
      x: 230,
      y: 380,
      width: 1450,
      height: 410,
      xDomain: [0.7, 14.3],
      yDomain: [60, 200],
      xTicks: [1, 4, 7, 10, 14],
      yTicks: [80, 140, 200],
      xLabel: 'Target day in the two issued windows',
      yLabel: 'Requested parcels',
      fontSize: 26,
    });
    api.focus.target('original-forecast', () =>
      api.focus.target('issued-forecast', () =>
        teaching.curve({
          plot,
          points: candidate.slice(0, n).map((y, i) => ({
            x: i + 1,
            y,
          })),
          color: themeColors.cyan,
          width: 4,
        }),
      ),
    );
    api.focus.target('issued-capacity', () =>
      teaching.curve({
        plot,
        points: capacity.map((y, i) => ({
          x: i + 1,
          y,
        })),
        color: themeColors.yellow,
        width: 3,
      }),
    );
    text(
      ctx,
      api,
      'Cyan: frozen forecast \xB7 yellow: issued capacity',
      960,
      300,
      27,
      themeColors.ink,
      'center',
    );
    if (modelState.b) {
      const q = api.focus.progress('issued-b2-2', modelState.p);
      if (!state.cues || state.cues['issued-b2-2'].phase !== 'before')
        api.focus.target('issued-actuals', () =>
          teaching.scatter({
            plot,
            points: actual.slice(0, Math.max(1, Math.ceil(7 * q))).map((y, i) => ({
              x: i + 1,
              y,
              color: themeColors.pink,
              radius: 9,
            })),
          }),
        );
    }
  }
}
export default {
  id: 'issued',
  draw: drawIssued,
  cues: ['issued-b1-1', 'issued-b1-2', 'issued-b2-1', 'issued-b2-2'],
};
