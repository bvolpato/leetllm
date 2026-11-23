import { facts } from '../fixtures.mjs';
import { chapterText } from '../defaults.mjs';
import { measure, minuteRuler } from '../incident-picture.mjs';

export function drawOpening(ctx, scene, state, api) {
  const { C, focus } = api;
  const proposed = 90;
  const beat = state.beat ?? 0;

  // The page and the reply are already on the desk when the first word arrives.
  if (state.t < 0.35) ctx.globalAlpha = 1;

  api.path(
    ctx,
    [
      { x: 193, y: 552 },
      { x: 905, y: 552 },
      { x: 905, y: 226 },
    ],
    {
      color: C.muted,
      width: 2,
    },
  );
  api.rect(ctx, 170, 207, 722, 332, C.panel, C.muted, 12);
  api.line(ctx, 206, 210, 206, 536, C.green, 4);
  api.path(
    ctx,
    [
      { x: 265, y: 207 },
      { x: 308, y: 207 },
      { x: 308, y: 265 },
      { x: 286, y: 249 },
      { x: 265, y: 265 },
    ],
    { closed: true, fill: C.green, width: 0 },
  );
  chapterText(ctx, api, 'On-call runbook    /    ' + facts.sourceId, 340, 258, 35, C.green);
  chapterText(ctx, api, 'First page within', 265, 344, 40);
  focus.target('runbook-line', () =>
    chapterText(ctx, api, facts.deadline + ' min', 256, 478, 125, C.green),
  );

  api.rect(ctx, 1015, 207, 730, 332, C.panel, C.blue, 34);
  api.path(
    ctx,
    [
      { x: 1050, y: 537 },
      { x: 1050, y: 576 },
      { x: 1124, y: 537 },
    ],
    {
      fill: C.panel,
      color: C.blue,
      width: 3,
    },
  );
  chapterText(ctx, api, 'Assistant reply', 1090, 276, 35, C.blue);
  chapterText(ctx, api, 'First page within', 1090, 344, 40);
  focus.target('assistant-line', () =>
    chapterText(ctx, api, proposed + ' min', 1082, 478, 125, C.blue),
  );
  chapterText(ctx, api, '[' + facts.sourceId + ']', 1625, 475, 38, C.blue, 'center');

  const y = 760;
  const x = minuteRuler(ctx, api, y, proposed, [0, facts.deadline, 60, proposed]);
  chapterText(ctx, api, 'Minutes since P1 declaration', x(0), 642, 32, C.muted);
  for (const [minute, label, color] of [
    [facts.deadline, facts.sourceId, C.green],
    [proposed, 'Reply', C.blue],
  ]) {
    api.line(ctx, x(minute), y - 42, x(minute), y, color, 5);
    api.circle(ctx, x(minute), y, 9, color);
    chapterText(ctx, api, label, x(minute), y - 60, 34, color, 'center');
  }
  if (beat === 1) {
    chapterText(ctx, api, 'How late is a page at minute 90?', 960, 953, 50, C.yellow, 'center');
  } else if (focus.progress('opening-reference') > 0) {
    focus.target('prompt-wording', () => {
      api.rect(ctx, 178, 890, 1564, 108, C.panel, undefined, 12);
      chapterText(ctx, api, 'Prompt to try', 218, 957, 34, C.cyan);
      chapterText(ctx, api, 'Give the deadline in minutes since P1 declaration.', 588, 959, 40);
    });
  } else if (beat === 2) {
    const p = focus.progress('deadline-distance-reveal', state.beatP);
    const start = x(facts.deadline);
    focus.target('deadline-distance', () =>
      measure(
        ctx,
        api,
        start,
        start + (x(proposed) - start) * p,
        958,
        C.yellow,
        p >= 1 ? proposed - facts.deadline + ' minutes late' : '',
      ),
    );
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['open-runbook', 'opening-reply', 'deadline-distance-reveal', 'opening-reference'],
};
