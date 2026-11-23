import { pruningSnapshot } from '../construction.mjs';
import { originalText } from '../defaults.mjs';
export function drawPruning(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const full = currentBeat === 0,
      pruning = pruningSnapshot(currentBeat, progress);
    api.focus.target('branch-steps', () => {
      for (let row = 0; row < 4; row++) {
        api.focus.target('pruning-readout', () =>
          originalText(
            ctx,
            api,
            `branch ${row + 1}`,
            140,
            400 + row * 115,
            34,
            themeColors.muted,
            'left',
          ),
        );
        for (let col = 0; col < 8; col++) {
          const active = col < pruning.rows[row];
          api.rect(
            ctx,
            430 + col * 150,
            355 + row * 115,
            110,
            72,
            active ? (row === 0 ? themeColors.green : themeColors.blue) : themeColors.panel,
            active ? undefined : themeColors.muted,
            9,
          );
        }
      }
    });
    api.focus.target('pruning-readout-2', () =>
      originalText(
        ctx,
        api,
        full ? 'outcome-only completion' : 'process pruning',
        960,
        285,
        44,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('pruning-readout-3', () =>
      originalText(
        ctx,
        api,
        full ? '32 generated steps' : `${pruning.generatedSteps} generated steps`,
        960,
        900,
        40,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.reveal('scorer-cost', () =>
      api.focus.target('pruning-process-checks-14-outcome-checks-4', () =>
        originalText(
          ctx,
          api,
          'process checks: 14     outcome checks: 4',
          960,
          950,
          34,
          themeColors.muted,
          'center',
        ),
      ),
    );
  }
}

// Full core constructions extend the original mechanisms and their completed-result guards.
export default {
  id: 'pruning',
  draw: drawPruning,
  cues: [
    'outcome-completion',
    'intermediate-evidence',
    'process-pruning',
    'saved-steps',
    'scorer-cost',
    'different-work-units',
  ],
};
