import { clamp, quadratic } from '../arithmetic.mjs';
import { finished } from '../construction.mjs';
import { data } from '../fixtures.mjs';
import { target, text } from '../defaults.mjs';

const last = data.at(-1);
const nextX = last.x + 1;
const forecast = quadratic(nextX);
const dialPeriod = 250;

function stopwatch(ctx, api, elapsed, stopped) {
  const { C } = api;
  const cx = 445,
    cy = 535,
    radius = 235;
  const onDial = (ms, r) => {
    const angle = (2 * Math.PI * ms) / dialPeriod - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  api.rect(ctx, cx - 17, cy - radius - 52, 34, 55, C.muted, null, 5);
  api.rect(ctx, cx - 55, cy - radius - 69, 110, 28, C.ink, null, 9);
  api.circle(ctx, cx, cy, radius, C.panel, C.ink, 7);
  for (let ms = 0; ms < dialPeriod; ms += 10) {
    const major = ms % 50 === 0;
    const outer = onDial(ms, radius - 15);
    const inner = onDial(ms, radius - (major ? 49 : 32));
    api.line(ctx, inner.x, inner.y, outer.x, outer.y, major ? C.ink : C.muted, major ? 6 : 3);
  }
  const arc = Array.from({ length: 80 }, (_, i) => onDial((elapsed * i) / 79, radius - 62));
  api.path(ctx, arc, { color: C.yellow, width: 11 });
  const tip = onDial(elapsed, radius - 62);
  api.line(ctx, cx, cy, tip.x, tip.y, C.yellow, 9);
  api.circle(ctx, cx, cy, 17, C.yellow);
  text(ctx, api, Math.floor(elapsed) + ' ms', cx, 879, 89, C.yellow, 'center');
  text(
    ctx,
    api,
    last.x * 100 + ' context tokens · ' + (stopped ? 'finished' : 'running'),
    cx,
    952,
    36,
    C.ink,
    'center',
  );
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const answerBeat = state.beat > 0;
  const stopTime = state.cues?.['clock-stops']?.end ?? 4.8;
  const progress = answerBeat ? 1 : clamp((state.t ?? 0) / stopTime);
  // The replay cuts in with the clock running. It lands on the measured time at the spoken stop.
  const elapsed = api.lerp(45, last.y, progress);
  const stopped = progress === 1;
  const showGap = answerBeat || finished(state, 'last-gap', 0.57);
  const showNextGap = answerBeat && finished(state, 'next-increase', 0.12);
  const showForecast = answerBeat && finished(state, 'next-time', 0.61);

  target(ctx, api, 'reply-clock', () => stopwatch(ctx, api, elapsed, stopped));
  text(ctx, api, 'Retrieved tokens', 860, 286, 34, C.muted);
  text(ctx, api, 'Reply time', 1405, 286, 34, C.muted, 'right');
  text(ctx, api, 'Added time', 1755, 286, 34, C.muted, 'right');
  api.line(ctx, 860, 318, 1755, 318, C.muted, 2);

  const yAt = (i) => 398 + i * 92;
  for (const [i, row] of data.entries()) {
    const latest = row === last;
    const y = yAt(i);
    text(ctx, api, String(row.x * 100), 860, y, 45, C.ink);
    const time = latest ? elapsed : row.y;
    const drawTime = () => {
      api.line(ctx, 1030, y - 14, 1030 + time, y - 14, C.yellow, 9);
      text(ctx, api, latest && !stopped ? '…' : row.y + ' ms', 1405, y, 43, C.yellow, 'right');
    };
    if (latest) target(ctx, api, 'latest-timing', drawTime);
    else drawTime();
  }

  target(ctx, api, 'added-time', () => {
    for (let i = 1; i < data.length; i++) {
      const gap = data[i].y - data[i - 1].y;
      const label = data[i] === last && !showGap ? '…' : '+' + gap + ' ms';
      text(ctx, api, label, 1755, yAt(i), 45, C.ink, 'right');
    }
  });
  const forecastY = yAt(data.length) + 20;
  api.line(ctx, 860, forecastY - 65, 1755, forecastY - 65, C.muted, 2);
  target(ctx, api, 'sixth-step', () => {
    text(ctx, api, nextX * 100 + ' forecast', 860, forecastY, 41, C.pink);
    text(ctx, api, showForecast ? forecast + ' ms' : '?', 1405, forecastY, 46, C.pink, 'right');
    text(
      ctx,
      api,
      showNextGap ? '+' + (forecast - last.y) + ' ms' : '?',
      1755,
      forecastY,
      46,
      C.pink,
      'right',
    );
  });
  text(ctx, api, 'Constructed timings for five assistant requests', 860, 986, 29, C.muted);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['clock-stops', 'last-gap', 'next-increase', 'next-time'],
};
