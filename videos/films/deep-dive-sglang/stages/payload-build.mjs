import { phase } from '../arithmetic.mjs';
import { transferMs } from '../fixtures.mjs';
import { sgComplete, sgProgress } from '../construction.mjs';
import { bar, extensionText, footer, rectangle, title } from '../defaults.mjs';
export function drawPayloadBuild(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('payload-build-mechanism', () => {
    const value = currentBeat > 0 || sgProgress(state, 'payload-value', 0) >= 1,
      heads = currentBeat > 0 || sgProgress(state, 'payload-heads', 0) >= 1,
      layers = currentBeat > 0 || sgProgress(state, 'payload-layers', 0) >= 1,
      one = currentBeat > 0 || sgProgress(state, 'payload-one', 0) >= 1;
    title(ctx, api, 'One tensor slice → heads → layers → bytes on the link');
    if (currentBeat === 0) {
      const plane = (label, x, y, color) => {
        for (let d = heads ? 7 : 0; d >= 0; d--)
          rectangle(ctx, api, x + d * 13, y - d * 11, 500, 215, themeColors.panel, color, 3);
        extensionText(ctx, api, label, x + 250, y + 90, 36, color, 'center');
        extensionText(
          ctx,
          api,
          'Per head: 4096 × 128 × 2 bytes',
          x + 250,
          y + 255,
          27,
          color,
          'center',
        );
      };
      plane(
        heads ? 'K · 8 heads · 8 MiB' : one ? 'K · 1 MiB' : 'K · byte count ?',
        250,
        450,
        themeColors.cyan,
      );
      if (value) plane(heads ? 'V · 8 heads · 8 MiB' : 'V · 1 MiB', 1100, 450, themeColors.pink);
      extensionText(
        ctx,
        api,
        heads ? '8 heads × 2 MiB = 16 MiB / layer' : 'K + V = ' + (value ? '2' : '?') + ' MiB',
        960,
        820,
        38,
        themeColors.yellow,
        'center',
      );
      if (layers)
        extensionText(
          ctx,
          api,
          '32 layers × 16 MiB = 512 MiB',
          960,
          925,
          42,
          themeColors.green,
          'center',
        );
    } else {
      api.math(
        ctx,
        String.raw`2\times32\times8\times128\times4096\times2=536870912`,
        960,
        420,
        40,
        themeColors.cyan,
        'center',
      );
      extensionText(
        ctx,
        api,
        '512 MiB ÷ achieved 25 decimal GB/s',
        960,
        570,
        39,
        themeColors.yellow,
        'center',
      );
      const known = currentBeat > 1 || sgComplete(state, 'payload-time');
      if (known)
        extensionText(
          ctx,
          api,
          '21.47 ms payload-only lower bound',
          960,
          700,
          43,
          themeColors.green,
          'center',
        );
      if (currentBeat === 2) {
        bar(ctx, api, 'Handoff budget', 10, 25, 330, 820, 1260, themeColors.pink, '10 ms');
        bar(
          ctx,
          api,
          'Payload time alone',
          transferMs,
          25,
          330,
          925,
          1260,
          themeColors.cyan,
          transferMs.toFixed(2) + ' ms',
        );
      }
    }
    footer(
      ctx,
      api,
      'Example transfer · full attention · unsharded, uncompressed KV · all prompt positions',
    );
  });
}
export default {
  id: 'payload-build',
  draw: drawPayloadBuild,
  cues: [
    'sg-payload-build-beat-0',
    'sg-payload-value',
    'sg-payload-heads',
    'sg-payload-layers',
    'sg-payload-one',
    'sg-payload-build-beat-1',
    'sg-payload-time',
    'sg-payload-build-beat-2',
    'sg-payload-fail',
  ],
};
