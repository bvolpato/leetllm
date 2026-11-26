// Shared cinematic palette, verified math invariants, and 3D GPU/clock primitives
// for the 14-scene Inference Clocks (TTFT, TPOT, Roofline & KV Admission) stage film.
import {
  arrow,
  circle,
  dot,
  group,
  line,
  line3d,
  parametricSurface,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  capacityFixture,
  deliveryState,
  metrics,
} from '../../films/inference-clocks/arithmetic.mjs';
import {
  alternateServerTimes,
  outputs,
  prompt,
  replyBTimes,
  tokenTimes,
} from '../../films/inference-clocks/fixtures.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  alternateServerTimes,
  arrow,
  aura,
  capacityFixture,
  cinematic3d,
  circle,
  deliveryState,
  dot,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  metricReadout,
  metrics,
  orbitScene,
  outputs,
  parametricSurface,
  prompt,
  rect,
  replyBTimes,
  rule,
  seq,
  tokenTimes,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  clockA: COSMOS.cyan,
  clockB: COSMOS.violet,
  prefill: COSMOS.blue,
  decode: COSMOS.emerald,
  wait: COSMOS.gold,
  stall: COSMOS.rose,
  network: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const METRICS_A = metrics(0, tokenTimes);
export const METRICS_B = metrics(0, replyBTimes);
export const CAP = capacityFixture();
export const FINAL_WORKER_TIMES = Object.freeze([410, 452, 495, 542]);
export const FINAL_WORKER_METRICS = metrics(0, FINAL_WORKER_TIMES);

export function verifyInferenceClocksInvariants() {
  verifyInvariant(METRICS_A.ttft === 320 && METRICS_B.ttft === 80, 'TTFT A=320ms, B=80ms');
  verifyApprox(METRICS_A.tpot, 36, 1e-9, 'TPOT A = 36ms');
  verifyApprox(METRICS_B.tpot, 116, 1e-9, 'TPOT B = 116ms');
  verifyApprox(METRICS_A.decodeTps, 1000 / 36, 1e-6, 'decode TPS A ~ 27.78');
  verifyApprox(METRICS_A.endToEndTps, 4000 / 428, 1e-6, 'end-to-end TPS A ~ 9.35');
  verifyApprox(METRICS_A.endToEndTps, METRICS_B.endToEndTps, 1e-9, 'equal end-to-end TPS');
  verifyInvariant(CAP.perToken === 65536, '64 KiB per position');
  verifyApprox((4096 * CAP.perToken) / 1024 ** 3, 0.25, 1e-9, '4096 pos = 0.25 GiB');
  verifyApprox(CAP.existing / 1e9, 10.7374, 0.01, '40 live requests ~ 10.74 GB');
  verifyApprox(CAP.small / 1e9, 11.811, 0.01, 'small reservation ~ 11.81 GB');
  verifyApprox(CAP.large / 1e9, 15.032, 0.01, 'large reservation ~ 15.03 GB');
  verifyInvariant(
    CAP.kvOnly.counts[0] === 53 && CAP.kvOnly.counts[1] === 107,
    'FP16=53, FP8=107 users',
  );
  verifyInvariant(
    Math.floor(CAP.hybrid.pool / (CAP.hybrid.recurrent + CAP.hybrid.kv)) === 53 &&
      Math.floor(CAP.hybrid.pool / (CAP.hybrid.recurrent + CAP.hybrid.kv / 2)) === 55,
    'hybrid 53 -> 55 chats',
  );
  verifyInvariant(FINAL_WORKER_METRICS.ttft === 410, 'final worker TTFT 410ms');
  verifyInvariant(Math.max(...FINAL_WORKER_METRICS.gaps) === 47, 'final worker max gap 47ms');
  verifyApprox(FINAL_WORKER_METRICS.tpot, 44, 1e-9, 'final worker mean gap 44ms');
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
  { w = 160, h = 66, color = ROLE.clockA, fill = '#10182d', size = 30, glow = 8, opacity = 1 } = {},
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

/** Orbiting 3D roofline performance surface (intensity x batch rows -> attainable throughput). */
export function buildRoofline3d(rowsVal, { x = 350, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.5],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const intensity = 1 + u * 35; // 1 .. 36 ops/byte
      const roof = Math.min(200, 10 * intensity); // ridge at 20
      const z = (roof / 200) * 2.1 + 0.15 * Math.sin(v * Math.PI);
      return [(u - 0.5) * 5.2, (v - 0.5) * 4.4, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 12],
      colors: ['#132044', '#1d568c', '#5ce1e6', '#6ee7b7', '#ffd166'],
      opacity: 0.86,
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.7,
    },
  );

  const probeCage = wireframeSlab3d(
    () => {
      const r = Math.max(1, Math.min(32, rowsVal.value));
      const u = (r - 1) / 35;
      const z = (Math.min(200, 10 * r) / 200) * 2.1;
      return [(u - 0.5) * 5.2, 0, z * 0.55 + 0.35];
    },
    0.26,
    2.25,
    0.55,
    { color: COSMOS.gold, width: 2.8, glow: 9 },
  );

  view.add(surf, ...probeCage);
  return view;
}

/** Orbiting 3D KV-cache tensor slab growing along the history axis. */
export function buildKvStack3d(depthFracVal, { x = 350, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.75,
    phi: 1.02,
    distance: 15.0,
    unit: 110,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const len = Math.max(0.08, depthFracVal.value);
      const sx = (u - 0.5) * 5.0 * len;
      const sy = (v - 0.5) * 4.4;
      const z = 0.35 + 1.15 * (0.6 + 0.4 * Math.cos(v * 6));
      return [sx, sy, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 14],
      colors: ['#122042', '#264b8a', '#5ce1e6', '#6ee7b7'],
      opacity: 0.85,
      mesh: '#ffffff',
      meshOpacity: 0.16,
      meshWidth: 0.7,
      animate: true,
    },
  );

  view.add(surf);
  return view;
}
