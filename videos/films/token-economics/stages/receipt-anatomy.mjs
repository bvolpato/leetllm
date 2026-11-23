import { USAGE_RECEIPT } from '../fixtures.mjs';
import { card, text } from '../defaults.mjs';
export function drawReceiptAnatomy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const parts = [
      {
        label: 'ordinary input',
        value: 1800,
        color: themeColors.cyan,
      },
      {
        label: 'cache reads',
        value: 0,
        color: themeColors.yellow,
      },
      {
        label: 'generated output',
        value: 180,
        color: themeColors.pink,
      },
    ];
    api.focus.target('request-receipt', () =>
      card(ctx, api, 'request · ' + USAGE_RECEIPT.request, 300, 340, themeColors.blue, 600, 84),
    );
    api.focus.target('rate-identity', () =>
      card(
        ctx,
        api,
        'model · ' + USAGE_RECEIPT.model + ' · ' + USAGE_RECEIPT.tier + ' · USD',
        980,
        340,
        themeColors.green,
        650,
        84,
      ),
    );
    api.focus.target('rate-identity', () =>
      card(ctx, api, 'Region · ' + USAGE_RECEIPT.region, 230, 460, themeColors.green, 400, 70),
    );
    api.focus.target('request-receipt', () =>
      card(ctx, api, 'Outcome · ' + USAGE_RECEIPT.outcome, 710, 460, themeColors.blue, 470, 70),
    );
    api.focus.target('rate-identity', () =>
      card(
        ctx,
        api,
        'Effective · ' + USAGE_RECEIPT.priceEffectiveDate,
        1260,
        460,
        themeColors.green,
        500,
        70,
      ),
    );
    const max = Math.max(...parts.map((row) => row.value));
    parts.forEach((row, i) => {
      const y = 620 + i * 115;
      api.focus.target('usage-categories', () =>
        text(ctx, api, row.label, 340, y + 20, 30, row.color, 'left'),
      );
      api.components.panel({
        x: 620,
        y: y - 25,
        width: 650,
        height: 48,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        radius: 12,
      });
      if (row.value) {
        ctx.save();
        ctx.globalAlpha *= state.cues ? 1 : phaseForBeat(i === 0 ? 0 : 1);
        api.focus.target('usage-categories', () =>
          api.rect(ctx, 620, y - 25, (650 * row.value) / max, 48, row.color, undefined, 12),
        );
        ctx.restore();
      }
      api.focus.target('usage-categories', () =>
        text(ctx, api, `${row.value.toLocaleString()} tokens`, 1430, y + 20, 29, row.color, 'left'),
      );
    });
    text(ctx, api, 'Supplied receipt + dated rate table', 960, 1000, 29, themeColors.muted);
  }
}
export default {
  id: 'receipt-anatomy',
  draw: drawReceiptAnatomy,
  cues: ['provider-receipt', 'separate-categories', 'dated-identity'],
};
