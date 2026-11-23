import { EVIDENCE, draftClaims } from '../fixtures.mjs';
import { verifyClaim } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

const fieldNames = ['Service', 'Last event', 'Event time', 'Recovery estimate'];
export function drawAtomicClaims(ctx, scene, state, api) {
  const { C, left, right, text, heading, link, footer } = incidentSheet(ctx, api);
  const split = phraseProgress(state, api, 'split-claims', 0);
  const align = phraseProgress(state, api, 'three-matches', 1);
  const gap = phraseProgress(state, api, 'missing-field', 2);
  heading(left, 'Runbook fields', 'INC-48291   /   May 27, 10:00 UTC', C.blue);
  heading(right, 'One proposed update', 'Four details a reader could act on', C.ink);
  draftClaims.forEach((claim, i) => {
    const y = 429 + 117 * i;
    const field = EVIDENCE.facts[claim.field];
    const claimY = api.lerp(462 + i * 66, y, split);
    if (field) text(field, left, y, 39);
    else if (gap > 0) text('No recovery estimate recorded', left, y, 38, C.yellow);
    if (split > 0.97) text(fieldNames[i], right, claimY - 40, 26, C.muted);
    text(claim.value, right, claimY, 39);
    if (verifyClaim(claim).verdict === 'supported') {
      link(y - 14, Math.max(0, Math.min(1, align * 3 - i)));
    } else if (gap > 0) {
      api.line(ctx, 980, y - 14, 1002, y - 14, C.yellow, 4);
      api.line(ctx, 980, y - 26, 980, y - 2, C.yellow, 4);
    }
  });
  if (gap === 1) footer('Three matches tell us nothing about the fourth claim.');
  else if (align === 1) footer('Three claims match their own fields.', C.green);
  else footer('What would you need to check separately?');
}

export default {
  id: 'atomic-claims',
  draw: drawAtomicClaims,
  cues: ['split-claims', 'three-matches', 'missing-field'],
};
