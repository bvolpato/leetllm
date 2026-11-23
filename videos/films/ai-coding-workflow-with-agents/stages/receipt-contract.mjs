import { cueStep } from '../invoice-page.mjs';
import { arrow, box, focusTarget, heading, instructionText, text } from '../defaults.mjs';
export function drawReceiptContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Same retry test on the base and candidate');
      focusTarget(ctx, api, 'receipt-fields', () => {
        const rows = [
          ['Source', 'Base', 'Candidate C'],
          ['Verifier', 'K', 'K'],
          ['Required replay', 'Executed', 'Executed'],
          ['Retry returned', '#2   ·   Failed', '#1   ·   Passed'],
        ];
        rows.forEach(([name, base, candidate], i) => {
          const y = 360 + i * 150;
          instructionText(ctx, api, name, 220, y + 50, 30, themeColors.muted, 'left');
          box(ctx, api, base, 650, y, 450, 95, i === 3 ? themeColors.pink : themeColors.blue, 31);
          box(
            ctx,
            api,
            candidate,
            1250,
            y,
            450,
            95,
            i === 3 ? themeColors.green : themeColors.cyan,
            31,
          );
        });
      });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'The runner expects an integer exit code');
      focusTarget(ctx, api, 'receipt-types', () => {
        text(ctx, api, '0', 540, 510, 116, themeColors.cyan, 'center');
        text(ctx, api, 'false', 1380, 510, 116, themeColors.pink, 'center');
        text(ctx, api, 'Integer   ·   normal exit', 540, 597, 42, themeColors.ink, 'center');
        text(ctx, api, 'Boolean   ·   invalid field', 1380, 597, 42, themeColors.ink, 'center');
        if (cueStep(state, 'receipt-stale', 1, 0.53, 0.63) > 0)
          text(
            ctx,
            api,
            'Stale revision   →   test the current patch',
            210,
            751,
            39,
            themeColors.yellow,
          );
        if (cueStep(state, 'receipt-interrupted', 1, 0.68, 0.79) > 0)
          text(
            ctx,
            api,
            'Interrupted run   →   rerun to completion',
            210,
            836,
            39,
            themeColors.yellow,
          );
        if (cueStep(state, 'receipt-skipped', 1, 0.83, 0.95) > 0)
          text(
            ctx,
            api,
            'Skipped replay   →   run the missing test',
            210,
            921,
            39,
            themeColors.yellow,
          );
      });
    } else {
      heading(ctx, api, 'Follow the renamed file');
      focusTarget(ctx, api, 'receipt-paths', () => {
        box(ctx, api, 'Owned handler.ts', 160, 400, 550, 100, themeColors.blue, 34);
        box(ctx, api, 'Unowned payments.ts', 1180, 400, 580, 100, themeColors.pink, 32);
        arrow(ctx, api, 750, 450, 1140, 450, themeColors.yellow);
        instructionText(
          ctx,
          api,
          'Rename: inspect both endpoints',
          960,
          620,
          34,
          themeColors.yellow,
        );
        [
          ['Delete migration', themeColors.pink],
          ['Change file mode', themeColors.yellow],
          ['Follow symlink target', themeColors.cyan],
        ].forEach(([v, col], i) => box(ctx, api, v, 190 + i * 570, 755, 470, 100, col, 31));
        instructionText(
          ctx,
          api,
          'The runner enforces access at the destination.',
          960,
          970,
          31,
          themeColors.muted,
        );
      });
    }
    return;
  }
  return;
}
export default {
  id: 'receipt-contract',
  draw: drawReceiptContract,
  cues: [
    'receipt-contract-step-1',
    'receipt-contract-step-2',
    'receipt-stale',
    'receipt-interrupted',
    'receipt-skipped',
    'receipt-contract-step-3',
    'receipt-access',
  ],
};
