import { flashCue, flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, header } from '../defaults.mjs';
export function drawPaperEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('paper-evidence', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-paper-evidence-mechanism', () => {
    header(ctx, api, 'Historical paper records retain their experimental denominator');
    if (currentBeat === 0) {
      [
        ['library / toolkit', '0.2 / CUDA12.4 / Torch2.4'],
        ['devices', 'A10040GB / H10080GB · SXM'],
        ['storage / compute', 'FP16 / FP16'],
      ].forEach(([a, z], i) => {
        extensionText(ctx, api, a, 190, 440 + i * 160, 29, themeColors.blue);
        if (progress > (i + 0.2) / 3)
          extensionCard(ctx, api, z, 820, 380 + i * 160, 920, themeColors.cyan, 100, 31);
      });
    } else if (currentBeat === 1) {
      extensionCard(ctx, api, 'SGLang: 29–69% lower ITL', 170, 390, 1540, themeColors.blue);
      extensionCard(
        ctx,
        api,
        'Triton baseline · ShareGPT + specified variable-length trace',
        170,
        565,
        1540,
        themeColors.cyan,
        105,
        31,
      );
      extensionCard(
        ctx,
        api,
        'Request rate constrained by p99 TTFT<200ms',
        170,
        760,
        1540,
        themeColors.yellow,
        105,
        31,
      );
    } else {
      extensionCard(
        ctx,
        api,
        'Parallel generation: 14–17% lower ITL',
        180,
        370,
        1520,
        themeColors.blue,
      );
      extensionText(
        ctx,
        api,
        'Llama3.1 8B/70B · ShareGPT ·16 req/s ·width 4 at peak',
        960,
        545,
        30,
        themeColors.cyan,
        'center',
      );
      const ready = flashCue(state, 'fi-paper-evidence-conversion', 2) === 1;
      extensionCard(
        ctx,
        api,
        ready
          ? 'Supplied 10ms →7ms; reciprocal rate≈+43%'
          : 'Separate supplied 30% latency reduction',
        200,
        680,
        1500,
        ready ? themeColors.green : themeColors.yellow,
        110,
        33,
      );
    }
    if (currentBeat === 2)
      footer(ctx, api, 'Service throughput counts tokens across all active streams per second');
  });
}
export default {
  id: 'paper-evidence',
  draw: drawPaperEvidence,
  cues: [
    'fi-paper-evidence-0',
    'fi-paper-evidence-0-result',
    'fi-paper-evidence-1',
    'fi-paper-evidence-1-result',
    'fi-paper-evidence-2',
    'fi-paper-evidence-2-result',
    'fi-paper-evidence-conversion',
  ],
};
