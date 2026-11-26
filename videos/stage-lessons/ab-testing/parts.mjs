// Shared cinematic helpers, verified ab-testing math bindings, and 3D statistical surfaces.
import { arrow, circle, curve3d, dot, line, linear, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  cinematicLesson,
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
} from '../cinematic-kit.mjs';
import {
  abNormalCdf,
  groundingRate,
  rate,
  requiredN,
  standardError,
} from '../../films/ab-testing/arithmetic.mjs';
import { AB_VISUAL_FIXTURES, report, srm } from '../../films/ab-testing/fixtures.mjs';
import {
  alphaSpend,
  assignedArm,
  clusterDesignEffect,
  cupedVariance,
  groundingDelta,
  groundingPacket,
  groundingSe,
  groundingUpper,
  incidentOutcome,
  lift,
  liftInterval,
  mixtureEvidence,
  pairedContrastVariance,
  planningPower,
  projectedInterval,
  receiptMismatches,
  seLift,
  srmChiSquare,
} from '../../films/ab-testing/model.mjs';

export {
  AB_VISUAL_FIXTURES,
  COSMOS,
  abNormalCdf,
  alphaSpend,
  assignedArm,
  aura,
  cinematic3d,
  cinematicLesson,
  clusterDesignEffect,
  cupedVariance,
  curve3d,
  glowTex,
  glowingTrail,
  groundingDelta,
  groundingPacket,
  groundingRate,
  groundingSe,
  groundingUpper,
  guardedDynamic,
  heroTitle,
  incidentOutcome,
  lift,
  liftInterval,
  metricReadout,
  mixtureEvidence,
  orbitScene,
  pairedContrastVariance,
  planningPower,
  projectedInterval,
  rate,
  receiptMismatches,
  report,
  requiredN,
  rule,
  seLift,
  srm,
  srmChiSquare,
  standardError,
  txt,
  verifyApprox,
  verifyInvariant,
};

export const CTRL_COLOR = COSMOS.cyan;
export const TRT_COLOR = COSMOS.blue;
export const GOOD_COLOR = COSMOS.emerald;
export const WARN_COLOR = COSMOS.amber;
export const BAD_COLOR = COSMOS.rose;
export const VIOLET_COLOR = COSMOS.violet;

export const BUDGET = { grounding: 0.5, latency: 150, observedLift: 2 };

export const CONTROL_RECEIPT = {
  index: 'runbook-v14',
  generator: 'llm-v2.1',
  prompt: 'rollback-qa-v4',
  decoder: 'greedy-schema-v2',
};

export const TREATMENT_RECEIPT_OK = { ...CONTROL_RECEIPT };
export const TREATMENT_RECEIPT_DRIFT = {
  ...CONTROL_RECEIPT,
  decoder: 'greedy-schema-v3',
};

// Build-time mathematical invariants asserting every spoken value against model.mjs & fixtures.mjs.
export function verifyAbTestingInvariants() {
  verifyApprox(rate(report.control), 0.38, 1e-9, 'control rate 760/2000 = 38%');
  verifyApprox(rate(report.treatment), 0.42, 1e-9, 'treatment rate 840/2000 = 42%');
  verifyApprox(lift, 0.04, 1e-9, 'absolute lift = +4.0 pp');
  verifyApprox(lift / rate(report.control), 0.1052631579, 1e-6, 'relative lift = 10.53%');
  verifyApprox(seLift, 0.0154725563, 1e-5, 'SE of lift ~ 1.55 pp');
  verifyApprox(liftInterval[0], 0.0096737896, 1e-4, '95% CI low ~ +1.0 pp');
  verifyApprox(liftInterval[1], 0.0703262104, 1e-4, '95% CI high ~ +7.0 pp');

  verifyApprox(clusterDesignEffect(20, 0.1), 2.9, 1e-9, 'design effect m=20, rho=0.1 -> 2.9');
  verifyInvariant(
    incidentOutcome({ observedMinutes: 9, usableAt: 8 }) === 'pending',
    'min 9 pending',
  );
  verifyInvariant(
    incidentOutcome({ observedMinutes: 10, usableAt: 8, newPageAt: 10 }) === 'unresolved',
    'page at min 10 unresolved',
  );
  verifyInvariant(
    incidentOutcome({ observedMinutes: 18, usableAt: 8, newPageAt: 18 }) === 'resolved',
    'page at min 18 keeps 10m resolution',
  );

  verifyApprox(Math.ceil(requiredN(0.38, 0.02)), 9246, 1, 'shortcut n ~ 9246');
  verifyApprox(planningPower(9246).power, 0.7964, 0.002, 'power at 9246 ~ 79.6%');
  verifyInvariant(planningPower(9336).power >= 0.8, '9336 reaches >= 80% power');

  verifyApprox(srmChiSquare, 122.5, 1e-9, 'SRM 1650/2350 chi2 = 122.5');
  const srmSmall = (1900 - 2000) ** 2 / 2000 + (2100 - 2000) ** 2 / 2000;
  verifyApprox(srmSmall, 10.0, 1e-9, 'SRM 1900/2100 chi2 = 10.0 < 10.83');

  const peek = AB_VISUAL_FIXTURES.peeking;
  verifyApprox(peek.path[3].z, 2.5835, 1e-3, 'peeking look 4 z = 2.58');
  verifyApprox(peek.path[19].z, 1.6091, 1e-3, 'peeking look 20 z = 1.61');
  verifyInvariant(
    peek.alarms[0] === 231 && peek.alarms[3] === 1244,
    'peeking alarms 231 -> 1244 / 5000',
  );

  verifyApprox(alphaSpend(0.5), 0.00557, 5e-4, 'OBF alpha spend at t=0.5 ~ 0.56%');
  verifyApprox(alphaSpend(1.0), 0.05, 1e-4, 'OBF alpha spend at t=1.0 = 5.0%');

  const mix = mixtureEvidence();
  verifyApprox(mix[10].current, 28.833, 5e-3, 'mSPRT at 10 successes ~ 28.833');
  verifyApprox(mix[20].current, 0.509, 5e-3, 'mSPRT after 10 failures ~ 0.509');
  verifyApprox(mix[20].maximum, 28.833, 5e-3, 'mSPRT running max stays 28.833');
  verifyApprox(mix[20].p, 0.03468, 5e-4, 'mSPRT anytime p ~ 0.0347');

  verifyApprox(cupedVariance(9, 4, 3), 6.75, 1e-9, 'CUPED toy variance 9 -> 6.75 (25% drop)');
  verifyApprox(AB_VISUAL_FIXTURES.cuped.correlation, 0.4703, 1e-3, 'CUPED corr ~ 0.470');
  verifyApprox(AB_VISUAL_FIXTURES.cuped.varianceReduction, 0.2212, 1e-3, 'CUPED var drop ~ 22.1%');

  verifyApprox(pairedContrastVariance(9, 4, 3), 7.0, 1e-9, 'paired toy variance = 7');
  verifyApprox(
    AB_VISUAL_FIXTURES.paired.varianceReduction,
    0.8954,
    1e-3,
    'paired var drop ~ 89.5%',
  );

  verifyInvariant(
    AB_VISUAL_FIXTURES.bandit.controlPulls === 463 &&
      AB_VISUAL_FIXTURES.bandit.treatmentPulls === 1537,
    'bandit pulls 463 / 1537',
  );

  verifyInvariant(
    receiptMismatches(CONTROL_RECEIPT, TREATMENT_RECEIPT_OK).length === 0,
    'ok receipt',
  );
  verifyInvariant(
    receiptMismatches(CONTROL_RECEIPT, TREATMENT_RECEIPT_DRIFT)[0] === 'decoder',
    'decoder drift detected',
  );

  const orig = groundingPacket(23);
  verifyApprox(orig.delta * 100, 0.05, 1e-4, 'orig grounding delta +0.05 pp');
  verifyApprox(orig.upper * 100, 0.7, 0.01, 'orig grounding upper +0.70 pp');
  verifyInvariant(!orig.passes, 'orig grounding holds');

  const fresh = groundingPacket(18);
  verifyApprox(fresh.delta * 100, -0.2, 1e-4, 'fresh grounding delta -0.20 pp');
  verifyApprox(fresh.upper * 100, 0.42, 0.01, 'fresh grounding upper +0.42 pp');
  verifyInvariant(fresh.passes, 'fresh grounding passes');
}

// Cue-driven tween helper respecting strict { after: true } prediction withholding.
export function tweenCue(s, c, cueId, val, target, { duration = 0.5, ease, after = false } = {}) {
  const hook = after ? c.after.bind(c) : c.on.bind(c);
  hook(cueId, () => {
    s.play(val.to(target, { duration, ...(ease ? { ease } : {}) }));
  });
}

// Continuous linear ambient phase helper for subtle breathing pulses.
export function runAmbientPhase(s, c, phase, speed = 2.0) {
  c.at(0, () => {
    const span = Number.isFinite(c.end) && Number.isFinite(c.start) ? c.end - c.start : 20;
    const dur = Math.max(0.5, span - 0.15);
    s.play(phase.to(dur * speed, { duration: dur, ease: linear }));
  });
}

// Color hex + opacity -> 8-digit hex (#rrggbbaa) because Vizmatic rect ignores fillOpacity!
export function hexAlpha(hex, alpha = 1) {
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  if (typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  if (hex.length === 7) return hex + a;
  if (hex.length === 9) return hex.slice(0, 7) + a;
  return hex;
}

export function glowDot(x, y, { radius = 8, color = COSMOS.cyan, glow = 10, opacity = 1 } = {}) {
  const d = dot(radius, color).moveTo([x, y]).opacity(opacity);
  return glow > 0 ? d.glow(glow, color) : d;
}

export function glowRing(x, y, radius, color, { width = 3, dash, glow = 8, opacity = 1 } = {}) {
  const r = circle(radius, {
    fill: '#00000000',
    stroke: color,
    strokeWidth: width,
    ...(dash ? { dash } : {}),
  })
    .moveTo([x, y])
    .opacity(opacity);
  return glow > 0 ? r.glow(glow, color) : r;
}

export function glowArrow(from, to, color = COSMOS.cyan, { width = 3.2, opacity = 1 } = {}) {
  return arrow(from, to, { stroke: color, width, head: 14 }).opacity(opacity);
}

export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = COSMOS.cyan,
    fillOpacity = 0.25,
    strokeWidth = 2.4,
    dash,
    glow = 8,
    opacity = 1,
    rx = 10,
  } = {},
) {
  const b = rect(Math.max(4, w), Math.max(4, h), {
    fill: hexAlpha(color, fillOpacity),
    stroke: color,
    strokeWidth,
    rx,
    ...(dash ? { dash } : {}),
  })
    .moveTo([cx, cy])
    .opacity(opacity);
  return glow > 0 ? b.glow(glow, color) : b;
}

// 2D coordinate plot mapper with clean axes & grid lines
export function makePlot(left, top, width, height, { x = [0, 10], y = [0, 10] } = {}) {
  const [xMin, xMax] = x;
  const [yMin, yMax] = y;
  const xPx = (xv) => left + ((xv - xMin) / (xMax - xMin)) * width;
  const yPx = (yv) => top + height - ((yv - yMin) / (yMax - yMin)) * height;
  const pt = ([xv, yv]) => [xPx(xv), yPx(yv)];
  const axesNodes = (op = 0.85) => [
    line([left, top + height], [left + width, top + height], {
      stroke: COSMOS.muted,
      width: 2.5,
    }).opacity(op),
    line([left, top], [left, top + height], { stroke: COSMOS.muted, width: 2.5 }).opacity(op),
  ];
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    xPx,
    yPx,
    pt,
    axesNodes,
  };
}

export function normalPdf(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

// Unnormalized Beta density peak-scaled to [0, 1] for crisp visual curves
export function betaCurve(alpha, beta, steps = 50) {
  const pts = [];
  let maxVal = 1e-12;
  for (let i = 0; i <= steps; i++) {
    const p = 0.01 + (0.98 * i) / steps;
    const lp = (alpha - 1) * Math.log(p) + (beta - 1) * Math.log(1 - p);
    pts.push([p, lp]);
  }
  const maxLp = Math.max(...pts.map((d) => d[1]));
  return pts.map(([p, lp]) => {
    const v = Math.exp(lp - maxLp);
    if (v > maxVal) maxVal = v;
    return [p, v];
  });
}

// 3D Cinema Setpiece 1: Orbiting Power Surface P(n, delta) with 80% target contour
export function buildPowerSurface3d({ x = 445, y = 20 } = {}) {
  const view = cinematic3d({
    width: 780,
    height: 620,
    x: [-2.2, 2.2],
    y: [-2.2, 2.2],
    z: [-0.2, 1.3],
    theta: 0.72,
    phi: 1.06,
    scale: 120,
    axes: false,
  }).moveTo([x, y]);

  const powerAt = (u, v) => {
    const n = 500 + u * 11500;
    const d = 0.008 + v * 0.042;
    const p0 = 0.38;
    const se0 = Math.sqrt((2 * (p0 + d / 2) * (1 - p0 - d / 2)) / n);
    const se1 = Math.sqrt((p0 * (1 - p0) + (p0 + d) * (1 - p0 - d)) / n);
    const crit = 1.96 * se0;
    return 1 - abNormalCdf((crit - d) / se1) + abNormalCdf((-crit - d) / se1);
  };

  view.add(
    surface(
      (sx, sy) => {
        const u = Math.max(0, Math.min(1, sx / 4.0 + 0.5));
        const v = Math.max(0, Math.min(1, sy / 4.0 + 0.5));
        return powerAt(u, v) * 1.15;
      },
      {
        x: [-2.0, 2.0],
        y: [-2.0, 2.0],
        resolution: 20,
        colors: [COSMOS.blue, COSMOS.cyan, COSMOS.emerald, COSMOS.amber],
        opacity: 0.84,
        stroke: '#38bdf866',
        strokeWidth: 0.9,
      },
    ),
  );

  // 80% power glowing target contour ribbon
  view.add(
    curve3d(
      (t) => {
        const v = 0.16 + 0.84 * t;
        const d = 0.008 + v * 0.042;
        const nReq = Math.min(12000, Math.max(500, requiredN(0.38, d)));
        const u = (nReq - 500) / 11500;
        return [(u - 0.5) * 4.0, (v - 0.5) * 4.0, 0.8 * 1.15 + 0.14];
      },
      { t: [0, 1], samples: 40, stroke: COSMOS.rose, width: 5.5 },
    ),
  );

  return { view };
}

// 3D Cinema Setpiece 2: Orbiting CUPED Bivariate Cloud & Residual Contraction Ridge
export function buildCupedCloud3d({ x = 445, y = 20 } = {}) {
  const view = cinematic3d({
    width: 760,
    height: 600,
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    z: [-0.2, 1.4],
    theta: 0.65,
    phi: 1.05,
    scale: 122,
    axes: false,
  }).moveTo([x, y]);

  const rho = AB_VISUAL_FIXTURES.cuped.correlation;
  view.add(
    surface(
      (u, v) => {
        const q = (u * u - 2 * rho * u * v + v * v) / (2 * (1 - rho * rho));
        return 1.25 * Math.exp(-q * 0.85);
      },
      {
        x: [-2.1, 2.1],
        y: [-2.1, 2.1],
        resolution: 20,
        colors: [COSMOS.blue, COSMOS.cyan, COSMOS.emerald],
        opacity: 0.82,
        stroke: '#38bdf855',
        strokeWidth: 0.9,
      },
    ),
  );

  view.add(
    curve3d(
      (t) => {
        const u = -1.8 + 3.6 * t;
        const v = rho * u;
        const q = (u * u - 2 * rho * u * v + v * v) / (2 * (1 - rho * rho));
        return [u, v, 1.25 * Math.exp(-q * 0.85) + 0.06];
      },
      { t: [0, 1], samples: 32, stroke: COSMOS.amber, width: 4.5 },
    ),
  );

  return { view };
}

// 3D Cinema Setpiece 3: Orbiting Thompson Sampling Posterior Waves over Time
export function buildBanditSurface3d({ x = 445, y = 20 } = {}) {
  const view = cinematic3d({
    width: 760,
    height: 600,
    x: [-2.2, 2.2],
    y: [-2.2, 2.2],
    z: [-0.1, 1.4],
    theta: 0.62,
    phi: 1.08,
    scale: 120,
    axes: false,
  }).moveTo([x, y]);

  view.add(
    surface(
      (sx, sy) => {
        const u = Math.max(0, Math.min(1, sx / 4.0 + 0.5));
        const v = 0.4 + sy / 9.0;
        const sdT = 0.14 - 0.11 * u;
        const sdC = 0.14 - 0.08 * u;
        const hT = Math.exp(-0.5 * ((v - 0.42) / sdT) ** 2);
        const hC = 0.62 * Math.exp(-0.5 * ((v - 0.38) / sdC) ** 2);
        return Math.max(hT, hC) * 1.15;
      },
      {
        x: [-2.0, 2.0],
        y: [-2.0, 2.0],
        resolution: 20,
        colors: [COSMOS.blue, COSMOS.cyan, COSMOS.emerald, COSMOS.amber],
        opacity: 0.82,
        stroke: '#38bdf855',
        strokeWidth: 0.9,
      },
    ),
  );

  view.add(
    curve3d((t) => [(t - 0.5) * 4.0, (0.42 - 0.4) * 9.0, 1.2], {
      t: [0, 1],
      samples: 30,
      stroke: COSMOS.emerald,
      width: 4.2,
    }),
  );

  return { view };
}
