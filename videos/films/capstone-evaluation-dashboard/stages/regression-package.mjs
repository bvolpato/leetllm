import { dashboardDecision, dashboardRows, dashboardStarted } from '../arithmetic.mjs';
import { dashboardText as text, dashboardLine as line } from '../defaults.mjs';

export function drawRegressionPackage(ctx, scene, state, api) {
  const { C } = api;
  const missing = state.beat > 0 && dashboardStarted(state, 'omit-row', state.beatP > 0.2);
  const run = 'hybrid-v1';
  const rows = dashboardRows(run);
  const packet = missing ? rows.slice(0, -1) : rows;
  const decision = dashboardDecision(packet).toLowerCase().replaceAll(' ', '_');
  api.focus.target('gate-call', () => {
    text(ctx, api, 'Retained fixture IDs', 130, 309, 33, C.muted);
    rows.forEach((row, i) => {
      const present = packet.includes(row);
      text(ctx, api, row.id, 130, 413 + 93 * i, 31, present ? C.ink : C.muted, 'left', 'mono');
      text(
        ctx,
        api,
        present ? (row.passed ? 'PASS' : 'FAIL') : 'ABSENT',
        860,
        413 + 93 * i,
        32,
        present && row.passed ? C.green : C.pink,
        'right',
      );
    });
    line(ctx, api, 940, 237, 940, 800, C.muted, 2);
    text(ctx, api, 'Python', 1020, 309, 33, C.muted);
    text(ctx, api, 'decision(packet, "hybrid-v1")[0]', 1020, 471, 33, C.ink, 'left', 'mono');
    text(ctx, api, decision, 1020, 594, 43, C.yellow, 'left', 'mono');
    text(
      ctx,
      api,
      missing
        ? 'Collect the absent row, then rerun the gate.'
        : 'Inspect the failed row in the complete packet.',
      1020,
      681,
      29,
      C.ink,
    );
    if (state.beat > 1)
      text(
        ctx,
        api,
        'Frozen inputs + JSONL outputs    →    tested gate    →    static HTML',
        960,
        938,
        37,
        C.ink,
        'center',
      );
  });
}
export default { id: 'regression-package', draw: drawRegressionPackage, cues: ['omit-row'] };
