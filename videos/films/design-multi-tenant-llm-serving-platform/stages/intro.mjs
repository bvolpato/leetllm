import { resultAfter } from '../../../lib/lesson-definition.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const slide = api.phase(state.t, -0.32, 1.65);
  const x = api.lerp(188, 750, slide);
  const y = api.lerp(595, 516, slide);
  const paused = resultAfter(state, 'intro-contain');

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('summary-receipt', () => {
    api.rect(ctx, 640, 221, 1060, 609, C.panel, C.pink, 20);
    api.rect(ctx, 697, 283, 7, 157, C.pink, undefined, 3);
    api.text(ctx, 'Workspace B', 735, 308, 37, C.pink);
    api.text(ctx, 'Incident summary', 732, 388, 69, C.ink, 'left', 'serif');
    api.text(ctx, 'Delivered to Bob', 735, 447, 42, C.ink);
  });

  api.focus.target('cited-source', () => {
    const right = x + 845;
    api.path(
      ctx,
      [
        { x, y },
        { x: right - 52, y },
        { x: right, y: y + 52 },
        { x: right, y: y + 256 },
        { x, y: y + 256 },
      ],
      { closed: true, fill: C.ink, color: C.ink, width: 2 },
    );
    api.path(
      ctx,
      [
        { x: right - 52, y },
        { x: right - 52, y: y + 52 },
        { x: right, y: y + 52 },
      ],
      { closed: true, fill: C.blue, width: 0 },
    );
    api.text(ctx, '[1]   Cited source', x + 40, y + 57, 35, C.bg);
    api.text(ctx, 'Private postmortem', x + 40, y + 137, 65, C.bg, 'left', 'serif');
    api.line(ctx, x + 40, y + 165, right - 40, y + 165, C.muted, 2);
    api.text(ctx, 'Workspace A   /   Only reader: Carol', x + 40, y + 224, 39, C.bg);
  });

  if (paused) {
    api.focus.target('summary-receipt', () => {
      api.rect(ctx, 183, 463, 370, 96, C.yellow, undefined, 14);
      api.rect(ctx, 217, 491, 10, 39, C.bg, undefined, 2);
      api.rect(ctx, 236, 491, 10, 39, C.bg, undefined, 2);
      api.text(ctx, 'Route paused', 271, 525, 36, C.bg);
    });
  }
  if (resultAfter(state, 'intro-delay')) {
    api.text(
      ctx,
      'Same replica   ·   A’s long review and B’s short summary both waited',
      960,
      960,
      36,
      C.ink,
      'center',
    );
  }
  ctx.restore();
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-delivery', 'intro-citation', 'intro-choice', 'intro-contain', 'intro-delay'],
};
