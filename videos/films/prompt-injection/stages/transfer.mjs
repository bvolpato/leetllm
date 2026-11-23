import { cueBegun } from '../arithmetic.mjs';
import { promotionTrace } from '../model.mjs';
import { card, link, visualFocus } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const report = visualFocus(ctx, api, 'transfer-report', () =>
        card(ctx, api, 'Report C17 · evidence', 145, 325, 420, themeColors.blue, 1, 95, 30),
      ),
      proposal = visualFocus(ctx, api, 'transfer-proposal', () =>
        card(
          ctx,
          api,
          'promote-C17-r3\nC17 · production · 25%',
          750,
          325,
          420,
          themeColors.yellow,
          1,
          105,
          28,
        ),
      ),
      gate = visualFocus(ctx, api, 'transfer-host-policy', () =>
        card(
          ctx,
          api,
          'Trusted release-worker\nCurrent approval + revision',
          1355,
          325,
          420,
          themeColors.green,
          1,
          105,
          27,
        ),
      );
    link(ctx, api, report, proposal, 1);
    link(ctx, api, proposal, gate, 1, themeColors.green);
    const replay =
      currentBeat > 0 || cueBegun(state.cues, 'transfer-beat-1-focus-2', progress > 0.2);
    if (replay) {
      const denied = promotionTrace(1, 1),
        approved = promotionTrace(4, 1);
      visualFocus(ctx, api, 'transfer-denied-execution', () => {
        card(ctx, api, 'Approval: none → DENY', 145, 585, 760, themeColors.pink, 1, 80, 29);
        card(
          ctx,
          api,
          'Decision record: promote-C17-r3\nC17 · ' +
            denied.stage +
            ' · r' +
            denied.revision +
            ' · ' +
            denied.traffic +
            '%',
          145,
          705,
          760,
          themeColors.pink,
          1,
          115,
          28,
        );
      });
      visualFocus(ctx, api, 'transfer-approved-execution', () => {
        card(
          ctx,
          api,
          'Casey · exact valid approval → PERMIT',
          1015,
          585,
          760,
          themeColors.green,
          1,
          80,
          27,
        );
        visualFocus(ctx, api, 'transfer-write-receipt', () =>
          card(
            ctx,
            api,
            'Receipt: ' +
              approved.receipt.operationId +
              '\nC17 · production · r' +
              approved.receipt.revision +
              ' · ' +
              approved.receipt.traffic +
              '%',
            1015,
            705,
            760,
            themeColors.green,
            1,
            115,
            28,
          ),
        );
      });
      visualFocus(ctx, api, 'transfer-disclosure-endpoint', () =>
        card(
          ctx,
          api,
          'Private notes → outside.example: DENY',
          145,
          920,
          760,
          themeColors.pink,
          1,
          80,
          26,
        ),
      );
      visualFocus(ctx, api, 'transfer-deployment-endpoint', () =>
        card(
          ctx,
          api,
          'Release-service state matches checked receipt',
          1015,
          920,
          760,
          themeColors.green,
          1,
          80,
          26,
        ),
      );
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-beat-1-focus-1',
    'transfer-beat-1-focus-2',
    'transfer-beat-2-focus-1',
    'transfer-protected-endpoints',
  ],
};
