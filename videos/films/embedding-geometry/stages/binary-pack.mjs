import { signCode } from '../arithmetic.mjs';
import { geometryText, heading } from '../defaults.mjs';
export function drawBinaryPack(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    const vectors = [
        [0.3, -0.1, 0.8, -0.4],
        [0.5, -0.2, 0.7, 0.1],
      ],
      q = cueProgress();
    heading(
      ctx,
      api,
      currentBeat === 2
        ? 'Nine logical dimensions occupy two bytes; high padding bits stay zero'
        : 'Fixed coordinate signs · positive→1; zero or negative→0',
    );
    if (currentBeat === 0) {
      vectors.forEach((v, i) => {
        const y = 420 + i * 280;
        v.forEach((x, j) => {
          const xx = 340 + j * 360;
          geometryText(
            ctx,
            api,
            'd' + j + ': ' + x.toFixed(1),
            xx,
            y,
            33,
            x > 0 ? themeColors.blue : themeColors.pink,
            'center',
          );
          api.rect(
            ctx,
            xx - 100,
            y + 55,
            200,
            100,
            themeColors.panel,
            x > 0 ? themeColors.blue : themeColors.pink,
            3,
          );
          if (q > (j + 1) / 5)
            geometryText(
              ctx,
              api,
              x > 0 ? 1 : 0,
              xx,
              y + 123,
              42,
              x > 0 ? themeColors.blue : themeColors.pink,
              'center',
            );
        });
      });
      geometryText(
        ctx,
        api,
        'Dimension order stays d0,d1,d2,d3; packing chooses a separate written bit order',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      vectors.forEach((v, i) => {
        const y = 420 + i * 240,
          code = signCode(v);
        for (let j = 0; j < 4; j++) {
          const bit = (code >> (3 - j)) & 1,
            x = 460 + j * 200;
          api.rect(
            ctx,
            x,
            y,
            150,
            95,
            themeColors.panel,
            bit ? themeColors.blue : themeColors.muted,
            3,
          );
          geometryText(ctx, api, 'd' + (3 - j), x + 75, y - 25, 26, themeColors.muted, 'center');
          geometryText(
            ctx,
            api,
            bit,
            x + 75,
            y + 62,
            43,
            bit ? themeColors.blue : themeColors.muted,
            'center',
          );
        }
        geometryText(
          ctx,
          api,
          '0x' + code.toString(16).padStart(2, '0'),
          1510,
          y + 60,
          47,
          themeColors.yellow,
          'center',
        );
      });
      api.focus.target('binary-xor', () =>
        geometryText(
          ctx,
          api,
          cue('binary-popcount') > 0.6
            ? '0x05 XOR 0x0d = 0x08 → popcount 1'
            : 'XOR the packed words, then count set bits',
          960,
          1020,
          39,
          themeColors.yellow,
          'center',
        ),
      );
    }
    if (currentBeat === 2) {
      const bits = Array.from(
        {
          length: 16,
        },
        (_, i) => (i < 9 ? 1 : 0),
      );
      for (let i = 0; i < 16; i++) {
        const byte = Math.floor(i / 8),
          bit = i % 8,
          x = 230 + byte * 830 + bit * 90;
        api.rect(
          ctx,
          x,
          470,
          75,
          100,
          themeColors.panel,
          i < 9 ? themeColors.blue : themeColors.muted,
          3,
        );
        geometryText(
          ctx,
          api,
          bits[i],
          x + 37,
          535,
          35,
          i < 9 ? themeColors.blue : themeColors.muted,
          'center',
        );
        geometryText(
          ctx,
          api,
          i < 9 ? 'd' + i : 'pad',
          x + 37,
          660,
          25,
          i < 9 ? themeColors.blue : themeColors.muted,
          'center',
        );
      }
      geometryText(ctx, api, 'byte0: 8 coordinates', 560, 370, 33, themeColors.blue, 'center');
      geometryText(
        ctx,
        api,
        'byte1: 1 coordinate + 7 zero padding bits',
        1390,
        370,
        31,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Bits shown low to high inside each byte',
        960,
        760,
        29,
        themeColors.muted,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Validate logical width, byte count and padding before comparing',
        960,
        860,
        36,
        themeColors.ink,
        'center',
      );
      geometryText(
        ctx,
        api,
        'ceil(d/8) payload bytes; headers and graph traffic are extra',
        960,
        1030,
        31,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'binary-pack',
  draw: drawBinaryPack,
  cues: ['binary-popcount'],
};
