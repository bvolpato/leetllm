import { drawFlow, drawFooter, drawNode, drawTag } from '../defaults.mjs';
export function drawRewriteScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-rewrite-scope-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-rewrite-scope-mechanism', () => {
    const q = Q('rewrite', 0),
      a = drawNode(ctx, api, 'Original user query', 170, 350, 500, themeColors.blue),
      z = drawNode(ctx, api, 'Clarified signing-key query', 1120, 350, 600, themeColors.cyan);
    drawFlow(ctx, api, a, z, q);
    drawTag(
      ctx,
      api,
      'Authenticated principal',
      'A / analyst / operations',
      170,
      540,
      680,
      themeColors.blue,
    );
    drawTag(
      ctx,
      api,
      'Rewrite may not grant',
      'security / foreign tenant',
      1050,
      540,
      680,
      themeColors.pink,
    );
    if (currentBeat === 1) {
      const fields = [
        'query + technique',
        'tenant / principal scope',
        'current policy',
        'source versions',
      ];
      fields.forEach((v, i) => {
        if (Q('key', 1) * 4 >= i + 1)
          drawTag(
            ctx,
            api,
            'cache-key component ' + (i + 1),
            v,
            170 + (i % 2) * 880,
            740 + Math.floor(i / 2) * 115,
            760,
            themeColors.yellow,
          );
      });
    }
    if (currentBeat === 2) {
      drawTag(ctx, api, 'Cached evidence', 'key runbook v7', 170, 770, 650, themeColors.pink);
      drawTag(
        ctx,
        api,
        'Current source grant',
        resultComplete('recheck', 2) ? 'revoked → deny reuse' : 'recheck required',
        1050,
        770,
        680,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Same role names do not establish equal owner, explicit-user or group permissions. Reauthorize every reuse.',
    );
  });
}
export default {
  id: 'rewrite-scope',
  draw: drawRewriteScope,
  cues: [
    'sr-rewrite-scope-0',
    'sr-rewrite-scope-rewrite',
    'sr-rewrite-scope-fixed',
    'sr-rewrite-scope-1',
    'sr-rewrite-scope-key',
    'sr-rewrite-scope-2',
    'sr-rewrite-scope-recheck',
  ],
};
