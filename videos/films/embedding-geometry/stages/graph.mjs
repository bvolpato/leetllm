import { GRAPH } from '../fixtures.mjs';
import { graphSearch } from '../model.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawGraph(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    heading(ctx, api, 'Supplied graph · query [5,2] · base entry B · squared Euclidean scores');
    geometryText(
      ctx,
      api,
      'A [0,0] · B [3,0] · C [1,2] · D [4,0] · E [5,2.1]',
      960,
      310,
      25,
      themeColors.muted,
      'center',
    );
    const a = api.teaching.axes({
        x: 260,
        y: currentBeat === 0 ? 600 : 370,
        width: 1100,
        height: currentBeat === 0 ? 270 : 520,
        xDomain: [-0.4, 5.5],
        yDomain: [-0.3, 2.6],
        xTicks: [],
        yTicks: [],
        equalUnits: true,
        xLabel: 'coordinate0',
        yLabel: '',
      }),
      ef = currentBeat < 2 ? 1 : 3,
      run = graphSearch(ef),
      q = cueProgress(),
      n =
        currentBeat === 0
          ? 0
          : Math.min(run.events.length, Math.floor(q * (run.events.length + 1))),
      event = n ? run.events[n - 1] : null,
      expanded = run.events.slice(0, n).map((e) => e.id);
    const point = (id) => a.point(...GRAPH.points[id]);
    for (const [from, ns] of Object.entries(GRAPH.edges))
      for (const to of ns)
        if (from < to) {
          const u = point(from),
            v = point(to),
            dx = v.x - u.x,
            dy = v.y - u.y,
            len = Math.hypot(dx, dy);
          line(
            ctx,
            api,
            u.x + (dx / len) * 18,
            u.y + (dy / len) * 18,
            v.x - (dx / len) * 18,
            v.y - (dy / len) * 18,
            expanded.includes(from) && expanded.includes(to) ? themeColors.cyan : themeColors.muted,
            3,
          );
        }
    for (const [id, v] of Object.entries(GRAPH.points)) {
      const z = point(id),
        col = event?.best.includes(id)
          ? themeColors.yellow
          : expanded.includes(id)
            ? themeColors.cyan
            : themeColors.blue;
      api.circle(ctx, z.x, z.y, 13, col);
      geometryText(ctx, api, id, z.x - (id === 'C' ? 30 : 0), z.y - 30, 28, col, 'center');
    }
    const query = a.point(...GRAPH.query);
    api.circle(ctx, query.x, query.y, 4, themeColors.pink);
    geometryText(ctx, api, 'Q', query.x + 40, query.y + 15, 25, themeColors.pink);
    if (currentBeat === 0) {
      cell(ctx, api, 'Upper A: d²29', 320, 355, 340, 75, themeColors.blue);
      cell(ctx, api, 'Upper B: d²8', 920, 355, 340, 75, themeColors.cyan);
      api.arrow(ctx, 690, 393, 890, 393, themeColors.cyan, 4);
      if (q > 0.5) {
        const z = point('B');
        api.arrow(ctx, 1090, 455, z.x, z.y - 100, themeColors.yellow, 3);
      }
      geometryText(
        ctx,
        api,
        'Upper greedy improvement · descend at the same node',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      geometryText(ctx, api, 'Retain ef=' + ef, 1600, 390, 37, themeColors.yellow, 'center');
      geometryText(
        ctx,
        api,
        'Expand: ' + (expanded.join(' → ') || '?'),
        960,
        1010,
        32,
        themeColors.cyan,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Best: ' + (event?.best.join(', ') ?? 'B'),
        1600,
        585,
        31,
        themeColors.ink,
        'center',
      );
      if (
        n === run.events.length &&
        cue(currentBeat === 1 ? 'graph-return-one' : 'graph-return-three') > 0.6
      )
        api.focus.target('graph-outcome', () =>
          geometryText(
            ctx,
            api,
            'Return ' + run.winner + ' · d²' + run.distanceSquared.toFixed(2),
            1600,
            800,
            35,
            ef === 1 ? themeColors.pink : themeColors.green,
            'center',
          ),
        );
      else
        api.focus.target('graph-outcome', () =>
          geometryText(
            ctx,
            api,
            'Frontier still active',
            1600,
            800,
            30,
            themeColors.muted,
            'center',
          ),
        );
    }
    return;
  }
  return;
}
export default {
  id: 'graph',
  draw: drawGraph,
  cues: ['graph-return-one', 'graph-return-three'],
};
