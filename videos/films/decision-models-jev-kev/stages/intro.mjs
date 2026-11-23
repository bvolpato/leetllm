import { phraseStarted } from '../clock.mjs';
import { choices } from '../ticket.mjs';

function drawRegistry(ctx, api) {
  const { C } = api;
  const x = 283;
  for (const y of [461, 421, 381]) {
    api.path(
      ctx,
      [
        { x: x - 138, y },
        { x, y: y - 60 },
        { x: x + 138, y },
        { x: x + 138, y: y + 24 },
        { x, y: y + 84 },
        { x: x - 138, y: y + 24 },
      ],
      { closed: true, fill: C.panel, color: C.blue, width: 5 },
    );
    api.path(
      ctx,
      [
        { x: x - 138, y },
        { x, y: y + 60 },
        { x: x + 138, y },
      ],
      { color: C.blue, width: 4 },
    );
  }
  api.text(ctx, 'Image registry', x, 628, 46, C.ink, 'center');
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;
  const travel = api.clamp(time / 1.4);
  const responseX = 600 + 495 * (1 - (1 - travel) ** 2);
  const reviewed = phraseStarted(state, 'review-label', 1, 0.01);

  drawRegistry(ctx, api);
  api.focus.target('registry-response', () => {
    const right = responseX + 142;
    api.line(ctx, 442, 432, responseX - 152, 432, C.yellow, 4);
    if (right + 12 < 1240) api.line(ctx, right + 12, 432, 1240, 432, C.muted, 3);
    api.rect(ctx, responseX - 142, 318, 284, 222, C.yellow, undefined, 12);
    api.text(ctx, '401', responseX, 449, 116, C.bg, 'center', 'mono');
    api.text(ctx, 'Unauthorized', responseX, 504, 36, C.bg, 'center');
  });
  api.focus.target('build-log', () => {
    api.rect(ctx, 1250, 285, 548, 332, C.panel, C.muted, 12);
    api.text(ctx, 'RUN-842  /  build log', 1290, 355, 35, C.muted, 'left', 'mono');
    api.line(ctx, 1252, 389, 1796, 389, C.muted, 2);
    api.text(
      ctx,
      travel === 1 ? 'Image pull failed' : 'Pulling image…',
      1290,
      484,
      51,
      travel === 1 ? C.yellow : C.ink,
    );
    api.text(ctx, travel === 1 ? 'Tests never started' : 'Tests waiting', 1290, 558, 41, C.ink);
  });
  api.focus.target('choices', () => {
    api.line(ctx, 108, 711, 1805, 711, C.muted, 2);
    choices.slice(0, 3).forEach((description, i) => {
      const x = [110, 640, 1288][i];
      const selected = reviewed && i === 1;
      api.circle(ctx, x + 36, 809, 35, selected ? C.cyan : C.panel, selected ? C.cyan : C.muted, 2);
      api.text(
        ctx,
        String.fromCharCode(65 + i),
        x + 36,
        823,
        39,
        selected ? C.bg : C.ink,
        'center',
      );
      api.text(ctx, description, x + 93, 824, 40, selected ? C.cyan : C.ink);
    });
  });

  if (!reviewed) return;
  api.focus.target('return-type', () => {
    const direct = phraseStarted(state, 'direct-head', 1, 0.69);
    const grammar = phraseStarted(state, 'typed-contract', 1, 0.47);
    const message = direct
      ? 'Decision head   →   one score per option'
      : grammar
        ? 'Output grammar   →   A, B or C as the next token'
        : 'Reviewed label   B';
    api.text(ctx, message, 110, 962, 43, C.cyan);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['open-log', 'first-call', 'review-label', 'typed-contract', 'direct-head'],
};
