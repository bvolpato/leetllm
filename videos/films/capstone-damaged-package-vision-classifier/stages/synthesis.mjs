import { sampleModel, visionFrame } from '../model.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const modelState = visionFrame('synthesis', state);
  let wrapped = api;
  const originalState = {
    ...state,
    visionScene: 'synthesis',
  };
  const { C: themeColors, teaching: teaching } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    wrapped.focus.target('retained-bundle', () =>
      teaching.grid({
        cellFocusTarget: (_row, column) => (column === 0 ? 'serving-bundle' : 'case-trace'),
        x: 250,
        y: 450,
        width: 1420,
        height: 360,
        rows: 3,
        columns: 2,
        labels: [
          ['Serving bundle', 'Case trace'],
          ['Crop + model + quality gate', 'Original input + route reason'],
          ['Threshold + label guide', 'Later specialist outcome'],
        ],
        fontSize: 30,
        padding: 12,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      }),
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-b1-1', 'synthesis-b1-2', 'synthesis-b2-1', 'synthesis-b2-2'],
};
