import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawFilesystem(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('filesystem', state),
    currentBeat = modelState.step;
  {
    drawLegacyText(
      ctx,
      api,
      currentBeat === 0 ? 'Job A private overlay' : 'Fresh overlay for the next job',
      150,
      285,
      35,
    );
    [
      ['Base files', Object.entries(modelState.base)],
      ['Private writes', Object.entries(modelState.upper)],
      ['Visible files', Object.entries(modelState.visible)],
    ].forEach(([name, entries], i) => {
      const x = 170 + i * 560;
      drawLegacyText(
        ctx,
        api,
        name,
        x + 230,
        390,
        32,
        i === 2 ? themeColors.green : themeColors.blue,
        'center',
      );
      entries.forEach(([k, v], j) =>
        api.focus.target('filesystem-k-v', () =>
          drawLegacyCard(
            ctx,
            api,
            k + ': ' + v,
            x,
            460 + j * 125,
            460,
            i === 2 ? themeColors.green : themeColors.cyan,
            90,
            27,
          ),
        ),
      );
      if (!entries.length) drawLegacyCard(ctx, api, 'EMPTY', x, 460, 460, themeColors.yellow);
    });
    drawLegacyText(
      ctx,
      api,
      'Private reads override base · retiring the overlay preserves the immutable image',
      960,
      975,
      28,
      themeColors.muted,
      'center',
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'filesystem',
  draw: drawFilesystem,
  cues: ['filesystem-beat-1-focus-1', 'filesystem-beat-2-focus-1'],
};
