import { decodeLengthScore } from '../arithmetic.mjs';
import { coreBox, coreFoot, coreLine, coreText, coreTitle } from '../defaults.mjs';
export function drawNormalizedStop(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-normalized-stop-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-normalized-stop-mechanism', () => {
    coreTitle(ctx, api, 'The denominator can outweigh a small raw-score decrease');
    const extended = currentBeat > 0 || done('normalized-append'),
      raw = extended ? -1 + Math.log(0.99) : -1,
      len = extended ? 2 : 1,
      normalized = decodeLengthScore(raw, len, 0.6);
    coreBox(ctx, api, 'length ' + len, 180, 375, 420, 90, themeColors.blue);
    coreBox(ctx, api, 'raw log score ' + raw.toFixed(5), 710, 375, 620, 90, themeColors.cyan);
    coreText(ctx, api, 'Raw score', 400, 620, 31, themeColors.cyan);
    coreText(ctx, api, 'Normalized', 400, 800, 31, themeColors.green);
    coreLine(ctx, api, 650, 620, 1600, 620);
    coreLine(ctx, api, 650, 800, 1600, 800);
    const map = (v) => 650 + ((v + 1.1) / 0.3) * 950;
    api.circle(ctx, map(raw), 620, 17, themeColors.cyan);
    if (done('normalized-improve')) api.circle(ctx, map(normalized), 800, 17, themeColors.green);
    coreText(ctx, api, raw.toFixed(5), map(raw), 690, 30, themeColors.cyan);
    coreText(
      ctx,
      api,
      done('normalized-improve') ? normalized.toFixed(5) : 'Normalized result pending',
      done('normalized-improve') ? map(normalized) : 1100,
      870,
      30,
      themeColors.green,
    );
    coreFoot(ctx, api, 'Stopping requires a bound for the actual objective and termination rule.');
    return;
  });
}
export default {
  id: 'normalized-stop',
  draw: drawNormalizedStop,
  cues: [
    'dec-normalized-stop-1',
    'dec-normalized-append',
    'dec-normalized-stop-2',
    'dec-normalized-improve',
  ],
};
