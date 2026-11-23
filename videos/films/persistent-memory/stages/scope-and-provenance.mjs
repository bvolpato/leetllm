import { cue } from '../case-file.mjs';
import { memoryAccessFixture } from '../model.mjs';

export function drawScopeAndProvenance(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const { records, eligible } = memoryAccessFixture();
    const selected = cue(api, 'scope-filter') >= 1;
    api.focus.target('candidate-register', () => {
      api.text(ctx, 'Signed-in scope   billing / webhook', 117, 283, 39, C.cyan, 'left', 'mono');
      api.text(ctx, 'Retained event', 120, 415, 31, C.muted);
      api.text(ctx, 'Tenant', 757, 415, 31, C.muted);
      api.text(ctx, 'Wording match', 1045, 415, 31, C.muted);
      api.text(ctx, 'Enters ranking?', 1434, 415, 31, C.muted);
      records.slice(0, 3).forEach((row, i) => {
        const y = 512 + i * 128;
        const allowed = eligible.includes(row);
        const textColor = selected && !allowed ? C.muted : C.ink;
        api.line(ctx, 116, y - 64, 1788, y - 64, C.muted, 1);
        api.text(ctx, row.id, 120, y, 41, textColor);
        api.text(ctx, row.tenant, 757, y, 40, textColor);
        api.text(ctx, row.similarity.toFixed(2), 1090, y, 43, textColor, 'left', 'mono');
        api.text(
          ctx,
          selected ? (allowed ? 'Admit' : 'Outside scope') : '?',
          1434,
          y,
          40,
          selected ? (allowed ? C.green : C.muted) : C.yellow,
        );
      });
      if (selected)
        api.text(
          ctx,
          'Only current, accessible, unexpired source versions can enter.',
          120,
          955,
          34,
          C.cyan,
        );
      else api.text(ctx, 'Which rows can enter the comparison?', 120, 955, 38, C.yellow);
    });
    return;
  }
  const replace = cue(api, 'source-replacement') >= 1;
  api.text(ctx, 'Execution log   /   retained receipt', 120, 308, 36, C.blue);
  api.text(ctx, 'What ran?', 120, 425, 53, C.ink, 'left', 'serif');
  api.text(ctx, 'pnpm test', 120, 508, 50, C.ink, 'left', 'mono');
  api.line(ctx, 900, 300, 900, 822, C.muted, 2);
  api.focus.target('preference', () => {
    api.text(ctx, 'Project profile   /   billing verifier', 986, 308, 36, C.cyan);
    api.text(ctx, 'What should run now?', 986, 425, 51, C.ink, 'left', 'serif');
    api.text(ctx, 'v1', 990, 539, 35, C.muted, 'left', 'mono');
    api.text(ctx, 'pnpm test', 1090, 539, 40, replace ? C.muted : C.ink, 'left', 'mono');
    if (cue(api, 'receipt-vs-rule') > 0) {
      api.text(ctx, 'v2', 990, 655, 35, C.cyan, 'left', 'mono');
      api.text(ctx, 'pnpm test --run billing', 1090, 655, 40, C.ink, 'left', 'mono');
    }
    if (replace) api.text(ctx, 'Ada explicitly replaced v1.', 990, 790, 37, C.green);
  });
}
export default {
  id: 'scope-and-provenance',
  draw: drawScopeAndProvenance,
  cues: ['scope-filter', 'receipt-vs-rule', 'source-replacement'],
};
