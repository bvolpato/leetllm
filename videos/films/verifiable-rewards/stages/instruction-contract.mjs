import { vrBound } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawRectangle, drawText } from '../defaults.mjs';
export function drawInstructionContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue instruction-contract/' + id);
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
      cueProgress('vr-' + name + '-' + 'instruction-contract', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Parse the entire supplied response');
    const repaired = false,
      lines = ['- first item', '- second item', '- third item', ...['extra prose']];
    lines.forEach((s, i) => {
      const y = 410 + i * 105;
      drawText(ctx, api, i + 1, 240, y, 27, themeColors.muted);
      drawText(ctx, api, s, 310, y, 36, i === 3 ? themeColors.pink : themeColors.blue);
    });
    const weak = operationProgress('weak', 0),
      strict = operationProgress('strict', 0);
    if (weak > 0) {
      drawRectangle(ctx, api, 1030, 360, 680, 160, themeColors.yellow);
      drawText(ctx, api, 'weak bullet count = 3', 1370, 420, 31, themeColors.yellow, 'center');
      if (resultComplete('weak', 0))
        drawText(ctx, api, 'ACCEPT', 1370, 485, 30, themeColors.yellow, 'center');
    }
    if (strict > 0) {
      drawRectangle(ctx, api, 1030, 590, 680, 185, themeColors.pink);
      drawText(
        ctx,
        api,
        'whole-response lines = ' + lines.length,
        1370,
        650,
        31,
        themeColors.ink,
        'center',
      );
      if (resultComplete('strict', 0))
        drawText(ctx, api, 'format REJECT', 1370, 725, 32, themeColors.pink, 'center');
    }
    if (currentBeat === 1 && operationProgress('boundary', 1) > 0)
      drawText(
        ctx,
        api,
        'Format ✓ does not measure helpfulness',
        1050,
        895,
        29,
        themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Exactly three lines, all nonempty, each beginning with “- ”. Fix the parser before training on its score.',
    );
  };
  api.focus.target('instruction-contract-mechanism', paint);
}
export default {
  id: 'instruction-contract',
  draw: drawInstructionContract,
  cues: [
    'vr-instruction-contract-b0',
    'vr-weak-instruction-contract',
    'vr-strict-instruction-contract',
    'vr-instruction-contract-b1',
    'vr-boundary-instruction-contract',
    'vr-instruction-contract-b2',
    'vr-repair-instruction-contract',
  ],
};
