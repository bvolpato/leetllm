// Shared cinematic palette, verified math invariants, and 3D/vector primitives
// for the 15-scene State-Space Models & Mamba stage film.
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
import { compose, run, selectiveCoefficients } from '../../films/state-space-models/arithmetic.mjs';
import {
  contrib,
  hs,
  pairs,
  selective,
  weights,
  xs,
} from '../../films/state-space-models/fixtures.mjs';
import {
  affineScanLevels,
  amendedSpec,
  bufferFixture,
  cacheWorksheet,
  checkpointSnapshot,
  chunkStateFixture,
  contentWriteFixture,
  latestRetryLimit,
  lookupCases,
  multiDirectionFixture,
  openingFiles,
  orderedAffineFixture,
  orderedPrefixTree,
  timingFixture,
  trapezoidWriteFixture,
  validateModel,
} from '../../films/state-space-models/model.mjs';
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
  affineScanLevels,
  amendedSpec,
  arrow,
  aura,
  bufferFixture,
  cacheWorksheet,
  checkpointSnapshot,
  chunkStateFixture,
  cinematic3d,
  circle,
  compose,
  contentWriteFixture,
  contrib,
  dot,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  hs,
  latestRetryLimit,
  line,
  line3d,
  lookupCases,
  metricReadout,
  multiDirectionFixture,
  openingFiles,
  orbitScene,
  orderedAffineFixture,
  orderedPrefixTree,
  pairs,
  parametricSurface,
  rect,
  rule,
  run,
  selective,
  selectiveCoefficients,
  seq,
  timingFixture,
  trapezoidWriteFixture,
  txt,
  weights,
  wireframeSlab3d,
  xs,
};

/** One semantic color per conceptual role across all 15 scenes. */
export const ROLE = Object.freeze({
  state: COSMOS.emerald,
  carry: COSMOS.blue,
  write: COSMOS.rose,
  read: COSMOS.cyan,
  delta: COSMOS.gold,
  hybrid: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
});

export function verifySsmInvariants() {
  verifyInvariant(validateModel() === true, 'SSM model.mjs self-validation passes');
  verifyApprox(openingFiles[0].returned, 1.25, 1e-9, 'File A opening collision state');
  verifyApprox(openingFiles[1].returned, 1.25, 1e-9, 'File B opening collision state');
  verifyApprox(hs[3], 1.7194, 1e-9, '4-step recurrence final state');
  verifyApprox(contentWriteFixture(xs, 0.3).output, 2.7994, 1e-9, 'content-dependent write output');
  verifyApprox(Math.exp(-1), 0.36787944, 1e-6, 'unit-step retention e^-1');
  verifyApprox(1 - Math.exp(-1), 0.63212056, 1e-6, 'exact ZOH write at delta=1');
  verifyApprox(selective.at(-1).h, 1.085, 0.002, 'selective final state');
  const buf = bufferFixture();
  verifyApprox(buf.restored.at(-1).state, 4.3875, 1e-9, 'restored conv buffer final state');
  verifyApprox(buf.dropped.at(-1).state, 3.7375, 1e-9, 'dropped conv buffer final state');
  verifyInvariant(
    timingFixture(16).attention === 168 && timingFixture(16).ssm === 177,
    '16-token timings',
  );
  verifyInvariant(
    timingFixture(256).attention === 936 && timingFixture(256).ssm === 609,
    '256-token timings',
  );
  verifyInvariant(
    cacheWorksheet(32).kvGiB === 32 && cacheWorksheet(4).kvGiB === 4,
    'hybrid KV cache GiB',
  );
  verifyInvariant(latestRetryLimit(amendedSpec) === 2, 'latest amended retry limit is 2');
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

export function arcPts(p0, p1, lift = -100, steps = 28) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + lift;
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

export function valuePill(
  label,
  x,
  y,
  {
    w = 160,
    h = 68,
    color = ROLE.read,
    fill = '#10182d',
    size = 32,
    font = 'mono',
    glow = 8,
    opacity = 1,
    strokeWidth = 2.6,
  } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: strokeWidth, radius: 12 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, COSMOS.ink, font, 'center').opacity(opacity));
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
      glowDot(x0 + w, y, {
        radius: Math.min(7, height * 0.28),
        color,
        glow: glow + 2,
        opacity,
      }),
    );
  }
  return group(...items);
}

/** Orbiting 3D continuous-to-discrete decay & selective state wave surface. */
export function buildDecayManifold3d(deltaVal, { x = 350, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.0,
    unit: 112,
    focus: [0, 0, 0.4],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const lag = u * 4.5;
      const step = 0.1 + v * 2.0;
      const z = 2.1 * Math.exp(-lag * step * 0.65);
      return [(u - 0.5) * 5.0, (v - 0.5) * 4.8, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 16],
      colors: ['#101a38', '#1d4d7c', '#5ce1e6', '#6ee7b7', '#ffd166'],
      opacity: 0.86,
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.7,
    },
  );

  const probeCage = wireframeSlab3d(
    () => [0, ((Math.max(0.1, Math.min(2.0, deltaVal.value)) - 0.1) / 1.9 - 0.5) * 4.8, 0.9],
    2.55,
    0.22,
    0.85,
    { color: COSMOS.gold, width: 2.8, glow: 9 },
  );

  view.add(surf, ...probeCage);
  return view;
}

/** Orbiting 3D lower-triangular semi-separable SSD kernel matrix (Mamba-2 duality). */
export function buildSsdMatrix3d(chunkSplitVal, { x = 350, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.8,
    phi: 1.05,
    distance: 15.2,
    unit: 110,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const causal = u <= v + 0.03;
      const lag = Math.max(0, v - u);
      const splitGap = chunkSplitVal.value * 0.25 * (u > 0.5 ? 1 : -1);
      const z = causal ? 0.3 + 1.8 * Math.exp(-lag * 3.2) : 0.05;
      return [(u - 0.5) * 5.0 + splitGap, (v - 0.5) * 5.0, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 18],
      colors: ['#111830', '#2a2e68', '#5ce1e6', '#6ee7b7', '#ffd166'],
      opacity: 0.86,
      mesh: '#ffffff',
      meshOpacity: 0.14,
      meshWidth: 0.7,
      animate: true,
    },
  );

  view.add(surf);
  return view;
}
