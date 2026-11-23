import { coreBox, coreFoot, coreText, coreTitle } from '../defaults.mjs';
export function drawCompletedScore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-completed-score-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-completed-score-mechanism', () => {
    coreTitle(ctx, api, 'A prefix and a completed response have different event records');
    [
      ['degraded · period', 0.18, 0.9],
      ['in · recovery', 0.27, 0.5],
    ].forEach(([name, a, z], i) => {
      const y = 390 + i * 190;
      coreBox(ctx, api, name, 180, y, 500, 95, i ? themeColors.green : themeColors.blue);
      coreText(
        ctx,
        api,
        `${a.toFixed(3)} × EOS ${z.toFixed(1)}`,
        1010,
        y + 58,
        37,
        themeColors.cyan,
      );
      coreBox(
        ctx,
        api,
        done('eos-products') ? (a * z).toFixed(3) : 'completed product ?',
        1420,
        y,
        350,
        95,
        themeColors.yellow,
      );
    });
    if (currentBeat === 2) {
      coreBox(ctx, api, 'EOS observed · complete', 200, 850, 650, 100, themeColors.green);
      coreBox(ctx, api, 'Budget reached · prefix only', 1060, 850, 650, 100, themeColors.blue);
    }
    coreFoot(ctx, api, 'A length-limited prefix contains no invented EOS probability.');
    return;
  });
}
export default {
  id: 'completed-score',
  draw: drawCompletedScore,
  cues: [
    'dec-completed-score-1',
    'dec-completed-score-2',
    'dec-eos-products',
    'dec-completed-score-3',
  ],
};
