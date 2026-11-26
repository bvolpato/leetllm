// Shared pure-cinema math invariants, semantic palette, 3D isolation cages, and luminous
// primitives for the 13-scene `sandbox-execution` stage film (vizmatic@0.10.0).
import {
  Node,
  arrow,
  circle,
  commas,
  curve3d,
  delay,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  points3d,
  polyPath,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  addI32,
  bounded,
  memoryAccess,
  parseReport,
  passAtK,
} from '../../films/sandbox-execution/arithmetic.mjs';
import {
  CANDIDATE_PAIRS,
  CANDIDATE_POOL,
  REPORT,
} from '../../films/sandbox-execution/construction.mjs';
import {
  FRESH_REPORT_XML,
  REPORT_XML,
  WASM_FUEL_CUES,
} from '../../films/sandbox-execution/fixtures.mjs';
import {
  authorityFlow,
  cleanupFixture,
  evidenceSnapshot,
  parserIdentities,
  repairSceneSnapshot,
  repairTrace,
  resourceFixture,
  runtimeAccess,
  runtimeProbe,
  validateModel,
  verdictAxes,
  wasmFixture,
} from '../../films/sandbox-execution/model.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CANDIDATE_PAIRS,
  CANDIDATE_POOL,
  CINEMA_FRAME,
  COSMOS,
  FRESH_REPORT_XML,
  Node,
  REPORT,
  REPORT_XML,
  WASM_FUEL_CUES,
  addI32,
  arrow,
  aura,
  authorityFlow,
  bounded,
  cinematic3d,
  circle,
  cleanupFixture,
  commas,
  curve3d,
  delay,
  dot,
  dynamic,
  evidenceSnapshot,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  markDecoration,
  memoryAccess,
  metricReadout,
  morphEquation,
  orbitScene,
  par,
  parametricSurface,
  parseReport,
  parserIdentities,
  passAtK,
  points3d,
  polyPath,
  rect,
  repairSceneSnapshot,
  repairTrace,
  resourceFixture,
  rule,
  runtimeAccess,
  runtimeProbe,
  seq,
  txt,
  verdictAxes,
  verifyApprox,
  verifyInvariant,
  wasmFixture,
  wireframeSlab3d,
};

/** Locked semantic COSMOS palette across all 13 `sandbox-execution` scenes. */
export const ROLE = Object.freeze({
  candidate: COSMOS.rose,
  host: COSMOS.cyan,
  evidence: COSMOS.blue,
  pass: COSMOS.emerald,
  mark: COSMOS.gold,
  warn: COSMOS.amber,
  wasm: COSMOS.violet,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
});

export const WORKER_ID = 'worker-A / g7';
export const NEXT_WORKER_ID = 'worker-A / g8';

const toShownCase = (test) => ({
  id: test.id,
  className: test.className,
  name: test.name,
  identity: `${test.className}::${test.name}`,
  children: test.children.map((child) => child.tag),
});

export const CASES = Object.freeze(REPORT.map(toShownCase));
export const FRESH_CASES = Object.freeze(parseReport(FRESH_REPORT_XML).map(toShownCase));

/** Build-time mathematical and behavioral invariant suite backed by `videos/films/sandbox-execution/`. */
export function verifySandboxInvariants() {
  validateModel();
  const trace = repairTrace();
  verifyInvariant(trace.first.error === "KeyError: 'status'", 'attempt 1 raises KeyError status');
  verifyInvariant(
    parserIdentities(REPORT_XML).join('|') ===
      'ReportParser::rejectsFailure|ReportParser::handlesError',
    'repaired parser matches both expected fixture rows',
  );
  verifyInvariant(
    parserIdentities(FRESH_REPORT_XML).join('|') === 'payments::retry',
    'fresh report yields exactly payments::retry',
  );

  const limits = resourceFixture();
  verifyApprox(
    limits.cpuQuota / limits.cpuPeriod,
    limits.cpuEquivalent,
    1e-12,
    '50ms / 100ms = 0.5 CPU',
  );
  verifyInvariant(limits.scratchMiB === 64 && limits.memoryMiB === 512, '64 MiB / 512 MiB limits');
  verifyInvariant(limits.tasks === 64 && limits.wallSeconds === 30, '64 tasks / 30 s wall limit');

  const cleanup = cleanupFixture();
  verifyInvariant(cleanup.lateOld.status === 'running', 'stale g7 cleanup leaves g8 running');
  verifyInvariant(cleanup.reusable.status === 'reusable', 'reset completes to reusable');
  verifyInvariant(cleanup.lost.status === 'quarantined', 'timeout quarantines slot');

  const wasm = wasmFixture();
  verifyInvariant(wasm.fuelLimit === 100 && wasm.workloadSteps === 132, '100 fuel / 132 steps');
  verifyInvariant(wasm.trapBeforeStep === 101 && wasm.remainingSteps === 32, 'trap before 101');
  verifyInvariant(wasm.memoryGrowth === -1, 'memory.grow past cap returns -1');

  verifyInvariant(addI32(41) === 42 && addI32(-1) === 0, 'i32 add-one');
  verifyInvariant(addI32(2 ** 31 - 1) === -(2 ** 31), 'i32 signed wraparound');
  verifyInvariant(memoryAccess(65532) === 'read permitted', 'last 4 bytes fit page');
  verifyInvariant(memoryAccess(65534) === 'MEMORY_OUT_OF_BOUNDS', '2 bytes past page traps');

  verifyApprox(passAtK(5, 2, 2), 0.7, 1e-12, 'pass@2 without replacement = 0.70');
  verifyApprox(1 - (3 / 5) ** 2, 0.64, 1e-12, 'with replacement = 0.64');
  verifyInvariant(
    CANDIDATE_PAIRS.length === 10 && CANDIDATE_PAIRS.filter((pair) => pair.successful).length === 7,
    '7 of 10 pairs pass',
  );
  verifyInvariant(
    verdictAxes({ functional: true, enforcedDeny: true, terminated: true, reset: false }).slot ===
      'quarantined',
    'uncleaned scratch quarantines slot',
  );
}

/** Convert `#rrggbb` + alpha in [0, 1] into `#rrggbbaa` for Vizmatic rect fills. */
export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/** Clamp a tween duration safely inside the scene window so narration is never overrun. */
export function safeDur(c, startTime, desired = 0.65, margin = 0.32) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, remaining));
}

/** Schedule a smooth Value tween on a cue (`after: true` gates strictly until clause end). */
export function tweenCue(s, c, cueId, val, to, { duration = 0.55, after = false, ease } = {}) {
  const info = c.cue(cueId);
  const startAt = after ? info.end : info.start;
  const remaining = c.end - startAt - 0.16;
  const fire = () => {
    if (remaining <= 0.12) {
      val.set(to);
      return;
    }
    const d = Math.max(0.08, Math.min(duration, remaining));
    const opts = ease ? { duration: d, ease } : { duration: d };
    s.play(val.to(to, opts));
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Non-overlapping sequential cross-swap between two visibility values (zero P5 text overlap). */
export function crossSwap(s, c, cueId, outVal, inVal, { duration = 0.48, after = false } = {}) {
  const info = c.cue(cueId);
  const startAt = after ? info.end : info.start;
  const remaining = c.end - startAt - 0.16;
  const fire = () => {
    if (remaining <= 0.18) {
      outVal.set(0);
      inVal.set(1);
      return;
    }
    const d = Math.max(0.16, Math.min(duration, remaining));
    const half = d * 0.46;
    s.play(
      par(outVal.to(0, { duration: half }), delay(inVal.to(1, { duration: half }), half * 1.04)),
    );
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Continuous ambient phase oscillator spanning the full scene window. */
export function runAmbientPhase(s, c, phaseVal, cycles = 2.0) {
  const dur = Math.max(0.5, c.end - c.start - 0.4);
  c.at(0.05, () => {
    s.play(phaseVal.to(cycles * Math.PI * 2, { duration: dur, ease: linear }));
  });
}

/** Subtle non-occluding multi-aura cosmic atmosphere. */
export function cinemaAtmosphere(primary = ROLE.host, secondary = ROLE.candidate) {
  return markDecoration(
    group(
      aura(-540, -230, 560, hexAlpha(primary, 0.13), '#07091000'),
      aura(480, 140, 620, hexAlpha(secondary, 0.12), '#07091000'),
      aura(0, 20, 740, '#1d2d5c1c', '#07091000'),
    ).zIndex(-80),
  );
}

/** Translucent luminous bar without heavy slide-card chrome. */
export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = ROLE.host,
    fillOpacity = 0.24,
    strokeWidth = 2.2,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(4, w), Math.max(4, h), {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Luminous circular boundary ring. */
export function glowRing(
  cx,
  cy,
  r,
  color = ROLE.host,
  { width = 3, glow = 8, fillOpacity = 0, opacity = 1, dash } = {},
) {
  const node = circle(r, {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing directional arrow. */
export function glowArrow(
  from,
  to,
  color = ROLE.evidence,
  { width = 3.5, tip = 13, opacity = 1, dash, glow = 7 } = {},
) {
  const node = arrow(from, to, { stroke: color, width, tip, dash }).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth 2D quadratic Bezier curve rendered as a glowing trail. */
export function glowingArc(
  from,
  to,
  bend = -40,
  { color = ROLE.mark, width = 3.2, glow = 8, opacity = 0.9, steps = 22 } = {},
) {
  const mx = (from[0] + to[0]) * 0.5;
  const my = (from[1] + to[1]) * 0.5 + bend;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1],
    ]);
  }
  return glowingTrail(pts, { color, width, glow, opacity, core: false });
}

/** Smooth horizontal S-curve for clean routing wires. */
export function conduitPts(p0, p1, steps = 20) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const dx = x1 - x0;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const cx0 = x0 + dx * 0.46;
    const cx1 = x1 - dx * 0.46;
    return [
      u * u * u * x0 + 3 * u * u * t * cx0 + 3 * u * t * t * cx1 + t * t * t * x1,
      u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1,
    ];
  });
}

/**
 * Luminous horizontal progress gauge with cap marker and optional overflow flare.
 * Returns array of nodes to include inside a `guardedDynamic` frame.
 */
export function renderGauge(
  left,
  cy,
  width,
  height,
  level,
  {
    cap = 0.8,
    color = ROLE.candidate,
    overColor = ROLE.candidate,
    limitColor = COSMOS.ink,
    opacity = 1,
    showLimit = true,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, level));
  const capX = left + width * cap;
  const nodes = [
    lumBar(left + width * 0.5, cy, width, height, {
      color: COSMOS.rule,
      fillOpacity: 0.25,
      strokeWidth: 1.8,
      glow: 0,
      radius: 7,
      opacity,
    }),
  ];
  const fillW = Math.min(clamped, cap) * width;
  if (fillW > 3) {
    nodes.push(
      lumBar(left + fillW * 0.5, cy, fillW, height - 6, {
        color,
        fillOpacity: 0.72,
        strokeWidth: 1.8,
        glow: 8,
        radius: 5,
        opacity,
      }),
    );
  }
  if (clamped > cap + 0.005) {
    const overW = (clamped - cap) * width;
    nodes.push(
      lumBar(capX + overW * 0.5, cy, overW, height - 6, {
        color: overColor,
        fillOpacity: 0.85,
        strokeWidth: 2,
        glow: 11,
        radius: 5,
        opacity,
      }),
    );
  }
  if (showLimit) {
    nodes.push(
      line([capX, cy - height * 0.5 - 10], [capX, cy + height * 0.5 + 10], {
        stroke: limitColor,
        width: 3.5,
      })
        .glow(6, limitColor)
        .opacity(opacity),
    );
  }
  return { nodes, capX };
}

/**
 * Signature orbiting 3D Multi-Ring Sandbox Isolation Cage (`cinematic3d`).
 * Shows an inner untrusted candidate prism encased by glowing concentric host containment rings,
 * orbiting boundary probes, and an external trusted channel beam.
 */
export function buildSandboxCage3d(
  phaseVal,
  alertVal = null,
  {
    x = 430,
    y = 30,
    theta = -0.72,
    phi = 1.05,
    distance = 14.6,
    unit = 112,
    innerColor = ROLE.candidate,
    ringColor = ROLE.host,
    outerColor = ROLE.pass,
  } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.8, 2.8],
      y: [-2.8, 2.8],
      z: -1.35,
      step: 0.7,
      color: '#1b2847',
      opacity: 0.42,
    }),
  );

  // Inner untrusted worker core prism
  view.add(
    ...wireframeSlab3d([0, 0, 0.2], 0.72, 0.72, 0.72, {
      color: innerColor,
      width: 3.0,
      glow: 10,
    }),
  );

  // Three concentric isolation barrier rings at staggered heights
  const rings = [
    { r: 1.55, z: -0.45, color: ringColor, w: 3.0 },
    { r: 1.95, z: 0.2, color: ringColor, w: 3.4 },
    { r: 1.55, z: 0.85, color: ringColor, w: 3.0 },
    { r: 2.55, z: 0.2, color: outerColor, w: 2.2 },
  ];
  for (const rSpec of rings) {
    view.add(
      curve3d((t) => [rSpec.r * Math.cos(t), rSpec.r * Math.sin(t), rSpec.z], {
        t: [0, Math.PI * 2],
        samples: 56,
        color: rSpec.color,
        width: rSpec.w,
        glow: 9,
        blend: 'screen',
      }),
    );
  }

  // Vertical boundary shield ribs connecting upper and lower rings
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    view.add(
      line3d(
        [1.55 * Math.cos(a), 1.55 * Math.sin(a), -0.45],
        [1.55 * Math.cos(a), 1.55 * Math.sin(a), 0.85],
        {
          color: ringColor,
          width: 2.0,
          opacity: 0.65,
          glow: 6,
          blend: 'screen',
        },
      ),
    );
  }

  // Orbiting telemetry photons along the isolation rings + live probe pulse
  view.add(
    points3d(
      () => {
        const ph = phaseVal.value;
        const alert = alertVal ? alertVal.value : 0;
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = ph * 0.65 + (i * Math.PI) / 3;
          const r = i % 2 === 0 ? 1.95 : 2.55;
          pts.push([
            r * Math.cos(a),
            r * Math.sin(a),
            i % 2 === 0 ? 0.2 : 0.2 + 0.35 * Math.sin(a * 2),
          ]);
        }
        // Core pulse photon moving outward toward the inner cage wall
        const pr = 0.72 + (1.2 + 0.35 * alert) * (0.5 + 0.5 * Math.sin(ph * 1.4));
        pts.push([pr * Math.cos(ph * 0.4), pr * Math.sin(ph * 0.4), 0.2]);
        return pts;
      },
      {
        colorAt: (idx) => (idx === 6 ? ROLE.mark : idx % 2 === 0 ? ringColor : outerColor),
        radius: 6.2,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D WebAssembly Fuel & Memory Core (`cinematic3d`).
 * Renders a violet Wasm linear-memory slab surrounded by a helical fuel-meter coil.
 */
export function buildWasmCore3d(
  phaseVal,
  burnFracVal,
  { x = -470, y = 135, theta = -0.68, phi = 1.08, distance = 15.0, unit = 96 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.4, 2.4],
      y: [-2.4, 2.4],
      z: -1.15,
      step: 0.8,
      color: '#1b2447',
      opacity: 0.36,
    }),
    ...wireframeSlab3d([0, 0, 0.15], 1.05, 0.72, 0.45, {
      color: ROLE.wasm,
      width: 3.0,
      glow: 10,
    }),
    // Fuel helix winding around the guest core
    curve3d(
      (t) => [1.65 * Math.cos(t * Math.PI * 4), 1.65 * Math.sin(t * Math.PI * 4), -0.8 + t * 1.9],
      {
        t: [0, 1],
        samples: 72,
        color: ROLE.host,
        width: 3.0,
        glow: 8,
        blend: 'screen',
      },
    ),
    points3d(
      () => {
        const ph = phaseVal.value;
        const burned = Math.max(0, Math.min(1, burnFracVal.value));
        const remT = Math.max(0, 1 - burned);
        const pts = [];
        for (let i = 0; i < 4; i++) {
          const t = ((remT * (i + 1)) / 4 + ph * 0.04) % 1;
          pts.push([
            1.65 * Math.cos(t * Math.PI * 4),
            1.65 * Math.sin(t * Math.PI * 4),
            -0.8 + t * 1.9,
          ]);
        }
        return pts;
      },
      {
        colorAt: () => (burnFracVal.value >= 0.99 ? ROLE.candidate : ROLE.mark),
        radius: 6.5,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}
