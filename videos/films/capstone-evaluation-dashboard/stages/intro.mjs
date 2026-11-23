import {
  dashboardCue,
  dashboardDecision,
  dashboardRows,
  dashboardStarted,
} from '../arithmetic.mjs';
import { citationSlip } from '../citation-slip.mjs';
import { dashboardLine as line, dashboardText as text } from '../defaults.mjs';
import { runSheet } from '../run-sheet.mjs';

const candidate = dashboardRows('hybrid-v1');
const privateRow = candidate.find((row) => row.id === 'private_note_injection');

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const comparing = state.beat > 0 && dashboardStarted(state, 'open-runs', state.beatP > 0.18);
  if (comparing) {
    const held = dashboardStarted(state, 'hold-hybrid', state.beatP > 0.9);
    const inspecting = dashboardStarted(state, 'return-to-note', state.beatP > 0.68);
    const rewording = dashboardStarted(state, 'see-rewording', state.beatP > 0.35);
    let footer;
    if (held) footer = [dashboardDecision(candidate), 'Inspect the private citation.', C.pink];
    else if (inspecting)
      footer = ['Private-note request', 'The new answer cites a private workspace note.', C.pink];
    else if (rewording)
      footer = [
        'Same policy, different wording',
        '“Production API key” becomes “live-service credential.”',
        C.blue,
      ];
    return runSheet(ctx, api, { run: 'hybrid-v1', inspect: inspecting, footer });
  }

  // The paper is already in flight when the brand lead cuts to the lesson.
  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  try {
    api.focus.target('attached-note', () => {
      text(ctx, api, 'Rule for this access request', 130, 310, 34, C.blue);
      text(
        ctx,
        api,
        'Abstain, ' + privateRow.expectedCitations.length + ' citations',
        130,
        417,
        64,
        C.ink,
        'left',
        'serif',
      );
      text(ctx, api, 'Workspace documents', 133, 508, 37, C.ink);
      text(ctx, api, 'Candidate’s first answer', 945, 310, 34, C.blue);
      text(ctx, api, '“' + privateRow.answer + '”', 945, 417, 52, C.ink, 'left', 'serif');
      text(ctx, api, 'Attached citation', 945, 508, 37, C.ink);
      line(ctx, api, 935, 800, 1600, 800, C.blue, 4);
      const travel = 1 - (1 - api.clamp(state.t / 1.65)) ** 2;
      citationSlip(
        ctx,
        api,
        api.lerp(165, 945, travel),
        585 - 18 * Math.sin(Math.PI * travel),
        privateRow.citations[0],
      );
      const graded =
        state.beat > 0 && dashboardCue(state, 'failed-answer', state.beatP / 0.08) >= 1;
      text(
        ctx,
        api,
        graded ? 'Fail   ·   Unexpected private citation' : 'Would you pass this answer?',
        130,
        947,
        57,
        graded ? C.pink : C.ink,
        'left',
        'serif',
      );
    });
  } finally {
    ctx.restore();
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['failed-answer', 'open-runs', 'see-rewording', 'return-to-note', 'hold-hybrid'],
};
