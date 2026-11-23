import { r0, r1 } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawPrefix(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('prefix', state),
    currentBeat = modelState.b;
  {
    [r0, r1].forEach((words, row) => {
      text(
        ctx,
        api,
        `R${row}`,
        120,
        440 + row * 210,
        33,
        row ? themeColors.pink : themeColors.blue,
      );
      api.focus.target('prefix-words-array-9-words-length-fill', () =>
        teaching.grid({
          x: 280,
          y: 365 + row * 210,
          width: 1440,
          height: 130,
          rows: 1,
          columns: 9,
          labels: [[...words, ...Array(9 - words.length).fill('')]],
          cellFocusTarget: (_r, column) => [
            column < 4
              ? 'prefix-shared-block'
              : column < 8
                ? 'prefix-divergent-block'
                : 'prefix-tail-block',
            ...(row === 1 && column >= modelState.reused ? ['prefix-r1-recompute'] : []),
          ],
          fontSize: 27,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          highlights: words.flatMap((_, column) =>
            column < modelState.reused
              ? [
                  {
                    row: 0,
                    column,
                    fill: themeColors.panel,
                    stroke: themeColors.green,
                  },
                ]
              : [],
          ),
        }),
      );
    });
    api.focus.target('prefix-block-tables', () =>
      text(
        ctx,
        api,
        'Block tables: R0 [' +
          modelState.tables.R0.join(', ') +
          ']    R1 [' +
          modelState.tables.R1.join(', ') +
          ']',
        960,
        755,
        31,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('prefix-reused-positions', () =>
      text(
        ctx,
        api,
        `Shared words: ${modelState.shared} · reusable full-block positions: ${modelState.reused}`,
        960,
        845,
        37,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('prefix-reference-count', () =>
      text(
        ctx,
        api,
        `R1 computes ${modelState.compute} positions · slot 12 has ${modelState.compatible ? 2 : 1} live reference${modelState.compatible ? 's' : ''}`,
        960,
        935,
        33,
        themeColors.yellow,
        'center',
      ),
    );
    if (currentBeat === 2)
      api.focus.target('prefix-cache-key', () =>
        card(
          ctx,
          api,
          'Cache: model R7 / adapter A / public · candidate adapter ' +
            modelState.adapter +
            ' → ' +
            (modelState.compatible ? 'matching key' : 'different key'),
          150,
          975,
          1620,
          modelState.compatible ? themeColors.cyan : themeColors.pink,
          75,
        ),
      );
    else
      text(
        ctx,
        api,
        'Later blocks diverge · complete matching blocks are the reuse unit',
        960,
        1010,
        26,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'prefix',
  draw: drawPrefix,
  cues: [
    'prefix-beat-1-focus-1',
    'prefix-beat-1-focus-2',
    'prefix-beat-2-focus-1',
    'prefix-shared-references',
    'prefix-beat-3-focus-1',
    'prefix-config-change',
  ],
};
