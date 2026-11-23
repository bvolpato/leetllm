import { clamp } from '../arithmetic.mjs';
import { arrow, box, focusTarget, footer, heading, instructionText, line } from '../defaults.mjs';
export function drawSnapshotContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const q = (id, a = 0.12, z = 0.8) => {
    const cue = state.cues?.[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : api.phase(progress, a, z);
  };
  const on = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Temporary repository · two reads of the index');
      focusTarget(ctx, api, 'snapshot-drift', () => {
        const changed = on('snapshot-change', 0.2),
          untracked = on('snapshot-untracked', 0.35);
        box(ctx, api, 'Index', 190, 380, 570, 95, themeColors.blue, 38);
        box(ctx, api, 'Working files', 1120, 380, 610, 95, themeColors.cyan, 38);
        box(ctx, api, 'handler value = 1', 190, 570, 570, 110, themeColors.blue, 36);
        box(
          ctx,
          api,
          'handler value = ' + (changed ? 2 : 1),
          1120,
          570,
          610,
          110,
          changed ? themeColors.yellow : themeColors.cyan,
          36,
        );
        box(ctx, api, 'git write-tree   →   T', 190, 815, 570, 95, themeColors.blue, 30);
        if (q('snapshot-reread', 0.64, 0.76) === 1)
          instructionText(
            ctx,
            api,
            'Second git write-tree   →   T',
            475,
            988,
            33,
            themeColors.yellow,
          );
        box(
          ctx,
          api,
          untracked ? 'local-input.json   (untracked)' : 'No additional local input yet',
          1120,
          815,
          610,
          95,
          untracked ? themeColors.pink : themeColors.muted,
          30,
        );
        line(ctx, api, 820, 625, 1060, 625, themeColors.muted);
        instructionText(
          ctx,
          api,
          changed ? '≠' : '=',
          940,
          600,
          48,
          changed ? themeColors.yellow : themeColors.muted,
        );
      });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Bind the source the process actually read');
      focusTarget(ctx, api, 'snapshot-inputs', () => {
        const labels = [
          'Committed content',
          'Dirty / untracked',
          'Verifier K overlay',
          'Dependencies + env',
        ];
        labels.forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            190 + i * 410,
            405,
            360,
            110,
            i < 2 ? themeColors.blue : themeColors.cyan,
            29,
          ),
        );
        labels.forEach((_, i) =>
          arrow(ctx, api, 370 + i * 410, 545, 370 + i * 410, 690, themeColors.yellow),
        );
        api.rect(ctx, 190, 720, 1590, 150, themeColors.panel, themeColors.yellow, 8);
        instructionText(
          ctx,
          api,
          'Actual tested snapshot + unchanged verifier + runner evidence',
          985,
          810,
          35,
          themeColors.yellow,
        );
        instructionText(
          ctx,
          api,
          'A model-written digest does not authenticate the run or logs',
          960,
          965,
          31,
          themeColors.muted,
        );
      });
    } else {
      heading(ctx, api, 'Receipts stay attached to the source they actually tested');
      focusTarget(ctx, api, 'snapshot-current', () => {
        const moved = on('snapshot-contract-step-3', 0.2);
        box(ctx, api, 'Candidate B', 200, 405, 520, 100, themeColors.blue, 38);
        box(
          ctx,
          api,
          moved ? 'Current C' : 'Current B',
          1200,
          405,
          520,
          100,
          moved ? themeColors.yellow : themeColors.blue,
          38,
        );
        box(ctx, api, 'Passed receipt B / K', 200, 720, 520, 100, themeColors.blue, 34);
        arrow(ctx, api, 460, 685, 460, 535, themeColors.blue);
        instructionText(
          ctx,
          api,
          moved ? 'B’s evidence cannot validate C' : 'Receipt and candidate currently match',
          960,
          940,
          37,
          moved ? themeColors.pink : themeColors.green,
        );
      });
    }
    if (currentBeat === 2)
      footer(
        ctx,
        api,
        'Refresh the current candidate, target, required checks and reviews before integration.',
      );
    return;
  }
  return;
}
export default {
  id: 'snapshot-contract',
  draw: drawSnapshotContract,
  cues: [
    'snapshot-contract-step-1',
    'snapshot-stage',
    'snapshot-change',
    'snapshot-untracked',
    'snapshot-reread',
    'snapshot-contract-step-2',
    'snapshot-contract-step-3',
    'snapshot-target',
  ],
};
