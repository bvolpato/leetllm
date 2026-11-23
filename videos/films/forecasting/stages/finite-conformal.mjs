import { timedForecastScene } from '../construction.mjs';
import { conformalRank } from '../arithmetic.mjs';
import { absSorted } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const extra = [1, 2, 2, 3, 4];
const extended = [...absSorted, ...extra].sort((a, b) => a - b);
const target = 0.95;
const x = (i) => 180 + 85 * i;

const scene = timedForecastScene('finite-conformal', (ctx, api, clock) => {
  const { C } = api;
  const more = clock.progress('more') > 0;
  const scores = more ? extended : absSorted;
  const empirical = Math.ceil(scores.length * target);
  const requested = conformalRank(scores.length, target);
  const rule = clock.progress('rule') > 0;
  const split = clock.after(more ? 'available' : 'ghost');
  const selected = split ? requested.rank : !rule && clock.after('empirical') ? empirical : null;
  api.focus.target('rank-shelf', () => {
    text(
      ctx,
      api,
      scores.length + ' earlier absolute errors  ·  jobs',
      145,
      297,
      42,
      C.ink,
      'left',
    );
    if (more) text(ctx, api, 'Added scores   ' + extra.join('   '), 145, 365, 31, C.cyan, 'left');
    const cells = scores.length + Number(split && !requested.finite);
    for (let i = 0; i < cells; i++) {
      const absent = i >= scores.length;
      const color = selected === i + 1 ? C.yellow : C.blue;
      api.rect(ctx, x(i) - 35, 454, 70, 87, C.panel, color, 3);
      if (!absent) text(ctx, api, scores[i], x(i), 511, 37, C.ink);
      text(ctx, api, i + 1, x(i), 594, 26, color);
    }
    text(ctx, api, 'Rank', 133, 643, 26, C.muted);
    if (selected !== null) {
      const pos = x(selected - 1);
      api.line(ctx, pos, 614, pos, 664, C.yellow, 5);
      text(ctx, api, 'Rank ' + selected, pos, 710, 32, C.yellow);
    }
  });
  api.focus.target('rank-formula', () => {
    const operand = rule ? '(' + scores.length + ' + 1)' : String(scores.length);
    const result = rule ? (split ? requested.rank : '?') : selected === null ? '?' : empirical;
    text(
      ctx,
      api,
      (rule ? 'Split conformal' : 'Empirical') + '   ·   ceil(' + operand + ' × 0.95) = ' + result,
      960,
      818,
      42,
      C.ink,
    );
    let width = 'Select a score to set the half-width.';
    if (more && clock.after('finite')) width = scores[requested.rank - 1] + '-job half-width';
    else if (!more && clock.after('infinite'))
      width = 'No measured score at this rank   ·   half-width ∞';
    else if (!rule && selected !== null) width = scores[empirical - 1] + '-job half-width';
    text(ctx, api, width, 960, 922, 35, C.yellow);
  });
});

export const drawFiniteConformal = scene.draw;
export default scene;
