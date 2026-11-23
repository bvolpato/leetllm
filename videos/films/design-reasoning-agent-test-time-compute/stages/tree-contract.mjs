import { sentence } from '../construction.mjs';
import { constructionModel, search } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
} from '../defaults.mjs';
export function drawTreeContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('tree-contract', state),
    progress = (beat, n) => sentence(state, 'tree-contract', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(ctx, api, 'Completed plans have a separate retained lifetime');
    const depth = !currentBeat ? 1 : Math.min(3, Math.floor(progress(1, 1) * 3 + 1e-8)),
      result = search(depth);
    drawConstructionGrid(
      ctx,
      api,
      [
        ['hard condition', 'proxy', 'eligible?'],
        ['nightly runtime', 0.12, 'NO'],
        ['unfixed advisory', 0.39, 'NO'],
      ],
      160,
      360,
      800,
      245,
      themeColors.blue,
      28,
    );
    const terminal = drawConstructionBox(
      ctx,
      api,
      result.winner ? 'Completed: sanitizer patch · .96' : 'Completed result: none',
      1110,
      385,
      650,
      140,
      result.winner ? themeColors.green : themeColors.muted,
      29,
    );
    drawConstructionBox(
      ctx,
      api,
      depth >= 2
        ? 'Unfinished frontier exhausted · depth ' + depth
        : 'Unfinished beam · depth ' + depth,
      1110,
      630,
      650,
      125,
      themeColors.cyan,
      29,
    );
    if (currentBeat && done(1, 1)) {
      drawConstructionBox(
        ctx,
        api,
        'Depth 2 → 3: same completed plan retained',
        170,
        805,
        1580,
        100,
        themeColors.green,
        31,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Discarded branches do not become backtracking state; incomplete proxy leaders cannot replace a completed plan.',
    );
  }
}
export default {
  id: 'tree-contract',
  draw: drawTreeContract,
  cues: [
    'ra-tree-contract-0-0',
    'ra-tree-contract-0-1',
    'ra-tree-contract-0-2',
    'ra-tree-contract-0-3',
    'ra-tree-contract-1-0',
    'ra-tree-contract-1-1',
    'ra-tree-contract-1-2',
    'ra-tree-contract-1-3',
    'ra-tree-contract-1-4',
  ],
};
