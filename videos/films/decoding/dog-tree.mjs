import { BRANCHES } from './fixtures.mjs';
import { coreText } from './defaults.mjs';

const leaves = BRANCHES.flatMap((branch) => branch.next);
const leafY = [276, 394, 512, 706, 824];

export function dogTree(
  ctx,
  api,
  {
    prefixes = [true, true],
    expanded = [],
    values = leaves.map(([, value]) => value),
    scores = [],
    selected = [],
    pruned = [],
    kept = [],
    cover = false,
    note = '',
  },
) {
  const { C } = api;
  api.focus.target('dog-tree', () => {
    const nodes = [
      {
        id: 'root',
        label: 'The dog',
        x: 112,
        y: 494,
        width: 252,
        height: 105,
        color: C.cyan,
        fontSize: 41,
      },
    ];
    const edges = [];
    coreText(ctx, api, 'First word', 659, 236, 31, C.muted);
    coreText(ctx, api, 'Second word given the first', 1125, 236, 31, C.muted);
    BRANCHES.forEach((branch, i) => {
      const color = pruned.includes(i) ? C.muted : kept.includes(i) ? C.yellow : C.blue;
      nodes.push({
        id: branch.word,
        label: prefixes[i] ? branch.word + ' · ' + branch.p.toFixed(2) : '?',
        x: 510,
        y: i ? 735 : 374,
        width: 300,
        height: 100,
        color,
        fontSize: 38,
      });
      edges.push({ from: 'root', to: branch.word, color });
      if (cover && !pruned.includes(i) && !expanded.some((index) => (index < 3 ? 0 : 1) === i)) {
        const id = 'covered-' + i;
        nodes.push({
          id,
          label: '?',
          x: 975,
          y: i ? 742 : 381,
          width: 300,
          height: 86,
          color: C.muted,
          fontSize: 38,
        });
        edges.push({ from: branch.word, to: id, color: C.muted });
      }
    });
    for (const i of expanded) {
      const parent = i < 3 ? 0 : 1;
      const color = selected.includes(i) ? C.yellow : pruned.includes(parent) ? C.muted : C.cyan;
      nodes.push({
        id: 'leaf-' + i,
        label: leaves[i][0] + ' · ' + values[i].toFixed(2),
        x: 955,
        y: leafY[i],
        width: 340,
        height: 84,
        color,
        fontSize: 33,
      });
      edges.push({ from: BRANCHES[parent].word, to: 'leaf-' + i, color });
    }
    api.teaching.flowGraph({ nodes, edges, textColor: C.ink });
    if (expanded.length) coreText(ctx, api, 'Two-word probability', 1585, 236, 31, C.muted);
    for (const i of expanded) {
      const y = leafY[i] + 42;
      const prefix = BRANCHES[i < 3 ? 0 : 1].p;
      const value = prefix * values[i];
      if (scores.includes(i)) {
        const w = (270 * value) / 0.45;
        api.rect(ctx, 1395, y - 16, w, 32, selected.includes(i) ? C.yellow : C.blue, undefined, 3);
        coreText(
          ctx,
          api,
          value.toFixed(3),
          1765,
          y + 11,
          34,
          selected.includes(i) ? C.yellow : C.ink,
        );
      } else {
        coreText(
          ctx,
          api,
          prefix.toFixed(2) + ' × ' + values[i].toFixed(2) + ' = ?',
          1585,
          y + 11,
          34,
          C.muted,
        );
      }
    }
    if (note) coreText(ctx, api, note, 960, 1000, 39, C.ink);
  });
}
