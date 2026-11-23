import { cueProgress, governancePermission } from '../construction.mjs';
import { appealReplayFixture } from '../model.mjs';
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
  return api.focus.target('appeal-replay-mechanism', () => {
    {
      const original = appealReplayFixture().originalRecord;
      drawGovernanceConstructionBox(
        ctx,
        api,
        'Original C17 / target 10% / policy G7 / evidence E7',
        170,
        285,
        1580,
        themeColors.blue,
      );
      drawGovernanceConstructionBox(
        ctx,
        api,
        'Historical decision / ' + original.outcome,
        170,
        465,
        600,
        themeColors.blue,
      );
      drawGovernanceConstructionRows(
        ctx,
        api,
        [
          'Reason: security receipt missing',
          'Original record remains preserved',
          'Recorded traffic effects: ' + original.effects.length,
        ],
        200,
        660,
        themeColors.ink,
        85,
        30,
      );
      if (currentBeat === 0) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('appeal-record')
            ? 'Independent reviewer / original evidence'
            : 'Open usable challenge reference',
          1020,
          465,
          740,
          themeColors.yellow,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [800, 515],
          [990, 515],
          cueProgress2('appeal-record'),
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            'Proposal + historical configuration',
            'Authoritative approval receipts',
            'Actual effect record',
          ],
          1050,
          675,
          themeColors.yellow,
          80,
          30,
        );
      } else if (currentBeat === 1) {
        const corrected = resultComplete('appeal-correct'),
          upheld = resultComplete('appeal-uphold'),
          fixture = appealReplayFixture({
            receiptActuallyPresent: corrected,
          });
        drawGovernanceConstructionBox(
          ctx,
          api,
          corrected
            ? 'Alternative lookup / valid receipt was present'
            : upheld
              ? 'Lookup complete / receipt absent'
              : 'Replay original policy / lookup receipts',
          1000,
          450,
          780,
          themeColors.yellow,
          120,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [800, 515],
          [970, 515],
          cueProgress2(corrected ? 'appeal-correct' : 'appeal-uphold'),
        );
        if (upheld || corrected)
          drawGovernanceConstructionBox(
            ctx,
            api,
            fixture.replayDecision,
            1000,
            670,
            780,
            corrected ? themeColors.green : themeColors.yellow,
            100,
          );
        if (corrected)
          drawGovernanceConstructionBox(
            ctx,
            api,
            'Append correction + gate defect / effects added 0',
            1000,
            835,
            780,
            themeColors.cyan,
            100,
          );
      } else if (currentBeat === 2) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('appeal-current')
            ? 'Current authoritative receipt / exact binding'
            : 'New approval / validate current packet',
          1000,
          450,
          780,
          themeColors.yellow,
          120,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1390, 600],
          [1390, 680],
          cueProgress2('appeal-executor'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('appeal-executor')
            ? 'Executor revalidates / eligible ≠ executed'
            : 'Executor check pending',
          1000,
          710,
          780,
          themeColors.cyan,
          100,
        );
        if (resultComplete('appeal-uncertain'))
          drawGovernanceConstructionText(
            ctx,
            api,
            'Lost-response branch: UNKNOWN → reconcile before retry',
            1390,
            940,
            27,
            themeColors.pink,
            'center',
          );
      } else if (currentBeat === 3) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Oversight resources / time + evidence + expertise',
          1000,
          450,
          780,
          themeColors.blue,
          120,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1390, 600],
          [1390, 690],
          cueProgress2('oversight-authority'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('oversight-authority')
            ? 'Disagree / override within remit / safe halt'
            : 'Authority must be established',
          1000,
          720,
          780,
          themeColors.yellow,
          120,
        );
      } else {
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            'Annex III / excluding point 2',
            'Legal or similarly significant adverse effects',
            'AI role + main decision elements',
            'Lawful restrictions / other Union-law rights',
          ],
          1020,
          490,
          themeColors.yellow,
          100,
          28,
        );
        if (resultComplete('appeal-legal-scope'))
          drawGovernanceConstructionBox(
            ctx,
            api,
            'Assess Article 86 applicability separately',
            1000,
            865,
            780,
            themeColors.cyan,
            100,
          );
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'A correction appends a new record / approval and appeal do not themselves execute a promotion',
      );
    }
    return true;
  });
}

export function drawAppealReplay(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'appeal-replay',
  draw: drawAppealReplay,
  cues: [
    'gov-appeal-replay-b1',
    'gov-appeal-record',
    'gov-appeal-replay-b2',
    'gov-appeal-uphold',
    'gov-appeal-correct',
    'gov-appeal-replay-b3',
    'gov-appeal-current',
    'gov-appeal-executor',
    'gov-appeal-uncertain',
    'gov-appeal-replay-b4',
    'gov-oversight-authority',
    'gov-appeal-replay-b5',
    'gov-appeal-legal-scope',
  ],
};
