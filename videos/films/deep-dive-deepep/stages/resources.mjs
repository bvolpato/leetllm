import { sampleModel } from '../construction.mjs';
import { routeReplayComparison } from '../model.mjs';
import { card, equation, grid, text } from '../defaults.mjs';
export function drawResources(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel(scene.id, state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  if (currentBeat === 2) {
    const { rebuilt, cached } = routeReplayComparison();
    const format = (row) => '[' + row.map((v) => v.toFixed(2)).join(', ') + ']';
    const comparing = state.cues?.['resources-return-home']?.phase === 'after';
    const counting = state.cues?.['de-resources-counts']?.phase === 'after';
    api.focus.target('resources-layer-receipt', () => {
      text(
        ctx,
        api,
        'Requested change on a     E0 → E2',
        960,
        266,
        42,
        themeColors.yellow,
        'center',
      );
      api.focus.target('resources-restored-results', () => {
        text(ctx, api, 'Source', 275, 376, 32, themeColors.muted, 'center');
        text(ctx, api, 'Cached dispatch', 825, 376, 38, themeColors.pink, 'center');
        text(ctx, api, 'Reference for new route', 1450, 376, 38, themeColors.cyan, 'center');
        Object.keys(rebuilt.restored).forEach((token, index) => {
          const y = 485 + index * 99;
          const different = cached.restored[token].some((v, i) => v !== rebuilt.restored[token][i]);
          const color = comparing && different ? themeColors.yellow : themeColors.ink;
          text(ctx, api, token, 275, y, 46, color, 'center');
          text(ctx, api, format(cached.restored[token]), 825, y, 44, color, 'center');
          text(ctx, api, format(rebuilt.restored[token]), 1450, y, 44, color, 'center');
          api.line(
            ctx,
            145,
            y + 25,
            1765,
            y + 25,
            comparing && different ? color : themeColors.muted,
            2,
          );
        });
      });
      api.focus.target('de-resources-histogram', () => {
        const metric = counting ? 'Valid slots per expert (E0 to E3)' : 'Valid returns';
        text(ctx, api, metric, 136, 920, 30, themeColors.ink);
        text(
          ctx,
          api,
          counting ? '[' + cached.counts.join(', ') + ']' : String(cached.returnedRows),
          825,
          920,
          40,
          themeColors.pink,
          'center',
        );
        text(
          ctx,
          api,
          counting ? '[' + rebuilt.counts.join(', ') + ']' : String(rebuilt.returnedRows),
          1450,
          920,
          40,
          themeColors.cyan,
          'center',
        );
      });
      text(
        ctx,
        api,
        'CPU reference   ·   device timing still to measure',
        960,
        1010,
        30,
        themeColors.muted,
        'center',
      );
    });
  } else if (currentBeat === 1) {
    const max = modelState.hybridRequested,
      barWidth = 650;
    text(
      ctx,
      api,
      'Historical V2 helper · supplied sizing fixture',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    api.focus.target('resources-qp-budget', () => {
      card(ctx, api, modelState.sms + ' communication SMs', 180, 365, 720, themeColors.blue, 95);
      card(ctx, api, modelState.allocated + ' allocated QPs', 1030, 365, 720, themeColors.cyan, 95);
    });
    api.focus.target('resources-qp-requests', () => {
      equation(
        ctx,
        api,
        `\\mathrm{direct}:\\min(${modelState.sms},9)=${result('resources-pool') ? modelState.directRequested : '?'}`,
        540,
        545,
        38,
      );
      equation(
        ctx,
        api,
        `\\mathrm{hybrid}:${modelState.sms}\\times16+1=${result('resources-pool') ? modelState.hybridRequested : '?'}`,
        1390,
        545,
        38,
      );
    });
    api.focus.target('resources-qp-cap', () => {
      [
        {
          x: 215,
          label: 'Direct',
          requested: modelState.directRequested,
          allocated: modelState.direct,
          color: themeColors.blue,
        },
        {
          x: 1065,
          label: 'Hybrid',
          requested: modelState.hybridRequested,
          allocated: modelState.hybrid,
          color: themeColors.pink,
        },
      ].forEach((v) => {
        const ready = result('resources-pool');
        text(
          ctx,
          api,
          ready ? v.label + ' · requested ' + v.requested : v.label + ' · request calculation',
          v.x,
          640,
          30,
          v.color,
        );
        api.rect(
          ctx,
          v.x,
          690,
          ready ? (barWidth * v.requested) / max : barWidth,
          45,
          themeColors.panel,
          ready ? v.color : themeColors.muted,
          3,
        );
        if (ready)
          api.rect(ctx, v.x, 775, (barWidth * v.allocated) / max, 45, v.color, undefined, 3);
        text(
          ctx,
          api,
          ready
            ? `Allocated: min(${v.requested}, ${modelState.allocated}) = ${v.allocated}`
            : 'Requested and capped counts pending',
          v.x + 325,
          885,
          30,
          ready ? themeColors.green : themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          ready
            ? 'Above pool: ' + (v.requested - v.allocated) + ' requested QPs'
            : 'Apply the supplied pool after computing the request',
          v.x + 325,
          955,
          28,
          ready ? v.color : themeColors.muted,
          'center',
        );
      });
    });
    text(
      ctx,
      api,
      'Requested count and allocated pool are separate inputs',
      960,
      1010,
      28,
      themeColors.muted,
      'center',
    );
  } else {
    text(
      ctx,
      api,
      'Uniform pairs of two distinct experts among four',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    api.focus.target(
      'resources-grid-s-pairs-map-v-v-experts-join-s-pairs-map-v-v-destinations-230-4',
      () =>
        grid(
          ctx,
          api,
          [
            modelState.pairs.map((v) => `[${v.experts.join(',')}]`),
            modelState.pairs.map((v) => v.destinations),
          ],
          230,
          400,
          1460,
          230,
          themeColors.blue,
          36,
        ),
    );
    api.focus.target('resources-math-mathbb-e-mathrm-destinations-rac-6-rac53', () =>
      equation(
        ctx,
        api,
        String.raw`\mathbb E[\mathrm{destinations}]=\frac{${modelState.pairs.map((v) => v.destinations).join('+')}}{6}` +
          (result('resources-mean') ? String.raw`=\frac53` : ' = ?'),
        960,
        770,
        43,
      ),
    );
    text(
      ctx,
      api,
      `Historical V2 helper · ${modelState.sms} SMs · ${modelState.allocated} allocated QPs`,
      960,
      900,
      31,
      themeColors.muted,
      'center',
    );
    text(
      ctx,
      api,
      'QP requests and pool caps follow this destination worksheet',
      960,
      1000,
      31,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'resources',
  draw: drawResources,
  cues: [
    'resources-beat-1-focus-1',
    'resources-beat-1-focus-2',
    'dep-result-resources-mean',
    'resources-beat-2-focus-1',
    'resources-beat-2-focus-2',
    'dep-result-resources-pool',
    'resources-beat-3-focus-1',
    'resources-return-home',
    'de-resources-counts',
  ],
};
