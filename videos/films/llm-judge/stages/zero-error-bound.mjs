import { upperAfterZero, belowOnePercent } from '../arithmetic.mjs';

const originalN = 50;
const percent = (p, digits) => (100 * p).toFixed(digits) + '%';

function caseMarks(ctx, api, target, marked, repetitions = 0) {
  api.focus.target(target, () => {
    for (let i = 0; i < originalN; i++) {
      const x = 149 + (i % 10) * 83,
        y = 379 + Math.floor(i / 10) * 76;
      api.rect(
        ctx,
        x,
        y,
        69,
        57,
        !repetitions && i < marked ? api.C.green : api.C.panel,
        api.C.muted,
        4,
      );
      for (let k = 0; k < repetitions; k++)
        api.circle(ctx, x + 15 + (k % 3) * 19, y + 19 + Math.floor(k / 3) * 19, 5, api.C.cyan);
    }
  });
}

function drawBoundPlot(ctx, api) {
  const { C, focus } = api;
  const x = (count) => 204 + ((count - originalN) / 250) * 710;
  const y = (rate) => 782 - (rate / 0.06) * 387;
  const found = focus.progress('required-result', 0) === 1;
  const result = focus.progress('required-limit', 0) === 1;
  const end = found ? belowOnePercent : Math.round(50 + 180 * focus.progress('required-count', 0));
  focus.target('required-count', () => {
    api.text(ctx, 'Upper limit with zero false accepts', 145, 288, 36, C.ink);
    [0, 1, 3, 6].forEach((value) => {
      api.text(ctx, value + '%', 171, y(value / 100) + 10, 29, C.muted, 'right');
      api.line(
        ctx,
        x(50),
        y(value / 100),
        x(300),
        y(value / 100),
        value === 1 ? C.yellow : C.muted,
        value === 1 ? 3 : 1,
      );
    });
    for (const count of [50, 100, 200, 300])
      api.text(ctx, String(count), x(count), 834, 30, C.muted, 'center');
    api.text(
      ctx,
      'Independent known-bad cases in the planned sample',
      550,
      910,
      31,
      C.ink,
      'center',
    );
    for (let count = 51; count <= end; count++)
      api.line(
        ctx,
        x(count - 1),
        y(upperAfterZero(count - 1)),
        x(count),
        y(upperAfterZero(count)),
        C.cyan,
        5,
      );
    api.circle(ctx, x(50), y(upperAfterZero(50)), 9, C.cyan);
    api.text(ctx, 'Target: below 1%', 1100, 328, 41, C.yellow);
    api.math(ctx, 'N>\\frac{\\log 0.05}{\\log 0.99}', 1430, 465, 52, C.ink, 'center');
  });
  if (focus.visible('required-result'))
    focus.target('required-result', () => {
      if (found) {
        api.math(ctx, 'N=' + belowOnePercent, 1430, 605, 61, C.cyan, 'center');
        api.circle(ctx, x(belowOnePercent), y(upperAfterZero(belowOnePercent)), 11, C.green);
      } else api.text(ctx, 'Smallest whole sample?', 1430, 607, 39, C.muted, 'center');
      if (result) {
        api.text(
          ctx,
          'Exact upper limit ≈ ' + percent(upperAfterZero(belowOnePercent), 3),
          1430,
          725,
          40,
          C.green,
          'center',
        );
        api.text(
          ctx,
          belowOnePercent - 1 + ' cases: ' + percent(upperAfterZero(belowOnePercent - 1), 5),
          1430,
          810,
          33,
          C.muted,
          'center',
        );
        api.text(ctx, 'Rule of three ≈ 3 / N', 1430, 893, 34, C.muted, 'center');
      }
    });
  if (focus.visible('confidence-meaning'))
    focus.target('confidence-meaning', () =>
      api.text(
        ctx,
        'One-sided 95% confidence under independent trials with a common rate.',
        960,
        1006,
        31,
        C.ink,
        'center',
      ),
    );
}

export function drawZeroErrorBound(ctx, scene, state, api) {
  const { focus, C } = api;
  if (state.beat === 1) return drawBoundPlot(ctx, api);
  if (state.beat === 0) {
    const count = Math.ceil(originalN * focus.progress('zero-observed', 0));
    focus.target('zero-inputs', () => {
      api.text(ctx, originalN + ' independent known-bad answers', 145, 294, 39, C.ink);
      caseMarks(ctx, api, 'zero-observed', count);
    });
    focus.target('zero-observed', () => api.text(ctx, count + ' rejected', 145, 856, 47, C.green));
    if (focus.visible('zero-probability'))
      focus.target('zero-probability', () => {
        api.text(ctx, 'Probability of a clean sample', 1390, 287, 37, C.ink, 'center');
        api.math(ctx, 'P(0)=(1-p)^{' + originalN + '}', 1390, 406, 52, C.cyan, 'center');
      });
    if (focus.visible('upper-formula'))
      focus.target('upper-formula', () => {
        api.math(ctx, '(1-p_U)^{' + originalN + '}=0.05', 1390, 554, 51, C.yellow, 'center');
        api.math(ctx, 'p_U=1-0.05^{1/' + originalN + '}', 1390, 684, 52, C.ink, 'center');
      });
    if (focus.visible('upper-fifty'))
      focus.target('upper-fifty', () => {
        const result = focus.progress('upper-fifty', 0) === 1;
        api.text(
          ctx,
          result
            ? 'N = 50 → upper limit ' + percent(upperAfterZero(originalN), 2)
            : 'Upper limit for this sample?',
          1390,
          863,
          43,
          result ? C.pink : C.muted,
          'center',
        );
      });
    return;
  }
  const passes = 1 + Math.floor(5 * focus.progress('repeat-distinction', 0));
  focus.target('repeat-distinction', () => {
    api.text(ctx, 'Rerun the original cases', 145, 292, 41, C.ink);
    caseMarks(ctx, api, 'repeat-distinction', 0, passes);
    api.text(
      ctx,
      passes * originalN + ' calls   /   ' + originalN + ' distinct cases',
      145,
      857,
      45,
      C.cyan,
    );
  });
  if (focus.visible('larger-plan') || focus.visible('call-budget'))
    focus.target('call-budget', () => {
      api.text(ctx, 'Separate evaluation budget', 1120, 296, 38, C.ink);
      api.text(ctx, '200 cases × 2 orders × 3 repeats', 1120, 449, 34, C.cyan);
      if (focus.progress('call-budget', 0) === 1)
        api.math(
          ctx,
          '200\\cdot2\\cdot3=' + 200 * 2 * 3 + '\\ \\mathrm{calls}',
          1410,
          596,
          44,
          C.yellow,
          'center',
        );
    });
  if (focus.visible('stopping-rule'))
    focus.target('stopping-rule', () =>
      api.text(ctx, 'Fix the sample size before testing.', 1120, 736, 33, C.muted),
    );
  if (focus.visible('bound-scope'))
    focus.target('bound-scope', () =>
      api.text(
        ctx,
        'The bound is conditional on a known-bad answer reaching the judge.',
        960,
        990,
        34,
        C.ink,
        'center',
      ),
    );
}

export default {
  id: 'zero-error-bound',
  draw: drawZeroErrorBound,
  cues: [
    'zero-inputs',
    'zero-observed',
    'zero-probability',
    'upper-formula',
    'upper-fifty',
    'required-count',
    'required-result',
    'required-limit',
    'confidence-meaning',
    'repeat-distinction',
    'stopping-rule',
    'larger-plan',
    'call-budget',
    'bound-scope',
  ],
};
