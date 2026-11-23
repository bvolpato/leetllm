import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

export function drawBoundedRecovery(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('sg-bounded-recovery-mechanism', () => {
    if (state.beat === 2) {
      text(ctx, api, 'Length stop on the wire', 150, 278, 42, C.yellow);
      text(ctx, api, 'Responses', 150, 419, 40);
      if (focus.progress('sg-responses-reason', 0) > 0) {
        code(ctx, api, 'status: incomplete', 630, 419, 40);
        code(ctx, api, 'incomplete_details.reason: max_output_tokens', 630, 488, 39);
      }
      text(ctx, api, 'Chat Completions', 150, 627, 40);
      if (focus.progress('sg-chat-reason', 0) > 0)
        code(ctx, api, 'finish_reason: length', 630, 627, 40);
      api.line(ctx, 150, 712, 1760, 712, C.muted, 2);
      if (after(state, 'sg-config-repair'))
        text(ctx, api, 'Unsupported schema → Fix configuration', 150, 827, 43);
      if (after(state, 'sg-data-repair'))
        text(ctx, api, 'Recoverable data error → Bounded correction', 150, 930, 43);
      return;
    }

    const retry = after(state, 'sg-length-retry');
    const exhausted = focus.progress('sg-second-limit', 0) > 0;
    const failed = after(state, 'sg-second-length');
    const completed = after(state, 'sg-complete-check') && !exhausted;
    const columns = [150, 675, 1240];
    ['First call', 'Second call', 'Next step'].forEach((title, i) =>
      text(ctx, api, title, columns[i], 303, 35, C.muted),
    );
    api.line(ctx, 150, 339, 1760, 339, C.muted, 2);
    text(ctx, api, '120-token limit', columns[0], 459, 49, C.yellow);
    if (retry) {
      text(
        ctx,
        api,
        exhausted ? '400-token limit' : '400 tokens',
        columns[1],
        459,
        49,
        exhausted ? C.yellow : C.ink,
      );
      text(ctx, api, 'Same schema', columns[1], 523, 34, C.muted);
    }
    if (completed) {
      text(ctx, api, 'If complete', columns[2], 454, 38, C.cyan);
      text(ctx, api, 'Validate reply', columns[2], 523, 43);
    }
    if (failed) text(ctx, api, 'Fail after 2 calls', columns[2], 459, 46, C.pink);
    for (const [name, input, verdict, y] of [
      ['Refusal', 'sg-refusal', 'sg-refusal-stop', 669],
      ['Content filter', 'sg-filter-stop', 'sg-filter-stop', 849],
    ]) {
      if (focus.progress(input, 0) <= 0) continue;
      text(ctx, api, name, columns[0], y, 48, C.ink);
      if (after(state, verdict)) {
        text(ctx, api, 'No retry', columns[1], y, 45, C.muted);
        text(ctx, api, 'Stop after 1 call', columns[2], y, 46, C.pink);
      }
    }
  });
}

export default {
  id: 'bounded-recovery',
  draw: drawBoundedRecovery,
  cues: [
    'sg-first-limit',
    'sg-length-retry',
    'sg-complete-check',
    'sg-refusal',
    'sg-refusal-stop',
    'sg-filter-stop',
    'sg-second-limit',
    'sg-second-length',
    'sg-responses-reason',
    'sg-chat-reason',
    'sg-config-repair',
    'sg-data-repair',
  ],
};
