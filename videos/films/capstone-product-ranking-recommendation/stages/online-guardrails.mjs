import { box, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawOnlineGuardrails(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('online-guardrails-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      rankingText(
        ctx,
        api,
        b === 2 && cueVisible(ctx, api, 'online-zero')
          ? 'Separate zero-purchase branch · same 100 searches per arm'
          : 'Independent authored online worksheet · 100 searches per arm',
        150,
        270,
        32,
      );
      [
        ['control', b === 2 && cueVisible(ctx, api, 'online-zero') ? 0 : 4, 0, C.blue],
        ['treatment', 6, 1, C.cyan],
      ].forEach(([arm, purchases, returns, color], i) => {
        const x = 170 + i * 850;
        rankingText(ctx, api, arm, x, 365, 35, color);
        for (let j = 0; j < 100; j++)
          api.rect(
            ctx,
            x + (j % 20) * 33,
            415 + Math.floor(j / 20) * 40,
            25,
            25,
            j < purchases ? color : C.panel,
            j < purchases ? undefined : C.muted,
            0,
          );
        rankingText(
          ctx,
          api,
          purchases + ' purchases · ' + returns + ' returns',
          x,
          690,
          32,
          color,
        );
        if (cueProgress(ctx, api, 'online-rates') === 1 || b > 0)
          rankingText(
            ctx,
            api,
            'conversion ' +
              (purchases / 100).toFixed(2) +
              ' · returns/purchase ' +
              (purchases ? (returns / purchases).toFixed(3) : 'None'),
            x,
            790,
            27,
            color,
          );
      });
      if (b === 1 && cueProgress(ctx, api, 'online-stop') === 1)
        box(
          ctx,
          api,
          '1/6 > 0 + 0.01 → stop treatment under this declared rule',
          220,
          890,
          1480,
          90,
          C.pink,
          31,
        );
      if (b === 2 && cueVisible(ctx, api, 'online-zero'))
        box(
          ctx,
          api,
          'Control purchases = 0: return rate = None → hold comparison',
          200,
          890,
          1520,
          90,
          C.yellow,
          30,
        );
      if (b === 2 && cueVisible(ctx, api, 'online-endpoints'))
        footer(
          ctx,
          api,
          'Synthetic scoring gate20ms ≠ full-search stop120ms; no live effect or statistical monitoring proof.',
        );
    }
  });
}
export default {
  id: 'online-guardrails',
  draw: drawOnlineGuardrails,
  cues: ['online-counts', 'online-rates', 'online-stop', 'online-zero', 'online-endpoints'],
};
