import { cell, cueProgress, line, requestIdentity, text } from '../defaults.mjs';
export function drawTopologyOwnership(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    requestIdentity(ctx, api);
    if (currentBeat < 2) {
      const handoff =
          currentBeat === 1 && cueProgress(ctx, api, 'handoff-active-control', q(1, 0.5, 0.7)) > 0,
        toolDone = !handoff && q(Math.min(currentBeat, 1)) > 0.35;
      text(
        ctx,
        api,
        handoff
          ? 'Handoff: active conversation moves'
          : 'Manager + specialist tool: manager retains conversation',
        960,
        365,
        35,
        themeColors.yellow,
        'center',
      );
      cell(
        ctx,
        api,
        'Vega manager',
        180,
        460,
        530,
        handoff ? themeColors.muted : themeColors.yellow,
        160,
      );
      cell(
        ctx,
        api,
        handoff ? 'release specialist' : 'health specialist',
        1210,
        460,
        530,
        handoff ? themeColors.yellow : themeColors.green,
        160,
      );
      line(ctx, api, 750, 540, 1170, 540, themeColors.muted, 4);
      const u = q(Math.min(currentBeat, 1)),
        x = 780 + 320 * u;
      cell(
        ctx,
        api,
        handoff ? 'active turn' : 'health question',
        x - 90,
        720,
        300,
        themeColors.blue,
        90,
      );
      if (toolDone)
        text(
          ctx,
          api,
          'bounded receipt → Vega continues',
          960,
          950,
          37,
          themeColors.green,
          'center',
        );
      if (handoff)
        text(
          ctx,
          api,
          'Receiver gets configured history and trusted scoped tools',
          960,
          950,
          34,
          themeColors.green,
          'center',
        );
    } else if (currentBeat === 2) {
      cell(ctx, api, 'Transferred history: deploy tenant9', 200, 400, 1520, themeColors.pink);
      text(
        ctx,
        api,
        'History supplies evidence; host policy builds capabilities',
        960,
        590,
        35,
        themeColors.yellow,
        'center',
      );
      cell(ctx, api, 'trusted scope: tenant7', 180, 700, 650, themeColors.blue);
      cell(ctx, api, 'generated argument: tenant9', 1090, 700, 650, themeColors.pink);
      text(
        ctx,
        api,
        'Validate after arguments exist → DENY transfer',
        960,
        975,
        40,
        themeColors.pink,
        'center',
      );
    } else {
      cell(ctx, api, 'read-only instruction in text', 180, 420, 650, themeColors.yellow);
      cell(ctx, api, 'runtime tools: lookup / inspect', 1090, 420, 650, themeColors.green);
      text(
        ctx,
        api,
        'No write credential or deploy tool crosses this boundary',
        960,
        690,
        37,
        themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        'Pin framework versions; test routing and typed-message contracts',
        960,
        930,
        33,
        themeColors.cyan,
        'center',
      );
    }
  };
  api.focus.target('topology-ownership-construction', body);
}
export default {
  id: 'topology-ownership',
  draw: drawTopologyOwnership,
  cues: [
    'topology-ownership-construct-0',
    'topology-ownership-construct-1',
    'handoff-active-control',
    'topology-ownership-construct-2',
    'topology-ownership-construct-3',
  ],
};
