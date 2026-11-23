import { clamp } from '../arithmetic.mjs';
import { complete, gradientGate, sentence } from '../construction.mjs';
import { drawChapterCard, drawChapterFooter, drawChapterText } from '../defaults.mjs';
export function drawLateGradient(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'late-gradient', beat, index),
    resultComplete = (beat, index) => complete(state, 'late-gradient', beat, index);
  api.focus.target('late-gradient-construction', () => {
    const receipt = sentenceProgress(1, 2),
      received = receipt >= 0.6,
      gate = gradientGate(true, [1, received ? 3 : null]),
      weightShown = resultComplete(1, 3),
      momentsShown = resultComplete(1, 4);
    drawChapterText(
      ctx,
      api,
      'W0 belongs to R0 · completed accumulation = 8 / 8',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    drawChapterCard(ctx, api, 'R0 · received gradient 1', 170, 390, 550, themeColors.blue, 105, 32);
    const source = drawChapterCard(
      ctx,
      api,
      received ? 'R1 · gradient 3 received' : 'R1 · expected 3; receipt pending',
      1200,
      390,
      550,
      received ? themeColors.cyan : themeColors.muted,
      105,
      29,
    );
    const accumulator = drawChapterCard(
      ctx,
      api,
      resultComplete(1, 2)
        ? 'Equal-rank mean: (1 + 3)/2 = 2'
        : received
          ? 'Both values: sum 1 + 3 = 4'
          : resultComplete(1, 0)
            ? 'R0 accumulator: one value; update held'
            : 'R0: one contribution; second receipt pending',
      610,
      620,
      700,
      resultComplete(1, 2) ? themeColors.green : themeColors.yellow,
      100,
      31,
    );
    if (currentBeat === 1 && receipt > 0)
      teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: accumulator,
          opacity: 1,
        },
        progress: clamp(receipt / 0.6),
        color: themeColors.cyan,
        particle: {
          radius: 9,
          fill: themeColors.cyan,
        },
      });
    drawChapterText(
      ctx,
      api,
      'Initial state: w = 1 · m = 0 · v = 0',
      960,
      805,
      31,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 0)
      drawChapterText(
        ctx,
        api,
        'Can the owner update before the missing receipt arrives?',
        960,
        930,
        37,
        themeColors.yellow,
        'center',
      );
    else if (!weightShown)
      drawChapterText(
        ctx,
        api,
        !resultComplete(1, 0)
          ? 'Evaluate the update from the available receipts'
          : gate.ready
            ? 'Both gradient receipts present · complete the stated update'
            : 'Hold the update until every required contribution arrives',
        960,
        930,
        34,
        gate.ready ? themeColors.cyan : themeColors.yellow,
        'center',
      );
    else
      drawChapterText(
        ctx,
        api,
        'After update: w ≈ ' +
          gate.next[0].toFixed(6) +
          ' · m = ' +
          (momentsShown ? gate.next[1].toFixed(3) : '?') +
          ' · v = ' +
          (momentsShown ? gate.next[2].toFixed(3) : '?'),
        960,
        930,
        38,
        themeColors.green,
        'center',
      );
    drawChapterFooter(
      ctx,
      api,
      'Supplied equal-rank worksheet · Adam rate 0.01 · β₁ 0.9 · β₂ 0.999 · ε = 10⁻⁸',
    );
  });
}
export default {
  id: 'late-gradient',
  draw: drawLateGradient,
  cues: [
    'ds-late-gradient-b0-s0',
    'ds-late-gradient-b0-s1',
    'ds-late-gradient-b0-s2',
    'ds-late-gradient-b0-s3',
    'ds-late-gradient-b0-s4',
    'ds-late-gradient-b0-s5',
    'ds-late-gradient-b1-s0',
    'ds-late-gradient-b1-s1',
    'ds-late-gradient-b1-s2',
    'ds-late-gradient-b1-s3',
    'ds-late-gradient-b1-s4',
    'ds-late-gradient-b1-s5',
  ],
};
