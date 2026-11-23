import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawPositionUnits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const drawMechanism = () => {
    completionHeading(ctx, api, 'One caret · three coordinate systems');
    const rows = [
      {
        label: 'Python code points',
        cells: ['a', 'U+1F600', 'b'],
        widths: [140, 420, 140],
        caret: 2,
        color: themeColors.blue,
      },
      {
        label: 'UTF-16 code units',
        cells: ['a', 'high surrogate', 'low surrogate', 'b'],
        widths: [140, 210, 210, 140],
        caret: 3,
        color: themeColors.cyan,
      },
      {
        label: 'UTF-8 bytes',
        cells: ['61', 'F0', '9F', '98', '80', '62'],
        widths: [140, 105, 105, 105, 105, 140],
        caret: 5,
        color: themeColors.pink,
      },
    ];
    rows.forEach((r, j) => {
      completionText(ctx, api, r.label, 200, 410 + j * 190, 29, r.color);
      let x = 650;
      for (let i = 0; i < r.cells.length; i++) {
        completionBox(ctx, api, r.cells[i], x, 360 + j * 190, r.widths[i], 85, r.color);
        x += r.widths[i];
        if (i === r.caret - 1) {
          api.line(ctx, x, 340 + j * 190, x, 470 + j * 190, themeColors.yellow, 4);
          completionText(
            ctx,
            api,
            String(r.caret),
            x,
            510 + j * 190,
            31,
            themeColors.yellow,
            'center',
          );
        }
      }
    });
    completionFooter(
      ctx,
      api,
      currentBeat
        ? 'Convert using the editor API before slicing · index 3 loses b; byte 3 splits the emoji'
        : 'After the emoji: Python 2 · UTF-16 3 · UTF-8 5',
    );
  };
  api.focus.target('cc-position-units-mechanism', drawMechanism);
  return;
}
export default {
  id: 'position-units',
  draw: drawPositionUnits,
  cues: [
    'cc-position-units-0',
    'cc-position-three-five',
    'cc-position-wrong-suffix',
    'cc-position-units-1',
  ],
};
