import { r1 } from '../fixtures.mjs';
import { budgetTrace } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';

export function drawBudget(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const row = budgetTrace(b, state.beatP, state.cues);
  const {
    consumed: processed,
    prior: processedBefore,
    reserved,
    promptInputs,
    decodeInputs,
    assigned: used,
    returned,
  } = row;

  api.focus.target('budget-prompt', () => {
    api.text(ctx, 'R1 prompt', 125, 333, 39, C.pink);
    for (const [i, word] of r1.entries()) {
      tokenCell(api, word, 410 + i * 153, 272, 142, 92, C.pink, i < processed);
    }
    api.text(ctx, `${processed} of 9 prompt inputs computed`, 410, 441, 35, C.ink);
  });
  api.focus.target('budget-step', () => {
    api.text(ctx, 'Step ' + row.step, 125, 604, 43, C.ink);
    for (let i = 0; i < 6; i++) {
      let label = '';
      if (i === 0 && reserved) label = 'R0 decode';
      if (i > 0 && i <= promptInputs) label = r1[processedBefore + i - 1];
      if (i === 1 && decodeInputs) label = 'R1: and';
      tokenCell(
        api,
        label,
        410 + i * 231,
        540,
        213,
        95,
        label ? (i ? C.pink : C.blue) : C.muted,
        Boolean(label),
      );
    }
    api.text(ctx, `${used} of 6 input positions assigned`, 410, 711, 35, C.ink);
  });
  api.focus.target('budget-output', () => {
    api.line(ctx, 125, 790, 1790, 790, C.muted, 2);
    api.text(ctx, 'R1 output', 125, 916, 39, C.green);
    const emitted =
      b === 0 ? [] : b === 1 ? (returned ? ['and'] : []) : returned ? ['and', 'sang'] : ['and'];
    if (!emitted.length) api.text(ctx, 'Waiting for the rest of the prompt', 410, 916, 35, C.muted);
    emitted.forEach((word, i) => tokenCell(api, word, 410 + i * 220, 851, 202, 91, C.green, true));
  });
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-active-decode',
    'budget-first-prompt-slice',
    'budget-first-return',
    'budget-reserve-again',
    'budget-prompt-tail',
    'budget-first-output',
    'budget-both-decode',
    'budget-next-output',
  ],
};
