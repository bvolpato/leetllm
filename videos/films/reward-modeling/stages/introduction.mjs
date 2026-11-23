import { LIKELIHOOD_FIXTURE } from '../fixtures.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { badge, label, line } from '../defaults.mjs';

function requestSlip(ctx, api, x) {
  const { C } = api;
  api.rect(ctx, x, 286, 665, 532, C.ink, undefined, 18);
  label(api, ctx, 'ACCESS REQUEST', x + 54, 368, 31, C.panel, 'left', 'mono');
  line(api, ctx, x + 54, 403, x + 611, 403, C.muted, 3);
  label(api, ctx, 'Admin access?', x + 54, 513, 71, C.bg, 'left', 'serif');
  label(api, ctx, 'Migration starts in 10 minutes', x + 54, 582, 37, C.panel);
  for (let dx = 32; dx < 620; dx += 42) {
    line(api, ctx, x + dx, 657, x + dx + 21, 657, C.muted, 3);
  }
  for (const edge of [x, x + 665]) api.circle(ctx, edge, 657, 18, C.bg);
  label(api, ctx, 'P-7', x + 54, 754, 34, C.panel, 'left', 'mono');
  label(api, ctx, 'Approved ticket required', x + 164, 754, 39, C.bg);
}

function ballotReply(ctx, api, answer, y, selected) {
  const { C } = api;
  const x = 912;
  const color = selected ? C.green : C.blue;
  api.rect(ctx, x, y, 866, 215, C.panel, color, 24);
  api.circle(ctx, x + 85, y + 108, 43, selected ? C.green : C.panel, color, 4);
  badge(api, ctx, answer.id, x + 85, y + 123, selected ? C.bg : C.ink, 42);
  // Keep the wording of the replies intact when the next scene breaks them into tokens.
  const [first, second, third] = answer.pieces;
  const rows = [first + ' ' + second, third];
  rows.forEach((row, i) => label(api, ctx, row, x + 165, y + 95 + 64 * i, 48, C.ink));
}

export function drawIntroduction(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const arrival = api.phase(state.t ?? 0, -0.28, 0.92);
  focus.target('approval-lock', () => requestSlip(ctx, api, api.lerp(44, 156, arrival)));

  const vote = state.beat > 0 ? cueProgress(state, 'opening-choice', motion(state, 0, 0.12)) : 0;
  LIKELIHOOD_FIXTURE.answers.forEach((answer, i) => {
    focus.target(i ? 'answer-b' : 'answer-a', () => {
      ballotReply(ctx, api, answer, 290 + 285 * i, i === 0 && vote > 0);
    });
  });
  focus.target('human-choice', () => {
    if (vote > 0) {
      line(api, ctx, 912, 863, api.lerp(912, 1778, vote), 863, C.green, 5);
      label(api, ctx, 'Preference recorded', 912, 951, 36, C.ink);
      label(api, ctx, 'A over B', 1778, 953, 56, C.green, 'right', 'serif');
    }
  });
}

export default {
  id: 'introduction',
  draw: drawIntroduction,
  cues: ['opening-rule', 'opening-answers', 'opening-grant', 'opening-choice'],
};
