import { vrBound } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawLine, drawText } from '../defaults.mjs';
export function drawCapabilityGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue capability-gates/' + id);
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
      cueProgress('vr-' + name + '-' + 'capability-gates', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Apply every required product gate');
    const rows = [
      ['reasoning', 61, 74, 'gain 13 pp', themeColors.green, 'reasoning'],
      ['instruction', 92, 81, 'decline 11 pp > 3', themeColors.pink, 'instruction'],
      ['unnecessary refusal', 4, 13, 'rise 9 pp > 2', themeColors.pink, 'refusal'],
    ];
    rows.forEach(([label, a, z, claim, color, key], i) => {
      const y = 430 + i * 175;
      drawText(ctx, api, label, 220, y, 30, themeColors.blue);
      drawText(ctx, api, a + '% →', 770, y, 32, themeColors.muted);
      if (operationProgress(key, 0) > 0) {
        drawText(ctx, api, z + '%', 1020, y, 35, color);
        drawLine(ctx, api, 1200, y - 20, 1200 + Math.abs(z - a) * 18, y - 20, color, 12);
        if (resultComplete(key, 0)) drawText(ctx, api, claim, 1200, y + 55, 29, color);
      }
    });
    if (resultComplete('blocked', 0))
      drawText(
        ctx,
        api,
        'HOLD · both regressions exceed the allowed limits',
        960,
        955,
        33,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 1 && operationProgress('points', 1) > 0)
      drawText(
        ctx,
        api,
        'Percentage-point gates · point estimates are not confidence intervals',
        960,
        345,
        28,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2 && operationProgress('repair', 2) > 0)
      drawText(
        ctx,
        api,
        'Repair candidate → rerun the full product evaluation',
        960,
        345,
        31,
        themeColors.cyan,
        'center',
      );
    drawFooter(ctx, api, 'A gain in one capability does not offset a required gate failure.');
  };
  api.focus.target('capability-gates-mechanism', paint);
}
export default {
  id: 'capability-gates',
  draw: drawCapabilityGates,
  cues: [
    'vr-capability-gates-b0',
    'vr-reasoning-capability-gates',
    'vr-instruction-capability-gates',
    'vr-refusal-capability-gates',
    'vr-blocked-capability-gates',
    'vr-capability-gates-b1',
    'vr-points-capability-gates',
    'vr-capability-gates-b2',
    'vr-repair-capability-gates',
  ],
};
