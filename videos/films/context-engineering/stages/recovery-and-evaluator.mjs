import { boundedContext, contextDone } from '../arithmetic.mjs';
import { contextOperationLedger } from '../recovery.mjs';
import {
  drawCompleteColumns,
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawRecoveryAndEvaluator(ctx, scene, state, api) {
  if (paintRecoveryAndEvaluator(ctx, scene, state, api)) return;
}
function paintRecoveryAndEvaluator(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-recovery-and-evaluator-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Generator and evaluator inspect different owned objects'
        : currentBeat === 1
          ? 'The protected resource enforces keys and fences'
          : 'Retain unconfirmed outcomes and control receipt issuers',
    );
    if (currentBeat === 0) {
      drawCompleteRecord(
        ctx,
        api,
        'cause proposal',
        ['cite checked evidence', 'address alternative causes', 'rollback remains a proposal'],
        150,
        390,
        760,
        themeColors.blue,
        185,
      );
      drawCompleteRecord(
        ctx,
        api,
        'separate evaluation',
        [
          'schema / forbidden actions: deterministic',
          'support: semantic review',
          'citation alone cannot establish causality',
        ],
        1050,
        390,
        690,
        themeColors.cyan,
        185,
      );
      drawCompleteLine(ctx, api, 150, 680, 1740, 680, themeColors.muted, 2);
      drawCompleteText(
        ctx,
        api,
        'Disproven lock explanation is absent from the accepted report',
        150,
        800,
        31,
        themeColors.green,
      );
      drawCompleteText(
        ctx,
        api,
        'Independent evaluator can still make mistakes',
        150,
        940,
        30,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const fenced = resultComplete('ce-fenced-resource', 1),
        events = contextOperationLedger([
          {
            key: 'K17',
            fence: 12,
            confirmed: false,
          },
          {
            key: 'K17',
            fence: 12,
            confirmed: false,
          },
          {
            key: 'K18',
            fence: 11,
            confirmed: false,
          },
        ]);
      drawCompleteColumns(
        ctx,
        api,
        ['request to resource', 'boundary decision', 'effects'],
        events.map((v, i) => [
          v.key + ' / fence' + v.fence,
          i === 2 && !fenced ? 'check pending' : v.status,
          i === 2 && !fenced ? '?' : String(v.effects),
        ]),
        150,
        390,
        [620, 780, 180],
        160,
      );
      drawCompleteText(
        ctx,
        api,
        'Highest accepted fence12 · old worker11 stops at resource',
        150,
        970,
        30,
        themeColors.pink,
      );
    } else {
      drawCompleteRecord(
        ctx,
        api,
        'untrusted appended entry',
        'new “done” record can still be forged',
        150,
        420,
        740,
        themeColors.pink,
        125,
      );
      drawCompleteRecord(
        ctx,
        api,
        'trusted issuer',
        'current evidence + protected execution checks',
        1050,
        420,
        690,
        themeColors.green,
        125,
      );
      drawCompleteText(
        ctx,
        api,
        'Unknown response remains unresolved until external confirmation',
        150,
        760,
        33,
        themeColors.yellow,
      );
      drawCompleteText(
        ctx,
        api,
        'History retention does not authenticate the next writer',
        150,
        950,
        30,
        themeColors.cyan,
      );
    }
    drawCompleteFooter(
      ctx,
      api,
      'Illustrated resource-enforced fixture. No real service, lease or external write is executed.',
    );
  });
  return true;
}
export default {
  id: 'recovery-and-evaluator',
  draw: drawRecoveryAndEvaluator,
  cues: [
    'ce-recovery-and-evaluator-1',
    'ce-recovery-and-evaluator-2',
    'ce-fenced-resource',
    'ce-recovery-and-evaluator-3',
  ],
};
