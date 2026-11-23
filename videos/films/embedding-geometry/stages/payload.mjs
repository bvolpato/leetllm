import { geometryText, heading, line } from '../defaults.mjs';
export function drawPayload(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat < 3)
      heading(ctx, api, '1,000,000 rows · 1,536 coordinates · one linear byte scale');
    const values = [6144, 1536, 192, 96],
      names = ['FP32', 'INT8', 'Sign bits', 'PQ96'],
      q = cueProgress();
    if (currentBeat < 3) {
      names.forEach((name, i) => {
        const y = 370 + i * 145;
        geometryText(
          ctx,
          api,
          name,
          190,
          y + 40,
          34,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        const n = currentBeat === 0 ? 1 : currentBeat === 1 ? 4 : 4,
          visible = i < n;
        line(ctx, api, 520, y + 32, 520 + 1050, y + 32, themeColors.muted, 1);
        if (visible)
          api.rect(
            ctx,
            520,
            y,
            ((1050 * values[i]) / 6144) *
              (currentBeat === 0 || (currentBeat === 1 && i > 0) ? q : 1),
            70,
            [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
          );
        geometryText(
          ctx,
          api,
          visible ? values[i] + ' B / row' : '?',
          1740,
          y + 45,
          29,
          themeColors.muted,
          'center',
        );
      });
      if (currentBeat === 2) {
        geometryText(
          ctx,
          api,
          'Shared PQ codebooks: 96 × 256 × 16 × 4 B = 1.5 MiB',
          960,
          990,
          31,
          themeColors.yellow,
          'center',
        );
        geometryText(
          ctx,
          api,
          'Retained FP32 rescore store: +5.72 GiB · graph / IDs / replicas extra',
          960,
          1050,
          27,
          themeColors.muted,
          'center',
        );
      } else
        geometryText(
          ctx,
          api,
          currentBeat === 0
            ? 'FP32: 6.144 decimal GB = 5.72 GiB'
            : 'INT8: 1.536 GB · signs: 183.1 MiB · PQ: 91.6 MiB',
          960,
          1040,
          34,
          themeColors.ink,
          'center',
        );
    } else {
      heading(ctx, api, 'Fresh sizing · 50M rows × 768 coordinates · decimal GB');
      [153.6, 38.4, 4.8].forEach((v, i) => {
        const x = 300 + i * 550;
        api.rect(
          ctx,
          x,
          830 - (v / 153.6) * 390,
          300,
          (v / 153.6) * 390 * q,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        );
        geometryText(
          ctx,
          api,
          ['FP32', 'INT8', 'PQ96'][i],
          x + 150,
          920,
          33,
          themeColors.ink,
          'center',
        );
        geometryText(
          ctx,
          api,
          v + ' GB',
          x + 150,
          1000,
          38,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        '60 ms is a benchmark gate, not a consequence of the byte total',
        960,
        330,
        34,
        themeColors.pink,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'payload',
  draw: drawPayload,
  cues: [],
};
