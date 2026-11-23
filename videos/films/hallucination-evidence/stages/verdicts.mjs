import { EVIDENCE, draftClaims, resolvedClaim } from '../fixtures.mjs';
import { verifyClaim } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawVerdicts(ctx, scene, state, api) {
  const { C, left, right, text, heading, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const alternate = cue('status-alternative', 1) > 0;
  const settled = cue('entailed-fields', 0) === 1;
  if (state.beat === 2) {
    heading(left, 'First draft', 'Proposed recovery estimate', C.ink);
    heading(right, 'Alternative draft', 'Proposed incident status', C.ink);
    text(draftClaims[3].value, left, 468, 57);
    text(resolvedClaim.value, right, 468, 57);
    text('Runbook: no estimate field', left, 601, 38, C.blue);
    text('Runbook: ' + EVIDENCE.facts.status, right, 601, 38, C.blue);
    text('Unsupported', left, 757, 48, C.yellow);
    text('Contradicted', right, 757, 48, C.pink);
    footer('Ask for the missing estimate. Investigate the conflicting status.');
    return;
  }
  heading(left, 'From the draft', 'INC-48291   /   May 27, 10:00 UTC', C.ink);
  heading(right, 'Check against the runbook', 'One verdict for each claim', C.blue);
  for (const [i, c] of draftClaims.slice(0, 3).entries()) {
    const y = 436 + i * 91;
    text(c.value, left, y, 40);
    text(EVIDENCE.facts[c.field], right, y, 36);
    if (settled) text(verifyClaim(c).verdict, 1615, y, 26, C.green);
  }
  const fourth = alternate ? resolvedClaim : draftClaims[3];
  const fourthReady = alternate ? cue('contradicted-status', 1) === 1 : cue('absent-eta', 1) === 1;
  text(alternate ? 'Alternative fourth claim' : 'Fourth claim', left, 695, 28, C.muted);
  text(alternate ? 'Status: ' + fourth.value : 'Recovery by ' + fourth.value, left, 762, 46);
  text(alternate ? 'Recorded status' : 'Recovery estimate', right, 695, 28, C.muted);
  text(EVIDENCE.facts[fourth.field] ?? 'No field', right, 762, 46);
  if (fourthReady) {
    footer(
      alternate
        ? 'Contradicted: the draft and the runbook give incompatible statuses.'
        : 'Unsupported: the record leaves this estimate open.',
      alternate ? C.pink : C.yellow,
    );
  } else footer('What does this record establish about the fourth claim?');
}

export default {
  id: 'verdicts',
  draw: drawVerdicts,
  cues: [
    'entailed-fields',
    'absent-eta',
    'status-alternative',
    'contradicted-status',
    'unknown-truth',
  ],
};
