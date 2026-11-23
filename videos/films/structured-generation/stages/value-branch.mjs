import { VALUE_PREFIX } from '../fixtures.mjs';
import { normalizedWeights } from '../arithmetic.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { prefixLine } from '../page.mjs';

export function drawValueBranch(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('branch-share', () => {
    prefixLine(ctx, api, VALUE_PREFIX);
    const move = focus.progress('branch-double', 0);
    const weights = [2, 3 + 3 * move];
    const [pass, fail] = normalizedWeights(weights, [0, 1]);
    const start = 145,
      width = 1590,
      seam = start + width * pass;
    text(ctx, api, 'Share of the next-token draw', start, 535, 36, C.muted);
    api.rect(ctx, start, 603, width * pass, 110, C.blue, null, 0);
    api.rect(ctx, seam, 603, width * fail, 110, C.cyan, null, 0);
    code(ctx, api, 'passed', start, 805, 48, C.blue);
    code(ctx, api, 'fa', start + width, 805, 48, C.cyan, 'right');
    code(
      ctx,
      api,
      Math.round(100 * pass) + '%',
      start + (width * pass) / 2,
      674,
      45,
      C.bg,
      'center',
    );
    code(
      ctx,
      api,
      Math.round(100 * fail) + '%',
      seam + (width * fail) / 2,
      674,
      45,
      C.bg,
      'center',
    );
    const fmt = (n) => Number(n.toFixed(1)).toString();
    text(ctx, api, 'Weight ' + weights[0], start, 876, 36, C.ink);
    text(ctx, api, 'Weight ' + fmt(weights[1]), start + width, 876, 36, C.ink, 'right');
    if (state.beat >= 2)
      text(ctx, api, 'Runner log: failed in unit-tests', 940, 958, 38, C.yellow, 'center');
  });
}
export default {
  id: 'value-branch',
  draw: drawValueBranch,
  cues: ['branch-weights', 'branch-double', 'branch-source'],
};
