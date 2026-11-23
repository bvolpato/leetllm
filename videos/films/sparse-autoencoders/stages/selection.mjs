import { candidates } from '../fixtures.mjs';
import { selectionHistory, topKSelectionState } from '../construction.mjs';
import { retainedDrawEquation, retainedDrawText } from '../defaults.mjs';
export function drawSelection(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9);
  if (currentBeat === 2) {
    const history = selectionHistory(state.cues);
    retainedDrawText(
      ctx,
      api,
      'Observation window · main-path threshold = 2',
      960,
      285,
      34,
      themeColors.cyan,
      'center',
    );
    api.focus.target('selection-context-history', () =>
      teaching.grid({
        x: 170,
        y: 370,
        width: 1110,
        height: 390,
        rows: 5,
        columns: 6,
        labels: [
          ['Case', 'z1', 'z2', 'z3', 'z4', 'z5'],
          ...Array.from(
            {
              length: 4,
            },
            (_, i) =>
              history.rows[i]
                ? [history.rows[i].id, ...history.rows[i].code.map((value) => value.toFixed(1))]
                : ['C4', '…', '…', '…', '…', '…'],
          ),
        ],
        fontSize: 27,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: history.rows.flatMap((row, r) =>
          row.code.flatMap((value, column) =>
            value > 0
              ? [
                  {
                    row: r + 1,
                    column: column + 1,
                    fill: themeColors.panel,
                    stroke: themeColors.green,
                  },
                ]
              : [],
          ),
        ),
      }),
    );
    api.focus.target('selection-window-counts', () =>
      teaching.bars({
        x: 1370,
        y: 400,
        width: 400,
        height: 220,
        values: history.counts,
        labels: ['1', '2', '3', '4', '5'],
        max: 4,
        showValues: true,
        format: (value) => String(value),
        color: themeColors.green,
        fontSize: 24,
        gap: 20,
      }),
    );
    retainedDrawText(
      ctx,
      api,
      'Activations in ' + history.rows.length + ' contexts',
      1570,
      350,
      27,
      themeColors.green,
      'center',
    );
    if (history.rows.length === 4)
      api.focus.target('selection-rare-context', () =>
        retainedDrawText(
          ctx,
          api,
          'C4: “The windmill turned.”',
          1570,
          720,
          26,
          themeColors.yellow,
          'center',
        ),
      );
    if (history.auxiliary) {
      api.focus.target('selection-auxiliary-signal', () => {
        retainedDrawEquation(
          ctx,
          api,
          String.raw`r=[-1,-0.5],\quad a_i=\max(0,d_i^\top r)\quad\text{for unused slots}`,
          960,
          865,
          34,
          themeColors.yellow,
          'center',
        );
        [0, 2, 3].forEach((index, i) =>
          components.card({
            label: 'slot ' + (index + 1) + ': ' + history.signals[index].toFixed(2),
            x: 340 + i * 440,
            y: 930,
            width: 360,
            height: 80,
            fontSize: 28,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
            textColor: themeColors.yellow,
          }),
        );
      });
    }
    return;
  } else {
    const selected = currentBeat === 0 ? topKSelectionState(state) : null,
      values =
        currentBeat === 0
          ? selected.values
          : candidates.map((v) =>
              v > (currentBeat === 1 ? api.lerp(0.1, 2, phaseForBeat(1)) : 2) ? v : 0,
            );
    api.focus.target('selected-coefficients', () =>
      teaching.bars({
        x: 260,
        y: 420,
        width: 1110,
        height: 350,
        values,
        labels: ['1', '2', '3', '4', '5'],
        max: 2.6,
        color: themeColors.cyan,
        showValues: true,
        format: (v) => v.toFixed(2),
        fontSize: 34,
      }),
    );
    retainedDrawText(
      ctx,
      api,
      currentBeat === 0
        ? selected.applied
          ? 'TopK cap: 2'
          : 'rank positive candidates'
        : 'threshold selection',
      1550,
      400,
      36,
      themeColors.yellow,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      `${values.filter((v) => v > 0).length} active`,
      1550,
      610,
      40,
      themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'selection',
  draw: drawSelection,
  cues: [
    'selection-b1-1',
    'selection-b2-1',
    'selection-b3-1',
    'selection-rare-context',
    'selection-auxiliary-signal',
  ],
};
