import { drawPageSearch, FOLLOW_UP, RECOVERY_QUERY } from '../page-search.mjs';
import { spoken } from '../construction.mjs';

export function drawRewriteForContext(ctx, scene, state, api) {
  const carry = spoken(state, 0, 'rewrite-carry');
  const standalone = spoken(state, 0, 'rewrite-input') > 0;
  const baseline = carry === 0 && !standalone;
  const result = spoken(state, 1, 'rewrite-result') === 1;
  drawPageSearch(ctx, api, {
    query: baseline ? FOLLOW_UP : standalone ? RECOVERY_QUERY : null,
    carry,
    result: baseline || result,
    emphasizeHistory: !standalone,
    prompt: !standalone
      ? 'Carry the reported leak into search.'
      : result
        ? 'Same pages  ·  same support access'
        : 'Which page comes first now?',
  });
}
export default {
  id: 'rewrite-for-context',
  draw: drawRewriteForContext,
  cues: ['rewrite-history', 'rewrite-carry', 'rewrite-input', 'rewrite-result'],
};
