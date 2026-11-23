import { cueProgress } from '../arithmetic.mjs';
import { revisedContext } from '../packing.mjs';
import { drawPacking } from '../packing-picture.mjs';

function drawBudgetComparison(ctx, api, showFit) {
  const { C, text, rect, line } = api;
  const short = revisedContext(11, { parent: true });
  const fit = revisedContext(12, { parent: true });
  const passage = fit.ranked[0];

  text(ctx, 'Incident runbook   /   Version 5', 135, 266, 34, C.muted);
  text(ctx, passage.text, 135, 372, 48, C.ink, 'left', 'serif');
  line(ctx, 135, 432, 1775, 432, C.muted, 2);
  text(ctx, 'Evidence budget', 135, 530, 32, C.muted);
  text(ctx, 'One whole passage   /   ' + passage.length + ' words', 510, 530, 32, C.muted);
  text(ctx, 'Expected response', 1400, 530, 32, C.muted);
  for (const [i, run] of [short, fit].entries()) {
    const y = 598 + i * 181;
    const settled = i === 0 || showFit;
    text(ctx, run.budget + ' words', 135, y + 58, 48, C.ink);
    for (let j = 0; j < passage.length; j++) {
      const inside = j < run.budget;
      const fill = settled && run.complete ? C.green : inside ? C.muted : C.pink;
      rect(ctx, 510 + j * 63, y + 8, 54, 57, fill, undefined, 3);
    }
    const stop = 510 + run.budget * 63 - 5;
    line(ctx, stop, y - 5, stop, y + 81, C.yellow, 4);
    if (settled) text(ctx, run.complete ? 'Answer and cite' : 'Abstain', 1400, y + 56, 46, run.complete ? C.green : C.pink);
  }
}

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const at = (id, a, b) => cueProgress(state, id, api.phase(p, a, b));
  if (beat === 3 && at('retry-with-twelve', 0.22, 0.45) === 1) {
    api.focus.target('final-page', () => drawBudgetComparison(ctx, api, at('whole-rule-fits', 0.46, 0.57) === 1));
    return;
  }
  const both = revisedContext(18);
  const hits = both.ranked;
  const budgetCut = beat === 1 && at('fresh-budget-cut', 0.14, 0.28) === 1;
  const parent = beat >= 2 || (beat === 1 && at('fresh-parent-repair', 0.55, 0.69) > 0);
  const short = beat > 2 || (beat === 2 && at('last-slot', 0.12, 0.37) === 1);
  const run = revisedContext(short ? 11 : parent || budgetCut ? 12 : 18, { parent });
  const firstIn = beat === 0 ? at('last-nine', 0.22, 0.39) : 1;
  const secondIn = beat === 0 ? at('first-nine', 0.48, 0.66) : 1;
  const settlingParent = beat === 1 ? at('fresh-parent-result', 0.75, 0.89) === 1 : true;
  let message;
  let resultColor;
  let charged;
  let rows;
  let candidate;
  let pending = false;

  if (parent) {
    const whole = revisedContext(12, { parent: true }).ranked[0];
    const decided = beat > 2 && at('abstain', 0.1, 0.35) === 1;
    pending = short ? !decided : !settlingParent;
    if (short || pending) candidate = whole;
    charged = settlingParent ? run.selected : [];
    rows = [{ name: pending || charged.length ? 'Parent' : 'No text', span: pending ? whole : charged[0] }];
    if (short) {
      message = decided ? 'Abstain. The verified 12-word passage exceeds the 11-word allowance.'
        : 'Only the whole parent is eligible. Answer or abstain?';
      resultColor = decided ? C.pink : C.yellow;
    } else {
      message = settlingParent ? 'Complete permitted parent fits → evidence restored'
        : 'Candidate parent: 12 source words, current and permitted';
      resultColor = settlingParent ? C.green : C.ink;
    }
  } else {
    charged = run.selected.filter((_, i) => (i === 0 ? firstIn : secondIn) === 1);
    const condition = run.returned.find(hit => hit.start === 0);
    const deadline = run.returned.find(hit => hit.start !== 0);
    rows = [
      { name: 'Rank 2', span: secondIn > 0 && condition, progress: secondIn },
      { name: 'Rank 1', span: firstIn > 0 && deadline, progress: firstIn },
    ];
    if (budgetCut && at('shared-six', 0.48, 0.54) > 0) {
      message = 'Words 4–9 occupied ' + both.repeated + ' extra spaces when both hits were sent.';
      resultColor = C.yellow;
    } else if (budgetCut && at('fresh-insufficient-result', 0.34, 0.46) === 1 && !run.complete) {
      message = 'Condition omitted · insufficient retained text';
      resultColor = C.pink;
    } else if (budgetCut) {
      message = 'Rank 1 uses nine spaces. Rank 2 needs another nine.';
    } else if (beat === 1 && at('fresh-context-answer', 0.01, 0.1) === 1 && run.complete) {
      message = 'Combined context: complete evidence';
      resultColor = C.green;
    } else if (secondIn === 1) {
      message = 'When should the engineer page, and what goes in the page?';
    }
  }
  api.focus.target('final-page', () => drawPacking(ctx, api, {
    run, page: 'Incident runbook  /  version 5  /  index window: 9 words',
    maximum: 18, sourceHits: hits, rows, charged, message, resultColor, candidate, pending,
    overlapEmphasis: budgetCut && !parent ? at('shared-six', 0.48, 0.54) : 0,
  }));
}

export default {
  id: 'earned-transfer', draw: drawEarnedTransfer,
  cues: ['last-nine', 'first-nine', 'fresh-context-answer', 'fresh-budget-cut',
    'fresh-insufficient-result', 'shared-six', 'fresh-parent-repair', 'fresh-parent-result', 'last-slot', 'abstain',
    'retry-with-twelve', 'whole-rule-fits'],
};
