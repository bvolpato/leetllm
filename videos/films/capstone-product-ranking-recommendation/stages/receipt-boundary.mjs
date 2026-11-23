import { REQUIRED_GATES } from '../fixtures.mjs';
import { box, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawReceiptBoundary(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('receipt-boundary-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      if (b === 0) {
        rankingText(ctx, api, 'Actual local receipt ·17 required gates retained', 150, 270, 34);
        const count = Math.floor(17 * cueProgress(ctx, api, 'receipt-gates'));
        REQUIRED_GATES.forEach((name, i) => {
          const x = 160 + (i % 3) * 575,
            y = 350 + Math.floor(i / 3) * 92;
          box(
            ctx,
            api,
            (i < count ? '✓ ' : '') + name.replaceAll('_', ' ').replace('0 95', '0.95'),
            x,
            y,
            540,
            70,
            i < count ? C.green : C.muted,
            20,
          );
        });
        if (cueVisible(ctx, api, 'receipt-live'))
          rankingText(
            ctx,
            api,
            'fixture_checks_pass · live_experiment_ready = false',
            960,
            980,
            33,
            C.yellow,
            'center',
          );
      } else if (b === 1) {
        rankingText(ctx, api, 'Keep distinct evidence artifacts in distinct ledgers', 150, 270, 34);
        [
          ['Hand-entered ranking', 'two-query 0.854 → 1.000'],
          ['Actual temporal fit', '3train /2validation /2test'],
          ['Synthetic scoring', '10 samples · p95 = 18 ms'],
          ['Authored online worksheet', '100searches/arm · return stop'],
        ].forEach(([a, z], i) => {
          rankingText(ctx, api, a, 170, 420 + i * 130, 28, C.muted);
          box(ctx, api, z, 790, 375 + i * 130, 940, 85, C.blue, 30);
        });
        if (cueVisible(ctx, api, 'receipt-online'))
          footer(
            ctx,
            api,
            'Six response rows and two outcome events did not generate the online aggregate counts.',
          );
      } else {
        rankingText(ctx, api, 'Next evidence must be collected on its actual path', 150, 270, 35);
        [
          'permissible data + independent judgments',
          'frozen holdouts + retained candidates/features',
          'deduplicated matured outcomes + view receipts',
          'measured serving path + power + tested rollback',
        ].forEach((v, i) => box(ctx, api, v, 220, 390 + i * 140, 1480, 95, C.blue, 29));
        if (cueVisible(ctx, api, 'receipt-extension'))
          footer(
            ctx,
            api,
            'Version fields and evaluation-only tags do not supply model bytes,permissions,views or recovery.',
          );
      }
    }
  });
}
export default {
  id: 'receipt-boundary',
  draw: drawReceiptBoundary,
  cues: [
    'receipt-gates',
    'receipt-live',
    'receipt-identities',
    'receipt-online',
    'receipt-extension',
  ],
};
