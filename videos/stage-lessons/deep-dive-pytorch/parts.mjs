// Shared visual primitives, 3D cinema rigs, and model-verified constants for Deep Dive - PyTorch.
import { curve3d, gridPlane3d, group, line, line3d, linear, points3d, rect } from 'vizmatic/stage';
import {
  adam,
  address,
  beforeFresh,
  freshBad,
  freshGood,
  next as adamNext,
  pipelineSlots,
  product,
  reset as adamReset,
  saved as adamSaved,
  tpProjectionFixture,
} from '../../films/deep-dive-pytorch/arithmetic.mjs';
import { validateModel } from '../../films/deep-dive-pytorch/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic as kitGuardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  adam,
  adamNext,
  adamReset,
  adamSaved,
  address,
  aura,
  beforeFresh,
  cinematic3d,
  freshBad,
  freshGood,
  glowDot,
  glowTex,
  glowingTrail,
  heroTitle,
  line,
  orbitScene,
  pipelineSlots,
  product,
  rect,
  tpProjectionFixture,
  txt,
  wireframeSlab3d,
};

export const ROLE = {
  orig: COSMOS.blue,
  trans: COSMOS.gold,
  copy: COSMOS.cyan,
  grad: COSMOS.violet,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  compile: COSMOS.amber,
  comm: COSMOS.cyan,
  dim: '#4a5572',
};

export const ORIGINAL_ORDER = Array.from({ length: 6 }, (_, i) =>
  address([Math.floor(i / 3), i % 3], [3, 1]),
);
export const TRANSPOSED_ORDER = Array.from({ length: 6 }, (_, i) =>
  address([Math.floor(i / 2), i % 2], [1, 3]),
);
export const STORAGE_INIT = [0, 1, 2, 3, 4, 5];
export const STORAGE_COPIED = [0, 3, 1, 4, 2, 5];

export const ATTN_SCORES = [1 / Math.sqrt(2), 0];
export const ATTN_WEIGHTS_BOTH = (() => {
  const e0 = Math.exp(ATTN_SCORES[0]);
  const e1 = Math.exp(ATTN_SCORES[1]);
  const z = e0 + e1;
  return [e0 / z, e1 / z];
})();
export const ATTN_OUT_BOTH = [ATTN_WEIGHTS_BOTH[0] * 10, ATTN_WEIGHTS_BOTH[1] * 20];
export const SCORE_CELLS_8192 = product([1, 2, 8192, 8192]);
export const SCORE_MIB_8192 = (SCORE_CELLS_8192 * 2) / (1024 * 1024);

export const TP_FIXTURE = tpProjectionFixture();
export const PIPE_2_FWD = pipelineSlots(2, 'forward');
export const PIPE_2_GPIPE = pipelineSlots(2, 'gpipe');
export const PIPE_2_1F1B = pipelineSlots(2, '1f1b');
export const PIPE_4_FWD = pipelineSlots(4, 'forward');

export function verifyPytorchInvariants() {
  validateModel();
  verifyInvariant(address([1, 0], [3, 1]) === 3, 'original(1,0) == 3');
  verifyInvariant(address([0, 1], [1, 3]) === 3, 'transposed(0,1) == 3');
  verifyInvariant(address([0, 1], [1, 3]) * 8 === 24, 'byte offset of 3 == 24');
  verifyInvariant(SCORE_CELLS_8192 === 134217728, '8192 score cells');
  verifyInvariant(SCORE_MIB_8192 === 256, '8192 score MiB (FP16)');
  verifyApprox(ATTN_WEIGHTS_BOTH[0], 0.66976, 1e-4, 'attn p0');
  verifyApprox(ATTN_OUT_BOTH[0], 6.6976, 1e-3, 'attn out x');
  verifyApprox(ATTN_OUT_BOTH[1], 6.6048, 1e-3, 'attn out y');
  verifyApprox(adamSaved.w, 0.99, 1e-4, 'adam saved w');
  verifyInvariant(
    adamNext.w < adamSaved.w && adamReset.w > adamSaved.w,
    'adam next moves left vs reset right',
  );
  verifyInvariant(
    Math.abs(freshBad.w - beforeFresh.w) > Math.abs(freshGood.w - beforeFresh.w),
    'fresh reset moves farther',
  );
  verifyInvariant(TP_FIXTURE.result.join(',') === '4,1', 'tp projection result');
  verifyInvariant(PIPE_2_FWD.idle === 2, 'pipe 2 fwd idle');
  verifyInvariant(PIPE_4_FWD.idle === 2, 'pipe 4 fwd idle');
}

export function guardedDynamic(vis, renderFn, threshold = 0.02) {
  const getter = typeof vis === 'number' ? () => vis : vis;
  return kitGuardedDynamic(getter, renderFn, threshold);
}

export function glassCell(x, y, w, h, strokeColor = COSMOS.cyan, opts = {}) {
  const { fill = '#0d1424', strokeWidth = 2.4, radius = 12, glow = 6, opacity = 1 } = opts;
  const box = rect(w, h, {
    fill,
    stroke: strokeColor,
    width: strokeWidth,
    radius,
  }).at(x, y);
  const g = glow > 0 ? box.glow(glow, strokeColor) : box;
  return opacity < 1 ? g.opacity(opacity) : g;
}

export function glowingArc(
  x1,
  y1,
  x2,
  y2,
  lift,
  color = COSMOS.cyan,
  { width = 3.2, opacity = 0.92 } = {},
) {
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5 + lift;
  const pts = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    pts.push([u * u * x1 + 2 * u * t * mx + t * t * x2, u * u * y1 + 2 * u * t * my + t * t * y2]);
  }
  return glowingTrail(pts, { color, width, opacity, core: false });
}

export function remainDuration(c, cueId, want = 0.55) {
  const start = typeof cueId === 'string' ? c.cue(cueId).start : cueId;
  return Math.max(0.16, Math.min(want, c.end - start - 0.55));
}

export function runPhase(s, c, phaseVal, cycles = 12) {
  const span = Math.max(0.8, c.end - c.start - 0.5);
  c.at(0, () => {
    s.play(phaseVal.to(cycles, { duration: span, ease: linear }));
  });
}

export function buildStorageStrip3d(modeVal, phaseVal, { x = 455, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 14.8,
    unit,
    focus: [0, 0, 0.5],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.4, 2.4],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  for (let i = 0; i < 6; i++) {
    const px = (i - 2.5) * 0.95;
    view.add(
      ...wireframeSlab3d([px, 0, 0.4], 0.36, 0.36, 0.36, {
        color: i === 3 ? ROLE.trans : ROLE.orig,
        width: i === 3 ? 2.8 : 1.8,
        glow: i === 3 ? 10 : 6,
      }),
    );
  }

  for (let k = 0; k < TRANSPOSED_ORDER.length - 1; k++) {
    const a = (TRANSPOSED_ORDER[k] - 2.5) * 0.95;
    const b = (TRANSPOSED_ORDER[k + 1] - 2.5) * 0.95;
    const arch = Math.abs(TRANSPOSED_ORDER[k + 1] - TRANSPOSED_ORDER[k]) > 1 ? 1.15 : 0.45;
    view.add(
      curve3d((u) => [a + (b - a) * u, (k - 2) * 0.16, 0.82 + Math.sin(u * Math.PI) * arch], 0, 1, {
        color: ROLE.trans,
        width: 2.6,
        glow: 7,
        blend: 'screen',
        samples: 20,
        opacity: 0.72,
      }),
    );
  }

  view.add(
    points3d(
      () => {
        const m = modeVal.value;
        const p = phaseVal.value;
        const order = m < 0.5 ? TRANSPOSED_ORDER : ORIGINAL_ORDER;
        const seg = (p * 0.95) % (order.length - 1);
        const idx = Math.floor(seg);
        const frac = seg - idx;
        const a = (order[idx] - 2.5) * 0.95;
        const b = (order[idx + 1] - 2.5) * 0.95;
        const arch = m < 0.5 ? 1.15 : 0.35;
        return [[a + (b - a) * frac, 0, 0.85 + Math.sin(frac * Math.PI) * arch]];
      },
      { color: COSMOS.gold, size: 8, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

export function buildAutogradGraph3d(stageVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.0,
    distance: 14.5,
    unit,
    focus: [0, 0, 0.6],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  const nodes3d = [
    { pos: [-2.1, -0.6, 0.45], col: ROLE.orig },
    { pos: [-0.7, 0.55, 0.95], col: ROLE.grad },
    { pos: [0.8, -0.35, 1.35], col: ROLE.compile },
    { pos: [2.1, 0.55, 1.75], col: ROLE.good },
  ];
  nodes3d.forEach((n) => {
    view.add(
      ...wireframeSlab3d(n.pos, 0.4, 0.4, 0.4, {
        color: n.col,
        width: 2.4,
        glow: 8,
      }),
    );
  });

  for (let i = 0; i < nodes3d.length - 1; i++) {
    view.add(
      line3d(nodes3d[i].pos, nodes3d[i + 1].pos, {
        color: ROLE.grad,
        width: 3.0,
        glow: 8,
        blend: 'screen',
      }),
    );
  }

  view.add(
    points3d(
      () => {
        const st = stageVal.value;
        const p = phaseVal.value;
        const u = (p * 0.55) % 1;
        const dir = st > 0.5 ? 1 - u : u;
        const seg = dir * (nodes3d.length - 1);
        const idx = Math.min(nodes3d.length - 2, Math.floor(seg));
        const frac = seg - idx;
        const a = nodes3d[idx].pos;
        const b = nodes3d[idx + 1].pos;
        return [
          [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac, a[2] + (b[2] - a[2]) * frac],
        ];
      },
      { color: COSMOS.gold, size: 8, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

export function buildMeshGrid3d(modeVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.0,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.5],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.6, 2.6],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  const coords = [];
  for (let dp = 0; dp < 2; dp++) {
    for (let tp = 0; tp < 4; tp++) {
      const pos = [(tp - 1.5) * 1.35, (dp - 0.5) * 1.65, 0.45];
      coords.push({ dp, tp, pos });
      view.add(
        ...wireframeSlab3d(pos, 0.38, 0.38, 0.38, {
          color: dp === 0 ? ROLE.orig : ROLE.copy,
          width: 2.2,
          glow: 7,
        }),
      );
    }
  }

  for (let dp = 0; dp < 2; dp++) {
    for (let tp = 0; tp < 3; tp++) {
      view.add(
        line3d(coords[dp * 4 + tp].pos, coords[dp * 4 + tp + 1].pos, {
          color: ROLE.trans,
          width: 2.8,
          glow: 7,
          blend: 'screen',
        }),
      );
    }
  }
  for (let tp = 0; tp < 4; tp++) {
    view.add(
      line3d(coords[tp].pos, coords[4 + tp].pos, {
        color: ROLE.good,
        width: 2.8,
        glow: 7,
        blend: 'screen',
      }),
    );
  }

  view.add(
    points3d(
      () => {
        const m = modeVal.value;
        const p = phaseVal.value;
        const u = (p * 0.7) % 1;
        const a = coords[0].pos;
        const b = m >= 0.5 && m < 1.5 ? coords[4].pos : coords[3].pos;
        return [[a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 0.95]];
      },
      { color: COSMOS.gold, size: 8, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

export function buildScorePlane3d(tileVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 0.96,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  for (let h = 0; h < 2; h++) {
    const zOff = 0.4 + h * 1.15;
    view.add(
      ...wireframeSlab3d([0, 0, zOff], 1.75, 1.75, 0.08, {
        color: h === 0 ? ROLE.orig : ROLE.grad,
        width: 2.2,
        glow: 7,
      }),
    );
  }

  // Sliding FlashAttention SRAM tile cube on Head 0 plane
  view.add(
    ...wireframeSlab3d(
      () => {
        const u = (phaseVal.value * 0.55) % 1;
        const kx = -1.2 + u * 2.4;
        return [kx, tileVal.value > 0.5 ? 0.65 : 0, 0.52];
      },
      0.45,
      0.45,
      0.18,
      { color: ROLE.good, width: 3.0, glow: 10 },
    ),
  );

  return { view };
}
