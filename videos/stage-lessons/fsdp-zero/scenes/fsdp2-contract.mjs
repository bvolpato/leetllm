// Scene 11: Build the parameter ownership before the optimizer: FSDP2 bottom-up fully_shard -> DTensor -> optimizer -> reshard_after_forward -> DeviceMesh + TP.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
} from '../parts.mjs';

export default function fsdp2Contract(s, c) {
  const phase = s.value(0);
  const beatIdx = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#6ee7b716');
  const title = heroTitle(['Build Ownership', 'Before the Optimizer'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'PYTORCH FSDP2 · fully_shard & DTensor',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const bi = Math.round(beatIdx.value);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const steps = [
      { t: '1. fully_shard(blocks)', s: 'bottom-up DTensor hooks', x: -570, col: ROLE.weights },
      { t: '2. fully_shard(root)', s: 'remaining params wrapped', x: 0, col: ROLE.comm },
      { t: '3. Optimizer(params)', s: 'binds sharded identities', x: 570, col: ROLE.good },
    ];

    const nodes = [];
    steps.forEach((st, i) => {
      const hot = bi === 0;
      nodes.push(
        glassCell(st.x, -135, 480, 128, hot ? st.col : COSMOS.rule, {
          fill: hot ? '#10203a' : '#0c1322',
          glow: hot ? 9 * pulse : 3,
        }),
        txt(st.t, st.x, -162, 28, st.col, 'mono'),
        txt(st.s, st.x, -108, 26, COSMOS.ink, 'sans'),
      );
    });
    nodes.push(
      glowingArc([-326, -135], [-244, -135], -16, { color: ROLE.comm, width: 3.4, opacity: 0.9 }),
      glowingArc([244, -135], [326, -135], -16, { color: ROLE.good, width: 3.4, opacity: 0.9 }),
    );

    // Lower 3 architectural controls (Beat 1, 2, 3)
    const controls = [
      {
        title: 'reshard_after_forward',
        line1: 'True (blocks): free after fwd',
        line2: 'False (root) or int divisor',
        x: -570,
        col: ROLE.opt,
        on: bi === 1,
      },
      {
        title: 'MixedPrecision & Sync',
        line1: 'Separate param & reduce dtype',
        line2: 'No-sync keeps unsharded grads',
        x: 0,
        col: ROLE.grads,
        on: bi === 2,
      },
      {
        title: 'Compose & Compile',
        line1: 'DeviceMesh + TP + clip_grad',
        line2: 'Compile high-level train step',
        x: 570,
        col: ROLE.good,
        on: bi === 3,
      },
    ];
    controls.forEach((ct) => {
      nodes.push(
        glassCell(ct.x, 125, 510, 188, ct.on ? ct.col : COSMOS.dim, {
          fill: ct.on ? '#142038' : '#0b101d',
          glow: ct.on ? 11 * pulse : 2,
        }),
        txt(ct.title, ct.x, 66, 26, ct.on ? ct.col : COSMOS.muted, 'mono'),
        txt(ct.line1, ct.x, 124, 26, COSMOS.ink, 'sans'),
        txt(ct.line2, ct.x, 174, 26, COSMOS.muted, 'sans'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 295, { radius: 6, color: ROLE.comm }),
      txt(
        'Frozen base weights still require gathers for compute & input gradients',
        0,
        358,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  c.onBeat(1, () => s.play(beatIdx.to(1, { duration: 0.4 })));
  c.onBeat(2, () => s.play(beatIdx.to(2, { duration: 0.4 })));
  c.onBeat(3, () => s.play(beatIdx.to(3, { duration: 0.4 })));
}
