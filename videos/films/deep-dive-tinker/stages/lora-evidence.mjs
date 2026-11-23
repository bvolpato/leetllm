import { tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawLoraEvidence(ctx, scene, state, api) {
  return paintLoraEvidence(ctx, scene, state, api);
}
function paintLoraEvidence(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('lora-evidence', state),
    currentBeat = modelState.b;
  return focus.target('tk-lora-evidence-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Which runs isolate the effect of rank?',
      960,
      275,
      33,
      themeColors.yellow,
      'center',
    );
    ['Base revision', 'Data / reward', 'Target modules', 'Rank', 'Evaluation'].forEach((name, i) =>
      drawExtendedText(ctx, api, name, 290 + i * 325, 370, 27, themeColors.muted, 'center'),
    );
    const rows =
      currentBeat === 0
        ? [
            ['same', 'same', 'attention', 'r', 'same'],
            ['same', 'same', 'MLP', 'count matched', 'same'],
          ]
        : [
            ['base A', 'data D', 'MLP', '2', 'eval E'],
            ['base A', 'data D', 'MLP', '4', 'eval E'],
            ['base A', 'data D', 'attention', '4', 'eval E'],
          ];
    rows.forEach((values, i) =>
      values.forEach((v, j) =>
        drawExtendedCard(
          ctx,
          api,
          v,
          150 + j * 325,
          425 + i * 145,
          285,
          100,
          currentBeat === 1 && i === 2 && j === 2
            ? themeColors.pink
            : j === 3
              ? themeColors.cyan
              : themeColors.blue,
          27,
        ),
      ),
    );
    if (currentBeat === 0)
      drawExtendedCard(
        ctx,
        api,
        'Published study: module choice and task setting are part of the result',
        200,
        800,
        1520,
        115,
        themeColors.yellow,
        31,
      );
    else {
      api.line(ctx, 1130, 525, 1130, 570, themeColors.cyan, 4);
      drawExtendedText(ctx, api, 'Rank-only contrast', 960, 905, 32, themeColors.green, 'center');
      drawExtendedText(
        ctx,
        api,
        'First vs. third changes both rank and modules',
        960,
        960,
        29,
        themeColors.pink,
        'center',
      );
    }
    drawExtendedNote(
      ctx,
      api,
      'Study results apply to the tested modules, tasks and data. Frozen base computation remains.',
    );
  });
}
export default {
  id: 'lora-evidence',
  draw: drawLoraEvidence,
  cues: [
    'tk-lora-evidence-0-0',
    'tk-lora-evidence-0-1',
    'tk-lora-evidence-0-2',
    'tk-lora-evidence-0-3',
    'tk-lora-evidence-1-0',
    'tk-lora-evidence-1-1',
    'tk-lora-evidence-1-2',
    'tk-lora-evidence-1-3',
  ],
};
