import { drawBox, drawCenteredText, drawFocusTarget, drawFooter, drawLine } from '../defaults.mjs';
export function drawSearchTree(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    operationProgress = cueProgress('aa-search-tree-' + currentBeat),
    count = (u, n) => Math.min(n, Math.floor(u * n + 1e-8));
  const paintMechanism = () => {
    const root = [960, 355],
      pts = [
        [350, 650],
        [960, 650],
        [1570, 650],
      ],
      names = ['simulate rollback', 'inspect CI diff', 'simulate retry'];
    drawBox(ctx, api, 'R1842 sandbox root', 680, 290, 560, 90, themeColors.yellow);
    pts.forEach(([x, y], i) => {
      drawLine(
        ctx,
        api,
        root[0],
        root[1] + 30,
        x,
        y - 20,
        i === count(operationProgress, 3) % 3 ? themeColors.cyan : themeColors.muted,
        3,
      );
      drawBox(
        ctx,
        api,
        names[i],
        x - 220,
        y,
        440,
        90,
        [themeColors.pink, themeColors.blue, themeColors.cyan][i],
      );
      if (currentBeat === 2) {
        drawBox(ctx, api, 'own snapshot ' + (i + 1), x - 190, 810, 380, 72, themeColors.yellow);
        drawCenteredText(ctx, api, 'files + tool state', x, 930, 26, themeColors.muted);
      }
    });
    if (currentBeat === 0)
      drawCenteredText(
        ctx,
        api,
        ['Select a branch', 'Expand alternatives', 'Evaluate environment result', 'Back up return'][
          Math.min(3, count(operationProgress, 4))
        ],
        960,
        245,
        31,
        themeColors.cyan,
      );
    else if (currentBeat === 1)
      drawCenteredText(
        ctx,
        api,
        'Next simulation: select a branch, then back up its return',
        960,
        245,
        31,
        themeColors.cyan,
      );
    else
      drawCenteredText(
        ctx,
        api,
        'Restore the files and tool state for each new branch',
        960,
        245,
        30,
        themeColors.pink,
      );
    drawFooter(ctx, api, 'Explore in the sandbox. The host authorizes the selected action.');
  };
  drawFocusTarget(ctx, api, 'aa-search-tree-mechanism', paintMechanism);
}
export default {
  id: 'search-tree',
  draw: drawSearchTree,
  cues: ['aa-search-tree-0', 'aa-search-tree-1', 'aa-search-tree-2'],
};
