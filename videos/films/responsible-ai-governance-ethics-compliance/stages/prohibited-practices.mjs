import { cueProgress, governancePermission } from '../construction.mjs';
import {
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
  return api.focus.target('prohibited-practices-mechanism', () => {
    {
      if (currentBeat === 0) {
        const score = resultComplete('score-alone');
        drawGovernanceConstructionBox(
          ctx,
          api,
          score ? 'A score alone' : 'Specified practice / affected person',
          490,
          285,
          940,
          themeColors.blue,
        );
        const labels = ['Specified technique', 'Material distortion', 'Significant harm'];
        labels.forEach((v, i) => {
          drawGovernanceConstructionBox(
            ctx,
            api,
            score ? `${v}: unestablished` : v,
            150 + i * 585,
            510,
            450,
            score ? themeColors.muted : themeColors.yellow,
            110,
          );
          if (i < 2)
            drawGovernanceConstructionText(
              ctx,
              api,
              'AND',
              640 + i * 585,
              575,
              29,
              themeColors.cyan,
              'center',
            );
        });
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [960, 405],
          [960, 480],
          cueProgress2(score ? 'score-alone' : 'prohibition-conditions'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          score ? 'Score alone does not satisfy this test' : 'STOP if the legal conditions are met',
          440,
          775,
          1040,
          score ? themeColors.yellow : themeColors.pink,
        );
      } else if (currentBeat === 1) {
        const cases = [
          ['Untargeted face scraping', 'Recognition database / specified practice'],
          [
            'Criminal-risk profiling',
            resultComplete('objective-facts')
              ? 'Human assessment + objective linked facts: distinct condition'
              : 'Sole profiling / personality condition',
          ],
          [
            'Work / education emotion inference',
            resultComplete('medical-exception')
              ? 'Medical / safety exception must be assessed'
              : 'Check purpose and applicable condition',
          ],
        ];
        cases.forEach(([a, z], i) => {
          const y = 350 + i * 200;
          drawGovernanceConstructionBox(ctx, api, a, 140, y, 650, themeColors.blue, 100);
          drawGovernanceConstructionFlight(
            ctx,
            api,
            [820, y + 50],
            [950, y + 50],
            cueProgress2(i === 1 ? 'objective-facts' : 'medical-exception'),
          );
          drawGovernanceConstructionBox(
            ctx,
            api,
            z,
            980,
            y,
            800,
            i === 2 && resultComplete('medical-exception') ? themeColors.yellow : themeColors.cyan,
            100,
          );
        });
      } else if (currentBeat === 2) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Real-time public-space identification / law enforcement',
          300,
          285,
          1320,
          themeColors.blue,
        );
        const labels = [
          'Necessary specified objective',
          'Permitted scope',
          'Applicable authorization',
        ];
        labels.forEach((v, i) => {
          drawGovernanceConstructionBox(
            ctx,
            api,
            v,
            180 + i * 570,
            540,
            430,
            resultComplete('biometric-scope') ? themeColors.yellow : themeColors.muted,
            110,
          );
          if (i < 2)
            drawGovernanceConstructionFlight(
              ctx,
              api,
              [640 + i * 570, 595],
              [720 + i * 570, 595],
              cueProgress2('biometric-scope'),
            );
        });
        if (resultComplete('biometric-objective'))
          drawGovernanceConstructionRows(
            ctx,
            api,
            ['Targeted victims / missing people', 'Specified threats / serious-offence suspects'],
            440,
            800,
            themeColors.cyan,
            70,
            32,
          );
      } else {
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('dated-prohibition')
            ? 'Applies 2026-12-02'
            : 'Dated amendment / establish application date',
          490,
          275,
          940,
          themeColors.yellow,
        );
        const labels = [
          'Intended generation',
          'Foreseeable + reproducible / safeguards',
          "Deployer's actual use purpose",
        ];
        labels.forEach((v, i) => {
          const y = 455 + i * 150;
          drawGovernanceConstructionBox(ctx, api, v, 190, y, 940, themeColors.blue, 100);
          drawGovernanceConstructionFlight(
            ctx,
            api,
            [1160, y + 50],
            [1270, y + 50],
            cueProgress2(i === 2 ? 'use-purpose' : 'generation-conditions'),
          );
          drawGovernanceConstructionBox(
            ctx,
            api,
            i === 2 ? 'Use restriction' : 'Market / service restriction',
            1300,
            y,
            440,
            themeColors.cyan,
            100,
          );
        });
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'Read Article 5 conditions, definitions and exceptions / a signed risk memo cannot authorize a prohibited practice',
      );
    }
    return true;
  });
}

export function drawProhibitedPractices(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'prohibited-practices',
  draw: drawProhibitedPractices,
  cues: [
    'gov-prohibited-practices-b1',
    'gov-prohibition-conditions',
    'gov-score-alone',
    'gov-prohibited-practices-b2',
    'gov-objective-facts',
    'gov-medical-exception',
    'gov-prohibited-practices-b3',
    'gov-biometric-objective',
    'gov-biometric-scope',
    'gov-prohibited-practices-b4',
    'gov-dated-prohibition',
    'gov-generation-conditions',
    'gov-use-purpose',
  ],
};
