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
  return api.focus.target('gpai-layer-mechanism', () => {
    {
      drawGovernanceConstructionBox(
        ctx,
        api,
        'Creditworthiness SYSTEM / intended-use assessment remains',
        220,
        260,
        1480,
        themeColors.blue,
        100,
      );
      if (currentBeat === 0) {
        const exception = resultComplete('open-exception') && !resultComplete('systemic-override');
        const duties = [
          'Technical documentation',
          'Downstream information',
          'Copyright policy',
          'Public training-content summary',
        ];
        duties.forEach((v, i) => {
          const x = 170 + (i % 2) * 870,
            y = 455 + Math.floor(i / 2) * 205,
            limited = i < 2 && exception;
          drawGovernanceConstructionBox(
            ctx,
            api,
            v,
            x,
            y,
            700,
            limited ? themeColors.yellow : themeColors.green,
          );
          drawGovernanceConstructionText(
            ctx,
            api,
            limited ? 'Qualifying open-source exception' : 'Duty retained',
            x + 350,
            y + 155,
            29,
            limited ? themeColors.yellow : themeColors.green,
            'center',
          );
        });
        drawGovernanceConstructionText(
          ctx,
          api,
          resultComplete('systemic-override')
            ? 'Systemic risk restores the first two duties'
            : exception
              ? 'Only the first two duties receive this limited exception'
              : 'Article 53 / model-provider layer',
          960,
          940,
          33,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Training compute > 10²⁵ FLOPs',
          140,
          465,
          730,
          themeColors.yellow,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Equivalent capabilities / impact',
          1050,
          465,
          730,
          themeColors.blue,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [505, 595],
          [845, 785],
          cueProgress2('compute-presumption'),
          themeColors.yellow,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1415, 595],
          [1075, 785],
          cueProgress2('commission-route'),
          themeColors.blue,
        );
        if (resultComplete('compute-presumption'))
          drawGovernanceConstructionText(
            ctx,
            api,
            'Presumption / exceptional rebuttal',
            385,
            700,
            28,
            themeColors.yellow,
            'center',
          );
        if (resultComplete('commission-route'))
          drawGovernanceConstructionText(
            ctx,
            api,
            'Commission designation / specified criteria',
            1555,
            700,
            27,
            themeColors.blue,
            'center',
          );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Systemic-risk duties / either applicable route',
          490,
          820,
          940,
          themeColors.pink,
        );
      } else {
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            'Article 55 / evaluation + adversarial testing',
            'Systemic-risk assessment + mitigation',
            'Serious incidents + cybersecurity',
          ],
          240,
          485,
          themeColors.ink,
          115,
          35,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('energy-documentation')
            ? 'Training energy → Article 53 / Annex XI documentation'
            : 'Model documentation informs the integrator',
          260,
          830,
          1400,
          themeColors.yellow,
        );
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'Model duties and system duties coexist / below the compute threshold alone does not establish an exemption',
      );
    }
    return true;
  });
}

export function drawGpaiLayer(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'gpai-layer',
  draw: drawGpaiLayer,
  cues: [
    'gov-gpai-layer-b1',
    'gov-open-exception',
    'gov-systemic-override',
    'gov-gpai-layer-b2',
    'gov-compute-presumption',
    'gov-commission-route',
    'gov-gpai-layer-b3',
    'gov-energy-documentation',
  ],
};
