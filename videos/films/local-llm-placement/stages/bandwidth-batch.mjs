import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawBandwidthBatch(ctx, scene, state, api) {
  api.focus.target('pl-bandwidth-batch-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['bandwidth-batch'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['bandwidth-batch'][beat]
      )
        throw Error('Invalid placement sentence bandwidth-batch/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'bandwidth-batch'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['bandwidth-batch'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        const channels = done(0, 2) ? 8 : 2;
        constructionText(ctx, api, 'Supplied DDR5-5600 channel worksheet', 150, 290, 34, C.cyan);
        for (let i = 0; i < channels; i++) {
          const y = 380 + i * 58;
          constructionCell(ctx, api, 'Channel ' + (i + 1), 160, y, 290, 44, C.blue);
          for (let j = 0; j < 8; j++)
            constructionRectangle(ctx, api, 620 + j * 85, y + 8, 60, 24, C.cyan, true);
        }
        constructionText(ctx, api, '5.6 × 10⁹ transfers/s × 8 bytes/transfer', 150, 900, 32);
        if (done(0, 1))
          constructionText(
            ctx,
            api,
            channels + ' × 5.6 × 8 = ' + (channels * 5.6 * 8).toFixed(1) + ' GB/s',
            1730,
            900,
            33,
            C.green,
            'right',
          );
        constructionNote(ctx, api, 'Peak worksheet; channel population and locality still matter');
      } else {
        constructionText(
          ctx,
          api,
          'Same 5 GB weight read · supplied 80 GB/s',
          150,
          290,
          34,
          C.blue,
        );
        constructionRectangle(ctx, api, 160, 390, 1160, 115, C.blue, true);
        constructionText(ctx, api, '5 GB weights', 740, 460, 35, C.bg, 'center');
        const n = done(1, 2) ? 8 : 1;
        for (let i = 0; i < n; i++) {
          constructionCell(ctx, api, 'S' + (i + 1), 160 + i * 180, 660, 140, 85, C.cyan);
          if (op(1, 2) > 0) constructionLine(ctx, api, 740, 520, 230 + i * 180, 630, C.muted);
        }
        if (done(1, 1))
          constructionText(ctx, api, '80 / 5 = 16 batched steps/s', 150, 835, 36, C.green);
        if (done(1, 2))
          constructionText(ctx, api, '8 × 16 = 128 aggregate tokens/s', 150, 905, 36, C.green);
        constructionNote(
          ctx,
          api,
          'Ideal weight-stream bound · extra arithmetic and KV work omitted',
        );
      }
    }
  });
}
export default {
  id: 'bandwidth-batch',
  draw: drawBandwidthBatch,
  cues: [
    'pl-bandwidth-batch-0-0',
    'pl-bandwidth-batch-0-1',
    'pl-bandwidth-batch-0-2',
    'pl-bandwidth-batch-0-3',
    'pl-bandwidth-batch-0-4',
    'pl-bandwidth-batch-1-0',
    'pl-bandwidth-batch-1-1',
    'pl-bandwidth-batch-1-2',
    'pl-bandwidth-batch-1-3',
    'pl-bandwidth-batch-1-4',
  ],
};
