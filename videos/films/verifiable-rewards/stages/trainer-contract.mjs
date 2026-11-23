import { rlvrReduction, vrBound } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawHeading, drawRectangle, drawText } from '../defaults.mjs';
export function drawTrainerContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue trainer-contract/' + id);
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
      cueProgress('vr-' + name + '-' + 'trainer-contract', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(
      ctx,
      api,
      'Retain the same six token losses; change their actual averaging weights',
    );
    const z = rlvrReduction(operationProgress('global', 0)),
      lengths = [2, 4];
    if (currentBeat !== 2)
      lengths.forEach((n, r) => {
        drawText(ctx, api, 'response ' + (r + 1), 230, 450 + r * 175, 29, themeColors.blue);
        for (let i = 0; i < n; i++) {
          drawCell(
            ctx,
            api,
            'loss ' + z.terms[r],
            530 + i * 245,
            395 + r * 175,
            200,
            80,
            r ? themeColors.cyan : themeColors.green,
            29,
          );
          drawText(
            ctx,
            api,
            '× ' + z.weights[r].toFixed(4),
            630 + i * 245,
            535 + r * 175,
            27,
            themeColors.yellow,
            'center',
          );
        }
      });
    if (resultComplete('equal', 0))
      drawText(
        ctx,
        api,
        resultComplete('global', 0)
          ? 'global: 4 / 6 = ' + z.loss.toFixed(6)
          : operationProgress('global', 0) > 0
            ? 'weights changing · loss ' + z.loss.toFixed(6)
            : 'equal response means: (2 + 0) / 2 = 1',
        960,
        825,
        35,
        themeColors.ink,
        'center',
      );
    if (currentBeat === 1 && operationProgress('asymmetric', 1) > 0)
      drawText(
        ctx,
        api,
        'Lower clip / upper clip / overlength masks are separate controls',
        960,
        920,
        29,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2 && operationProgress('beta', 2) > 0) {
      drawRectangle(ctx, api, 190, 345, 1540, 450, themeColors.blue);
      drawText(ctx, api, 'Inspected TRL guide edition', 960, 410, 35, themeColors.blue, 'center');
      [
        'loss: dapo',
        'reward scaling: group',
        'ratio level: token',
        'beta: 0 → no reference for disabled KL',
      ].forEach((v, i) =>
        drawText(
          ctx,
          api,
          v,
          300,
          510 + i * 75,
          31,
          i === 3 ? themeColors.yellow : themeColors.ink,
        ),
      );
    }
    drawFooter(
      ctx,
      api,
      'Pin the actual trainer version and complete reduction, mask, sampling and KL recipe.',
    );
  };
  api.focus.target('trainer-contract-mechanism', paint);
}
export default {
  id: 'trainer-contract',
  draw: drawTrainerContract,
  cues: [
    'vr-trainer-contract-b0',
    'vr-equal-trainer-contract',
    'vr-global-trainer-contract',
    'vr-trainer-contract-b1',
    'vr-asymmetric-trainer-contract',
    'vr-trainer-contract-b2',
    'vr-beta-trainer-contract',
  ],
};
