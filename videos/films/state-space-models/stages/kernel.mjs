import { contrib, hs, xs } from '../fixtures.mjs';
import { contentWriteFixture, kernelInterventionSnapshot } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawKernel(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9);
  {
    if (currentBeat === 2) {
      const u = api.focus.progress('content-rule', 0),
        current = state.cues
          ? {
              progress: u,
              referenceContributions: contrib,
              referenceOutput: hs.at(-1),
              ...contentWriteFixture(xs, 0.3 * u),
            }
          : kernelInterventionSnapshot(progress);
      api.focus.target('kernel-same-inputs-3-1-4-2-supplied-content-rule', () =>
        text(
          ctx,
          api,
          'Same inputs 3, 1, 4, 2 · supplied content rule',
          960,
          285,
          36,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('kernel-equation', () =>
        equation(
          ctx,
          api,
          String.raw`h_t=0.9h_{t-1}+B(x_t)x_t`,
          960,
          355,
          50,
          themeColors.ink,
          'center',
        ),
      );
      const plot = teaching.axes({
        x: 230,
        y: 470,
        width: 880,
        height: 310,
        xDomain: [0.5, 4.5],
        yDomain: [0, 2.1],
        xTicks: [1, 2, 3, 4],
        yTicks: [0, 1, 2],
        xLabel: 'input position',
        yLabel: 'final contribution',
        fontSize: 27,
      });
      current.inputs.forEach((input, index) => {
        for (const [offset, value, color] of [
          [-0.14, current.referenceContributions[index], themeColors.blue],
          [0.14, current.contributions[index], themeColors.green],
        ]) {
          const top = plot.point(index + 1 + offset, value),
            base = plot.point(index + 1 + offset, 0);
          api.focus.target('content-contributions', () =>
            api.rect(ctx, top.x - 21, top.y, 42, base.y - top.y, color, undefined, 0),
          );
          api.focus.target('kernel-readout', () =>
            text(
              ctx,
              api,
              value.toFixed(3),
              top.x,
              top.y - (offset < 0 ? 16 : 49),
              23,
              color,
              'center',
            ),
          );
        }
      });
      api.focus.target('kernel-fixed-reference', () =>
        text(ctx, api, 'Fixed reference', 470, 400, 28, themeColors.blue, 'center'),
      );
      api.focus.target('kernel-current-content-rule', () =>
        text(ctx, api, 'Current content rule', 865, 400, 28, themeColors.green, 'center'),
      );
      api.focus.target('kernel-equation-2', () =>
        equation(
          ctx,
          api,
          String.raw`B(x)=0.2+${current.extraWrite.toFixed(3)}\,\mathbf{1}[x>3]`,
          1495,
          465,
          36,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('kernel-current-write-for-value-x-4', () =>
        text(ctx, api, 'Current write for value x = 4', 1495, 555, 29, themeColors.muted, 'center'),
      );
      api.focus.target('kernel-equation-3', () =>
        equation(
          ctx,
          api,
          `${current.coefficients[2].toFixed(3)}\\times4=${current.steps[2].write.toFixed(3)}`,
          1495,
          610,
          39,
          themeColors.pink,
          'center',
        ),
      );
      api.focus.target('kernel-readout-2', () =>
        text(
          ctx,
          api,
          'Fixed output  ' + current.referenceOutput.toFixed(4),
          1495,
          710,
          31,
          themeColors.blue,
          'center',
        ),
      );
      api.focus.target('kernel-readout-3', () =>
        text(
          ctx,
          api,
          'Current output  ' + current.output.toFixed(4),
          1495,
          785,
          34,
          themeColors.green,
          'center',
        ),
      );
      api.focus.target('kernel-readout-4', () =>
        text(
          ctx,
          api,
          'At lag 0: x = 1 uses 0.200 · x = 4 uses ' + current.coefficients[2].toFixed(3),
          960,
          925,
          31,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('kernel-readout-5', () =>
        text(
          ctx,
          api,
          current.progress > 0
            ? 'The write coefficient now depends on content, alongside its position in time.'
            : 'Intervene on the write rule while holding inputs and retention fixed.',
          960,
          995,
          29,
          themeColors.muted,
          'center',
        ),
      );
      return;
    }
    const end = currentBeat === 0 ? 3 : Math.min(3, Math.floor(phaseForBeat(1) * 4)),
      count =
        currentBeat === 0
          ? Math.ceil(4 * api.focus.progress('lag-contributions', phaseForBeat(0)))
          : end + 1,
      vals = xs.slice(0, count).map((x, i) => x * 0.2 * 0.9 ** (end - i));
    if (vals.length)
      api.focus.target('lag-contributions', () =>
        teaching.bars({
          x: 230,
          y: 420,
          width: 930,
          height: 340,
          values: vals,
          labels: xs.slice(0, count).map((_, i) => `input ${i + 1}`),
          max: 0.9,
          color: themeColors.cyan,
          showValues: true,
          format: (v) => v.toFixed(4),
          fontSize: 34,
        }),
      );
    api.focus.target('kernel-weighted-contributions', () =>
      text(ctx, api, 'weighted contributions', 700, 320, 38, themeColors.cyan, 'center'),
    );
    api.focus.target('kernel-equation-4', () =>
      equation(ctx, api, String.raw`K_j=0.2(0.9)^j`, 1460, 445, 54, themeColors.yellow, 'center'),
    );
    api.focus.target('kernel-readout-6', () =>
      text(
        ctx,
        api,
        `${currentBeat === 0 && count < 4 ? 'partial sum' : 'output'} ≈ ${vals.reduce((a, v) => a + v, 0).toFixed(4)}`,
        1460,
        650,
        38,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('kernel-zero-initial-state-fixed-coefficients', () =>
      text(
        ctx,
        api,
        'Zero initial state, fixed coefficients',
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
  id: 'kernel',
  draw: drawKernel,
  cues: [
    'lag-contributions',
    'decayed-sum',
    'fixed-kernel',
    'causal-convolution',
    'content-rule',
    'fixed-kernel-limit',
  ],
};
