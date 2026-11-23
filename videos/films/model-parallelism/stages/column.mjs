import { W } from '../fixtures.mjs';
import { columnTeachingState, shards } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalMatrix,
  drawOriginalText,
} from '../defaults.mjs';
export function drawColumn(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    api.focus.target('column-replicated-input-1-2', () =>
      drawOriginalCard(ctx, api, 'Replicated input [1, 2]', 560, 285, 800, themeColors.blue),
    );
    api.focus.target('column-gpu-0-output-columns-1-2', () =>
      drawOriginalText(
        ctx,
        api,
        'GPU 0: output columns 1–2',
        525,
        440,
        32,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('column-gpu-1-output-columns-3-4', () =>
      drawOriginalText(
        ctx,
        api,
        'GPU 1: output columns 3–4',
        1350,
        440,
        32,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('column-readout', () =>
      drawOriginalMatrix(
        ctx,
        api,
        W.map((row) => row.slice(0, 2)),
        400,
        490,
        100,
        themeColors.blue,
      ),
    );
    api.focus.target('column-readout-2', () =>
      drawOriginalMatrix(
        ctx,
        api,
        W.map((row) => row.slice(2)),
        1225,
        490,
        100,
        themeColors.cyan,
      ),
    );
    api.focus.reveal('complete-slices', () => {
      api.focus.target('column-readout-3', () =>
        drawOriginalMatrix(ctx, api, [result.left], 400, 755, 100, themeColors.blue),
      );
      api.focus.target('column-readout-4', () =>
        drawOriginalMatrix(ctx, api, [result.right], 1225, 755, 100, themeColors.cyan),
      );
    });
    const column = columnTeachingState(state);
    if (state.cues && currentBeat === 1) {
      column.count = Math.ceil(4 * api.focus.progress('concatenate-slices', 0));
      column.visibleJoined = column.joined.slice(0, column.count);
    }
    if (column.mode === 'local-products')
      api.focus.target('column-each-device-completes-its-own-output-slice', () =>
        drawOriginalText(
          ctx,
          api,
          'Each device completes its own output slice',
          960,
          945,
          32,
          themeColors.muted,
          'center',
        ),
      );
    else if (column.mode === 'concatenation') {
      api.focus.target('column-readout-5', () =>
        drawOriginalText(
          ctx,
          api,
          `Concatenation reference · ${column.count}/4 coordinates`,
          960,
          905,
          29,
          themeColors.muted,
          'center',
        ),
      );
      const entries = column.joined
        .map((value, index) => (index < column.count ? String(value) : String.raw`\cdot`))
        .join(',');
      api.focus.target('column-equation', () =>
        drawOriginalEquation(
          ctx,
          api,
          (column.count === column.joined.length
            ? String.raw`[Y_0\mid Y_1]`
            : String.raw`\text{Visible concatenation}`) + `=[${entries}]`,
          960,
          975,
          42,
          themeColors.yellow,
          'center',
        ),
      );
    } else {
      api.focus.target('column-local-elementwise-activation-slices-stay-distributed', () =>
        drawOriginalText(
          ctx,
          api,
          'Local elementwise activation · slices stay distributed',
          960,
          905,
          29,
          themeColors.muted,
          'center',
        ),
      );
      column.slices.forEach((slice, index) =>
        api.focus.target('column-equation-2', () =>
          drawOriginalEquation(
            ctx,
            api,
            String.raw`\operatorname{ReLU}([` +
              slice.join(',') +
              '])=[' +
              column.activated[index].join(',') +
              ']',
            index ? 1350 : 520,
            975,
            32,
            index ? themeColors.cyan : themeColors.blue,
            'center',
          ),
        ),
      );
    }
  }
}
export default {
  id: 'column',
  draw: drawColumn,
  cues: [
    'column-split',
    'complete-slices',
    'local-halves',
    'concatenate-slices',
    'local-activation',
    'distributed-slices',
  ],
};
