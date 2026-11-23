import { digest } from '../arithmetic.mjs';
import { cueProgress, governancePermission } from '../construction.mjs';
import {
  drawGovernanceConstructionBox,
  drawGovernanceConstructionFlight,
  drawGovernanceConstructionFooter,
  drawGovernanceConstructionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress2 = (id) => cueProgress(state, id),
    resultComplete = (id) => governancePermission(state, id);
  return api.focus.target('evaluation-integrity-mechanism', () => {
    {
      if (currentBeat === 0) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Risk 1 / unauthorized promotion',
          180,
          325,
          740,
          themeColors.blue,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Risk 2 / contaminated gate evidence',
          1020,
          325,
          720,
          themeColors.pink,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Private answer / privileged harness',
          160,
          610,
          680,
          themeColors.yellow,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('gold-exposure')
            ? 'Agent-readable gold / score can inflate'
            : 'Agent / training paths',
          1060,
          610,
          700,
          resultComplete('gold-exposure') ? themeColors.pink : themeColors.muted,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [870, 660],
          [1030, 660],
          cueProgress2('gold-exposure'),
          themeColors.pink,
        );
        drawGovernanceConstructionText(
          ctx,
          api,
          'Evaluation + release owner / independent evidence integrity',
          960,
          900,
          34,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        const moved = resultComplete('seen-regression'),
          progress = cueProgress2('seen-regression');
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Private test cases',
          140,
          320,
          700,
          themeColors.blue,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Regression tests',
          1080,
          320,
          700,
          themeColors.yellow,
        );
        const x = api.lerp(420, 1360, progress);
        drawGovernanceConstructionBox(
          ctx,
          api,
          'H1 / Missing signature',
          x - 250,
          565,
          500,
          moved ? themeColors.yellow : themeColors.blue,
          100,
        );
        if (resultComplete('new-private')) {
          drawGovernanceConstructionBox(
            ctx,
            api,
            'H2 / Fresh rollout request',
            170,
            565,
            500,
            themeColors.green,
          );
        } else if (progress > 0) {
          api.arrow(ctx, 850, 700, 1070, 700, themeColors.yellow, 3);
        }
        if (resultComplete('holdout-isolation'))
          drawGovernanceConstructionBox(
            ctx,
            api,
            'Only the evaluator can read the private answer key.',
            420,
            760,
            1080,
            themeColors.blue,
          );
        drawGovernanceConstructionText(
          ctx,
          api,
          moved
            ? 'Replay H1 whenever the gate changes'
            : 'The gate accepted H1 with a signature missing',
          960,
          940,
          29,
          themeColors.yellow,
          'center',
        );
      } else {
        const changed = resultComplete('dataset-binding'),
          original = digest({
            model: 'M1',
            policy: 'G7',
            dataset: 'D2',
          }),
          current = digest({
            model: 'M1',
            policy: 'G7',
            dataset: changed ? 'D3' : 'D2',
          });
        drawGovernanceConstructionBox(
          ctx,
          api,
          'System card / M1 + G7 + tools + gates',
          180,
          350,
          740,
          themeColors.blue,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          changed
            ? 'Dataset D3 / changed labels or version'
            : 'Dataset D2 / split + provenance + labels',
          1020,
          350,
          740,
          changed ? themeColors.yellow : themeColors.green,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [550, 480],
          [830, 650],
          cueProgress2('dataset-binding'),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1390, 480],
          [1090, 650],
          cueProgress2('dataset-binding'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Accepted report binding / ' + original.slice(0, 16),
          370,
          680,
          1180,
          themeColors.blue,
        );
        drawGovernanceConstructionText(
          ctx,
          api,
          changed
            ? 'D3 needs its matching report and accepted deployment evidence'
            : 'Matching configuration / ' + current.slice(0, 16),
          960,
          900,
          31,
          changed ? themeColors.yellow : themeColors.green,
          'center',
        );
      }
      if (currentBeat === 2) {
        drawGovernanceConstructionFooter(
          ctx,
          api,
          'Check a source label, the evaluation run and the retention record.',
        );
      }
    }
    return true;
  });
}

export function drawEvaluationIntegrity(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'evaluation-integrity',
  draw: drawEvaluationIntegrity,
  cues: [
    'gov-evaluation-integrity-b1',
    'gov-measurement-risk',
    'gov-gold-exposure',
    'gov-evaluation-integrity-b2',
    'gov-holdout-isolation',
    'gov-seen-regression',
    'gov-new-private',
    'gov-evaluation-integrity-b3',
    'gov-dataset-binding',
  ],
};
