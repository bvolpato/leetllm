import { sum } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawTail(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('tail', state),
    currentBeat = modelState.step;
  {
    const wrong = state.cues?.['kg-tail-wrong']?.progress ?? (currentBeat === 0 ? modelState.q : 1),
      repair = state.cues?.['kg-tail-repair']?.progress ?? (currentBeat === 1 ? modelState.q : 0),
      effect = state.cues
        ? currentBeat > 0 || (state.cues['kg-tail-effect']?.progress ?? 0) === 1
        : true;
    drawText(ctx, api, 'Five real features · eight reduction slots', 150, 285, 36);
    drawText(ctx, api, 'Logical divisor stays5', 1700, 285, 30, themeColors.yellow, 'right');
    const labels = modelState.terms.map((v, i) =>
      i < 5 ? String(v) : wrong === 0 && currentBeat === 0 ? '?' : Number(v.toFixed(2)),
    );
    api.focus.target('tail-s-terms', () => {
      teaching.grid({
        x: 170,
        y: 420,
        width: 1560,
        height: 150,
        rows: 1,
        columns: 8,
        labels: [labels],
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        fontSize: 40,
        highlights: [5, 6, 7].map((column) => ({
          row: 0,
          column,
          fill:
            wrong === 0 && currentBeat === 0
              ? themeColors.panel
              : modelState.terms[column] === 0
                ? '#8cdeb52b'
                : '#ef9ac82b',
          stroke:
            wrong === 0 && currentBeat === 0
              ? themeColors.muted
              : modelState.terms[column] === 0
                ? themeColors.green
                : themeColors.pink,
        })),
      });
      if (wrong > 0 || currentBeat > 0) {
        const active = Math.max(0, Math.min(2, Math.floor((currentBeat ? repair : wrong) * 3) - 1)),
          x = 170 + (active + 5.5) * 195;
        api.arrow(ctx, x, 590, x, 690, currentBeat ? themeColors.green : themeColors.pink, 4);
        drawText(
          ctx,
          api,
          'pad contribution',
          x,
          750,
          26,
          currentBeat ? themeColors.green : themeColors.pink,
          'center',
        );
      }
    });
    drawText(ctx, api, 'Squared contributions', 960, 650, 32, themeColors.blue, 'center');
    if (wrong > 0 || currentBeat > 0)
      drawText(
        ctx,
        api,
        '55 + ' + sum(modelState.terms.slice(5)) + ' = ' + modelState.numerator,
        890,
        750,
        32,
        themeColors.yellow,
        'center',
      );
    if (effect)
      drawText(
        ctx,
        api,
        'Mean ' + modelState.mean.toFixed(2) + ' · reference ' + modelState.correct,
        960,
        850,
        52,
        modelState.mean === modelState.correct ? themeColors.green : themeColors.pink,
        'center',
      );
    const caption =
      wrong === 0 && currentBeat === 0
        ? 'The three invalid lanes still need a declared reduction value'
        : modelState.terms.slice(5).every((v) => v === 0)
          ? 'Invalid lanes contribute zero · divisor remains the logical width'
          : 'Wrong padding: invalid lane contributions [' +
            modelState.terms
              .slice(5)
              .map((v) => Number(v.toFixed(2)))
              .join(', ') +
            '] · mean ' +
            modelState.mean.toFixed(2) +
            ' vs reference ' +
            modelState.correct.toFixed(2);
    drawText(ctx, api, caption, 960, 975, 29, themeColors.yellow, 'center');
  }
}
export default {
  id: 'tail',
  draw: drawTail,
  cues: [
    'tail-beat-1-focus-1',
    'kg-tail-wrong',
    'kg-tail-effect',
    'tail-beat-2-focus-1',
    'kg-tail-repair',
  ],
};
