import { request } from '../fixtures.mjs';
import { cueProgress } from '../receipt.mjs';
import { text } from '../defaults.mjs';

function serviceKey(ctx, api) {
  const { C } = api;
  api.path(
    ctx,
    [
      { x: 392, y: 614 },
      { x: 522, y: 484 },
      { x: 571, y: 484 },
      { x: 571, y: 525 },
      { x: 547, y: 549 },
      { x: 521, y: 549 },
      { x: 521, y: 575 },
      { x: 497, y: 599 },
      { x: 469, y: 599 },
      { x: 469, y: 626 },
      { x: 430, y: 665 },
    ],
    { closed: true, fill: C.blue, color: C.blue, width: 3 },
  );
  api.circle(ctx, 371, 674, 84, C.blue);
  api.circle(ctx, 353, 694, 26, C.panel);
}

function pointer(ctx, api, x, y) {
  const offsets = [
    [0, 0],
    [17, 63],
    [29, 43],
    [46, 61],
    [55, 53],
    [38, 34],
    [63, 28],
  ];
  api.path(
    ctx,
    offsets.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
    {
      closed: true,
      fill: api.C.ink,
      color: api.C.bg,
      width: 4,
    },
  );
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  const send = cueProgress(scene, state, 'send-report');
  const reload = cueProgress(scene, state, 'reload-page');
  const waiting = send >= 0.35 && reload < 0.6;
  const hitReload = reload > 0 && state.beat === 0;

  // The browser is already on screen when the lesson opens.
  if (state.t < 0.4) ctx.globalAlpha = 1;
  api.rect(ctx, 195, 238, 1530, 617, C.panel, C.blue, 24);
  api.line(ctx, 196, 343, 1723, 343, C.muted, 2);
  api.focus.target('reload', () => {
    const color = hitReload ? C.yellow : C.ink;
    if (hitReload) api.circle(ctx, 287, 291, 36, C.bg, C.yellow, 3);
    const arc = Array.from({ length: 21 }, (_, i) => {
      const a = (0.15 + (i * 1.55) / 20) * Math.PI;
      return { x: 287 + 18 * Math.cos(a), y: 291 + 18 * Math.sin(a) };
    });
    api.path(ctx, arc, { color, width: 4 });
    api.path(
      ctx,
      [
        { x: 299, y: 266 },
        { x: 301, y: 277 },
        { x: 290, y: 278 },
      ],
      { color, width: 4 },
    );
  });
  text(ctx, api, '127.0.0.1:8000', 361, 305, 35, C.muted, 'left', true);
  serviceKey(ctx, api);
  text(ctx, api, request.account_id, 686, 441, 34, C.blue);
  text(ctx, api, request.credential_report, 686, 521, 51);

  api.focus.target('button', () => {
    api.rect(ctx, 686, 578, 392, 94, waiting ? C.panel : C.blue, C.blue, 12);
    text(ctx, api, 'Check policy', 882, 642, 44, waiting ? C.muted : C.bg, 'center');
    if (send < 0.9) pointer(ctx, api, 1047, 649);
  });
  api.focus.target('status', () => {
    if (waiting) {
      const turn = state.t * 3.4;
      api.circle(ctx, 711, 756, 21, null, C.muted, 3);
      api.circle(ctx, 711 + 21 * Math.cos(turn), 756 + 21 * Math.sin(turn), 8, C.yellow);
    }
    text(
      ctx,
      api,
      waiting ? 'Checking policy P-7…' : 'Ready.',
      waiting ? 753 : 686,
      775,
      54,
      waiting ? C.yellow : C.ink,
    );
  });
  if (hitReload) pointer(ctx, api, 312, 309);
  if (state.beat === 1 && cueProgress(scene, state, 'ask-ready') > 0)
    text(ctx, api, 'Did the server finish the check?', 960, 958, 47, C.yellow, 'center');
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['send-report', 'reload-page', 'ask-ready', 'past-attempt'],
};
