import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionText,
} from '../defaults.mjs';
export function drawInventoryEvidence(ctx, scene, state, api) {
  api.focus.target('pl-inventory-evidence-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['inventory-evidence'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['inventory-evidence'][beat]
      )
        throw Error('Invalid placement sentence inventory-evidence/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'inventory-evidence'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['inventory-evidence'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(
          ctx,
          api,
          'Different records answer different questions',
          150,
          285,
          33,
          C.cyan,
        );
        const rows = [
          ['Inventory tags', 'Model artifact listed'],
          ['Running-model receipt', 'Digest · reported size · VRAM · context'],
          ['Inference request', 'Actual response or failure'],
        ];
        rows.forEach(([name, v], i) => {
          const y = 390 + i * 175;
          constructionCell(ctx, api, name, 150, y, 490, 100, i === 2 ? C.yellow : C.blue);
          constructionText(ctx, api, v, 760, y + 60, 30, i === 2 ? C.yellow : C.cyan);
        });
        constructionNote(
          ctx,
          api,
          'Inspection and request recipes were not executed as model runs here',
        );
      } else {
        constructionText(
          ctx,
          api,
          'Mutable tag → changed bytes on a later pull',
          150,
          285,
          33,
          C.pink,
        );
        constructionCell(ctx, api, 'assistant:latest', 150, 420, 470, 90, C.yellow);
        constructionCell(ctx, api, 'Artifact A', 780, 385, 420, 90, C.blue);
        constructionCell(ctx, api, 'Artifact B', 1330, 530, 420, 90, C.pink);
        if (op(1, 2) > 0) constructionLine(ctx, api, 620, 465, 1310, 575, C.pink);
        if (done(1, 0)) {
          constructionText(
            ctx,
            api,
            'Bind container digest + local model manifest',
            150,
            750,
            32,
            C.green,
          );
          constructionText(
            ctx,
            api,
            'Tokenizer · template · runtime · backend · options',
            150,
            830,
            32,
            C.cyan,
          );
        }
        constructionNote(
          ctx,
          api,
          'Restart is not pull; model managers have their own identity syntax',
        );
      }
    }
  });
}
export default {
  id: 'inventory-evidence',
  draw: drawInventoryEvidence,
  cues: [
    'pl-inventory-evidence-0-0',
    'pl-inventory-evidence-0-1',
    'pl-inventory-evidence-0-2',
    'pl-inventory-evidence-0-3',
    'pl-inventory-evidence-1-0',
    'pl-inventory-evidence-1-1',
    'pl-inventory-evidence-1-2',
    'pl-inventory-evidence-1-3',
  ],
};
