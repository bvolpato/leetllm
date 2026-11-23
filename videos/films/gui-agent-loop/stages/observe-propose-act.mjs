import { retainedDrawCard, retainedDrawText } from '../defaults.mjs';
import { portalTrace } from '../model.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 2,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const steps = [
      api.focus.target('captured-observation', () =>
        retainedDrawCard(ctx, api, 'Observe\nframe 1', 105, 410, 360, themeColors.blue, 135, 28),
      ),
      api.focus.target('proposed-action', () =>
        retainedDrawCard(ctx, api, 'Propose\nopen run', 530, 410, 360, themeColors.cyan, 135, 28),
      ),
      api.focus.target('host-admission', () =>
        retainedDrawCard(
          ctx,
          api,
          'Check\nscope + target',
          955,
          410,
          360,
          themeColors.yellow,
          135,
          28,
        ),
      ),
      api.focus.target('fresh-observation', () =>
        retainedDrawCard(
          ctx,
          api,
          'Act + observe\nframe 2',
          1380,
          410,
          360,
          themeColors.green,
          135,
          28,
        ),
      ),
    ];
    steps
      .slice(0, -1)
      .forEach((shape, index) =>
        route(
          shape,
          steps[index + 1],
          [themeColors.cyan, themeColors.yellow, themeColors.green][index],
          index < beat ? 1 : q,
          index <= beat ? 1 : 0,
        ),
      );
    const trace = portalTrace();
    retainedDrawText(
      ctx,
      api,
      beat === 0
        ? 'Fresh browser session · restricted account'
        : beat === 1
          ? `Action result · ${trace.searched.decision}`
          : `Verified draft · ${trace.draft.state.draft}`,
      960,
      680,
      33,
      themeColors.ink,
      'center',
    );
  }
}
export function drawObserveProposeAct(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {};
  api.focus.target('observe-propose-act-construction', body);
}
export default {
  id: 'observe-propose-act',
  draw: drawObserveProposeAct,
  cues: [
    'observe-propose-act-b1-1',
    'observe-propose-act-b1-2',
    'observe-propose-act-b2-1',
    'observe-propose-act-b2-2',
    'observe-propose-act-b3-1',
  ],
};
