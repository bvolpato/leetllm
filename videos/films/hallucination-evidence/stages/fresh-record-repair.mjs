import { EVIDENCE, CURRENT_RECORD } from '../fixtures.mjs';
import { freshIncidentFrame } from '../model.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawFreshRecordRepair(ctx, scene, state, api) {
  const { C, left, right, text, heading, pair, link, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const showNew = cue('new-record', 0) > 0;
  const submitted = cue('cited-version', 1) > 0;
  const stopped = cue('version-stop', 2) === 1;
  const rebound = cue('bind-current', 3) === 1;
  const rechecked = cue('recheck-version', 3);
  const printedEstimate = cue('print-estimate', 4) === 1;
  const released = cue('print-answer', 4);
  const repaired = rechecked === 1;
  const frame = freshIncidentFrame(rebound);
  const record = showNew ? CURRENT_RECORD : EVIDENCE;
  const [estimate, status] = frame.text.split('. ');
  if (phraseProgress(state, api, 'request-log', 4, 0.63, 0.72) === 1) {
    const open = phraseProgress(state, api, 'open-trace', 4, 0.78, 0.86);
    const bottom = api.lerp(423, 919, open);
    text('Request log', left, 253, 48, C.ink, 'left', 'serif');
    api.rect(ctx, left, 306, 1658, bottom - 306, C.panel, C.blue, 9);
    text(EVIDENCE.facts.service, 183, 380, 45);
    text('HTTP 200', 1728, 380, 43, C.blue, 'right', 'mono');
    if (bottom > 506) {
      api.line(ctx, 183, 421, 1728, 421, C.muted, 2);
      text('Response trace', 183, 495, 45, C.ink, 'left', 'serif');
      text('Runbook v2', 1728, 492, 34, C.blue, 'right');
    }
    if (bottom > 586) text('Sent to the reader', 183, 573, 32, C.muted);
    if (bottom > 661) text(estimate + '.', 183, 650, 49);
    if (bottom > 738) text(status, 183, 727, 49);
    if (bottom > 866) {
      api.line(ctx, 183, 785, 1728, 785, C.muted, 2);
      text('Estimate: ' + frame.verdicts[0], 183, 853, 36, C.green);
      text('Status: ' + frame.verdicts[1], 950, 853, 36, C.green);
    }
    return;
  }
  heading(
    left,
    'Admitted runbook',
    'INC-48291   /   ' + (showNew ? 'version 2' : 'version 1'),
    C.blue,
  );
  heading(
    right,
    printedEstimate ? 'Status page response' : 'Draft for the status page',
    EVIDENCE.facts.service,
    C.ink,
  );
  pair(421, 'Recorded recovery estimate', record.facts.recovery_eta ?? 'No field');
  pair(611, 'Recorded status', record.facts.status);
  if (printedEstimate) {
    text(estimate + '.', right, 476, 37);
    link(464, 1);
    if (released === 1) {
      text(status, right, 666, 37);
      link(654, 1);
    }
    if (cue('save-receipt', 4) === 1) {
      api.line(ctx, left, 869, 1786, 869, C.muted, 2);
      text('Saved with this response', left, 946, 43, C.ink, 'left', 'serif');
      text('Runbook v2', 691, 946, 34, C.blue);
      text('Estimate: ' + frame.verdicts[0], 979, 946, 34, C.green);
      text('Status: ' + frame.verdicts[1], 1421, 946, 34, C.green);
    }
    return;
  }
  if (submitted) {
    frame.claims.forEach((claim, i) => {
      const y = 421 + i * 190;
      const tag = claim.version === CURRENT_RECORD.version ? 'v2' : 'v1';
      text(i ? 'Status claim' : 'Estimate claim', right, y, 30, C.muted);
      text(claim.value, right, y + 55, 43);
      text('cites ' + tag, right + 430, y + 55, 39, C.blue);
      if (repaired) link(y + 42, 1);
    });
    text('Draft prose', right, 741, 28, C.muted);
    text('“' + frame.claims[1].text + '”', right, 807, 44, C.ink, 'left', 'serif');
  }
  if (repaired) footer('Which sentences can the status page print?');
  else if (rebound) footer('Check both values against the newly cited record.');
  else if (stopped) footer('Withhold the update. The estimate cites a different version.', C.pink);
  else if (submitted) footer('Can this draft go out with these citations?');
  else footer('Has the embedding API recovered?');
}

export default {
  id: 'fresh-record-repair',
  draw: drawFreshRecordRepair,
  cues: [
    'new-record',
    'cited-version',
    'version-stop',
    'bind-current',
    'recheck-version',
    'print-estimate',
    'print-answer',
    'save-receipt',
    'request-log',
    'open-trace',
  ],
};
