import { rlvrDecimalCheck, vrBound } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawHeading, drawTable, drawText } from '../defaults.mjs';
export function drawLabExactness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue lab-exactness/' + id);
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
      cueProgress('vr-' + name + '-' + 'lab-exactness', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Exact bounded decimal comparison preserves the inclusive boundary');
    if (currentBeat === 0) {
      drawTable(
        ctx,
        api,
        ['trusted reference object', 'route'],
        [
          ['integer / bounded decimal string', 'validate'],
          ['Boolean / floating object', 'reject reference'],
          ['candidate field / tolerance', 'bounded grammar'],
        ],
        220,
        405,
        1460,
        150,
      );
    } else {
      const late = operationProgress('tail', 2) > 0,
        values = late ? ['0.10000000000000000001', '0.1', '0'] : ['50.36', '50.35', '0.01'];
      values.forEach((v, i) => {
        drawText(
          ctx,
          api,
          ['predicted', 'expected', 'tolerance'][i],
          220,
          430 + i * 130,
          29,
          themeColors.muted,
        );
        drawCell(
          ctx,
          api,
          v,
          650,
          375 + i * 130,
          1030,
          85,
          i === 0 ? themeColors.blue : themeColors.cyan,
          late ? 32 : 39,
        );
      });
      if (resultComplete(late ? 'tail' : 'equality', late ? 2 : 1))
        drawText(
          ctx,
          api,
          rlvrDecimalCheck(...values).pass
            ? 'exact difference ≤ tolerance → PASS'
            : 'exact difference > tolerance → FAIL',
          960,
          845,
          35,
          late ? themeColors.pink : themeColors.green,
          'center',
        );
      if (!late && operationProgress('beyond', 1) > 0)
        drawText(
          ctx,
          api,
          '50.361: difference 0.011 > 0.01 → FAIL',
          960,
          935,
          32,
          themeColors.pink,
          'center',
        );
      if (late && operationProgress('gold-first', 2) > 0)
        drawText(
          ctx,
          api,
          'Validate gold first; invalid gold is quarantined',
          960,
          935,
          29,
          themeColors.yellow,
          'center',
        );
    }
    drawFooter(
      ctx,
      api,
      '20 digits before and after the point; no binary-float broadening of zero tolerance.',
    );
  };
  api.focus.target('lab-exactness-mechanism', paint);
}
export default {
  id: 'lab-exactness',
  draw: drawLabExactness,
  cues: [
    'vr-lab-exactness-b0',
    'vr-typed-lab-exactness',
    'vr-lab-exactness-b1',
    'vr-fractions-lab-exactness',
    'vr-equality-lab-exactness',
    'vr-beyond-lab-exactness',
    'vr-lab-exactness-b2',
    'vr-tail-lab-exactness',
    'vr-gold-first-lab-exactness',
  ],
};
