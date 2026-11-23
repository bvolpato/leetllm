import { budgetTrace } from '../model.mjs';
import { beatCue } from '../construction.mjs';
import { drawLedger } from '../ledger-picture.mjs';

export function drawBudget(ctx, scene, state, api) {
  const actual = beatCue(state, 'budget-actual', 1, 0.55).done;
  const admitted = beatCue(state, 'budget-admit', 2, 0.39).done;
  const wait = beatCue(state, 'budget-wait', 1, 0.01).done;
  const showFree = beatCue(state, 'budget-free', 2, 0.01).done;
  const row = budgetTrace()[admitted ? 2 : actual ? 1 : 0];
  const held = (id) => ({ ...row.reservations.find((r) => r.id === id), held: true });
  const parts = [held('B'), actual ? { id: 'A', value: row.spent } : held('A')];
  if (admitted) parts.push(held('C'));
  drawLedger(ctx, api, {
    cap: 4000,
    parts,
    freeLabel: actual ? showFree : wait,
    request: { id: 'C', value: 1500, visible: beatCue(state, 'budget-ask', 0, 0.56).started },
    verdict: admitted
      ? 'C admitted'
      : actual
        ? 'Will C fit after the receipt?'
        : wait
          ? 'C waits for capacity'
          : 'Will the verifier fit?',
    note: actual
      ? 'A reserved 1,500    -    A used 900    =    600 released'
      : 'The bracket is the verifier’s maximum generation allowance.',
    detail: admitted ? 'B and C still hold 1,500 each.' : null,
  });
}

export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-held',
    'budget-ask',
    'budget-wait',
    'budget-actual',
    'budget-free',
    'budget-admit',
  ],
};
