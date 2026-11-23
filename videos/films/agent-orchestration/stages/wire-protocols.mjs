import { cell, line, requestIdentity, text } from '../defaults.mjs';
export function drawWireProtocols(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    requestIdentity(ctx, api);
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Framework schedules this release workflow',
        960,
        365,
        37,
        themeColors.yellow,
        'center',
      );
      cell(ctx, api, 'MCP deployment lookup', 180, 470, 650, themeColors.blue, 140);
      cell(ctx, api, 'A2A vendor investigator', 1090, 470, 650, themeColors.green, 140);
      text(ctx, api, 'tool / resource / prompt server', 505, 740, 32, themeColors.blue, 'center');
      text(
        ctx,
        api,
        'independent agent / discovery / task',
        1415,
        740,
        29,
        themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        'Both boundaries can cross processes',
        960,
        975,
        36,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const n = Math.max(1, Math.ceil(q(1) * 3));
      text(
        ctx,
        api,
        'Duration does not select the protocol',
        960,
        365,
        39,
        themeColors.yellow,
        'center',
      );
      [
        ['lookup release r17', 'capability result'],
        ['investigate release-17', 'taskV8 · progress + outputs'],
        ['direct status message', 'reply; task creation not required'],
      ]
        .slice(0, n)
        .forEach((r, i) => {
          const y = 455 + i * 170;
          cell(ctx, api, r[0], 180, y, 650, themeColors.blue);
          cell(ctx, api, r[1], 1090, y, 650, themeColors.green);
          line(ctx, api, 850, y + 50, 1070, y + 50, themeColors.muted, 3);
        });
    } else {
      cell(ctx, api, 'taskV8 status: completed', 180, 400, 650, themeColors.green);
      cell(ctx, api, 'artifact: rollout findings', 1090, 400, 650, themeColors.blue);
      text(
        ctx,
        api,
        'Correctness and durable retention still need evidence',
        960,
        670,
        35,
        themeColors.yellow,
        'center',
      );
      cell(ctx, api, 'transcript: shift traffic 25%', 220, 785, 1480, themeColors.pink);
      text(
        ctx,
        api,
        'Credentials + application policy govern the final effect',
        960,
        1010,
        35,
        themeColors.green,
        'center',
      );
    }
  };
  api.focus.target('wire-protocols-construction', body);
}
export default {
  id: 'wire-protocols',
  draw: drawWireProtocols,
  cues: ['wire-protocols-construct-0', 'wire-protocols-construct-1', 'wire-protocols-construct-2'],
};
