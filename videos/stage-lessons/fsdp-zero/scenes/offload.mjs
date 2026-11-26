// Scene 17: Follow the state through the memory hierarchy: FSDP2 CPU offload / ZeRO-Infinity, 4GB @ 20GB/s = 200ms, AutoTP vs PipelineModule.
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
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function offload(s, c) {
  const phase = s.value(0);
  const showCopy = s.value(0);
  const showAuto = s.value(0);
  const showPipe = s.value(0);
  const showLeaf = s.value(0);
  const showBucket = s.value(0);
  const showStep = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#ffd16618');
  const title = heroTitle(['Offload Through the', 'Memory Hierarchy'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.weights,
    eyebrow: 'CPU / NVME OFFLOAD & DEEPSPEED INTEGRATION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sc = showCopy.value;
    const sa = showAuto.value;
    const sp = showPipe.value;
    const sl = showLeaf.value;
    const sb = showBucket.value;
    const ss = showStep.value;

    const nodes = [
      // Top 3-tier hierarchy: GPU VRAM <-> Host RAM <-> NVMe Storage
      glassCell(-570, -135, 360, 124, ROLE.good, { fill: '#0d2624', glow: 8 }),
      txt('GPU VRAM', -570, -162, 26, ROLE.good, 'mono'),
      txt('Active compute unit', -570, -110, 26, COSMOS.ink, 'sans'),

      glassCell(0, -135, 380, 124, sc > 0.5 ? COSMOS.gold : ROLE.weights, {
        fill: '#10203a',
        glow: sc > 0.5 ? 10 : 6,
      }),
      txt('HOST RAM (FSDP2 / ZeRO)', 0, -162, 26, COSMOS.gold, 'mono'),
      txt(
        sc > 0.5 ? '4 GB @ 20 GB/s = 200 ms!' : 'CPU optimizer & shards',
        0,
        -110,
        26,
        sc > 0.5 ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),

      glassCell(570, -135, 360, 124, ROLE.grads, { fill: '#1d1435', glow: 6 }),
      txt('NVME (ZeRO-Infinity)', 570, -162, 26, ROLE.grads, 'mono'),
      txt('Large cold capacity', 570, -110, 26, COSMOS.ink, 'sans'),

      glowingArc([-386, -135], [-194, -135], -22, { color: COSMOS.gold, width: 3.6, opacity: 0.9 }),
      glowingArc([194, -135], [386, -135], -22, { color: ROLE.grads, width: 3.4, opacity: 0.8 }),

      // Bottom left: DeepSpeed ZeRO Stage support matrix
      glassCell(-430, 125, 740, 196, sa > 0.5 || sp > 0.5 ? ROLE.comm : COSMOS.dim, {
        fill: '#0e1b30',
        glow: sa > 0.5 ? 8 : 3,
      }),
      txt('DEEPSPEED ZERO STAGE COMPATIBILITY', -430, 62, 26, ROLE.comm, 'mono'),
      txt(
        'AutoTP:         ZeRO Stages 0, 1, 2, 3',
        -430,
        118,
        28,
        sa > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        'PipelineModule: ZeRO Stages 0, 1 only',
        -430,
        174,
        28,
        sp > 0.5 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),

      // Bottom right: Stage 3 operational rules
      glassCell(430, 125, 740, 196, sl > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: '#1b182a',
        glow: sl > 0.5 ? 8 : 3,
      }),
      txt('ZERO-3 OPERATIONAL RULES', 430, 62, 26, COSMOS.gold, 'mono'),
      txt(
        sl > 0.5
          ? 'MoE: mark common parent as leaf module'
          : 'All ranks gather modules in same order',
        430,
        118,
        26,
        sl > 0.5 ? ROLE.good : COSMOS.ink,
        'sans',
      ),
      txt(
        ss > 0.5
          ? 'Let DeepSpeed scale loss & step'
          : sb > 0.5
            ? 'Buckets in elements: 500M BF16 = 1 GB'
            : 'Overlap host transfer with GPU compute',
        430,
        174,
        26,
        sb > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),

      glowDot(-760 + ((p * 0.65) % 1) * 1520, 295, { radius: 6, color: COSMOS.gold }),
      txt(
        'Start host copy while GPU is busy; trace where compute finishes before bytes arrive',
        0,
        362,
        28,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('host-transfer', () =>
    s.play(showCopy.to(1, { duration: remainDuration(c, 'host-transfer', 0.45) })),
  );
  c.on('autotp-stages', () =>
    s.play(showAuto.to(1, { duration: remainDuration(c, 'autotp-stages', 0.4) })),
  );
  c.on('pipeline-stages', () =>
    s.play(showPipe.to(1, { duration: remainDuration(c, 'pipeline-stages', 0.4) })),
  );
  c.on('expert-parent', () =>
    s.play(showLeaf.to(1, { duration: remainDuration(c, 'expert-parent', 0.4) })),
  );
  c.on('bucket-bytes', () =>
    s.play(showBucket.to(1, { duration: remainDuration(c, 'bucket-bytes', 0.4) })),
  );
  c.on('managed-step', () =>
    s.play(showStep.to(1, { duration: remainDuration(c, 'managed-step', 0.4) })),
  );
}
