import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawEquation, drawText } from '../defaults.mjs';
export function drawLedger(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('ledger', state);
  {
    drawText(
      ctx,
      api,
      `Request key: ${modelState.index >= 3 ? 'deposit-1' : 'ledger request'}`,
      340,
      295,
      33,
      themeColors.yellow,
    );
    const rows = modelState.events;
    api.focus.target(
      'ledger-rows-length-rows-map-event-event-key-event-delta-0-event-delta-balan',
      () =>
        teaching.grid({
          x: 240,
          y: 420,
          width: 1440,
          height: 100,
          rows: 1,
          columns: Math.max(1, rows.length),
          labels: [
            rows.length
              ? rows.map(
                  (event) =>
                    `${event.key}  ${event.delta > 0 ? '+' : ''}${event.delta}  balance ${event.balanceAfter}`,
                )
              : ['ledger is empty'],
          ],
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.ink,
          fontSize: 30,
        }),
    );
    if (modelState.action === 'conflict')
      api.focus.target('ledger-conflict-comparison', () => {
        drawCard(ctx, api, 'stored deposit-1: +100', 260, 565, 620, themeColors.cyan, 80, 29);
        drawCard(
          ctx,
          api,
          'incoming deposit-1: +200 → REJECT',
          1010,
          565,
          650,
          themeColors.pink,
          80,
          29,
        );
      });
    api.focus.target('ledger-current-balance', () =>
      drawEquation(
        ctx,
        api,
        String.raw`\text{current balance}=${modelState.balance}`,
        960,
        710,
        49,
        themeColors.green,
      ),
    );
    const returned = modelState.returned === null ? 'none' : String(modelState.returned);
    api.focus.target('ledger-this-call-returns', () =>
      drawCard(
        ctx,
        api,
        modelState.error
          ? 'REJECT · original stored result remains 100'
          : `this call returns ${returned}`,
        510,
        805,
        900,
        modelState.error
          ? themeColors.pink
          : modelState.index === 3
            ? themeColors.yellow
            : themeColors.blue,
        90,
        32,
      ),
    );
    drawText(
      ctx,
      api,
      `retained events: ${rows.length}`,
      960,
      935,
      31,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'ledger',
  draw: drawLedger,
  cues: [
    'ledger-deposit',
    'ledger-withdraw',
    'ledger-beat-1-focus-1',
    'ledger-beat-2-focus-2',
    'ledger-preserved-balance',
    'ledger-beat-2-focus-1',
  ],
};
