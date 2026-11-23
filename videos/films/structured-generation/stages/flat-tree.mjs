import { treeRelationships } from '../model.mjs';
import { arrow, box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawFlatTree(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-flat-tree-mechanism', () => {
      const changed = done('sg-tree-change'),
        nodes = changed
          ? [
              {
                id: 'root',
                parent: null,
              },
              {
                id: 'a',
                parent: 'b',
              },
              {
                id: 'b',
                parent: 'a',
              },
            ]
          : [
              {
                id: 'root',
                parent: null,
              },
              {
                id: 'n1',
                parent: 'root',
              },
              {
                id: 'n2',
                parent: 'root',
              },
            ],
        z = treeRelationships(nodes),
        pos = changed
          ? [
              [450, 400],
              [1130, 400],
              [1510, 650],
            ]
          : [
              [960, 350],
              [450, 650],
              [1430, 650],
            ];
      nodes.forEach((n, i) =>
        box(
          ctx,
          api,
          'Node ' + n.id,
          ['parent: ' + (n.parent ?? 'null')],
          pos[i][0] - 200,
          pos[i][1],
          400,
          130,
          themeColors.blue,
        ),
      );
      if (changed) {
        api.line(ctx, 1335, 465, 1770, 465, themeColors.cyan, 3);
        api.line(ctx, 1770, 465, 1770, 715, themeColors.cyan, 3);
        arrow(ctx, api, 1770, 715, 1725, 715);
        api.line(ctx, 1295, 715, 850, 715, themeColors.cyan, 3);
        api.line(ctx, 850, 715, 850, 465, themeColors.cyan, 3);
        arrow(ctx, api, 850, 465, 915, 465);
        label(
          ctx,
          api,
          'Reached from root: ' + z.visited.join(', '),
          560,
          835,
          themeColors.yellow,
          30,
        );
      } else nodes.slice(1).forEach((n, k) => arrow(ctx, api, 960, 495, pos[k + 1][0], 630));
      if (done('sg-tree-reject'))
        label(ctx, api, 'Reject: ' + z.reason, 960, 915, themeColors.pink, 31);
      constructionFooter(
        ctx,
        api,
        changed
          ? 'Every parent ID exists, but root traversal cannot reach the disconnected cycle.'
          : 'Root traversal reaches both children through their parent relationships.',
      );
    });
  }
}
export default {
  id: 'flat-tree',
  draw: drawFlatTree,
  cues: [
    'sg-flat-tree-0',
    'sg-tree-valid',
    'sg-flat-tree-1',
    'sg-tree-change',
    'sg-tree-reject',
    'sg-flat-tree-2',
  ],
};
