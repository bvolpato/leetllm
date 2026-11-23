import { spoken } from '../construction.mjs';
import { drawMigrationWindow, generalWindow, migrationDecision } from '../migration-window.mjs';

function searchResult(ctx, api, x, y, title, days, condition, color) {
  const w = 720;
  const fold = 40;
  api.path(
    ctx,
    [
      { x, y },
      { x: x + w - fold, y },
      { x: x + w, y: y + fold },
      { x: x + w, y: y + 201 },
      { x, y: y + 201 },
    ],
    { closed: true, fill: api.C.panel, color, width: 3 },
  );
  api.path(
    ctx,
    [
      { x: x + w - fold, y },
      { x: x + w - fold, y: y + fold },
      { x: x + w, y: y + fold },
    ],
    { color, width: 3 },
  );
  api.text(ctx, title, x + 30, y + 49, 33, color);
  api.text(ctx, `${days} days`, x + 30, y + 125, 70, color, 'left', 'serif');
  api.text(ctx, condition, x + 30, y + 174, 33, api.C.ink);
}

export function drawIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const base = cue('intro-general');
  const offer = cue('intro-exception');
  const pending = cue('intro-pending');
  const approved = cue('intro-approved');
  const extend = cue('intro-extend');
  const decision = migrationDecision(1, 45, { granted: approved.phase === 'after' });
  api.focus.target('intro-query', () => {
    api.rect(ctx, 175, 191, 1570, 108, C.panel, C.cyan, 54);
    api.circle(ctx, 234, 237, 19, C.panel, C.cyan, 5);
    api.line(ctx, 249, 252, 265, 268, C.cyan, 5);
    api.text(
      ctx,
      `Can we start the migration on day ${decision.proposedDay}?`,
      300,
      261,
      49,
      C.ink,
    );
  });
  const travel = Math.pow(1 - Math.min(1, (state.t ?? 0) / 1.15), 2);
  api.focus.target('intro-policy', () => {
    searchResult(
      ctx,
      api,
      175 + 188 * travel,
      365 + 32 * travel,
      'Parser-v2 policy',
      generalWindow,
      'from the deprecation notice',
      C.blue,
    );
  });
  api.focus.target('intro-exception-page', () => {
    searchResult(
      ctx,
      api,
      1025 - 182 * travel,
      365 - 47 * travel,
      'Service-account exception',
      decision.exceptionDays,
      'only with security approval',
      C.green,
    );
  });
  drawMigrationWindow(ctx, api, decision, {
    belowSearchResults: true,
    base: base.progress,
    offer: offer.progress,
    extension: extend.progress,
    record:
      approved.phase === 'after'
        ? 'Security approval · granted'
        : pending.phase !== 'before'
          ? 'Security approval · pending'
          : '',
    question:
      cue('intro-question').phase !== 'before' && approved.phase === 'before'
        ? 'Which deadline applies today?'
        : '',
    verdict:
      approved.phase === 'after'
        ? extend.phase === 'after'
        : cue('intro-outside').phase === 'after',
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-start',
    'intro-general',
    'intro-exception',
    'intro-pending',
    'intro-question',
    'intro-outside',
    'intro-approved',
    'intro-extend',
  ],
};
