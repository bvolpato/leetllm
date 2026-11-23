import { cueEnded, cueProgress, focusOn, line, text } from '../defaults.mjs';

export function drawLimits(ctx, scene, state, api) {
  const { C } = api;
  const copies = 1 + Math.floor(39 * cueProgress(state, 'copy-ticket'));
  focusOn(api, 'audit-sample', () => {
    if (state.beat === 2) {
      text(
        ctx,
        api,
        'Toy traffic mix   ·   fixed error within each ticket type',
        960,
        310,
        42,
        C.ink,
        'center',
      );
      for (const [i, launchShare] of [0.25, 0.75].entries()) {
        if (i && !cueEnded(state, 'traffic-mix')) continue;
        const y = 440 + i * 183,
          width = 750;
        text(ctx, api, i ? 'Launch week' : 'Last year', 145, y + 43, 42, C.ink);
        api.rect(ctx, 550, y, width * (1 - launchShare), 60, C.blue, undefined, 2);
        api.rect(
          ctx,
          550 + width * (1 - launchShare),
          y,
          width * launchShare,
          60,
          C.yellow,
          undefined,
          2,
        );
        text(ctx, api, 100 * (1 - launchShare) + '% routine', 550, y + 111, 32, C.blue);
        text(ctx, api, 100 * launchShare + '% launch', 1300, y + 111, 32, C.yellow, 'right');
        const rate = (1 - launchShare) * 0.1 + launchShare * 0.3;
        if (!i || cueEnded(state, 'mix-result'))
          text(ctx, api, (100 * rate).toFixed(0) + '% error', 1510, y + 43, 45, C.ink);
      }
      text(
        ctx,
        api,
        'Routine tickets   10% error     ·     Launch tickets   30% error',
        960,
        945,
        38,
        C.muted,
        'center',
      );
      return;
    }
    if (state.beat === 3) {
      text(
        ctx,
        api,
        'Replay a production failure with the same raw ticket',
        960,
        312,
        43,
        C.ink,
        'center',
      );
      text(ctx, api, 'ID 038', 960, 465, 58, C.yellow, 'center');
      for (const [i, route] of ['Billing', 'Account access'].entries()) {
        const x = i ? 1410 : 510;
        line(ctx, api, 960, 501, x, 605, C.muted, 4);
        text(ctx, api, i ? 'Serving route' : 'Offline route', x, 687, 39, C.muted, 'center');
        text(ctx, api, route, x, 792, 56, C.ink, 'center');
      }
      text(
        ctx,
        api,
        'Compare prompt version, preprocessing, and scoring labels.',
        960,
        969,
        39,
        C.cyan,
        'center',
      );
      return;
    }
    text(ctx, api, 'Source ticket', 393, 323, 42, C.ink, 'center');
    api.rect(ctx, 254, 460, 278, 152, C.panel, C.pink, 12);
    text(ctx, api, 'ID 038', 393, 550, 49, C.pink, 'center');
    line(ctx, api, 550, 541, 782, 541, C.muted, 4);
    text(ctx, api, 'Rows in the report', 1285, 323, 42, C.ink, 'center');
    for (let i = 0; i < copies; i++) {
      const x = 820 + (i % 8) * 115,
        y = 383 + Math.floor(i / 8) * 65;
      api.rect(ctx, x, y, 94, 49, C.panel, C.pink, 4);
      text(ctx, api, '038', x + 47, y + 34, 30, C.pink, 'center');
    }
    text(
      ctx,
      api,
      cueEnded(state, 'one-draw') ? '1 independent draw' : 'Independent draws?',
      393,
      803,
      44,
      C.yellow,
      'center',
    );
    text(
      ctx,
      api,
      copies + (copies === 1 ? ' scored row' : ' scored rows'),
      1280,
      803,
      44,
      C.ink,
      'center',
    );
    const footer =
      state.beat === 0
        ? 'How many independent draws can these rows support?'
        : 'Copying a ticket preserves its loss and its identity.';
    text(ctx, api, footer, 960, 974, 36, C.muted, 'center');
  });
}
export default {
  id: 'limits',
  draw: drawLimits,
  cues: ['copy-ticket', 'one-draw', 'traffic-mix', 'mix-result', 'serving-check'],
};
