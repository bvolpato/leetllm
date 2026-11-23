import { sampleModel } from '../model.mjs';
import { chapterGrid, chapterMath, chapterText } from '../defaults.mjs';
export function drawCache(ctx, scene, state, api) {
  return api.focus.target('hf-cache-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('cache', state);
    {
      api.focus.target('cache-payload-formula', () =>
        chapterMath(
          ctx,
          api,
          String.raw`2\times16\times1\times S\times4\times64\times2`,
          960,
          280,
          41,
        ),
      );
      for (let bank = 0; bank < 2; bank++) {
        chapterText(
          ctx,
          api,
          bank ? 'Value bank' : 'Key bank',
          270 + bank * 420,
          350,
          27,
          bank ? themeColors.pink : themeColors.blue,
          'center',
        );
        chapterGrid(
          ctx,
          api,
          Array.from(
            {
              length: 4,
            },
            (_, r) =>
              Array.from(
                {
                  length: 8,
                },
                (_, k) => (k === 7 ? '…' : r + ':' + k),
              ),
          ),
          130 + bank * 420,
          375,
          340,
          145,
          bank ? themeColors.pink : themeColors.blue,
          20,
        );
      }
      chapterText(
        ctx,
        api,
        '4 stored heads × 64 values × 2 bytes × K/V',
        1390,
        415,
        27,
        themeColors.cyan,
        'center',
      );
      chapterText(
        ctx,
        api,
        '× 16 layers = 16,384 bytes per token',
        1390,
        480,
        28,
        themeColors.yellow,
        'center',
      );
      api.focus.target('cache-length-counter', () =>
        chapterText(
          ctx,
          api,
          'Live ' + modelState.length + ' · allocated ' + modelState.capacity,
          960,
          575,
          32,
          themeColors.cyan,
          'center',
        ),
      );
      api.focus.target(
        'cache-id-live-label-live-kv-payload-value-s-live-2-20-color-c-blue-id-rese',
        () =>
          teaching.allocation({
            x: 240,
            y: 640,
            width: 1440,
            height: 300,
            capacity: 64,
            parts: [
              {
                id: 'live',
                label: 'Live KV payload',
                value: modelState.live / 2 ** 20,
                color: themeColors.blue,
              },
              {
                id: 'reserved',
                label: 'Unused allocated slots',
                value: modelState.unused / 2 ** 20,
                color: themeColors.pink,
              },
            ],
            fontSize: 27,
            unit: 'MiB',
            color: themeColors.ink,
            trackColor: themeColors.panel,
          }),
      );
      chapterText(
        ctx,
        api,
        'Allocated ' + (modelState.allocated / 2 ** 20).toFixed(2) + ' MiB · tensor payload',
        960,
        1015,
        30,
        themeColors.yellow,
        'center',
      );
      return;
    }
  });
}
export default {
  id: 'cache',
  draw: drawCache,
  cues: [
    'cache-beat-1-focus-1',
    'cache-scale-length',
    'hf-cache-0',
    'cache-beat-2-focus-1',
    'cache-static-allocation',
    'hf-cache-1',
    'cache-beat-3-focus-1',
    'hf-cache-2',
  ],
};
