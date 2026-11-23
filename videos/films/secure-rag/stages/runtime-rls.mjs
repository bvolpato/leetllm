import { drawArrow, drawFooter, drawHeading, drawNode, drawTag } from '../defaults.mjs';
export function drawRuntimeRls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-runtime-rls-' + name,
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
  api.focus.target('sr-runtime-rls-mechanism', () => {
    const names = ['ordinary role', 'table owner', 'superuser', 'BYPASSRLS'],
      force = currentBeat > 0 && resultComplete('force', 1),
      owner = currentBeat > 0 && resultComplete('owner', 1),
      bypass = currentBeat > 0 && resultComplete('bypass', 1);
    drawHeading(ctx, api, 'Enabled row security · no applicable policy');
    names.forEach((v, i) => {
      const y = 365 + i * 130;
      drawTag(ctx, api, 'Connection identity', v, 170, y, 540, themeColors.blue);
      const allowed = i === 0 ? false : i === 1 ? owner && !force : bypass;
      if ((i === 0 && resultComplete('default', 0)) || (i === 1 && owner) || (i > 1 && bypass)) {
        drawArrow(
          ctx,
          api,
          745,
          y + 48,
          1020,
          y + 48,
          allowed ? themeColors.pink : themeColors.green,
        );
        drawTag(
          ctx,
          api,
          force && i === 1 ? 'FORCE applies policy' : 'Result under this connection',
          allowed ? 'BYPASS / unrestricted path' : 'DEFAULT DENY',
          1060,
          y,
          660,
          allowed ? themeColors.pink : themeColors.green,
        );
      }
    });
    if (currentBeat === 2) {
      const q = Q('paths', 2);
      ['exact ID', 'ANN', 'cache', 'citation preview'].forEach((v, i) => {
        if (q * 4 >= i + 1) drawNode(ctx, api, v, 170 + i * 420, 895, 350, themeColors.yellow);
      });
    }
    drawFooter(
      ctx,
      api,
      'A query filter cannot repair an overprivileged runtime role. Verify the actual connection and every path.',
    );
  });
}
export default {
  id: 'runtime-rls',
  draw: drawRuntimeRls,
  cues: [
    'sr-runtime-rls-0',
    'sr-runtime-rls-default',
    'sr-runtime-rls-1',
    'sr-runtime-rls-owner',
    'sr-runtime-rls-force',
    'sr-runtime-rls-bypass',
    'sr-runtime-rls-2',
    'sr-runtime-rls-paths',
  ],
};
