// Shared cinema primitives and verified build-time math invariants for speculative-decoding.
import {
  Node,
  circle,
  delay,
  dot,
  group,
  line,
  linear,
  par,
  polyPath,
  radialGradient,
  rect,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  correctionCounterexample,
  decomposition,
  deliverUntilStop,
  expectedYield,
  isolationFixture,
  prefixStates,
  sampleProposal,
  samplerBoundary,
  transformedLaw,
  verificationBudget,
  visibility,
  weightWorksheet,
} from '../../films/speculative-decoding/arithmetic.mjs';
import {
  CHAIN,
  P,
  Q,
  SAMPLING_COUNTS,
  TWO_GAP_Q,
  WORDS,
} from '../../films/speculative-decoding/fixtures.mjs';
import {
  freshStateFrame,
  residualSnapshot,
  transferSnapshot,
  verifyChain,
} from '../../films/speculative-decoding/model.mjs';

export {
  COSMOS,
  aura,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  rule,
  txt,
  P,
  Q,
  TWO_GAP_Q,
  WORDS,
  CHAIN,
  SAMPLING_COUNTS,
  decomposition,
  expectedYield,
  sampleProposal,
  deliverUntilStop,
  weightWorksheet,
  transformedLaw,
  correctionCounterexample,
  prefixStates,
  visibility,
  isolationFixture,
  verificationBudget,
  samplerBoundary,
  verifyChain,
  residualSnapshot,
  transferSnapshot,
  freshStateFrame,
};

/** Exact sequence-check joint transition fixture matching model and narration. */
export const SEQUENCE_WORDS = Object.freeze(['noon', 'dawn', 'dusk']);
export const SEQUENCE_P0 = Object.freeze([0.4, 0.5, 0.1]);
export const SEQUENCE_COND = Object.freeze([
  [0.1, 0.6, 0.3],
  [0.6, 0.2, 0.2],
  [0.3, 0.2, 0.5],
]);

/** Verify every displayed mathematical invariant against the course model at compile time. */
export function verifySpeculativeInvariants() {
  const base = decomposition(P, Q);
  verifyApprox(base.z, 0.3, 1e-12, 'base rejection mass z');
  verifyApprox(base.acceptance[1], 0.6, 1e-12, 'dog acceptance ratio 0.3/0.5');
  verifyApprox(base.residual[0], 1.0, 1e-12, 'bird residual share');
  P.forEach((pVal, i) => {
    verifyApprox(base.overlap[i] + base.deficit[i], pVal, 1e-12, `exact marginal law [${i}]`);
  });

  const twoGap = decomposition(P, TWO_GAP_Q);
  verifyApprox(twoGap.z, 0.3, 1e-12, 'two-gap z');
  verifyApprox(twoGap.residual[0], 2 / 3, 1e-12, 'two-gap bird residual');
  verifyApprox(twoGap.residual[1], 1 / 3, 1e-12, 'two-gap dog residual');
  verifyApprox(twoGap.residual[2], 0, 1e-12, 'two-gap cat residual');

  verifyInvariant(sampleProposal(Q, 0.35) === 1, 'uniform draw 0.35 selects dog');
  const matched = residualSnapshot(2, 1);
  verifyApprox(matched.result.z, 0, 1e-12, 'matched p=q has zero residual');
  verifyInvariant(matched.result.residual === null, 'matched p=q has null residual');

  const wrong = correctionCounterexample();
  verifyApprox(wrong.wrong[0], 0.48, 1e-12, 'wrong redraw noon 48%');
  verifyApprox(wrong.wrong[1], 0.4, 1e-12, 'wrong redraw dawn 40%');
  verifyApprox(wrong.wrong[2], 0.12, 1e-12, 'wrong redraw dusk 12%');
  wrong.correct.forEach((v, i) => verifyApprox(v, wrong.p[i], 1e-12, `repaired law [${i}]`));

  const law = transformedLaw();
  verifyApprox(law.retained, 0.85, 1e-12, 'top-2 retained mass');
  verifyApprox(law.target[0], 11 / 17, 1e-12, 'served noon 11/17');
  verifyApprox(law.target[1], 6 / 17, 1e-12, 'served dawn 6/17');
  verifyApprox(law.target[2], 0, 1e-12, 'served dusk 0');
  verifyApprox(law.acceptance[0], 1, 1e-12, 'served noon acceptance');
  verifyApprox(law.acceptance[1], 1, 1e-12, 'served dawn acceptance');
  verifyApprox(law.acceptance[2], 0, 1e-12, 'served dusk acceptance');

  const chainRes = verifyChain();
  verifyInvariant(chainRes.committed.join(',') === 'sang,nearby', 'chain commits sang then nearby');
  verifyInvariant(
    chainRes.discarded.join(',') === 'softly,today',
    'chain discards softly and today',
  );
  const fullChain = verifyChain([0.2, 0.2, 0.1]);
  verifyInvariant(
    fullChain.committed.join(',') === 'sang,softly,today,EOS',
    'full accept adds EOS bonus',
  );

  const stopRes = deliverUntilStop(['sang', 'EOS', 'today']);
  verifyInvariant(stopRes.delivered.join(',') === 'sang', 'stops at EOS');
  verifyInvariant(stopRes.discarded.join(',') === 'today', 'discards after EOS');

  const totalRuns = SAMPLING_COUNTS.reduce((a, v) => a + v, 0);
  verifyInvariant(totalRuns === 60000, '60,000 fixed-seed sequence runs');
  let maxErr = 0;
  for (let a = 0; a < 3; a++) {
    for (let z = 0; z < 3; z++) {
      const exact = SEQUENCE_P0[a] * SEQUENCE_COND[a][z];
      const obs = SAMPLING_COUNTS[a * 3 + z] / totalRuns;
      maxErr = Math.max(maxErr, Math.abs(exact - obs));
    }
  }
  verifyInvariant(maxErr < 0.006, 'sequence max error within 0.006 tolerance');

  const w1 = weightWorksheet(1);
  const w6 = weightWorksheet(6);
  verifyApprox(w1.bytes / 1e9, 60, 1e-9, '60 GB BF16 weights');
  verifyApprox(w1.memoryMs, 17.91044776119403, 1e-6, '17.91 ms memory floor');
  verifyApprox(w1.computeMs, 0.0606366851945427, 1e-6, '0.061 ms compute floor');
  verifyApprox(w6.computeMs, 0.3638201111672562, 1e-6, '0.364 ms 6-pos compute floor');
  verifyApprox(w1.ridge, 295.3731343283582, 1e-4, '295.4 dense ridge');

  verifyApprox(expectedYield(0.8, 5), 3.68928, 1e-12, 'depth-5 yield 3.68928');
  verifyApprox(expectedYield(0.8, 10), 4.5705032704, 1e-10, 'depth-10 yield 4.57');
  verifyApprox(expectedYield(0.8, 2), 2.44, 1e-12, 'depth-2 yield 2.44');

  verifyInvariant(!verificationBudget(16, 4).fits, '16 streams x depth 4 = 80 > 64');
  verifyInvariant(verificationBudget(16, 2).fits, '16 streams x depth 2 = 48 <= 64');

  verifyInvariant(visibility([null, null, 0, 1], 2).join(',') === '1,0,1,0', 'tree row 2');
  verifyInvariant(visibility([null, null, 0, 1], 3).join(',') === '0,1,0,1', 'tree row 3');

  const isoBase = isolationFixture(100);
  const isoBig = isolationFixture(10000);
  verifyApprox(isoBase.tree.result, 1.7310585786300048, 1e-6, 'tree masked result 1.731');
  verifyApprox(isoBase.tree.result, isoBig.tree.result, 1e-12, 'tree isolation invariant');
  verifyApprox(isoBase.flat.result, 97.59818472136456, 1e-6, 'flat mask leak 97.598');
  verifyInvariant(isoBig.flat.result > 9700, 'perturbed flat mask exceeds 9700');

  const lookupRes = decomposition([0.2, 0.3, 0.5], [0, 0, 1]);
  verifyApprox(lookupRes.residual[0], 0.4, 1e-12, 'lookup residual[0]=0.4');
  verifyApprox(lookupRes.residual[1], 0.6, 1e-12, 'lookup residual[1]=0.6');
  verifyApprox(lookupRes.residual[2], 0, 1e-12, 'lookup residual[2]=0');

  const fresh = freshStateFrame({ beat: 0, beatP: 0 });
  verifyApprox(fresh.alpha, 5 / 7, 1e-12, 'fresh-state alpha 5/7');
  verifyInvariant(fresh.last === 823 && fresh.repaired === 83, 'fresh-state 823 -> 83');
  verifyInvariant(
    prefixStates([1, 2, 3]).at(-1) === 123 && prefixStates([1, 2, 4]).at(-1) === 124,
    'row-alignment decimal cache 123 -> 124',
  );
  verifyInvariant(
    samplerBoundary(false, true).baselineLawEstablished &&
      !samplerBoundary(true, true).baselineLawEstablished,
    'Medusa-1 vs Medusa-2 target preservation',
  );
  const tx = transferSnapshot(1, 0.9);
  verifyApprox(tx.acceptance, 0.5, 1e-12, 'transfer softly acceptance 0.50');
  verifyInvariant(tx.correction === 'nearby', 'transfer correction nearby');
}

/** Clamp an animation duration so a play starting at `startTime` never overruns `c.end`. */
export function clampDur(c, startTime, desired, margin = 0.25) {
  const avail = Math.max(0.12, c.end - startTime - margin);
  return Math.max(0.12, Math.min(desired, avail));
}

/** Play an animation on a cue with automatic clamping so it never runs past scene end. */
export function onCue(
  s,
  c,
  cueId,
  buildAnim,
  { after = false, desired = 0.6, margin = 0.22 } = {},
) {
  const info = c.cue(cueId);
  const startTime = after ? info.end : info.start;
  const dur = clampDur(c, startTime, desired, margin);
  const fn = () => s.play(buildAnim(dur));
  if (after) c.after(cueId, fn);
  else c.on(cueId, fn);
  return dur;
}

/** Smoothly transition between two visibility Values without overlapping text above 25% opacity. */
export function crossPhase(fromVal, toVal, totalDur = 0.42) {
  const outDur = Math.min(0.16, totalDur * 0.36);
  const gap = Math.min(0.18, totalDur * 0.42);
  const inDur = Math.max(0.12, totalDur - gap);
  return par(fromVal.to(0, { duration: outDur }), delay(toVal.to(1, { duration: inDur }), gap));
}

/** Continuous ambient scene clock value [0 -> 1] bounded safely inside scene window. */
export function startAmbient(s, c, { startOffset = 0.08, endMargin = 0.35 } = {}) {
  const clockVal = s.value(0);
  const span = Math.max(0.5, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(clockVal.to(1, { duration: span, ease: linear }));
  });
  return clockVal;
}

/** Sleek translucent cinema token pill with glowing border and zero border-text collision. */
export function tokenPill(
  word,
  x,
  y,
  {
    w = 220,
    h = 92,
    color = COSMOS.cyan,
    fill = '#111626',
    wordColor = COSMOS.ink,
    wordSize = 34,
    sub = null,
    subColor = color,
    subYOffset = 74,
    topTag = null,
    topColor = COSMOS.muted,
    topYOffset = -72,
    glow = 10,
    strokeWidth = 3.0,
    dash = null,
    opacity = 1,
  } = {},
) {
  const boxOpts = {
    fill,
    stroke: color,
    width: strokeWidth,
    radius: 16,
  };
  if (dash) boxOpts.dash = dash;
  const box = rect(w, h, boxOpts).at(x, y).opacity(opacity);
  if (glow > 0) box.glow(glow, color);
  const parts = [box, txt(word, x, y, wordSize, wordColor, 'mono').opacity(opacity)];
  if (topTag) {
    parts.push(txt(topTag, x, y + topYOffset, 26, topColor, 'mono').opacity(opacity));
  }
  if (sub) {
    parts.push(txt(sub, x, y + subYOffset, 26, subColor, 'mono').opacity(opacity));
  }
  return group(...parts);
}

/** Curved glowing trajectory arc between two screen points (never crosses straight horizontal text). */
export function glowingArc(
  x1,
  y1,
  x2,
  y2,
  bowY = -75,
  { color = COSMOS.cyan, gradientColors, width = 3.6, opacity = 0.9, glow = 10, samples = 24 } = {},
) {
  const cx = (x1 + x2) * 0.5;
  const cy = (y1 + y2) * 0.5 + bowY;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    pts.push([
      mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
      mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
    ]);
  }
  return glowingTrail(pts, {
    color,
    gradientColors,
    width,
    opacity,
    glow,
    core: true,
    coreWidth: 1.1,
    coreOpacity: 0.4,
  });
}

/** Vertical golden parallel verification light beam with additive screen glow. */
export function verifyBeam(x, yTop, yBot, opacity = 1, color = COSMOS.gold) {
  return group(
    line([x, yTop], [x, yBot], { stroke: color, width: 7.5 })
      .glow(18, color)
      .opacity(opacity)
      .set('blend', 'screen'),
    line([x, yTop], [x, yBot], { stroke: '#ffffff', width: 2.0 })
      .opacity(opacity * 0.85)
      .set('blend', 'screen'),
    dot(9, '#ffffff')
      .at(x, (yTop + yBot) * 0.5)
      .glow(18, color)
      .opacity(opacity)
      .set('blend', 'screen'),
  );
}

/** Subtle architectural deep-space grid rail (marked decorative so it never crowds text). */
export function cinemaRails(yTop = -440, yBot = 440, opacity = 0.28) {
  const nodes = [];
  for (const x of [-820, -410, 0, 410, 820]) {
    nodes.push(
      markDecoration(
        line([x, yTop], [x, yBot], { stroke: '#2c3a5e', width: 1.2, dash: [4, 14] }).opacity(
          opacity,
        ),
      ),
    );
  }
  for (const y of [-310, 0, 310]) {
    nodes.push(
      markDecoration(
        line([-860, y], [860, y], { stroke: '#2c3a5e', width: 1.2, dash: [4, 14] }).opacity(
          opacity,
        ),
      ),
    );
  }
  return markDecoration(group(...nodes)).zIndex(-50);
}

/** Draw a clean probability bar track (horizontal) with optional target reference marker. */
export function probBarH(
  x,
  y,
  maxW,
  h,
  value,
  maxVal,
  {
    color = COSMOS.cyan,
    opacity = 1,
    glow = 8,
    trackFill = '#11182c',
    trackStroke = '#2b395c',
  } = {},
) {
  const fillW = Math.max(0, Math.min(maxW, (value / maxVal) * maxW));
  const parts = [
    rect(maxW, h, { fill: trackFill, stroke: trackStroke, width: 1.6, radius: 7 })
      .at(x + maxW * 0.5, y)
      .opacity(opacity),
  ];
  if (fillW > 2) {
    const bar = rect(fillW, h - 4, { fill: color, stroke: null, radius: 5 })
      .at(x + fillW * 0.5, y)
      .opacity(opacity);
    if (glow > 0) bar.glow(glow, color);
    parts.push(bar);
  }
  return group(...parts);
}

/** Glow aura helper whose geometric perimeter stays off-canvas (never crowds text under checkFilm). */
export function heroAura(x, y, radius = 460, inner = '#38bdf822', mid = '#a78bfa12') {
  const outerR = Math.max(1250, radius * 2.4);
  const midStop = Math.min(0.45, (radius * 0.5) / outerR);
  const fadeStop = Math.min(0.75, radius / outerR);
  return circle(outerR, {
    fill: radialGradient([0, 0], outerR, [
      [0, inner],
      [midStop, mid],
      [fadeStop, '#07091000'],
      [1, '#07091000'],
    ]),
    stroke: null,
  })
    .at(x, y)
    .set('blend', 'screen')
    .zIndex(-80);
}
