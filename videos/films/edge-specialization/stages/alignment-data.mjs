import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeL, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawAlignmentData(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('alignment-data', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-alignment-data-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Compare the same token events under the same prefix'
        : currentBeat === 1
          ? 'Split source families before generating variants'
          : 'Check the actual applicability fields',
    );
    if (currentBeat === 0) {
      drawEdgeRow(
        ctx,
        api,
        ['Teacher prefix: sensor A', 'ID 7 = battery', 'ID 9 = low'],
        150,
        390,
        1600,
        100,
        themeColors.blue,
      );
      drawEdgeRow(
        ctx,
        api,
        ['Student prefix: sensor A', 'ID 7 = lens', 'ID 3 = covered'],
        150,
        570,
        1600,
        100,
        themeColors.pink,
      );
      if (done('same-id')) {
        drawEdgeL(ctx, api, 955, 495, 955, 570, themeColors.pink, 5);
        drawEdgeText(
          ctx,
          api,
          'ID 7 refers to different events',
          960,
          735,
          32,
          themeColors.pink,
          'center',
        );
      }
      if (done('retokenize'))
        drawEdgeRow(
          ctx,
          api,
          ['Teacher text: battery low', 'student battery IDs', 'student low IDs'],
          150,
          845,
          1600,
          95,
          themeColors.green,
        );
    }
    if (currentBeat === 1) {
      const p = progress('split'),
        families = ['manual A', 'manual B', 'manual C'];
      families.forEach((f, i) => {
        const x = 240 + i * 550;
        drawEdgeCard(
          ctx,
          api,
          f,
          x,
          370,
          400,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
        );
        for (let j = 0; j < 3; j++) {
          const y = 550 + j * 110;
          drawEdgeCard(
            ctx,
            api,
            `family ${'ABC'[i]} · variant ${j + 1}`,
            x + (p < 1 ? (1 - p) * 55 : 0),
            y,
            400,
            [themeColors.blue, themeColors.green, themeColors.pink][i],
            80,
          );
        }
      });
      drawEdgeText(
        ctx,
        api,
        'TRAIN                                  VALIDATION                                 TEST',
        960,
        930,
        31,
        themeColors.cyan,
        'center',
      );
    }
    if (currentBeat === 2) {
      const repaired = done('verifier');
      drawEdgeRow(
        ctx,
        api,
        ['question sensor A', 'code E2', 'required source identity', 'claimed value'],
        150,
        390,
        1600,
        95,
        themeColors.cyan,
      );
      drawEdgeRow(
        ctx,
        api,
        repaired
          ? ['M7: sensor A', 'E2', 'applies to A', 'battery low']
          : ['M8: sensor B', 'E2', 'wrong equipment', 'lens covered'],
        150,
        610,
        1600,
        110,
        repaired ? themeColors.green : themeColors.pink,
      );
      drawEdgeText(
        ctx,
        api,
        repaired
          ? 'Replay repaired: citation, equipment, code and value agree'
          : 'Replay mismatch: a real source for a different sensor',
        960,
        865,
        30,
        repaired ? themeColors.green : themeColors.pink,
        'center',
      );
    }
    note('Token strings and variant families are illustrative; IDs alone establish no alignment');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'alignment-data',
  draw: drawAlignmentData,
  cues: [
    'edge-alignment-data-op-0',
    'edge-alignment-data-same-id',
    'edge-alignment-data-retokenize',
    'edge-alignment-data-op-1',
    'edge-alignment-data-split',
    'edge-alignment-data-op-2',
    'edge-alignment-data-verifier',
  ],
};
