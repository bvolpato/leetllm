import { SEED_METADATA as seed } from '../fixtures.mjs';

export function drawSeed(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const split = p('family-split') > 0;
  focus.target('seed-record', () => {
    api.text(ctx, 'Reviewed search task', 150, 299, 37, C.blue);
    api.text(ctx, seed.id, 150, 422, 91, C.ink, 'left', 'mono');
    if (p('seed-source') > 0) api.text(ctx, seed.source, 395, 412, 36, C.ink);
    if (p('seed-slice') > 0) {
      api.text(ctx, 'Task family   /   ' + seed.family, 150, 524, 34, C.blue);
      api.text(ctx, 'Practice   /   retry, then paginate', 150, 591, 34, C.yellow);
    }
  });
  focus.target('seed-rules', () => {
    api.text(ctx, 'Expected client behavior', 985, 299, 37, C.blue);
    if (p('seed-cursor') > 0) api.text(ctx, 'Follow each cursor until null', 985, 400, 43, C.ink);
    if (p('seed-limit') > 0)
      api.text(ctx, 'Request at most ' + seed.contract.pageLimit + ' names', 985, 485, 43, C.ink);
    if (p('seed-retry') > 0)
      api.text(
        ctx,
        'Retry the same cursor up to ' + seed.contract.retryLimit + ' times',
        985,
        570,
        39,
        C.ink,
      );
  });
  if (split) {
    api.line(ctx, 950, 681, 950, 990, C.muted, 3);
    focus.target('training-family', () => {
      api.text(ctx, 'Training family', 150, 738, 36, C.blue);
      api.rect(ctx, 150, 783, 160, 79, C.panel, C.blue);
      api.text(ctx, seed.id, 230, 837, 36, C.ink, 'center');
      const travel = p('keep-lineage');
      if (travel > 0) {
        for (const [i, label] of ['Cursor task', 'Retry task'].entries()) {
          const y = 818 + i * 112;
          api.line(ctx, 327, 826, 327 + 145 * travel, 826 + (y - 826) * travel, C.blue, 3);
          if (travel === 1) {
            api.text(ctx, label, 495, y + 15, 35, C.ink);
            api.text(ctx, 'from ' + seed.id, 710, y + 15, 29, C.blue);
          }
        }
      }
    });
    focus.target('reserved-family', () => {
      api.text(ctx, 'Held-out families', 1020, 738, 36, C.yellow);
      api.text(ctx, 'Separate tasks and answers', 1020, 846, 41, C.ink);
      api.text(ctx, 'Private evaluation set', 1020, 922, 33, C.muted);
    });
  }
}
export default {
  id: 'seed',
  draw: drawSeed,
  cues: [
    'seed-name',
    'seed-source',
    'seed-cursor',
    'seed-limit',
    'seed-retry',
    'seed-slice',
    'family-split',
    'keep-lineage',
    'private-families',
  ],
};
