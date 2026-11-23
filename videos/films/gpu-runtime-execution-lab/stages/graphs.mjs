import { cueClock } from '../clock.mjs';
import { graphCost, graphPrices } from '../arithmetic.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawGraphs(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  if (state.beat === 0) {
    const count = Math.floor(4 * p('graphs-eager'));
    const captured = p('graphs-capture') === 1;
    const launched = p('graphs-launch') > 0;
    const xs = [470, 845, 1220, 1595];
    api.focus.target('graph-submissions', () => {
      txt('Host', 145, 395, 43, C.blue);
      if (launched) {
        api.rect(ctx, 330, 315, 280, 104, C.panel, C.blue, 12);
        txt('launch graph', 470, 381, 37, C.blue, 'center');
        api.arrow(ctx, 470, 431, 470, 596, C.blue, 4);
      } else {
        xs.forEach((x, i) => {
          api.rect(ctx, x - 116, 320, 232, 98, C.panel, i < count ? C.blue : C.muted, 12);
          txt('call ' + (i + 1), x, 385, 37, i < count ? C.blue : C.muted, 'center');
          if (i < count) api.arrow(ctx, x, 432, x, 598, C.blue, 4);
        });
      }
    });
    api.focus.target('graph-chain', () => {
      txt('GPU', 145, 694, 43, C.cyan);
      ['copy', '2x + 1', 'square', 'sum'].forEach((name, i) => {
        const x = xs[i];
        api.rect(ctx, x - 122, 620, 244, 114, C.panel, C.cyan, 12);
        txt(name, x, 697, 49, C.ink, 'center');
        if (i < 3) api.arrow(ctx, x + 132, 676, xs[i + 1] - 136, 676, C.cyan, 4);
      });
      if (captured) {
        api.line(ctx, xs[0] - 121, 764, xs[3] + 121, 764, C.cyan, 3);
        txt('Recorded operations and dependencies', 1030, 832, 37, C.cyan, 'center');
      }
    });
    txt(
      launched
        ? '1 host launch     ·     4 dependent operations'
        : 'Eager submission   ·   one call per operation in this model',
      960,
      969,
      39,
      C.ink,
      'center',
    );
    return;
  }

  const plot = api.teaching.axes({
    x: 245,
    y: 355,
    width: 1160,
    height: 475,
    xDomain: [0, 4000],
    yDomain: [0, 80],
    xTicks: [0, 1000, 2000, 3000, 4000],
    yTicks: [0, 20, 40, 60, 80],
    xLabel: 'compatible runs',
    yLabel: 'total time (ms)',
    fontSize: 30,
  });
  const compare = (key, target, color, progress, description, note, y) =>
    api.focus.target(target, () => {
      txt(description, 1490, y, 37, color);
      txt(note, 1490, y + 56, 29, C.muted);
      if (progress > 0) {
        const n = 4000;
        api.teaching.curve({
          plot,
          points: [
            { x: 0, y: graphCost(0)[key] },
            { x: n, y: graphCost(n)[key] },
          ],
          color,
          width: 5,
        });
        const at = plot.point(0, graphCost(0)[key]);
        api.circle(ctx, at.x, at.y, 11, color);
      }
    });
  compare(
    'eager',
    'graphs-curve-graphs',
    C.blue,
    p('graphs-eager-cost'),
    'Eager',
    graphPrices.eagerUs + ' µs per run',
    415,
  );
  compare(
    'graph',
    'graphs-curve-graphs-2',
    C.cyan,
    p('graphs-beat-2-focus-2'),
    'Replay',
    graphPrices.replayUs + ' µs per run',
    616,
  );
  if (p('graphs-beat-2-focus-2') > 0) txt('Setup   12 ms', 1490, 728, 30, C.cyan);
  txt('Assumed constant costs for the same work', 960, 986, 32, C.muted, 'center');
}
export default {
  id: 'graphs',
  draw: drawGraphs,
  cues: [
    'graphs-eager',
    'graphs-capture',
    'graphs-launch',
    'graphs-eager-cost',
    'graphs-beat-2-focus-2',
    'graphs-cross',
  ],
};
