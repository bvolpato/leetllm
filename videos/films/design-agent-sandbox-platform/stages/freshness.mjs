import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawFreshness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('freshness', state);
  {
    const names = ['Timekeeping', 'Fresh uniqueness', 'Network identity', 'New control session'];
    names.forEach((name, i) => {
      const x = 170 + (i % 2) * 870,
        y = 340 + Math.floor(i / 2) * 250;
      api.focus.target('freshness-name', () =>
        drawLegacyCard(
          ctx,
          api,
          name,
          x,
          y,
          710,
          modelState.checks[i] ? themeColors.green : themeColors.muted,
          110,
          35,
        ),
      );
      drawLegacyText(
        ctx,
        api,
        modelState.checks[i] ? 'VERIFIED' : 'PENDING',
        x + 355,
        y + 180,
        32,
        modelState.checks[i] ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    drawLegacyText(
      ctx,
      api,
      modelState.ready ? 'READY FOR USER CODE' : 'USER CODE HELD',
      960,
      960,
      49,
      modelState.ready ? themeColors.green : themeColors.yellow,
      'center',
    );
    drawLegacyText(
      ctx,
      api,
      'Supplied clone-A validation outcomes · ' +
        modelState.receipts.map((r) => r.id.replace('CLONE-', '')).join(' / '),
      960,
      1030,
      25,
      themeColors.muted,
      'center',
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'freshness',
  draw: drawFreshness,
  cues: ['freshness-beat-1-focus-1', 'freshness-beat-2-focus-1'],
};
