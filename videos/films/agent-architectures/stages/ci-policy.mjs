import { drawArrow, drawBox, drawCenteredText, drawFocusTarget, drawFooter } from '../defaults.mjs';
export function drawCiPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-ci-policy-' + currentBeat),
    count = (u, n) => Math.min(n, Math.floor(u * n + 1e-8)),
    mix = (a, z, u) => a + (z - a) * u;
  const paintMechanism = () => {
    const runner = currentBeat === 1 && cueProgress('ci-runner') > 0,
      first = currentBeat > 0 || resultComplete('ci-first-result'),
      second = currentBeat === 0 && resultComplete('ci-second-read');
    drawCenteredText(ctx, api, 'Build investigation   /   R1842', 960, 275, 34, themeColors.yellow);
    drawBox(ctx, api, 'Policy proposal', 160, 370, 420, 92, themeColors.blue);
    drawBox(ctx, api, 'Host read gate', 750, 370, 420, 92, themeColors.yellow);
    drawArrow(ctx, api, 590, 416, 740, 416);
    const t = cueProgress('ci-request');
    if (currentBeat === 0 && t > 0 && t < 1)
      drawBox(ctx, api, 'call-1 · CI', mix(180, 1280, t), 505, 350, 80, themeColors.cyan);
    drawBox(
      ctx,
      api,
      first ? 'call-1 · lookup succeeded' : 'call-1 · pending',
      150,
      650,
      680,
      100,
      first ? themeColors.green : themeColors.muted,
    );
    drawCenteredText(
      ctx,
      api,
      first
        ? runner
          ? 'fact: runner unavailable'
          : 'fact: migration failed'
        : 'No build fact yet',
      490,
      820,
      32,
      runner ? themeColors.pink : themeColors.yellow,
    );
    drawBox(
      ctx,
      api,
      second ? 'call-2 · migration read' : 'call-2 · no completed read',
      1060,
      650,
      700,
      100,
      second ? themeColors.green : themeColors.muted,
    );
    drawCenteredText(
      ctx,
      api,
      second ? 'fact: unguarded add' : 'No migration conclusion',
      1410,
      820,
      32,
      second ? themeColors.yellow : themeColors.muted,
    );
    if (currentBeat === 0 && resultComplete('ci-conclusion'))
      drawCenteredText(
        ctx,
        api,
        'Review migration semantics · no write performed',
        960,
        935,
        33,
        themeColors.green,
      );
    if (currentBeat === 1) {
      if (resultComplete('ci-defer'))
        drawCenteredText(
          ctx,
          api,
          'Insufficient evidence · attempts 1 · migration calls 0',
          960,
          935,
          31,
          themeColors.pink,
        );
      if (resultComplete('ci-timeout')) {
        drawBox(ctx, api, 'Separate timeout branch', 1280, 350, 480, 78, themeColors.pink);
        drawCenteredText(
          ctx,
          api,
          'attempt 1 → error receipt → defer',
          1395,
          535,
          29,
          themeColors.pink,
        );
      }
    }
    if (currentBeat === 2) {
      const n = resultComplete('ci-two-attempts') ? 2 : count(operationProgress, 2);
      drawCenteredText(
        ctx,
        api,
        'Repeated-read policy · tool-attempt limit 2',
        960,
        335,
        29,
        themeColors.yellow,
      );
      for (let i = 0; i < 3; i++)
        drawBox(
          ctx,
          api,
          i < n
            ? 'receipt ' + (i + 1)
            : i === 2 && resultComplete('ci-third-held')
              ? 'third dispatch blocked'
              : 'pending',
          380 + i * 460,
          855,
          400,
          74,
          i < n ? themeColors.green : themeColors.muted,
        );
    }
    if (currentBeat === 0 && first)
      drawFooter(ctx, api, 'The CI read succeeded. Its result describes the build.');
  };
  drawFocusTarget(ctx, api, 'aa-ci-policy-mechanism', paintMechanism);
}
export default {
  id: 'ci-policy',
  draw: drawCiPolicy,
  cues: [
    'aa-ci-policy-0',
    'ci-request',
    'ci-first-result',
    'ci-second-read',
    'ci-conclusion',
    'aa-ci-policy-1',
    'ci-runner',
    'ci-defer',
    'ci-timeout',
    'aa-ci-policy-2',
    'ci-two-attempts',
    'ci-third-held',
  ],
};
