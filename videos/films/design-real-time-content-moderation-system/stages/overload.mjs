import { queue, sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawOverload(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    modelState.time = modelState.b
      ? 20 + 60 * api.focus.progress('overload-drain')
      : 20 * api.focus.progress('overload-integrate');
    const plot = api.focus.target('overload-seconds-since-burst-began-queued-judge-requests', () =>
      teaching.axes({
        x: 240,
        y: 390,
        width: 1400,
        height: 410,
        xDomain: [-2, 82],
        yDomain: [-200, 6600],
        xTicks: [0, 20, 40, 60, 80],
        yTicks: [0, 3000, 6000],
        xLabel: 'seconds since burst began',
        yLabel: 'queued judge requests',
        fontSize: 27,
      }),
    );
    api.focus.target('overload-curve-overload', () => {
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: Math.floor(modelState.time) + 1,
          },
          (_, x) => ({
            x,
            y: queue(x),
          }),
        ),
        color: themeColors.pink,
        width: 5,
      });
      teaching.scatter({
        plot,
        points: [
          {
            x: modelState.time,
            y: queue(modelState.time),
            color: themeColors.yellow,
            radius: 12,
          },
        ],
      });
    });
    api.focus.target('overload-backlog', () =>
      text(
        ctx,
        api,
        'Backlog ' +
          Math.round(queue(modelState.time)) +
          ' · clock ' +
          modelState.time.toFixed(1) +
          ' s',
        960,
        925,
        36,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('overload-inputs', () =>
      text(
        ctx,
        api,
        `Arrivals ${modelState.b ? 500 : 900} / s · service capacity 600 / s`,
        960,
        280,
        33,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('overload-net-rate', () =>
      text(
        ctx,
        api,
        modelState.b
          ? '600 − 500 = 100 / s available to drain the backlog'
          : '900 − 600 = 300 / s added to the backlog',
        960,
        970,
        30,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'overload',
  draw: drawOverload,
  cues: [
    'overload-beat-1-focus-1',
    'overload-beat-1-focus-2',
    'overload-integrate',
    'overload-beat-2-focus-1',
    'overload-beat-2-focus-2',
    'overload-drain',
  ],
};
