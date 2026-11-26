// Shared semantic palette, mathematical invariants, 3D value-iteration terrain,
// and luminous MDP primitives for the 13-scene Reinforcement Learning cinema film.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  group,
  line,
  line3d,
  linear,
  points3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  evidenceValue,
  indifferenceProbability,
  openingActions,
  reviewValue,
} from '../../films/reinforcement-learning/arithmetic.mjs';
import {
  explorationEpsilon,
  explorationQ,
  gamma,
  mdpBefore,
  mdpEvent,
  openingBaseline,
  openingGradient,
  openingPolicyValues,
  returns,
  updatedPolicy,
} from '../../films/reinforcement-learning/fixtures.mjs';
import {
  explorationEpisodes,
  explorationLedger,
  observeEnvironment,
  valueIteration,
} from '../../films/reinforcement-learning/model.mjs';
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
  aura,
  cinematic3d,
  evidenceValue,
  explorationEpisodes,
  explorationEpsilon,
  explorationLedger,
  explorationQ,
  gamma,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  indifferenceProbability,
  mdpBefore,
  mdpEvent,
  metricReadout,
  observeEnvironment,
  openingBaseline,
  openingGradient,
  openingPolicyValues,
  orbitScene,
  returns,
  reviewValue,
  rule,
  txt,
  updatedPolicy,
  valueIteration,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/** One color carries one conceptual role across all 13 RL scenes. */
export const ROLE = Object.freeze({
  state: COSMOS.cyan,
  evidence: COSMOS.emerald,
  review: COSMOS.blue,
  approve: COSMOS.rose,
  gold: COSMOS.gold,
  violet: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

const opening = openingActions({ closed: 0, evidence_ready: 0, review_queue: 0 });
export const REWARD = Object.freeze({
  approve: opening.approve,
  ask: opening.evidence,
  reviewCost: opening.review,
  evidence: (returns.evidence - opening.evidence) / gamma,
  review: (returns.review - opening.review) / gamma,
  extraReview: returns.evidenceReadyHuman - (returns.review - opening.review),
});

export const ACTIONS = Object.freeze(['Approve', 'Evidence', 'Review']);
export const ACTION_COLORS = Object.freeze([ROLE.approve, ROLE.evidence, ROLE.review]);

/** Build-time mathematical verification of every core identity in the RL film. */
export function verifyRLInvariants() {
  verifyInvariant(REWARD.approve === -120, 'approve reward must be -120');
  verifyInvariant(REWARD.ask === -4, 'ask cost must be -4');
  verifyInvariant(REWARD.reviewCost === -18, 'review cost must be -18');
  verifyApprox(REWARD.evidence, 70, 1e-12, 'evidence approval reward');
  verifyApprox(REWARD.review, 80, 1e-12, 'review approval reward');
  verifyApprox(REWARD.extraReview, -10, 1e-12, 'extra review cost');
  verifyApprox(returns.evidence, 59, 1e-12, 'ask route return');
  verifyApprox(returns.review, 54, 1e-12, 'review route return');
  verifyApprox(returns.evidenceReadyHuman, 62, 1e-12, 'evidence-ready review return');

  const sweeps = valueIteration(3);
  verifyInvariant(sweeps[0].new_request === -4, 'sweep 1 new_request = -4');
  verifyInvariant(sweeps[0].evidence_ready === 70, 'sweep 1 evidence_ready = 70');
  verifyInvariant(sweeps[0].review_queue === 80, 'sweep 1 review_queue = 80');
  verifyInvariant(sweeps[1].new_request === 59, 'sweep 2 new_request = 59');
  verifyInvariant(sweeps[2].new_request === 59, 'sweep 3 converges at 59');

  verifyApprox(evidenceValue(0.25), 30.75, 1e-12, '25% abandonment return');
  verifyApprox(indifferenceProbability, 5 / 113, 1e-12, 'indifference probability 5/113');
  verifyApprox(evidenceValue(indifferenceProbability), reviewValue, 1e-9, 'break-even return');
  verifyApprox(evidenceValue(0.04), 54.48, 1e-9, '4% abandonment return');
  verifyApprox(evidenceValue(0.05), 53.35, 1e-9, '5% abandonment return');

  verifyInvariant(explorationLedger(8).counts.join(',') === '1,6,1', '8 episode counts');
  verifyApprox(1 - explorationEpsilon + explorationEpsilon / 3, 0.8666667, 1e-5, 'P(ask)');
  verifyApprox(0.5 * returns.evidence, 29.5, 1e-12, 'one Q-learning step');
  verifyApprox(REWARD.ask + gamma * 50, 41, 1e-12, 'one-step TD target');
  verifyApprox(REWARD.ask + gamma * 62, 51.8, 1e-12, 'SARSA target');
  verifyApprox(REWARD.reviewCost + gamma * 80, 54, 1e-12, 'truncated target');
  verifyApprox(gamma * 0.25, 0.225, 1e-12, 'discounted Bernoulli slope');
  verifyApprox(openingBaseline, -11.75, 1e-12, 'opening policy baseline');
  verifyApprox(updatedPolicy[2], 0.508, 0.002, 'updated review probability');
  verifyApprox((0.8 / 0.5) * (0.6 / 0.5), 1.92, 1e-12, 'trajectory importance weight');

  const receipt = observeEnvironment(mdpBefore, 'ask evidence', mdpEvent);
  verifyInvariant(receipt.elapsedWait === 65 && receipt.reward === -4, 'MDP receipt E17');
}

/** Clamp a play duration so an animation never outruns the scene window. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.45) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside the scene. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.7, margin = 0.45 } = {},
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

/** Sequential fade-out then fade-in across two dynamic views (zero overlap collision). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Schedule a continuous ambient phase animation bounded safely inside the scene. */
export function runPhase(s, c, phaseVal, target = 10, startOffset = 0.08, endMargin = 0.55) {
  const dur = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Soft screen-blended cosmic atmosphere pinned behind a scene. */
export function cinemaAtmosphere(primary = ROLE.state, secondary = ROLE.evidence) {
  return group(
    aura(-460, -210, 560, `${primary}1c`, `${primary}05`),
    aura(490, 180, 620, `${secondary}18`, `${secondary}05`),
  ).zIndex(-80);
}

/** Glowing circular ring node (never a rectangular slide box). */
export function glowRing(
  x,
  y,
  radius,
  color = ROLE.state,
  { fill = '#0b1224', fillOpacity = 1, width = 3.2, glow = 10, dash } = {},
) {
  if (fillOpacity < 1 && fill) {
    const bg = circle(radius, { fill, stroke: null }).at(x, y).opacity(fillOpacity);
    const rim = circle(radius, { fill: null, stroke: color, width, dash }).at(x, y);
    if (glow > 0) rim.glow(glow, color);
    return group(bg, rim);
  }
  const bg = fill ? circle(radius, { fill, stroke: null }).at(x, y) : null;
  const rim = circle(radius, { fill: null, stroke: color, width, dash }).at(x, y);
  if (glow > 0) rim.glow(glow, color);
  return bg ? group(bg, rim) : rim;
}

/** Luminous translucent numeric bar with glowing edge (not a bullet card). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.evidence,
    fillOpacity = 0.34,
    strokeWidth = 2.4,
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const bg = rect(safeW, safeH, { fill: color, stroke: null, radius })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const rim = rect(safeW, safeH, { fill: null, stroke: color, width: strokeWidth, radius })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) rim.glow(glow, color);
  return group(bg, rim);
}

/** Quadratic Bezier points between two 2D endpoints with vertical lift. */
export function arcPts(p0, p1, liftY = -80, steps = 26) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  return pts;
}

/** Evaluate point along quadratic Bezier curve at parameter t in [0, 1]. */
export function evalArc(p0, p1, liftY, t) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + liftY;
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
  ];
}

/** Glowing 2D Bezier trajectory arc with crisp tip arrow and optional photon packet. */
export function glowArcArrow(
  p0,
  p1,
  liftY,
  { color = ROLE.evidence, width = 3.6, glow = 9, opacity = 1, tipSize = 14, photonT = null } = {},
) {
  const pts = arcPts(p0, p1, liftY, 24);
  const trail = glowingTrail(pts, { color, width, glow, opacity });
  const tail = pts[pts.length - 3];
  const head = pts[pts.length - 1];
  const tip = arrow(tail, head, { stroke: color, width, tip: tipSize }).opacity(opacity);
  const items = [trail, tip];
  if (photonT !== null && photonT >= 0 && photonT <= 1) {
    const [px, py] = evalArc(p0, p1, liftY, photonT);
    items.push(glowDot(px, py, { radius: 8, color, glow: 14, opacity }));
  }
  return group(...items);
}

/**
 * Draw the radiant 4-node MDP constellation (New, Evidence, Review, Closed) inside a center+scale box.
 * Zero rectangular cards: pure glowing circular state orbs, curved glowing transition trails,
 * floating edge reward badges (>= 26px), and live state values / photon pulses.
 */
export function drawMdpConstellation({
  cx = -320,
  cy = 45,
  rx = 340,
  ry = 225,
  nodeR = 66,
  values = {},
  activeNode = 'new',
  highlightNode = null,
  pulseEdge = null,
  pulseT = 0,
  backwardWaves = [],
  showExtraReview = true,
  showUnsafe = true,
  alpha = 1,
} = {}) {
  const pos = {
    new: [cx - rx, cy],
    evidence: [cx, cy - ry],
    review: [cx, cy + ry],
    closed: [cx + rx, cy],
  };
  const nodes = [];

  // Helper to offset start/end to orb rims
  const edgePts = (fromId, toId, liftY) => {
    const a = pos[fromId];
    const b = pos[toId];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2 + liftY;
    const angA = Math.atan2(my - a[1], mx - a[0]);
    const angB = Math.atan2(b[1] - my, b[0] - mx);
    const p0 = [a[0] + Math.cos(angA) * (nodeR + 8), a[1] + Math.sin(angA) * (nodeR + 8)];
    const p1 = [b[0] - Math.cos(angB) * (nodeR + 10), b[1] - Math.sin(angB) * (nodeR + 10)];
    return { p0, p1, liftY };
  };

  const edges = [
    {
      id: 'new->evidence',
      from: 'new',
      to: 'evidence',
      lift: -75,
      color: ROLE.evidence,
      label: '-4',
      lx: -28,
      ly: -58,
    },
    {
      id: 'evidence->closed',
      from: 'evidence',
      to: 'closed',
      lift: -75,
      color: ROLE.evidence,
      label: '+70',
      lx: 28,
      ly: -58,
    },
    {
      id: 'new->review',
      from: 'new',
      to: 'review',
      lift: 75,
      color: ROLE.review,
      label: '-18',
      lx: -28,
      ly: 58,
    },
    {
      id: 'review->closed',
      from: 'review',
      to: 'closed',
      lift: 75,
      color: ROLE.review,
      label: '+80',
      lx: 28,
      ly: 58,
    },
  ];
  if (showUnsafe) {
    edges.push({
      id: 'new->closed',
      from: 'new',
      to: 'closed',
      lift: 0,
      color: ROLE.approve,
      label: '-120',
      lx: -135,
      ly: -28,
    });
  }
  if (showExtraReview) {
    edges.push({
      id: 'evidence->review',
      from: 'evidence',
      to: 'review',
      lift: 0,
      color: ROLE.review,
      label: '-10',
      lx: 48,
      ly: 28,
    });
  }

  for (const e of edges) {
    const { p0, p1, liftY } = edgePts(e.from, e.to, e.lift);
    const isPulsed = pulseEdge === e.id;
    const edgeOp = (isPulsed ? 1 : 0.78) * alpha;
    nodes.push(
      glowArcArrow(p0, p1, liftY * 0.55, {
        color: e.color,
        width: isPulsed ? 4.8 : 3.0,
        glow: isPulsed ? 12 : 6,
        opacity: edgeOp,
        tipSize: 13,
        photonT: isPulsed ? pulseT : null,
      }),
    );
    const mid = evalArc(p0, p1, liftY * 0.55, 0.5);
    nodes.push(
      txt(e.label, mid[0] + e.lx, mid[1] + e.ly, 28, e.color, 'mono', 'center').opacity(
        (isPulsed ? 1 : 0.88) * alpha,
      ),
    );
  }

  // Optional backward Bellman wave photons traveling from successor -> predecessor
  for (const w of backwardWaves) {
    if (w.t < 0 || w.t > 1) continue;
    const { p0, p1, liftY } = edgePts(w.to, w.from, w.lift ?? 0);
    const [bx, by] = evalArc(p0, p1, liftY * 0.55, 1 - w.t);
    nodes.push(
      glowDot(bx, by, { radius: 11, color: w.color ?? ROLE.gold, glow: 16, opacity: alpha }),
    );
  }

  // Draw 4 state orbs
  const stateDefs = [
    { id: 'new', short: 'New', title: 'New', sub: 'request', color: ROLE.state, ly: -nodeR - 48 },
    {
      id: 'evidence',
      short: 'Evid.',
      title: 'Evidence',
      sub: 'ready',
      color: ROLE.evidence,
      ly: -nodeR - 48,
    },
    {
      id: 'review',
      short: 'Review',
      title: 'Review',
      sub: 'queue',
      color: ROLE.review,
      ly: nodeR + 48,
    },
    {
      id: 'closed',
      short: 'Closed',
      title: 'Closed',
      sub: 'V = 0',
      color: ROLE.muted,
      ly: -nodeR - 48,
    },
  ];

  for (const st of stateDefs) {
    const [x, y] = pos[st.id];
    const isAct = activeNode === st.id;
    const isHi = highlightNode === st.id;
    const valStr = values[st.id];
    if (isAct || isHi) {
      nodes.push(
        circle(nodeR + 13, {
          fill: null,
          stroke: isHi ? ROLE.gold : st.color,
          width: 3,
          dash: [8, 7],
        })
          .at(x, y)
          .glow(10, isHi ? ROLE.gold : st.color)
          .opacity(0.85 * alpha),
      );
    }
    nodes.push(
      glowRing(x, y, nodeR, st.color, {
        width: isAct || isHi ? 4.2 : 2.8,
        glow: isAct || isHi ? 12 : 7,
      }).opacity(alpha),
    );
    if (valStr !== undefined && valStr !== '') {
      nodes.push(
        txt(String(valStr), x, y, 34, isHi ? ROLE.gold : st.color, 'mono', 'center')
          .glow(7, isHi ? ROLE.gold : st.color)
          .opacity(alpha),
      );
    } else {
      nodes.push(txt(st.short, x, y, 26, COSMOS.ink, 'sans', 'center').opacity(alpha));
    }
    const labelText = valStr !== undefined && valStr !== '' ? st.title : st.sub;
    nodes.push(
      txt(labelText, x, y + st.ly, 26, isHi ? ROLE.gold : st.color, 'sans', 'center').opacity(
        alpha,
      ),
    );
  }

  return { nodes, pos };
}

/**
 * Continuous glowing probability ribbon (3 actions) with clean floating labels & percentages.
 */
export function drawProbRibbon({
  cx = 0,
  cy = -215,
  width = 1360,
  height = 54,
  probs = [1 / 3, 1 / 3, 1 / 3],
  names = ACTIONS,
  colors = ACTION_COLORS,
  alpha = 1,
} = {}) {
  const x0 = cx - width / 2;
  const nodes = [];
  let cursor = x0;
  probs.forEach((p, i) => {
    const segW = Math.max(8, p * width);
    const segCx = cursor + segW / 2;
    nodes.push(
      lumBar(segCx, cy, segW - 6, height, {
        color: colors[i],
        fillOpacity: 0.44,
        strokeWidth: 2.6,
        glow: 9,
        radius: 8,
        opacity: alpha,
      }),
    );
    // Keep floating labels well separated horizontally even when Approve shrinks to 7.7%
    const labelX = i === 0 ? Math.max(x0 + 95, segCx) : segCx;
    nodes.push(
      txt(names[i], labelX, cy - 52, 28, colors[i], 'sans', 'center').opacity(alpha),
      txt(`${(p * 100).toFixed(1)}%`, labelX, cy + 56, 28, colors[i], 'mono', 'center').opacity(
        alpha,
      ),
    );
    cursor += segW;
  });
  return nodes;
}

/**
 * Signature 3D Value-Iteration Terrain (`cinematic3d`, `surface`, `line3d`, `points3d`).
 * Dynamically raises smooth value-surface peaks over the 4 MDP states as Bellman sweeps propagate!
 */
export function buildValueTerrain3d(
  vNewVal,
  vEvidVal,
  vRevVal,
  waveVal,
  { x = -280, y = 45 } = {},
) {
  const half = 2.8;
  // 4 state anchors on the 3D plane: New (-1.7, 0), Evidence (0.1, 1.5), Review (0.1, -1.5), Closed (1.9, 0)
  const S_POS = {
    new: [-1.65, 0.0],
    evidence: [0.15, 1.45],
    review: [0.15, -1.45],
    closed: [1.85, 0.0],
  };

  const scaleH = (v) => 0.18 + Math.max(-0.15, v / 34.0);

  const terrainHeight = (wx, wy) => {
    const hNew = Math.max(0.05, scaleH(vNewVal.value));
    const hEvid = Math.max(0.05, scaleH(vEvidVal.value));
    const hRev = Math.max(0.05, scaleH(vRevVal.value));
    const g = (px, py, sig) => Math.exp(-((wx - px) ** 2 + (wy - py) ** 2) / (2 * sig * sig));
    const ridge1 = g(-0.75, 0.72, 0.62) * Math.min(hNew, hEvid) * 0.42;
    const ridge2 = g(-0.75, -0.72, 0.62) * Math.min(hNew, hRev) * 0.42;
    return (
      0.08 +
      hNew * g(S_POS.new[0], S_POS.new[1], 0.68) +
      hEvid * g(S_POS.evidence[0], S_POS.evidence[1], 0.68) +
      hRev * g(S_POS.review[0], S_POS.review[1], 0.68) +
      ridge1 +
      ridge2
    );
  };

  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.6,
    unit: 100,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const surf = surface((wx, wy) => terrainHeight(wx, wy), {
    x: [-half, half],
    y: [-half, half],
    resolution: [36, 36],
    colors: ['#080e22', '#172959', '#1c5a8a', '#5ce1e6', '#6ee7b7', '#ffd166'],
    mesh: '#7ce8ff',
    meshOpacity: 0.22,
    meshWidth: 0.6,
    opacity: 0.9,
  });

  // Base coordinate grid
  const gridLines = [];
  for (let k = -2; k <= 2; k++) {
    const p = k * 1.3;
    gridLines.push(
      line3d([p, -half, 0.02], [p, half, 0.02], { color: '#3b4e7a', width: 1.2, opacity: 0.42 }),
      line3d([-half, p, 0.02], [half, p, 0.02], { color: '#3b4e7a', width: 1.2, opacity: 0.42 }),
    );
  }

  // Vertical glowing state value pillars
  const pillar = (pt, valObj, col) =>
    line3d(
      [pt[0], pt[1], 0.04],
      () => [pt[0], pt[1], Math.max(0.18, scaleH(valObj.value) + 0.14)],
      {
        color: col,
        width: 4.5,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    );

  // 3D curved Bellman backup conduits from Evidence & Review back to New
  const bezier3 = (a, b, lift) => (t) => {
    const u = 1 - t;
    const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  const evArcFn = bezier3(
    [S_POS.evidence[0], S_POS.evidence[1], 2.25],
    [S_POS.new[0], S_POS.new[1], 1.9],
    0.95,
  );
  const rvArcFn = bezier3(
    [S_POS.review[0], S_POS.review[1], 2.55],
    [S_POS.new[0], S_POS.new[1], 1.9],
    0.95,
  );

  const evCurve = curve3d(evArcFn, 0, 1, {
    color: ROLE.evidence,
    width: 3.0,
    glow: 8,
    blend: 'screen',
    samples: 28,
    opacity: 0.8,
    onTop: true,
  });
  const rvCurve = curve3d(rvArcFn, 0, 1, {
    color: ROLE.review,
    width: 3.0,
    glow: 8,
    blend: 'screen',
    samples: 28,
    opacity: 0.8,
    onTop: true,
  });

  // Top beacon photons + traveling backup photons
  const beacons = points3d(
    () => {
      const pts = [
        [S_POS.new[0], S_POS.new[1], Math.max(0.22, scaleH(vNewVal.value) + 0.16)],
        [S_POS.evidence[0], S_POS.evidence[1], Math.max(0.22, scaleH(vEvidVal.value) + 0.16)],
        [S_POS.review[0], S_POS.review[1], Math.max(0.22, scaleH(vRevVal.value) + 0.16)],
        [S_POS.closed[0], S_POS.closed[1], 0.18],
      ];
      const wt = waveVal.value;
      if (wt > 0.02 && wt < 0.98) {
        pts.push(evArcFn(wt), rvArcFn(wt));
      }
      return pts;
    },
    {
      colorAt: (idx) =>
        [ROLE.gold, ROLE.evidence, ROLE.review, ROLE.muted, '#ffffff', ROLE.state][idx] ??
        ROLE.gold,
      radius: 7.5,
      glow: 14,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(
    surf,
    ...gridLines,
    pillar(S_POS.new, vNewVal, ROLE.gold),
    pillar(S_POS.evidence, vEvidVal, ROLE.evidence),
    pillar(S_POS.review, vRevVal, ROLE.review),
    evCurve,
    rvCurve,
    beacons,
  );
  return { view };
}
