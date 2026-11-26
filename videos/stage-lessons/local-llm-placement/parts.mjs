// Shared cinematic palette, verified invariants, and 3D VRAM placement manifold
// for the 25-scene Local LLM Deployment, Placement & VRAM Budgets stage film.
import { arrow, circle, dot, group, line, rect, seq, surface } from 'vizmatic/stage';
import { outputs, receipt, tests } from '../../films/local-llm-placement/fixtures.mjs';
import {
  admission,
  cache,
  evaluate,
  layerFlag,
  memory,
  place,
  prefillRequest,
  rates,
  releaseCases,
  replayRows,
  stream,
} from '../../films/local-llm-placement/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  admission,
  arrow,
  aura,
  cache,
  cinematic3d,
  circle,
  dot,
  evaluate,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  layerFlag,
  line,
  memory,
  orbitScene,
  outputs,
  place,
  prefillRequest,
  rates,
  receipt,
  rect,
  releaseCases,
  replayRows,
  seq,
  stream,
  surface,
  tests,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  vram: COSMOS.cyan,
  weights: COSMOS.blue,
  kv: COSMOS.violet,
  work: COSMOS.rose,
  ok: COSMOS.emerald,
  gold: COSMOS.gold,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const MEM_CAP_4 = memory(16384, true);
export const MEM_CAP_32K = memory(32768, true);
export const MEM_FULL_4 = memory(16384, false);
export const PLACE_16 = place(16);
export const PLACE_8 = place(8);
export const STREAM_DEV = stream(0);
export const STREAM_MIX = stream(1);
export const STREAM_DISK = stream(2);
export const RATES_OK = rates(receipt);
export const EVAL_BASE = evaluate(outputs.baseline);
export const EVAL_CAND = evaluate(outputs.candidate);
export const ADM_7 = admission(7);
export const ADM_8 = admission(8);
export const PREFILL_15 = prefillRequest(15);
export const PREFILL_6 = prefillRequest(6);
export const FLAG_40_24 = layerFlag(40, 24);

export function verifyLocalPlacementInvariants() {
  verifyApprox(MEM_CAP_4.total, 12.016, 0.01, '4 capped 16k logs total ~12.016 GB');
  verifyInvariant(MEM_CAP_4.fits === true, '4 capped 16k logs fit under 19.2 GB limit');
  verifyInvariant(MEM_FULL_4.fits === false && MEM_FULL_4.total > 32, 'uncapped 4 logs > 32 GB');
  verifyInvariant(
    PLACE_16.gpuBlocks === 32 && PLACE_8.gpuBlocks === 16,
    'place(16)=32, place(8)=16',
  );
  verifyApprox(STREAM_DEV.total * 1000, 15.2, 0.05, 'all-device read 15.2 ms');
  verifyApprox(STREAM_MIX.total * 1000, 91.2, 0.05, 'mixed read 91.2 ms');
  verifyApprox(RATES_OK.prefill, 2000, 1e-6, 'uncached prefill 2000 tok/s');
  verifyApprox(RATES_OK.output, 40, 1e-6, 'output rate 40 tok/s');
  verifyInvariant(EVAL_BASE.score === 3 && EVAL_CAND.score === 3, 'tied 3/4 release checks');
  verifyInvariant(ADM_7.fits === true && ADM_8.fits === false, '7 logs fit 16 GB, 8th exceeds');
  verifyInvariant(PREFILL_15.fits === false && PREFILL_6.fits === true, '15 GB OOM, 6 GB fits');
  verifyInvariant(
    FLAG_40_24.hiddenGpu === 23 && FLAG_40_24.outputGpu === true,
    'ngl=24 -> 23 hidden + output',
  );
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
      dur: 0.3,
    });
  });
}

export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

export function chipPill(
  label,
  x,
  y,
  { w = 180, h = 66, color = ROLE.vram, fill = '#10182d', size = 28, glow = 8, opacity = 1 } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: 2.6, radius: 12 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, COSMOS.ink, 'mono', 'center').opacity(opacity));
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
      glowDot(x0 + w, y, { radius: Math.min(7, height * 0.28), color, glow: glow + 2, opacity }),
    );
  }
  return group(...items);
}

/** Orbiting 3D VRAM footprint surface over (context length x concurrent logs), showing capped vs uncapped cliffs. */
export function buildVramManifold3d(uncappedVal, { x = 430, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit: 112,
    focus: [0, 0, 0.45],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const ctxFrac = (px + 2.5) / 5.0; // 0..1 -> 4K..32K
      const seqFrac = (py + 2.5) / 5.0; // 0..1 -> 1..8 logs
      const cappedGb = 9.6 + (0.6 + 0.5 * ctxFrac) * (1 + 7 * seqFrac) * 0.55;
      const uncappedGb = 9.6 + (0.6 + 5.2 * ctxFrac) * (1 + 7 * seqFrac) * 0.85;
      const gb = cappedGb * (1 - uncappedVal.value) + uncappedGb * uncappedVal.value;
      return Math.min(2.4, gb / 13.5);
    },
    {
      x: [-2.5, 2.5],
      y: [-2.5, 2.5],
      resolution: [22, 22],
      colors: ['#101c3a', '#1d4d7c', '#5ce1e6', '#ffd166', '#ff6b8b'],
      opacity: 0.88,
      mesh: '#7ce8ff',
      meshOpacity: 0.22,
      meshWidth: 0.75,
      animate: true,
    },
  );

  // 24 GB card ceiling slab (z = 24 / 13.5 = 1.78)
  const capCage = wireframeSlab3d([0, 0, 1.78], 2.5, 2.5, 0.04, {
    color: COSMOS.rose,
    width: 2.6,
    glow: 9,
  });

  view.add(surf, ...capCage);
  return view;
}
