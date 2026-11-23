import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionBar,
  constructionCell,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawWeightPayload(ctx, scene, state, api) {
  api.focus.target('pl-weight-payload-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['weight-payload'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['weight-payload'][beat]
      )
        throw Error('Invalid placement sentence weight-payload/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'weight-payload'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['weight-payload'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      constructionText(
        ctx,
        api,
        'Ideal dense codes and artifact size · decimal GB',
        150,
        285,
        34,
        C.cyan,
      );
      if (b === 0) {
        constructionText(ctx, api, 'N weights × b bits / 8', 150, 390, 44, C.blue);
        for (let i = 0; i < 16; i++) {
          const zero = done(0, 2);
          constructionCell(
            ctx,
            api,
            zero ? '0000' : '1010',
            160 + (i % 8) * 185,
            490 + Math.floor(i / 8) * 120,
            150,
            70,
            C.blue,
          );
        }
        constructionText(
          ctx,
          api,
          'Dense storage retains every code position',
          150,
          820,
          33,
          C.yellow,
        );
        constructionNote(ctx, api, 'Scales, metadata and higher-precision tensors add bytes');
      } else {
        constructionBar(ctx, api, 'Uniform 16-bit codes', 23.9, 25, 410, C.blue, done(1, 0));
        constructionBar(ctx, api, 'Uniform 4-bit codes', 5.975, 25, 540, C.cyan, done(1, 0));
        if (done(1, 1)) {
          constructionText(ctx, api, 'Listed native artifact', 150, 690, 29);
          constructionRectangle(ctx, api, 630, 660, (8 / 25) * 900, 70, C.blue, true);
          constructionText(ctx, api, '8 GB total', 774, 705, 31, C.bg, 'center');
          constructionText(
            ctx,
            api,
            'Mixed target · BF16 projector · 423M-parameter draft',
            150,
            800,
            30,
            C.yellow,
          );
        }
        if (done(1, 3))
          constructionCell(
            ctx,
            api,
            'Worksheet weight estimate   ·   7.6 GB',
            630,
            865,
            900,
            70,
            C.blue,
          );
        constructionNote(ctx, api, 'Measure the loaded tensors in each memory pool.');
      }
    }
  });
}
export default {
  id: 'weight-payload',
  draw: drawWeightPayload,
  cues: [
    'pl-weight-payload-0-0',
    'pl-weight-payload-0-1',
    'pl-weight-payload-0-2',
    'pl-weight-payload-1-0',
    'pl-weight-payload-1-1',
    'pl-weight-payload-1-2',
    'pl-weight-payload-1-3',
  ],
};
