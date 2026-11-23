import {
  drawArtifactBox,
  drawArtifactLine,
  drawArtifactText,
  withArtifactFocus,
} from '../defaults.mjs';
export function drawReflection(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  {
    const records = [
      ['B18 · both exact cases: DENY', 'Both targeted cases pass', themeColors.green],
      [
        'Declared window · p95 420 / 500 ms',
        'This window meets the latency rule',
        themeColors.blue,
      ],
      ['Incident follow-up: not recorded', 'Incident-rate improvement: unknown', themeColors.pink],
    ];
    records.forEach(([evidence, claim, color], i) => {
      const y = 300 + i * 180;
      withArtifactFocus(ctx, api, 'reflection-row-' + i, () => {
        drawArtifactBox(ctx, api, 'reflection-receipt-' + i, evidence, 145, y, 740, 110, color, 28);
        drawArtifactBox(ctx, api, 'reflection-claim-' + i, claim, 1040, y, 740, 110, color, 28);
        if (i < 2) drawArtifactLine(ctx, api, 910, y + 55, 1010, y + 55, color, 4);
        else {
          drawArtifactLine(ctx, api, 910, y + 55, 935, y + 55, themeColors.muted);
          drawArtifactLine(ctx, api, 985, y + 55, 1010, y + 55, themeColors.muted);
          drawArtifactText(ctx, api, '?', 960, y + 66, 30, themeColors.pink);
        }
      });
    });
    withArtifactFocus(ctx, api, 'reflection-rows', () =>
      drawArtifactText(
        ctx,
        api,
        'Each claim stays attached to the evidence that supports it',
        960,
        920,
        31,
        themeColors.yellow,
      ),
    );
    withArtifactFocus(ctx, api, 'reflection-release-criteria', () => {
      if (currentBeat === 1)
        drawArtifactBox(
          ctx,
          api,
          'reflection-next-artifact',
          'Later practice: write release + rollback criteria before review',
          230,
          975,
          1460,
          80,
          themeColors.yellow,
          29,
        );
    });
  }
}
export default {
  id: 'reflection',
  draw: drawReflection,
  cues: ['reflection-beat-1-focus-1', 'reflection-beat-2-focus-1'],
};
