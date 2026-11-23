import { abClamp } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { abExtendedScenes, receiptMismatches } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionNote,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawEvaluationStack(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('evaluation-stack')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'evaluation-stack-mechanism', () => {
    const original = {
      index: 'runbooks-2026-05-01',
      generator: 'incident-generator-v7',
      prompt: 'incident-generator-prompt-v3',
      decoder: {
        selection: 'greedy',
        schema: 'incident-answer-v2',
      },
    };
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Different evidence answers different release questions',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const rows = [
        [
          'Offline regression',
          'Does this answer preserve the rollback rule?',
          'required-clause / forbidden-claim checks',
          themeColors.cyan,
        ],
        [
          'Online incident',
          'Did the assigned policy improve the outcome?',
          '760/2000 versus 840/2000',
          themeColors.blue,
        ],
        [
          'Guardrails',
          'Is a meaningful harm excluded?',
          'grounding interval versus +0.50 pp',
          themeColors.pink,
        ],
        [
          'Integrity receipt',
          'What exact comparison was promised?',
          'unit · eligibility · snapshots · prompt · model',
          themeColors.yellow,
        ],
      ];
      rows.forEach(([name, question, evidence, color], i) => {
        const y = 365 + i * 145;
        drawExpansionCell(ctx, api, name, 180, y, 400, 105, color, 30);
        drawExpansionCell(ctx, api, question + '\n' + evidence, 660, y, 1060, 105, color, 28);
      });
      drawExpansionNote(
        ctx,
        api,
        'A passing offline score does not establish live benefit, and a positive outcome cannot excuse unsupported evidence.',
      );
    } else {
      const bad = abStarted(state, 'receipt-bad-schema', progress > 0.4),
        treatment = {
          ...original,
          decoder: {
            ...original.decoder,
            schema: bad ? 'incident-answer-v3' : 'incident-answer-v2',
          },
        },
        mismatches = receiptMismatches(original, treatment);
      writeExpansionText(
        ctx,
        api,
        'Compare the declared pinned fields before reading lift',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      writeExpansionText(ctx, api, 'CONTROL', 750, 350, 28, themeColors.blue, 'center');
      writeExpansionText(ctx, api, 'TREATMENT', 1420, 350, 28, themeColors.pink, 'center');
      Object.keys(original).forEach((key, i) => {
        const y = 400 + i * 125,
          a =
            typeof original[key] === 'object' ? 'greedy · ' + original[key].schema : original[key],
          b =
            typeof treatment[key] === 'object'
              ? 'greedy · ' + treatment[key].schema
              : treatment[key];
        writeExpansionText(ctx, api, key, 200, y + 45, 29, themeColors.muted);
        drawExpansionCell(ctx, api, a, 470, y, 570, 85, themeColors.blue, 27);
        drawExpansionCell(
          ctx,
          api,
          b,
          1110,
          y,
          620,
          85,
          mismatches.includes(key) ? themeColors.pink : themeColors.cyan,
          27,
        );
      });
      if (bad)
        writeExpansionText(
          ctx,
          api,
          'HOLD COMPARISON · unplanned decoder schema',
          960,
          960,
          35,
          themeColors.pink,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Matching declared fields does not verify deployed bytes, truthful logs, randomization or absence of interference.',
      );
    }
  });
  return;
}
export default {
  id: 'evaluation-stack',
  draw: drawEvaluationStack,
  cues: ['evaluation-stack-step-1', 'evaluation-stack-step-2', 'receipt-bad-schema'],
};
