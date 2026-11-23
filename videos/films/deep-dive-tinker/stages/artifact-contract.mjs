import { sentence, tinkerConstruction } from '../construction.mjs';
import {
  drawExtendedCard,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
} from '../defaults.mjs';
export function drawArtifactContract(ctx, scene, state, api) {
  return paintArtifactContract(ctx, scene, state, api);
}
function paintArtifactContract(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('artifact-contract', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'artifact-contract', beat, index);
  return focus.target('tk-artifact-contract-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Choose stored fields by the next consumer',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    const labels = ['Adapter weights', 'Optimizer moments', 'Base / tokenizer / renderer'];
    if (currentBeat === 0) {
      labels.forEach((label, i) =>
        drawExtendedText(ctx, api, label, 150, 405 + i * 140, 28, themeColors.blue),
      );
      ['Weights-only path', 'Optimizer-preserving path'].forEach((label, j) => {
        drawExtendedText(
          ctx,
          api,
          label,
          950 + j * 550,
          310,
          29,
          j === 0 ? themeColors.pink : themeColors.green,
          'center',
        );
        labels.forEach((_, i) =>
          drawExtendedCard(
            ctx,
            api,
            j === 0 ? ['v2', 'missing', 'required'][i] : ['v2', 'restored', 'required'][i],
            710 + j * 550,
            350 + i * 140,
            480,
            100,
            j === 0 && i === 1 ? themeColors.pink : themeColors.green,
            31,
          ),
        );
      });
    } else if (currentBeat === 1) {
      drawExtendedRow(
        ctx,
        api,
        'Checkpoint manifest',
        ['run R', 'step 9', 'TTL declared'],
        365,
        themeColors.cyan,
      );
      drawExtendedRow(
        ctx,
        api,
        'Lineage',
        ['dataset hash', 'reward hash', 'base revision'],
        500,
        themeColors.blue,
      );
      const alive = cueProgress(1, 2) < 1;
      drawExtendedCard(
        ctx,
        api,
        alive ? 'Stored path: available' : 'Expired path: unavailable',
        400,
        725,
        1120,
        135,
        alive ? themeColors.green : themeColors.pink,
        34,
      );
      drawExtendedNote(
        ctx,
        api,
        'A path names stored state; it does not explain the data or verifier that produced it.',
      );
    } else {
      drawExtendedRow(
        ctx,
        api,
        'Compatible model fields',
        ['base B', 'adapter v2', 'tokenizer T'],
        365,
        themeColors.blue,
      );
      drawExtendedRow(
        ctx,
        api,
        'Exported layout',
        ['PEFT adapter', 'or merged W′', 'renderer R'],
        510,
        themeColors.cyan,
      );
      drawExtendedCard(
        ctx,
        api,
        'Remote optimizer history is not part of this portable model layout',
        230,
        750,
        1460,
        120,
        themeColors.pink,
        31,
      );
      drawExtendedNote(
        ctx,
        api,
        'Retain model rights and evaluate independently in the destination runtime.',
      );
    }
  });
}
export default {
  id: 'artifact-contract',
  draw: drawArtifactContract,
  cues: [
    'tk-artifact-contract-0-0',
    'tk-artifact-contract-0-1',
    'tk-artifact-contract-0-2',
    'tk-artifact-contract-0-3',
    'tk-artifact-contract-1-0',
    'tk-artifact-contract-1-1',
    'tk-artifact-contract-1-2',
    'tk-artifact-contract-1-3',
    'tk-artifact-contract-2-0',
    'tk-artifact-contract-2-1',
    'tk-artifact-contract-2-2',
    'tk-artifact-contract-2-3',
  ],
};
