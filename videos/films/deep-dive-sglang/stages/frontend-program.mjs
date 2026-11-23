import { motion, settled } from '../construction.mjs';
import { line, slot, text } from '../defaults.mjs';

export function drawFrontendProgram(ctx, scene, state, api) {
  const { C } = api;
  const returned = settled(state, 'program-feature', 1, 0.16);
  const append = motion(state, 'program-append', 1, 0.16, 0.46);
  const submitted = settled(state, 'program-submit', 1, 0.68);
  text(ctx, api, 'R42', 155, 298, 34, C.blue);
  text(ctx, api, 'Add dark mode to settings', 280, 298, 48, C.ink);

  api.focus.target('program-choice', () => {
    text(ctx, api, 'select("label")', 155, 440, 39, C.cyan);
    text(ctx, api, 'bug   /   feature   /   question', 155, 513, 33, C.ink);
    const departing = append > 0 && 818 * append < 262;
    slot(
      ctx,
      api,
      returned ? (departing ? '' : 'feature') : 'pending',
      302,
      650,
      252,
      84,
      returned ? C.cyan : C.muted,
    );
  });
  api.focus.target('program-prompt', () => {
    text(ctx, api, 'Program state for R42', 920, 400, 36, C.blue);
    for (const [i, [role, value]] of [
      ['system', 'Return concise, evidence-backed answers.'],
      ['user', 'Add dark mode to settings'],
      ['assistant', 'Label:'],
    ].entries()) {
      text(ctx, api, role, 920, 475 + i * 62, 29, C.muted);
      text(ctx, api, value, 1120, 475 + i * 62, 30, C.ink);
    }
    line(ctx, api, 570, 692, 1100, 692, C.muted, 2);
    slot(ctx, api, '', 1120, 650, 252, 84, C.muted);
    if (append > 0) slot(ctx, api, 'feature', 302 + (1120 - 302) * append, 650, 252, 84, C.cyan);
  });
  api.focus.target('program-explanation', () => {
    text(ctx, api, 'gen("explanation")', 920, 840, 37, C.ink);
    const status = submitted
      ? 'Submitted with feature'
      : append >= 1
        ? 'Ready to submit'
        : returned
          ? 'Preparing the prompt'
          : 'Waiting for R42’s label';
    text(ctx, api, status, 920, 907, 35, submitted ? C.green : C.muted);
    text(ctx, api, 'Limit 64 tokens   ·   stop at newline', 920, 976, 28, C.muted);
  });
}

export default {
  id: 'frontend-program',
  draw: drawFrontendProgram,
  cues: ['program-roles', 'program-choices', 'program-feature', 'program-append', 'program-submit'],
};
