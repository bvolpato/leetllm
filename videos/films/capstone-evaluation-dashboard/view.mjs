import { DASHBOARD_FIXTURES } from './fixtures.mjs';
import { comparePackets, dashboardRows, sum } from './arithmetic.mjs';
import { dashboardBox, dashboardText as text, dashboardLine as line } from './defaults.mjs';

export function viewRows(slice, passedOnly) {
  const full = dashboardRows('hybrid-v1');
  const decision = comparePackets(dashboardRows('extractive-v1'), full, 'hybrid-v1');
  const visible = full.filter((r) => (!slice || r.id === slice) && (!passedOnly || r.passed));
  return { full, decision, visible, failed: full.filter((r) => !r.passed) };
}

export function drawView(ctx, api, { slice, passedOnly = false, detail = false, predict = false }) {
  const { C } = api;
  const { full, visible, decision, failed } = viewRows(slice, passedOnly);
  const short = (id) => DASHBOARD_FIXTURES.find((item) => item.id === id).short;
  api.focus.target('dashboard-view', () => {
    text(ctx, api, 'hybrid-v1   /   full decision', 128, 300, 34, C.ink);
    text(ctx, api, decision, 128, 395, 48, C.pink);
    text(
      ctx,
      api,
      sum(full.map((r) => r.passed)) + ' of ' + full.length + ' first answers passed',
      128,
      471,
      33,
      C.ink,
    );
    line(ctx, api, 840, 236, 840, 981, C.muted, 2);
    text(ctx, api, 'Visible rows', 922, 300, 36, C.ink);
    text(
      ctx,
      api,
      slice
        ? short(slice) + (passedOnly ? '   /   passed only' : '   /   all outcomes')
        : 'All fixtures   /   all outcomes',
      922,
      386,
      32,
      C.blue,
    );
    visible.forEach((row, i) => {
      const y = 451 + 77 * i;
      line(ctx, api, 922, y, 1790, y, C.muted, 1);
      text(ctx, api, short(row.id), 922, y + 49, 34, C.ink);
      text(
        ctx,
        api,
        row.passed ? 'PASS' : 'FAIL',
        1775,
        y + 49,
        33,
        row.passed ? C.green : C.pink,
        'right',
      );
    });
    if (!visible.length) text(ctx, api, '0 visible rows', 922, 550, 45, C.muted);
    const passes = sum(visible.map((r) => r.passed));
    const rate = visible.length
      ? passes + ' / ' + visible.length + ' = ' + (100 * passes) / visible.length + '%'
      : 'undefined (0 rows)';
    text(ctx, api, 'Visible pass rate', 922, 851, 30, C.muted);
    text(ctx, api, predict ? 'What rate can you report?' : rate, 922, 929, 43, C.yellow);
    dashboardBox(ctx, api, 125, 565, 650, detail ? 390 : 100, C.pink);
    text(ctx, api, failed[0].id, 160, 627, 32, C.pink, 'left', 'mono');
    if (detail) {
      text(
        ctx,
        api,
        'Expected   ' + failed[0].expectedStatus + ' / no citation',
        160,
        710,
        30,
        C.ink,
      );
      text(ctx, api, failed[0].answer, 160, 783, 34, C.ink);
      text(ctx, api, failed[0].citations[0], 160, 849, 33, C.pink, 'left', 'mono');
      text(
        ctx,
        api,
        failed[0].failures.length + ' failed checks on this row',
        160,
        916,
        29,
        C.muted,
      );
    }
  });
}
