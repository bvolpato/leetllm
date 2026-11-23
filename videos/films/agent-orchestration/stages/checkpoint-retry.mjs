import { cell, focusTarget, graphText, receiptCard, requestIdentity, text } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  {
    focusTarget(ctx, api, 'saved-checkpoint', () =>
      components.panel(
        {
          x: 170,
          y: 300,
          width: 660,
          height: 540,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          padding: 20,
        },
        () => {
          graphText(ctx, api, 'Saved checkpoint', 500, 365, 38, themeColors.blue, 'center');
          ['Eval receipt saved', 'Health read timed out', 'Policy receipt saved'].forEach((s, i) =>
            receiptCard(
              ctx,
              api,
              s,
              220,
              430 + i * 125,
              560,
              i === 1 ? themeColors.yellow : themeColors.green,
              85,
            ),
          );
        },
      ),
    );
    const age = 1000 - 995,
      fresh = age >= 0 && age <= 60,
      retryProgress = api.focus.progress('retry-health-read', phase(progress, 0.55, 0.82)),
      refreshed = (beat > 0 || retryProgress >= 1) && fresh,
      inFlight = beat === 0 && retryProgress > 0;
    const retry = focusTarget(ctx, api, 'health-retry', () =>
        receiptCard(
          ctx,
          api,
          refreshed
            ? 'Health retry completed'
            : inFlight
              ? 'Health retry in flight'
              : 'Resume same thread',
          1130,
          440,
          610,
          themeColors.yellow,
          110,
        ),
      ),
      ready = focusTarget(ctx, api, 'receipt-freshness', () =>
        receiptCard(
          ctx,
          api,
          refreshed ? 'Fresh health receipt · age ' + age + ' s' : 'Saved health: timeout',
          1130,
          690,
          610,
          refreshed ? themeColors.green : themeColors.muted,
          100,
        ),
      );
    api.connect(ctx, retry, ready, {
      color: refreshed ? themeColors.green : themeColors.yellow,
      gap: 18,
    });
  }
}
export function drawCheckpointRetry(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    requestIdentity(ctx, api);
    const types = [
        ['Health timeout', 'retry read', 'bounded backoff + jitter + deadline', themeColors.yellow],
        [
          'Wrong release identity',
          'resolve alias / review',
          'same request data must agree',
          themeColors.pink,
        ],
        ['Reviewer rejection', 'cancel proposal', 'no writer execution', themeColors.pink],
        [
          'Writer timeout',
          'query target op-18',
          'unknown effect; preserve same key',
          themeColors.yellow,
        ],
      ],
      n = Math.max(1, Math.ceil(q(3) * 4));
    types.slice(0, n).forEach(([why, action, contract, color], i) => {
      const y = 395 + i * 150;
      text(ctx, api, why, 180, y + 40, 32, color);
      cell(ctx, api, action, 700, y, 450, color);
      text(ctx, api, contract, 1260, y + 40, 27, themeColors.muted);
    });
  };
  api.focus.target('checkpoint-retry-construction', body);
}
export default {
  id: 'checkpoint-retry',
  draw: drawCheckpointRetry,
  cues: [
    'saved-results',
    'retry-health-read',
    'persistent-checkpoint',
    'repeat-safe-retry',
    'checkpoint-access',
    'recheck-age',
    'checkpoint-retry-construct-3',
  ],
};
