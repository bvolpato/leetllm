import { arrivalComparison } from '../model.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

function drawConversation(ctx, state, api) {
  const { C } = api;
  const t = state.t ?? 0;
  const reply = cueProgress(state.cues, 'desk-client', api.phase(t, 4, 5));
  const followUp = cueProgress(state.cues, 'desk-follow-up', api.phase(t, 5, 6));
  const send = api.phase(t, -0.4, 0.9);

  const bubble = (message, x, y, width, fill, ink, outgoing) => {
    api.rect(ctx, x, y, width, 118, fill, undefined, 40);
    const tip = outgoing ? x + width - 4 : x + 4;
    const inward = outgoing ? -1 : 1;
    api.path(
      ctx,
      [
        { x: tip + inward * 30, y: y + 96 },
        { x: tip - inward * 15, y: y + 119 },
        { x: tip + inward * 38, y: y + 113 },
      ],
      { fill, width: 0, closed: true },
    );
    text(ctx, api, message, x + width / 2, y + 78, 54, ink);
  };

  api.focus.target('desk-client', () => {
    text(ctx, api, 'Test client', 1530, 260, 36, C.cyan, 'right');
    bubble('Is checkout down?', 880 + 125 * send, 292, 525, C.cyan, C.bg, true);
    if (reply > 0) {
      text(ctx, api, 'Help desk', 390, 471, 36, C.pink, 'left');
      bubble('Yes.', 340 + 50 * reply, 500, 210, C.pink, C.bg, false);
    } else if (send === 1) {
      text(ctx, api, 'Help desk', 390, 471, 36, C.pink, 'left');
      api.rect(ctx, 390, 500, 210, 118, C.panel, C.pink, 40);
      for (let i = 0; i < 3; i++) {
        const lift = Math.max(0, Math.sin(t * 5 - i * 0.8));
        api.circle(ctx, 454 + i * 41, 562 - 11 * lift, 9, C.pink);
      }
    }
    const y = 772 - 114 * followUp;
    if (followUp === 0) {
      api.rect(ctx, 590, y, 940, 118, C.panel, C.muted, 38);
      text(ctx, api, 'Since when?', 641, y + 77, 49, C.ink, 'left');
      text(ctx, api, 'Draft', 1470, y + 75, 34, C.muted, 'right');
    } else {
      bubble('Since when?', 590 + 532 * followUp, y, 408, C.cyan, C.bg, true);
    }
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const time = state.t ?? 0;
  const chartStarted = state.cues?.['desk-slowdown']
    ? state.cues['desk-slowdown'].phase !== 'before'
    : time >= 7 || p >= 0.42;
  if (beat === 0 && !chartStarted) {
    ctx.save();
    if (time < 0.35) ctx.globalAlpha = 1;
    drawConversation(ctx, state, api);
    ctx.restore();
    return;
  }
  const slowdown = cueProgress(
    state.cues,
    'desk-slowdown',
    beat > 0 ? 1 : api.phase(p, 0.42, 0.65),
  );
  const traffic = arrivalComparison(slowdown);
  const x = (ms) => 500 + ms * 0.4;
  const inWindow = traffic.closed.filter((request) => request.start < traffic.horizon);
  const replay = cueProgress(
    state.cues,
    'desk-schedule',
    beat > 1 ? 1 : beat === 1 ? api.phase(p, 0.48, 0.88) : 0,
  );
  const openTime = replay * Math.max(...traffic.open.map((r) => r.end));
  const showCutoff = state.cues?.['desk-cutoff']
    ? state.cues['desk-cutoff'].phase === 'after'
    : beat > 1 || (beat === 1 && p >= 0.18);
  const labelCounts = state.cues?.['desk-count']
    ? state.cues['desk-count'].phase === 'after'
    : beat > 1 || (beat === 1 && p >= 0.28);
  const labelScheduled = state.cues?.['desk-six']
    ? state.cues['desk-six'].phase === 'after'
    : beat > 1 || (beat === 1 && p >= 0.9);
  const axis = (y) => {
    api.line(ctx, x(0), y, x(3000), y, C.muted, 2);
    for (const time of [0, 1000, 2000, 3000]) {
      api.line(ctx, x(time), y - 6, x(time), y + 6, C.muted, 2);
      text(ctx, api, time / 1000 + ' s', x(time), y + 38, 26, C.muted);
    }
  };
  const interval = (request, y, until) => {
    if (request.start > until) return;
    text(ctx, api, request.id, 411, y + 9, 25, C.muted);
    api.line(ctx, x(request.start), y, x(Math.min(request.end, until)), y, C.blue, 6);
    api.circle(ctx, x(request.start), y, 8, C.cyan);
    if (request.end <= until) api.circle(ctx, x(request.end), y, 7, C.pink);
  };

  text(ctx, api, 'Arrival window closes', x(traffic.horizon), 245, 32, C.yellow);
  api.line(ctx, x(traffic.horizon), 268, x(traffic.horizon), 578, C.yellow, 3);
  focus.target('desk-client', () => {
    text(ctx, api, 'One waiting client', 125, 345, 39, C.ink, 'left');
    const visible = showCutoff ? inWindow : traffic.closed.slice(0, 3);
    visible.forEach((r, i) => {
      const y = 405 + 30 * i;
      interval(r, y, i === 2 && !showCutoff ? r.start : Infinity);
      if (i) api.line(ctx, x(r.start), y - 30, x(r.start), y, C.pink, 3);
    });
    const next = traffic.closed[inWindow.length];
    if (next && showCutoff) {
      const y = 405 + 30 * inWindow.length;
      api.line(ctx, x(next.start), y - 30, x(next.start), y, C.pink, 3);
      text(ctx, api, next.id + ' next', x(next.start) + 18, y + 10, 28, C.pink, 'left');
    }
    if (!showCutoff) {
      const third = traffic.closed[2];
      text(
        ctx,
        api,
        'Reply 3 takes ' + (third.end - third.start) + ' ms',
        480,
        762,
        47,
        C.ink,
        'left',
      );
      text(ctx, api, 'Question 4 waits for that reply', 480, 851, 40, C.pink, 'left');
    }
    if (labelCounts)
      text(
        ctx,
        api,
        '2 s arrival window · ' + inWindow.length + ' sends',
        1335,
        345,
        31,
        C.cyan,
        'left',
      );
  });
  axis(585);

  if (showCutoff) {
    focus.target('desk-clock', () => {
      text(ctx, api, 'Help desk schedule', 125, 681, 39, C.ink, 'left');
      traffic.open.forEach((r, i) => {
        const y = 715 + 30 * i;
        api.line(ctx, x(r.start), y - 8, x(r.start), y + 8, C.muted, 3);
        if (replay > 0) interval(r, y, openTime);
      });
      if (labelScheduled)
        text(
          ctx,
          api,
          'same 2 s window · ' + traffic.open.length + ' sends',
          1335,
          681,
          31,
          C.cyan,
          'left',
        );
    });
    api.line(ctx, x(traffic.horizon), 688, x(traffic.horizon), 884, C.yellow, 3);
    axis(900);
  }
  text(ctx, api, 'Cyan marks a send. Pink marks the answer.', 960, 1012, 29, C.muted);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'desk-client',
    'desk-follow-up',
    'desk-slowdown',
    'desk-cutoff',
    'desk-count',
    'desk-schedule',
    'desk-six',
    'desk-replay',
  ],
};
