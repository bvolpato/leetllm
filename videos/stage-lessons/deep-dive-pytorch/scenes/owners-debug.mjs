// Scene 26: Hold the input fixed while locating the first changed boundary (Full training step trace -> inference serving handoff -> failure-oriented debug loop).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ownersDebug(s, c) {
  const phase = s.value(0);
  const stage = s.value(0); // 0=training step owners, 1=inference & serving engines, 2=single-device -> distributed debug loop

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['Hold the Input Fixed;', 'Locate the First Drift'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.orig,
    eyebrow: 'END-TO-END OWNERSHIP · FAILURE DEBUG LOOP',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const p = phase.value;

    const nodes = [];
    if (st < 0.5) {
      nodes.push(
        txt('ONE TRANSFORMER TRAINING STEP (OWNERSHIP CHAIN)', 0, -225, 28, ROLE.orig, 'mono'),
      );
      const chain = [
        { k: '1. Data/Embed', d: 'Token IDs + layout', col: ROLE.orig, x: -640 },
        { k: '2. FSDP2 + SDPA', d: 'Gather + Attention', col: ROLE.copy, x: -215 },
        { k: '3. Autograd', d: 'Bwd + Reduce-Scatter', col: ROLE.grad, x: 215 },
        { k: '4. Opt + DCP', d: 'Shard step + save', col: ROLE.good, x: 640 },
      ];
      chain.forEach((ch, i) => {
        nodes.push(
          glassCell(ch.x, -45, 360, 210, ch.col, { fill: '#111b31', glow: 9 }),
          txt(ch.k, ch.x, -92, 28, ch.col, 'mono'),
          txt(ch.d, ch.x, -26, 26, COSMOS.ink, 'sans'),
        );
        if (i < chain.length - 1) {
          nodes.push(
            line([ch.x + 186, -45], [chain[i + 1].x - 186, -45], {
              stroke: COSMOS.gold,
              width: 3.0,
            }),
          );
        }
      });
    } else if (st < 1.5) {
      nodes.push(txt('SERVING OWNERSHIP SPLIT (INFERENCE)', 0, -225, 28, ROLE.copy, 'mono'));
      nodes.push(
        glassCell(-430, -45, 760, 250, ROLE.orig, { fill: '#0f1d36', glow: 9 }),
        txt('PYTORCH OWNS', -430, -125, 28, ROLE.orig, 'mono'),
        txt('Tensor operators & custom model blocks', -430, -58, 26, COSMOS.ink, 'sans'),
        txt('SDPA kernels · quantized modules · export', -430, -4, 26, COSMOS.ink, 'sans'),
        txt('No gradient tape in native inference', -430, 50, 26, ROLE.good, 'mono'),

        glassCell(430, -45, 760, 250, ROLE.compile, { fill: '#221a0f', glow: 9 }),
        txt('vLLM / SGLANG MAY OWN', 430, -125, 28, ROLE.compile, 'mono'),
        txt('HTTP API & continuous batching queues', 430, -58, 26, COSMOS.ink, 'sans'),
        txt('Paged KV-cache blocks & prefix sharing', 430, -4, 26, COSMOS.ink, 'sans'),
        txt('Token sampling & request scheduling', 430, 50, 26, COSMOS.gold, 'mono'),
      );
    } else {
      nodes.push(txt('FAILURE-ORIENTED DEBUGGING ORDER', 0, -225, 28, ROLE.good, 'mono'));
      const checks = [
        {
          k: '1. Single Device',
          d: 'Fix input, seed, dtype, strides & copy events',
          col: ROLE.orig,
          y: -125,
        },
        {
          k: '2. Eager vs Compile',
          d: 'Check SDPA path, guard logs & saved versions',
          col: ROLE.compile,
          y: 15,
        },
        {
          k: '3. Tiny World (2R)',
          d: 'Collective order -> peak VRAM -> crash drill',
          col: ROLE.good,
          y: 155,
        },
      ];
      checks.forEach((ck) => {
        nodes.push(
          glassCell(0, ck.y, 1380, 112, ck.col, { fill: '#111b31', glow: 8 }),
          txt(ck.k, -640, ck.y, 28, ck.col, 'mono', 'left'),
          txt(ck.d, -260, ck.y, 28, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 290, { radius: 6, color: st >= 1.5 ? ROLE.good : ROLE.orig }),
      txt(
        'Choose the FIRST changed receipt across boundaries rather than treating a logged metric as diagnosis',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-owners-debug-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-owners-debug-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-owners-debug-1', 0.45) })),
  );
  c.on('pt-owners-debug-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-owners-debug-2', 0.45) })),
  );
}
