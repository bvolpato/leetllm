// Scene 17: serving-comparison: vLLM non-contiguous runtime KV blocks vs 2 Replicas (passes p95 TTFT <= 800ms!) vs 1 TP=2 worker.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function servingComparison(s, c) {
  const showCompare = s.value(0);
  const pickReplicas = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Two-GPU Serving:', '2 Replicas vs Tensor Parallel'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cmp = showCompare.value;
    const pk = pickReplicas.value;
    const barX = -420;
    const maxW = 860;
    const limX = barX + (800 / 1200) * maxW;

    const nodes = [
      txt(
        '1. RUNTIME BLOCK POOL (vLLM PAGED KV != OS VIRTUAL MEMORY PAGES)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('Logical Block 0 -> Slot 5', -580, -135, {
        w: 480,
        h: 68,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Logical Block 1 -> Slot 2', 0, -135, {
        w: 480,
        h: 68,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Logical Block 2 -> Slot 9', 580, -135, {
        w: 480,
        h: 68,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),

      txt(
        '2. MODEL FITS ON 1 GPU: COMPARE ON IDENTICAL REPLAY (p95 TTFT <= 800 ms)',
        -855,
        -15,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * cmp)),

      lumBar(limX - 2, 130, 4, 152, ROLE.gold, { opacity: alpha * (0.45 + 0.55 * cmp), glow: 8 }),
      txt('800 ms limit', limX, 24, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha * (0.45 + 0.55 * cmp),
      ),

      txt('2 Independent Replicas', -855, 80, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * cmp),
      ),
      lumBar(barX, 80, (620 / 1200) * maxW, 36, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * cmp),
        maxTrackW: maxW,
      }),
      txt(
        pk > 0.3 ? 'PASS (CHOOSE!)' : '<= 800 ms (OK)',
        barX + maxW + 24,
        80,
        28,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * cmp)),

      txt('1 Tensor-Parallel (TP=2)', -855, 175, 28, ROLE.work, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * cmp),
      ),
      lumBar(barX, 175, (980 / 1200) * maxW, 36, ROLE.work, {
        opacity: alpha * (0.45 + 0.55 * cmp),
        maxTrackW: maxW,
      }),
      txt('> 800 ms (MISS)', barX + maxW + 24, 175, 28, ROLE.work, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * cmp),
      ),

      txt(
        'Both beat throughput floor, but only 2 Replicas meet p95 TTFT <= 800 ms; also track queue wait & ITL',
        0,
        305,
        26,
        pk > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-serving-comparison-1-0', (d) => s.play(showCompare.to(1, { duration: d })));
  playCue(s, c, 'pl-serving-comparison-1-3', (d) => s.play(pickReplicas.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-serving-comparison-0-0',
    'pl-serving-comparison-0-1',
    'pl-serving-comparison-0-2',
    'pl-serving-comparison-1-1',
    'pl-serving-comparison-1-2',
  ]);
}
