import { coreBox, coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawTieContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-tie-contract-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-tie-contract-mechanism', () => {
    coreTitle(ctx, api, 'The actual tie policy determines the retained identities');
    const logits = [2, 2, 2, 0],
      threshold = currentBeat > 0 || done('threshold-ties');
    coreVector(ctx, api, logits, ['ID 0', 'ID 1', 'ID 2', 'ID 3'], 230, 370, 1460);
    coreText(ctx, api, 'Exact count k = 1', 465, 590, 33, themeColors.blue);
    coreText(ctx, api, 'Threshold k = 1', 1425, 590, 33, themeColors.cyan);
    logits.forEach((v, i) => {
      const x = 210 + i * 170;
      coreBox(
        ctx,
        api,
        i === 0 ? 'keep ' + i : 'drop ' + i,
        x,
        665,
        145,
        95,
        i === 0 ? themeColors.blue : themeColors.muted,
        23,
      );
      const xx = 1120 + i * 170;
      coreBox(
        ctx,
        api,
        threshold ? (v >= 2 ? 'keep ' + i : 'drop ' + i) : '?',
        xx,
        665,
        145,
        95,
        threshold && v >= 2 ? themeColors.cyan : themeColors.muted,
        23,
      );
    });
    if (currentBeat > 1 || done('tie-normalized')) {
      coreText(ctx, api, 'Normalized support: [1, 0, 0, 0]', 465, 885, 28, themeColors.blue);
      coreText(ctx, api, 'Normalized support: [1/3, 1/3, 1/3, 0]', 1425, 885, 28, themeColors.cyan);
    }
    coreFoot(
      ctx,
      api,
      currentBeat === 2
        ? 'An unnormalized sampling weight API and a reported probability row have distinct requirements.'
        : 'Both rules are valid when their count and tie behavior are declared.',
    );
    return;
  });
}
export default {
  id: 'tie-contract',
  draw: drawTieContract,
  cues: [
    'dec-tie-contract-1',
    'dec-threshold-ties',
    'dec-tie-contract-2',
    'dec-tie-normalized',
    'dec-tie-contract-3',
  ],
};
