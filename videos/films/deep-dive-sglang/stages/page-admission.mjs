import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { cells, extensionText, footer, title } from '../defaults.mjs';
export function drawPageAdmission(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('page-admission-mechanism', () => {
    title(ctx, api, 'A budget-fitting chunk can still fail allocation');
    cells(
      ctx,
      api,
      ['decode', 'p0', 'p1', 'p2', 'p3', 'p4'],
      350,
      360,
      1220,
      85,
      themeColors.green,
    );
    extensionText(
      ctx,
      api,
      '1 + 5 = 6 fresh positions · arithmetic PASS',
      960,
      515,
      34,
      themeColors.green,
      'center',
    );
    const fail = currentBeat === 1 && sgBegun(state, 'budget-memory', q > 0.4);
    extensionText(
      ctx,
      api,
      'KV allocation · 4 positions per page',
      960,
      640,
      30,
      themeColors.blue,
      'center',
    );
    cells(ctx, api, ['p0', 'p1', 'p2', 'p3'], 260, 705, 640, 75, themeColors.cyan);
    cells(
      ctx,
      api,
      ['p4', 'slack', 'slack', 'slack'],
      1020,
      705,
      640,
      75,
      fail ? themeColors.pink : themeColors.muted,
    );
    extensionText(ctx, api, '2 required pages = 8 slots', 560, 850, 32, themeColors.blue, 'center');
    extensionText(ctx, api, '1 free page = 4 slots', 1340, 850, 32, themeColors.pink, 'center');
    footer(
      ctx,
      api,
      fail
        ? 'Waiting for a second free KV page'
        : 'Pinned mixed-chunk default false · future-output reservations are separate',
    );
  });
}
export default {
  id: 'page-admission',
  draw: drawPageAdmission,
  cues: ['sg-page-admission-beat-0', 'sg-page-admission-beat-1', 'sg-budget-memory'],
};
