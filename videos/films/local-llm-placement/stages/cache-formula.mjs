import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawCacheFormula(ctx, scene, state, api) {
  api.focus.target('pl-cache-formula-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['cache-formula'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['cache-formula'][beat]
      )
        throw Error('Invalid placement sentence cache-formula/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'cache-formula'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['cache-formula'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        const factors = [
          ['K + V', 2],
          ['Layers', 'L'],
          ['KV heads', 'H'],
          ['Head width', 'D'],
          ['Tokens', 'T'],
          ['Sequences', 'S'],
          ['Bytes', 'B'],
        ];
        constructionText(
          ctx,
          api,
          'Multiply independent retained-array axes',
          150,
          290,
          34,
          C.cyan,
        );
        factors.forEach(([name, v], i) => {
          constructionCell(ctx, api, v, 150 + i * 235, 420, 185, 100, i < 2 ? C.blue : C.cyan);
          constructionText(ctx, api, name, 242 + i * 235, 595, 27, C.muted, 'center');
          if (i < 6) constructionText(ctx, api, '×', 355 + i * 235, 487, 35);
        });
        if (done(0, 0))
          constructionText(ctx, api, 'Bytes = 2 × L × H × D × T × S × B', 150, 760, 41, C.green);
        constructionNote(
          ctx,
          api,
          'Sum layer types separately; allocation overhead remains additional',
        );
      } else if (b === 1) {
        constructionText(ctx, api, 'Supplied homogeneous configuration', 150, 290, 34, C.cyan);
        constructionText(ctx, api, '2 × 32 × 8 × 128 × 2', 150, 420, 42, C.blue);
        if (done(1, 0))
          constructionText(
            ctx,
            api,
            '= 131,072 bytes/token = 128 KiB/token',
            150,
            510,
            40,
            C.green,
          );
        if (done(1, 1)) {
          constructionText(
            ctx,
            api,
            '1 KiB = 1,024 bytes · 1 GiB = 1,024³ bytes',
            150,
            760,
            32,
            C.muted,
          );
        }
        if (done(1, 2)) {
          constructionText(ctx, api, '128 KiB × 4,096 = 0.5 GiB', 150, 870, 35, C.green);
          constructionText(ctx, api, '128 KiB × 32,768 × 4 = 16 GiB', 930, 870, 35, C.green);
        }
      } else {
        constructionText(ctx, api, 'Same tokens, different retained shapes', 150, 285, 34, C.cyan);
        for (let i = 0; i < 48; i++) {
          const local = i < 40;
          constructionRectangle(
            ctx,
            api,
            160 + (i % 12) * 105,
            365 + Math.floor(i / 12) * 75,
            75,
            45,
            local ? C.cyan : C.green,
            true,
          );
        }
        constructionText(
          ctx,
          api,
          '40 sliding · 8 heads × 256 · window 1,024',
          150,
          740,
          34,
          C.cyan,
        );
        constructionText(ctx, api, '8 full · 1 head × 512 · whole history', 150, 810, 34, C.green);
        if (done(2, 2)) {
          constructionCell(ctx, api, 'Shared projection', 1040, 710, 660, 75, C.blue);
          constructionCell(
            ctx,
            api,
            'Separate transformed K / V states',
            1040,
            825,
            660,
            75,
            C.yellow,
          );
        }
        constructionNote(
          ctx,
          api,
          'Projection identity alone cannot collapse separately stored states',
        );
      }
    }
  });
}
export default {
  id: 'cache-formula',
  draw: drawCacheFormula,
  cues: [
    'pl-cache-formula-0-0',
    'pl-cache-formula-0-1',
    'pl-cache-formula-0-2',
    'pl-cache-formula-0-3',
    'pl-cache-formula-0-4',
    'pl-cache-formula-1-0',
    'pl-cache-formula-1-1',
    'pl-cache-formula-1-2',
    'pl-cache-formula-2-0',
    'pl-cache-formula-2-1',
    'pl-cache-formula-2-2',
    'pl-cache-formula-2-3',
    'pl-cache-formula-2-4',
  ],
};
