import { line, portalPanel, readoutCell, taskHeader, text } from '../defaults.mjs';
export function drawAdapterRuntime(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    taskHeader(ctx, api);
    if (currentBeat === 0) {
      readoutCell(
        ctx,
        api,
        'call42 · generated proposal complete',
        170,
        410,
        1580,
        themeColors.yellow,
      );
      readoutCell(ctx, api, 'host dispatch: pending', 170, 610, 1580, themeColors.muted);
      text(
        ctx,
        api,
        'Model + action schema + adapter + coordinate contract must agree',
        960,
        850,
        32,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Conversation continuation does not reconstruct a lost browser session',
        960,
        1010,
        31,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      const n = Math.min(1, Math.floor(q(1) * 2));
      text(
        ctx,
        api,
        'Separately authorized write workflow · ordered batch',
        960,
        365,
        35,
        themeColors.yellow,
        'center',
      );
      [
        ['1 read traceback', n >= 1 ? 'executed' : 'pending', themeColors.blue],
        ['2 deploy effect', 'required approval absent → PAUSE', themeColors.pink],
        ['3 scroll', 'unexecuted', themeColors.muted],
      ].forEach(([v, result, col], i) => {
        const y = 465 + i * 175;
        readoutCell(ctx, api, v, 180, y, 650, col);
        readoutCell(ctx, api, result, 1090, y, 650, col);
        line(ctx, api, 850, y + 50, 1070, y + 50, themeColors.muted, 3);
      });
    } else if (currentBeat === 2) {
      readoutCell(
        ctx,
        api,
        'provider confirmation / acknowledgement',
        180,
        420,
        1560,
        themeColors.yellow,
      );
      readoutCell(
        ctx,
        api,
        'application permission for this effect',
        180,
        640,
        1560,
        themeColors.pink,
      );
      text(
        ctx,
        api,
        'Both required gates must pass; a detector or acknowledgement grants no capability',
        960,
        925,
        31,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Isolate the generated-code executor and its reachable tools',
        960,
        1020,
        33,
        themeColors.green,
        'center',
      );
    } else {
      portalPanel(ctx, api, 160, 390, 750, 8);
      readoutCell(ctx, api, 'browser protocol → CSS viewport', 1040, 430, 720, themeColors.blue);
      readoutCell(
        ctx,
        api,
        'native input → display / focus / permission',
        1040,
        650,
        720,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        'Headless browser can capture pixels without an X11 desktop',
        960,
        955,
        32,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Wait for the task’s visible state; keep fonts, viewport and scale reproducible',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
  };
  api.focus.target('adapter-runtime-construction', body);
}
export default {
  id: 'adapter-runtime',
  draw: drawAdapterRuntime,
  cues: [
    'adapter-runtime-construct-0',
    'adapter-runtime-construct-1',
    'adapter-runtime-construct-2',
    'adapter-runtime-construct-3',
  ],
};
