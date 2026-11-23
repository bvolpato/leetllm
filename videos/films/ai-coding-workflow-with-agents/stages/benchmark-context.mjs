import { clamp } from '../arithmetic.mjs';
import { box, focusTarget, heading, instructionText } from '../defaults.mjs';
export function drawBenchmarkContext(ctx, scene, state, api) {
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
      heading(ctx, api, 'Choose a coding agent for repository work');
      focusTarget(ctx, api, 'benchmark-local', () => {
        ['Model + tools', 'Scaffold + split', 'Attempt budget'].forEach((v, i) =>
          box(ctx, api, v, 190 + i * 550, 390, 450, 100, themeColors.blue, 33),
        );
        box(ctx, api, 'Benchmark task outcomes', 220, 680, 680, 115, themeColors.blue, 36);
        box(
          ctx,
          api,
          'This invoice replay on current source',
          1030,
          680,
          730,
          115,
          themeColors.yellow,
          32,
        );
        instructionText(
          ctx,
          api,
          'Run the invoice replay to review this patch.',
          960,
          960,
          37,
          themeColors.yellow,
        );
      });
    } else {
      heading(ctx, api, 'Which SWE-bench Verified tasks did the audit examine?');
      focusTarget(ctx, api, 'benchmark-sample', () => {
        const selected = on('benchmark-selected', 0.25);
        for (let i = 0; i < 500; i++) {
          const x = 210 + (i % 25) * 58,
            y = 350 + Math.floor(i / 25) * 27;
          api.rect(
            ctx,
            x,
            y,
            44,
            17,
            selected && i < 138 ? themeColors.pink : themeColors.muted,
            undefined,
            2,
          );
        }
        instructionText(
          ctx,
          api,
          selected
            ? '138 selected hard tasks out of the 500-task benchmark'
            : '500 tasks in SWE-bench Verified',
          960,
          960,
          35,
          selected ? themeColors.pink : themeColors.muted,
        );
        instructionText(ctx, api, 'February 2026 audit', 960, 1020, 28, themeColors.yellow);
      });
    }
    return;
  }
  return;
}
export default {
  id: 'benchmark-context',
  draw: drawBenchmarkContext,
  cues: ['benchmark-context-step-1', 'benchmark-context-step-2', 'benchmark-selected'],
};
