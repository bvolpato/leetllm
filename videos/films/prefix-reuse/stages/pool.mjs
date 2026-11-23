import { sampleModel } from '../model.mjs';
import { drawLegacyText } from '../defaults.mjs';
export function drawPool(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api;
  const modelState = sampleModel('pool', state),
    currentBeat = modelState.step;
  {
    api.focus.target('pool-20-physical-blocks-fixed-resident-pool', () =>
      drawLegacyText(
        ctx,
        api,
        '20 physical blocks · fixed resident pool',
        120,
        250,
        32,
        themeColors.ink,
      ),
    );
    const palette = {
      referenced: themeColors.blue,
      cached: themeColors.yellow,
      free: themeColors.muted,
      new: themeColors.green,
    };
    api.focus.target('pool-tracked-prefix-g-physical-blocks-0-1', () =>
      components.card({
        label: 'Tracked prefix G · physical blocks 0, 1',
        x: 160,
        y: 285,
        width: 690,
        height: 60,
        fontSize: 27,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.blue,
        padding: 10,
      }),
    );
    api.focus.target('pool-readout', () =>
      drawLegacyText(
        ctx,
        api,
        'Owners: ' + modelState.prefixOwners.join(' + ') + ' · refs ' + modelState.prefixRefs,
        1320,
        325,
        27,
        themeColors.blue,
      ),
    );
    api.arrow(ctx, 870, 315, 1250, 315, themeColors.blue, 3);
    api.focus.target('pool-field-grid', () =>
      teaching.grid({
        x: 160,
        y: 365,
        width: 1050,
        height: 420,
        rows: 4,
        columns: 5,
        labels: Array.from(
          {
            length: 4,
          },
          (_, r) =>
            modelState.blocks
              .slice(r * 5, r * 5 + 5)
              .map((block) =>
                block.id < 2
                  ? block.id + ' · G'
                  : block.state === 'new'
                    ? block.id + ' · R4'
                    : String(block.id),
              ),
        ),
        fontSize: 30,
        textColor: themeColors.ink,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: modelState.blocks.map((block) => ({
          row: Math.floor(block.id / 5),
          column: block.id % 5,
          fill: themeColors.panel,
          stroke: palette[block.state],
        })),
      }),
    );
    const legends = [
      ['Referenced', modelState.referenced, themeColors.blue],
      ['Cached, unowned', modelState.cached, themeColors.yellow],
      ['Uncached free', modelState.free, themeColors.muted],
      ['Available', modelState.available, themeColors.green],
    ];
    legends.forEach(([label, value, color], i) =>
      api.focus.target('pool-readout-2', () =>
        drawLegacyText(ctx, api, `${label}: ${value}`, 1320, 400 + i * 100, 29, color),
      ),
    );
    api.focus.target('pool-readout-3', () =>
      drawLegacyText(
        ctx,
        api,
        `R4 allocated: ${modelState.allocated}/5 · replaced cached entries: ${modelState.evicted}`,
        160,
        885,
        32,
        themeColors.green,
      ),
    );
    api.focus.target('pool-readout-4', () =>
      drawLegacyText(
        ctx,
        api,
        currentBeat === 2
          ? `Old content of block 9 present: ${modelState.old9Present ? 'yes' : 'no'} · recompute on miss`
          : 'Referenced identities 0–8 remain protected',
        160,
        970,
        28,
        themeColors.muted,
      ),
    );
  }
}
export default {
  id: 'pool',
  draw: drawPool,
  cues: [
    'referenced-blocks',
    'cached-available',
    'allocate-five',
    'protect-references',
    'evicted-entry',
    'resident-pool',
  ],
};
