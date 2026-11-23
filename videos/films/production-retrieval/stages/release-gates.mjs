import { releaseCases } from '../model.mjs';
import { drawText, footer, recordCard } from '../defaults.mjs';
export function drawReleaseGates(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const cases = releaseCases();
    const passed = cases.map((test) =>
      test.mustReject
        ? !test.result.text.includes('limit 14')
        : test.result.decision === test.expected,
    );
    cases.forEach((test, i) => {
      const x = 75 + i * 455;
      const detail = test.mustReject
        ? 'UNSAFE: says 30 · E1 says 14'
        : test.expected + ' · ' + test.result.cited.join(',');
      const item = api.focus.target('fixture-cases', () =>
        recordCard(
          ctx,
          api,
          test.id.replaceAll('-', ' ') + '\n' + detail,
          x,
          425,
          405,
          test.mustReject ? themeColors.pink : passed[i] ? themeColors.green : themeColors.pink,
          160,
          25,
        ),
      );
      if (beat > 0 && i <= beat + 1) {
        const status = test.mustReject
          ? passed[i]
            ? 'Host gate: BLOCKED'
            : 'LEAKED'
          : passed[i]
            ? 'PASS'
            : 'FAIL';
        const color = passed[i] ? themeColors.green : themeColors.pink;
        api.focus.target('case-verdicts', () =>
          drawText(ctx, api, status, x + 202, 650, 29, color, 'center'),
        );
      }
    });
    api.focus.target('candidate-contract', () =>
      drawText(
        ctx,
        api,
        'Frozen fixture cases · candidate index and answer contract',
        960,
        735,
        33,
        themeColors.ink,
        'center',
      ),
    );
    footer(
      ctx,
      api,
      'Fixture gates verify specific boundaries; release evidence needs representative integration checks',
    );
  }
}
export default {
  id: 'release-gates',
  draw: drawReleaseGates,
  cues: ['frozen-cases', 'separate-scores', 'candidate-release', 'fixture-boundary'],
};
