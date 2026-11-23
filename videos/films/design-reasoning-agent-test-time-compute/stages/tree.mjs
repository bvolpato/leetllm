import { invalid, scores } from '../fixtures.mjs';
import { sentence } from '../construction.mjs';
import { sampleModel, search } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawTree(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  const link = (a, b, color = themeColors.cyan, progress = modelState.q) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: b,
        opacity: 1,
      },
      color,
      progress,
      particle: {
        radius: 8,
        fill: themeColors.yellow,
      },
    });
  {
    const root = api.focus.target('tree-parser-repair', () =>
        drawOriginalCard(ctx, api, 'Parser repair', 740, 270, 440, themeColors.blue, 90),
      ),
      nodes = {};
    if (modelState.depth >= 1) {
      ['Pin parser v2', 'Pin parser nightly', 'Keep parser v1'].forEach((name, i) => {
        nodes[name] = api.focus.target('tree-branch-' + i, () =>
          drawOriginalCard(
            ctx,
            api,
            name + (invalid[name] ? ' · FAIL' : ' · ' + scores[name].toFixed(2)),
            145 + i * 570,
            455,
            490,
            invalid[name] ? themeColors.pink : themeColors.cyan,
            100,
            25,
          ),
        );
        link(root, nodes[name], invalid[name] ? themeColors.pink : themeColors.cyan);
      });
    }
    if (modelState.depth >= 1)
      drawOriginalText(
        ctx,
        api,
        'Nightly fails the runtime floor',
        960,
        655,
        25,
        themeColors.pink,
        'center',
      );
    if (modelState.depth >= 2) {
      const leaves = [
        'Add compatibility shim',
        'Call removed API',
        'Patch sanitizer',
        'Defer security fix',
      ];
      leaves.forEach((name, i) => {
        const node = api.focus.target('tree-leaf-' + i, () =>
          drawOriginalCard(
            ctx,
            api,
            name,
            90 + i * 460,
            765,
            420,
            invalid[name] ? themeColors.pink : themeColors.green,
            100,
            24,
          ),
        );
        link(
          nodes[i < 2 ? 'Pin parser v2' : 'Keep parser v1'],
          node,
          invalid[name] ? themeColors.pink : themeColors.green,
        );
        api.focus.target('tree-leaf-' + i, () =>
          drawOriginalText(
            ctx,
            api,
            invalid[name] ? 'FAIL · ' + invalid[name] : 'Complete · ' + scores[name].toFixed(2),
            300 + i * 460,
            920,
            25,
            invalid[name] ? themeColors.pink : themeColors.green,
            'center',
          ),
        );
      });
    }
    const result = search(modelState.depth),
      winnerReady = state.beat > 0 && sentence(state, 'tree', 1, 2) === 1;
    api.focus.target('tree-complete-winner', () =>
      drawOriginalText(
        ctx,
        api,
        result.winner && winnerReady
          ? 'Winner: ' + result.winner.name
          : 'Beam width 2 · complete plans retained: ' + result.completed.length,
        960,
        1020,
        30,
        result.winner && winnerReady ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'tree',
  draw: drawTree,
  cues: [
    'tree-beat-1-focus-1',
    'ra-tree-0-0',
    'ra-tree-0-1',
    'ra-tree-0-2',
    'ra-tree-0-3',
    'tree-failed-leaves',
    'tree-complete-plans',
    'tree-completed-winner',
    'ra-tree-1-0',
    'ra-tree-1-1',
    'ra-tree-1-2',
    'ra-tree-1-3',
  ],
};
