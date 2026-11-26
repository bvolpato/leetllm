// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Reasoning & Search stage lesson (21 scenes).
import {
  circle,
  curve3d,
  fadeIn,
  fadeOut,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  beamResult,
  branchFixture,
  checkExpression,
  chooseReasoningStrategy,
  combine,
  evaluateTree,
  frontierControlFixture,
  initialItems,
  introductoryMove,
  numberValue,
  reasoningDecision,
  reasoningRecordScore,
  searchValues,
  stateKey,
  stateLabel,
  successorStates,
  valueLabel,
  voteFixture,
} from '../../films/reasoning-search/arithmetic.mjs';
import {
  canonicalAction,
  canonicalVote,
  freshFractionTrace,
  occurrenceExpressionCheck,
} from '../../films/reasoning-search/construction.mjs';
import {
  ANSWER_ALIASES,
  COMPLETE_B_TREE,
  DEAD_END_TRACE,
  FRESH_FRACTION_TREE,
  FRESH_LEAVES,
  FRESH_WRONG_TREE,
  LINEAR_STATES,
  PRUNING_BRANCHES,
  STRATEGY_RECEIPTS,
  VOTING_CASES,
  opTree,
} from '../../films/reasoning-search/fixtures.mjs';
import { cleanRelease, scanFields } from '../../films/reasoning-search/release-sheet.mjs';
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
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  ANSWER_ALIASES,
  CINEMA_FRAME,
  COMPLETE_B_TREE,
  COSMOS,
  DEAD_END_TRACE,
  FRESH_FRACTION_TREE,
  FRESH_LEAVES,
  FRESH_WRONG_TREE,
  LINEAR_STATES,
  PRUNING_BRANCHES,
  STRATEGY_RECEIPTS,
  VOTING_CASES,
  aura,
  beamResult,
  branchFixture,
  canonicalAction,
  canonicalVote,
  checkExpression,
  chooseReasoningStrategy,
  cinematic3d,
  cleanRelease,
  combine,
  evaluateTree,
  freshFractionTrace,
  frontierControlFixture,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  initialItems,
  introductoryMove,
  metricReadout,
  numberValue,
  occurrenceExpressionCheck,
  opTree,
  orbitScene,
  reasoningDecision,
  reasoningRecordScore,
  rule,
  scanFields,
  searchValues,
  stateKey,
  stateLabel,
  successorStates,
  txt,
  valueLabel,
  verifyApprox,
  verifyInvariant,
  voteFixture,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 21 reasoning-search scenes:
 *   model / reasoning / policy  -> violet
 *   service / host / trusted    -> blue
 *   path / branch / token       -> cyan
 *   ok / valid / admit / solved -> emerald
 *   focus / score / vote / math -> gold
 *   fail / reject / dead end    -> rose
 *   caution / abstain / prune   -> amber
 */
export const ROLE = Object.freeze({
  model: COSMOS.violet,
  policy: COSMOS.violet,
  reasoning: COSMOS.violet,
  service: COSMOS.blue,
  host: COSMOS.blue,
  trusted: COSMOS.blue,
  path: COSMOS.cyan,
  branch: COSMOS.cyan,
  token: COSMOS.cyan,
  ok: COSMOS.emerald,
  valid: COSMOS.emerald,
  solved: COSMOS.emerald,
  focus: COSMOS.gold,
  score: COSMOS.gold,
  vote: COSMOS.gold,
  fail: COSMOS.rose,
  reject: COSMOS.rose,
  dead: COSMOS.rose,
  caution: COSMOS.amber,
  abstain: COSMOS.amber,
  prune: COSMOS.amber,
});

export const FIVE_REPLY_SAMPLES = Object.freeze([
  'Merge release',
  'merge_release',
  'Auto merge approved change',
  'manual_review',
  'force',
]);

export const ROOT_CAP_ONE = searchValues([4, 5, 6, 7], 1);
export const BRANCH_A_CAP_ONE = searchValues([24, 5, 7], 1);
export const BRANCH_A_FULL = searchValues([24, 5, 7]);
export const FRONTIER_FIXTURE = frontierControlFixture();
export const VOTE_PUZZLE_FIXTURE = voteFixture();

/** Build-time mathematical invariant suite covering every spoken value in reasoning-search. */
export function verifyReasoningSearchInvariants() {
  // Scene 1: Policy decision record
  const mistaken = {
    checks: { ...cleanRelease, security_scan_clear: false },
    final_action: 'merge_release',
  };
  const repaired = { checks: cleanRelease, final_action: 'merge_release' };
  const partial = { checks: { tests_passed: true }, final_action: 'manual_review' };

  const sMistaken = reasoningRecordScore(mistaken, cleanRelease);
  verifyInvariant(
    sMistaken.coverage === 1 && !sMistaken.valuesMatch && sMistaken.actionMatches,
    'mistaken scan: 3/3 fields, values mismatch, action matches',
  );
  const sRepaired = reasoningRecordScore(repaired, cleanRelease);
  verifyInvariant(
    sRepaired.coverage === 1 && sRepaired.valuesMatch && sRepaired.actionMatches,
    'repaired record: all agree',
  );
  const sPartial = reasoningRecordScore(partial, cleanRelease);
  verifyApprox(sPartial.coverage, 1 / 3, 1e-9, 'partial record 1/3 coverage');
  verifyInvariant(
    !sPartial.valuesMatch && !sPartial.actionMatches,
    'partial record disagrees with rule',
  );

  // Scene 5: Canonical answer voting
  const v60 = canonicalVote(FIVE_REPLY_SAMPLES, 0.6);
  const v80 = canonicalVote(FIVE_REPLY_SAMPLES, 0.8);
  verifyApprox(v60.share, 0.6, 1e-9, '3/5 vote share = 0.60');
  verifyInvariant(
    v60.counts.merge_release === 3 && v60.rejected === 1 && v60.decision === 'merge_release',
    'vote at 60% selects merge_release',
  );
  verifyInvariant(v80.decision === 'abstain', 'vote at 80% abstains');
  verifyInvariant(canonicalVote([]).decision === 'abstain', 'empty batch abstains');

  // Scene 6: Sampling cost ledger (5 cases: 2/5 vs 3/5, 5 vs 25 samples)
  const firstHits = VOTING_CASES.filter((vc) => canonicalAction(vc.samples[0]) === vc.expected);
  const voteHits = VOTING_CASES.filter((vc) => canonicalVote(vc.samples).decision === vc.expected);
  const abstentions = VOTING_CASES.filter((vc) => canonicalVote(vc.samples).decision === 'abstain');
  verifyInvariant(firstHits.length === 2, 'first reply hits 2/5 (40%)');
  verifyInvariant(voteHits.length === 3, 'vote-5 hits 3/5 (60%)');
  verifyInvariant(abstentions.length === 1, 'vote-5 has 1 abstention');
  verifyInvariant(VOTING_CASES.length * 5 === 25, '5 cases x 5 samples = 25');

  // Scenes 8-12: Arithmetic 24 puzzle, branches, contract, frontier, pruning
  verifyInvariant(
    introductoryMove(1, 0.9).remaining.join(',') === '24,5,7' &&
      introductoryMove(2, 0).check.reachesGoal &&
      !introductoryMove(2, 0).check.allInputsUsed,
    '6*4=24 leaves 5 and 7 unused',
  );
  verifyInvariant(
    LINEAR_STATES.length === 4 && LINEAR_STATES[3].remaining[0] === 24,
    'linear path',
  );
  verifyInvariant(
    PRUNING_BRANCHES.branchA.heuristic === 0.95 && PRUNING_BRANCHES.branchB.heuristic === 0.4,
    'heuristic scores 0.95 vs 0.40',
  );
  verifyInvariant(
    beamResult(1).result === 'no-solution-in-retained-frontier' &&
      beamResult(2).result === 'solved',
    'beam width 1 fails, width 2 solves',
  );
  verifyInvariant(checkExpression(COMPLETE_B_TREE).valid, '(6-4)*(5+7)=24 valid');
  verifyInvariant(
    FRONTIER_FIXTURE.generatedCount === 36 && FRONTIER_FIXTURE.children.length === 2,
    '36 successors from [4,5,6,7]',
  );

  // Scene 13: Votes and checks
  verifyInvariant(
    VOTE_PUZZLE_FIXTURE.winner === '24' &&
      VOTE_PUZZLE_FIXTURE.votes === 3 &&
      VOTE_PUZZLE_FIXTURE.checked.every((r) => !r.valid && r.reachesGoal && !r.allInputsUsed),
    '3/3 votes for 6*4 fail operand conservation',
  );

  // Scene 14: Budget and claims
  verifyInvariant(
    ROOT_CAP_ONE.visited === 1 &&
      ROOT_CAP_ONE.frontier.length === 36 &&
      ROOT_CAP_ONE.status === 'budget-exhausted',
    'root cap 1 leaves 36 waiting',
  );
  verifyInvariant(
    BRANCH_A_CAP_ONE.visited === 1 &&
      BRANCH_A_CAP_ONE.frontier.length === 18 &&
      BRANCH_A_CAP_ONE.status === 'budget-exhausted',
    'tray A cap 1 leaves 18 waiting',
  );
  verifyInvariant(
    BRANCH_A_FULL.visited === 85 &&
      BRANCH_A_FULL.frontier.length === 0 &&
      BRANCH_A_FULL.status === 'no-solution' &&
      DEAD_END_TRACE.length === 85,
    'tray A exhaustive search examines 85 distinct states',
  );

  // Scene 17: Quality and latency gate
  verifyInvariant(
    chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, 900)?.strategy === 'vote_5',
    '90% / 900ms selects vote_5',
  );
  verifyInvariant(
    chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, 100) === null,
    '90% / 100ms qualifies none',
  );
  verifyInvariant(
    chooseReasoningStrategy([{ strategy: 'bad', accuracy: Infinity, p95_ms: -1, calls: 1 }]) ===
      null,
    'invalid metrics rejected',
  );

  // Scene 20: Fresh duplicate puzzle (3, 3, 8, 8)
  const wrongCheck = occurrenceExpressionCheck(FRESH_WRONG_TREE);
  const rightCheck = occurrenceExpressionCheck(FRESH_FRACTION_TREE);
  const stolenTree = { ...FRESH_FRACTION_TREE, left: FRESH_LEAVES[2] };
  const stolenCheck = occurrenceExpressionCheck(stolenTree);
  verifyInvariant(wrongCheck.result === '25' && !wrongCheck.valid, '(8-3)*(8-3)=25 misses by 1');
  verifyInvariant(rightCheck.result === '24' && rightCheck.valid, '8b/(3b-8a/3a)=24 valid');
  verifyInvariant(
    stolenCheck.result === '24' && !stolenCheck.occurrencesValid && !stolenCheck.valid,
    'reusing 8a fails occurrence check',
  );

  // Scene 21: Typed observation handoff
  verifyInvariant(
    reasoningDecision({ ...cleanRelease, security_scan_clear: false }) === 'manual_review',
    'failed scan sends release to manual_review',
  );
}

export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -435, accent = COSMOS.violet, size = 48, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 58, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 120, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

export function clampDur(c, startTime, desired, margin = 0.4) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

/** Non-overlapping sequential crossfade helpers (0..0.4 out, 0.6..1.0 in). */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

export function glowMeter(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#0f1629',
    border = '#2c3d66',
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 6) * clamped);
  const bar = rect(innerW, h - 6, { fill, stroke: null, radius: Math.max(4, radius - 2) })
    .at(xLeft + 3 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = (a[1] + b[1]) * 0.5 + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
    ]);
  }
  return pts;
}

export function beamWithPhotons(
  pts,
  color,
  phaseVal,
  { width = 3.4, glow = 9, photonCount = 2, alpha = 1 } = {},
) {
  const nodes = [glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha })];
  if (photonCount > 0 && alpha > 0.15) {
    const last = pts.length - 1;
    for (let i = 0; i < photonCount; i++) {
      const u = ((((phaseVal ?? 0) + i / photonCount) % 1) + 1) % 1;
      const idx = u * last;
      const k = Math.min(last - 1, Math.floor(idx));
      const f = idx - k;
      const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
      const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      nodes.push(glowDot(px, py, { radius: 5.0, color: '#ffffff', glow: 10, opacity: alpha }));
    }
  }
  return group(...nodes);
}

/** Trim a 2D line segment by padA / padB so strokes never cross circle labels. */
export function trimSeg(a, b, padA = 48, padB = 48) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Compute auto-sized circular orb radius matching orbNode clearance rule. */
export function orbRadius(label, radius = 48) {
  return Math.max(radius, Math.ceil(String(label).length * 9.5 + 22));
}

/** Illuminated circular graph/token node with auto-sized label clearance. */
export function orbNode(
  x,
  y,
  label,
  color,
  { radius = 48, sub = null, opacity = 1, glow = 8, size = 28 } = {},
) {
  const r = orbRadius(label, radius);
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 34, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

/** Shaded 3D prism block with luminous edges. */
export function addBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  fillColor,
  edgeColor = fillColor,
  { faceOpacity = 0.78, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const faceOpts = {
    resolution: [1, 1],
    color: fillColor,
    opacity: faceOpacity,
    mesh: false,
    shaded: true,
  };
  const edgeOpts = {
    color: edgeColor,
    width: edgeWidth,
    opacity: edgeOpacity,
    glow: edgeGlow,
    ...(blend ? { blend } : {}),
  };
  const objs = [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    line3d([x0, y0, z0], [x1, y0, z0], edgeOpts),
    line3d([x1, y0, z0], [x1, y1, z0], edgeOpts),
    line3d([x1, y1, z0], [x0, y1, z0], edgeOpts),
    line3d([x0, y1, z0], [x0, y0, z0], edgeOpts),
    line3d([x0, y0, z1], [x1, y0, z1], edgeOpts),
    line3d([x1, y0, z1], [x1, y1, z1], edgeOpts),
    line3d([x1, y1, z1], [x0, y1, z1], edgeOpts),
    line3d([x0, y1, z1], [x0, y0, z1], edgeOpts),
    line3d([x0, y0, z0], [x0, y0, z1], edgeOpts),
    line3d([x1, y0, z0], [x1, y0, z1], edgeOpts),
    line3d([x1, y1, z0], [x1, y1, z1], edgeOpts),
    line3d([x0, y1, z0], [x0, y1, z1], edgeOpts),
  ];
  view.add(...objs);
  return objs;
}

/** Glowing 3D quadratic arc with optional traveling photon. */
export function addArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.7, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const evalPt = (t) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  const objs = [
    curve3d(evalPt, 0, 1, { color, width, glow, blend: 'screen', samples: 32, opacity }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalPt((pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.2,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

export function hideNodes(nodes) {
  for (const n of nodes) n.hide();
  return nodes;
}

export function fadeInNodes(s, c, triggerTime, nodes, desired = 0.35) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeIn(n, { duration }))));
}

export function fadeOutNodes(s, c, triggerTime, nodes, desired = 0.3) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeOut(n, { duration }))));
}
