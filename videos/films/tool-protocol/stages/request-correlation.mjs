import { linearInterpolate } from '../arithmetic.mjs';
import { REQUESTS, RESPONSES } from '../fixtures.mjs';
import { correlateResponses } from '../model.mjs';
import { chip, footer, text } from '../defaults.mjs';
export function drawRequestCorrelation(ctx, scene, state, api) {
  return api.focus.target('request-correlation-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (key) => api.focus.progress(`t-request-correlation-${key}`, 0),
      cueVisible = (key) => api.focus.visible(`t-request-correlation-${key}`);
    {
      const amounts =
        currentBeat === 0
          ? [0, 0, 0]
          : currentBeat === 1
            ? [cueProgress('first'), 0, 0]
            : [
                1,
                Math.min(1, cueProgress('consume') * 2),
                Math.max(0, cueProgress('consume') * 2 - 1),
              ];
      const received = RESPONSES.filter((_, i) => amounts[i] >= 1),
        exchange = correlateResponses(REQUESTS, received);
      text(ctx, api, 'pending requests · immutable ID', 460, 270, 32, themeColors.blue);
      text(ctx, api, 'reply packets arrive independently', 1370, 270, 32, themeColors.cyan);
      REQUESTS.forEach((request, i) => {
        const y = 345 + i * 160,
          done = !exchange.missing.includes(request.id);
        chip(
          ctx,
          api,
          `ID ${request.id} · ${request.method}`,
          130,
          y,
          650,
          done ? themeColors.green : themeColors.blue,
          90,
          28,
        );
        text(
          ctx,
          api,
          done ? 'consumed once' : 'pending',
          455,
          y + 130,
          27,
          done ? themeColors.green : themeColors.muted,
        );
      });
      if (currentBeat === 0) {
        const q = cueProgress('request');
        REQUESTS.forEach((r, i) => {
          const y = 345 + i * 160;
          chip(
            ctx,
            api,
            `request ID ${r.id}`,
            linearInterpolate(900, 1320, q),
            y,
            440,
            themeColors.cyan,
            90,
            29,
          );
        });
      } else
        RESPONSES.forEach((reply, i) => {
          const amount = amounts[i];
          if (amount <= 0) return;
          const row = REQUESTS.findIndex((r) => r.id === reply.id);
          chip(
            ctx,
            api,
            `reply ID ${reply.id}`,
            linearInterpolate(1320, 900, amount),
            345 + row * 160,
            440,
            amount >= 1 ? themeColors.green : themeColors.cyan,
            90,
            30,
          );
        });
      text(
        ctx,
        api,
        `${exchange.matched.length} matched · pending IDs ${exchange.missing.join(', ') || 'none'}`,
        960,
        865,
        33,
        themeColors.cyan,
      );
      if (cueVisible('notify'))
        text(
          ctx,
          api,
          'notification: no ID → no response allocation',
          1370,
          810,
          27,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        'The response consumes its matching ID once, regardless of its arrival order.',
      );
    }
  });
}
export default {
  id: 'request-correlation',
  draw: drawRequestCorrelation,
  cues: [
    'request-correlation-beat-1-focus-1',
    't-request-correlation-request',
    'correlation-status-first',
    'request-correlation-beat-2-focus-1',
    't-request-correlation-first',
    'request-correlation-beat-3-focus-1',
    't-request-correlation-consume',
    't-request-correlation-notify',
  ],
};
