import { SAMPLING_COUNTS } from '../fixtures.mjs';
import { completedCue } from '../construction.mjs';
import { drawConstructionsCenter, drawConstructionsText } from '../defaults.mjs';
export function drawSequenceCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-sequence-check-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Actual fixed-seed 60,000 CPU runs · all nine ordered pairs',
      245,
    );
    const words = ['noon', 'dawn', 'dusk'],
      p0 = [0.4, 0.5, 0.1],
      cond = [
        [0.1, 0.6, 0.3],
        [0.6, 0.2, 0.2],
        [0.3, 0.2, 0.5],
      ],
      reveal = done(0, 'sd-sequence-error') || currentBeat > 0;
    for (let a = 0; a < 3; a++)
      for (let z = 0; z < 3; z++) {
        const i = a * 3 + z,
          x = 170 + z * 580,
          y = 345 + a * 205;
        drawConstructionsText(ctx, api, words[a] + ' → ' + words[z], x, y, 27, themeColors.ink);
        const exact = p0[a] * cond[a][z],
          observed = SAMPLING_COUNTS[i] / 60000;
        api.rect(ctx, x, y + 30, (exact / 0.32) * 440, 27, themeColors.blue);
        drawConstructionsText(
          ctx,
          api,
          'target ' + exact.toFixed(3),
          x,
          y + 120,
          26,
          themeColors.blue,
        );
        if (reveal) {
          api.rect(ctx, x, y + 65, (observed / 0.32) * 440, 23, themeColors.cyan);
          drawConstructionsText(
            ctx,
            api,
            'observed ' + observed.toFixed(4) + ' · n=' + SAMPLING_COUNTS[i],
            x,
            y + 165,
            24,
            themeColors.cyan,
          );
        }
      }
    drawConstructionsCenter(
      ctx,
      api,
      reveal
        ? 'Maximum absolute frequency error 0.0037 < supplied tolerance 0.006'
        : 'Joint law = p(first) × p(second | first)',
      1010,
      themeColors.yellow,
      31,
    );
  });
  return;
}
export default {
  id: 'sequence-check',
  draw: drawSequenceCheck,
  cues: ['sd-sequence-check-b0', 'sd-sequence-error', 'sd-sequence-check-b1'],
};
