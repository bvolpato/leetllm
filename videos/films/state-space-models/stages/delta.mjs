import { deltaSnapshot } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawDelta(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const q = teaching.axes({
        x: 235,
        y: 400,
        width: 880,
        height: 350,
        xDomain: [0, 2.2],
        yDomain: [0, 1.05],
        xTicks: [0, 1, 2],
        yTicks: [0, 0.5, 1],
        xLabel: 'step size',
        yLabel: 'retained fraction',
        fontSize: 34,
      }),
      current = deltaSnapshot(currentBeat, progress);
    if (state.cues) {
      const d =
        currentBeat === 0
          ? 0.1 + 1.9 * api.focus.progress('large-step', 0)
          : currentBeat === 1
            ? 2 - api.focus.progress('probe-retention', 0)
            : 1 - 0.9 * api.focus.progress('small-step-limit', 0);
      Object.assign(current, {
        step: d,
        retention: Math.exp(-d),
        exactWrite: 1 - Math.exp(-d),
        mambaWrite: d,
        showExact: state.cues['ssm-delta-exact']?.phase === 'after',
        showMamba: state.cues['ssm-delta-mamba']?.phase === 'after',
      });
    }
    const d = current.step;
    api.focus.target('retention-curve', () =>
      teaching.curve({
        plot: q,
        points: sampleFunction((x) => Math.exp(-x), 0, 2.2, 100),
        color: themeColors.green,
        width: 6,
      }),
    );
    const at = q.point(d, current.retention);
    api.focus.target('retention-probe', () => api.circle(ctx, at.x, at.y, 12, themeColors.yellow));
    api.focus.target('delta-equation', () =>
      equation(
        ctx,
        api,
        String.raw`\bar A=e^{-\Delta}`,
        1460,
        390,
        58,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('delta-readout', () =>
      text(ctx, api, `step ${d.toFixed(2)}`, 1460, 520, 38, themeColors.yellow, 'center'),
    );
    api.focus.target('delta-readout-2', () =>
      text(
        ctx,
        api,
        `retained fraction ${current.retention.toFixed(3)}`,
        1460,
        585,
        30,
        themeColors.green,
        'center',
      ),
    );
    {
      api.focus.target('delta-readout-3', () =>
        text(
          ctx,
          api,
          current.showExact
            ? `exact write ≈ ${current.exactWrite.toFixed(3)}`
            : 'Exact held write pending',
          1460,
          670,
          36,
          themeColors.blue,
          'center',
        ),
      );
    }
    api.focus.target('delta-readout-4', () =>
      text(
        ctx,
        api,
        current.showMamba
          ? `Mamba write = ${current.mambaWrite.toFixed(3)}`
          : 'Mamba write pending',
        1460,
        770,
        36,
        themeColors.pink,
        'center',
      ),
    );
    api.focus.target('delta-scalar-a-1-b-1-held-input-1', () =>
      text(
        ctx,
        api,
        'Scalar A = −1, B = 1, held input = 1',
        960,
        945,
        36,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'delta',
  draw: drawDelta,
  cues: [
    'discrete-decay',
    'large-step',
    'probe-retention',
    'exact-write',
    'mamba-write',
    'ssm-delta-exact',
    'ssm-delta-mamba',
    'unit-step',
    'small-step-limit',
  ],
};
