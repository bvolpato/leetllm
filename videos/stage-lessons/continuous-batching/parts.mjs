// Shared cinematic palette, verified invariants, and 3D GPU execution wave primitives
// for the 20-scene Continuous Batching & Request Scheduling stage film.
import { arrow, circle, dot, group, line, rect, seq, surface } from 'vizmatic/stage';
import { REQUESTS } from '../../films/continuous-batching/fixtures.mjs';
import {
  freshBatchingBoundary,
  handoffTiming,
  highestPassingLoad,
  memorySnapshot,
  pageCount,
  prefillChunkSnapshot,
  schedule,
  scheduleSnapshot,
  serialCompletion,
  useful,
  validateModel,
} from '../../films/continuous-batching/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  REQUESTS,
  arrow,
  aura,
  cinematic3d,
  circle,
  dot,
  freshBatchingBoundary,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  handoffTiming,
  heroTitle,
  highestPassingLoad,
  line,
  memorySnapshot,
  orbitScene,
  pageCount,
  prefillChunkSnapshot,
  rect,
  schedule,
  scheduleSnapshot,
  seq,
  serialCompletion,
  surface,
  txt,
  useful,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  a: COSMOS.cyan,
  b: COSMOS.blue,
  c: COSMOS.violet,
  d: COSMOS.gold,
  e: COSMOS.emerald,
  prefill: COSMOS.amber,
  warn: COSMOS.rose,
  ok: COSMOS.emerald,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const REQ_COLOR = Object.freeze({
  A: ROLE.a,
  B: ROLE.b,
  C: ROLE.c,
  D: ROLE.d,
  E: ROLE.e,
});

export const FIXED_TRACE = schedule(false);
export const CONT_TRACE = schedule(true);
export const SERIAL_JOBS = [
  { id: 'Long (50)', steps: 50, color: ROLE.warn },
  { id: 'Quick (5)', steps: 5, color: ROLE.ok },
  { id: 'Med (20)', steps: 20, color: ROLE.a },
];
export const FCFS_RES = serialCompletion(SERIAL_JOBS, false);
export const SJF_RES = serialCompletion(SERIAL_JOBS, true);
export const HANDOFF = handoffTiming({
  prefillQueue: 20,
  prefill: 60,
  handoff: 40,
  decodeQueue: 15,
  nextDecode: 10,
});
export const LOAD_ROWS = [
  { rate: 2, attainment: 0.95 },
  { rate: 3, attainment: 0.92 },
  { rate: 4, attainment: 0.84 },
];
export const BEST_LOAD = highestPassingLoad(LOAD_ROWS, 0.9, 2);

export function verifyContinuousBatchingInvariants() {
  verifyInvariant(validateModel() === true, 'continuous-batching model validation passes');
  verifyInvariant(useful(FIXED_TRACE.slice(0, 6)) === 12, 'static 6 steps = 12 useful tokens');
  verifyInvariant(useful(CONT_TRACE.slice(0, 6)) === 18, 'continuous 6 steps = 18 useful tokens');
  verifyInvariant(FIXED_TRACE.length === 11, 'static 5 requests finish at tick 11');
  verifyInvariant(CONT_TRACE.length === 8, 'continuous 5 requests finish at tick 8');
  verifyApprox(FCFS_RES.mean, 60, 1e-9, 'FCFS mean finish 60');
  verifyApprox(SJF_RES.mean, 35, 1e-9, 'SJF mean finish 35');
  verifyInvariant(
    HANDOFF.early.ttft === 80 && HANDOFF.early.gap === 65,
    'early handoff 80 / 65 ms',
  );
  verifyInvariant(
    HANDOFF.buffered.ttft === 135 && HANDOFF.buffered.gap === 10,
    'buffered handoff 135 / 10 ms',
  );
  verifyApprox(BEST_LOAD.perGpu, 1.5, 1e-9, 'best passing load 1.5 req/s/GPU');
}

export function safeDur(c, startTime, desired = 0.65, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.65, margin = 0.44 } = {},
) {
  const info = c.cue(cueId);
  const startAt = (after ? info.end : info.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) {
    c.after(cueId, () => build(d), offset);
  } else {
    c.on(cueId, () => build(d), offset);
  }
  return d;
}

export function bindCueBeat(s, c, accentVal, cueIds, { after = false } = {}) {
  cueIds.forEach((cueId, idx) => {
    const target = (idx + 1) * 0.35;
    playCue(s, c, cueId, (d) => s.play(accentVal.to(target, { duration: d })), {
      after,
      dur: 0.32,
    });
  });
}

export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

export function chipPill(
  label,
  x,
  y,
  { w = 180, h = 66, color = ROLE.a, fill = '#10182d', size = 28, glow = 8, opacity = 1 } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: 2.6, radius: 12 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, COSMOS.ink, 'mono', 'center').opacity(opacity));
}

export function lumBar(
  x0,
  y,
  width,
  height,
  color,
  { opacity = 0.92, glow = 10, maxTrackW = 0 } = {},
) {
  const items = [];
  if (maxTrackW > 0) {
    items.push(
      rect(maxTrackW, height, { fill: '#12192e', stroke: '#253358', width: 1.5, radius: 6 })
        .at(x0 + maxTrackW * 0.5, y)
        .opacity(0.65 * opacity),
    );
  }
  const w = Math.max(4, width);
  const bar = rect(w, height, { fill: color, stroke: null, radius: 6 })
    .at(x0 + w * 0.5, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color).set('blend', 'screen');
  items.push(bar);
  if (w > 12) {
    items.push(
      glowDot(x0 + w, y, { radius: Math.min(7, height * 0.28), color, glow: glow + 2, opacity }),
    );
  }
  return group(...items);
}

/** Orbiting 3D GPU batch execution wave: static canyons vs continuous filled wave. */
export function buildBatchWave3d(refillVal, { x = 430, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.5,
    unit: 115,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const u = (px + 2.6) / 5.2;
      const v = (py + 2.1) / 4.2;
      const seat = Math.min(2, Math.floor(Math.max(0, v) * 3));
      const tick = Math.max(0, u) * 6;
      const staticActive = (seat === 0 && tick <= 2) || (seat === 1 && tick <= 4) || seat === 2;
      const fill = staticActive ? 1.0 : refillVal.value;
      const ripple = 0.16 * Math.sin(u * Math.PI * 6) * Math.cos(v * Math.PI * 3);
      return 0.12 + fill * (1.25 + ripple);
    },
    {
      x: [-2.6, 2.6],
      y: [-2.1, 2.1],
      resolution: [24, 18],
      colors: ['#141830', '#1d4d7c', '#5ce1e6', '#38d39f', '#ffd166'],
      opacity: 0.88,
      mesh: '#7ce8ff',
      meshOpacity: 0.24,
      meshWidth: 0.8,
      animate: true,
    },
  );

  const refillCage = wireframeSlab3d([0.55, -0.45, 0.92], 1.75, 0.9, 0.52, {
    color: COSMOS.gold,
    width: 2.8,
    glow: 9,
  });

  view.add(surf, ...refillCage);
  return view;
}
