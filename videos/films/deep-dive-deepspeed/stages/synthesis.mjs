import { adam } from '../arithmetic.mjs';
import { complete, sentence } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel(scene.id, state),
    currentBeat = modelState.b;
  {
    api.focus.target('synthesis-label', () => {
      const gather = sentence(state, 'synthesis', 0, 1),
        ready = complete(state, 'synthesis', 0, 2),
        advance = sentence(state, 'synthesis', 2, 2),
        updated = advance === 1,
        values = updated ? adam([1, 0, 0], 2, 1) : [1, 0, 0];
      drawOriginalText(
        ctx,
        api,
        'Same supplied parameter W0 · owner R0',
        960,
        285,
        37,
        themeColors.yellow,
        'center',
      );
      drawOriginalText(ctx, api, 'Full layer view', 150, 440, 31, themeColors.cyan);
      teaching.grid({
        x: 620,
        y: 380,
        width: 1110,
        height: 105,
        rows: 1,
        columns: 8,
        labels: [
          Array.from(
            {
              length: 8,
            },
            (_, i) => (i < Math.floor(gather * 8) ? 'W' + i : ''),
          ),
        ],
        fontSize: 33,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: Array.from(
          {
            length: Math.floor(gather * 8),
          },
          (_, column) => ({
            row: 0,
            column,
            fill: themeColors.panel,
            stroke: [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][
              Math.floor(column / 2)
            ],
          }),
        ),
      });
      drawOriginalCard(ctx, api, 'Rank gradients: 1 and 3', 150, 570, 650, themeColors.blue, 95);
      drawOriginalCard(
        ctx,
        api,
        ready ? 'Owner receives reduced mean 2' : 'Reduced gradient pending',
        1030,
        570,
        700,
        ready ? themeColors.cyan : themeColors.muted,
        95,
      );
      drawOriginalText(
        ctx,
        api,
        'Accumulation: ' +
          (advance > 0 ? '8 / 8 · boundary reached' : '7 / 8 · wait for final microstep'),
        960,
        775,
        36,
        advance > 0 ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'R0 state · w = ' +
          values[0].toFixed(6) +
          ' · m = ' +
          values[1].toFixed(3) +
          ' · v = ' +
          values[2].toFixed(3),
        960,
        900,
        38,
        updated ? themeColors.green : themeColors.blue,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        updated
          ? 'Complete gradient + update boundary → one computed Adam update'
          : 'Keep the same state until both conditions are ready',
        960,
        1000,
        30,
        updated ? themeColors.green : themeColors.muted,
        'center',
      );
    });
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-beat-1-focus-1',
    'ds-synthesis-b0-s0',
    'ds-synthesis-b0-s1',
    'ds-synthesis-b0-s2',
    'ds-synthesis-b0-s3',
    'ds-synthesis-b0-s4',
    'synthesis-beat-2-focus-1',
    'ds-synthesis-b1-s0',
    'ds-synthesis-b1-s1',
    'ds-synthesis-b1-s2',
    'ds-synthesis-b1-s3',
    'ds-synthesis-b1-s4',
    'synthesis-beat-3-focus-1',
    'ds-synthesis-b2-s0',
    'ds-synthesis-b2-s1',
    'ds-synthesis-b2-s2',
    'ds-synthesis-b2-s3',
  ],
};
