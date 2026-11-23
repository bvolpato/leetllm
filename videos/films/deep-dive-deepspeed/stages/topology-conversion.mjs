import { complete, sentence } from '../construction.mjs';
import { drawChapterFooter, drawChapterGrid, drawChapterText } from '../defaults.mjs';
export function drawTopologyConversion(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'topology-conversion', beat, index),
    resultComplete = (beat, index) => complete(state, 'topology-conversion', beat, index);
  api.focus.target('topology-conversion-construction', () => {
    drawTopology();
  });
  function drawTopology() {
    drawChapterText(
      ctx,
      api,
      'Supplied dense tensor W · shape [3,4] · 12 float32 coordinates',
      960,
      285,
      33,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      const count = Math.floor(sentenceProgress(0, 0) * 12);
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 12,
            },
            (_, i) => (i < count ? 'w' + i : ''),
          ),
        ],
        180,
        430,
        1560,
        110,
        themeColors.blue,
        29,
      );
      drawChapterText(
        ctx,
        api,
        'Four rank-owned slices → one dense consolidation',
        960,
        665,
        35,
        themeColors.cyan,
        'center',
      );
      if (resultComplete(0, 2))
        drawChapterText(
          ctx,
          api,
          '12 × 4 bytes = 48 bytes when the full tensor materializes',
          960,
          815,
          37,
          themeColors.green,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        resultComplete(0, 2)
          ? 'Lazy materialization changes when memory appears · final dense size remains 48 bytes'
          : 'Lazy materialization changes when memory appears · final dense size pending',
      );
    } else {
      const converted = currentBeat > 1 || sentenceProgress(1, 0) > 0;
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 12,
            },
            (_, i) => 'w' + i,
          ),
        ],
        180,
        390,
        1560,
        100,
        themeColors.blue,
        29,
      );
      const group = converted ? 6 : 3;
      for (let i = 0; i < (converted ? 2 : 4); i++) {
        const x = 180 + (i * 1560) / (converted ? 2 : 4);
        api.rect(
          ctx,
          x,
          540,
          1560 / (converted ? 2 : 4) - 12,
          95,
          themeColors.panel,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
          2,
        );
        drawChapterText(
          ctx,
          api,
          'Partition ' + i + ' · ' + group + ' coordinates',
          x + (1560 / (converted ? 2 : 4) - 12) / 2,
          603,
          28,
          themeColors.ink,
          'center',
        );
      }
      drawChapterText(
        ctx,
        api,
        converted
          ? 'Supported topology conversion can repartition compatible named tensors'
          : 'Original four-way partition',
        960,
        760,
        34,
        themeColors.cyan,
        'center',
      );
      if (resultComplete(1, 1))
        drawChapterText(
          ctx,
          api,
          'Supplied changed model: same W name, shape [2,6] → incompatible with [3,4]',
          960,
          850,
          31,
          themeColors.pink,
          'center',
        );
      if (resultComplete(1, 2))
        drawChapterText(
          ctx,
          api,
          'AutoEP partition-native → documented universal tool; dense zero-to-fp32 unsupported',
          960,
          930,
          29,
          themeColors.yellow,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        currentBeat === 2
          ? 'Preserve source identity + recipe + target topology; verify fresh continuation separately'
          : 'Equal element count does not establish compatible named shapes',
        1035,
      );
    }
  }
}
export default {
  id: 'topology-conversion',
  draw: drawTopologyConversion,
  cues: [
    'ds-topology-conversion-b0-s0',
    'ds-topology-conversion-b0-s1',
    'ds-topology-conversion-b0-s2',
    'ds-topology-conversion-b0-s3',
    'ds-topology-conversion-b1-s0',
    'ds-topology-conversion-b1-s1',
    'ds-topology-conversion-b1-s2',
    'ds-topology-conversion-b2-s0',
    'ds-topology-conversion-b2-s1',
    'ds-topology-conversion-b2-s2',
    'ds-topology-conversion-b2-s3',
  ],
};
