// Shared math models, invariants, and 3D/vector cinema helpers for Knowledge Distillation for LLMs.
import { entropy, stableSoftmax } from 'vizmatic';
import {
  Node,
  circle,
  curve3d,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  surface,
} from 'vizmatic/stage';
import { kl } from '../../films/distillation/arithmetic.mjs';
import {
  INITIAL,
  LEARNING_CUES,
  POLICY_CASES,
  POLICY_REPLIES,
  POLICY_STUDENT,
  POLICY_TEACHER,
  RELEASE_CANDIDATES,
  RELEASE_LIMITS,
  TEACHER,
  WORDS,
} from '../../films/distillation/fixtures.mjs';
import {
  jointFixture,
  learningSnapshot,
  objectiveSnapshot,
  policySelection,
  prefixSnapshot,
  projectionFixture,
  releaseChecks,
  studentTrace,
} from '../../films/distillation/model.mjs';
import { validateModel } from '../../films/distillation/validation.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export const TEACHER_PROBS = Object.freeze(stableSoftmax(TEACHER));
export const STUDENT_INIT_PROBS = Object.freeze(stableSoftmax(INITIAL));
export const HARD_TARGET = Object.freeze([1, 0, 0, 0]);
export const TRACE_40 = Object.freeze(studentTrace(40));
export const JOINT = Object.freeze(jointFixture());
export const POLICY_ROWS = Object.freeze(policySelection());
export const OBJ_TERMS = Object.freeze(
  TEACHER_PROBS.map((q, i) => q * Math.log(q / STUDENT_INIT_PROBS[i])),
);
export const OBJ_KL = kl(TEACHER_PROBS, STUDENT_INIT_PROBS);

export const TEMP_GRAD_TEACHER = Object.freeze([2, 0]);
export const TEMP_GRAD_STUDENT = Object.freeze([0, 2]);
export function tempGradRow(T) {
  const q = stableSoftmax(TEMP_GRAD_TEACHER, T)[0];
  const p = stableSoftmax(TEMP_GRAD_STUDENT, T)[0];
  return { T, q, p, raw: (p - q) / T, scaled: T * (p - q) };
}
export const TEMP_GRAD_1 = Object.freeze(tempGradRow(1));
export const TEMP_GRAD_4 = Object.freeze(tempGradRow(4));
export const TEMP_GRAD_40 = Object.freeze(tempGradRow(40));

export const BIMODAL_TEACHER = Object.freeze([0.49, 0.02, 0.49]);
export const BIMODAL_CANDIDATES = Object.freeze([
  Object.freeze([0.98, 0.01, 0.01]),
  Object.freeze([0.25, 0.5, 0.25]),
  Object.freeze([0.01, 0.01, 0.98]),
]);
export const BIMODAL_FWD = Object.freeze(
  BIMODAL_CANDIDATES.map((cand) => kl(BIMODAL_TEACHER, cand)),
);
export const BIMODAL_REV = Object.freeze(
  BIMODAL_CANDIDATES.map((cand) => kl(cand, BIMODAL_TEACHER)),
);

export const CACHE_TEACHER = Object.freeze([0.45, 0.45, 0.1]);
export const CACHE_STUDENT = Object.freeze([0.05, 0.05, 0.9]);
export const CACHE_COND_T = Object.freeze([0.5, 0.5]);
export const CACHE_COND_S = Object.freeze([0.5, 0.5]);
export const CACHE_FULL_KL = kl(CACHE_TEACHER, CACHE_STUDENT);

export const CAPACITY_SLICES = Object.freeze([
  Object.freeze({ name: 'Familiar type', student: 94, teacher: 95, gap: 1 }),
  Object.freeze({ name: 'Fresh wording', student: 71, teacher: 91, gap: 20 }),
  Object.freeze({ name: 'New subject', student: 53, teacher: 86, gap: 33 }),
]);

export const FRESH_WORDS = Object.freeze(['gate', 'garden', 'tree']);
export const FRESH_Q = Object.freeze([0.2, 0.5, 0.3]);
export const FRESH_BEFORE = Object.freeze(stableSoftmax([0, 0, 0]));
export const FRESH_LOGITS = Object.freeze(FRESH_Q.map((q, i) => 0.6 * (q - FRESH_BEFORE[i])));
export const FRESH_AFTER = Object.freeze(stableSoftmax(FRESH_LOGITS));

export const RELEASE_EVAL = Object.freeze(
  RELEASE_CANDIDATES.map((cand) => {
    const checks = releaseChecks(cand);
    return Object.freeze({
      ...cand,
      checks,
      passAll: Object.values(checks).every(Boolean),
    });
  }),
);

/** Build-time mathematical verification of every spoken identity in distillation. */
export function verifyDistillationInvariants() {
  verifyInvariant(validateModel() === true, 'distillation validateModel() must pass');
  verifyApprox(POLICY_STUDENT[0] - POLICY_TEACHER[0], 0, 1e-12, 'intro zero gap');
  verifyApprox(TEACHER_PROBS[0], 0.487323, 1e-4, 'teacher bird prob');
  verifyApprox(TEACHER_PROBS[1], 0.267449, 1e-4, 'teacher dog prob');
  verifyApprox(TEACHER_PROBS[2], 0.179276, 1e-4, 'teacher cat prob');
  verifyApprox(TEACHER_PROBS[3], 0.065952, 1e-4, 'teacher tree prob');
  verifyApprox(STUDENT_INIT_PROBS[2], 0.595825, 1e-4, 'student cat prob');
  verifyApprox(OBJ_KL, kl(TEACHER_PROBS, STUDENT_INIT_PROBS), 1e-12, 'forward KL sum');
  verifyInvariant(OBJ_TERMS[0] > 0 && OBJ_TERMS[2] < 0, 'signed KL contributions');
  verifyApprox(TEMP_GRAD_1.scaled, -0.7616, 1e-3, 'T=1 scaled grad');
  verifyApprox(TEMP_GRAD_4.scaled, -0.9797, 1e-3, 'T=4 scaled grad');
  verifyApprox(TEMP_GRAD_40.scaled, -0.9998, 1e-3, 'T=40 scaled grad approaches -1');
  verifyApprox((1 * 0.2 + 3 * 0.8) / 4, 0.65, 1e-12, 'global token mean 0.65');
  verifyApprox((0.2 + 0.8) / 2, 0.5, 1e-12, 'unweighted batch mean 0.50');
  verifyApprox(projectionFixture(0).sse, 2, 1e-12, 'projection initial SSE 2');
  verifyApprox(projectionFixture(1).sse, 0, 1e-12, 'projection updated SSE 0');
  verifyApprox(projectionFixture(1, true).output[1], 1.8, 1e-12, 'projection fresh mid 1.8');
  verifyApprox(projectionFixture(1, true).sse, 1.48, 1e-12, 'projection fresh SSE 1.48');
  verifyInvariant(kl([0.5, 0.5], [1, 0]) === Infinity, 'zero-mass forward KL infinite');
  verifyApprox(kl([1, 0], [0.5, 0.5]), Math.log(2), 1e-12, 'zero-mass reverse KL ln 2');
  verifyInvariant(
    BIMODAL_FWD[1] < BIMODAL_FWD[0] && BIMODAL_REV[0] < BIMODAL_REV[1],
    'forward picks center, reverse picks side',
  );
  verifyApprox(JOINT.forward, 0.5055, 1e-3, 'joint forward sequence KL');
  verifyApprox(JOINT.reverse, 0.5309, 1e-3, 'joint reverse sequence KL');
  const uniformFwd = JOINT.first + 0.5 * (JOINT.conditional[0] + JOINT.conditional[1]);
  verifyApprox(uniformFwd, 0.4225, 1e-3, 'uniform-weight forward KL');
  verifyApprox(kl(CACHE_COND_T, CACHE_COND_S), 0, 1e-12, 'truncated top-2 KL is 0');
  verifyApprox(CACHE_FULL_KL, 1.758, 1e-3, 'full cache forward KL 1.758');
  verifyApprox((10000 * 50000 * 2) / 1e9, 1.0, 1e-12, 'dense cache 1.0 GB');
  verifyInvariant(
    POLICY_ROWS[0].outcome === 'keep' &&
      POLICY_ROWS[1].outcome === 'skip' &&
      POLICY_ROWS[2].outcome === 'reject',
    'policy dataset gates keep/skip/reject',
  );
  verifyApprox(FRESH_LOGITS[0], -0.08, 1e-12, 'fresh logit gate');
  verifyApprox(FRESH_LOGITS[1], 0.1, 1e-12, 'fresh logit garden');
  verifyApprox(FRESH_LOGITS[2], -0.02, 1e-12, 'fresh logit tree');
  verifyApprox(FRESH_AFTER[0], 0.307, 1e-3, 'fresh prob gate');
  verifyApprox(FRESH_AFTER[1], 0.367, 1e-3, 'fresh prob garden');
  verifyApprox(FRESH_AFTER[2], 0.326, 1e-3, 'fresh prob tree');
  verifyInvariant(
    RELEASE_EVAL[0].passAll === false && RELEASE_EVAL[1].passAll === true,
    'only Birch passes all four release gates',
  );
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function remainAfterDuration(c, cueId, maxDur = 1.2, endMargin = 0.45) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

export function glowingArc(p0, p1, liftY, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.78) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: edgeColor, width: 2.2, glow: 6 },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Crisp geometric expired key emblem for intro and final callback. */
export function keyEmblem(cx, cy, color = COSMOS.gold) {
  return group(
    circle(32, { fill: '#19140a', stroke: color, width: 10 })
      .at(cx - 56, cy)
      .glow(7, color),
    rect(112, 16, { fill: color, stroke: null, radius: 5 })
      .at(cx + 26, cy)
      .glow(5, color),
    rect(14, 28, { fill: color, stroke: null, radius: 3 }).at(cx + 48, cy + 16),
    rect(14, 20, { fill: color, stroke: null, radius: 3 }).at(cx + 72, cy + 12),
  );
}

/** Orbiting 3D Teacher-to-Student logit probability towers with dark-knowledge photon streams. */
export function buildDistillTowers3d(
  phaseVal,
  {
    x = 460,
    y = 30,
    teacherVals = [0.9, 0.1],
    studentVals = [0.9, 0.1],
    unit = 96,
    streamColor = COSMOS.gold,
  } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-2.4, 2.4],
    y: [-1.8, 1.8],
    z: 0,
    step: 0.8,
    color: '#223052',
    opacity: 0.42,
  });

  const n = teacherVals.length;
  const pillars = [];
  for (let i = 0; i < n; i++) {
    const px = n === 2 ? -0.95 + i * 1.9 : -1.8 + i * 1.2;
    const w = n === 2 ? 0.72 : 0.56;
    const th = Math.max(0.18, teacherVals[i] * 2.1);
    const sh = Math.max(0.18, studentVals[i] * 2.1);
    pillars.push(
      ...box3d(px - w * 0.5, -1.05, 0, w, 0.7, th, '#132a52', COSMOS.blue, 0.84),
      ...box3d(px - w * 0.5, 0.35, 0, w, 0.7, sh, '#0d3645', COSMOS.cyan, 0.84),
    );
  }

  const stream = curve3d(
    (t) => {
      const sy = -0.7 + t * 1.4;
      const sx = -0.95 + 0.22 * Math.sin(t * Math.PI * 2 + phaseVal.value * 0.8);
      const sz =
        Math.max(0.3, teacherVals[0] * 2.1) * (1 - t) +
        Math.max(0.3, studentVals[0] * 2.1) * t +
        0.42 * Math.sin(Math.PI * t);
      return [sx, sy, sz];
    },
    0,
    1,
    { color: streamColor, width: 3.4, glow: 9, samples: 34, onTop: true },
  );

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const px = n === 2 ? -0.95 + i * 1.9 : -1.8 + i * 1.2;
        const frac = (p * 0.42 + i * 0.31) % 1;
        const th = Math.max(0.25, teacherVals[i] * 2.1);
        const sh = Math.max(0.25, studentVals[i] * 2.1);
        pts.push([
          px,
          -0.7 + frac * 1.4,
          th * (1 - frac) + sh * frac + 0.38 * Math.sin(Math.PI * frac),
        ]);
      }
      return pts;
    },
    {
      colorAt: (idx) => (idx === 0 ? streamColor : COSMOS.cyan),
      radius: 6.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...pillars, stream, photons);
  return view;
}

/** Orbiting 3D Temperature-flattening softmax surface converging onto z = 0.25 uniform plane. */
export function buildTempLandscape3d(phaseVal, tempVal, { x = 470, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.04,
    distance: 15.6,
    unit: 96,
    focus: [0, 0, 0.5],
  }).at(x, y);

  // u in [0, 3] interpolates across the 4 teacher logits; v in [0, 1] sweeps T from 1 to 16
  const surf = parametricSurface(
    (u, v) => {
      const T = 1 + v * 15;
      const probs = stableSoftmax(TEACHER, T);
      const idx = Math.min(2.999, Math.max(0, u * 3));
      const i0 = Math.floor(idx);
      const frac = idx - i0;
      const p = probs[i0] * (1 - frac) + probs[Math.min(3, i0 + 1)] * frac;
      return [-1.8 + u * 3.6, -1.6 + v * 3.2, p * 3.1];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [24, 24],
      colors: ['#13244b', '#1d4d82', '#2f82b5', '#5ce1e6', '#ffd166'],
      mesh: '#80d8ff',
      meshOpacity: 0.24,
      meshWidth: 0.7,
      opacity: 0.86,
    },
  );

  // Uniform limit plane at p = 0.25 -> z = 0.25 * 3.1 = 0.775
  const uniformPlane = parametricSurface(
    (u, v) => [-1.9 + u * 3.8, -1.7 + v * 3.4, 0.25 * 3.1],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 4],
      color: '#252142',
      mesh: COSMOS.gold,
      meshOpacity: 0.34,
      meshWidth: 0.9,
      opacity: 0.26,
      shaded: false,
    },
  );

  // Active temperature ridge tracing the current T across the 4 words
  const activeRidge = curve3d(
    (u) => {
      const T = Math.max(1, Math.min(16, tempVal.value));
      const v = (T - 1) / 15;
      const probs = stableSoftmax(TEACHER, T);
      const idx = Math.min(2.999, Math.max(0, u * 3));
      const i0 = Math.floor(idx);
      const frac = idx - i0;
      const p = probs[i0] * (1 - frac) + probs[Math.min(3, i0 + 1)] * frac;
      return [-1.8 + u * 3.6, -1.6 + v * 3.2, p * 3.1 + 0.08];
    },
    0,
    1,
    { color: COSMOS.gold, width: 4.2, glow: 10, samples: 36, onTop: true },
  );

  const tracers = points3d(
    () => {
      const T = Math.max(1, Math.min(16, tempVal.value));
      const v = (T - 1) / 15;
      const probs = stableSoftmax(TEACHER, T);
      return probs.map((p, i) => [-1.8 + (i / 3) * 3.6, -1.6 + v * 3.2, p * 3.1 + 0.12]);
    },
    {
      colorAt: (i) => (i === 3 ? COSMOS.emerald : COSMOS.gold),
      radius: 6.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(uniformPlane, surf, activeRidge, tracers);
  return view;
}

/** Orbiting 3D Forward KL (mode-covering wall) vs Reverse KL (mode-seeking bowl) surface. */
export function buildKlLandscape3d(phaseVal, { x = 440, y = 35 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.6,
    unit: 96,
    focus: [0, 0, 0.85],
  }).at(x, y);

  // u in [0, 1] maps pA in [0.06, 0.96] onto [-1.8, 1.8]; v in [0, 1] maps Forward -> Reverse onto [-1.6, 1.6]
  const klHeight = (pA, dir) => {
    const pB = 1 - pA;
    const fwd = 0.5 * Math.log(0.5 / pA) + 0.5 * Math.log(0.5 / pB);
    const rev = pA * Math.log(pA / 0.5) + pB * Math.log(pB / 0.5);
    return Math.min(2.45, ((1 - dir) * fwd + dir * rev) * 1.18);
  };

  const surf = parametricSurface(
    (u, v) => {
      const pA = 0.06 + u * 0.9;
      return [-1.8 + u * 3.6, -1.6 + v * 3.2, klHeight(pA, v)];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [28, 18],
      colors: ['#103b38', '#1f648a', '#5ce1e6', '#a78bfa', '#ff6b8b'],
      mesh: '#a5b4fc',
      meshOpacity: 0.26,
      meshWidth: 0.75,
      opacity: 0.88,
    },
  );

  // Forward KL boundary curve (v = 0, y = -1.6) spiking steeply toward +infinity at pA -> 1
  const fwdRail = curve3d(
    (u) => {
      const pA = 0.06 + u * 0.9;
      return [-1.8 + u * 3.6, -1.6, klHeight(pA, 0) + 0.07];
    },
    0,
    1,
    { color: COSMOS.rose, width: 4.0, glow: 9, samples: 40, onTop: true },
  );

  // Reverse KL boundary curve (v = 1, y = +1.6) bounded cleanly by ln(2) ~= 0.693
  const revRail = curve3d(
    (u) => {
      const pA = 0.06 + u * 0.9;
      return [-1.8 + u * 3.6, 1.6, klHeight(pA, 1) + 0.07];
    },
    0,
    1,
    { color: COSMOS.cyan, width: 4.0, glow: 9, samples: 40, onTop: true },
  );

  const walkers = points3d(
    () => {
      const u = 0.5 + 0.45 * (0.5 + 0.5 * Math.sin(phaseVal.value * 0.65));
      const pA = 0.06 + u * 0.9;
      const wx = -1.8 + u * 3.6;
      return [
        [wx, -1.6, klHeight(pA, 0) + 0.12],
        [wx, 1.6, klHeight(pA, 1) + 0.12],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.rose : COSMOS.cyan),
      radius: 7.5,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(surf, fwdRail, revRail, walkers);
  return view;
}

/** Orbiting 3D Hidden-State Projection Bridge (2D Student plane -> 3D Teacher target space). */
export function buildProjectionBridge3d(phaseVal, progressVal, freshVal, { x = 480, y = 45 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.2,
    unit: 94,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-2.2, 2.2],
    y: [-1.8, 1.8],
    z: 0,
    step: 0.8,
    color: '#223154',
    opacity: 0.42,
  });

  // 2D student slab on the left-front
  const studentPlane = parametricSurface(
    (u, v) => [-2.0 + u * 1.3, -1.1 + v * 2.2, 0.18],
    [0, 1],
    [0, 1],
    {
      resolution: [4, 4],
      color: '#0e3645',
      mesh: COSMOS.cyan,
      meshOpacity: 0.45,
      meshWidth: 1.0,
      opacity: 0.55,
      shaded: false,
    },
  );

  // 3D teacher target pillar & projected student pillar
  const dynamicTarget = points3d(
    () => {
      const f = freshVal.value > 0.5;
      const fix = projectionFixture(progressVal.value, f);
      // Scale [0..3] onto 3D coordinates inside [0.4..2.0]
      const tPt = [0.6 + fix.target[0] * 0.45, -1.0 + fix.target[1] * 0.55, fix.target[2] * 0.75];
      const sPt = [0.6 + fix.output[0] * 0.45, -1.0 + fix.output[1] * 0.55, fix.output[2] * 0.75];
      const hPt = [-1.35, -0.5 + fix.h[0] * 0.35, 0.25 + fix.h[1] * 0.25];
      return [hPt, sPt, tPt];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.blue),
      radius: 8,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  const bridgeLine = curve3d(
    (t) => {
      const f = freshVal.value > 0.5;
      const fix = projectionFixture(progressVal.value, f);
      const hPt = [-1.35, -0.5 + fix.h[0] * 0.35, 0.25 + fix.h[1] * 0.25];
      const sPt = [0.6 + fix.output[0] * 0.45, -1.0 + fix.output[1] * 0.55, fix.output[2] * 0.75];
      return [
        hPt[0] + (sPt[0] - hPt[0]) * t,
        hPt[1] + (sPt[1] - hPt[1]) * t,
        hPt[2] + (sPt[2] - hPt[2]) * t + 0.35 * Math.sin(Math.PI * t),
      ];
    },
    0,
    1,
    { color: COSMOS.cyan, width: 3.4, glow: 9, samples: 28, onTop: true },
  );

  const gapLine = line3d(
    () => {
      const f = freshVal.value > 0.5;
      const fix = projectionFixture(progressVal.value, f);
      return [0.6 + fix.output[0] * 0.45, -1.0 + fix.output[1] * 0.55, fix.output[2] * 0.75];
    },
    () => {
      const f = freshVal.value > 0.5;
      const fix = projectionFixture(progressVal.value, f);
      return [0.6 + fix.target[0] * 0.45, -1.0 + fix.target[1] * 0.55, fix.target[2] * 0.75];
    },
    { color: COSMOS.rose, width: 4.0, glow: 10, onTop: true },
  );

  const teacherCube = wireframeSlab3d([1.25, 0.2, 1.1], 0.85, 1.15, 0.95, {
    color: COSMOS.blue,
    width: 1.9,
    glow: 5,
  });

  view.add(floor, studentPlane, ...teacherCube, bridgeLine, gapLine, dynamicTarget);
  return view;
}

export {
  COSMOS,
  INITIAL,
  LEARNING_CUES,
  Node,
  POLICY_CASES,
  POLICY_REPLIES,
  POLICY_STUDENT,
  POLICY_TEACHER,
  RELEASE_CANDIDATES,
  RELEASE_LIMITS,
  TEACHER,
  WORDS,
  aura,
  circle,
  cinematic3d,
  curve3d,
  dot,
  entropy,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  jointFixture,
  kl,
  learningSnapshot,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  morphEquation,
  objectiveSnapshot,
  orbitScene,
  parametricSurface,
  points3d,
  policySelection,
  polyPath,
  prefixSnapshot,
  projectionFixture,
  radialGradient,
  rect,
  releaseChecks,
  rule,
  stableSoftmax,
  studentTrace,
  surface,
  txt,
  wireframeSlab3d,
};
