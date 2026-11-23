import { lessonFont } from '../../../lib/fonts.mjs';
import { accessResult } from '../arithmetic.mjs';
import { voice } from '../construction.mjs';

function markRefusal(ctx, api, seconds) {
  const { C } = api;
  const x = 166;
  const baseline = 696;
  const size = 86;
  ctx.save();
  ctx.font = lessonFont(size, 'sans');
  const start = x + ctx.measureText('I can’t help with ').width;
  const width = ctx.measureText('either').width;
  ctx.restore();
  const selected = width * (0.12 + 0.88 * api.ease(seconds / 1.25));
  api.rect(ctx, start - 3, baseline - 78, selected + 6, 96, '#493d24', undefined, 4);
  api.text(ctx, 'I can’t help with either.', x, baseline, size, C.ink);
  const tip = start + selected;
  api.line(ctx, start, baseline + 21, tip, baseline + 21, C.yellow, 5);
  api.path(
    ctx,
    [
      { x: tip, y: baseline + 27 },
      { x: tip + 7, y: baseline + 53 },
      { x: tip + 23, y: baseline + 41 },
    ],
    { closed: true, color: C.yellow, fill: C.yellow, width: 2 },
  );
  api.line(ctx, tip + 16, baseline + 49, tip + 71, baseline + 119, C.yellow, 19);
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const read = voice(state, 'intro-public', 1);
  const stop = voice(state, 'intro-stop', 1);
  const portal = voice(state, 'intro-portal', 1);
  const saved = voice(state, 'intro-teach', 2) > 0;
  const judge = voice(state, 'intro-judge', 2) > 0;

  t('Engineer · private workspace', 136, 252, 33, C.blue);
  api.line(ctx, 108, 278, 108, 414, C.blue, 6);
  api.focus.target('public-request', () =>
    t('Can we edit the docs during the freeze?', 136, 328, 51),
  );
  api.focus.target('private-request', () => t('Can I see the incident timeline?', 136, 407, 51));

  // The draft and its revision occupy the same reply bubble.
  api.path(
    ctx,
    [
      { x: 157, y: 491 },
      { x: 206, y: 491 },
      { x: 157, y: 447 },
    ],
    {
      closed: true,
      fill: C.panel,
      color: C.panel,
      width: 2,
    },
  );
  api.rect(ctx, 96, 482, 1090, 394, C.panel, undefined, 28);
  api.focus.target('reply-question', () =>
    t(
      saved ? 'Training example · revised answer' : read ? 'Revised reply' : 'Assistant draft',
      166,
      567,
      35,
      saved || read ? C.green : C.muted,
    ),
  );
  if (!read) {
    api.focus.target('reply-question', () => markRefusal(ctx, api, state.t));
  } else {
    api.focus.target('public-answer', () =>
      t('Yes, you can edit the docs.', 166, 689, 66, C.green),
    );
    if (portal)
      api.focus.target('private-reply', () =>
        t('Request timeline access in the portal.', 166, 799, 48),
      );
  }

  api.focus.target('public-source', () => {
    t('Public runbook', 1262, 544, 37, C.cyan);
    t('“Doc edits may continue.”', 1262, 607, 36);
  });
  api.focus.target('permission-gate', () => {
    t('Incident timeline', 1262, 726, 37, C.blue);
    t('Signed in · no incident grant', 1262, 787, 34);
  });
  if (stop)
    api.focus.target('private-read', () =>
      t('Private reads    ' + Number(accessResult().fetched), 1262, 851, 36, C.yellow),
    );
  if (saved)
    api.focus.target('revised-example', () =>
      t('Revised reply → supervised training', 126, 975, 38, C.green),
    );
  if (judge)
    api.focus.target('training-artifacts', () =>
      t('Fresh answer pairs → preference labels', 962, 975, 38, C.cyan),
    );
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-private',
    'intro-runbook',
    'intro-scope',
    'intro-question',
    'intro-public',
    'intro-stop',
    'intro-portal',
    'intro-teach',
    'intro-judge',
  ],
};
