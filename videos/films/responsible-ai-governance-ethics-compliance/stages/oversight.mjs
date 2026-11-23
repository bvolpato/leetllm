import { cueProgress, governancePermission } from '../construction.mjs';
import { appealReplayFixture, oversight, sampleModel } from '../model.mjs';
import { drawReceiptFile, receiptRow } from '../receipt-file.mjs';

export function drawOversight(ctx, scene, state, api) {
  const b = state.beat;
  const initial = sampleModel('oversight', { beat: 0, beatP: 0 });
  const denial = sampleModel('oversight', { beat: 1, beatP: 0 });
  const approved = sampleModel('oversight', { beat: 2, beatP: 0 });
  const original = appealReplayFixture().originalRecord;
  const comparison = b === 3;
  const current = comparison ? original.proposal : initial.proposal;
  const receipts = {};
  if (comparison) Object.assign(receipts, original.receipts);
  else if (b < 2) {
    if (b > 0 || governancePermission(state, 'larger-release'))
      receipts.Release = initial.receipts.Release;
    if (b === 1 && governancePermission(state, 'exception-signed'))
      receipts.Exception = denial.receipts.Exception;
    if (b === 1 && governancePermission(state, 'denied-review'))
      receipts.Security = denial.receipts.Security;
  } else if (governancePermission(state, 'receipts-ready'))
    Object.assign(receipts, approved.receipts);

  const decision = oversight(current, receipts);
  const rows = decision.required
    .filter((role) => role !== 'Exception' || b > 0 || governancePermission(state, 'extra-role'))
    .map((role) => {
      if (b === 2 && !governancePermission(state, 'receipts-ready'))
        return { role, share: null, status: 'Reading new set' };
      return receiptRow(role, receipts[role], current);
    });
  const position =
    b === 0
      ? api.lerp(original.proposal.target, current.target, cueProgress(state, 'larger-target'))
      : current.target;
  let gate = 'Which receipts are missing?';
  if (b === 1 && governancePermission(state, 'oversight-missing')) {
    gate = decision.denied
      ? 'HELD · independent appeal available'
      : 'Awaiting ' +
        decision.required
          .filter((role) => !receipts[role])
          .join(' and ')
          .toLowerCase();
  } else if (b === 2) {
    gate =
      decision.eligible && governancePermission(state, 'executor-eligible')
        ? 'Eligible for executor recheck'
        : 'Check the three decisions';
  } else if (comparison) gate = 'HELD · security receipt missing';

  drawReceiptFile(ctx, api, {
    proposal: current,
    position,
    rows,
    gate,
    requestLabel:
      position === current.target || position === original.proposal.target
        ? position + '% requested'
        : 'Editing target',
    effect: comparison
      ? original.effects.length + ' traffic changes'
      : governancePermission(state, 'oversight-effect')
        ? approved.effects.length + ' traffic changes'
        : 'Record unopened',
    gateColor: decision.denied || comparison ? api.C.yellow : api.C.ink,
    roleNote:
      comparison && cueProgress(state, 'oversight-types') > 0
        ? 'In the loop: decide first     ·     On the loop: intervene     ·     In command: set limits'
        : undefined,
  });
}

export default {
  id: 'oversight',
  draw: drawOversight,
  cues: [
    'gov-larger-target',
    'gov-extra-role',
    'gov-larger-release',
    'gov-oversight-missing',
    'gov-exception-signed',
    'gov-denied-review',
    'gov-new-decisions',
    'gov-receipts-ready',
    'gov-executor-eligible',
    'gov-oversight-effect',
    'gov-oversight-boundary',
    'gov-oversight-types',
  ],
};
