import { coreBox, coreFoot, coreText, coreTitle } from '../defaults.mjs';
export function drawCountPenalties(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-count-penalties-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-count-penalties-mechanism', () => {
    coreTitle(ctx, api, 'Keep count-based and presence-based deductions separate');
    const raw = [2.4, 2.1, 1.2],
      count = [3, 1, 0],
      freq = count.map((v) => v * 0.4),
      presence = count.map((v) => (v ? 0.2 : 0)),
      out = raw.map((v, i) => v - freq[i] - presence[i]);
    const cols = [300, 740, 1180, 1570];
    ['raw z', 'count × 0.4', 'seen × 0.2', 'result'].forEach((v, i) =>
      coreText(ctx, api, v, cols[i], 365, 29, themeColors.blue),
    );
    raw.forEach((v, i) => {
      const y = 450 + i * 160;
      coreBox(ctx, api, v.toFixed(1), 180, y, 240, 85, themeColors.blue);
      coreBox(
        ctx,
        api,
        freq[i].toFixed(1),
        620,
        y,
        240,
        85,
        i < Math.floor(u * 3.999) ? themeColors.cyan : themeColors.muted,
      );
      coreBox(
        ctx,
        api,
        presence[i].toFixed(1),
        1060,
        y,
        240,
        85,
        i < Math.floor(u * 3.999) ? themeColors.cyan : themeColors.muted,
      );
      coreBox(
        ctx,
        api,
        done('count-values') ? out[i].toFixed(1) : '?',
        1450,
        y,
        240,
        85,
        done('count-values') && i === 1 ? themeColors.green : themeColors.muted,
      );
    });
    coreFoot(
      ctx,
      api,
      'Supplied counts are [3, 1, 0]. Declare the counted history and the full processor order.',
    );
    return;
  });
}
export default {
  id: 'count-penalties',
  draw: drawCountPenalties,
  cues: [
    'dec-count-penalties-1',
    'dec-count-penalties-2',
    'dec-count-values',
    'dec-count-penalties-3',
  ],
};
