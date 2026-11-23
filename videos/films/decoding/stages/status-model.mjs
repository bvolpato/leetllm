import { STATUS_IDS, STATUS_ROW } from '../fixtures.mjs';
import { coreBars, coreBox, coreFoot, coreText, coreTitle } from '../defaults.mjs';
export function drawStatusModel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-status-model-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-status-model-mechanism', () => {
    coreTitle(ctx, api, 'One supplied row; text probability and evidence stay separate');
    if (currentBeat === 0) {
      const count = Math.min(12, Math.floor(u * 12.999));
      coreBars(ctx, api, STATUS_ROW.slice(0, count), STATUS_IDS.slice(0, count), {
        y: 350,
        gap: 48,
        max: 0.5,
        width: 1100,
      });
      coreText(
        ctx,
        api,
        'Eight tail IDs remain eight separate events',
        1510,
        960,
        27,
        themeColors.muted,
      );
    } else {
      const rows = [
        ['degraded → period', 0.45, 0.4],
        ['in → recovery', 0.3, 0.9],
      ];
      rows.forEach(([name, a, z], i) => {
        const y = 405 + i * 190;
        coreBox(ctx, api, name, 180, y, 520, 95, i ? themeColors.green : themeColors.blue);
        coreText(
          ctx,
          api,
          `${a.toFixed(2)} × ${z.toFixed(2)}`,
          980,
          y + 60,
          39,
          i ? themeColors.green : themeColors.blue,
        );
        api.arrow(ctx, 1230, y + 45, 1370, y + 45, themeColors.muted, 3);
        coreBox(
          ctx,
          api,
          done('status-products') ? (a * z).toFixed(3) : 'product pending',
          1410,
          y,
          350,
          95,
          themeColors.yellow,
        );
      });
      if (currentBeat === 2) {
        coreBox(ctx, api, 'Text ranking: in recovery', 230, 840, 670, 90, themeColors.green);
        coreBox(ctx, api, 'Actual canary: inspect telemetry', 1020, 840, 670, 90, themeColors.blue);
      }
    }
    coreFoot(
      ctx,
      api,
      'These are supplied token probabilities, not observations of a running canary.',
    );
    return;
  });
}
export default {
  id: 'status-model',
  draw: drawStatusModel,
  cues: ['dec-status-model-1', 'dec-status-model-2', 'dec-status-products', 'dec-status-model-3'],
};
