import { graph, place, tree } from 'vizmatic/stage';
import { heading, area, label, mono } from '../../kit-narrated.mjs';
import { thoughtTraversal } from '../../../films/beam-search/arithmetic.mjs';
import { mctsBackupFrame } from '../../../films/beam-search/construction.mjs';

export default function thoughtSearch(s, c) {
  const [header, body, footer] = area.rows([1, 4.5, 1.5], 'wide');
  const regions = body.columns(2, 'loose');
  const spec = {
    id: 'n0',
    label: 'root',
    children: [
      {
        id: 'n1',
        label: 'A',
        children: [
          { id: 'n3', label: 'A1' },
          { id: 'n4', label: 'A2' },
        ],
      },
      {
        id: 'n2',
        label: 'B',
        children: [
          { id: 'n5', label: 'B1' },
          { id: 'n6', label: 'B2' },
        ],
      },
    ],
  };
  const searches = regions.map((region) =>
    place(
      tree(spec, { width: region.width * 0.88, labelSize: 34, radius: 42, levelGap: 160 }),
      region,
    ),
  );
  const headings = ['Breadth first', 'Depth first'].map((text, i) =>
    place(label(text), header.columns(2, 'loose')[i]),
  );
  const bookkeeping = mctsBackupFrame({ beat: 2, beatP: 1 });
  const prior = mctsBackupFrame({ beat: 2, beatP: 0 });
  const mcts = place(
    graph(
      [
        {
          id: 'root',
          label: 'parent',
          value: `n ${prior.parent.visits} · sum ${prior.parent.rewardSum.toFixed(1)}`,
          note: `mean ${prior.parent.mean.toFixed(3)}`,
          width: 430,
          height: 150,
        },
        {
          id: 'A',
          label: 'A',
          value: `n ${prior.nodes[0].visits} · mean ${prior.nodes[0].mean.toFixed(3)}`,
          note: '',
          width: 440,
          height: 150,
        },
        {
          id: 'B',
          label: 'B',
          value: `n ${prior.nodes[1].visits} · mean ${prior.nodes[1].mean.toFixed(3)}`,
          note: '',
          width: 440,
          height: 150,
        },
      ],
      [
        { from: 'root', to: 'A' },
        { from: 'root', to: 'B' },
      ],
      {
        direction: 'TB',
        width: body.width * 0.8,
        height: body.height * 0.9,
        fit: true,
        labelSize: 34,
        valueSize: 34,
        edgeLabelSize: 34,
        token: 'root',
      },
    ),
    body,
  );
  const formula = place(
    mono('U = mean reward + √(ln parent visits / child visits)', { size: 34 }),
    footer,
  );
  s.add(heading(c.title), [searches, headings]);
  c.on('thought-search-build-0', () =>
    s.play(...searches.map((search) => search.path(['n1', 'n2'], { duration: 0.8 }))),
  );
  for (const [side, kind] of ['breadth', 'depth'].entries()) {
    c.on(side === 0 ? 'breadth-first' : 'thought-search-build-1', () => {
      for (let visits = 1; visits <= 5; visits++) {
        const node = thoughtTraversal(kind, visits).current;
        s.play(searches[side].path(`n${node}`, { duration: 0.65 }));
      }
    });
  }
  c.swap(2, [searches, headings], mcts);
  c.show(2, formula);
  c.on('compare-scores', () =>
    s.play(
      mcts.setNote('A', `prior U = ${prior.nodes[0].selectionScore.toFixed(3)}`, { duration: 0.7 }),
      mcts.setNote('B', `prior U = ${prior.nodes[1].selectionScore.toFixed(3)}`, { duration: 0.7 }),
    ),
  );
  c.after('mcts-select', () => s.play(mcts.go('B', { duration: 0.8 })));
  const reward = place(
    mono(`Reward from this visit   +${bookkeeping.reward.toFixed(1)}`, { color: 'yellow' }),
    footer,
  );
  c.swap('thought-search-build-2', formula, reward);
  c.after('mcts-child-mean', () => {
    s.play(
      mcts.setValue(
        'B',
        `n ${bookkeeping.nodes[1].visits} · mean ${bookkeeping.nodes[1].mean.toFixed(3)}`,
        { duration: 0.7 },
      ),
      mcts.setNote(
        'B',
        `sum ${bookkeeping.nodes[1].rewardSum.toFixed(1)} · reward +${bookkeeping.reward.toFixed(1)}`,
        { duration: 0.7 },
      ),
    );
  });
  c.on('send-reward', () => s.play(mcts.send('B', 'root', { duration: 1.1 })));
  c.after('mcts-parent-mean', () => {
    s.play(
      mcts.setValue(
        'root',
        `n ${bookkeeping.parent.visits} · sum ${bookkeeping.parent.rewardSum.toFixed(1)}`,
        { duration: 0.7 },
      ),
      mcts.setNote('root', `mean ${bookkeeping.parent.mean.toFixed(3)}`, { duration: 0.7 }),
    );
  });
}
