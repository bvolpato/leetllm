import { RUN_LOG } from './fixtures.mjs';
import { constructionCode as code, constructionText as text } from './defaults.mjs';

export function runLog(ctx, api) {
  const { C } = api;
  api.line(ctx, 142, 231, 142, 361, C.yellow, 6);
  text(ctx, api, 'Runner log', 175, 267, 32, C.yellow);
  text(ctx, api, RUN_LOG, 175, 333, 44);
}

export function prefixLine(ctx, api, prefix, endAllowed) {
  const { C } = api;
  text(ctx, api, 'Accepted text', 145, 278, 32, C.muted);
  code(ctx, api, prefix || '(empty)', 145, 375, 66, C.ink);
  if (endAllowed !== undefined) {
    text(
      ctx,
      api,
      endAllowed ? 'EOS allowed' : 'EOS blocked',
      1765,
      365,
      36,
      endAllowed ? C.green : C.yellow,
      'right',
    );
  }
  api.line(ctx, 145, 420, 1775, 420, C.muted, 2);
}

export function after(state, id) {
  return state.cues?.[id]?.phase === 'after';
}
