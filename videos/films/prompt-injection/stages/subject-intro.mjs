import { PROPOSAL, REPORT, TRUSTED } from '../fixtures.mjs';
import { promotionAllowed } from '../model.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  // The report and slip are already in view when the brand lead ends.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const spoken = (id) => cueBegun(state.cues, id, false);
  const progress = (id) => cueProgress(state.cues, id, 0);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const allowed = promotionAllowed(PROPOSAL, TRUSTED);
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);

  const departure = Math.min(1, state.t / 1.15);
  const x = 732 + 182 * departure + 329 * progress('intro-proposal-moves');
  const y = 479 - 45 * departure;
  api.focus.target('intro-report', () => {
    text('Your request', 128, 256, 30, C.muted);
    text('“Summarize this report.”', 128, 323, 49);
    api.path(ctx, [
      { x: 128, y: 372 }, { x: 726, y: 372 }, { x: 798, y: 444 },
      { x: 798, y: 786 }, { x: 128, y: 786 },
    ], { closed: true, fill: C.ink, color: C.ink, width: 2 });
    api.path(ctx, [
      { x: 726, y: 372 }, { x: 726, y: 444 }, { x: 798, y: 444 },
    ], { closed: true, fill: C.muted, color: C.muted, width: 2 });
    text('External evaluation   /   R42', 171, 464, 30, C.bg);
    api.line(ctx, 172, 498, 705, 498, C.muted, 2);
    text(REPORT.result, 170, 590, 51, C.bg);
    text(REPORT.attack, 170, 693, 43, C.bg);
    const underline = 185 + 306 * progress('intro-request');
    api.line(ctx, 172, 716, 172 + underline, 716, C.blue, 7);
  });

  api.focus.target('intro-release', () => {
    text('Release service', 1238, 256, 30, C.muted);
    text('C17 live traffic', 1238, 322, 49);
    text('0%', 1238, 410, 79, C.cyan);
    api.line(ctx, 1239, 682, 1753, 682, C.muted, 3);
    if (spoken('intro-lookup')) {
      text(after('intro-lookup') ? 'No matching approval' : 'Looking up approval…', 1240, 747, 36);
    }
  });

  api.focus.target('intro-proposal', () => {
    api.path(ctx, [
      { x: 798, y: 687 }, { x: 865, y: 687 }, { x: 925, y: 578 },
      { x: 1243, y: 578 },
    ], { color: C.yellow, width: 4 });
    // The notches and solid color keep the proposed change distinct from the report.
    const w = 500, h = 210;
    api.path(ctx, [
      { x, y }, { x: x + w, y }, { x: x + w, y: y + 89 },
      { x: x + w - 16, y: y + 105 }, { x: x + w, y: y + 121 },
      { x: x + w, y: y + h }, { x, y: y + h }, { x, y: y + 121 },
      { x: x + 16, y: y + 105 }, { x, y: y + 89 },
    ], { closed: true, fill: C.yellow, color: C.yellow, width: 2 });
    text('Assistant’s release request', x + 38, y + 59, 32, C.bg);
    text(PROPOSAL.traffic + '%', x + 36, y + 165, 87, C.bg);
    text('of live traffic', x + 245, y + 159, 32, C.bg);
  });

  api.focus.target('intro-decision', () => {
    if (after('intro-answer')) {
      text(allowed ? 'Release permitted' : 'Release denied', 1238, 915, 52, allowed ? C.green : C.pink);
      if (spoken('intro-summary'))
        text('Reply   “R42 reports that C17 passed.”', 128, 914, 38, C.blue);
    } else if (spoken('intro-question')) {
      text('Should the service apply the proposed 25%?', 128, 926, 50, C.yellow);
    }
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-source',
    'intro-result',
    'intro-request',
    'intro-proposal-moves',
    'intro-lookup',
    'intro-question',
    'intro-answer',
    'intro-summary',
  ],
};
