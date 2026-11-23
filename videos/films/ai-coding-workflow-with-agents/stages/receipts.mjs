import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawReceipts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('receipts', state),
    { b: currentBeat, q } = modelState;
  {
    api.focus.target('candidate-identity', () =>
      card(ctx, api, 'Current candidate: C', 180, 320, 1510, themeColors.blue, 100, 41),
    );
    const receipt = modelState.receipt,
      lines = [
        ['Receipt source', receipt.source],
        [
          'Same-event replay',
          receipt.executed.includes('same event replay') ? 'EXECUTED' : 'SKIPPED',
        ],
        [
          'New-event check',
          receipt.executed.includes('new event creates invoice') ? 'EXECUTED' : 'SKIPPED',
        ],
        ['Suite outcome', receipt.terminal.toUpperCase()],
      ];
    lines.forEach(([name, value], i) => {
      const y = 490 + i * 110;
      text(ctx, api, name, 190, y + 45, 34, themeColors.ink);
      api.focus.target('receipt-fields', () =>
        card(ctx, api, value, 1160, y, 530, themeColors.cyan, 80, 33),
      );
    });
    text(
      ctx,
      api,
      modelState.receiptValid
        ? 'Current source + required executed checks'
        : 'REJECT receipt: ' +
            (receipt.source !== 'C' ? 'older source' : 'required replay skipped'),
      960,
      1015,
      38,
      modelState.receiptValid ? themeColors.green : themeColors.pink,
      'center',
    );
  }
}
export default {
  id: 'receipts',
  draw: drawReceipts,
  cues: ['receipts-b1-1', 'receipts-run', 'receipts-b2-1'],
};
