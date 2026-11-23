import { cueProgress, governancePermission } from '../construction.mjs';
import { triage } from '../model.mjs';
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
  return api.focus.target('legal-scope-mechanism', () => {
    {
      if (currentBeat === 0) {
        api.rect(ctx, 135, 355, 650, 475, themeColors.panel, themeColors.blue, 2, 22);
        api.rect(ctx, 1125, 355, 650, 475, themeColors.panel, themeColors.cyan, 2, 22);
        drawGovernanceConstructionText(
          ctx,
          api,
          'Provider / deployer outside EU',
          460,
          425,
          32,
          themeColors.blue,
          'center',
        );
        drawGovernanceConstructionText(
          ctx,
          api,
          'Union market / EU deployer',
          1450,
          425,
          32,
          themeColors.cyan,
          'center',
        );
        drawGovernanceConstructionBox(ctx, api, 'System output', 260, 555, 400, themeColors.yellow);
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('eu-output') ? 'Output used in the Union' : 'Establish output destination',
          1190,
          555,
          520,
          resultComplete('eu-output') ? themeColors.cyan : themeColors.muted,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [810, 605],
          [1090, 605],
          cueProgress2('eu-output'),
        );
        drawGovernanceConstructionText(
          ctx,
          api,
          'Article 2 / record actual deployment and affected people',
          960,
          920,
          32,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        const nodes = [
          ['Model provider', 140, themeColors.green],
          ['Application provider', 745, themeColors.blue],
          ['Deployer', 1350, themeColors.cyan],
        ];
        nodes.forEach(([name, x, col]) =>
          drawGovernanceConstructionBox(ctx, api, name, x, 390, 430, col, 110),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [590, 445],
          [725, 445],
          cueProgress2('application-role'),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1195, 445],
          [1330, 445],
          cueProgress2('application-role'),
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          ['General-purpose model', 'Separate model duties'],
          165,
          670,
          themeColors.green,
          90,
          31,
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          ['Credit decision system', 'Own name / intended use'],
          770,
          670,
          themeColors.blue,
          90,
          31,
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          ['Uses under its authority', 'Actual facts determine role'],
          1375,
          670,
          themeColors.cyan,
          90,
          29,
        );
      } else {
        const unknown = resultComplete('staff-unknown'),
          flags = unknown ? [false, null, false, false] : [false, true, true, false];
        drawGovernanceConstructionBox(
          ctx,
          api,
          unknown ? 'Unanswered intake' : 'Staff scheduling proposal',
          140,
          350,
          640,
          themeColors.blue,
        );
        const tests = [
          'Unknown facts first',
          'Credit / workers',
          'Interaction / effects',
          'Baseline',
        ];
        tests.forEach((v, i) => {
          const y = 350 + i * 140;
          drawGovernanceConstructionBox(
            ctx,
            api,
            v,
            1100,
            y,
            650,
            i === (unknown ? 0 : 1) ? themeColors.yellow : themeColors.muted,
            86,
          );
        });
        const selected = unknown ? 0 : 1;
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [810, 400],
          [1070, 393 + selected * 140],
          unknown ? cueProgress2('staff-unknown') : cueProgress2('staff-route'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          unknown ? 'Workers: ?' : 'Workers: checked yes',
          140,
          550,
          640,
          unknown ? themeColors.pink : themeColors.cyan,
        );
        if (unknown || resultComplete('staff-route'))
          drawGovernanceConstructionBox(
            ctx,
            api,
            triage(flags),
            140,
            750,
            640,
            unknown ? themeColors.pink : themeColors.green,
          );
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'Article 2 / actor role + use + jurisdiction / dated classification and qualified signoff',
      );
    }
    return true;
  });
}

export function drawLegalScope(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'legal-scope',
  draw: drawLegalScope,
  cues: [
    'gov-legal-scope-b1',
    'gov-eu-output',
    'gov-legal-scope-b2',
    'gov-application-role',
    'gov-legal-scope-b3',
    'gov-staff-route',
    'gov-staff-unknown',
  ],
};
