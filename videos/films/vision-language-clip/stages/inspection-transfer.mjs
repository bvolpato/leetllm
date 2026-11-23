import { spokenProgress } from '../construction.mjs';
import { drawPolicy, initialPrompts, revisedPrompts } from '../inspection-policy.mjs';
import { drawEvidence } from './boundaries.mjs';

export function drawInspectionTransfer(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat >= 2) {
    drawEvidence(ctx, api, {
      review: true,
      box: spokenProgress(state, 'transfer-box', 2),
      tag: spokenProgress(state, 'transfer-tag', 2),
    });
    return;
  }
  const newPrompt = spokenProgress(state, 'transfer-wording', 0) > 0;
  const scoreProgress = spokenProgress(state, 'transfer-score', 0);
  const hasScore = scoreProgress === 1;
  drawPolicy(ctx, api, {
    prompts: newPrompt ? revisedPrompts : initialPrompts,
    question: hasScore,
    awaitingSecond: newPrompt && !hasScore,
    secondProgress: scoreProgress,
    previousSecond: newPrompt ? initialPrompts[1].score : undefined,
    revealGap: beat === 1 && spokenProgress(state, 'transfer-gap', 1) === 1,
    revealRoute: beat === 1 && spokenProgress(state, 'transfer-review', 1) === 1,
  });
}

export default {
  id: 'inspection-transfer',
  draw: drawInspectionTransfer,
  cues: [
    'transfer-wording',
    'transfer-score',
    'transfer-gap',
    'transfer-review',
    'transfer-box',
    'transfer-tag',
  ],
};
