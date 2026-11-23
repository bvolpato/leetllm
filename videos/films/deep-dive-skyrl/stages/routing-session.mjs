import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawRoutingSession(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('routing-session', state),
    cueProgress = () => api.focus.progress(`sky-${'routing-session'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-routing-session-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Sticky routing retains one trajectory’s replica'
        : 'Control fan-out reaches the whole expected fleet',
    );
    const names = ['replica0', 'replica1', 'replica2'];
    drawSkyChapterBox(
      ctx,
      api,
      currentBeat ? 'pause / update control' : 'query-42_0 · X-Session-ID',
      570,
      355,
      780,
      100,
      themeColors.yellow,
      35,
    );
    names.forEach((v, i) => {
      const x = 180 + i * 570;
      drawSkyChapterBox(ctx, api, v, x, 690, 470, 110, i ? themeColors.cyan : themeColors.blue, 35);
      if (!currentBeat) {
        drawSkyChapterText(
          ctx,
          api,
          'initial load ' + [1, 3, 2][i],
          x + 235,
          865,
          30,
          themeColors.muted,
          'center',
        );
        if (i === 0) {
          drawSkyChapterArrow(ctx, api, 960, 480, x + 235, 655, themeColors.blue);
          if (done('sticky-route'))
            drawSkyChapterText(
              ctx,
              api,
              'Later turn: same route, even after load changes',
              960,
              945,
              31,
              themeColors.blue,
              'center',
            );
        }
      } else if (R('control-fanout') > i / 3) {
        drawSkyChapterArrow(ctx, api, 960, 480, x + 235, 655, themeColors.cyan);
        drawSkyChapterText(
          ctx,
          api,
          cueProgress() > (i + 1) / 4 ? 'ACK' : 'pending',
          x + 235,
          880,
          32,
          cueProgress() > (i + 1) / 4 ? themeColors.green : themeColors.yellow,
          'center',
        );
      }
    });
    drawSkyChapterFoot(
      ctx,
      api,
      currentBeat
        ? 'A single successful data-plane session cannot supply the other control receipts'
        : 'Route choice is an illustrative least-load fixture; no proxy server is running',
    );
  });
}
export default {
  id: 'routing-session',
  draw: drawRoutingSession,
  cues: [
    'sky-routing-session-b0',
    'sky-sticky-route',
    'sky-routing-session-b1',
    'sky-control-fanout',
  ],
};
