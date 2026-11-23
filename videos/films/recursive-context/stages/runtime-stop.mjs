import {
  arrow,
  contractText,
  cueComplete,
  cueProgress,
  footer,
  line,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawRuntimeStop(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('runtime-stop-mechanism', () => {
    if (currentBeat === 0) {
      const strict = cueComplete(ctx, api, 'strict-shape'),
        truthy = cueComplete(ctx, api, 'truthy-runtime');
      tag(ctx, api, 'ready: "false" · content: date', 960, 380, themeColors.yellow, 1450);
      tag(
        ctx,
        api,
        strict ? 'Strict wrapper: reject the string' : 'Strict shape requires typed fields',
        960,
        590,
        strict ? themeColors.pink : themeColors.muted,
        1450,
      );
      if (truthy)
        tag(
          ctx,
          api,
          'Pinned runtime: truthy signal → string capture',
          960,
          800,
          themeColors.cyan,
          1450,
        );
    } else if (currentBeat === 1) {
      contractText(
        ctx,
        api,
        'Thirty controller iterations · count every request',
        960,
        290,
        35,
        themeColors.blue,
      );
      for (let i = 0; i < 30; i++) {
        const x = 230 + (i % 10) * 150,
          y = 400 + Math.floor(i / 10) * 105;
        rectangle(ctx, api, x, y, 100, 65, themeColors.panel);
        contractText(ctx, api, String(i + 1), x + 50, y + 45, 28, themeColors.blue);
      }
      if (cueProgress(ctx, api, 'iteration-fallback'))
        tag(ctx, api, '31: extra best-effort fallback', 960, 825, themeColors.yellow, 1370);
      if (cueComplete(ctx, api, 'typed-breach'))
        contractText(
          ctx,
          api,
          'Timeout / token / budget breaches are distinct typed stops',
          960,
          940,
          32,
          themeColors.pink,
        );
    } else {
      tag(ctx, api, 'request already dispatched', 480, 420, themeColors.blue, 680);
      tag(ctx, api, 'after-iteration usage check', 1430, 420, themeColors.yellow, 680);
      arrow(ctx, api, 870, 420, 1030, 420, themeColors.yellow);
      if (cueProgress(ctx, api, 'after-iteration')) {
        rectangle(ctx, api, 360, 620, 1200, 80, themeColors.panel);
        rectangle(ctx, api, 360, 620, 960, 80, themeColors.cyan);
        line(ctx, api, 1320, 590, 1320, 735, themeColors.pink, 4);
        contractText(
          ctx,
          api,
          'A retrospective check is not pre-call admission',
          960,
          810,
          35,
          themeColors.pink,
        );
      }
      if (cueComplete(ctx, api, 'unknown-cost'))
        contractText(
          ctx,
          api,
          'Unknown provider outcome keeps its reservation charged',
          960,
          945,
          32,
          themeColors.yellow,
        );
    }
    footer(
      ctx,
      api,
      'Pinned runtime contract · typed completion and factual verification remain separate',
    );
  });
}
export default {
  id: 'runtime-stop',
  draw: drawRuntimeStop,
  cues: [
    'strict-shape',
    'truthy-runtime',
    'iteration-fallback',
    'typed-breach',
    'after-iteration',
    'unknown-cost',
  ],
};
