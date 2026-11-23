import {
  box,
  chapterCode,
  chapterLine,
  chapterText,
  footer,
  heading,
  table,
} from '../defaults.mjs';
export function drawMcpExposure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-mcp-exposure-mechanism', () => {
    heading(ctx, api, 'A remote payload and a local program cross different boundaries');
    if (currentBeat === 0) {
      box(
        ctx,
        api,
        'Host context',
        ['public release: R16', 'private note: retained locally'],
        150,
        400,
        720,
        themeColors.blue,
        160,
      );
      box(
        ctx,
        api,
        'Outbound arguments',
        resultComplete('mcp-outbound', 0) ? 'release_id: R16 only' : 'review actual sent fields',
        1050,
        400,
        680,
        themeColors.cyan,
        135,
      );
      if (resultComplete('mcp-outbound', 0))
        chapterLine(ctx, api, 900, 470, 1025, 470, themeColors.cyan, 3);
      box(
        ctx,
        api,
        'Remote returned text',
        'instruction to disclose private note stays untrusted',
        150,
        745,
        1580,
        themeColors.pink,
        120,
      );
    } else if (currentBeat === 1) {
      chapterCode(
        ctx,
        api,
        'Exact local command: approved-runtime server.mjs',
        150,
        430,
        30,
        themeColors.blue,
      );
      box(
        ctx,
        api,
        'Pre-execution review',
        resultComplete('mcp-command-approval', 1)
          ? 'user reviews command and authorizes launch'
          : 'no process started',
        150,
        610,
        1580,
        themeColors.yellow,
        140,
      );
      chapterText(
        ctx,
        api,
        'Restricted filesystem · network · process privileges',
        150,
        910,
        31,
        themeColors.cyan,
      );
    } else {
      table(
        ctx,
        api,
        ['token audience', 'server decision'],
        [
          [
            'server B token at server A',
            resultComplete('mcp-audience', 2)
              ? 'reject; no downstream forwarding'
              : 'verify audience first',
          ],
          ['server A scoped token', 'still check scope and actual resource'],
        ],
        150,
        450,
        [800, 800],
        170,
      );
      chapterText(
        ctx,
        api,
        'A trusted-looking tool description is not credential authority',
        150,
        920,
        31,
        themeColors.yellow,
      );
    }
    footer(
      ctx,
      api,
      'Illustrative disclosure and command boundaries. No token, secret or executable is sent or launched.',
    );
  });
}
export default {
  id: 'mcp-exposure',
  draw: drawMcpExposure,
  cues: [
    'tu-mcp-exposure-1',
    'tu-mcp-outbound',
    'tu-mcp-exposure-2',
    'tu-mcp-command-approval',
    'tu-mcp-exposure-3',
    'tu-mcp-audience',
  ],
};
