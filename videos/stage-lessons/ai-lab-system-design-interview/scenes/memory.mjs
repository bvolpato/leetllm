// Scene 06: memory - Weights stay fixed while KV grows with requests
// Orbiting 3D memory slab comparison: fixed 16 GB BF16 weights vs MHA KV (17.2 GB, 32 heads)
// vs GQA KV (4.3 GB, 8 heads = 1/4 the KV cache!) for batch=16, seq=2048.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  MEM_BUDGET,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function memory(s, c) {
  const phase = s.value(0);
  const mhaOn = s.value(0);
  const gqaOn = s.value(0);

  const header = cinemaHeader('GPU MEMORY SIZING', 'Weights stay fixed;', 'KV grows with load', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(160, 20, 680, '#60a5fa1a', '#6ee7b71a');

  // Right-side orbiting 3D Memory Tower comparison (Weights 16GB | MHA KV 17.2GB | GQA KV 4.3GB)
  const view3d = cinematic3d({
    pos: [330, 35],
    size: [920, 740],
    fov: 38,
    distance: 7.4,
    azimuth: -0.58,
    elevation: 0.38,
    grid: true,
    gridColor: '#1b294a',
  });

  // Scale: 10 GB = 1.45 units height
  const hW = (MEM_BUDGET.weightsGb / 10) * 1.45; // 2.32
  const hMha = (MEM_BUDGET.mhaGb / 10) * 1.45; // 2.49
  const hGqa = (MEM_BUDGET.gqaGb / 10) * 1.45; // 0.62

  addBox3D(view3d, -2.15, -0.55, 0, 1.1, 1.1, hW, '#1e3a5f', ROLE.worker);
  addBox3D(view3d, -0.55, -0.55, 0, 1.1, 1.1, hMha, '#4a1829', ROLE.fail);
  addBox3D(view3d, 1.05, -0.55, 0, 1.1, 1.1, hGqa, '#103b2c', ROLE.ok);

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const mh = mhaOn.value;
      const gq = gqaOn.value;
      const nodes = [];

      const lx = -860;
      nodes.push(
        txt('FIXED SHAPE: 8B · 32L · d=128 · BF16', lx, -185, 26, ROLE.req, 'mono', 'left'),
        txt('BATCH = 16  ·  SEQ = 2,048 TOKENS', lx, -135, 26, COSMOS.muted, 'mono', 'left'),

        txt(
          `1. BF16 WEIGHTS: ${MEM_BUDGET.weightsGb.toFixed(1)} GB (FIXED)`,
          lx,
          -45,
          28,
          ROLE.worker,
          'mono',
          'left',
        ),
        txt('Shared once across all active callers', lx, 5, 26, COSMOS.muted, 'sans', 'left'),

        txt(
          `2. MHA KV (32 heads): ${MEM_BUDGET.mhaGb.toFixed(1)} GB`,
          lx,
          90,
          28,
          ROLE.fail,
          'mono',
          'left',
        ).opacity(0.45 + mh * 0.55),
        txt(
          'Exceeds model weights at just batch 16!',
          lx,
          140,
          26,
          ROLE.fail,
          'sans',
          'left',
        ).opacity(0.45 + mh * 0.55),

        txt(
          `3. GQA KV (8 heads): ${MEM_BUDGET.gqaGb.toFixed(1)} GB (1/4!)`,
          lx,
          225,
          28,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(gq > 0.4 ? 8 : 0, ROLE.ok)
          .opacity(0.4 + gq * 0.6),
        txt(
          'Leave extra headroom for activations & runtime',
          lx,
          280,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),

        txt(
          'BLUE: 16 GB WEIGHTS  ·  ROSE: 17.2 GB MHA  ·  GREEN: 4.3 GB GQA',
          330,
          415,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('4x FEWER KV HEADS = 4x SMALLER KV CACHE', 330, -405, 26, ROLE.ok, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view3d, overlay);
  orbitScene(s, c, view3d, { azimuthDelta: 0.34, elevationDelta: -0.05 });
  driftValue(s, c, phase, 4.2);

  c.on('memory-mha-comparison', () => {
    s.play(mhaOn.to(1, { duration: clampDur(c, c.cue('memory-mha-comparison').start, 0.35) }));
  });
  c.on('memory-quarter-heads', () => {
    s.play(gqaOn.to(1, { duration: clampDur(c, c.cue('memory-quarter-heads').start, 0.4) }));
  });
}
