import { EVIDENCE, draftClaims } from '../fixtures.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, text } = incidentSheet(ctx, api);
  const cue = (id, beat, from, to) => phraseProgress(state, api, id, beat, from, to);
  const time = state.t ?? 0;
  const open = cue('event-clock', 1);
  const match = cue('event-link', 2);
  const gap = cue('estimate-gap', 3, 0.27, 0.57);
  const remove = cue('remove-estimate', 3, 0.62, 0.82);
  const event = draftClaims.find((claim) => claim.field === 'last_event_at');
  const estimate = draftClaims.find((claim) => claim.field === 'recovery_eta');
  const [eventDate, eventTime] = event.value.split(' at ');
  const [eventDigits, zone] = eventTime.split(' ');
  const estimateDigits = estimate.value.split(' ')[0];
  const typed = estimateDigits.slice(0, 2 + Math.floor((time + 0.18) / 0.2));

  ctx.save();
  try {
    if (time < 0.35) ctx.globalAlpha = 1;
    api.rect(ctx, 116, 191, 1688, 390, C.ink, undefined, 10);
    text(
      remove === 1 ? 'Ready to post' : 'Which time can we post?',
      178,
      281,
      51,
      C.bg,
      'left',
      'serif',
    );
    text('Status page draft', 1738, 278, 36, C.bg, 'right');
    api.line(ctx, 178, 315, 1738, 315, C.bg, 2);

    text('Database failover completed  ·  ' + eventDate, 178, 392, 35, C.bg);
    text(eventDigits, 178, 528, 128, C.bg, 'left', 'mono');
    text(zone, 595, 520, 37, C.bg);
    if (remove < 1) {
      if (remove > 0) api.rect(ctx, 1025, 344, 710, 211, C.yellow, undefined, 3);
      text('Full recovery expected by', 1050, 392, 35, C.bg);
      text(typed, 1050, 528, 128, C.bg, 'left', 'mono');
      if (typed === estimateDigits) text(zone, 1467, 520, 37, C.bg);
      if (cue('draft-clock', 0) < 1 && state.beat === 0) {
        const cursor = 1058 + typed.length * 128 * 0.6;
        api.line(ctx, cursor, 429, cursor, 536, C.bg, 5);
      }
    }

    const top = api.lerp(696, 628, open);
    const height = api.lerp(130, 350, open);
    api.rect(ctx, 116, top, 1688, height, C.panel, C.blue, 9);
    api.line(ctx, 143, top + 16, 143, top + height - 16, C.blue, 6);
    text('Incident runbook', 184, top + 82, 53, C.ink, 'left', 'serif');
    text('INC-48291   /   v1   /   May 27, 10:00 UTC', 1735, top + 78, 31, C.blue, 'right');
    if (open > 0.68) {
      api.line(ctx, 184, top + 111, 1735, top + 111, C.muted, 2);
      text(EVIDENCE.facts.last_event_at, 184, top + 185, 42, match === 1 ? C.green : C.ink);
      text(EVIDENCE.facts.last_event, 184, top + 245, 37, C.muted);
      text('Recorded status', 1050, top + 182, 32, C.muted);
      text(EVIDENCE.facts.status, 1050, top + 245, 48);
      if (gap === 1 && !Object.hasOwn(EVIDENCE.facts, estimate.field)) {
        text('No recovery estimate recorded', 1050, top + 309, 35, C.yellow);
      }
    }
    if (match > 0) {
      const tip = api.trace(
        ctx,
        [
          { x: 160, y: 487 },
          { x: 79, y: 487 },
          { x: 79, y: top + 169 },
          { x: 167, y: top + 169 },
        ],
        match,
        C.green,
        5,
      );
      if (match === 1 && tip) api.circle(ctx, tip.x, tip.y, 8, C.green);
    }
  } finally {
    ctx.restore();
  }
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['draft-clock', 'event-clock', 'event-link', 'estimate-gap', 'remove-estimate'],
};
