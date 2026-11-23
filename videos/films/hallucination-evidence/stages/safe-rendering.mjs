import { draftClaims, EVIDENCE, resolvedClaim } from '../fixtures.mjs';
import { renderIncident } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawSafeRendering(ctx, scene, state, api) {
  const { C, left, right, text, heading, link, footer } = incidentSheet(ctx, api);
  const sharedClaims = draftClaims.slice(0, 3);
  const progress = (id, beat) => phraseProgress(state, api, id, beat);
  const swapped = progress('replace-fourth', 2) > 0;
  const claims = [...sharedClaims, swapped ? resolvedClaim : draftClaims[3]];
  const checked = renderIncident(claims);
  const sentences = checked.text.split(/(?<=\.) /);
  const copies = progress('copy-values', 1) * sharedClaims.length;
  const showNote = progress('no-estimate', 1) === 1;
  const stopped = progress('withhold-update', 3) === 1;
  heading(left, 'Claim check', 'INC-48291   /   same admitted snapshot', C.blue);
  heading(right, 'Status page response', swapped ? 'Second draft' : 'First draft', C.ink);

  sharedClaims.forEach((c, i) => {
    const y = 414 + i * 105;
    text(c.value, left, y, 40);
    text(checked.verdicts[i], left + 565, y, 26, C.green);
    if (swapped) return;
    const copy = Math.max(0, Math.min(1, copies - i));
    link(y - 8, copy);
    if (copy === 1) text(sentences[i], right, y, 32);
  });
  if (swapped) {
    text('Claimed status', left, 692, 28, C.muted);
    text(resolvedClaim.value, left, 746, 44);
    text('Recorded status', left + 356, 692, 28, C.muted);
    text(EVIDENCE.facts.status, left + 356, 746, 44);
    if (stopped) {
      sentences.forEach((sentence, i) => text(sentence, right, 455 + 58 * i, 32));
    } else text('Can the three matching facts still go out?', right, 465, 34);
    footer(
      stopped
        ? 'Withhold the whole update and request a review.'
        : 'The fourth claim now says the incident is resolved.',
      stopped ? C.pink : C.ink,
    );
  } else {
    text('Claimed recovery estimate', left, 692, 28, C.muted);
    text(claims[3].value, left, 746, 45);
    text('Field absent', left + 565, 746, 26, C.yellow);
    if (copies === 0) text('Which facts can the reader receive?', right, 465, 36);
    if (showNote) {
      const note = sentences.at(-1);
      const split = note.lastIndexOf(' ', 39) + 1;
      text(note.slice(0, split).trim(), right, 715, 32, C.yellow);
      text(note.slice(split), right, 763, 32, C.yellow);
    }
    footer(
      showNote
        ? 'Shorten the update. The verified event still reaches the reader.'
        : 'Build each sentence from a checked value.',
      showNote ? C.green : C.ink,
    );
  }
}

export default {
  id: 'safe-rendering',
  draw: drawSafeRendering,
  cues: ['first-draft', 'copy-values', 'no-estimate', 'replace-fourth', 'withhold-update'],
};
