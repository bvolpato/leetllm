import { drawOriginalCard, drawOriginalLink } from '../defaults.mjs';
export function drawReadVsAction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9);
  {
    const grant = api.focus.target('read-grant', () =>
        drawOriginalCard(ctx, api, 'Read grant', 180, 380, 400, themeColors.green, 1, 100),
      ),
      evidence = drawOriginalCard(
        ctx,
        api,
        'Runbook evidence',
        765,
        380,
        440,
        themeColors.cyan,
        phaseForBeat(0),
        100,
      ),
      tool = drawOriginalCard(
        ctx,
        api,
        'Deploy tool held',
        1390,
        380,
        370,
        themeColors.pink,
        phaseForBeat(2),
        100,
        31,
      );
    drawOriginalLink(ctx, api, grant, evidence, phaseForBeat(0), themeColors.green);
    drawOriginalLink(ctx, api, evidence, tool, phaseForBeat(2), themeColors.pink);
    const request = api.focus.target('operation-contract', () =>
        drawOriginalCard(
          ctx,
          api,
          'Operation · target · arguments',
          530,
          650,
          850,
          themeColors.yellow,
          Math.max(phaseForBeat(1), Number(api.focus.progress('read-vs-action-b2-1', 0) > 0)),
          95,
        ),
      ),
      action = api.focus.target('action-hold', () =>
        drawOriginalCard(
          ctx,
          api,
          'Action grant missing → hold',
          600,
          815,
          720,
          themeColors.pink,
          phaseForBeat(2),
          80,
          30,
        ),
      );
    drawOriginalLink(ctx, api, request, action, phaseForBeat(2), themeColors.pink);
  }
}
export default {
  id: 'read-vs-action',
  draw: drawReadVsAction,
  cues: ['read-vs-action-b1-1', 'read-vs-action-b2-1', 'read-vs-action-b3-1'],
};
