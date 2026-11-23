import { VOTING_CASES } from '../fixtures.mjs';
import { canonicalAction, canonicalVote } from '../construction.mjs';
import { drawArrow, drawCard, drawFooter, drawText } from '../defaults.mjs';
export function drawSamplingCostLedger(ctx, scene, state, api) {
  api.focus.target('sampling-cost-ledger-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0, 0, 1),
      q = api.phase(progress, 0.05, 0.9),
      finished = (key) => api.focus.progress('reason-result-' + key, 0) === 1;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Five authored cases · same requests under first-answer and vote-five',
          960,
          255,
          31,
          themeColors.ink,
          'center',
        );
        drawText(ctx, api, 'Expected', 670, 330, 25, themeColors.muted, 'center');
        drawText(ctx, api, 'Five requested samples', 1120, 330, 25, themeColors.muted, 'center');
        drawText(ctx, api, 'First / vote', 1650, 330, 25, themeColors.muted, 'center');
        VOTING_CASES.forEach((v, i) => {
          const y = 370 + i * 105,
            first = canonicalAction(v.samples[0]) === v.expected,
            winner = canonicalVote(v.samples).decision;
          drawText(ctx, api, v.id, 150, y + 48, 25, themeColors.blue);
          drawText(
            ctx,
            api,
            v.expected === 'merge_release' ? 'MERGE' : 'REVIEW',
            670,
            y + 48,
            26,
            themeColors.ink,
            'center',
          );
          v.samples.forEach((s, j) => {
            const action = canonicalAction(s);
            drawCard(
              ctx,
              api,
              action === 'merge_release' ? 'M' : action === 'manual_review' ? 'R' : '?',
              900 + j * 95,
              y,
              80,
              75,
              action ? themeColors.blue : themeColors.pink,
              27,
            );
          });
          drawText(
            ctx,
            api,
            (first ? '✓' : '×') +
              ' / ' +
              (winner === 'abstain' ? 'abstain' : winner === v.expected ? '✓' : '×'),
            1650,
            y + 48,
            27,
            winner === v.expected ? themeColors.green : themeColors.yellow,
            'center',
          );
        });
        drawText(
          ctx,
          api,
          finished('sample-summary')
            ? 'First reply: 2/5 correct, 5 samples   ·   Vote: 3/5 correct, 25 samples, 1 abstention'
            : 'Aggregate accuracy and requested-sample totals: pending',
          960,
          975,
          30,
          finished('sample-summary') ? themeColors.yellow : themeColors.muted,
          'center',
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Separate historical self-consistency experiment',
          960,
          270,
          34,
          themeColors.ink,
          'center',
        );
        drawCard(ctx, api, '40 sampled outputs per run', 230, 400, 1460, 110, themeColors.blue, 36);
        drawCard(ctx, api, 'Greedy CoT 56.5%', 270, 655, 600, 110, themeColors.blue, 35);
        drawCard(ctx, api, 'Self-consistency 74.4%', 1050, 655, 600, 110, themeColors.green, 35);
        drawArrow(ctx, api, 900, 710, 1020, 710, themeColors.green);
        drawText(
          ctx,
          api,
          'Different setup from the earlier 56.9% result',
          960,
          920,
          30,
          themeColors.yellow,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Retain a case-level cost and failure ledger',
          960,
          275,
          34,
          themeColors.ink,
          'center',
        );
        const rows = [
          ['same held-out cases', 'keep invalids + abstentions'],
          ['generation work', 'input/output/reasoning tokens'],
          ['unsafe approvals', 'separate blocked-case rate'],
          ['parallel collection', 'wall time can fall; work remains'],
        ];
        rows.forEach(([k, v], i) => {
          drawText(ctx, api, k, 180, 420 + i * 140, 30, themeColors.blue);
          drawText(ctx, api, v, 870, 420 + i * 140, 30, themeColors.ink);
        });
      }
      drawFooter(
        ctx,
        api,
        currentBeat === 0 ? 'M = merge   ·   R = manual review   ·   ? = rejected attempt' : 'Count generation work even when calls run in parallel.',
      );
    }
  });
}
export default {
  id: 'sampling-cost-ledger',
  draw: drawSamplingCostLedger,
  cues: [
    'sampling-cost-ledger-b1',
    'reason-result-sample-summary',
    'sampling-cost-ledger-b2',
    'sampling-cost-ledger-b3',
  ],
};
