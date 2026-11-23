import { coverage } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';
import { text } from '../defaults.mjs';

export function drawCoverage(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink) => text(ctx, api, s, x, y, size, color);
  const percent = (p) => `${(p * 100).toFixed(1)}%`;
  const share = cue('selector-recall');
  const returned = cue('selected-success').done;
  label('Tries', 130, 321, 33, C.muted);
  label('Pools with a correct draft', 335, 321, 36, C.ink);
  label('Returned', 1215, 321, 34, C.muted);
  label('Tokens spent', 1505, 321, 34, C.muted);
  for (const [i, n] of [1, 4, 16].entries()) {
    const id = ['row-one', 'row-four', 'row-sixteen'][i];
    const build = cue(['independent-attempts', 'four-attempts', 'diminishing-returns'][i]);
    if (i > 0 && !build.started) continue;
    const y = 411 + i * 145,
      hit = coverage(n);
    const kept = n > 1 ? hit * 0.8 : hit;
    api.focus.target(id, () => {
      label(String(n), 142, y + 50, 61);
      api.rect(ctx, 335, y, 635, 51, C.panel, C.muted, 2);
      const hitWidth = 635 * hit * build.p;
      if (hitWidth > 0) api.rect(ctx, 335, y, hitWidth, 51, C.green, undefined, 2);
      if (share.started && n > 1) {
        const lost = 635 * (hit - kept) * share.p;
        if (lost > 0) api.rect(ctx, 335 + hitWidth - lost, y, lost, 51, C.yellow, undefined, 0);
      }
      if (build.done) {
        label(percent(hit), 1000, y + 42, 42, C.green);
        label((800 * n).toLocaleString('en-US'), 1520, y + 42, 47);
      }
    });
    api.focus.target(n === 4 ? 'returned-four' : 'returned-other', () =>
      label(
        returned ? percent(kept) : '…',
        1220,
        y + 42,
        47,
        returned ? C.cyan : C.muted,
      ),
    );
  }
  api.focus.target('product', () => {
    const equation = cue('failure-product').started
      ? 'Four misses   0.75 × 0.75 × 0.75 × 0.75'
      : 'One miss   0.75';
    label(
      share.started
        ? 'Yellow   A correct draft was available and missed by the selector'
        : equation,
      138,
      896,
      share.started ? 38 : 44,
      C.yellow,
    );
  });
  const footer = share.started
    ? 'Four tries   68.36% × 0.80 ≈ 54.69%'
    : 'One fixed prompt   ·   800 tokens generated per try';
  if (!share.started || returned) label(footer, 138, 976, 35, C.muted);
}

export default { id: 'coverage', draw: drawCoverage };
