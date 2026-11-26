// Shared cinematic primitives, math imports, and 3D claim-evidence entailment stage for hallucination-evidence.
import {
  circle,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  points3d,
  rect,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  CURRENT_RECORD,
  EVIDENCE,
  cases,
  draftClaims,
  resolvedClaim,
} from '../../films/hallucination-evidence/fixtures.mjs';
import {
  cadDistribution,
  checkedIncidentClaim,
  disagreement,
  dolaDistribution,
  releaseEvidence,
  renderIncident,
  renderSupported,
  safeAnswer,
  semanticSampleStats,
  verifyClaim,
} from '../../films/hallucination-evidence/arithmetic.mjs';
import {
  baselineReview,
  candidateReview,
  relabeledReview,
  silentReview,
} from '../../films/hallucination-evidence/case-review.mjs';
import {
  freshIncidentFrame,
  scoreGate,
  validateModel,
} from '../../films/hallucination-evidence/model.mjs';

export {
  COSMOS,
  CURRENT_RECORD,
  EVIDENCE,
  aura,
  baselineReview,
  cadDistribution,
  candidateReview,
  cases,
  checkedIncidentClaim,
  circle,
  disagreement,
  dolaDistribution,
  draftClaims,
  freshIncidentFrame,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  relabeledReview,
  releaseEvidence,
  renderIncident,
  renderSupported,
  resolvedClaim,
  safeAnswer,
  scoreGate,
  semanticSampleStats,
  silentReview,
  txt,
  verifyClaim,
};

export const GATE_SCORE = scoreGate();
export const DOLA_RESULT = dolaDistribution([0.7, 0.2, 0.1], [0.2, 0.3, 0.5], 0.2);
export const CAD_RESULT = cadDistribution([0.7, 0.2, 0.1], [0.1, 0.8, 0.1], 1);
export const MEANING_STATS = semanticSampleStats([
  'investigating',
  'investigating',
  'mitigated',
  'resolved',
]);
export const FRESH_BAD = freshIncidentFrame(false);
export const FRESH_GOOD = freshIncidentFrame(true);

export function verifyHallucinationInvariants() {
  verifyInvariant(validateModel() === true, 'hallucination-evidence model validation passes');
  verifyInvariant(GATE_SCORE.baselineUnsafe === 3, 'baseline leaks 3 unsafe answers');
  verifyInvariant(
    GATE_SCORE.served === 2 && GATE_SCORE.unsafe === 0,
    'gate serves 2 with 0 unsafe',
  );
  verifyApprox(MEANING_STATS.entropy, 1.03972, 1e-4, 'semantic entropy ~1.04 nats');
  verifyApprox(MEANING_STATS.disagreement, 0.5, 1e-9, 'semantic disagreement 0.5');
  verifyApprox(DOLA_RESULT.probabilities[0], 0.84, 1e-9, 'DoLa investigating prob 0.84');
  verifyApprox(CAD_RESULT.probabilities[0], 98 / 101, 1e-6, 'CAD investigating prob ~0.97');
  verifyInvariant(FRESH_BAD.route === 'abstain', 'stale version must abstain');
  verifyInvariant(FRESH_GOOD.route === 'serve', 'repaired v2 must serve');
}

export function safeDuration(c, startOffset = 0.08, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 0.55, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.22, c.end - cue.start - endMargin);
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
  { fill = '#11182c', radius = 12, glow = 6, opacity = 0.94, dash, width = 2.2 } = {},
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
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

export function meterBar(xLeft, y, totalW, h, frac, color, opts = {}) {
  const { bg = '#131b31', stroke = COSMOS.dim, opacity = 1, glow = 7 } = opts;
  const clamped = Math.max(0, Math.min(1, frac));
  const fillW = Math.max(clamped > 0.005 ? 10 : 0, totalW * clamped);
  const items = [
    rect(totalW, h, { fill: bg, stroke, width: 1.6, radius: h * 0.35 })
      .at(xLeft + totalW / 2, y)
      .opacity(opacity * 0.9),
  ];
  if (fillW > 0) {
    items.push(
      rect(fillW, h - 4, { fill: color, radius: h * 0.3 })
        .glow(glow, color)
        .at(xLeft + fillW / 2, y)
        .opacity(opacity),
    );
  }
  return group(...items);
}

// Orbiting 3D Claim-Evidence Entailment Graph (direct 3D primitives inside cinematic3d)
export function makeEntailmentGraph3D(cx, cy, phaseVal, mode = 'intro') {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 17.6,
    unit: 86,
    focus: [0, 0, 0.4],
  }).at(cx, cy);

  const floor = parametricSurface(
    (u, v) => [-2.1 + u * 4.2, -1.7 + v * 3.4, -0.35],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#111c33',
      mesh: '#2c426e',
      meshOpacity: 0.45,
      meshWidth: 0.9,
      opacity: 0.26,
      shaded: false,
    },
  );

  // Left slab: Admitted Runbook Fields | Right slab: Atomic Draft Claims
  const evSlab = wireframeSlab3d([-1.6, 0, 0.5], 0.36, 1.65, 0.85, {
    color: COSMOS.cyan,
    width: 2.2,
    glow: 8,
    opacity: 0.9,
  });
  const clSlab = wireframeSlab3d([1.6, 0, 0.5], 0.36, 1.65, 0.85, {
    color: mode === 'repair' ? COSMOS.emerald : COSMOS.gold,
    width: 2.2,
    glow: 8,
    opacity: 0.9,
  });

  const evPts = [
    [-1.6, -1.1, 0.95],
    [-1.6, -0.35, 0.95],
    [-1.6, 0.4, 0.95],
    [-1.6, 1.15, 0.95],
  ];
  const clPts = [
    [1.6, -1.1, 0.95],
    [1.6, -0.35, 0.95],
    [1.6, 0.4, 0.95],
    [1.6, 1.15, 0.95],
  ];

  const links = [];
  for (let i = 0; i < 3; i++) {
    links.push(line3d(evPts[i], clPts[i], { stroke: COSMOS.emerald, width: 3.6, glow: 9 }));
  }
  if (mode === 'repair') {
    links.push(line3d(evPts[3], clPts[3], { stroke: COSMOS.emerald, width: 3.6, glow: 9 }));
  } else {
    // 4th claim (unsupported ETA): severed link stopping mid-air in rose/amber!
    links.push(
      line3d([0.15, clPts[3][1], 0.95], clPts[3], { stroke: COSMOS.rose, width: 3.6, glow: 10 }),
      points3d([[0.15, clPts[3][1], 0.95]], {
        color: COSMOS.rose,
        radius: 7.5,
        glow: 12,
        onTop: true,
      }),
    );
  }

  const evNodes = points3d(mode === 'repair' ? evPts : evPts.slice(0, 3), {
    color: COSMOS.cyan,
    radius: 8,
    glow: 11,
    onTop: true,
  });
  const clNodes = points3d(clPts, {
    colorAt: (i) => (i < 3 || mode === 'repair' ? COSMOS.emerald : COSMOS.rose),
    radius: 9,
    glow: 12,
    onTop: true,
  });

  // Animated entailment verification photons streaming from evidence to claims
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [];
      const count = mode === 'repair' ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const u = (p * 0.45 + i * 0.25) % 1;
        pts.push([
          evPts[i][0] + (clPts[i][0] - evPts[i][0]) * u,
          evPts[i][1],
          0.95 + 0.14 * Math.sin(u * Math.PI),
        ]);
      }
      return pts;
    },
    { color: COSMOS.emerald, radius: 7, glow: 13, blend: 'screen', onTop: true },
  );

  view.add(floor, ...evSlab, ...clSlab, ...links, evNodes, clNodes, photons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}
