import { DASHBOARD_FIXTURES } from '../fixtures.mjs';
import { dashboardDecision, dashboardRows, dashboardStarted } from '../arithmetic.mjs';
import { dashboardCell as cell, dashboardText as text } from '../defaults.mjs';

export function drawInventory(ctx, scene, state, api) {
  const { C } = api;
  const missing = state.beat > 0 || dashboardStarted(state, 'inventory-missing', state.beatP > 0.4);
  const duplicate =
    state.beat > 0 && dashboardStarted(state, 'inventory-duplicate', state.beatP > 0.2);
  const rows = dashboardRows('hybrid-v2');
  const packet = missing ? rows.slice(0, 3) : [...rows];
  if (duplicate) packet.push(rows[0]);
  api.focus.target('inventory', () => {
    text(ctx, api, 'Frozen fixture ID', 145, 315, 34, C.ink);
    text(ctx, api, 'Rows received for this ID', 1325, 315, 34, C.ink, 'center');
    DASHBOARD_FIXTURES.forEach((fixture, i) => {
      const y = 371 + i * 112;
      text(ctx, api, fixture.id, 145, y + 50, 35, C.ink, 'left', 'mono');
      const count = packet.filter((row) => row.id === fixture.id).length;
      cell(
        ctx,
        api,
        count + (count === 0 ? '     missing' : count === 2 ? '     duplicate' : '     present'),
        1090,
        y,
        470,
        78,
        count === 1 ? C.green : C.pink,
        34,
      );
    });
    const valid = dashboardDecision(packet) !== 'HOLD COMPARISON';
    const answered =
      state.beat > 0 || dashboardStarted(state, 'inventory-hold', state.beatP > 0.78);
    text(ctx, api, packet.length + ' rows received', 145, 902, 37, C.ink);
    text(
      ctx,
      api,
      valid ? 'All four IDs present' : answered ? 'HOLD COMPARISON' : 'Ready to compare?',
      1065,
      902,
      40,
      valid ? C.green : C.yellow,
    );
    if (!valid && answered)
      text(
        ctx,
        api,
        'Collect the missing output before computing a pass rate.',
        145,
        984,
        33,
        C.muted,
      );
  });
}
export default {
  id: 'inventory',
  draw: drawInventory,
  cues: ['inventory-missing', 'inventory-hold', 'inventory-duplicate'],
};
