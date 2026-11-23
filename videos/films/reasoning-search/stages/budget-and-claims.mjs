import { searchValues } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { DEAD_END_TRACE } from '../fixtures.mjs';

const originalCut = searchValues([4, 5, 6, 7], 1);
const history = [{ checked: 0, queued: 1 }, ...DEAD_END_TRACE];
const last = history.length - 1;
const x = (n) => 245 + (1045 * n) / last;
const y = (n) => 817 - (430 * n) / 70;

export function drawBudgetAndClaims(ctx, scene, state, api) {
  api.focus.target('budget-and-claims-mechanism', () => {
    const { C, text, line } = api;
    const branch = cueAt(state, 'budget-change', 0, 0.44, 0.66).done;
    const limited = cueAt(state, 'budget-limited', 1, 0, 0.11).done;
    const full = cueAt(state, 'budget-restart', 2, 0.13, 0.24).done;
    const work = cueAt(state, 'budget-work', 2, 0.4, 0.66);
    const empty = cueAt(state, 'budget-empty', 2, 0.68, 0.85);
    const finished = cueAt(state, 'budget-exhaustive', 3, 0, 0.23).done;
    const observed = branch
      ? cueAt(state, 'budget-eighteen', 0, 0.71, 0.81).done
      : cueAt(state, 'budget-root', 0, 0.2, 0.38).done;
    const index = !observed
      ? 0
      : !full
        ? 1
        : empty.done
          ? last
          : 1 + Math.floor((last - 2) * (0.7 * work.progress + 0.3 * empty.progress));
    const data = branch
      ? history
      : [history[0], { checked: originalCut.visited, queued: originalCut.frontier.length }];
    const point = data[index];
    text(ctx, branch ? 'Tray A   [24, 5, 7]' : 'Starting tray   [4, 5, 6, 7]', 162, 260, 45, C.ink);
    text(
      ctx,
      full ? 'State cap lifted' : 'Cap: 1 distinct state',
      1740,
      260,
      39,
      C.yellow,
      'right',
    );
    text(ctx, 'States waiting', 147, 352, 32, C.muted);
    for (const n of [0, 20, 40, 60]) {
      line(ctx, x(0), y(n), x(last), y(n), C.muted, n === 0 ? 3 : 1);
      text(ctx, String(n), 209, y(n) + 9, 28, C.muted, 'right');
    }
    for (const n of [0, 20, 40, 60, 80]) text(ctx, String(n), x(n), 865, 28, C.muted, 'center');
    for (let i = 1; i <= index; i++) {
      const prev = data[i - 1],
        now = data[i];
      line(ctx, x(prev.checked), y(prev.queued), x(now.checked), y(now.queued), C.cyan, 5);
    }
    api.circle(ctx, x(point.checked), y(point.queued), 10, C.yellow);
    text(ctx, 'Distinct states examined', 776, 935, 36, C.ink, 'center');
    text(ctx, point.checked + ' examined', 1430, 472, 38, C.ink);
    text(ctx, point.queued + ' waiting', 1430, 552, 38, C.cyan);
    const verdict = finished ? 'no_solution' : limited && !full ? 'budget_exhausted' : null;
    if (verdict) text(ctx, verdict, 1400, 710, 36, finished ? C.green : C.yellow, 'left', 'mono');
    else if (branch && observed && (!full || empty.done))
      text(ctx, 'Which status?', 1430, 710, 36, C.yellow);
  });
}
export default {
  id: 'budget-and-claims',
  draw: drawBudgetAndClaims,
  cues: [
    'budget-root',
    'budget-change',
    'budget-eighteen',
    'budget-limited',
    'budget-restart',
    'budget-work',
    'budget-empty',
    'budget-exhaustive',
  ],
};
