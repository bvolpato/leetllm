import { drawBox, drawCenteredText, drawFocusTarget, drawFooter } from '../defaults.mjs';
export function drawDurableSession(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-durable-session-' + currentBeat),
    count = (u, n) => Math.min(n, Math.floor(u * n + 1e-8)),
    mix = (a, z, u) => a + (z - a) * u;
  const paintMechanism = () => {
    drawCenteredText(
      ctx,
      api,
      'Durable events outlive one harness',
      960,
      280,
      35,
      themeColors.yellow,
    );
    const labels = [
      'task / allowed scope',
      'hours-24 / valid receipt',
      'route-31 / current route',
      'train-22 / cancelled train',
    ];
    labels.forEach((s, i) =>
      drawBox(
        ctx,
        api,
        s,
        180,
        370 + i * 125,
        680,
        88,
        i === 3 ? themeColors.yellow : themeColors.blue,
      ),
    );
    api.rect(ctx, 1190, 390, 530, 430, themeColors.panel, themeColors.green, 2, 12);
    drawCenteredText(
      ctx,
      api,
      currentBeat === 0 ? 'Next policy context' : 'Restarted harness',
      1455,
      455,
      32,
      themeColors.green,
    );
    const n =
      currentBeat === 0 ? count(operationProgress, 3) : resultComplete('session-context') ? 3 : 0;
    for (let i = 0; i < n; i++)
      drawBox(ctx, api, labels[i], 1230, 505 + i * 94, 450, 72, themeColors.cyan);
    if (currentBeat === 1 && cueProgress('session-fetch') > 0) {
      const u = cueProgress('session-fetch');
      drawBox(
        ctx,
        api,
        'fetch selected events',
        mix(370, 1240, u),
        880,
        480,
        70,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Stored evidence affects a model only when relevant selected context includes it',
    );
  };
  drawFocusTarget(ctx, api, 'aa-durable-session-mechanism', paintMechanism);
}
export default {
  id: 'durable-session',
  draw: drawDurableSession,
  cues: ['aa-durable-session-0', 'aa-durable-session-1', 'session-fetch', 'session-context'],
};
