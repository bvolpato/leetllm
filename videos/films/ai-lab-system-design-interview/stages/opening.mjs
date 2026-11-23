import { lerp, smooth } from '../arithmetic.mjs';
import { LARGE_QUEUE, namedSystemCue, spokenResult } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { queueScale, queueX } from '../queue-clock.mjs';

export function drawOpening(ctx, scene, state, api) {
  const { C, focus } = api;
  const { queuedTokens, serviceTokensPerSecond, estimatedWait, waitBudgetSeconds, admitted } =
    LARGE_QUEUE;
  const blockTokens = 10_000;
  const blockCount = queuedTokens / blockTokens;
  const blockMs = (1000 * blockTokens) / serviceTokensPerSecond;
  const unfold = namedSystemCue(state, 'opening-unfold', 2, 0.05);
  const timed = spokenResult(state, 'opening-block-time', 2, 0.22);
  const measured = spokenResult(state, 'opening-wait', 2, 0.44);
  const decided = spokenResult(state, 'opening-status', 2, 0.58);
  const ticketX = lerp(1280, 1120, smooth((state.t ?? 0) / 1.1));
  const y = 702;

  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.path(
    ctx,
    [
      { x: ticketX + 4, y: 403 },
      { x: ticketX - 25, y: 434 },
      { x: ticketX + 4, y: 430 },
    ],
    { closed: true, width: 0, fill: C.cyan },
  );
  api.rect(ctx, ticketX, 294, 580, 202, C.cyan, undefined, 27);
  text(ctx, api, 'Employee request  ·  R-105', ticketX + 34, 345, 30, C.bg);
  text(ctx, api, 'Summarize my notes.', ticketX + 34, 413, 46, C.bg);
  text(ctx, api, 'Authorized  ·  Quota available', ticketX + 34, 466, 30, C.bg);

  focus.target('opening-work', () => {
    text(ctx, api, 'Prompt tokens ahead', 160, 287, 41, C.ink);
    text(
      ctx,
      api,
      'Worker  ·  ' + serviceTokensPerSecond.toLocaleString('en-US') + ' tokens/s',
      1050,
      287,
      34,
      C.blue,
      'right',
    );
    for (let i = 0; i < blockCount; i++) {
      const drop = smooth(unfold * blockCount - i);
      const slide = smooth((drop - 0.55) / 0.45);
      const x = lerp(160 + i * 183, queueX(i * blockMs), slide);
      const width = lerp(171, queueX(blockMs) - queueX(0) - 4, slide);
      const top = lerp(353, y - 82, drop);
      api.rect(ctx, x, top, width, 80, C.blue, undefined, 9);
      text(
        ctx,
        api,
        drop === 1 && timed ? blockMs + ' ms' : blockTokens.toLocaleString('en-US'),
        x + width / 2,
        top + 54,
        37,
        C.bg,
        'center',
      );
    }
  });
  focus.target('opening-clock', () => {
    queueScale(ctx, api, y, waitBudgetSeconds * 1000);
    if (measured)
      text(
        ctx,
        api,
        Math.round(estimatedWait * 1000) + ' ms wait',
        queueX(estimatedWait * 1000),
        y - 104,
        40,
        C.cyan,
        'center',
      );
  });
  focus.target('opening-receipt', () => {
    api.line(ctx, 160, 842, 1760, 842, C.muted, 2);
    text(ctx, api, 'R-105   /   Gateway response', 160, 903, 30, C.muted);
    text(
      ctx,
      api,
      decided
        ? admitted
          ? 'Admit to queue'
          : '503  ·  Shared overload'
        : 'Queue it, refuse for quota, or refuse for overload?',
      160,
      981,
      48,
      decided ? C.pink : C.ink,
    );
    if (decided)
      text(
        ctx,
        api,
        Math.round(estimatedWait * 1000) + ' ms wait  /  ' + waitBudgetSeconds * 1000 + ' ms limit',
        1760,
        981,
        38,
        C.ink,
        'right',
      );
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-budget',
    'opening-blocks',
    'opening-choice',
    'opening-unfold',
    'opening-block-time',
    'opening-wait',
    'opening-status',
  ],
};
