import { gradientFixture } from '../arithmetic.mjs';
import { complete, sampleModel } from '../construction.mjs';
import { drawExtensionCell, drawExtensionFooter, drawExtensionText } from '../defaults.mjs';
export function drawPublishedEvidence(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('published-evidence', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      const records =
        currentBeat === 0
          ? [
              ['Figure4 / first version', 'BF16 · D128'],
              ['sequence / token budget', '1k–32k / total 32k'],
              ['caption device / baselines', 'B200 / cuDNN 9.13 / Triton'],
            ]
          : currentBeat === 1
            ? [
                ['main text', 'B200'],
                ['Appendix A.1', 'B100'],
                ['newer cuDNN', 'similar performance'],
              ]
            : [
                ['local identity', 'GPU / driver / framework / package'],
                ['operator identity', 'shape / mask / dtype / scale'],
                ['product measurement', 'training step / serving latency'],
              ];
      records.forEach(([name, value], i) => {
        const y = 365 + i * 190;
        drawExtensionCell(ctx, api, name, 180, y, 550, 90, themeColors.blue);
        if (progress > i / 3)
          drawExtensionText(
            ctx,
            api,
            value,
            1260,
            y + 60,
            30,
            currentBeat === 1 && i < 2 ? themeColors.pink : themeColors.cyan,
            'center',
          );
      });
      if (currentBeat === 0 && complete(state, 'fa-paper-peaks', progress))
        drawExtensionText(
          ctx,
          api,
          'vs. cuDNN 9.13: up to 1.3×     vs. Triton: up to 2.7×     Peak: 1,613 TFLOP/s',
          960,
          1000,
          32,
          themeColors.green,
          'center',
        );
      else
        drawExtensionFooter(
          ctx,
          api,
          currentBeat === 1
            ? 'Keep the hardware discrepancy explicit; this lesson ran no benchmark'
            : 'Paper peak and compile time do not establish local tail latency',
        );
    }
  });
}
export default {
  id: 'published-evidence',
  draw: drawPublishedEvidence,
  cues: [
    'fa-published-evidence-0',
    'fa-paper-peaks',
    'fa-published-evidence-1',
    'fa-published-evidence-2',
  ],
};
