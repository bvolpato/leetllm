import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawRunnerContract(ctx, scene, state, api) {
  api.focus.target('pl-runner-contract-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['runner-contract'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['runner-contract'][beat]
      )
        throw Error('Invalid placement sentence runner-contract/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'runner-contract'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['runner-contract'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(
          ctx,
          api,
          'GGUF retains tensor names, shapes, types and metadata',
          150,
          285,
          32,
          C.blue,
        );
        const names = ['block.0.q', 'block.0.k', 'block.0.v', 'tokenizer'];
        names.forEach((n, i) => {
          const y = 385 + i * 115;
          constructionCell(ctx, api, n, 150, y, 420, 75, i === 3 ? C.yellow : C.blue);
          for (let j = 0; j < 8; j++)
            constructionRectangle(
              ctx,
              api,
              700 + j * 115,
              y + 12,
              85,
              45,
              i === 3 ? C.yellow : C.cyan,
              true,
            );
        });
        constructionNote(
          ctx,
          api,
          'Mapped files still need resident pages and compatible execution backends',
        );
      } else if (b === 1) {
        constructionText(ctx, api, 'Pinned accepted cache types', 150, 290, 34, C.cyan);
        ['f16', 'bf16', 'q8_0', 'q4_0'].forEach((v, i) => {
          constructionCell(ctx, api, v, 150 + i * 400, 430, 340, 110, C.cyan);
          if (done(1, 2))
            constructionText(ctx, api, 'KV', 320 + i * 400, 630, 32, C.green, 'center');
        });
        if (done(1, 1)) {
          constructionCell(ctx, api, 'Generic FP8', 590, 780, 650, 90, C.pink);
          constructionText(
            ctx,
            api,
            'not in the pinned accepted list',
            915,
            930,
            29,
            C.pink,
            'center',
          );
        }
        constructionNote(
          ctx,
          api,
          'Weight dtype, cache dtype and executed instructions are separate choices',
        );
      } else {
        constructionText(ctx, api, 'Modelfile configuration', 150, 300, 34, C.yellow);
        constructionCell(ctx, api, 'FROM verified artifact', 150, 390, 650, 90, C.blue);
        constructionCell(ctx, api, 'TEMPLATE / PARAMETERS', 150, 530, 650, 90, C.yellow);
        constructionText(ctx, api, 'Ollama HTTP server', 1040, 390, 34, C.cyan);
        constructionCell(ctx, api, 'Endpoint + supported fields', 1040, 470, 680, 90, C.cyan);
        if (done(2, 3)) {
          constructionText(
            ctx,
            api,
            'Placeholder key: no local authentication',
            1040,
            680,
            30,
            C.pink,
          );
          constructionText(
            ctx,
            api,
            'Gateway must authenticate the caller',
            1040,
            750,
            30,
            C.green,
          );
        }
        constructionNote(
          ctx,
          api,
          'MLX array framework and MLX-LM model tools have distinct responsibilities',
        );
      }
    }
  });
}
export default {
  id: 'runner-contract',
  draw: drawRunnerContract,
  cues: [
    'pl-runner-contract-0-0',
    'pl-runner-contract-0-1',
    'pl-runner-contract-0-2',
    'pl-runner-contract-1-0',
    'pl-runner-contract-1-1',
    'pl-runner-contract-1-2',
    'pl-runner-contract-1-3',
    'pl-runner-contract-2-0',
    'pl-runner-contract-2-1',
    'pl-runner-contract-2-2',
    'pl-runner-contract-2-3',
    'pl-runner-contract-2-4',
  ],
};
