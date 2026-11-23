import { observationCue } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawAttributeContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'attribute-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Local synthetic platform · no actual vendor call');
      withTarget(ctx, api, 'standard-fields', () => {
        drawTable(
          ctx,
          api,
          ['GenAI attribute suffix', 'Value / requirement'],
          [
            ['operation.name', 'chat · required'],
            ['provider.name', 'local-platform · custom provider'],
            [
              'request.model',
              progress(0, 2) > 0 ? 'model-A · when available' : 'awaiting model identity',
            ],
          ],
          140,
          350,
          [720, 900],
          135,
        );
        if (resultComplete(0, 4))
          drawChapterText(
            ctx,
            api,
            'Deployed values must identify the actual provider and model',
            140,
            965,
            31,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Product outcome stays beside model-span attributes');
      withTarget(ctx, api, 'product-fields', () => {
        drawTable(
          ctx,
          api,
          ['Product field', 'Request 205'],
          [
            ['route / delivery', 'serve / substantive'],
            ['first failure / escape', 'generation / serving gate'],
            ['review status', 'independently reviewed unsafe'],
          ],
          140,
          335,
          [720, 900],
          115,
        );
        drawChapterCard(
          ctx,
          api,
          'Host registry lookup',
          resultComplete(1, 3) ? 'prompt UNKNOWN → rejected' : 'deploy-answerer-v1.1 → version1.1',
          140,
          810,
          1620,
          resultComplete(1, 3) ? themeColors.pink : themeColors.cyan,
          120,
        );
      });
    } else {
      drawHeading(ctx, api, 'Content capture and metric dimensions have distinct contracts');
      withTarget(ctx, api, 'content-and-cardinality', () => {
        drawChapterCard(
          ctx,
          api,
          'Sensitive opt-in content',
          ['messages · instructions', 'tool arguments and results'],
          140,
          350,
          760,
          themeColors.pink,
          175,
        );
        drawChapterCard(
          ctx,
          api,
          'Pending review',
          resultComplete(2, 3) ? 'unsafe attribute: absent' : 'review not yet available',
          1000,
          350,
          760,
          themeColors.yellow,
          175,
        );
        if (progress(2, 4) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Bounded metric dimensions',
            ['route × deployed version', 'one aggregate bucket per pair'],
            140,
            710,
            760,
            themeColors.green,
            180,
          );
          drawChapterCard(
            ctx,
            api,
            'Individual identity',
            ['request205 → trace / exemplar', 'not a metric label per request'],
            1000,
            710,
            760,
            themeColors.blue,
            180,
          );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'attribute-contract',
  draw: drawAttributeContract,
  cues: [
    'ob-attribute-contract-1-1',
    'ob-attribute-contract-1-2',
    'ob-attribute-contract-1-3',
    'ob-attribute-contract-1-4',
    'ob-attribute-contract-2-1',
    'ob-attribute-contract-2-2',
    'ob-attribute-contract-2-3',
    'ob-attribute-contract-2-4',
    'ob-attribute-contract-3-1',
    'ob-attribute-contract-3-2',
    'ob-attribute-contract-3-3',
    'ob-attribute-contract-3-4',
  ],
};
