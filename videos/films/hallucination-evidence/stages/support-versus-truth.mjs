import { EVIDENCE, draftClaims } from '../fixtures.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawSupportVersusTruth(ctx, scene, state, api) {
  const { C, left, text, footer } = incidentSheet(ctx, api);
  const change = phraseProgress(state, api, 'world-status-changes', 0, 0.22, 0.45);
  const forecast = phraseProgress(state, api, 'lucky-guess', 0, 0.66, 0.78) > 0;
  const start = 635,
    end = 1670;
  const marker = api.lerp(start, end, change);
  text('One hypothetical incident', left, 265, 45, C.ink, 'left', 'serif');
  text(forecast ? 'At issue' : '10:00 UTC', start, 367, 36, C.muted, 'center');
  text(forecast ? draftClaims[3].value : '11:00 UTC', end, 367, 36, C.muted, 'center');
  api.line(ctx, start, 404, end, 404, C.muted, 2);
  api.circle(ctx, start, 404, 7, C.blue);
  api.circle(ctx, end, 404, 7, C.muted);
  text('Admitted record', left, 523, 44, C.blue);
  text('Hypothetical world', left, 724, 43);
  text(forecast ? 'No recovery estimate' : EVIDENCE.facts.status, start, 520, 39, C.blue);
  api.line(ctx, start, 559, end, 559, C.blue, 5);
  if (forecast) {
    text('Recovery time unknown', start, 723, 37);
    text('Recovered by 14:30', end, 723, 37, C.green, 'right');
    api.line(ctx, start, 764, end, 764, C.muted, 4);
    api.circle(ctx, end, 764, 11, C.green);
    footer('The guess came true. At issue time the runbook had no estimate.');
  } else {
    text(EVIDENCE.facts.status, start, 723, 39);
    api.line(ctx, start, 764, end, 764, C.muted, 3);
    if (change > 0) api.line(ctx, start, 764, marker, 764, C.green, 5);
    api.circle(ctx, marker, 764, 11, C.green);
    if (change === 1) text('Recovered', end, 723, 39, C.green, 'right');
    footer(
      change === 1
        ? 'At eleven, “investigating” still describes the ten o’clock record.'
        : 'What if the world changes while the record stays the same?',
    );
  }
}

export default {
  id: 'support-versus-truth',
  draw: drawSupportVersusTruth,
  cues: [
    'support-versus-truth-b1',
    'world-status-changes',
    'lucky-guess',
    'support-versus-truth-b2',
  ],
};
