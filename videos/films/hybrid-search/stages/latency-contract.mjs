import {
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismStrip,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawLatencyContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    if (currentBeat === 0) {
      const labels = ['lane depth', 'fused pool', 'reranker input', 'final context'];
      labels.forEach((s, i) => {
        const x = 300 + i * 435;
        drawRetrievalMechanismStrip(ctx, api, x - 120, 430, 6, 6 - i, themeColors.blue, 32);
        drawRetrievalMechanismText(ctx, api, s, x, 565, 29, themeColors.cyan);
      });
      drawRetrievalMechanismTag(
        ctx,
        api,
        drawRetrievalMechanismP(ctx, api, 'lane-timeout')
          ? 'lexical timeout'
          : 'valid lexical empty',
        960,
        760,
        drawRetrievalMechanismP(ctx, api, 'lane-timeout') ? themeColors.pink : themeColors.green,
        680,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        'Different completion status → evaluate a different fallback mode',
        960,
        900,
        32,
        themeColors.yellow,
      );
    } else {
      const x = (z) => 240 + z * 24.5,
        y = 460,
        clock = 58 * drawRetrievalMechanismP(ctx, api, 'request-clock');
      [0, 10, 22, 50, 58].forEach((z) => {
        drawRetrievalMechanismLine(
          ctx,
          api,
          x(z),
          y - 50,
          x(z),
          820,
          z === 50 ? themeColors.pink : themeColors.muted,
          z === 50 ? 4 : 1,
        );
        drawRetrievalMechanismText(
          ctx,
          api,
          z + 'ms',
          x(z),
          860,
          26,
          z === 50 ? themeColors.pink : themeColors.muted,
        );
      });
      const tasks = [
        ['authorize', 0, 10, 430, themeColors.yellow],
        ['lexical', 10, 12, 550, themeColors.blue],
        ['dense', 10, 40, 670, themeColors.pink],
        ['fusion', 50, 8, 430, themeColors.green],
      ];
      tasks.forEach(([s, start, duration, yy, color]) => {
        const length = Math.min(duration, Math.max(0, clock - start));
        api.rect(ctx, x(start), yy, length * 24.5, 64, color);
        drawRetrievalMechanismText(ctx, api, s, x(start + duration / 2), yy - 22, 28, color);
      });
      if (done('deadline-result') || currentBeat > 1)
        drawRetrievalMechanismText(
          ctx,
          api,
          '10 +max(12,40)+8 =58ms >50ms',
          960,
          930,
          38,
          themeColors.pink,
        );
      if (currentBeat === 2)
        drawRetrievalMechanismText(
          ctx,
          api,
          'Recheck grants at fetch · measure end-to-end traces and held-out families',
          960,
          300,
          31,
          themeColors.yellow,
        );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Supplied stage timings · stage p95 values do not add into request p95',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'latency-contract-mechanism', paint);
  return;
}
export default {
  id: 'latency-contract',
  draw: drawLatencyContract,
  cues: ['lane-timeout', 'request-clock', 'deadline-result'],
};
