import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  table,
  place,
  beside,
  boxOf,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  circle,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
  polyline,
} from 'vizmatic/stage';
import {
  robustUnit,
  cosine,
  signCode,
  dot as inner,
  l2,
} from '../../../films/embedding-geometry/arithmetic.mjs';

import { GRAPH } from '../../../films/embedding-geometry/fixtures.mjs';
import { graphSearch } from '../../../films/embedding-geometry/model.mjs';
export default function graph(s, c) {
  const [left, right] = area.columns([3, 2], 'loose');
  const ax = place(
    axes({
      x: [-0.5, 6],
      y: [-1, 3],
      width: 900,
      height: 554,
      xStep: 1,
      yStep: 1,
      labelSize: 34,
      labels: false,
      grid: true,
      tips: false,
    }),
    left,
  );
  const nodes = Object.entries(GRAPH.points).map(([id, v]) => ({
    id,
    v,
    mark: dot(12, 'blue').moveTo(ax.world(...v)),
  }));
  const edges = Object.entries(GRAPH.edges).flatMap(([id, ns]) =>
    ns
      .filter((n) => id < n)
      .map((n) =>
        line(ax.world(...GRAPH.points[id]), ax.world(...GRAPH.points[n]), {
          stroke: 'dim',
          width: 5,
        }),
      ),
  );
  const names = nodes.map((n) => {
    const name = beside(label(n.id, { color: 'blue' }), n.mark, 'above', 'wide');
    if (n.id === 'A')
      name.moveTo([boxOf(n.mark).left - boxOf(name).width / 2 - 24, boxOf(name).cy]);
    return name;
  });
  const query = dot(9, 'cyan').moveTo(ax.world(...GRAPH.query));
  const token = dot(11, 'yellow').moveTo(ax.world(...GRAPH.points.B));
  const wideToken = dot(11, 'yellow').moveTo(ax.world(...GRAPH.points.B));
  const [top, mid, foot] = right.rows([2, 4, 2], 'wide');
  const details = place(
    column([label('query = 5, 2', { color: 'cyan' }), note('supplied graph, entry B')], {
      gap: 'normal',
    }),
    top,
  );
  const tab = place(
    table(
      [
        { key: 'ef', label: 'retained' },
        { key: 'path', label: 'route to hit', sample: 'B → A → C → E' },
        { key: 'd2', label: 'L2²', sample: '0.01' },
      ],
      [
        { id: 'one', ef: 1, path: 'B', d2: null },
        { id: 'three', ef: 3, path: 'B', d2: null },
      ],
      { size: 34, width: mid.width },
    ),
    mid,
  );
  const result = place(note('search-list size is not a visited-node cap'), foot);
  const title = heading(c.title);
  const tierRows = area.inset('wide').rows(3, 'wide');
  const layers = [['B'], ['B', 'C'], ['A', 'B', 'C', 'D', 'E']];
  const tiers = layers.map((ids, i) => {
    const [name, points] = tierRows[i].columns([1, 4], 'loose');
    const sites = points.columns(5, 'wide');
    return [
      place(label('Layer ' + (2 - i), { size: 42 }), name, 'right'),
      ...ids.map((id) =>
        place(label(id, { color: 'blue', size: 50 }), sites[id.charCodeAt(0) - 65]),
      ),
    ];
  });
  const basePicture = [
    ax,
    edges,
    ...nodes.map((n) => n.mark),
    ...names,
    query,
    token,
    details,
    tab,
    result,
  ];
  s.add(title, tiers[2]);
  c.show('layers', [...tiers[0], ...tiers[1]]);
  c.swapAll('base', basePicture, { keep: [title] });
  c.on('greedy', () =>
    s.play(
      to(token, (n) => n.moveTo(ax.world(...GRAPH.points.D)), { duration: 1.5 }),
      tab.setCell('one', 'path', { value: 'B → D' }),
    ),
  );
  c.after('stop', () =>
    s.play(tab.setCell('one', 'd2', { value: graphSearch(1).distanceSquared.toFixed(0) }), {
      duration: 0.5,
    }),
  );
  c.swap('restart', token, wideToken);
  c.on('wider', () =>
    s.play(
      to(wideToken, (n) => n.moveTo(ax.world(...GRAPH.points.A)), { duration: 1.3 }),
      tab.setCell('three', 'path', { value: 'B → A' }),
    ),
  );
  c.on('c', () =>
    s.play(
      to(wideToken, (n) => n.moveTo(ax.world(...GRAPH.points.C)), { duration: 1.2 }),
      tab.setCell('three', 'path', { value: 'B → A → C' }),
    ),
  );
  c.on('e', () =>
    s.play(
      to(wideToken, (n) => n.moveTo(ax.world(...GRAPH.points.E)), { duration: 1.2 }),
      tab.setCell('three', 'path', { value: 'B → A → C → E' }),
    ),
  );
  c.after('found', () =>
    s.play(tab.setCell('three', 'd2', { value: graphSearch(3).distanceSquared.toFixed(2) }), {
      duration: 0.5,
    }),
  );
}
