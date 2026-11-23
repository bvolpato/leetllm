import { DASHBOARD_FIXTURES } from './fixtures.mjs';
import { dashboardRows, sum } from './arithmetic.mjs';
import { dashboardText as text, dashboardLine as line } from './defaults.mjs';

const labels = [
  'Policy question',
  'Reviewed rewording',
  'Unsupported question',
  'Private-note request',
];
const baseline = dashboardRows('extractive-v1');

function observation(row) {
  if (row.status === 'abstain') return 'Abstained · no citation';
  return row.citations[0] === 'access-policy-us-v3' ? 'Answered · policy cited' : row.citations[0];
}

export function runSheet(ctx, api, { run, opened = 1, checked = true, inspect = false, footer }) {
  const { C } = api;
  const candidate = dashboardRows(run);
  const columns = [800, 1435];
  api.focus.target('run-sheet', () => {
    [baseline, candidate].forEach((rows, i) => {
      const x = columns[i];
      const passes = sum(rows.map((row) => row.passed));
      text(ctx, api, rows[0].run, x, 263, 35, C.ink, 'center', 'mono');
      const pending = i === 1 && !checked;
      text(
        ctx,
        api,
        pending ? 'Grading…' : passes + ' / ' + rows.length,
        x,
        370,
        76,
        pending ? C.muted : C.ink,
        'center',
      );
    });
    text(ctx, api, 'First answers passed', 125, 343, 33, C.muted);
    const rows = DASHBOARD_FIXTURES.length;
    for (let i = 0; i < rows; i++) {
      const reveal = Math.max(0, Math.min(1, rows * opened - i));
      if (!reveal) continue;
      api.components.fade(reveal, () => {
        const y = 423 + 100 * i;
        const active = inspect && i === 3;
        line(ctx, api, 125, y, 1795, y, active ? C.pink : C.muted, active ? 4 : 1);
        text(ctx, api, labels[i], 125, y + 54, 34, active ? C.pink : C.ink);
        [baseline[i], candidate[i]].forEach((row, j) => {
          const pending = j === 1 && !checked;
          const color = pending ? C.blue : row.passed ? C.green : C.pink;
          const x = columns[j] - 236;
          api.circle(ctx, x, y + 42, 8, color);
          text(ctx, api, observation(row), x + 25, y + 53, 33, color);
        });
      });
    }
    if (footer) {
      line(ctx, api, 125, 843, 1795, 843, C.muted, 2);
      text(ctx, api, footer[0], 125, 922, 40, footer[2] ?? C.yellow);
      if (footer[1]) text(ctx, api, footer[1], 125, 988, 31, C.ink);
    }
  });
}
