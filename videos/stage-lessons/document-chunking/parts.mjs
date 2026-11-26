// Shared cinematic primitives, math imports, and orbiting 3D chunk-strata stage for document-chunking.
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
  LONG_SECTION,
  RELEASE_QUERY,
  RELEASE_WORD_CAP,
  REVISED_RULE,
  RUNBOOK,
  RUNBOOK_WORDS,
} from '../../films/document-chunking/fixtures.mjs';
import {
  balancedChildren,
  cosine,
  fixedWindows,
  requiredPhrasesPresent,
  topicVector,
} from '../../films/document-chunking/arithmetic.mjs';
import {
  answerabilityFixture,
  checkedParents,
  freshEvidence,
  headedSection,
  lateChunkFixture,
  manifestChecksums,
  overlapExperiment,
  parentExpansion,
  releaseComparison,
} from '../../films/document-chunking/model.mjs';
import { pagingContext, revisedContext } from '../../films/document-chunking/packing.mjs';
import { validateModel } from '../../films/document-chunking/validation.mjs';

export {
  COSMOS,
  LONG_SECTION,
  RELEASE_QUERY,
  RELEASE_WORD_CAP,
  REVISED_RULE,
  RUNBOOK,
  RUNBOOK_WORDS,
  answerabilityFixture,
  aura,
  balancedChildren,
  checkedParents,
  circle,
  cosine,
  fixedWindows,
  freshEvidence,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  headedSection,
  heroTitle,
  lateChunkFixture,
  line,
  manifestChecksums,
  overlapExperiment,
  pagingContext,
  parentExpansion,
  rect,
  releaseComparison,
  requiredPhrasesPresent,
  revisedContext,
  topicVector,
  txt,
};

export const OVERLAP_EXP = overlapExperiment();
export const LATE_FIXTURE = lateChunkFixture();
export const CHECKSUMS = manifestChecksums();
export const RELEASE_ROWS = releaseComparison();
export const BALANCED_5 = balancedChildren(LONG_SECTION, 7, 4);

export function verifyDocumentChunkingInvariants() {
  validateModel();
  verifyInvariant(RUNBOOK_WORDS.length === 17, 'runbook page has 17 words');
  verifyInvariant(OVERLAP_EXP[0].indexedWords === 17, '0-overlap indexes 17 words');
  verifyInvariant(OVERLAP_EXP[1].indexedWords === 21, '2-overlap indexes 21 words');
  verifyInvariant(OVERLAP_EXP[2].indexedWords === 33, '4-overlap indexes 33 words');
  verifyInvariant(
    OVERLAP_EXP.every((row) => row.completeRuleChunks === 0),
    '7-word windows never hold 10-word rule',
  );
  verifyApprox(LATE_FIXTURE.pooledFeature, 0.71, 1e-6, 'late chunk pooled Maya coordinate');
  verifyInvariant(pagingContext(10).complete === true, '10-word budget packs full rule');
  verifyInvariant(pagingContext(9).complete === false, '9-word budget drops condition');
  verifyInvariant(revisedContext(12, { parent: true }).complete === true, '12-word parent fits');
  verifyInvariant(
    revisedContext(11, { parent: true }).complete === false,
    '11-word parent abstains',
  );
  verifyInvariant(CHECKSUMS.originalHash !== CHECKSUMS.editedHash, '15->20 changes sha256');
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

// Orbiting 3D Parent-Child Chunk Strata & Window Architecture (compact floor, direct 3D primitives)
export function makeChunkStrata3D(cx, cy, phaseVal, mode = 'intro') {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 17.6,
    unit: 86,
    focus: [0, 0, 0.4],
  }).at(cx, cy);

  const floor = parametricSurface(
    (u, v) => [-2.2 + u * 4.4, -1.5 + v * 3.0, -0.35],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#111c33',
      mesh: '#2c426e',
      meshOpacity: 0.45,
      meshWidth: 0.9,
      opacity: 0.25,
      shaded: false,
    },
  );

  // Upper layer (z = 1.25): Full Parent Section slab
  const parentSlab = wireframeSlab3d([0, 0, 1.25], 1.9, 0.52, 0.22, {
    color: COSMOS.emerald,
    width: 2.3,
    glow: 9,
    opacity: 0.94,
  });

  // Lower layer (z = 0.0): Child Chunk slabs (overlapping or split)
  const childA = wireframeSlab3d([-0.85, -0.35, 0.0], 0.95, 0.38, 0.2, {
    color: COSMOS.cyan,
    width: 2.1,
    glow: 8,
    opacity: 0.9,
  });
  const childB = wireframeSlab3d([0.85, 0.35, 0.0], 0.95, 0.38, 0.2, {
    color: mode === 'transfer' ? COSMOS.emerald : COSMOS.gold,
    width: 2.1,
    glow: 8,
    opacity: 0.9,
  });

  // Parent-child pointer beams rising from children to parent
  const linkA = line3d([-0.85, -0.35, 0.2], [-0.7, 0, 1.03], {
    stroke: COSMOS.cyan,
    width: 3.0,
    glow: 8,
  });
  const linkB = line3d([0.85, 0.35, 0.2], [0.7, 0, 1.03], {
    stroke: COSMOS.gold,
    width: 3.0,
    glow: 8,
  });

  const nodes = points3d(
    [
      [-0.85, -0.35, 0.2],
      [0.85, 0.35, 0.2],
      [-0.7, 0, 1.03],
      [0.7, 0, 1.03],
    ],
    {
      colorAt: (i) => (i < 2 ? COSMOS.gold : COSMOS.emerald),
      radius: 8,
      glow: 11,
      onTop: true,
    },
  );

  // Animated retrieval photons climbing from child hits up to parent context
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (p * 0.42) % 1;
      const u2 = (p * 0.42 + 0.5) % 1;
      return [
        [-0.85 + 0.15 * u1, -0.35 * (1 - u1), 0.2 + 0.83 * u1],
        [0.85 - 0.15 * u2, 0.35 * (1 - u2), 0.2 + 0.83 * u2],
      ];
    },
    { color: COSMOS.emerald, radius: 7.5, glow: 13, blend: 'screen', onTop: true },
  );

  view.add(floor, ...parentSlab, ...childA, ...childB, linkA, linkB, nodes, photons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}
