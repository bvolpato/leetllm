import { lessonFont } from '../../../lib/fonts.mjs';
import { done, mix } from '../construction.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';
import { ASSISTANT_TARGETS, TOKEN_IDS, TOKENS } from '../fixtures.mjs';

const messages = [
  { role: 'User', start: 1, end: 5, word: 2, center: 515 },
  { role: 'Assistant', start: 6, end: 9, word: 7, center: 1405 },
];

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const t = state.t ?? 0;
  if (t < 0.35) ctx.globalAlpha = 1;
  const travel = Math.min(1, (t + 0.12) / 1.25);
  const landed = 1 - (1 - travel) ** 2;
  const replyRevealed = done(state, 'intro-reply', 1);
  const userMasked = done(state, 'intro-ignore', 1);
  const showEnding = done(state, 'intro-ending', 2);

  for (const { role, start, end, word, center } of messages) {
    const scored = ASSISTANT_TARGETS[word];
    const roleColor = scored ? C.cyan : C.blue;
    const pieces = TOKENS.slice(start, end);
    const id = TOKEN_IDS[word];
    focus(ctx, api, 'conversation', () => {
      text(ctx, api, role, center - 365, 276, 39, roleColor);
      api.rect(ctx, center - 395, 308, 790, 152, C.panel, roleColor, 34);
      ctx.save();
      ctx.font = lessonFont(65);
      const left = center - ctx.measureText(pieces.join(' ')).width / 2;
      const prefix = TOKENS.slice(start, word).join(' ') + ' ';
      const wordLeft = left + ctx.measureText(prefix).width;
      const wordWidth = ctx.measureText(TOKENS[word]).width;
      ctx.restore();
      text(ctx, api, pieces.join(' '), left, 408, 65);
      api.line(ctx, wordLeft, 429, wordLeft + wordWidth, 429, C.yellow, 5);

      const anchor = wordLeft + wordWidth / 2;
      const x = mix(anchor, center, landed);
      const y = mix(498, 625, landed);
      api.line(ctx, anchor, 468, x, y - 43, C.yellow, 3);
      api.rect(ctx, x - 109, y - 38, 218, 76, C.panel, C.yellow, 16);
      text(ctx, api, 'ID ' + id, x, y + 16, 42, C.yellow, 'center');
    });

    focus(ctx, api, scored ? 'reply-label' : 'user-label', () => {
      const known = scored ? replyRevealed : userMasked;
      const label = known ? (scored ? String(id) : '−100') : '?';
      const ink = known ? (scored ? C.green : C.muted) : C.ink;
      text(ctx, api, 'Loss label', center, 752, 32, C.muted, 'center');
      text(ctx, api, label, center, 845, 78, ink, 'center');
      if (known)
        text(
          ctx,
          api,
          scored ? 'Score this prediction' : 'Skip this prediction',
          center,
          911,
          35,
          ink,
          'center',
        );
      if (scored && showEnding) {
        text(ctx, api, TOKENS[8] + '  →  ' + TOKENS[9], center, 1007, 45, C.green, 'center');
      }
    });
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-copies', 'intro-choice', 'intro-reply', 'intro-ignore', 'intro-ending'],
};
