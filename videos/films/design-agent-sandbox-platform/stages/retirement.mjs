import { sampleModel } from '../model.mjs';
import { drawLegacyCard } from '../defaults.mjs';
export function drawRetirement(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('retirement', state);
  {
    const names = [
      'RUNNING',
      'CANCEL REQUESTED',
      'PROCESSES STOPPED',
      'HANDLES CLOSED',
      'RECLAIMED',
    ];
    names.forEach((name, i) =>
      api.focus.target('retirement-name', () =>
        drawLegacyCard(
          ctx,
          api,
          name,
          380,
          280 + i * 125,
          1160,
          i <= modelState.phase
            ? i === 4
              ? themeColors.green
              : themeColors.cyan
            : themeColors.muted,
          85,
          33,
        ),
      ),
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'retirement',
  draw: drawRetirement,
  cues: ['retirement-beat-1-focus-1', 'retirement-beat-2-focus-1'],
};
