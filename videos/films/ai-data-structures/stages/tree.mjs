import { clamp, mix, scoreRows } from '../arithmetic.mjs';
import { q, treeWalkState } from '../construction.mjs';
import { drawCard, drawReference, drawText, drawTransfer, withFocus } from '../defaults.mjs';
export function drawTree(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  withFocus(ctx, api, 'topic-tree', () => {
    const model = treeWalkState(progress('tree-walk', 0)),
      root = drawCard(ctx, api, 'Support notes', 780, 255, 360, 80, themeColors.blue),
      billing = drawCard(ctx, api, 'Billing', 400, 460, 350, 80, themeColors.cyan),
      access = drawCard(ctx, api, 'Access', 1300, 460, 350, 80, themeColors.blue);
    drawTransfer(ctx, api, root, billing, themeColors.cyan, model.branch);
    drawTransfer(ctx, api, root, access);
    [
      [0, 180],
      [2, 530],
      [3, 880],
    ].forEach(([id, x], i) => {
      const leaf = drawReference(
        ctx,
        api,
        id,
        x,
        730,
        model.visited.includes(id) ? themeColors.green : themeColors.blue,
      );
      drawTransfer(
        ctx,
        api,
        billing,
        leaf,
        themeColors.cyan,
        id === model.active ? model.arrival : undefined,
      );
      if (model.visited.includes(id))
        drawCard(
          ctx,
          api,
          'M' + id + ' · score ' + scoreRows().find((row) => row.id === id).score,
          500 + i * 300,
          900,
          230,
          78,
          themeColors.green,
          1,
          25,
        );
      else if (id === model.active && model.branch >= 1 && model.arrival > 0)
        drawReference(
          ctx,
          api,
          id,
          mix(x, 500 + i * 300, clamp(model.arrival / 0.7)),
          mix(812, 900, clamp((model.arrival - 0.7) / 0.3)),
          themeColors.yellow,
        );
    });
    drawTransfer(ctx, api, access, drawReference(ctx, api, 1, 1360, 730, themeColors.blue));
    drawText(
      ctx,
      api,
      model.visited.length === 3
        ? 'Candidate filter: {M0, M2, M3} · Access M1 excluded'
        : 'Collecting the Billing candidate filter',
      960,
      1015,
      29,
      themeColors.green,
      'center',
    );
  });
}
export default {
  id: 'tree',
  draw: drawTree,
  cues: ['tree-walk'],
};
