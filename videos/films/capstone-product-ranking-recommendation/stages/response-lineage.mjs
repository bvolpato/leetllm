import { box, cueVisible, footer, miniSlate, rankingText } from '../defaults.mjs';
export function drawResponseLineage(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('response-lineage-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      rankingText(
        ctx,
        api,
        'Retained server proposals · no client-view acknowledgement',
        150,
        270,
        32,
      );
      [
        ['REQ-500', 'SHOP-100', ['P4', 'P5', 'P6'], '12:00:00'],
        ['REQ-501', 'SHOP-200', ['P5', 'P6', 'P4'], '12:00:05'],
      ].forEach(([id, shopper, slate, time], g) => {
        const x = 170 + g * 850;
        rankingText(ctx, api, id + ' / ' + shopper + ' / ' + time, x, 365, 28, C.blue);
        miniSlate(
          ctx,
          api,
          slate.map((id, i) => ({
            id,
            score: null,
          })),
          x,
          440,
          610,
        );
      });
      if (b === 0 && cueVisible(ctx, api, 'response-identity'))
        footer(
          ctx,
          api,
          'Catalog / eligibility / candidate / ranker / experiment versions travel with product and position.',
        );
      if (b === 1 && cueVisible(ctx, api, 'response-observed')) {
        ['returned', 'rendered', 'visible', 'examined'].forEach((name, i) => {
          box(ctx, api, name, 170 + i * 420, 840, 365, 80, i ? C.muted : C.green, 29);
          if (i) rankingText(ctx, api, 'No receipt', 350 + i * 420, 970, 26, C.yellow, 'center');
        });
      }
      if (b === 2 && cueVisible(ctx, api, 'response-validate'))
        box(
          ctx,
          api,
          'Positions1/2/3 · unique exact products · consistent request metadata',
          200,
          845,
          1520,
          80,
          C.cyan,
          29,
        );
      if (b === 2 && cueVisible(ctx, api, 'response-history'))
        footer(
          ctx,
          api,
          'Old rows use the retained historical catalog; new responses still recheck current eligibility.',
        );
    }
  });
}
export default {
  id: 'response-lineage',
  draw: drawResponseLineage,
  cues: [
    'response-rows',
    'response-identity',
    'response-observed',
    'response-ack',
    'response-validate',
    'response-history',
  ],
};
