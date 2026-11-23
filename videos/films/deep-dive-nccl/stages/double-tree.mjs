import { clamp } from '../arithmetic.mjs';
import { done, sentence } from '../construction.mjs';
import {
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawDoubleTree(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'double-tree', bi, si),
      resultComplete = (bi, si) => done(state, 'double-tree', bi, si);
    const ranks = [0, 1, 2, 3];
    {
      chapterHeading(ctx, api, 'Two half-payload trees balance the forwarding ranks');
      const trees = [
        {
          xs: [360, 190, 530, 530],
          ys: [390, 600, 600, 805],
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
          ],
          color: themeColors.blue,
          internal: [0, 1],
        },
        {
          xs: [1330, 1160, 1500, 1500],
          ys: [805, 600, 600, 390],
          edges: [
            [3, 2],
            [3, 1],
            [2, 0],
          ],
          color: themeColors.cyan,
          internal: [2, 3],
        },
      ];
      trees.forEach((tree, ti) => {
        chapterText(
          ctx,
          api,
          ti ? 'Payload half B' : 'Payload half A',
          ti ? 1350 : 400,
          335,
          30,
          tree.color,
          'center',
        );
        const grown = currentBeat > 0 ? 1 : progress(0, 3),
          nodes = ranks.map((r) =>
            chapterRectangle(
              ctx,
              api,
              tree.xs[r] - 68,
              tree.ys[r] - 38,
              136,
              76,
              themeColors.panel,
              tree.internal.includes(r) ? tree.color : themeColors.muted,
            ),
          );
        tree.edges.forEach(([a, z], i) => {
          const q = clamp(grown * 3 - i);
          if (q === 0) return;
          const from = api.anchor(nodes[a], nodes[z], 12),
            to = api.anchor(nodes[z], nodes[a], 12);
          chapterLine(
            ctx,
            api,
            from.x,
            from.y,
            from.x + (to.x - from.x) * q,
            from.y + (to.y - from.y) * q,
            tree.color,
            4,
          );
        });
        ranks.forEach((r) =>
          chapterText(
            ctx,
            api,
            'R' + r,
            tree.xs[r],
            tree.ys[r] + 11,
            30,
            tree.internal.includes(r) ? tree.color : themeColors.ink,
            'center',
          ),
        );
      });
      if (currentBeat === 0 && resultComplete(0, 3))
        chapterText(
          ctx,
          api,
          'Internal A: R0/R1     Internal B: R2/R3',
          960,
          965,
          32,
          themeColors.green,
          'center',
        );
      if (currentBeat === 1) {
        const warn = resultComplete(1, 3);
        chapterText(
          ctx,
          api,
          warn
            ? 'Unsupported forced LL128 can corrupt data'
            : 'Algorithm / protocol / hardware eligibility are separate',
          960,
          935,
          30,
          warn ? themeColors.pink : themeColors.yellow,
          'center',
        );
        if (resultComplete(1, 4))
          chapterText(
            ctx,
            api,
            'Restore supported automatic selection',
            960,
            990,
            30,
            themeColors.green,
            'center',
          );
      }
      chapterNote(ctx, api, 'Supplied complementary binary trees; historical design principle');
    }
  });
}
export default {
  id: 'double-tree',
  draw: drawDoubleTree,
  cues: [
    'nc-double-tree-b0-s0',
    'nc-double-tree-b0-s1',
    'nc-double-tree-b0-s2',
    'nc-double-tree-b0-s3',
    'nc-double-tree-b1-s0',
    'nc-double-tree-b1-s1',
    'nc-double-tree-b1-s2',
    'nc-double-tree-b1-s3',
    'nc-double-tree-b1-s4',
  ],
};
