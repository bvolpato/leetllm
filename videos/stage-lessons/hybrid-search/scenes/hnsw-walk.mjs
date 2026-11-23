import { assertEqual, dot, graph, par, place, seq, table, to } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
import {
  graphDistances,
  lowerLayerSearch,
  queryPosition,
} from '../../../films/hybrid-search/model.mjs';
export default function hnsw(s, c) {
  const f = frame(c, { shelfVisible: false });
  const [main, right] = f.body.columns([2, 1], 'loose');
  const g = place(
    graph(
      Object.entries(graphDistances).map(([id, distance]) => ({
        id,
        label: id + ' · ' + distance,
      })),
      [
        { from: 'S', to: 'A' },
        { from: 'S', to: 'D' },
        { from: 'A', to: 'B' },
        { from: 'D', to: 'C' },
      ],
      {
        width: main.width,
        height: main.height - 80,
        fit: true,
        direction: 'LR',
        labelSize: 40,
        radius: 60,
        directed: false,
      },
    ),
    main,
  );
  const narrow = lowerLayerSearch(1),
    wide = lowerLayerSearch(3);
  assertEqual(narrow.best[0], 'B', 'narrow winner');
  assertEqual(wide.best[0], 'C', 'wide winner');
  const ledger = place(
    table(
      [
        { key: 'set', label: 'Search state' },
        { key: 'points', label: 'Nearest first', sample: 'B A D' },
      ],
      [
        { id: 'ef', set: 'ef', points: 1 },
        { id: 'current', set: 'expand', points: 'S' },
        { id: 'pending', set: 'pending', points: 'S' },
        { id: 'retained', set: 'retained', points: 'S' },
        { id: 'bridge', set: 'bridge D', points: 'unseen' },
      ],
      { width: right.width, size: 34, leading: 2.5 },
    ),
    right,
  );
  const query = place(
    label('Numbers show distance to the query at ' + queryPosition, { color: 'pink' }),
    f.foot,
  );
  const result = place(
    label('One slot: B, distance 2      Three slots: C, distance 0', { color: 'yellow' }),
    f.foot,
  );
  const opts = { duration: 0.01 };
  const cells = { duration: 0.01 };
  const travel = { duration: 1.1, color: 'yellow' };
  const hold = s.value(0);
  const expansion = (snapshot, ef) =>
    seq(
      par(
        ...['S', 'A', 'B', 'D', 'C'].map((id) =>
          g.setState(
            id,
            id === snapshot.current
              ? 'active'
              : snapshot.expanded.includes(id)
                ? 'done'
                : id === 'D' && ef === 1
                  ? 'off'
                  : 'idle',
            { ...opts, color: id === snapshot.current ? 'yellow' : 'dim' },
          ),
        ),
        ledger.setCell('current', 'points', snapshot.current, cells),
        ledger.setCell('pending', 'points', snapshot.pending.join(' ') || 'empty', cells),
        ledger.setCell('retained', 'points', snapshot.best.join(' '), cells),
      ),
      par(
        ...(snapshot.current === 'S'
          ? [
              g.send('S', 'A', travel),
              g.send('S', 'D', travel),
              ledger.setCell('bridge', 'points', ef === 1 ? 'drop D' : 'keep D', cells),
            ]
          : []),
        ...(snapshot.current === 'A' ? [g.send('A', 'B', travel)] : []),
        ...(snapshot.current === 'D'
          ? [g.send('D', 'C', travel), ledger.setCell('bridge', 'points', 'used → C', cells)]
          : []),
      ),
      hold.to(1, { duration: 0.5 }),
    );
  const [layerNames, layerPicture] = f.body.columns([1, 3], 'loose');
  const layerRegions = layerPicture.rows(3, 'normal');
  const nameRegions = layerNames.rows(3, 'normal');
  const layers = [
    ['S', 'C'],
    ['S', 'A', 'C'],
    ['S', 'A', 'B', 'D', 'C'],
  ].map((ids, i) =>
    place(
      graph(
        ids.map((id) => ({ id, label: id, color: 'dim' })),
        ids.slice(1).map((id, j) => ({ from: ids[j], to: id })),
        {
          width: layerPicture.width * (0.6 + i * 0.18),
          height: layerRegions[i].height - 20,
          direction: 'LR',
          fit: true,
          directed: false,
          radius: 30,
          labelSize: 34,
        },
      ),
      layerRegions[i],
    ),
  );
  const layerLabels = ['Sparse upper layer', 'Refine', 'All vectors'].map((words, i) =>
    place(note(words), nameRegions[i], 'left'),
  );
  const marker = dot(12, 'yellow').moveTo([
    layerPicture.left - 25,
    layerRegions[0].point('center')[1],
  ]);
  const hierarchy = [layers, layerLabels, marker];
  s.add(f.title, hierarchy);
  c.on('hnsw-descends', () =>
    s.play(
      to(marker, (n) => n.moveTo([layerPicture.left - 25, layerRegions[2].point('center')[1]]), {
        duration: 1.4,
      }),
    ),
  );
  c.swapAll('hnsw-worksheet', [g, ledger, query], { keep: [f.title] });
  c.on('hnsw-narrow', () => s.play(expansion(narrow.snapshots[0], 1)));
  c.on('narrow-path', () => s.play(seq(...narrow.snapshots.slice(1).map((v) => expansion(v, 1)))));
  c.on('hnsw-wide', () =>
    s.play(
      seq(
        par(
          ledger.setCell('ef', 'points', 3, { duration: 0.3 }),
          ...['S', 'A', 'B', 'D', 'C'].map((id) => g.setState(id, 'idle', { duration: 0.3 })),
        ),
        expansion(wide.snapshots[0], 3),
      ),
    ),
  );
  c.on('wide-path', () => s.play(seq(...wide.snapshots.slice(1, 3).map((v) => expansion(v, 3)))));
  c.on('cross-bridge', () => s.play(seq(...wide.snapshots.slice(3).map((v) => expansion(v, 3)))));
  c.swap('hnsw-found', query, result, { after: true });
}
