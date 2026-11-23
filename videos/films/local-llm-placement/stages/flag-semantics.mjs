import { sentenceCounts } from '../fixtures.mjs';
import { layerFlag } from '../model.mjs';
import { constructionCell, constructionNote, constructionText } from '../defaults.mjs';
export function drawFlagSemantics(ctx, scene, state, api) {
  api.focus.target('pl-flag-semantics-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['flag-semantics'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['flag-semantics'][beat]
      )
        throw Error('Invalid placement sentence flag-semantics/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'flag-semantics'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['flag-semantics'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(ctx, api, '32 equal blocks   /   0.3 GB each', 150, 290, 40);
        constructionText(
          ctx,
          api,
          '8 GB budget − 3.2 GB fixed = 4.8 GB for blocks',
          150,
          435,
          39,
          C.cyan,
        );
        for (let i = 0; i < 32; i++) {
          const col = i < 16 ? C.yellow : C.cyan;
          constructionCell(
            ctx,
            api,
            String(i + 1),
            150 + (i % 16) * 100,
            528 + Math.floor(i / 16) * 105,
            81,
            72,
            col,
          );
        }
        constructionText(ctx, api, '4.8 GB ÷ 0.3 GB = 16 GPU blocks', 150, 844, 40, C.cyan);
        constructionNote(ctx, api, 'Fixed use includes the output head at its intended placement.');
        return;
      }
      const flag = layerFlag(40, 24);
      constructionText(
        ctx,
        api,
        'Pinned llama.cpp 709fe755 · 40 hidden blocks · -ngl 24',
        150,
        280,
        32,
        C.cyan,
      );
      const show = done(1, 1);
      for (let i = 0; i < 40; i++) {
        const row = flag.hidden[i],
          col = show ? (row.gpu ? C.cyan : C.yellow) : C.muted;
        constructionCell(
          ctx,
          api,
          'B' + i,
          150 + (i % 10) * 155,
          380 + Math.floor(i / 10) * 85,
          125,
          60,
          col,
        );
      }
      constructionCell(ctx, api, 'Input', 150, 790, 270, 75, C.yellow);
      constructionCell(ctx, api, 'Output slot', 1390, 790, 340, 75, show ? C.cyan : C.muted);
      if (show)
        constructionText(
          ctx,
          api,
          '23 hidden blocks + 1 output slot = 24 GPU-layer slots',
          150,
          940,
          34,
          C.green,
        );
      constructionNote(
        ctx,
        api,
        'Input remains CPU · overrides and unequal sizes require actual logs',
      );
    }
  });
}
export default {
  id: 'flag-semantics',
  draw: drawFlagSemantics,
  cues: [
    'pl-flag-semantics-0-0',
    'pl-flag-semantics-0-1',
    'pl-flag-semantics-0-2',
    'pl-flag-semantics-1-0',
    'pl-flag-semantics-1-1',
    'pl-flag-semantics-1-2',
    'pl-flag-semantics-1-3',
  ],
};
