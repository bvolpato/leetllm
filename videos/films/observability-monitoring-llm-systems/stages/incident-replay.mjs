import { observationCue } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawIncidentReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'incident-replay', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Incident record  /  deploy-grounding-slo-v1');
      withTarget(ctx, api, 'incident-card', () => {
        drawTable(
          ctx,
          api,
          ['Retained field', 'Observed evidence'],
          [
            ['request / source', '205 / deploy-policy@v17'],
            ['template', 'deploy-answerer-v1.1-regression'],
            ['first defect', progress(0, 3) > 0 ? 'generation' : 'pending inspection'],
            ['containment escape', progress(0, 4) > 0 ? 'serving gate' : 'pending inspection'],
          ],
          140,
          345,
          [720, 900],
          115,
        );
        if (resultComplete(0, 5))
          drawChapterText(
            ctx,
            api,
            'First check: compare the template and gate with the strict path.',
            140,
            985,
            30,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      const replay = progress(1, 4) > 0;
      drawHeading(
        ctx,
        api,
        replay
          ? 'Proposed replay  /  change only the prompt'
          : 'Observed requests with defective drafts',
      );
      withTarget(ctx, api, 'controlled-comparison', () => {
        if (replay) {
          drawTable(
            ctx,
            api,
            ['Artifact', 'Trial A', 'Trial B'],
            [
              ['Prompt', 'strict v1', 'v1.1 regression'],
              ['Request / source', '205 / policy v17', '205 / policy v17'],
              ['Model, gate, evaluator', 'fixed versions', 'same versions'],
              ['Delivered outcome', 'awaiting replay', 'awaiting replay'],
            ],
            140,
            350,
            [560, 530, 530],
            115,
          );
          return;
        }
        drawTable(
          ctx,
          api,
          ['Bad draft', 'Template', 'Delivery'],
          [
            ['202 / 203', 'strict template', 'withheld'],
            ['205 / 206', 'regressed template', 'unsupported serve'],
          ],
          140,
          350,
          [470, 600, 550],
          140,
        );
        if (progress(1, 3) > 0)
          drawChapterCard(
            ctx,
            api,
            'Other possible differences',
            'gate configuration · model image · policy',
            140,
            730,
            1620,
            themeColors.yellow,
            115,
          );
      });
    } else {
      drawHeading(ctx, api, 'Example rollback  /  worker readback');
      withTarget(ctx, api, 'verified-mitigation', () => {
        drawChapterCard(
          ctx,
          api,
          'Requested rollback',
          'strict template v1',
          140,
          375,
          760,
          themeColors.yellow,
          150,
        );
        drawChapterCard(
          ctx,
          api,
          'Worker loaded state',
          progress(2, 2) > 0 ? 'v1.1 still loaded' : 'Awaiting version check',
          1000,
          375,
          760,
          themeColors.pink,
          150,
        );
        if (resultComplete(2, 2))
          drawChapterText(
            ctx,
            api,
            'Check the loaded version and inspect fresh deliveries.',
            140,
            670,
            34,
            themeColors.pink,
          );
        if (progress(2, 3) > 0)
          drawChapterCard(
            ctx,
            api,
            'Reproduction input',
            'authorized retained source or explicit unavailable input',
            140,
            790,
            1620,
            themeColors.blue,
            125,
          );
        if (resultComplete(2, 4))
          drawChapterText(
            ctx,
            api,
            'Handoff: release + exemplar + source + candidate + evaluator',
            140,
            985,
            30,
            themeColors.cyan,
          );
      });
    }
    return true;
  }
}
export default {
  id: 'incident-replay',
  draw: drawIncidentReplay,
  cues: [
    'ob-incident-replay-1-1',
    'ob-incident-replay-1-2',
    'ob-incident-replay-1-3',
    'ob-incident-replay-1-4',
    'ob-incident-replay-1-5',
    'ob-incident-replay-2-1',
    'ob-incident-replay-2-2',
    'ob-incident-replay-2-3',
    'ob-incident-replay-2-4',
    'ob-incident-replay-2-5',
    'ob-incident-replay-3-1',
    'ob-incident-replay-3-2',
    'ob-incident-replay-3-3',
    'ob-incident-replay-3-4',
  ],
};
