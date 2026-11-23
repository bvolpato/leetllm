import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawHeading, drawText } from '../defaults.mjs';
export function drawR1Pipeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue r1-pipeline/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
    cueProgress('vr-' + name + '-' + 'r1-pipeline', beat);
  const paint = () => {
    drawHeading(ctx, api, 'The reported R1 recipe restarts from V3-Base at stage three');
    const stages = [
      ['V3-Base', 220, 440],
      ['cold-start SFT', 620, 440],
      ['GRPO + language', 1100, 440],
      ['V3-Base', 220, 770],
      ['800k SFT · 2 epochs', 760, 770],
      ['final reward mix', 1390, 770],
    ];
    stages.forEach(([s, x, y], i) => {
      if (
        i < 3
          ? operationProgress(i === 0 ? 'cold' : i === 1 ? 'cold' : 'rl', 0) > 0
          : operationProgress(i === 3 ? 'restart' : i === 4 ? 'restart' : 'final', i < 5 ? 1 : 2) >
            0
      )
        drawCell(ctx, api, s, x, y, 330, 85, i === 3 ? themeColors.yellow : themeColors.blue, 27);
    });
    if (operationProgress('cold', 0) > 0) api.arrow(ctx, 550, 482, 610, 482, themeColors.muted, 3);
    if (operationProgress('rl', 0) > 0) api.arrow(ctx, 950, 482, 1090, 482, themeColors.muted, 3);
    if (operationProgress('600k', 1) > 0) {
      drawCell(ctx, api, '600k reasoning', 1110, 610, 300, 70, themeColors.cyan, 27);
      drawCell(ctx, api, '200k general', 1440, 610, 300, 70, themeColors.green, 27);
    }
    if (operationProgress('restart', 1) > 0) {
      api.arrow(ctx, 550, 812, 750, 812, themeColors.yellow, 4);
      api.arrow(ctx, 1270, 680, 1090, 760, themeColors.cyan, 3);
      drawText(ctx, api, 'New base initialization', 230, 920, 29, themeColors.yellow);
    }
    if (operationProgress('final', 2) > 0) {
      api.arrow(ctx, 1090, 812, 1375, 812, themeColors.muted, 3);
      drawText(ctx, api, 'helpfulness: final summary', 1100, 355, 27, themeColors.cyan);
      drawText(ctx, api, 'harmlessness: whole response', 1100, 395, 27, themeColors.yellow);
    }
  };
  api.focus.target('r1-pipeline-mechanism', paint);
}
export default {
  id: 'r1-pipeline',
  draw: drawR1Pipeline,
  cues: [
    'vr-r1-pipeline-b0',
    'vr-cold-r1-pipeline',
    'vr-rl-r1-pipeline',
    'vr-r1-pipeline-b1',
    'vr-600k-r1-pipeline',
    'vr-200k-r1-pipeline',
    'vr-restart-r1-pipeline',
    'vr-r1-pipeline-b2',
    'vr-final-r1-pipeline',
  ],
};
