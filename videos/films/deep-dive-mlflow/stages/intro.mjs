import { spokenScene } from '../pieces/scene.mjs';
import { requestLedger, requests } from '../pieces/request-ledger.mjs';
import { bound, mix } from '../arithmetic.mjs';

function reply(ctx, api, x, y, label, source) {
  const { C } = api;
  api.path(
    ctx,
    [
      { x: x + 55, y: y + 287 },
      { x: x + 55, y: y + 343 },
      { x: x + 130, y: y + 287 },
    ],
    { closed: true, fill: C.panel, color: C.panel },
  );
  api.rect(ctx, x, y, 747, 296, C.panel, null, 44);
  api.text(ctx, label, x + 56, y + 68, 34, C.muted);
  api.text(ctx, '30 days', x + 52, y + 194, 112, C.ink);
  if (source) {
    api.text(ctx, source, x + 58, y + 255, 37, C.cyan);
    api.line(ctx, x + 58, y + 264, x + 225, y + 264, C.cyan, 2);
  }
}

export default spokenScene('intro', (ctx, scene, state, api, g) => {
  const { C } = api;
  if (state.beat === 0 || (state.beat === 1 && g(1, 1) < 1)) {
    if (state.t < 0.35) ctx.globalAlpha = 1;
    const arrive = bound(state.t / 0.85);
    const y = mix(392, 280, 1 - (1 - arrive) ** 3);
    reply(ctx, api, 145, 280, 'Earlier reply', requests[0].citation);
    reply(ctx, api, 1028, y, 'New reply', '');

    const open = g(0, 2);
    if (open > 0) {
      const top = mix(708, 664, open);
      api.rect(ctx, 145, top, 747, 194, C.ink, null, 6);
      api.text(ctx, 'DOC-12   /   Return policy', 185, top + 59, 32, C.bg);
      api.text(ctx, 'Returns are accepted within', 185, top + 115, 42, C.bg, 'left', 'serif');
      api.text(ctx, '30 days of delivery.', 185, top + 166, 42, C.bg, 'left', 'serif');
    }
    if (state.beat === 0 && g(0, 3) > 0)
      api.text(ctx, 'Which reply leaves you looking for the source?', 145, 980, 43, C.yellow);
    if (g(1, 0) >= 1) api.text(ctx, 'Citations   []', 1086, y + 255, 37, C.pink);
    return;
  }
  requestLedger(ctx, api, {
    earlier: 1,
    later: 1,
    missing: g(1, 0) > 0,
    common: g(1, 2) > 0,
    prompts: g(1, 3) > 0,
    indices: g(1, 4) > 0,
    replay: g(2, 2) > 0 && { id: 'Replay', prompt: 17 },
  });
  if (g(2, 2) > 0)
    api.text(
      ctx,
      'Against T103, which index tests just the prompt change?',
      145,
      950,
      40,
      C.yellow,
    );
});
