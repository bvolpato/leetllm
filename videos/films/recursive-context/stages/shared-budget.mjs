import { sampleModel } from '../model.mjs';
import { card, drawText } from '../defaults.mjs';
export function drawSharedBudget(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('shared-budget', state);
  {
    drawText(ctx, api, 'One shared ledger · cap 4 calls / 10 cost units', 140, 265, 33);
    ['Request', 'Status', 'Calls charged', 'Cost charged'].forEach((label, i) =>
      drawText(ctx, api, label, [170, 650, 1140, 1490][i], 355, 28, themeColors.muted),
    );
    ['Root', 'Child A', 'Child B', 'Child C'].forEach((id, i) =>
      api.focus.target('budget-' + id.toLowerCase().replaceAll(' ', '-'), () => {
        const row = modelState.entries[id],
          y = 405 + i * 105,
          color = !row
            ? themeColors.muted
            : row.status === 'unknown' || row.status === 'queued'
              ? themeColors.pink
              : themeColors.green;
        card(ctx, api, id, 145, y, 350, themeColors.blue, 75);
        drawText(ctx, api, row?.status ?? 'not requested', 650, y + 48, 30, color);
        drawText(
          ctx,
          api,
          String(row && row.status !== 'queued' ? row.calls : 0),
          1230,
          y + 48,
          31,
          color,
          'center',
        );
        drawText(ctx, api, row ? row.charged.toFixed(1) : '0.0', 1580, y + 48, 31, color, 'center');
      }),
    );
    api.text(ctx, 'Each cell = 0.5 cost unit', 960, 818, 24, themeColors.muted, 'center');
    const chargeRows = Object.values(modelState.entries).filter((row) => row.charged > 0);
    for (let i = 0; i < 20; i++) {
      api.rect(ctx, 260 + i * 70, 845, 60, 25, themeColors.panel);
    }
    let offset = 0;
    for (const row of chargeRows) {
      const color =
        row.status === 'unknown'
          ? themeColors.pink
          : row.id === 'Root'
            ? themeColors.blue
            : themeColors.cyan;
      for (let amount = 0; amount < row.charged; amount += 0.5) {
        const index = offset + amount / 0.5;
        api.rect(
          ctx,
          260 + index * 70,
          845,
          60 * Math.min(1, (row.charged - amount) / 0.5),
          25,
          color,
        );
      }
      offset += row.charged / 0.5;
    }
    api.focus.target('budget-availability', () =>
      drawText(
        ctx,
        api,
        `Available: ${modelState.availableCalls} ${modelState.availableCalls === 1 ? 'call' : 'calls'} / ${modelState.availableCost.toFixed(1)} cost units`,
        960,
        895,
        33,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('budget-request', () =>
      drawText(
        ctx,
        api,
        modelState.entries['Child C']
          ? 'Child C asks for 2 calls / 4 units · stays queued'
          : api.focus.progress('last-request', 0) > 0
            ? 'Child C asks for 2 calls and 4.0 units'
            : 'Reserve capacity before dispatch.',
        960,
        970,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'shared-budget',
  draw: drawSharedBudget,
  cues: [
    'shared-capacity',
    'reserve-root',
    'dispatch-root',
    'settle-root',
    'admit-child-a',
    'timeout-child-a',
    'unknown-outcome',
    'known-outcome',
    'last-request',
    'queued-child',
    'host-budget',
    'upper-bound',
  ],
};
