import { sentence, tinkerConstruction } from '../construction.mjs';
import {
  drawExtendedCard,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
} from '../defaults.mjs';
export function drawTrajectoryBranch(ctx, scene, state, api) {
  return paintTrajectoryBranch(ctx, scene, state, api);
}
function paintTrajectoryBranch(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('trajectory-branch', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'trajectory-branch', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-trajectory-branch-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Supplied token identities · one trajectory can produce two datums',
      960,
      275,
      33,
      themeColors.yellow,
      'center',
    );
    const first = resultComplete(0, 1) ? modelState.first : [10, 11, 20];
    drawExtendedRow(ctx, api, 'O1 + A1 + O2 + A2', first, 350, themeColors.blue);
    const prefix = resultComplete(0, 2) ? modelState.second : [10, 11, 20, 30];
    drawExtendedRow(
      ctx,
      api,
      resultComplete(0, 2) ? 'O3 reset + A3' : 'Extending O2',
      prefix,
      480,
      resultComplete(0, 2) ? themeColors.pink : themeColors.cyan,
    );
    if (modelState.split) {
      drawExtendedCard(
        ctx,
        api,
        'Datum 1 closes: [10, 11, 20, 30, 40]',
        180,
        620,
        1540,
        90,
        themeColors.blue,
        30,
      );
      drawExtendedCard(
        ctx,
        api,
        'Datum 2 starts: [50, 60]',
        180,
        735,
        1540,
        90,
        themeColors.cyan,
        30,
      );
    }
    if (currentBeat === 1) {
      drawExtendedRow(
        ctx,
        api,
        'Datum 1 target roles',
        ['prompt', 'action', 'observe', 'action'],
        850,
        themeColors.green,
      );
      if (modelState.shifted)
        drawExtendedText(
          ctx,
          api,
          'Targets [11, 20, 30, 40] · action mask [0, 1, 0, 1]',
          960,
          965,
          30,
          themeColors.yellow,
          'center',
        );
    }
    drawExtendedNote(
      ctx,
      api,
      'Observation positions carry zero score / reward credit / action mask; sampled actions retain their evidence.',
    );
  });
}
export default {
  id: 'trajectory-branch',
  draw: drawTrajectoryBranch,
  cues: [
    'tk-trajectory-branch-0-0',
    'tk-trajectory-branch-0-1',
    'tk-trajectory-branch-0-2',
    'tk-trajectory-branch-0-3',
    'tk-trajectory-branch-1-0',
    'tk-trajectory-branch-1-1',
    'tk-trajectory-branch-1-2',
    'tk-trajectory-branch-1-3',
  ],
};
