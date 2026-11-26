// Scene 27: The frozen base still has a gathering peak: 3D 4-worker FSDP cluster all-gather -> block compute -> release + resume checklist.
import {
  COSMOS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function shardedTraining(s, c) {
  const phase = s.value(0);
  const showShards = s.value(0);
  const showOpt = s.value(0);
  const gatherPeak = s.value(0);
  const blockGran = s.value(0);
  const showResume = s.value(0);

  const bgAura = aura(320, 0, 560, '#60a5fa22', '#ffd16618');
  const title = heroTitle(['Sharded Base Still', 'Has a Gather Peak'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.blue,
    eyebrow: 'MULTI-GPU FSDP / DEEPSPEED TRAINING',
  });

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.0,
    unit: 82,
    focus: [0, 0, 0.3],
  }).at(430, -10);

  // 4 GPU worker shards arranged in a 2x2 ring at z = -1.4
  const coords = [
    [-2.0, -1.6],
    [0.6, -1.6],
    [-2.0, 0.5],
    [0.6, 0.5],
  ];
  const shardMeshes = coords.flatMap(([cx, cy]) =>
    box3d(cx, cy, -1.6, 1.4, 1.1, 0.85, '#19376e', COSMOS.blue, 0.72),
  );
  // Gathered full FSDP compute unit floating at z = +1.1
  const gatheredUnit = box3d(-1.5, -1.1, 1.05, 3.0, 2.2, 0.75, '#156c80', COSMOS.cyan, 0.76);
  // Adapter trainable state ring on top
  const adapterBar = box3d(-1.1, -0.5, 2.05, 2.2, 1.0, 0.32, '#a67b14', COSMOS.gold, 0.85);

  const gatherLines = coords.map(([cx, cy]) =>
    line3d([cx + 0.7, cy + 0.55, -0.75], [0, 0, 1.05], {
      color: COSMOS.cyan,
      width: 3.0,
      glow: 8,
      blend: 'screen',
      onTop: true,
    }),
  );

  const photons = points3d(
    () => {
      const ph = phase.value;
      const g = gatherPeak.value;
      const speed = g > 0.3 ? 0.75 : 0.35;
      return coords.map(([cx, cy], i) => {
        const u = (ph * speed + i * 0.25) % 1;
        return [(cx + 0.7) * (1 - u), (cy + 0.55) * (1 - u), -0.75 + u * 1.8];
      });
    },
    { color: COSMOS.cyan, radius: 6, glow: 12, blend: 'screen', onTop: true },
  );

  view3d.add(...shardMeshes, ...gatheredUnit, ...adapterBar, ...gatherLines, photons);

  const live = guardedDynamic(1, () => {
    const sh = showShards.value;
    const op = showOpt.value;
    const gp = gatherPeak.value;
    const bg = blockGran.value;
    const rs = showResume.value;

    const nodes = [
      txt('ALL-GATHERED FSDP BLOCK UNIT', 430, -395, 26, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
      txt('4 SHARDED FROZEN BASE WORKERS', 430, 425, 26, COSMOS.blue, 'mono'),

      glassCell(-525, -155, 650, 128, sh > 0.2 ? COSMOS.rose : COSMOS.blue, {
        fill: '#181428',
        glow: 7,
      }),
      txt('AVOID device_map="auto" FOR TRAIN', -825, -188, 26, COSMOS.rose, 'mono', 'left'),
      txt('Use FSDP or DeepSpeed for adapters', -825, -132, 26, COSMOS.ink, 'sans', 'left'),

      glassCell(-525, 5, 650, 148, gp > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#101d35',
        glow: gp > 0.2 ? 10 : 4,
      }),
      txt('FSDP GATHER & PEAK CONTRACT', -825, -38, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        bg > 0.3
          ? 'Block wrapping limits gathered size'
          : op > 0.2
            ? 'Optimizer owns requires_grad only'
            : 'Frozen base gathers per compute unit',
        -825,
        16,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('Peak = gathered + act + adapter + temps', -825, 54, 26, COSMOS.muted, 'mono', 'left'),

      glassCell(-525, 218, 650, 224, rs > 0.2 ? COSMOS.emerald : '#334268', {
        fill: rs > 0.2 ? '#0e2528' : '#11182c',
        glow: rs > 0.2 ? 10 : 3,
      }),
      txt('RESUME TRAINING CHECKLIST', -825, 146, 26, COSMOS.emerald, 'mono', 'left'),
      glowDot(-812, 198, { radius: 5, color: COSMOS.blue }),
      txt('Base rev, tokenizer, targets, quant', -785, 198, 26, COSMOS.ink, 'sans', 'left'),
      glowDot(-812, 246, { radius: 5, color: COSMOS.gold }),
      txt('Adapter, optimizer, LR schedule', -785, 246, 26, COSMOS.ink, 'sans', 'left'),
      glowDot(-812, 294, { radius: 5, color: COSMOS.cyan }),
      txt('RNG state + training data offset', -785, 294, 26, COSMOS.ink, 'sans', 'left'),
    ];
    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  c.on('sharded-training-1', () => s.play(showShards.to(1, { duration: 0.4 })));
  c.on('sharded-training-2', () => s.play(showOpt.to(1, { duration: 0.4 })));
  c.on('sharded-gather', () => s.play(gatherPeak.to(1, { duration: 0.5 })));
  c.on('sharded-block', () => s.play(blockGran.to(1, { duration: 0.45 })));
  c.on('sharded-training-3', () =>
    s.play(showResume.to(1, { duration: remainDuration(c, 'sharded-training-3', 0.45) })),
  );
}
