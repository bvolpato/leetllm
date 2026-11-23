import { after, arrow, box, codeText, detailText, focusTarget, footer, visible } from '../defaults.mjs';
export function drawActualLoaderCases(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat < 2)
      focusTarget(ctx, api, 'loader-cases', () => {
        detailText(
          ctx,
          api,
          'Same compute 12.0 device · unchanged addition source',
          150,
          280,
          30,
          themeColors.yellow,
        );
        const rows =
          currentBeat === 0
            ? [
                [
                  'Build A',
                  'sm_120 + compute_90 PTX',
                  'normal',
                  after(api, 'target-branches') ? 'PASS' : '',
                  themeColors.green,
                ],
                [
                  'same package',
                  'same bytes',
                  'native-only',
                  after(api, 'target-branches') ? 'PASS' : '',
                  themeColors.green,
                ],
                [
                  'same package',
                  'same bytes',
                  'forced PTX, disk cache off',
                  after(api, 'forced-target-ptx') ? 'PASS' : '',
                  themeColors.green,
                ],
              ]
            : [
                [
                  'Build B',
                  'sm_90 + compute_90 PTX',
                  'forced PTX',
                  after(api, 'hopper-ptx') ? 'PASS' : '',
                  themeColors.green,
                ],
                [
                  'same package',
                  'same bytes',
                  'PTX JIT disabled',
                  after(api, 'disabled-jit-error') ? 'PTX JIT compilation was disabled' : '',
                  themeColors.pink,
                ],
                [
                  'Build B, PTX removed',
                  'sm_90; PTX absent',
                  'normal',
                  after(api, 'missing-image-error')
                    ? 'no kernel image is available\nfor execution on the device'
                    : '',
                  themeColors.pink,
                ],
              ];
        rows.forEach(([name, inventory, mode, result, color], i) => {
          const y = 370 + i * 175;
          box(ctx, api, 140, y, 1600, 150, themeColors.muted);
          detailText(ctx, api, name, 170, y + 42, 30, themeColors.cyan);
          codeText(ctx, api, inventory, 170, y + 95, 23);
          detailText(ctx, api, mode, 730, y + 45, 27, themeColors.yellow);
          if (result)
            String(result)
              .split('\n')
              .forEach((v, j) => detailText(ctx, api, v, 1110, y + 45 + j * 45, 24, color));
        });
      });
    if (currentBeat === 2)
      focusTarget(ctx, api, 'image-inventory', () => {
        box(ctx, api, 180, 365, 620, 390, themeColors.blue);
        codeText(ctx, api, 'host executable', 220, 420, 31, themeColors.blue);
        codeText(ctx, api, 'cuobjdump --list-elf', 220, 500, 27);
        codeText(ctx, api, 'cuobjdump --extract-elf', 220, 560, 25);
        if (visible(ctx, api, 'extract-cubin')) {
          arrow(ctx, api, 820, 550, 1020, 550, themeColors.cyan);
          box(ctx, api, 1040, 365, 650, 390, themeColors.green);
          codeText(ctx, api, 'extracted sm_120 cubin', 1080, 420, 29, themeColors.green);
          codeText(ctx, api, 'nvdisasm → target SASS', 1080, 515, 27);
          detailText(
            ctx,
            api,
            'Host executable → nvdisasm: rejected',
            1080,
            650,
            25,
            themeColors.pink,
          );
        }
      });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Preserve bytes, exact message and last successful representation.'
        : 'Recorded runs on the same GPU. Each mode started in a fresh process.',
    );
  }
}
export default {
  id: 'actual-loader-cases',
  draw: drawActualLoaderCases,
  cues: [
    'target-branches',
    'forced-target-ptx',
    'hopper-ptx',
    'disabled-jit-error',
    'missing-image-error',
    'extract-cubin',
  ],
};
