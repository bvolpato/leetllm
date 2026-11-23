import { cueProgress, governancePermission } from '../construction.mjs';
import { classificationFixture, productCase } from '../model.mjs';
import {
  drawGovernanceConstructionBadge,
  drawGovernanceConstructionBox,
  drawGovernanceConstructionFlight,
  drawGovernanceConstructionFooter,
  drawGovernanceConstructionRows,
  drawGovernanceConstructionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress2 = (id) => cueProgress(state, id),
    resultComplete = (id) => governancePermission(state, id);
  return api.focus.target('high-risk-branches-mechanism', () => {
    {
      if (currentBeat === 0) {
        const v = productCase(state);
        drawGovernanceConstructionBox(ctx, api, v.caseName, 270, 280, 1380, themeColors.blue);
        drawGovernanceConstructionBadge(
          ctx,
          api,
          'Annex I safety input',
          v.established && v.convenience ? v.facts.safety : null,
          180,
          520,
        );
        drawGovernanceConstructionBadge(
          ctx,
          api,
          'Relevant health / safety assessment',
          v.established ? v.facts.thirdPartyHealthSafety : null,
          1090,
          520,
        );
        drawGovernanceConstructionText(ctx, api, 'AND', 960, 575, 38, themeColors.yellow, 'center');
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [505, 640],
          [960, 780],
          cueProgress2(
            v.unrelated ? 'unrelated-assessment' : v.safety ? 'safety-failure' : 'convenience',
          ),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1415, 640],
          [960, 780],
          cueProgress2(
            v.unrelated ? 'unrelated-assessment' : v.safety ? 'safety-failure' : 'convenience',
          ),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          v.result
            ? v.result.productRoute
              ? 'Both satisfied / product high-risk route'
              : 'Product route not established by these inputs'
            : 'Establish both inputs',
          370,
          805,
          1180,
          v.result?.productRoute ? themeColors.pink : themeColors.yellow,
        );
      } else if (currentBeat === 1) {
        const fraud = resultComplete('credit-comparison');
        drawGovernanceConstructionBox(
          ctx,
          api,
          fraud ? 'Transaction-fraud detector' : "Applicant's creditworthiness decision",
          220,
          360,
          1480,
          themeColors.blue,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [960, 490],
          [960, 620],
          cueProgress2('credit-comparison'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          fraud && resultComplete('credit-fraud')
            ? 'Excluded from this creditworthiness entry'
            : 'Annex III listed creditworthiness use',
          360,
          665,
          1200,
          fraud ? themeColors.yellow : themeColors.pink,
        );
        drawGovernanceConstructionText(
          ctx,
          api,
          'Model swap leaves the intended decision use intact',
          960,
          905,
          34,
          themeColors.cyan,
          'center',
        );
      } else if (currentBeat === 2) {
        const profiling = resultComplete('profiling-override'),
          established = resultComplete('narrow-exception');
        const f = classificationFixture({
          annexIII: true,
          noSignificantRisk: true,
          exceptionCondition: true,
          profiling,
        });
        drawGovernanceConstructionText(
          ctx,
          api,
          'Illustrative exception check / assume a narrow procedural task',
          960,
          285,
          32,
          themeColors.blue,
          'center',
        );
        drawGovernanceConstructionBadge(
          ctx,
          api,
          'No significant risk / influence',
          established ? true : null,
          180,
          350,
        );
        drawGovernanceConstructionBadge(
          ctx,
          api,
          'At least one specified condition',
          established ? true : null,
          1090,
          350,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          profiling ? 'Natural-person profiling: yes' : 'Natural-person profiling: no',
          530,
          565,
          860,
          profiling ? themeColors.pink : themeColors.cyan,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [960, 680],
          [960, 770],
          cueProgress2('profiling-override'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          established
            ? f.highRisk
              ? 'Profiling override / HIGH RISK'
              : 'Document + register exception assessment'
            : 'Evaluate complete exception conditions',
          360,
          800,
          1200,
          profiling ? themeColors.pink : themeColors.yellow,
        );
      } else {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Covered high-risk system / responsible actor',
          340,
          300,
          1240,
          themeColors.blue,
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            'Risk + data governance',
            'Documentation + logging',
            'Transparency + human oversight',
            'Accuracy + robustness + cybersecurity',
          ],
          230,
          545,
          themeColors.ink,
          90,
          33,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('sector-route')
            ? 'Annex I Section B / sector integration'
            : 'Check applicable sector route',
          1090,
          550,
          640,
          themeColors.yellow,
          210,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [960, 415],
          [1410, 520],
          cueProgress2('sector-route'),
        );
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'An engineering route is not legal signoff / preserve both product inputs and every listed-use exception condition',
      );
    }
    return true;
  });
}

export function drawHighRiskBranches(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'high-risk-branches',
  draw: drawHighRiskBranches,
  cues: [
    'gov-high-risk-branches-b1',
    'gov-product-inputs',
    'gov-convenience',
    'gov-safety-failure',
    'gov-unrelated-assessment',
    'gov-high-risk-branches-b2',
    'gov-credit-fraud',
    'gov-credit-comparison',
    'gov-high-risk-branches-b3',
    'gov-narrow-exception',
    'gov-profiling-override',
    'gov-high-risk-branches-b4',
    'gov-sector-route',
  ],
};
