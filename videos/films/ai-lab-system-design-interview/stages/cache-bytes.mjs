import { segment } from '../arithmetic.mjs';
import { systemExtensionFrame } from '../construction.mjs';
import { bar, chapterCard, chapterText, footer, header, rect } from '../defaults.mjs';
export function drawCacheBytes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('cache-bytes', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-cache-bytes-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 0
        ? 'Construct bytes for one retained token'
        : currentBeat === 1
          ? 'Multiply the histories actually retained'
          : 'Original architecture comparison',
    );
    const factors = [
      ['K/V', 2],
      ['layers', 32],
      ['KV heads', 8],
      ['width', 128],
      ['bytes', 2],
    ];
    factors.forEach(([name, value], i) => {
      const active = currentBeat > 0 || i < modelState.factorCount;
      chapterCard(
        ctx,
        api,
        active ? `${name}\n${value}` : name,
        140 + i * 335,
        390,
        290,
        active ? themeColors.cyan : themeColors.muted,
        120,
        29,
      );
    });
    if (currentBeat === 0) {
      const pairs = Math.floor(256 * segment(progress, 0.4, 0.9));
      for (let layer = 0; layer < 32; layer++)
        for (let head = 0; head < 8; head++) {
          const counted = layer * 8 + head < pairs;
          rect(
            ctx,
            api,
            540 + head * 84,
            555 + layer * 8,
            72,
            5,
            counted ? themeColors.blue : themeColors.panel,
            counted ? themeColors.blue : themeColors.muted,
          );
        }
      chapterText(ctx, api, '32 layers', 420, 695, 29, themeColors.blue, 'center');
      chapterText(ctx, api, '8 stored KV heads', 880, 845, 29, themeColors.cyan, 'center');
      chapterText(ctx, api, 'Each cell: K + V', 1470, 630, 28, themeColors.yellow, 'center');
      chapterText(ctx, api, '128 coordinates', 1470, 680, 28, themeColors.muted, 'center');
      chapterText(ctx, api, '2 bytes / value', 1470, 730, 28, themeColors.muted, 'center');
      chapterText(
        ctx,
        api,
        modelState.resultReady
          ? '256 × 512 = 131,072 bytes = 128 KiB'
          : 'Constructed head-layer pairs: ' + pairs + ' / 256',
        960,
        925,
        35,
        modelState.resultReady ? themeColors.green : themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const n = Math.round(32768 * progress);
      bar(
        ctx,
        api,
        n,
        32768,
        350,
        620,
        1220,
        themeColors.blue,
        'Retained token positions: ' + n.toLocaleString(),
      );
      if (modelState.done)
        chapterText(
          ctx,
          api,
          'Unequal histories use their length sum; include retained generated tokens',
          960,
          800,
          31,
          themeColors.yellow,
          'center',
        );
    } else {
      bar(
        ctx,
        api,
        modelState.cache.mhaGb,
        20,
        400,
        620,
        1150,
        themeColors.pink,
        '32 KV heads · counterfactual: 17.18 GB',
      );
      bar(
        ctx,
        api,
        modelState.cache.gqaGb,
        20,
        400,
        770,
        1150,
        themeColors.green,
        '8 KV heads · Llama 3 8B shape: 4.29 GB',
      );
    }
    footer(
      ctx,
      api,
      'Bytes ÷ 1,000,000,000 = GB · bytes ÷ 2³⁰ = GiB · weights are a separate term',
    );
  });
}
export default {
  id: 'cache-bytes',
  draw: drawCacheBytes,
  cues: [
    'sd-cache-bytes-0-operation',
    'sd-cache-bytes-0-result',
    'sd-cache-bytes-1-operation',
    'sd-cache-bytes-1-result',
    'sd-cache-bytes-2-operation',
    'sd-cache-bytes-2-result',
  ],
};
