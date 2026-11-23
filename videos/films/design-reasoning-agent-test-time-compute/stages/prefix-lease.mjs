import { constructionModel } from '../model.mjs';
import { drawConstructionBox, drawConstructionFoot, drawConstructionHead } from '../defaults.mjs';
export function drawPrefixLease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('prefix-lease', state);
  {
    drawConstructionHead(ctx, api, 'A shared physical page keeps references and reader leases');
    const page = drawConstructionBox(
      ctx,
      api,
      'P0 · shared [10, 11]\nreferences ' + modelState.refs,
      740,
      360,
      440,
      150,
      themeColors.blue,
      30,
    );
    for (let i = 0; i < 4; i++) {
      const pruned = modelState.pruned && i < 2,
        privatePage = modelState.copied && i === 3,
        node = drawConstructionBox(
          ctx,
          api,
          'Branch ' + (i + 1) + (pruned ? ' · pruned' : ''),
          150 + i * 440,
          690,
          360,
          95,
          pruned ? themeColors.muted : themeColors.cyan,
          28,
        );
      if (!pruned && !privatePage)
        api.connect(ctx, page, node, {
          color: themeColors.blue,
          gap: 15,
        });
      if (privatePage) {
        const copy = drawConstructionBox(
          ctx,
          api,
          'P4 · private [10, 20]\nchanged copy',
          1470,
          495,
          350,
          150,
          themeColors.yellow,
          25,
        );
        api.connect(ctx, copy, node, {
          color: themeColors.yellow,
          gap: 12,
        });
      }
    }
    if (currentBeat) {
      const suffix = drawConstructionBox(
        ctx,
        api,
        'Losing suffix S1\nrefs 0 · readers ' + modelState.reader,
        220,
        825,
        720,
        165,
        modelState.reader ? themeColors.pink : themeColors.green,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.released ? 'S1 reclaim permitted' : 'S1 retained for active reader',
        1080,
        825,
        650,
        165,
        modelState.released ? themeColors.green : themeColors.yellow,
        31,
      );
    } else
      drawConstructionFoot(
        ctx,
        api,
        'Token/position, model/adapter, format and authenticated scope all belong to cache identity.',
      );
  }
}
export default {
  id: 'prefix-lease',
  draw: drawPrefixLease,
  cues: [
    'ra-prefix-lease-0-0',
    'ra-prefix-lease-0-1',
    'ra-prefix-lease-0-2',
    'ra-prefix-lease-0-3',
    'ra-prefix-lease-0-4',
    'ra-prefix-lease-1-0',
    'ra-prefix-lease-1-1',
    'ra-prefix-lease-1-2',
    'ra-prefix-lease-1-3',
    'ra-prefix-lease-2-0',
    'ra-prefix-lease-2-1',
    'ra-prefix-lease-2-2',
  ],
};
