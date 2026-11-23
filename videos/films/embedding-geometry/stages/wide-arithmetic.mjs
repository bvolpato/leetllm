import { geometryText, heading } from '../defaults.mjs';
export function drawWideArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    heading(ctx, api, 'Same byte inputs · q=[127,127] · A[127,127], B[126,126]');
    const values = [32258, 32004];
    values.forEach((value, i) => {
      const y = 410 + i * 260,
        bits = value.toString(2).padStart(16, '0');
      geometryText(
        ctx,
        api,
        i ? 'B' : 'A',
        200,
        y + 42,
        38,
        i ? themeColors.pink : themeColors.blue,
      );
      bits.split('').forEach((bit, j) => {
        const x = 400 + j * 76;
        api.rect(
          ctx,
          x,
          y,
          66,
          80,
          themeColors.panel,
          j < 8 ? themeColors.muted : themeColors.yellow,
          2,
        );
        geometryText(
          ctx,
          api,
          bit,
          x + 33,
          y + 50,
          28,
          j < 8 ? themeColors.muted : themeColors.yellow,
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        'exact ' + value,
        600,
        y + 150,
        35,
        i ? themeColors.pink : themeColors.blue,
        'center',
      );
      if (currentBeat === 1) {
        api.focus.target('wide-score', () =>
          geometryText(
            ctx,
            api,
            cue('widen-product') > 0.6
              ? 'wide before ×: ' + value
              : 'narrow: ' + (value & 255) + ' · cast after still ' + (value & 255),
            1390,
            y + 150,
            31,
            cue('widen-product') > 0.6 ? themeColors.green : themeColors.pink,
            'center',
          ),
        );
      }
    });
    geometryText(
      ctx,
      api,
      currentBeat === 0
        ? 'High bits carry the correct order'
        : 'Widen before products and accumulation; casting after cannot recover lost bits',
      960,
      1000,
      32,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 1)
      geometryText(
        ctx,
        api,
        '1536 × 127² = 24,774,144 < INT32 maximum',
        960,
        1060,
        28,
        themeColors.muted,
        'center',
      );
    return;
  }
  return;
}
export default {
  id: 'wide-arithmetic',
  draw: drawWideArithmetic,
  cues: ['widen-product'],
};
