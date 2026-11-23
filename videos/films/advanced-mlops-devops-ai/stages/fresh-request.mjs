import { eastRequest, freshReleaseState, releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawFreshRequest(ctx, scene, state, api) {
  if (paintFreshRequest(ctx, scene, state, api)) return;
}
function paintFreshRequest(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'fresh-request', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('fresh-request-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    const s = freshReleaseState(state);
    drawReleaseHeading(ctx, api, 'New supplied us-east request · 14:00 · three-hour event age');
    if (currentBeat === 0) {
      const left = eastRequest.hour - eastRequest.maxAge;
      const x = (hour) => 455 + (hour - left) * 350;
      const stamp = (hour) =>
        Math.floor(hour) + ':' + String(Math.round((hour % 1) * 60)).padStart(2, '0');
      drawReleaseText(
        ctx,
        api,
        'Request',
        x(eastRequest.hour),
        365,
        34,
        themeColors.yellow,
        'center',
      );
      api.line(ctx, x(eastRequest.hour), 390, x(eastRequest.hour), 692, themeColors.yellow, 4);
      for (const [i, row] of eastRequest.readings.entries()) {
        const y = 465 + i * 158;
        api.line(ctx, x(left), y, x(14.5), y, themeColors.muted, 2);
        const progress = cueProgress(0, i + 1);
        if (progress === 0) continue;
        drawReleaseText(
          ctx,
          api,
          '[' + row.vector.join(', ') + ']',
          180,
          y + 15,
          48,
          themeColors.blue,
        );
        const eventX = x(row.event),
          arrivalX = x(row.available);
        api.line(ctx, eventX, y, eventX + (arrivalX - eventX) * progress, y, themeColors.cyan, 7);
        api.circle(ctx, eventX, y, 9, themeColors.blue);
        drawReleaseText(
          ctx,
          api,
          stamp(row.event) + ' event',
          eventX - 20,
          y + 56,
          31,
          themeColors.ink,
          'right',
        );
        if (progress === 1) {
          api.circle(ctx, arrivalX, y, 10, themeColors.cyan);
          drawReleaseText(
            ctx,
            api,
            stamp(row.available) + ' available',
            arrivalX + 12,
            y - 34,
            31,
            themeColors.cyan,
            row.available > eastRequest.hour ? 'left' : 'center',
          );
        }
      }
      for (const hour of [11, 12, 13, 14])
        drawReleaseText(ctx, api, stamp(hour), x(hour), 751, 28, themeColors.muted, 'center');
      if (cueProgress(0, 3) > 0)
        drawReleaseText(
          ctx,
          api,
          'offline L2 · online none · fixed w = [0.5, 0.5]',
          960,
          835,
          34,
          themeColors.yellow,
          'center',
        );
      if (cueProgress(0, 4) > 0)
        drawReleaseText(
          ctx,
          api,
          'Which vector is eligible? What scores do the two paths produce?',
          960,
          970,
          39,
          themeColors.yellow,
          'center',
        );
    } else {
      const plot = teaching.axes({
          x: 230,
          y: 350,
          width: 570,
          height: 570,
          equalUnits: true,
          xDomain: [-4, 1],
          yDomain: [-1, 4],
          xTicks: [-4, -2, 0],
          yTicks: [0, 2, 4],
          fontSize: 25,
        }),
        origin = plot.point(0, 0);
      if (s.reveal) {
        const raw = plot.point(...s.raw);
        drawReleaseArrow(ctx, api, origin.x, origin.y, raw.x, raw.y, themeColors.muted, 4);
        drawReleaseText(
          ctx,
          api,
          'eligible [-3, 4]',
          raw.x + 60,
          raw.y - 30,
          27,
          themeColors.muted,
        );
        const online = plot.point(...s.online);
        drawReleaseArrow(ctx, api, origin.x, origin.y, online.x, online.y, themeColors.pink, 5);
      }
      if (s.unit) {
        const end = plot.point(...s.normalized);
        drawReleaseArrow(ctx, api, origin.x, origin.y, end.x, end.y, themeColors.green, 5);
        drawReleaseText(ctx, api, 'L2 [-.6, .8]', end.x + 110, end.y - 50, 29, themeColors.green);
        if (s.offlineReady)
          drawReleaseText(
            ctx,
            api,
            'offline score ' + s.offlineScore.toFixed(2),
            1330,
            490,
            42,
            themeColors.green,
            'center',
          );
        if (s.onlineReady)
          drawReleaseText(
            ctx,
            api,
            'online score ' + s.onlineScore.toFixed(2),
            1330,
            650,
            42,
            s.parity ? themeColors.green : themeColors.pink,
            'center',
          );
      }
      if (s.decisionReady || currentBeat > 1)
        drawReleaseBox(
          ctx,
          api,
          currentBeat === 2
            ? s.repairReady
              ? 'Fixture parity repaired'
              : 'Replay in progress'
            : 'HOLD · computed parity fails',
          960,
          790,
          760,
          110,
          currentBeat === 2
            ? s.repairReady
              ? themeColors.green
              : themeColors.yellow
            : themeColors.pink,
          34,
        );
      drawReleaseFooter(
        ctx,
        api,
        currentBeat > 1 || resultComplete(1, 2)
          ? 'The 14:10 correction remains unavailable to the unchanged 14:00 request'
          : 'Request time stays 14:00 during this replay',
      );
    }
  }
}
export default {
  id: 'fresh-request',
  draw: drawFreshRequest,
  cues: [
    'fresh-request-b1',
    'fresh-request-s0-0',
    'fresh-request-s0-1',
    'fresh-request-s0-2',
    'fresh-request-s0-3',
    'fresh-request-s0-4',
    'fresh-request-b2',
    'fresh-request-s1-0',
    'fresh-request-s1-1',
    'fresh-request-s1-2',
    'fresh-request-s1-3',
    'fresh-request-s1-4',
    'fresh-request-s1-5',
    'fresh-request-s1-6',
    'fresh-request-s1-7',
    'fresh-request-b3',
    'fresh-request-s2-0',
    'fresh-request-s2-1',
    'fresh-request-s2-2',
    'fresh-request-s2-3',
  ],
};
