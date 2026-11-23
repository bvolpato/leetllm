import { TokenBudget } from '../tokens.mjs';
import { drawLedger } from '../ledger-picture.mjs';
import { beatCue } from '../construction.mjs';

export function drawReservationReconcile(ctx, scene, state, api) {
  const budget = new TokenBudget(4000);
  budget.reserve('A', 1500);
  budget.reserve('B', 1500);
  budget.settle('A', 900);
  budget.reserve('C', 1500);
  const changed = beatCue(state, 'receipt-conflict', 1, 0.4).done;
  const over = beatCue(state, 'receipt-over', 2, 0.04).done;
  const timeout = beatCue(state, 'receipt-timeout', 3, 0.03).started;
  const id = over ? 'B' : 'A';
  const used = over ? 1600 : changed ? 950 : 900;
  let result = 'Receipt already recorded   /   same charge';
  try {
    if (!timeout) budget.settle(id, used);
  } catch (error) {
    result = error.message;
  }
  const reveal = over
    ? beatCue(state, 'receipt-over-result', 2, 0.48).done
    : changed
      ? beatCue(state, 'receipt-reject', 1, 0.66).done
      : beatCue(state, 'receipt-same', 1, 0.01).done;
  const held = (id) => ({ id, value: budget.pending.get(id), held: true });
  drawLedger(ctx, api, {
    cap: budget.cap,
    parts: [held('B'), { id: 'A', value: budget.spent }, held('C')],
    freeLabel: true,
    request: { id: 'C', value: 1500 },
    receipt: timeout
      ? 'B   /   timeout   /   usage unknown'
      : 'Usage receipt   /   ' + id + '   /   ' + used.toLocaleString('en-US') + ' tokens',
    verdict: timeout
      ? 'B stays held until reconciled'
      : reveal
        ? result
        : 'Should the ledger change?',
    note: 'Original receipt for A   /   900 tokens charged',
  });
}

export default {
  id: 'reservation-reconcile',
  draw: drawReservationReconcile,
  cues: [
    'receipt-repeat',
    'receipt-same',
    'receipt-conflict',
    'receipt-reject',
    'receipt-over',
    'receipt-over-result',
    'receipt-timeout',
  ],
};
