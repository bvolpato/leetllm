import { text, code, completionBox } from '../defaults.mjs';

export function drawCacheKey(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';

  api.focus.target('cc-cache-key-mechanism', () => {
    if (state.beat < 2) {
      const otherTenant = after('cc-key-tenant');
      const hit = after('cc-cache-key-0') && !otherTenant;
      const miss = after('cc-key-miss');
      for (const [index, label, tenant] of [
        [0, 'Stored prefix', 'Acme'],
        [1, 'Incoming prefix', otherTenant ? 'Contoso' : 'Acme'],
      ]) {
        const y = 382 + index * 184;
        text(ctx, api, label, 135, y + 15, 38);
        completionBox(ctx, api, tenant, 526, y - 59, 269, 104, C.yellow);
        [10, 20, 30].forEach((id, i) =>
          completionBox(ctx, api, String(id), 970 + i * 190, y - 59, 154, 104, C.cyan),
        );
      }
      text(ctx, api, 'Authenticated tenant', 660, 267, 31, C.muted, 'center');
      text(ctx, api, 'Prefix token IDs', 1236, 267, 31, C.muted, 'center');
      text(ctx, api, 'Both requests use repo-a under policy 7', 960, 716, 33, C.muted, 'center');
      text(
        ctx,
        api,
        'Same weights, tokenizer, adapter and KV layout',
        960,
        784,
        33,
        C.muted,
        'center',
      );
      if (hit || miss)
        text(
          ctx,
          api,
          miss ? 'Cache miss   →   prefill the prompt' : 'Cache hit   →   reuse the prefix',
          960,
          931,
          47,
          miss ? C.pink : C.green,
          'center',
        );
      return;
    }
    if (state.beat === 2) {
      const changed = after('cc-key-parent-change');
      const previous = changed ? 'hash(header B)' : 'hash(header A)';
      const entries = [
        ['Parent hash', previous, 160, 406, C.blue],
        ['Current block', '10   20   30', 752, 430, C.cyan],
        ['Block key', changed ? 'Key B' : 'Key A', 1366, 392, C.yellow],
      ];
      for (const [label, value, x, width, color] of entries) {
        text(ctx, api, label, x + width / 2, 351, 35, C.muted, 'center');
        completionBox(ctx, api, value, x, 408, width, 144, color);
      }
      text(ctx, api, '+', 658, 501, 57, C.muted, 'center');
      api.arrow(ctx, 1200, 480, 1342, 480, C.muted, 3);
      text(
        ctx,
        api,
        'Parent hash   +   block IDs   +   adapter and cache salt when used',
        960,
        700,
        38,
        C.ink,
        'center',
      );
      if (after('cc-salt-authority'))
        text(
          ctx,
          api,
          'Gateway verifies access   →   select the permitted cache partition',
          960,
          866,
          36,
          C.yellow,
          'center',
        );
      return;
    }
    const rows = [
      ['Prefix cache', 'Reuse prefix KV', 'Generate a new call', C.cyan],
      ['Response cache', 'Reuse the full reply', 'graph.allows(request)', C.blue],
    ];
    for (const [i, [label, saved, result, color]] of rows.entries()) {
      if (i === 1 && !after('cc-key-response')) continue;
      const y = 390 + i * 222;
      text(ctx, api, label, 150, y, 36);
      completionBox(ctx, api, saved, 532, y - 78, 510, 129, color);
      api.arrow(ctx, 1072, y - 15, 1183, y - 15, color, 3);
      if (i === 0) text(ctx, api, result, 1220, y, 37, C.ink);
      else code(ctx, api, result, 1220, y, 36, C.ink);
    }
    if (after('cc-cache-key-2'))
      text(
        ctx,
        api,
        'Both replies   →   check the editor at paint and again at Tab',
        960,
        862,
        39,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'cache-key',
  draw: drawCacheKey,
  cues: [
    'cc-cache-key-0',
    'cc-key-tenant',
    'cc-key-miss',
    'cc-cache-key-1',
    'cc-key-parent-change',
    'cc-salt-authority',
    'cc-key-response',
    'cc-cache-key-2',
  ],
};
