import { recommend } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const ready = 4;
const next = recommend({ waiting: 36, running: 20, at: 2 }, 10, ready, 2).target;
const lowSince = 100;
const window = 300;
const limit = 20;

export function drawControllerBoundaries(ctx, scene, state, api) {
  const { C } = api;
  const low = afterClause(state, 'low-window', 1, 0.26);
  const before = cueProgress(state, 'still-low', 1, 0.32, 0.77);
  const drain = afterClause(state, 'drain-one', 2, 0.38);
  const target = afterClause(state, 'desired-twelve', 0, 0.65) ? next : 10;
  const now = lowSince + (drain ? window : Math.floor((window - 1) * before));
  const at = (s) => 162 + (s - lowSince) * 5.15;
  const cap = afterClause(state, 'upper-bound', 3, 0.83);
  const slots = cap ? limit : target;
  api.focus.target('replica-fleet', () => {
    const caption = cap
      ? 'New example  ·  200 requests with a 20-worker cap'
      : low
        ? 'All 12 workers ready when the quiet period starts'
        : '20 running + 36 waiting  ·  5 slots per replica';
    api.text(ctx, caption, 154, 270, 39, C.ink);
    const w = 1570 / (cap ? limit : next);
    for (let i = 0; i < slots; i++) {
      const draining = drain && !cap && i === next - 1;
      const color = cap ? C.blue : draining ? C.yellow : low || i < ready ? C.cyan : C.blue;
      api.rect(ctx, 160 + i * w, 365, w - 10, 103, C.panel, color, 5);
      api.text(ctx, String(i + 1), 160 + (i + 0.5) * w - 5, 432, 38, color, 'center');
    }
    api.text(
      ctx,
      cap
        ? '20 already desired'
        : drain
          ? '11 desired  ·  worker 12 draining'
          : low
            ? '12 ready'
            : ready + ' ready  ·  ' + (target - ready) + ' starting',
      158,
      542,
      36,
      C.ink,
    );
  });
  api.focus.target('low-clock', () => {
    if (!low || cap) {
      api.text(
        ctx,
        cap
          ? 'Enforce the queue limit while the fleet is at its cap'
          : 'Scale up on the fresh demand sample',
        960,
        780,
        40,
        C.ink,
        'center',
      );
      return;
    }
    api.text(ctx, 'Low demand on fresh samples', 161, 657, 36, C.ink);
    api.line(ctx, at(lowSince), 746, at(lowSince + window), 746, C.muted, 3);
    api.line(ctx, at(lowSince), 746, at(now), 746, C.cyan, 6);
    api.circle(ctx, at(now), 746, 11, C.cyan);
    api.text(ctx, '100 s', at(lowSince), 816, 32, C.muted);
    api.text(ctx, '400 s', at(lowSince + window), 816, 32, C.yellow, 'right');
    api.text(
      ctx,
      now + ' s on clock  ·  ' + (now - lowSince) + ' s of low demand',
      960,
      918,
      39,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'controller-boundaries',
  draw: drawControllerBoundaries,
  cues: ['desired-twelve', 'low-window', 'still-low', 'drain-one', 'upper-bound'],
};
