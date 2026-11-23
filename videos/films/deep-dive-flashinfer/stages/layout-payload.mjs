import { flashCue, flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, grid, header, packet } from '../defaults.mjs';
export function drawLayoutPayload(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('layout-payload', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-layout-payload-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 0
        ? 'Same page 14 coordinates, different axis order'
        : currentBeat === 1
          ? 'One combined FP16 allocation'
          : 'A representation change requires its own codec',
    );
    if (currentBeat === 0) {
      const left = Array.from(
          {
            length: 4,
          },
          (_, slot) =>
            Array.from(
              {
                length: 8,
              },
              (_, head) => `t${slot}h${head}`,
            ),
        ),
        right = Array.from(
          {
            length: 8,
          },
          (_, head) =>
            Array.from(
              {
                length: 4,
              },
              (_, slot) => `t${slot}h${head}`,
            ),
        );
      const selected = Math.min(31, Math.floor(progress * 32)),
        selectedSlot = Math.floor(selected / 8),
        selectedHead = selected % 8;
      grid(ctx, api, left, 140, 420, 720, 330, themeColors.blue, 24, [
        {
          row: selectedSlot,
          column: selectedHead,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
        },
      ]);
      grid(ctx, api, right, 1080, 420, 690, 330, themeColors.cyan, 24, [
        {
          row: selectedHead,
          column: selectedSlot,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
        },
      ]);
      extensionText(
        ctx,
        api,
        'NHD · token → head →128 coordinates',
        500,
        365,
        29,
        themeColors.blue,
        'center',
      );
      extensionText(
        ctx,
        api,
        'HND · head → token →128 coordinates',
        1420,
        365,
        29,
        themeColors.cyan,
        'center',
      );
      const i = Math.min(31, Math.floor(progress * 32)),
        slot = Math.floor(i / 8),
        head = i % 8;
      packet(ctx, api, 't' + slot + 'h' + head, 875, 520, themeColors.yellow, 150);
      extensionText(
        ctx,
        api,
        'Selected coordinate0 · payload identities unchanged',
        960,
        875,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const names = ['pages15', 'K/V2', 'slots4', 'heads8', 'width128'];
      names.forEach((v, i) =>
        extensionCard(
          ctx,
          api,
          progress > (i + 0.2) / 5 ? v : 'axis',
          160 + i * 330,
          410,
          285,
          progress > (i + 0.2) / 5 ? themeColors.cyan : themeColors.muted,
          100,
        ),
      );
      const ready = flashCue(state, 'fi-layout-payload-bytes', 1) === 1;
      extensionText(
        ctx,
        api,
        ready ? '15 ×2 ×4 ×8 ×128 =122,880 elements' : 'Construct all five allocated axes',
        960,
        670,
        38,
        themeColors.yellow,
        'center',
      );
      if (ready)
        extensionText(
          ctx,
          api,
          'FP16: 122,880 ×2 =245,760 bytes',
          960,
          815,
          38,
          themeColors.green,
          'center',
        );
    } else {
      const rows = [
        ['Original FP16', 'K/V heads + coordinates'],
        ['Separate MLA', 'latent + positional components'],
        ['Separate quantized path', 'packed payload + scales + supported kernel'],
      ];
      rows.forEach(([a, z], i) => {
        extensionCard(
          ctx,
          api,
          a,
          150,
          400 + i * 160,
          600,
          i ? themeColors.yellow : themeColors.blue,
        );
        if (progress > (i + 0.2) / 3)
          extensionCard(
            ctx,
            api,
            z,
            960,
            400 + i * 160,
            800,
            i ? themeColors.yellow : themeColors.cyan,
          );
      });
    }
    footer(
      ctx,
      api,
      'The displayed coordinate slice is illustrative; all128 coordinates contribute to the allocation',
    );
  });
}
export default {
  id: 'layout-payload',
  draw: drawLayoutPayload,
  cues: [
    'fi-layout-payload-0',
    'fi-layout-payload-0-result',
    'fi-layout-payload-1',
    'fi-layout-payload-1-result',
    'fi-layout-payload-allocation',
    'fi-layout-payload-bytes',
    'fi-layout-payload-2',
    'fi-layout-payload-2-result',
  ],
};
