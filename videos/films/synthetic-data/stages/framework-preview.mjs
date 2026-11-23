import { ADMISSION_FIXTURES, SEED_METADATA } from '../fixtures.mjs';
import { runSearchFixture } from '../model.mjs';
import { arrow, tag } from '../defaults.mjs';

const preview = ADMISSION_FIXTURES.filter((row) => ['C1', 'C4'].includes(row.id)).map((row) => ({
  row,
  run: runSearchFixture(row),
}));

export function drawFrameworkPreview(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  focus.target('framework-preview-mechanism', () => {
    if (state.beat === 0) {
      tag(ctx, api, SEED_METADATA.id + '   ·   reviewed contract', 540, 345, C.blue, 720);
      tag(ctx, api, 'Generated search task', 540, 565, C.blue, 720);
      if (p('column-contract') > 0) {
        tag(ctx, api, 'Proposed answer', 1400, 455, C.cyan, 685);
        arrow(ctx, api, 919, 345, 1033, 422, C.blue);
        arrow(ctx, api, 919, 565, 1033, 486, C.blue);
      }
      if (p('column-verify') > 0) {
        tag(ctx, api, 'Trusted two-page search fixture', 540, 833, C.yellow, 720);
        tag(ctx, api, 'Verifier receipt', 1400, 833, C.green, 685);
        arrow(ctx, api, 1400, 523, 1400, 763, C.cyan);
        arrow(ctx, api, 919, 833, 1033, 833, C.yellow);
      }
      api.text(
        ctx,
        'NeMo Data Designer   ·   September 2026 preprint',
        960,
        996,
        30,
        C.muted,
        'center',
      );
      return;
    }
    api.text(ctx, 'Preview from the local search fixture', 145, 290, 41, C.ink);
    for (const [i, { row, run }] of preview.entries()) {
      const x = 145 + i * 846;
      const y = 398;
      api.text(ctx, row.id + '   /   ' + row.task, x, y, 48, C.blue);
      api.line(ctx, x, y + 30, x + 751, y + 30, C.blue, 2);
      api.text(ctx, 'Seed    ' + row.seed, x, y + 110, 38, C.muted);
      if (p('preview-requests') > 0) {
        api.text(ctx, 'First request', x, y + 202, 30, C.muted);
        api.text(
          ctx,
          'limit = ' + run.requests[0].limit.toLocaleString('en-US'),
          x,
          y + 269,
          44,
          C.cyan,
          'left',
          'mono',
        );
      }
      if (p('preview-receipts') > 0) {
        api.text(ctx, 'Verifier receipt', x, y + 380, 30, C.muted);
        if (p(i === 0 ? 'preview-good' : 'preview-bad') === 1) {
          const { items } = run.result;
          api.text(
            ctx,
            items.length + ' names collected',
            x,
            y + 449,
            46,
            run.accepted ? C.green : C.pink,
          );
          const detail = items.length
            ? items.join('   ·   ')
            : 'HTTP ' + run.trace[0].response.status + '   ·   ' + run.result.error;
          api.text(ctx, detail, x, y + 516, 32, C.ink);
        }
      }
    }
  });
}
export default {
  id: 'framework-preview',
  draw: drawFrameworkPreview,
  cues: [
    'column-dependencies',
    'column-contract',
    'column-verify',
    'preview-small',
    'preview-requests',
    'preview-receipts',
    'preview-good',
    'preview-bad',
  ],
};
