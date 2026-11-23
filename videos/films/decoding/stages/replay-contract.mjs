import { coreBox, coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawReplayContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-replay-contract-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-replay-contract-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'The same seed does not freeze newly computed logits'
        : 'Choose the level of reproducibility you need',
    );
    if (currentBeat === 0) {
      const rows = [
        [1.0001, 1],
        [0.9999, 1],
      ];
      rows.forEach((r, i) => {
        const y = 410 + i * 260;
        coreVector(
          ctx,
          api,
          r.map((v) => v.toFixed(4)),
          ['token A', 'token B'],
          200,
          y,
          960,
        );
        coreBox(
          ctx,
          api,
          done(i ? 'replay-second' : 'replay-first')
            ? 'greedy → ' + (i ? 'B' : 'A')
            : 'selection pending',
          1280,
          y,
          440,
          85,
          themeColors.yellow,
        );
      });
      coreText(ctx, api, 'Seed receipt unchanged', 960, 340, 31, themeColors.blue);
    } else {
      const names = ['same text', 'same token IDs', 'bitwise state'],
        limits = [
          'decoded bytes only',
          'tokenization + selection',
          'hardware + kernels + schedule',
        ];
      names.forEach((n, i) => {
        const y = 390 + i * 180;
        coreBox(ctx, api, n, 200, y, 500, 95, themeColors.blue);
        api.arrow(ctx, 750, y + 47, 980, y + 47, themeColors.cyan, 3);
        coreBox(
          ctx,
          api,
          limits[i],
          1050,
          y,
          650,
          95,
          i < Math.floor(u * 3.999) ? themeColors.cyan : themeColors.muted,
          29,
        );
      });
    }
    coreFoot(
      ctx,
      api,
      'Version, hardware, scheduling and supported batch-invariance controls belong in the replay receipt.',
    );
    return;
  });
}
export default {
  id: 'replay-contract',
  draw: drawReplayContract,
  cues: [
    'dec-replay-contract-1',
    'dec-replay-first',
    'dec-replay-second',
    'dec-replay-contract-2',
    'dec-replay-contract-3',
  ],
};
