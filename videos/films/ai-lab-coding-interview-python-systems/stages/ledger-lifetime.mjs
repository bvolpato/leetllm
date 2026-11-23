import { ciDone, codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawRow,
} from '../defaults.mjs';
export function drawLedgerLifetime(ctx, scene, state, api) {
  api.focus.target('ci-ledger-lifetime-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('ledger-lifetime', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'The original effect result and current balance are distinct');
        drawChapterCard(
          ctx,
          api,
          'deposit-1: original result 100',
          220,
          395,
          1480,
          100,
          themeColors.yellow,
          33,
        );
        drawChapterCard(
          ctx,
          api,
          'current balance: ' + (q < 0.8 ? 70 : q < 0.9 ? 90 : 10),
          220,
          575,
          700,
          110,
          themeColors.cyan,
          34,
        );
        drawChapterCard(
          ctx,
          api,
          ciDone(state, 'ci-ledger-lifetime-replay')
            ? 'replay deposit-1 → 100'
            : 'replay result pending',
          1030,
          575,
          670,
          110,
          themeColors.green,
          31,
        );
        if (q > 0.7) {
          drawRow(
            ctx,
            api,
            [
              'reject debit 80: no result',
              q >= 0.8 ? 'later deposit 20 → 90' : 'deposit pending',
              q >= 0.9 ? 'retry debit 80 → 10' : 'retry pending',
            ],
            220,
            820,
            1480,
            100,
            themeColors.blue,
            24,
          );
        }
        drawFooter(
          ctx,
          api,
          'Separate supplied success-only policy illustration; rejection does not reserve its key',
        );
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Identity types belong to the contract');
        drawRow(ctx, api, ['True', '1'], 400, 400, 1120, 110, themeColors.pink, 39);
        drawArrow(ctx, api, 680, 550, 830, 650, themeColors.pink);
        drawArrow(ctx, api, 1250, 550, 1090, 650, themeColors.pink);
        drawChapterCard(
          ctx,
          api,
          'Python equality: True == 1',
          590,
          690,
          740,
          110,
          themeColors.pink,
          33,
        );
        if (q > 0.6)
          drawChapterCard(
            ctx,
            api,
            'require nonempty string IDs · actual int delta',
            230,
            875,
            1460,
            95,
            themeColors.green,
            30,
          );
        drawFooter(ctx, api, 'An arbitrary truthy value is not a stable request identity');
      } else {
        drawHeading(ctx, api, 'One effect spans balance, event and cached result');
        drawChapterText(
          ctx,
          api,
          'Separate supplied +20 update · start 70 / 2 events / 2 results',
          960,
          355,
          26,
          themeColors.muted,
          'center',
        );
        const phaseIndex = Math.min(3, Math.floor(q * 4)),
          counts =
            phaseIndex === 0
              ? [70, 2, 2]
              : phaseIndex === 1
                ? [90, 2, 2]
                : phaseIndex === 2
                  ? [90, 3, 2]
                  : [90, 3, 3];
        ['balance', 'events', 'results'].forEach((v, i) => {
          drawChapterText(ctx, api, v, 440 + i * 520, 420, 31, themeColors.muted, 'center');
          drawChapterCard(
            ctx,
            api,
            counts[i],
            230 + i * 520,
            490,
            420,
            130,
            i === 0 ? themeColors.cyan : themeColors.yellow,
            43,
          );
        });
        drawChapterText(
          ctx,
          api,
          phaseIndex === 1 || phaseIndex === 2
            ? 'CRASH HERE → inconsistent volatile state'
            : 'proposed one durable transaction boundary',
          960,
          760,
          33,
          phaseIndex === 1 || phaseIndex === 2 ? themeColors.pink : themeColors.green,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Account locks alone do not synchronize a globally reused request key',
        );
      }
    }
  });
}
export default {
  id: 'ledger-lifetime',
  draw: drawLedgerLifetime,
  cues: [
    'ci-ledger-lifetime-0-build',
    'ci-ledger-lifetime-replay',
    'ci-ledger-lifetime-1-build',
    'ci-ledger-lifetime-2-build',
  ],
};
